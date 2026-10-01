from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from receptionist import __version__
from receptionist.config.hours import is_open
from receptionist.logging import get_logger

router = APIRouter()
log = get_logger(__name__)


@router.get("/healthz")
async def healthz(request: Request) -> JSONResponse:
    state = request.app.state
    db_ok = True
    try:
        await state.db.ping()
    except Exception:  # health must report, not raise
        log.exception("health_db_check_failed")
        db_ok = False

    tenants: list[dict[str, Any]] = []
    for client_id, loaded in state.tenants.items():
        cfg = loaded.config
        now_local = state.clock.now(cfg.tz)
        tenants.append(
            {
                "client_id": client_id,
                "name": cfg.business.name,
                "timezone": cfg.timezone,
                "config_hash": loaded.config_hash,
                "local_now": now_local.isoformat(timespec="seconds"),
                "open_now": is_open(cfg, now_local),
                "todos": len(cfg.todos),
            }
        )

    body = {
        "status": "ok" if db_ok else "degraded",
        "version": __version__,
        "app_env": state.settings.app_env,
        "db": "ok" if db_ok else "error",
        "clock": {"source": state.clock.source},
        "tenants": tenants,
    }
    return JSONResponse(body, status_code=200 if db_ok else 503)
