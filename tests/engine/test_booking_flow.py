"""Acceptance: Saturday 2 PM, AC dead -> full fake booking (DEMO_NOW=2026-10-03T14:10)."""

from datetime import UTC, datetime

from sqlalchemy import select

from receptionist.adapters.llm.scripted import ScriptStep, call, say
from receptionist.db.models import Booking, Conversation, Message, ToolCall, Turn
from receptionist.engine.engine import EndConversation, TextChunk, ToolEvent
from tests.conftest import JOLLY
from tests.engine.conftest import Harness, spoken

MONDAY_8AM = "20261005T1300Z"  # Monday Oct 5 2026, 08:00 CDT


def script_happy_path(h: Harness) -> None:
    h.llm.extend(
        [
            # turn 1: "my AC is dead"
            call("classify_urgency", urgency="routine", reason="AC not working"),
            say("Oh no, I'm sorry about that. Let's get someone out to you. Can I get your name?"),
            # turn 2: name, phone, address
            call(
                "record_caller_details",
                name="Pat Jones",
                phone="512-555-0198",
                address={"line": "2104 Oak St", "city": "Round Rock", "zip": "78664"},
                issue_summary="AC is dead, not cooling",
            ),
            say(
                "Thanks, Pat. I have five one two, five five five, zero one nine eight, at "
                "twenty-one oh four Oak Street in Round Rock. Is that right?"
            ),
            # turn 3: yes -> confirm + availability in one round
            ScriptStep(
                tool_calls=[
                    ("record_caller_details", {"confirm": ["name", "phone", "address"]}),
                    ("check_availability", {}),
                ]
            ),
            say("I can do Monday at 8 AM or 10 AM. Which works better?"),
            # turn 4: picks 8 AM
            call("create_booking", slot_id=MONDAY_8AM),
            say("Is there anything else I can help with?"),
            # turn 5: done
            ScriptStep(
                text="Thanks for calling, Pat. Have a good one!",
                tool_calls=[("end_conversation", {"reason": "completed"})],
            ),
        ]
    )


async def test_saturday_ac_dead_full_booking(harness: Harness) -> None:
    h = harness
    script_happy_path(h)
    cid = await h.start()
    assert h.greeting.startswith(
        "Hi, thanks for calling Jolly Brothers Services. I'm their AI assistant"
    )

    t1 = await h.turn(cid, "Hi, my AC is dead.")
    assert "Can I get your name?" in spoken(t1)

    t2 = await h.turn(cid, "Pat Jones. 512-555-0198, I'm at 2104 Oak St in Round Rock 78664.")
    assert "Is that right?" in spoken(t2)

    t3 = await h.turn(cid, "Yes, that's right.")
    chunks = [e for e in t3 if isinstance(e, TextChunk)]
    assert chunks[0].source == "filler"  # hold line before the availability lookup
    assert "Monday at 8 AM or 10 AM" in spoken(t3)

    t4 = await h.turn(cid, "8 AM works.")
    t4_chunks = [e for e in t4 if isinstance(e, TextChunk)]
    assert t4_chunks[0].source == "filler"
    confirmation = next(c.text for c in t4_chunks if c.source == "system")
    assert confirmation.startswith("You're all set for Monday at 8 AM.")
    assert "twenty-one oh four Oak Street" in confirmation
    assert "zero one nine eight" in confirmation

    t5 = await h.turn(cid, "No, that's it, thanks.")
    assert any(isinstance(e, EndConversation) for e in t5)
    assert h.llm.remaining == 0

    async with h.db.tenant_session(JOLLY) as s:
        conv = await s.get(Conversation, cid)
        booking = (await s.scalars(select(Booking))).one()
        turns = (await s.scalars(select(Turn).order_by(Turn.turn_index))).all()
        tools = (await s.scalars(select(ToolCall).order_by(ToolCall.created_at))).all()
        messages = (await s.scalars(select(Message).order_by(Message.seq))).all()

    assert conv is not None
    assert conv.status == "ended" and conv.outcome == "booked"
    assert conv.urgency == "urgent"  # rule floor: no cooling in hot season (LLM said routine)
    assert conv.after_hours is True and conv.clock_source == "demo"
    assert conv.started_at == datetime(2026, 10, 3, 19, 10, tzinfo=UTC)
    assert conv.caller_phone_e164 == "+15125550198"
    assert booking.status == "confirmed" and booking.provider == "fake"
    assert booking.start_utc == datetime(2026, 10, 5, 13, 0, tzinfo=UTC)
    assert booking.provider_booking_uid in h.provider.bookings
    assert len(h.provider.bookings) == 1
    assert [t.tool_name for t in tools] == [
        "classify_urgency",
        "record_caller_details",
        "record_caller_details",
        "check_availability",
        "create_booking",
        "end_conversation",
    ]
    assert all(t.status == "ok" for t in tools)
    assert [t.filler_used for t in turns] == [False, False, True, True, False]
    assert all(t.first_audible_ms is not None for t in turns)
    assert turns[2].answer_first_chunk_ms is not None
    assert turns[2].first_audible_ms <= turns[2].answer_first_chunk_ms
    assert sum(t.cost_usd for t in turns) > 0
    roles = [m.role for m in messages]
    assert roles[0] == "agent" and roles.count("user") == 5
    assert not any(t.guard_triggers for t in turns)


async def test_repeat_confirm_does_not_double_book(harness: Harness) -> None:
    h = harness
    script_happy_path(h)
    h.llm._steps = h.llm._steps[:8]  # through the booking turn
    h.llm.extend([call("create_booking", slot_id=MONDAY_8AM), say("You're all set!")])
    cid = await h.start()
    for text in [
        "My AC is dead.",
        "Pat Jones, 512-555-0198, 2104 Oak St, Round Rock 78664",
        "Yes.",
        "8 AM please.",
        "Wait, did that go through? Book it again.",
    ]:
        events = await h.turn(cid, text)
    replay = [e for e in events if isinstance(e, ToolEvent)]
    assert replay[0].status == "ok"
    assert len(h.provider.bookings) == 1
    assert [c for c in h.provider.calls if c == "create_booking"] == ["create_booking"]
    async with h.db.tenant_session(JOLLY) as s:
        assert len((await s.scalars(select(Booking))).all()) == 1
