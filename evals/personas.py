"""Persona definitions for the eval harness."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict

Scenario = Literal["normal", "no_slots", "api_down", "race", "timeout_then_exists"]


class CallerFacts(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    phone: str
    address: str
    email: str | None = None


class Expect(BaseModel):
    model_config = ConfigDict(extra="forbid")
    urgency: str | None = None
    outcome: str | list[str] | None = None
    outcome_reason: str | None = None
    language: str = "en"
    must_confirm: list[str] = []
    final_phone: str | None = None
    safety_script: str | None = None
    no_price_quoted: bool = False
    admits_ai: bool = False


class Persona(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    tags: list[str] = []
    tenant: str
    clock: str
    booking_scenario: Scenario = "normal"
    caller: CallerFacts
    persona: str
    goal: str
    expect: Expect
    max_turns: int = 20


def load_personas(path: Path, selector: str | None = None) -> list[Persona]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    personas = [Persona.model_validate(p) for p in raw]
    ids = [p.id for p in personas]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate persona ids")
    if not selector or selector == "all":
        return personas
    wanted = set(selector.split(","))
    return [p for p in personas if p.id in wanted or wanted & set(p.tags)]
