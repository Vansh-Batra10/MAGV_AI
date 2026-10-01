"""Templated hold lines spoken before external-API tools (DESIGN.md 7.4, change 3)."""

from __future__ import annotations

import random

from receptionist.engine.locales import Locale

EXTERNAL_TOOLS = frozenset({"check_availability", "create_booking", "cancel_booking"})


def pick_filler(
    locale: Locale, tool: str, *, seed: str, last_used: str | None, second_in_turn: bool
) -> str:
    """Deterministic for a given seed; never repeats the previous filler back to back."""
    if second_in_turn:
        return locale.t("fillers.second")
    options = locale.choices(f"fillers.{tool}")
    fresh = [o for o in options if o != last_used] or options
    return random.Random(seed).choice(fresh)  # noqa: S311 (not security-sensitive)
