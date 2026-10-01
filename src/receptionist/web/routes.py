"""Minimal web chat page for testing the text channel (DESIGN.md 2.3)."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from receptionist.config.hours import is_open

router = APIRouter()
templates = Jinja2Templates(directory=Path(__file__).parent / "templates")


@router.get("/chat/{client_id}", response_class=HTMLResponse)
async def chat_page(client_id: str, request: Request) -> HTMLResponse:
    state = request.app.state
    if client_id not in state.tenants:
        raise HTTPException(404, "unknown client_id")
    cfg = state.tenants[client_id].config
    now = state.clock.now(cfg.tz)
    prefix = "Demo clock: " if state.clock.source == "demo" else ""
    label = (
        f"{prefix}{now:%a %b %d, %I:%M %p %Z} · office {'open' if is_open(cfg, now) else 'closed'}"
    )
    return templates.TemplateResponse(
        request,
        "chat.html",
        {
            "client_id": client_id,
            "business": cfg.business.name,
            "demo_banner": cfg.demo.banner if cfg.demo.enabled else None,
            "clock_label": label,
            "debug": state.settings.app_env != "production",
        },
    )
