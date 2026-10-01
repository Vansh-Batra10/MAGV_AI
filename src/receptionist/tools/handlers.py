"""Tool implementations. The LLM proposes; these validate against state and act (DESIGN.md 3.4).

Every handler returns a ToolOutcome. A rejected call is never executed: the result explains
what is missing so the model can repair the conversation itself.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from receptionist.booking.base import (
    BookingOutcomeUnknown,
    BookingProviderError,
    BookingRequest,
    Slot,
    SlotQuery,
)
from receptionist.config.hours import next_business_day_open
from receptionist.db.models import Alert, Booking, CallbackRequest, Lead
from receptionist.engine.context import TurnContext
from receptionist.engine.coverage import classify, extract_zip
from receptionist.engine.speech import (
    house_number_words,
    join_offers,
    last_four,
    normalize_phone,
    read_back_address,
    read_back_phone,
    spoken_slot,
)
from receptionist.engine.state import Address, OfferedSlot, Phase
from receptionist.engine.text import normalize
from receptionist.engine.urgency import max_urgency
from receptionist.logging import get_logger
from receptionist.tools.specs import CALLBACK_REASONS, ENGINE_CALLBACK_REASONS

log = get_logger(__name__)
Status = Literal["ok", "rejected", "error"]
WEEKDAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


@dataclass
class ToolOutcome:
    status: Status
    result: dict[str, Any]
    reason_code: str | None = None
    speak: list[str] = field(default_factory=list)  # deterministic lines spoken by the engine
    end_conversation: str | None = None
    transfer: bool = False


def ok(result: dict[str, Any], **kw: Any) -> ToolOutcome:
    return ToolOutcome("ok", {"ok": True, **result}, **kw)


def rejected(code: str, hint: str, **extra: Any) -> ToolOutcome:
    return ToolOutcome("rejected", {"ok": False, "error": code, "hint": hint, **extra}, code)


def failed(code: str, hint: str, **extra: Any) -> ToolOutcome:
    return ToolOutcome("error", {"ok": False, "error": code, "hint": hint, **extra}, code)


class _Args(BaseModel):
    model_config = ConfigDict(extra="forbid")


# --- classify_urgency ------------------------------------------------------------------


class UrgencyArgs(_Args):
    urgency: Literal["routine", "urgent", "emergency"]
    reason: str


async def classify_urgency(ctx: TurnContext, args: UrgencyArgs) -> ToolOutcome:
    st = ctx.state.urgency
    level = max_urgency(args.urgency, st.rule_floor)
    raised = level != args.urgency
    st.level = level
    st.source = "rule" if raised else "llm"
    st.reason = args.reason
    if ctx.state.phase in (Phase.GREETING, Phase.TRIAGE):
        ctx.state.phase = Phase.COLLECT
    result: dict[str, Any] = {"urgency": level}
    if raised:
        result["note"] = f"Raised to {level} by business rules: {', '.join(st.matched_rules)}."
    if level == "emergency" and not ctx.state.flags.on_call_alerted:
        result["next"] = "Call alert_on_call with a one-line summary."
    return ok(result)


# --- record_caller_details -------------------------------------------------------------


class AddressArgs(_Args):
    line: str
    city: str | None = None
    zip: str | None = None


class DetailsArgs(_Args):
    name: str | None = None
    phone: str | None = None
    address: AddressArgs | None = None
    email: str | None = None
    issue_summary: str | None = None
    language: Literal["en", "es"] | None = None
    confirm: list[Literal["name", "phone", "address", "email"]] = []


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$", re.IGNORECASE)


def _spoken_email(text: str) -> str:
    t = f" {normalize(text)} ".replace(" at ", "@").replace(" dot ", ".")
    return re.sub(r"\s+", "", t)


def read_back_evident(ctx: TurnContext, fieldname: str) -> bool:
    """Was the value read back to the caller in the agent's previous utterance?"""
    said = normalize(ctx.last_agent_text)
    c = ctx.state.caller
    if fieldname == "phone" and c.phone_e164:
        digits = c.phone_e164[-4:]
        return digits in re.sub(r"\D", "", said) or last_four(c.phone_e164) in said
    if fieldname == "address" and c.address:
        num = re.match(r"\s*(\d+)", c.address.line)
        if num:
            n = num.group(1)
            return n in said or house_number_words(n) in said
        street = c.address.line.split()[0].lower()
        return street in said
    if fieldname == "name" and c.name:
        return c.name.split()[0].lower() in said
    if fieldname == "email" and c.email:
        local = c.email.split("@")[0].lower()
        return local in _spoken_email(ctx.last_agent_text) or local in said.replace(" ", "")
    return False


