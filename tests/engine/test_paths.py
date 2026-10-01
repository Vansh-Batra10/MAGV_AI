"""Failure modes and special paths (DESIGN.md sections 3.6-3.8, 10)."""

from typing import Any

import pytest
from sqlalchemy import select

from receptionist.adapters.llm.base import LLMError
from receptionist.adapters.llm.scripted import ScriptStep, call, say
from receptionist.db.models import Alert, Booking, CallbackRequest, Conversation, ToolCall
from receptionist.engine.engine import EndConversation, TextChunk, ToolEvent
from tests.conftest import JOLLY
from tests.engine.conftest import Harness, spoken

MONDAY_8AM = "20261005T1300Z"
MONDAY_10AM = "20261005T1500Z"


def collect_and_confirm(city: str = "Round Rock", zip_code: str = "78664") -> list[Any]:
    """Steps for turns 1-2: details recorded, then confirmed (no availability yet)."""
    return [
        call(
            "record_caller_details",
            name="Pat Jones",
            phone="5125550198",
            address={"line": "2104 Oak St", "city": city, "zip": zip_code},
            issue_summary="AC not cooling",
        ),
        say(
            "I have five one two, five five five, zero one nine eight, at twenty-one oh four "
            "Oak Street. Is that right?"
        ),
        call("record_caller_details", confirm=["phone", "address"]),
    ]


async def run(h: Harness, cid: str, *texts: str) -> list[Any]:
    events: list[Any] = []
    for t in texts:
        events = await h.turn(cid, t)
    return events


async def conv_row(h: Harness, cid: str) -> Conversation:
    async with h.db.tenant_session(JOLLY) as s:
        row = await s.get(Conversation, cid)
    assert row is not None
    return row


async def tool_rows(h: Harness) -> list[ToolCall]:
    async with h.db.tenant_session(JOLLY) as s:
        return list((await s.scalars(select(ToolCall).order_by(ToolCall.created_at))).all())


# --- safety -----------------------------------------------------------------------------


async def test_gas_smell_safety_script_first_and_engine_alerts(harness: Harness) -> None:
    h = harness
    h.llm.extend([say("Once you're outside and safe, can I get your name and number?")])
    cid = await h.start()
    events = await h.turn(cid, "I smell gas in my kitchen")
    chunks = [e for e in events if isinstance(e, TextChunk)]
    script = h.engine.tenants[JOLLY].config.emergency_rules[0].safety_script
    assert script is not None
    assert chunks[0].source == "system" and chunks[0].text == script.en  # verbatim, first
    assert [e.name for e in events if isinstance(e, ToolEvent)] == ["alert_on_call"]
    # The LLM saw that the safety script was already spoken.
    last_user = h.llm.requests[0].messages[-1]["content"][0]["text"]
    assert "<system_spoke>" in last_user and script.en in last_user
    async with h.db.tenant_session(JOLLY) as s:
        alerts = (await s.scalars(select(Alert))).all()
    assert {a.channel for a in alerts} == {"email", "sms_simulated"}
    assert (await conv_row(h, cid)).outcome == "emergency_escalated"


async def test_vulnerable_person_in_hot_season_is_emergency(harness: Harness) -> None:
    h = harness
    h.llm.extend([say("I'm so sorry. I've alerted our on-call technician. What's your name?")])
    cid = await h.start()
    await h.turn(cid, "AC is dead and my mom is home, she's 82")
    row = await conv_row(h, cid)
    assert row.urgency == "emergency" and row.outcome == "emergency_escalated"


async def test_same_words_in_december_are_urgent(make_harness) -> None:  # type: ignore[no-untyped-def]
    h = await make_harness(demo_now="2026-12-05T14:10")
    h.llm.extend([say("Oh no. Let's get someone out. What's your name?")])
    cid = await h.start()
    await h.turn(cid, "AC is dead and my mom is home, she's 82")
    row = await conv_row(h, cid)
    assert row.urgency == "urgent" and row.outcome == "info_only"
    await h.db.dispose()


# --- Spanish -------------------------------------------------------------------------------


