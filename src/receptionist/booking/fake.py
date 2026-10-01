"""In-memory booking provider with failure scenarios for tests, evals and offline demos."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta
from typing import Literal

from receptionist.booking.base import (
    BookingOutcomeUnknown,
    BookingProviderError,
    BookingRequest,
    BookingResult,
    CancelResult,
    Slot,
    SlotQuery,
)
from receptionist.config.models import WEEKDAYS, TenantConfig

Scenario = Literal["normal", "no_slots", "api_down", "race", "timeout_then_exists"]


class FakeBookingProvider:
    name = "fake"

    def __init__(
        self, cfg: TenantConfig, scenario: Scenario = "normal", *, busy_every: int = 0
    ) -> None:
        """busy_every=N marks every Nth generated slot as already taken (0 = none)."""
        self._cfg = cfg
        self.scenario: Scenario = scenario
        self._busy_every = busy_every
        self.bookings: dict[str, dict] = {}  # provider_uid -> record
        self._taken: set[str] = set()  # slot ids no longer available
        self._raced = False
        self.calls: list[str] = []

    def _check_up(self) -> None:
        if self.scenario == "api_down":
            raise BookingProviderError("fake provider: service unavailable (503)")

    def _generate(self, q: SlotQuery) -> list[Slot]:
        tz = q.tz
        slots: list[Slot] = []
        day = q.start_utc.astimezone(tz).date()
        last = q.end_utc.astimezone(tz).date()
        index = 0
        while day <= last:
            if day not in self._cfg.business_hours.holidays:
                for r in self._cfg.business_hours.ranges(WEEKDAYS[day.weekday()]):
                    start = datetime.combine(day, r.open, tzinfo=tz)
                    close = datetime.combine(day, r.close, tzinfo=tz)
                    length = timedelta(minutes=q.slot_length_min)
                    while start + length <= close:
                        slot = Slot(
                            start.astimezone(q.start_utc.tzinfo),
                            (start + length).astimezone(q.start_utc.tzinfo),
                        )
                        index += 1
                        busy = self._busy_every and index % self._busy_every == 0
                        if q.start_utc <= slot.start_utc < q.end_utc and not busy:
                            slots.append(slot)
                        start += length
            day += timedelta(days=1)
        return slots

    async def available_slots(self, q: SlotQuery) -> list[Slot]:
        self.calls.append("available_slots")
        self._check_up()
        if self.scenario == "no_slots":
            return []
        booked = {r["slot_id"] for r in self.bookings.values() if r["status"] == "accepted"}
        return [s for s in self._generate(q) if s.slot_id not in self._taken | booked]

    async def create_booking(self, req: BookingRequest) -> BookingResult:
        self.calls.append("create_booking")
        self._check_up()
        if self.scenario == "race" and not self._raced:
            self._raced = True
            self._taken.add(req.slot.slot_id)
            return BookingResult("slot_unavailable", error="slot no longer available (fake race)")
        if req.slot.slot_id in self._taken or any(
            r["slot_id"] == req.slot.slot_id and r["status"] == "accepted"
            for r in self.bookings.values()
        ):
            return BookingResult("slot_unavailable", error="slot already booked")
        uid = "fake_" + hashlib.sha256(req.idempotency_key.encode()).hexdigest()[:12]
        record = {
            "uid": uid,
            "id": len(self.bookings) + 1,
            "status": "accepted",
            "slot_id": req.slot.slot_id,
            "start": req.slot.start_utc.isoformat(),
            "end": req.slot.end_utc.isoformat(),
            "metadata": {**req.metadata, "idempotency_key": req.idempotency_key},
            "attendee": {"name": req.attendee_name, "timeZone": req.attendee_tz},
        }
        self.bookings[uid] = record
        if self.scenario == "timeout_then_exists" and len(self.bookings) == 1:
            raise BookingOutcomeUnknown("fake provider: timed out after sending")
        return BookingResult(
            "success", uid, str(record["id"]), raw={"status": "success", "data": record}
        )

    async def find_by_idempotency_key(
        self, key: str, start_utc: datetime, end_utc: datetime
    ) -> BookingResult | None:
        self.calls.append("find_by_idempotency_key")
        self._check_up()
        for r in self.bookings.values():
            if r["metadata"].get("idempotency_key") == key and r["status"] == "accepted":
                return BookingResult("success", r["uid"], str(r["id"]), raw={"data": r})
        return None

    async def cancel_booking(self, provider_uid: str, reason: str) -> CancelResult:
        self.calls.append("cancel_booking")
        self._check_up()
        record = self.bookings.get(provider_uid)
        if record is None:
            return CancelResult(False, error="not found")
        record["status"] = "cancelled"
        record["cancellationReason"] = reason
        return CancelResult(True, raw={"status": "success", "data": record})