def _coverage_guidance(tier: str, ctx: TurnContext) -> str:
    if tier == "excluded":
        return (
            "Excluded area: politely say we don't service it. Do not check availability "
            f'or book. Say: "{ctx.locale.t("lines.coverage_excluded")}"'
        )
    if tier == "unconfirmed":
        return (
            "Coverage unconfirmed: do NOT check availability or book. Finish confirming "
            "name, phone and address, then say: "
            f'"{ctx.locale.t("lines.coverage_unconfirmed")}" and call '
            "request_callback with reason coverage_unconfirmed."
        )
    return "Covered area: normal booking flow."


async def record_caller_details(ctx: TurnContext, args: DetailsArgs) -> ToolOutcome:
    c = ctx.state.caller
    updated: list[str] = []
    errors: dict[str, str] = {}
    read_back: dict[str, str] = {}

    if args.name and args.name.strip() != c.name:
        c.name = args.name.strip()
        updated.append("name")
    if args.phone:
        e164 = normalize_phone(args.phone)
        if e164 is None:
            errors["phone"] = "Not a valid US phone number. Ask the caller to repeat it."
        elif e164 != c.phone_e164:
            c.phone_e164, c.phone_confirmed, c.phone_from_caller_id = e164, False, False
            updated.append("phone")
    if args.address:
        zip_code = args.address.zip or extract_zip(args.address.line)
        new = Address(line=args.address.line.strip(), city=args.address.city, zip=zip_code)
        if new != c.address:
            c.address, c.address_confirmed = new, False
            updated.append("address")
            cov = classify(ctx.cfg, city=new.city, zip_code=new.zip)
            ctx.state.coverage = cov.tier
            ctx.state.coverage_matched_on = cov.matched_on
            ctx.state.coverage_is_candidate = cov.is_candidate
    if args.email:
        email = args.email.strip().lower().replace(" ", "")
        if not _EMAIL_RE.match(email):
            errors["email"] = "That doesn't look like a valid email; ask again or skip it."
        elif email != c.email:
            c.email, c.email_confirmed = email, False
            updated.append("email")
    if args.issue_summary:
        c.issue_summary = args.issue_summary.strip()
        updated.append("issue_summary")
    if args.language and args.language != ctx.state.language:
        ctx.state.language = args.language
        updated.append("language")

    confirmed: list[str] = []
    for f in args.confirm:
        if f in updated:
            errors[f] = f"You just changed {f}; read it back and get a yes before confirming."
        elif not read_back_evident(ctx, f):
            errors[f] = f"Read the {f} back to the caller first, then confirm after they agree."
        else:
            if f != "name":  # names are read back but have no confirmed flag
                setattr(c, f"{f}_confirmed", True)
            confirmed.append(f)

    if c.phone_e164 and not c.phone_confirmed:
        read_back["phone"] = read_back_phone(c.phone_e164)
    if c.address and not c.address_confirmed:
        read_back["address"] = read_back_address(c.address.line)
    if ctx.state.phase in (Phase.GREETING, Phase.TRIAGE):
        ctx.state.phase = Phase.COLLECT

    result: dict[str, Any] = {
        "updated": updated,
        "confirmed": confirmed,
        "missing_for_booking": ctx.state.missing_for_booking(),
        "coverage": ctx.state.coverage,
    }
    if read_back:
        result["read_back"] = read_back
        result["hint"] = "Read these back exactly as given and ask if they're right."
    if errors:
        result["errors"] = errors
    if ctx.state.coverage != "unknown":
        result["coverage_guidance"] = _coverage_guidance(ctx.state.coverage, ctx)
    if not updated and not confirmed:
        return ToolOutcome("rejected", {"ok": False, **result}, "NOTHING_APPLIED")
    return ok(result)