async def test_spanish_caller_gets_templated_callback(harness: Harness) -> None:
    h = harness
    cid = await h.start()
    t1 = await h.turn(cid, "Hola, mi aire acondicionado no funciona")
    assert "solo atiende en inglés" in spoken(t1) and "¿A qué número" in spoken(t1)
    t2 = await h.turn(cid, "Es el 512 555 0198")
    assert "cinco uno dos" in spoken(t2)
    t3 = await h.turn(cid, "Sí, correcto")
    assert any(isinstance(e, EndConversation) for e in t3)
    assert h.llm.requests == []  # no LLM involved
    row = await conv_row(h, cid)
    assert (row.language, row.outcome, row.status) == ("es", "callback", "ended")
    async with h.db.tenant_session(JOLLY) as s:
        cb = (await s.scalars(select(CallbackRequest))).one()
    assert (cb.reason, cb.language, cb.phone_e164, cb.phone_confirmed) == (
        "language_es",
        "es",
        "+15125550198",
        True,
    )


async def test_spanish_caller_with_caller_id_confirms_it(harness: Harness) -> None:
    h = harness
    cid = await h.start(caller_id="+15125550198", channel="voice")
    t1 = await h.turn(cid, "Buenas tardes, necesito un técnico")
    assert "termina en cero uno nueve ocho" in spoken(t1)
    t2 = await h.turn(cid, "sí")
    assert any(isinstance(e, EndConversation) for e in t2)


async def test_spanish_gas_smell_gets_spanish_safety_script(harness: Harness) -> None:
    h = harness
    cid = await h.start()
    t1 = await h.turn(cid, "Hola, huele a gas en mi casa")
    first = next(e for e in t1 if isinstance(e, TextChunk))
    assert first.text.startswith("Su seguridad es lo primero")
    assert (await conv_row(h, cid)).urgency == "emergency"


# --- guards and preconditions ---------------------------------------------------------------


async def test_false_booked_claim_is_blocked(harness: Harness) -> None:
    h = harness
    h.llm.extend([say("Great news, you're all set for Monday!")])
    cid = await h.start()
    events = await h.turn(cid, "Can you book me for Monday?")
    assert "you're all set" not in spoken(events).lower()
    assert "Let me finish getting that on the schedule." in spoken(events)


async def test_booking_requires_confirmed_details(harness: Harness) -> None:
    h = harness
    h.llm.extend([call("create_booking", slot_id=MONDAY_8AM), say("Can I get your name first?")])
    cid = await h.start()
    events = await h.turn(cid, "Just book me Monday 8 AM.")
    tool = next(e for e in events if isinstance(e, ToolEvent))
    assert (tool.status, tool.reason_code) == ("rejected", "PRECONDITION_FAILED")
    assert h.provider.calls == []


async def test_confirm_without_read_back_is_rejected(harness: Harness) -> None:
    h = harness
    h.llm.extend(
        [
            ScriptStep(
                tool_calls=[
                    ("record_caller_details", {"phone": "5125550198", "confirm": ["phone"]})
                ]
            ),
            say("Got it."),
        ]
    )
    cid = await h.start()
    await h.turn(cid, "my number is 512 555 0198")
    [row] = await tool_rows(h)
    assert "errors" in row.result_json and "phone" in row.result_json["errors"]


async def test_cannot_book_slot_in_same_turn_it_was_offered(harness: Harness) -> None:
    h = harness
    h.llm.extend(
        [
            *collect_and_confirm(),
            call("check_availability"),
            call("create_booking", slot_id=MONDAY_8AM),
        ]
    )
    cid = await h.start()
    events = await run(h, cid, "My AC is out", "Yes")
    rows = await tool_rows(h)
    booking_call = next(t for t in rows if t.tool_name == "create_booking")
    assert booking_call.reason_code == "SLOT_NOT_CHOSEN"
    assert h.provider.calls == ["available_slots"]  # never tried to book
    # Third tool round in one turn hits the limit: honest hold line + callback, no loop.
    assert "taking longer than it should" in spoken(events)
    assert rows[-1].tool_name == "request_callback" and rows[-1].args_json["_source"] == "engine"


# --- coverage tiers ---------------------------------------------------------------------------


async def test_unconfirmed_area_takes_soft_callback_path(harness: Harness) -> None:
    h = harness
    h.llm.extend(
        [
            *collect_and_confirm(city="Hutto", zip_code="78634"),
            call("check_availability"),
            call("request_callback", reason="coverage_unconfirmed"),
            say("I'll have the team confirm we cover your area and call you back first thing."),
        ]
    )
    cid = await h.start()
    await run(h, cid, "AC is out in Hutto", "Yes")
    rows = await tool_rows(h)
    assert rows[-2].reason_code == "COVERAGE_NOT_CONFIRMED"
    assert rows[-1].tool_name == "request_callback" and rows[-1].status == "ok"
    assert h.provider.calls == []  # never touched the calendar
    row = await conv_row(h, cid)
    assert (row.outcome, row.state_json["outcome_reason"]) == ("callback", "coverage_unconfirmed")
    assert row.state_json["coverage_is_candidate"] is True


