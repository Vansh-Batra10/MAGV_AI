"""Tenant isolation, enforced at the data-access layer (DESIGN.md section 4).

Every ORM session carries a scope in `session.info`:
  - {"scope": "tenant", "tenant_id": "<id>"}: every SELECT/UPDATE/DELETE on a TenantOwned
    entity is filtered to that tenant, and rows from any other tenant cannot be inserted or
    modified (checked at flush).
  - {"scope": "system"}: infrastructure code (job worker, webhook ingestion, tenant sync)
    that legitimately crosses tenants. Must be requested explicitly.
A session with no scope that touches a TenantOwned entity raises TenantScopeError.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import event
from sqlalchemy.orm import ORMExecuteState, Session, with_loader_criteria

from receptionist.db.base import TenantOwned

SCOPE_KEY = "scope"
TENANT_KEY = "tenant_id"


class TenantScopeError(RuntimeError):
    pass


def _touches_tenant_owned(state: ORMExecuteState) -> bool:
    return any(issubclass(m.class_, TenantOwned) for m in state.all_mappers)


@event.listens_for(Session, "do_orm_execute")
def _apply_tenant_criteria(state: ORMExecuteState) -> None:
    if not (state.is_select or state.is_update or state.is_delete):
        return
    scope = state.session.info.get(SCOPE_KEY)
    if scope == "system":
        return
    if scope == "tenant":
        tenant_id = state.session.info[TENANT_KEY]
        state.statement = state.statement.options(
            with_loader_criteria(
                TenantOwned,
                lambda cls: cls.tenant_id == tenant_id,
                include_aliases=True,
            )
        )
        return
    if _touches_tenant_owned(state):
        raise TenantScopeError(
            "Query on a tenant-owned table from an unscoped session. "
            "Use Database.tenant_session(tenant_id) or Database.system_session()."
        )


@event.listens_for(Session, "before_flush")
def _check_tenant_writes(session: Session, flush_context: Any, instances: Any) -> None:
    scope = session.info.get(SCOPE_KEY)
    if scope == "system":
        return
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if not isinstance(obj, TenantOwned):
            continue
        if scope != "tenant":
            raise TenantScopeError("Write to a tenant-owned table from an unscoped session.")
        tenant_id = session.info[TENANT_KEY]
        if obj in session.new and obj.tenant_id is None:
            obj.tenant_id = tenant_id
        if obj.tenant_id != tenant_id:
            raise TenantScopeError(
                f"{type(obj).__name__} belongs to tenant {obj.tenant_id!r}, "
                f"not the session's tenant {tenant_id!r}."
            )
