"""FastAPI application factory."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from sqlalchemy import inspect

from receptionist import __version__
from receptionist.api import health
from receptionist.clock import Clock, DemoClock, build_clock
from receptionist.config import TenantRegistry, load_tenants
from receptionist.db import Database
from receptionist.db.tenant_sync import sync_tenants
from receptionist.logging import configure_logging, get_logger
from receptionist.settings import Settings, get_settings

log = get_logger(__name__)


class StartupError(RuntimeError):
    pass


def _build_clock(settings: Settings, tenants: TenantRegistry) -> Clock:
    clock = build_clock(
        app_env=settings.app_env, demo_now=settings.demo_now, mode=settings.demo_clock_mode
    )
    if isinstance(clock, DemoClock):
        for loaded in tenants.values():
            clock.validate_for(loaded.config.tz)  # rejects DST gaps/folds per tenant
        structlog.contextvars.bind_contextvars(demo_clock=True)
    return clock


async def _require_schema(db: Database) -> None:
    async with db.engine.connect() as conn:
        tables = await conn.run_sync(lambda c: set(inspect(c).get_table_names()))
    if "tenants" not in tables:
        raise StartupError("Database schema missing. Run `make migrate` first.")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(
        level=settings.log_level,
        fmt=settings.log_format,
        hash_salt=settings.log_hash_salt.get_secret_value(),
    )
    # Fail fast, before serving anything: invalid tenant config or clock means no boot.
    tenants = load_tenants(settings.tenants_dir)
    clock = _build_clock(settings, tenants)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        db = Database(settings.database_url)
        await _require_schema(db)
        await sync_tenants(db, tenants)
        app.state.db = db
        for client_id, todos in tenants.all_todos().items():
            log.warning("tenant_config_todos", tenant_id=client_id, todos=todos)
        log.info(
            "startup_complete",
            app_env=settings.app_env,
            version=__version__,
            tenants=list(tenants),
            clock_source=clock.source,
        )
        try:
            yield
        finally:
            await db.dispose()

    app = FastAPI(title="AI Receptionist", version=__version__, lifespan=lifespan)
    app.state.settings = settings
    app.state.tenants = tenants
    app.state.clock = clock

    @app.middleware("http")
    async def request_context(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        with structlog.contextvars.bound_contextvars(request_id=request_id):
            response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response

    app.include_router(health.router)
    return app
