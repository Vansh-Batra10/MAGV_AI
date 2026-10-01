"""Conversation state, persisted as JSON on conversations.state_json (DESIGN.md 3.2)."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from receptionist.config.models import Urgency


class Phase(StrEnum):
    GREETING = "GREETING"
    TRIAGE = "TRIAGE"
    SAFETY = "SAFETY"
    COLLECT = "COLLECT"
    OFFER = "OFFER"
    CONFIRM_SLOT = "CONFIRM_SLOT"
    BOOKING = "BOOKING"
    BOOKED = "BOOKED"
    CALLBACK = "CALLBACK"
    INFO = "INFO"
    LANGUAGE_CALLBACK = "LANGUAGE_CALLBACK"
    WRAP_UP = "WRAP_UP"
    ENDED = "ENDED"


class Address(BaseModel):
    line: str
    city: str | None = None
    zip: str | None = None

    def one_line(self) -> str:
        parts = [self.line, self.city, self.zip]
        return ", ".join(p for p in parts if p)


class CallerInfo(BaseModel):
    name: str | None = None
    phone_e164: str | None = None
    phone_confirmed: bool = False
    phone_from_caller_id: bool = False
    address: Address | None = None
    address_confirmed: bool = False
    email: str | None = None
    email_confirmed: bool = False
    issue_summary: str | None = None


class OfferedSlot(BaseModel):
    slot_id: str
    start_utc: datetime
    end_utc: datetime
    spoken: str


class AvailabilityState(BaseModel):
    offered_slots: list[OfferedSlot] = []
    all_offered_ids: list[str] = []  # every slot id ever offered in this conversation
    offered_at_turn: int = 0
    chosen_slot_id: str | None = None
    checks: int = 0


class BookingState(BaseModel):
    status: Literal["none", "pending", "confirmed", "unknown", "failed", "cancelled"] = "none"
    booking_id: str | None = None
    provider_uid: str | None = None
    start_utc: datetime | None = None
    spoken_confirmation: str | None = None


class UrgencyState(BaseModel):
    level: Urgency | None = None
    rule_floor: Urgency | None = None
    matched_rules: list[str] = []
    source: Literal["rule", "llm", "none"] = "none"
    reason: str | None = None


class CallbackState(BaseModel):
    requested: bool = False
    reason: str | None = None
    callback_id: str | None = None


class CaptureFlow(BaseModel):
    """Deterministic callback capture (Spanish callers, or repeated LLM failure)."""

    active: bool = False
    reason: str | None = None
    step: Literal["intro", "await_confirm", "await_number", "done"] = "intro"
    candidate_phone: str | None = None
    attempts: int = 0


class Flags(BaseModel):
    disclosure_given: bool = False
    safety_scripts_given: list[str] = []
    on_call_alerted: bool = False
    spam_suspected: bool = False
    human_requested: bool = False
    price_only: bool = False
    transfer_simulated: bool = False


class ConversationState(BaseModel):
    phase: Phase = Phase.GREETING
    language: Literal["en", "es"] = "en"
    coverage: Literal["unknown", "covered", "unconfirmed", "excluded"] = "unknown"
    coverage_matched_on: str | None = None
    coverage_is_candidate: bool = False
    urgency: UrgencyState = UrgencyState()
    caller: CallerInfo = CallerInfo()
    availability: AvailabilityState = AvailabilityState()
    booking: BookingState = BookingState()
    callback: CallbackState = CallbackState()
    capture: CaptureFlow = CaptureFlow()
    flags: Flags = Flags()
    outcome: str | None = None
    outcome_reason: str | None = None
    turns: int = 0
    tool_errors_in_a_row: int = 0
    llm_failures_in_a_row: int = 0
    last_filler: str | None = None
    caller_text: list[str] = Field(default_factory=list)  # accumulated, for rule matching

    def missing_for_booking(self) -> list[str]:
        c = self.caller
        missing = []
        if not c.name:
            missing.append("name")
        if not c.phone_e164:
            missing.append("phone")
        elif not c.phone_confirmed:
            missing.append("phone_confirmed")
        if not c.address:
            missing.append("address")
        elif not c.address_confirmed:
            missing.append("address_confirmed")
        if not c.issue_summary:
            missing.append("issue_summary")
        return missing