# --- availability ----------------------------------------------------------------------


class AvailabilityArgs(_Args):
    day: str | None = None
    part_of_day: Literal["morning", "afternoon", "any"] | None = None


def _booking_preconditions(ctx: TurnContext) -> ToolOutcome | None:
    missing = ctx.state.missing_for_booking()
    if missing:
        return rejected(
            "PRECONDITION_FAILED",
            "Collect and confirm these first (read back, get a yes, then "
            "record_caller_details with confirm).",
            missing=missing,
        )
    if ctx.state.coverage != "covered":
        return rejected(
            "COVERAGE_NOT_CONFIRMED",
            _coverage_guidance(ctx.state.coverage, ctx)
            if ctx.state.coverage != "unknown"
            else "Get the service address (with city or ZIP) first.",
            coverage=ctx.state.coverage,
        )
    return None


def _search_window(ctx: TurnContext) -> tuple[datetime, datetime]:
    b = ctx.cfg.booking
    now = ctx.now_local
    start = now + timedelta(minutes=b.lead_time_min)
    if b.earliest_slot == "next_business_day_open":
        start = max(start, next_business_day_open(ctx.cfg, now))
    return start, now + timedelta(days=b.max_days_ahead)


def _day_filter(pref: str | None, now: datetime) -> date | int | None:
    if not pref:
        return None
    p = pref.strip().lower()
    if p == "today":
        return now.date()
    if p == "tomorrow":
        return now.date() + timedelta(days=1)
    if p in WEEKDAY_NAMES:
        return WEEKDAY_NAMES.index(p)
    try:
        return date.fromisoformat(p)
    except ValueError:
        return None


def _matches(slot: Slot, ctx: TurnContext, day: date | int | None, part: str | None) -> bool:
    local = slot.start_utc.astimezone(ctx.cfg.tz)
    if isinstance(day, date) and local.date() != day:
        return False
    if isinstance(day, int) and local.weekday() != day:
        return False
    if part == "morning" and local.hour >= 12:
        return False
    return not (part == "afternoon" and local.hour < 12)


async def _fetch_slots(ctx: TurnContext, start: datetime, end: datetime) -> list[Slot]:
    q = SlotQuery(
        start.astimezone(UTC), end.astimezone(UTC), ctx.cfg.tz, ctx.cfg.booking.slot_length_min
    )
    try:
        slots = await ctx.booking.available_slots(q)
    except BookingProviderError:
        ctx.breaker.record_failure()
        raise
    ctx.breaker.record_success()
    return slots


def _offer(ctx: TurnContext, slots: list[Slot]) -> dict[str, Any]:
    now = ctx.now_local
    local = [s.start_utc.astimezone(ctx.cfg.tz) for s in slots]
    av = ctx.state.availability
    av.offered_slots = [
        OfferedSlot(
            slot_id=s.slot_id, start_utc=s.start_utc, end_utc=s.end_utc, spoken=spoken_slot(lt, now)
        )
        for s, lt in zip(slots, local, strict=True)
    ]
    av.all_offered_ids = list(dict.fromkeys([*av.all_offered_ids, *(s.slot_id for s in slots)]))
    av.offered_at_turn = ctx.turn_index
    ctx.state.phase = Phase.OFFER
    return {
        "slots": [{"slot_id": o.slot_id, "spoken": o.spoken} for o in av.offered_slots],
        "say": f"I can do {join_offers(local, now)}. Which works better?",
    }


def _unavailable_outcome(ctx: TurnContext) -> ToolOutcome:
    return failed(
        "PROVIDER_UNAVAILABLE",
        "Do not guess times. Say this, then call request_callback with reason "
        f'provider_unavailable: "{ctx.locale.t("lines.provider_down_callback")}"',
    )


