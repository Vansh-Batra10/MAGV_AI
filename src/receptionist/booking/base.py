"""Booking provider interface (DESIGN.md section 5)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal, Protocol
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class Slot:
    start_utc: datetime
    end_utc: datetime

    @property
    def slot_id(self) -> str:
        return self.start_utc.strftime("%Y%m%dT%H%MZ")


@dataclass(frozen=True)
class SlotQuery:
    start_utc: datetime
    end_utc: datetime
    tz: ZoneInfo
    slot_length_min: int


@dataclass(frozen=True)
class BookingRequest:
    idempotency_key: str
    slot: Slot
    attendee_name: str
    attendee_phone_e164: str
    attendee_email: str | None
    attendee_tz: str
    service_address: str
    notes: str
    metadata: dict[str, str] = field(default_factory=dict)


BookingStatus = Literal["success", "slot_unavailable", "invalid", "error"]


@dataclass(frozen=True)
class BookingResult:
    status: BookingStatus
    provider_uid: str | None = None
    provider_id: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


@dataclass(frozen=True)
class CancelResult:
    ok: bool
    raw: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


class BookingProviderError(Exception):
    """The provider could not be reached or failed (breaker-worthy)."""


class BookingOutcomeUnknown(BookingProviderError):
    """A create request may or may not have succeeded (timeout after sending)."""


class BookingProvider(Protocol):
    name: str

    async def available_slots(self, q: SlotQuery) -> list[Slot]: ...

    async def create_booking(self, req: BookingRequest) -> BookingResult: ...

    async def find_by_idempotency_key(
        self, key: str, start_utc: datetime, end_utc: datetime
    ) -> BookingResult | None: ...

    async def cancel_booking(self, provider_uid: str, reason: str) -> CancelResult: ...
