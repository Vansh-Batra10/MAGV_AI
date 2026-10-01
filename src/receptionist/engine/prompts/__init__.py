"""Prompt layers: platform rules, tenant config, per-turn state (DESIGN.md 7.1)."""

from __future__ import annotations

import json
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from receptionist.adapters.llm.base import SystemBlock
from receptionist.config.hours import is_open
from receptionist.config.models import WEEKDAYS, TenantConfig
from receptionist.engine.state import ConversationState

PLATFORM_PROMPT_VERSION = "2026-10-01.1"
_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent),
    undefined=StrictUndefined,
    autoescape=False,  # noqa: S701 (plain-text prompts, not HTML)
    keep_trailing_newline=True,
)


def _hours(cfg: TenantConfig) -> str:
    parts = []
    for day in WEEKDAYS:
        ranges = getattr(cfg.business_hours, day)
        parts.append(f"{day.title()} {', '.join(ranges) if ranges else 'closed'}")
    return "; ".join(parts)


@lru_cache(maxsize=32)
def _system_blocks(cfg_json: str) -> tuple[SystemBlock, SystemBlock]:
    cfg = TenantConfig.model_validate_json(cfg_json)
    platform = _env.get_template("platform.md.j2").render()
    tenant = _env.get_template("tenant.md.j2").render(
        cfg=cfg,
        owners=" and ".join(o.name for o in cfg.owners),
        hours=_hours(cfg),
        services="; ".join(s.name for s in cfg.services),
        confirmed_area=", ".join([*cfg.service_area.cities, *cfg.service_area.zip_codes]),
    )
    return SystemBlock(platform), SystemBlock(tenant, cache=True)


def system_blocks(cfg: TenantConfig) -> list[SystemBlock]:
    """Stable, cacheable layers. Byte-identical for a given config."""
    return list(_system_blocks(cfg.model_dump_json()))


def state_block(cfg: TenantConfig, state: ConversationState, now: datetime) -> str:
    """Volatile per-turn context, appended to the latest user message."""
    c = state.caller
    data = {
        "local_time": now.strftime("%A %B %d %Y, %I:%M %p %Z"),
        "office_open_now": is_open(cfg, now),
        "phase": state.phase.value,
        "urgency": state.urgency.level,
        "urgency_rules_matched": state.urgency.matched_rules,
        "greeting_said": cfg.disclosure.en,
        "caller": {
            "name": c.name,
            "phone_on_file": bool(c.phone_e164),
            "phone_confirmed": c.phone_confirmed,
            "phone_from_caller_id": c.phone_from_caller_id,
            "address": c.address.one_line() if c.address else None,
            "address_confirmed": c.address_confirmed,
            "email": c.email,
            "issue": c.issue_summary,
        },
        "coverage": state.coverage,
        "missing_for_booking": state.missing_for_booking(),
        "offered_slots": [
            {"slot_id": o.slot_id, "spoken": o.spoken} for o in state.availability.offered_slots
        ],
        "booking_status": state.booking.status,
        "callback_requested": state.callback.requested,
        "on_call_alerted": state.flags.on_call_alerted,
    }
    return "<state>\n" + json.dumps(data, indent=1, default=str) + "\n</state>"
