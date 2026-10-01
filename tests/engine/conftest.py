from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass

import pytest

from receptionist.adapters.llm.scripted import ScriptedLLM
from receptionist.booking.fake import FakeBookingProvider
from receptionist.booking.registry import BookingProviders
from receptionist.clock import DemoClock
from receptionist.config import load_tenants
from receptionist.db import Database
from receptionist.db.tenant_sync import sync_tenants
from receptionist.engine.engine import Engine, EngineEvent, TextChunk, TurnInput
from tests.conftest import JOLLY, ROOT, TENANTS_DIR, make_settings

SATURDAY = "2026-10-03T14:10"  # Saturday 2:10 PM local, hot season


@dataclass
class Harness:
    engine: Engine
    llm: ScriptedLLM
    provider: FakeBookingProvider
    db: Database
    client_id: str = JOLLY

    async def start(self, caller_id: str | None = None, channel: str = "text") -> str:
        res = await self.engine.start_conversation(
            self.client_id,
            channel=channel,
            caller_id_phone=caller_id,  # type: ignore[arg-type]
        )
        self.greeting = res.greeting
        return res.conversation_id

    async def turn(self, conversation_id: str, text: str) -> list[EngineEvent]:
        return [
            e async for e in self.engine.run_turn(self.client_id, conversation_id, TurnInput(text))
        ]


def spoken(events: list[EngineEvent]) -> str:
    return " ".join(e.text for e in events if isinstance(e, TextChunk))


@pytest.fixture
def make_harness(db_url: str):  # type: ignore[no-untyped-def]
    created: list[Database] = []

    async def _make(
        scenario: str = "normal", demo_now: str = SATURDAY, steps=None, llm=True
    ) -> Harness:  # type: ignore[no-untyped-def]
        settings = make_settings(
            app_env="demo",
            database_url=db_url,
            demo_now=demo_now,
            demo_clock_mode="frozen",
            locales_dir=ROOT / "locales",
        )
        tenants = load_tenants(TENANTS_DIR)
        db = Database(db_url)
        created.append(db)
        await sync_tenants(db, tenants)
        clock = DemoClock(demo_now, app_env="demo", mode="frozen")
        provider = FakeBookingProvider(tenants[JOLLY].config, scenario)  # type: ignore[arg-type]
        scripted = ScriptedLLM(steps or [], model="claude-haiku-4-5")
        engine = Engine(
            settings=settings,
            tenants=tenants,
            clock=clock,
            db=db,
            llm=scripted if llm else None,
            bookings=BookingProviders(tenants, {JOLLY: provider}),
        )
        return Harness(engine, scripted, provider, db)

    yield _make


@pytest.fixture
async def harness(make_harness) -> AsyncIterator[Harness]:  # type: ignore[no-untyped-def]
    h = await make_harness()
    yield h
    await h.db.dispose()