async def check_availability(ctx: TurnContext, args: AvailabilityArgs) -> ToolOutcome:
    blocked = _booking_preconditions(ctx)
    if blocked:
        return blocked
    if ctx.breaker.is_open:
        return _unavailable_outcome(ctx)
    start, end = _search_window(ctx)
    try:
        slots = await _fetch_slots(ctx, start, end)
    except BookingProviderError:
        return _unavailable_outcome(ctx)
    ctx.state.availability.checks += 1
    if not slots:
        return ok(
            {
                "slots": [],
                "say": ctx.locale.t("lines.no_slots_callback"),
                "next": "Say that, then call request_callback with reason no_availability.",
            }
        )
    day = _day_filter(args.day, ctx.now_local)
    wanted = [s for s in slots if _matches(s, ctx, day, args.part_of_day)]
    note = None
    if not wanted:
        wanted = slots
        note = "Nothing open matching that preference; these are the earliest openings."
    elif day is None and args.part_of_day in (None, "any"):
        previous = {o.slot_id for o in ctx.state.availability.offered_slots}
        wanted = [s for s in wanted if s.slot_id not in previous] or wanted
    result = _offer(ctx, wanted[: ctx.cfg.booking.offer_count])
    if note:
        result["note"] = note
    return ok(result)


# --- create_booking ----------------------------------------------------------------------


class BookingArgs(_Args):
    slot_id: str


def idempotency_key(conversation_id: str, slot: Slot) -> str:
    raw = f"{conversation_id}|{slot.start_utc.isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _confirmation(ctx: TurnContext, start_utc: datetime) -> str:
    c = ctx.state.caller
    assert c.address and c.phone_e164
    when = spoken_slot(start_utc.astimezone(ctx.cfg.tz), ctx.now_local)
    return ctx.locale.t(
        "lines.booking_confirmed",
        when=when,
        address=read_back_address(c.address.line),
        phone_last4_words=f"the number ending in {last_four(c.phone_e164)}",
    )


async def _slot_taken(ctx: TurnContext, slot: Slot) -> ToolOutcome:
    start, end = _search_window(ctx)
    try:
        slots = [s for s in await _fetch_slots(ctx, start, end) if s.slot_id != slot.slot_id]
    except BookingProviderError:
        return _unavailable_outcome(ctx)
    if not slots:
        return ok(
            {
                "slots": [],
                "booked": False,
                "say": ctx.locale.t("lines.no_slots_callback"),
                "next": "Call request_callback with reason no_availability.",
            }
        )
    offer = _offer(ctx, slots[: ctx.cfg.booking.offer_count])
    offers = offer["say"].removeprefix("I can do ").removesuffix(". Which works better?")
    return ToolOutcome(
        "error",
        {
            "ok": False,
            "error": "SLOT_TAKEN",
            "booked": False,
            **offer,
            "say": ctx.locale.t("lines.slot_taken", offers=offers),
        },
        "SLOT_TAKEN",
    )


def _finalize_confirmed(ctx: TurnContext, row: Booking) -> ToolOutcome:
    ctx.state.booking.status = "confirmed"
    ctx.state.booking.booking_id = row.id
    ctx.state.booking.provider_uid = row.provider_booking_uid
    ctx.state.booking.start_utc = row.start_utc
    ctx.state.phase = Phase.BOOKED
    line = _confirmation(ctx, row.start_utc)
    ctx.state.booking.spoken_confirmation = line
    return ok(
        {
            "booked": True,
            "booking_id": row.id,
            "spoken_to_caller": line,
            "next": "The confirmation was already spoken. Ask if there's anything else.",
        },
        speak=[line],
    )


