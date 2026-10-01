"""Validated per-tenant configuration (DESIGN.md section 6.1)."""

from __future__ import annotations

import re
from datetime import date, time
from functools import cached_property
from itertools import pairwise
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import phonenumbers
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Slug = Annotated[str, Field(pattern=r"^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$")]
EnvVarName = Annotated[str, Field(pattern=r"^[A-Z][A-Z0-9_]*$")]
Weekday = Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
WEEKDAYS: tuple[Weekday, ...] = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")

_RANGE_RE = re.compile(r"^(\d{2}):(\d{2})-(\d{2}):(\d{2})$")


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class LocalizedText(_Strict):
    en: str = Field(min_length=1)
    es: str | None = None


class Business(_Strict):
    name: str = Field(min_length=1)
    trade: str = Field(min_length=1)
    city: str
    state: str = Field(pattern=r"^[A-Z]{2}$")
    phone_display: str | None = None
    website: str | None = None


class Owner(_Strict):
    name: str = Field(min_length=1)


class Notifications(_Strict):
    owner_email_env: EnvVarName


class TimeRange(_Strict):
    open: time
    close: time


def _parse_range(value: str) -> TimeRange:
    m = _RANGE_RE.match(value)
    if not m:
        raise ValueError(f"{value!r} is not 'HH:MM-HH:MM'")
    h1, m1, h2, m2 = (int(g) for g in m.groups())
    try:
        start, end = time(h1, m1), time(h2, m2)
    except ValueError as exc:
        raise ValueError(f"{value!r} has an invalid time") from exc
    if start >= end:
        raise ValueError(f"{value!r}: open must be before close (overnight ranges unsupported)")
    return TimeRange(open=start, close=end)


class BusinessHours(_Strict):
    mon: list[str] = []
    tue: list[str] = []
    wed: list[str] = []
    thu: list[str] = []
    fri: list[str] = []
    sat: list[str] = []
    sun: list[str] = []
    holidays: list[date] = []

    @model_validator(mode="after")
    def _check_ranges(self) -> BusinessHours:
        for day in WEEKDAYS:
            ranges = sorted((_parse_range(v) for v in getattr(self, day)), key=lambda r: r.open)
            for prev, nxt in pairwise(ranges):
                if nxt.open < prev.close:
                    raise ValueError(f"{day}: overlapping ranges")
        return self

    def ranges(self, day: Weekday) -> list[TimeRange]:
        return sorted((_parse_range(v) for v in getattr(self, day)), key=lambda r: r.open)


class Service(_Strict):
    id: Slug
    name: str
    bookable: bool = True


class ServiceArea(_Strict):
    cities: list[str] = Field(min_length=1)
    zip_codes: list[Annotated[str, Field(pattern=r"^\d{5}$")]] = []


class QuotableAmount(_Strict):
    label: str
    amount_usd: float = Field(gt=0)
    spoken: str


class PricingPolicy(_Strict):
    mode: Literal["no_quotes", "fixed_fees"]
    instruction: str
    deflection_line: str
    quotable_amounts: list[QuotableAmount] = []

    @model_validator(mode="after")
    def _amounts_match_mode(self) -> PricingPolicy:
        if self.mode == "no_quotes" and self.quotable_amounts:
            raise ValueError("quotable_amounts must be empty when mode is 'no_quotes'")
        if self.mode == "fixed_fees" and not self.quotable_amounts:
            raise ValueError("fixed_fees mode needs at least one quotable amount")
        return self


class EmergencyMatch(_Strict):
    any: list[str] = []
    all_of: list[list[str]] = []

    @model_validator(mode="after")
    def _not_empty(self) -> EmergencyMatch:
        if not self.any and not self.all_of:
            raise ValueError("an emergency rule needs 'any' or 'all_of' phrases")
        if any(len(group) == 0 for group in self.all_of):
            raise ValueError("all_of groups must not be empty")
        return self


class EmergencyRule(_Strict):
    id: Slug
    label: str
    urgency: Literal["emergency", "urgent"]
    match: EmergencyMatch
    safety_script: LocalizedText | None = None
    alert_on_call: bool = False


