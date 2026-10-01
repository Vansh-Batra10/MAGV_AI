"""Tool schemas sent to the LLM (DESIGN.md 7.2). Hand-written so descriptions read well.

All objects set additionalProperties=false (required for strict tool use). The LLM never
supplies raw times: it picks slot ids the server issued.
"""

from __future__ import annotations

from typing import Any

from receptionist.adapters.llm.base import ToolSpec


def _obj(properties: dict[str, Any], required: list[str] | None = None) -> dict[str, Any]:
    return {
        "type": "object",
        "properties": properties,
        "required": required or [],
        "additionalProperties": False,
    }


_STR = {"type": "string"}

CALLBACK_REASONS = [
    "coverage_unconfirmed",
    "no_availability",
    "booking_failed",
    "provider_unavailable",
    "human_requested",
    "price_question",
    "caller_preference",
    "emergency",
    "other",
]
# Used by the engine's deterministic flows; not offered to the LLM.
ENGINE_CALLBACK_REASONS = ["language_es", "llm_failure", "turn_limit"]

TOOL_SPECS: list[ToolSpec] = [
    ToolSpec(
        "classify_urgency",
        "Record how urgent the caller's problem is. Call once you understand the issue, and "
        "again if new facts change it. The system may raise your level based on business rules.",
        _obj(
            {
                "urgency": {"type": "string", "enum": ["routine", "urgent", "emergency"]},
                "reason": {**_STR, "description": "One short sentence."},
            },
            ["urgency", "reason"],
        ),
    ),
    ToolSpec(
        "record_caller_details",
        "Save details the caller gave you. Include only fields you learned. After you read a "
        "phone number, address, name or email back and the caller says it is right, call this "
        "again with that field in 'confirm'. Returns read-back text to say and what is missing.",
        _obj(
            {
                "name": _STR,
                "phone": {
                    **_STR,
                    "description": "As the caller said it; the system normalizes it.",
                },
                "address": _obj(
                    {
                        "line": {**_STR, "description": "Street address, e.g. '2104 Oak St'."},
                        "city": _STR,
                        "zip": _STR,
                    },
                    ["line"],
                ),
                "email": _STR,
                "issue_summary": {**_STR, "description": "One sentence, the caller's words."},
                "language": {"type": "string", "enum": ["en", "es"]},
                "confirm": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["name", "phone", "address", "email"]},
                    "description": "Fields the caller just confirmed after your read-back.",
                },
            }
        ),
    ),
    ToolSpec(
        "check_availability",
        "Find real open appointment times. Only call once name, phone and address are confirmed "
        "and the issue is known. Offer only the returned times, using the 'say' text.",
        _obj(
            {
                "day": {
                    **_STR,
                    "description": "Optional caller preference: a weekday name, "
                    "'today', 'tomorrow' or YYYY-MM-DD.",
                },
                "part_of_day": {"type": "string", "enum": ["morning", "afternoon", "any"]},
            }
        ),
    ),
    ToolSpec(
        "create_booking",
        "Book the slot the caller chose. Only after the caller clearly picked one of the times "
        "you offered. Never tell the caller they are booked unless this returns ok.",
        _obj(
            {"slot_id": {**_STR, "description": "A slot_id from check_availability."}}, ["slot_id"]
        ),
    ),
    ToolSpec(
        "cancel_booking",
        "Cancel a booking made earlier in this conversation, if the caller asks.",
        _obj({"booking_id": _STR, "reason": _STR}, ["booking_id", "reason"]),
    ),
    ToolSpec(
        "capture_lead",
        "Save an interested caller who is not booking now (e.g. price question, just asking).",
        _obj({"interest": _STR}, ["interest"]),
    ),
    ToolSpec(
        "request_callback",
        "Ask the team to call the caller back. Use when you can't book: coverage needs "
        "confirming, no availability, booking failed, caller wants a person, or a price question.",
        _obj(
            {
                "reason": {"type": "string", "enum": CALLBACK_REASONS},
                "preferred_window": _STR,
                "notes": _STR,
            },
            ["reason"],
        ),
    ),
    ToolSpec(
        "alert_on_call",
        "Alert the on-call technician about an emergency. Only for emergency urgency.",
        _obj({"summary": _STR}, ["summary"]),
    ),
    ToolSpec(
        "transfer_call",
        "The caller insists on a person right now. In this demo the transfer is simulated: the "
        "team is flagged for an urgent callback.",
        _obj({"reason": _STR}, ["reason"]),
    ),
    ToolSpec(
        "end_conversation",
        "End the call after you have said goodbye, or for spam/robocalls.",
        _obj(
            {
                "reason": {
                    "type": "string",
                    "enum": ["completed", "spam", "wrong_number", "caller_request"],
                }
            },
            ["reason"],
        ),
    ),
]

TOOLS_BY_NAME = {t.name: t for t in TOOL_SPECS}