async def create_booking(ctx: TurnContext, args: BookingArgs) -> ToolOutcome:
    st = ctx.state
    if st.booking.status == "confirmed":
        return ok(
            {
                "booked": True,
                "booking_id": st.booking.booking_id,
                "replay": True,
                "note": "Already booked in this conversation; nothing new was created.",
            }
        )
    blocked = _booking_preconditions(ctx)
    if blocked:
        return blocked
    offered = {o.slot_id: o for o in st.availability.offered_slots}
    if args.slot_id not in offered:
        return rejected(
            "UNKNOWN_SLOT",
            "Only book a slot_id from the latest check_availability.",
            offered=list(offered),
        )
    if st.availability.offered_at_turn >= ctx.turn_index:
        return rejected(
            "SLOT_NOT_CHOSEN", "Offer the times and wait for the caller to choose before booking."
        )
    if ctx.breaker.is_open:
        return _unavailable_outcome(ctx)

    o = offered[args.slot_id]
    slot = Slot(o.start_utc, o.end_utc)
    key = idempotency_key(ctx.conversation_id, slot)
    session = ctx.session
    row = await session.scalar(select(Booking).where(Booking.idempotency_key == key))
    if row and row.status == "confirmed":
        return _finalize_confirmed(ctx, row)
    c = st.caller
    assert c.name and c.phone_e164 and c.address
    if row is None:
        row = Booking(
            conversation_id=ctx.conversation_id,
            provider=ctx.booking.name,
            idempotency_key=key,
            active_guard=ctx.conversation_id,
            status="pending",
            start_utc=slot.start_utc,
            end_utc=slot.end_utc,
            attendee_name=c.name,
            attendee_phone_e164=c.phone_e164,
            attendee_email=c.email if c.email_confirmed else None,
            service_address=c.address.one_line(),
        )
        try:
            async with session.begin_nested():  # savepoint: a clash must not undo the turn
                session.add(row)
        except IntegrityError:
            return rejected("ALREADY_BOOKED", "This conversation already has an active booking.")
    else:
        row.status, row.active_guard = "pending", ctx.conversation_id
    st.booking.status = "pending"
    st.phase = Phase.BOOKING

    # Re-check the slot right before booking (DESIGN.md 2.5).
    try:
        fresh = await _fetch_slots(ctx, slot.start_utc, slot.start_utc + timedelta(minutes=1))
    except BookingProviderError:
        return await _booking_failed(ctx, row, "provider_unavailable")
    if slot.slot_id not in {s.slot_id for s in fresh}:
        return await _mark_taken(ctx, row, slot)

    request = BookingRequest(
        idempotency_key=key,
        slot=slot,
        attendee_name=c.name,
        attendee_phone_e164=c.phone_e164,
        attendee_email=row.attendee_email,
        attendee_tz=ctx.cfg.timezone,
        service_address=c.address.one_line(),
        notes=c.issue_summary or "",
        metadata={
            "conversation_id": ctx.conversation_id,
            "tenant": ctx.cfg.client_id,
            "demo": str(ctx.cfg.demo.enabled).lower(),
        },
    )
    row.raw_request_json = {"start": slot.start_utc.isoformat(), "key": key}
    for attempt in range(2):
        try:
            result = await ctx.booking.create_booking(request)
        except BookingOutcomeUnknown:
            ctx.breaker.record_failure()
            row.status = "unknown"
            found = await _reconcile(ctx, key, slot)
            if found:
                row.provider_booking_uid, row.provider_booking_id = (
                    found.provider_uid,
                    found.provider_id,
                )
                row.raw_response_json, row.status = found.raw, "confirmed"
                return _finalize_confirmed(ctx, row)
            if attempt == 0:
                continue
            return await _booking_failed(ctx, row, "outcome_unknown", keep_active=True)
        except BookingProviderError:
            return await _booking_failed(ctx, row, "provider_unavailable")
        ctx.breaker.record_success()
        row.raw_response_json = result.raw
        if result.status == "success":
            row.status = "confirmed"
            row.provider_booking_uid, row.provider_booking_id = (
                result.provider_uid,
                result.provider_id,
            )
            return _finalize_confirmed(ctx, row)
        if result.status == "slot_unavailable":
            return await _mark_taken(ctx, row, slot)
        return await _booking_failed(ctx, row, result.error or result.status)
    raise AssertionError("unreachable")


