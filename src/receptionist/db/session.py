"""Async engine and scoped sessions."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from receptionist.db import tenancy  # noqa: F401  (registers isolation listeners)
from receptionist.db.tenancy import SCOPE_KEY, TENANT_KEY


def _sqlite_pragmas(dbapi_conn, _record) -> None:  # type: ignore[no-untyped-def]
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA busy_timeout=5000")
    cur.close()


class Database:
    def __init__(self, url: str, *, echo: bool = False) -> None:
        self.url = url
        self.engine: AsyncEngine = create_async_engine(url, echo=echo)
        if self.engine.dialect.name == "sqlite":
            event.listen(self.engine.sync_engine, "connect", _sqlite_pragmas)
        self._factory = async_sessionmaker(self.engine, expire_on_commit=False)

    @asynccontextmanager
    async def tenant_session(self, tenant_id: str) -> AsyncIterator[AsyncSession]:
        if not tenant_id:
            raise ValueError("tenant_id is required")
        async with self._factory() as session:
            session.sync_session.info.update({SCOPE_KEY: "tenant", TENANT_KEY: tenant_id})
            yield session

    @asynccontextmanager
    async def system_session(self) -> AsyncIterator[AsyncSession]:
        async with self._factory() as session:
            session.sync_session.info[SCOPE_KEY] = "system"
            yield session

    @asynccontextmanager
    async def unscoped_session(self) -> AsyncIterator[AsyncSession]:
        """For tests and diagnostics only. Tenant-owned tables are unreachable from it."""
        async with self._factory() as session:
            yield session

    async def ping(self) -> None:
        async with self.engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    async def dispose(self) -> None:
        await self.engine.dispose()
