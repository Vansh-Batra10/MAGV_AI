import json
from dataclasses import dataclass, field
from typing import Any

import pytest

from receptionist.engine.history import build_messages, with_state


@dataclass
class R:
    role: str
    content: str = ""
    tool_name: str | None = None
    tool_call_id: str | None = None
    meta: dict[str, Any] | None = field(default_factory=dict)


def test_rebuild_alternates_and_skips_system_speech() -> None:
    rows = [
        R("agent", "Hi, thanks for calling...", meta={"source": "system"}),  # greeting
        R("user", "my AC is dead", meta={"llm_note": "safety line"}),
        R("agent", "Oh no.", meta={"source": "llm"}),
        R("agent", "Let me check the schedule for you.", meta={"source": "filler"}),
        R("tool_use", json.dumps({}), "check_availability", "t1"),
        R("tool_result", json.dumps({"ok": True}), "check_availability", "t1"),
        R("agent", "You're all set...", meta={"source": "system"}),  # conveyed via tool_result
        R("agent", "Anything else?", meta={"source": "llm"}),
        R("user", "no thanks"),
    ]
    msgs = build_messages(rows)
    assert [m["role"] for m in msgs] == ["user", "assistant", "user", "assistant", "user"]
    assert "<system_spoke>safety line</system_spoke>" in msgs[0]["content"][0]["text"]
    assert [b["type"] for b in msgs[1]["content"]] == ["text", "text", "tool_use"]
    assert msgs[2]["content"][0]["tool_use_id"] == "t1"
    assert msgs[3]["content"] == [{"type": "text", "text": "Anything else?"}]


def test_with_state_appends_to_last_user_message() -> None:
    msgs = build_messages([R("user", "hello")])
    out = with_state(msgs, "<state>{}</state>")
    assert out[-1]["content"][-1]["text"] == "<state>{}</state>"
    assert len(msgs[-1]["content"]) == 1  # input not mutated
    with pytest.raises(ValueError, match="end with a user message"):
        with_state([{"role": "assistant", "content": []}], "x")