async def _reconcile(ctx: TurnContext, key: str, slot: Slot):  # type: ignore[no-untyped-def]
    try:
        return await ctx.booking.find_by_idempotency_key(
            key, slot.start_utc - timedelta(hours=1), slot.end_utc + timedelta(hours=1)
        )
    except BookingProviderError:
        return None


async def _mark_taken(ctx: TurnContext, row: Booking, slot: Slot) -> ToolOutcome:
    row.status, row.active_guard, row.failure_reason = "failed", None, "slot_taken"
    ctx.state.booking.status = "failed"
    return await _slot_taken(ctx, slot)


async def _booking_failed(
    ctx: TurnContext, row: Booking, reason: str, *, keep_active: bool = False
) -> ToolOutcome:
    if reason == "provider_unavailable":
        ctx.breaker.record_failure()
    row.failure_reason = reason
    if not keep_active:
        row.status, row.active_guard = "failed", None
    ctx.state.booking.status = "unknown" if keep_active else "failed"
    line = ctx.locale.t("lines.provider_down_callback")
    return failed(
        "BOOKING_FAILED",
        "Not booked. Never say it is booked. Say this, then call "
        f'request_callback with reason booking_failed: "{line}"',
        booked=False,
    )


# --- cancel, lead, callback, alert, transfer, end ----------------------------------------


class CancelArgs(_Args):
    booking_id: str
    reason: str


async def cancel_booking(ctx: TurnContext, args: CancelArgs) -> ToolOutcome:
    row = await ctx.session.scalar(
        select(Booking).where(
            Booking.id == args.booking_id, Booking.conversation_id == ctx.conversation_id
        )
    )
    if row is None or row.status != "confirmed" or not row.provider_booking_uid:
        return rejected("NOT_FOUND", "No confirmed booking with that id in this conversation.")
    try:
        res = await ctx.booking.cancel_booking(row.provider_booking_uid, args.reason)
    except BookingProviderError:
        ctx.breaker.record_failure()
        return _unavailable_outcome(ctx)
    if not res.ok:
        return failed("CANCEL_FAILED", "Tell the caller the team will confirm the cancellation.")
    row.status, row.active_guard = "cancelled", None
    ctx.state.booking.status = "cancelled"
    ctx.state.phase = Phase.WRAP_UP
    return ok({"cancelled": True})


class LeadArgs(_Args):
    interest: str


async def capture_lead(ctx: TurnContext, args: LeadArgs) -> ToolOutcome:
    c = ctx.state.caller
    if not (c.name or c.phone_e164):
        return rejected("PRECONDITION_FAILED", "Get at least a name or phone number first.")
    ctx.session.add(
        Lead(
            conversation_id=ctx.conversation_id,
            name=c.name,
            phone_e164=c.phone_e164,
            email=c.email,
            interest=args.interest,
        )
    )
    return ok({"saved": True})


class CallbackArgs(_Args):
    reason: Literal[tuple(CALLBACK_REASONS + ENGINE_CALLBACK_REASONS)]  # type: ignore[valid-type]
    preferred_window: str | None = None
    notes: str | None = None


async def request_callback(ctx: TurnContext, args: CallbackArgs) -> ToolOutcome:
    st = ctx.state
    phone = st.caller.phone_e164
    if not phone:
        return rejected("PRECONDITION_FAILED", "Get a callback phone number first.")
    if st.callback.requested:
        return ok({"saved": True, "replay": True, "callback_id": st.callback.callback_id})
    priority = {"emergency": "high", "urgent": "high"}.get(st.urgency.level or "", "normal")
    if args.reason in ("human_requested", "emergency"):
        priority = "high"
    row = CallbackRequest(
        conversation_id=ctx.conversation_id,
        reason=args.reason,
        priority=priority,
        preferred_window=args.preferred_window,
        phone_e164=phone,
        phone_confirmed=st.caller.phone_confirmed,
        language=st.language,
        notes=args.notes,
    )
    ctx.session.add(row)
    await ctx.session.flush()
    st.callback.requested, st.callback.reason, st.callback.callback_id = True, args.reason, row.id
    if st.phase not in (Phase.BOOKED, Phase.ENDED):
        st.phase = Phase.CALLBACK
    result: dict[str, Any] = {"saved": True, "callback_id": row.id, "priority": priority}
    if not st.caller.phone_confirmed:
        result["hint"] = "The phone number is not confirmed yet; read it back before ending."
    return ok(result)