class OnCall(_Strict):
    name: str
    phone_e164: str
    email_env: EnvVarName
    is_dummy: bool = False

    @field_validator("phone_e164")
    @classmethod
    def _e164(cls, v: str) -> str:
        try:
            parsed = phonenumbers.parse(v, None)
        except phonenumbers.NumberParseException as exc:
            raise ValueError(f"{v!r} is not a valid E.164 number") from exc
        formatted = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        if formatted != v or not phonenumbers.is_possible_number(parsed):
            raise ValueError(f"{v!r} is not a valid E.164 number")
        return v


class AttendeeEmailPolicy(_Strict):
    placeholder_local_part: Annotated[str, Field(pattern=r"^[a-z0-9][a-z0-9._-]*$")]
    placeholder_domain_env: EnvVarName


class BookingSettings(_Strict):
    provider: Literal["fake", "calcom"]
    calendar_owner: Literal["demo_owner", "tenant"]
    api_key_env: EnvVarName | None = None
    event_type_id_env: EnvVarName | None = None
    slot_length_min: int = Field(ge=15, le=480)
    earliest_slot: Literal["next_business_day_open", "lead_time_only"]
    lead_time_min: int = Field(ge=0, le=7 * 24 * 60)
    max_days_ahead: int = Field(ge=1, le=60)
    offer_count: int = Field(ge=1, le=2)
    attendee_email: AttendeeEmailPolicy

    @model_validator(mode="after")
    def _calcom_needs_env(self) -> BookingSettings:
        if self.provider == "calcom" and not (self.api_key_env and self.event_type_id_env):
            raise ValueError("calcom provider needs api_key_env and event_type_id_env")
        return self


class TransferSettings(_Strict):
    enabled: bool = False
    number_e164: str | None = None
    demo_simulate: bool = True


class VoiceSettings(_Strict):
    retell_agent_id_env: EnvVarName | None = None
    ws_token_env: EnvVarName | None = None


class LanguageSupport(_Strict):
    en: Literal["full"] = "full"
    es: Literal["none", "callback_only", "full"] = "callback_only"


class BrandVoice(_Strict):
    description: str
    sample_phrases: list[str] = []


class Faq(_Strict):
    q: str
    a: str


class Metrics(_Strict):
    avg_job_value_usd: float = Field(gt=0)


class DemoSettings(_Strict):
    enabled: bool
    built_for: str | None = None
    banner: str | None = None


class TenantConfig(_Strict):
    schema_version: Literal[1]
    client_id: Slug
    business: Business
    owners: list[Owner] = Field(min_length=1)
    notifications: Notifications
    timezone: str
    business_hours: BusinessHours
    agent_mode: Literal["after_hours", "overflow", "after_hours_and_overflow", "always"]
    services: list[Service] = Field(min_length=1)
    service_area: ServiceArea
    pricing_policy: PricingPolicy
    emergency_rules: list[EmergencyRule] = []
    on_call: OnCall
    booking: BookingSettings
    transfer: TransferSettings = TransferSettings()
    voice: VoiceSettings = VoiceSettings()
    language_support: LanguageSupport = LanguageSupport()
    brand_voice: BrandVoice
    faqs: list[Faq] = []
    forbidden_topics: list[str] = []
    disclosure: LocalizedText
    metrics: Metrics
    demo: DemoSettings
    todos: list[str] = []

    @field_validator("timezone")
    @classmethod
    def _valid_tz(cls, v: str) -> str:
        try:
            ZoneInfo(v)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError(f"{v!r} is not a valid IANA timezone") from exc
        return v

    @model_validator(mode="after")
    def _cross_field(self) -> TenantConfig:
        if self.demo.enabled and self.booking.calendar_owner == "tenant":
            raise ValueError(
                "booking.calendar_owner='tenant' is not allowed while demo.enabled: "
                "demo bookings must go to the demo owner's calendar"
            )
        ids = [r.id for r in self.emergency_rules]
        if len(ids) != len(set(ids)):
            raise ValueError("emergency_rules ids must be unique")
        service_ids = [s.id for s in self.services]
        if len(service_ids) != len(set(service_ids)):
            raise ValueError("services ids must be unique")
        if self.transfer.enabled and not self.transfer.number_e164:
            raise ValueError("transfer.enabled requires transfer.number_e164")
        return self

    @cached_property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)
