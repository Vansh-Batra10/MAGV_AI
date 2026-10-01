"""Declarative base, portable column types and the tenant-ownership marker."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, MetaData, String
from sqlalchemy.engine import Dialect
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column
from sqlalchemy.types import TypeDecorator

from receptionist.clock import real_utc_now

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class UTCDateTime(TypeDecorator[datetime]):
    """Timezone-aware UTC datetimes on every backend.

    Postgres stores `timestamptz`. SQLite has no timezone support, so values are stored as
    naive UTC and re-tagged as UTC on the way out. Naive values are rejected on write.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("naive datetime rejected: store aware UTC datetimes only")
        value = value.astimezone(UTC)
        if dialect.name == "sqlite":
            return value.replace(tzinfo=None)
        return value

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


def new_id() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class TimestampMixin:
    """Infrastructure timestamps: always real time, never the demo clock."""

    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=real_utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=real_utc_now, onupdate=real_utc_now
    )


class TenantOwned:
    """Marker mixin: rows belong to one tenant and are only reachable through a tenant scope.

    See receptionist.db.tenancy for enforcement.
    """

    @declared_attr
    def tenant_id(cls) -> Mapped[str]:
        return mapped_column(String(64), ForeignKey("tenants.id"), nullable=False)


def uuid_pk() -> Mapped[str]:
    return mapped_column(String(36), primary_key=True, default=new_id)