class AlertArgs(_Args):
    summary: str


async def alert_on_call(ctx: TurnContext, args: AlertArgs) -> ToolOutcome:
    st = ctx.state
    if st.urgency.level != "emergency":
        return rejected("NOT_EMERGENCY", "Only alert on-call for emergencies.")
    if st.flags.on_call_alerted:
        return ok({"alerted": True, "replay": True})
    for channel in ("email", "sms_simulated"):
        ctx.session.add(
            Alert(
                conversation_id=ctx.conversation_id,
                kind="on_call",
                channel=channel,
                status="simulated" if channel == "sms_simulated" else "queued",
                dedupe_key=f"{ctx.conversation_id}:on_call:{channel}",
            )
        )
    st.flags.on_call_alerted = True
    log.warning(
        "on_call_alert",
        conversation_id=ctx.conversation_id,
        on_call=ctx.cfg.on_call.name,
        dummy=ctx.cfg.on_call.is_dummy,
        summary=args.summary,
    )
    return ok(
        {
            "alerted": True,
            "on_call": ctx.cfg.on_call.name,
            "say_hint": "Tell the caller the on-call technician has been alerted.",
        }
    )


class TransferArgs(_Args):
    reason: str


async def transfer_call(ctx: TurnContext, args: TransferArgs) -> ToolOutcome:
    st = ctx.state
    st.flags.human_requested = True
    if ctx.cfg.transfer.enabled and not ctx.cfg.demo.enabled:
        return ok({"transferring": True}, transfer=True)
    st.flags.transfer_simulated = True
    log.info("transfer_simulated", conversation_id=ctx.conversation_id, reason=args.reason)
    line = ctx.locale.t("lines.transfer_simulated")
    next_step = (
        "Call request_callback with reason human_requested."
        if st.caller.phone_e164
        else "Get their callback number, then request_callback with reason human_requested."
    )
    return ok({"transferred": False, "simulated": True, "say": line, "next": next_step})


class EndArgs(_Args):
    reason: Literal["completed", "spam", "wrong_number", "caller_request"]


async def end_conversation(ctx: TurnContext, args: EndArgs) -> ToolOutcome:
    st = ctx.state
    if st.booking.status == "pending":
        return rejected("BOOKING_IN_PROGRESS", "Finish the booking first.")
    if args.reason == "spam":
        st.flags.spam_suspected = True
    st.phase = Phase.ENDED
    return ok({"ended": True}, end_conversation=args.reason)


# --- registry ----------------------------------------------------------------------------

HANDLERS: dict[str, tuple[type[_Args], Any]] = {
    "classify_urgency": (UrgencyArgs, classify_urgency),
    "record_caller_details": (DetailsArgs, record_caller_details),
    "check_availability": (AvailabilityArgs, check_availability),
    "create_booking": (BookingArgs, create_booking),
    "cancel_booking": (CancelArgs, cancel_booking),
    "capture_lead": (LeadArgs, capture_lead),
    "request_callback": (CallbackArgs, request_callback),
    "alert_on_call": (AlertArgs, alert_on_call),
    "transfer_call": (TransferArgs, transfer_call),
    "end_conversation": (EndArgs, end_conversation),
}


def parse_args(name: str, raw: dict[str, Any]) -> _Args | ToolOutcome:
    if name not in HANDLERS:
        return rejected("UNKNOWN_TOOL", f"There is no tool named {name}.")
    model, _ = HANDLERS[name]
    try:
        return model.model_validate(raw)
    except ValidationError as exc:
        problems = "; ".join(
            f"{'.'.join(str(p) for p in e['loc']) or 'args'}: {e['msg']}" for e in exc.errors()
        )
        return rejected("INVALID_ARGS", problems)
