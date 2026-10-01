from datetime import UTC, datetime, timedelta

import pytest

from receptionist.adapters.llm.base import (
    LLMError,
    LLMRequest,
    Stop,
    TextDelta,
    ToolUse,
    ToolUseStart,
)
from receptionist.adapters.llm.scripted import ScriptedLLM, ScriptExhausted, ScriptStep, call, say
from receptionist.booking.base import (
    BookingOutcomeUnknown,
    BookingProviderError,
    BookingRequest,
    SlotQuery,
)
from receptionist.booking.breaker import CircuitBreaker
from receptionist.booking.fake import FakeBookingProvider
from receptionist.config.loader import LoadedTenant

SAT = datetime(2026, 10, 3, 19, 10, tzinfo=UTC)  # Saturday 2:10 PM CDT


def query(tenant: LoadedTenant, days: int = 3) -> SlotQuery:
    cfg = tenant.config
    return SlotQuery(SAT, SAT + timedelta(days=days), cfg.tz, cfg.booking.slot_length_min)


def request(slot, key: str = "k1") -> BookingRequest:  # type: ignore[no-untyped-def]
    return BookingRequest(
        key, slot, "Pat", "+15125550198", None, "America/Chicago", "2104 Oak St", "AC dead"
    )


async def test_fake_slots_follow_business_hours(jolly: LoadedTenant) -> None:
    slots = await FakeBookingProvider(jolly.config).available_slots(query(jolly, days=2))
    local = [s.start_utc.astimezone(jolly.config.tz) for s in slots]
    assert {d.strftime("%a") for d in local} == {"Mon"}  # Sat/Sun closed; window ends Mon 14:10
    assert [d.hour for d in local] == [8, 10, 12, 14]  # 120-minute slots, 08:00-17:00
    assert all(s.start_utc.tzinfo is not None for s in slots)


async def test_fake_booking_and_lookup(jolly: LoadedTenant) -> None:
    p = FakeBookingProvider(jolly.config)
    slot = (await p.available_slots(query(jolly)))[0]
    res = await p.create_booking(request(slot))
    assert res.status == "success" and res.provider_uid
    assert slot not in await p.available_slots(query(jolly))
    again = await p.create_booking(request(slot, "k2"))
    assert again.status == "slot_unavailable"
    found = await p.find_by_idempotency_key("k1", SAT, SAT + timedelta(days=3))
    assert found and found.provider_uid == res.provider_uid
    assert (await p.cancel_booking(res.provider_uid, "test")).ok


async def test_fake_scenarios(jolly: LoadedTenant) -> None:
    assert await FakeBookingProvider(jolly.config, "no_slots").available_slots(query(jolly)) == []
    with pytest.raises(BookingProviderError):
        await FakeBookingProvider(jolly.config, "api_down").available_slots(query(jolly))
    race = FakeBookingProvider(jolly.config, "race")
    slot = (await race.available_slots(query(jolly)))[0]
    assert (await race.create_booking(request(slot))).status == "slot_unavailable"
    assert slot not in await race.available_slots(query(jolly))
    flaky = FakeBookingProvider(jolly.config, "timeout_then_exists")
    slot = (await flaky.available_slots(query(jolly)))[0]
    with pytest.raises(BookingOutcomeUnknown):
        await flaky.create_booking(request(slot))
    assert await flaky.find_by_idempotency_key("k1", SAT, SAT + timedelta(days=3))


def test_breaker_opens_and_half_opens() -> None:
    t = [0.0]
    b = CircuitBreaker(failure_threshold=3, window_s=60, reset_after_s=120, monotonic=lambda: t[0])
    for _ in range(2):
        b.record_failure()
    assert not b.is_open
    b.record_failure()
    assert b.is_open
    t[0] += 121
    assert not b.is_open
    b.record_success()
    assert not b.is_open


def _req() -> LLMRequest:
    return LLMRequest(purpose="live_turn", system=[], messages=[])


async def test_scripted_llm_streams_text_then_tools() -> None:
    llm = ScriptedLLM(
        [ScriptStep(text="One sec.", tool_calls=[("check_availability", {})]), say("Hi")]
    )
    events = [e async for e in llm.stream(_req())]
    kinds = [type(e).__name__ for e in events]
    assert kinds.index("ToolUseStart") < kinds.index("ToolUse") < kinds.index("Stop")
    assert "".join(e.text for e in events if isinstance(e, TextDelta)).strip() == "One sec."
    stop = events[-1]
    assert isinstance(stop, Stop) and stop.reason == "tool_use"
    assert [b["type"] for b in stop.content] == ["text", "tool_use"]
    assert any(isinstance(e, ToolUseStart) for e in events) and any(
        isinstance(e, ToolUse) for e in events
    )
    assert llm.remaining == 1


async def test_scripted_llm_errors_and_exhaustion() -> None:
    llm = ScriptedLLM(
        [
            ScriptStep(error=LLMError("boom", retryable=True)),
            call("end_conversation", reason="done"),
        ]
    )
    with pytest.raises(LLMError):
        [e async for e in llm.stream(_req())]
    [e async for e in llm.stream(_req())]
    with pytest.raises(ScriptExhausted):
        [e async for e in llm.stream(_req())]