# --- booking failure modes --------------------------------------------------------------------


async def _to_offer(h: Harness) -> str:
    h.llm.extend(
        [
            *collect_and_confirm(),
            call("check_availability"),
            say("I can do Monday at 8 AM or 10 AM. Which works better?"),
        ]
    )
    cid = await h.start()
    await run(h, cid, "AC is out", "Yes")
    return cid


@pytest.mark.parametrize("scenario", ["race"])
async def test_slot_race_offers_next_options(make_harness, scenario: str) -> None:  # type: ignore[no-untyped-def]
    h = await make_harness(scenario)
    cid = await _to_offer(h)
    h.llm.extend(
        [
            call("create_booking", slot_id=MONDAY_8AM),
            say("That time just got taken. I can do Monday at 10 AM or 12 PM."),
        ]
    )
    events = await h.turn(cid, "8 AM")
    tool = next(e for e in events if isinstance(e, ToolEvent) and e.name == "create_booking")
    assert tool.reason_code == "SLOT_TAKEN"
    row = await conv_row(h, cid)
    offered = [o["slot_id"] for o in row.state_json["availability"]["offered_slots"]]
    assert MONDAY_8AM not in offered and MONDAY_10AM in offered
    assert row.outcome != "booked"
    await h.db.dispose()


async def test_booking_api_down_goes_to_callback(make_harness) -> None:  # type: ignore[no-untyped-def]
    h = await make_harness("api_down")
    h.llm.extend(
        [
            *collect_and_confirm(),
            call("check_availability"),
            call("request_callback", reason="provider_unavailable"),
            say("The team will call you back first thing to get you on the calendar."),
        ]
    )
    cid = await h.start()
    await run(h, cid, "AC is out", "Yes")
    rows = await tool_rows(h)
    assert rows[-2].reason_code == "PROVIDER_UNAVAILABLE"
    assert (await conv_row(h, cid)).outcome == "callback"
    await h.db.dispose()


async def test_no_slots_is_honest(make_harness) -> None:  # type: ignore[no-untyped-def]
    h = await make_harness("no_slots")
    h.llm.extend(
        [
            *collect_and_confirm(),
            call("check_availability"),
            call("request_callback", reason="no_availability"),
            say("Okay."),
        ]
    )
    cid = await h.start()
    await run(h, cid, "AC is out", "Yes")
    rows = await tool_rows(h)
    assert rows[-2].result_json["slots"] == [] and "no_availability" in rows[-2].result_json["next"]
    await h.db.dispose()


async def test_timeout_then_exists_is_reconciled_not_doubled(make_harness) -> None:  # type: ignore[no-untyped-def]
    h = await make_harness("timeout_then_exists")
    cid = await _to_offer(h)
    h.llm.extend([call("create_booking", slot_id=MONDAY_8AM), say("Anything else?")])
    events = await h.turn(cid, "8 AM")
    assert "You're all set for Monday at 8 AM" in spoken(events)
    assert len(h.provider.bookings) == 1
    async with h.db.tenant_session(JOLLY) as s:
        booking = (await s.scalars(select(Booking))).one()
    assert booking.status == "confirmed"
    await h.db.dispose()


# --- LLM failures -------------------------------------------------------------------------------


async def test_llm_retry_then_capture_flow(harness: Harness) -> None:
    h = harness
    boom = LLMError("timeout", retryable=True)
    h.llm.extend(
        [
            ScriptStep(error=boom),
            ScriptStep(error=boom),  # turn 1: fail + retry fail
            ScriptStep(error=boom),
            ScriptStep(error=boom),
        ]
    )  # turn 2: same
    cid = await h.start(caller_id="+15125550198", channel="voice")
    t1 = await h.turn(cid, "Hi, my AC is broken")
    assert "Could you say it again?" in spoken(t1)
    t2 = await h.turn(cid, "My AC is broken")
    assert "number ending in zero one nine eight" in spoken(t2)
    t3 = await h.turn(cid, "yes")
    assert any(isinstance(e, EndConversation) for e in t3)
    row = await conv_row(h, cid)
    assert (row.outcome, row.state_json["outcome_reason"]) == ("callback", "llm_failure")


async def test_no_llm_configured_still_captures_callback(make_harness) -> None:  # type: ignore[no-untyped-def]
    h = await make_harness(llm=False)
    cid = await h.start()
    t1 = await h.turn(cid, "my AC is broken")
    assert "best number" in spoken(t1)
    await h.db.dispose()
