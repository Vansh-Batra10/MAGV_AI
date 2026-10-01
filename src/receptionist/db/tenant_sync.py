"""Mirror tenant JSON configs into the `tenants` table so tenant-owned rows have an FK anchor."""

from __future__ import annotations

from sqlalchemy import select

from receptionist.config import TenantRegistry
from receptionist.db.models import Tenant
from receptionist.db.session import Database


async def sync_tenants(db: Database, registry: TenantRegistry) -> None:
    async with db.system_session() as session:
        existing = {t.id: t for t in (await session.scalars(select(Tenant))).all()}
        for client_id, loaded in registry.items():
            cfg = loaded.config
            row = existing.get(client_id)
            if row is None:
                session.add(
                    Tenant(
                        id=client_id,
                        name=cfg.business.name,
                        timezone=cfg.timezone,
                        config_hash=loaded.config_hash,
                        config_json=loaded.raw,
                    )
                )
            elif row.config_hash != loaded.config_hash:
                row.name = cfg.business.name
                row.timezone = cfg.timezone
                row.config_hash = loaded.config_hash
                row.config_json = loaded.raw
        await session.commit()
