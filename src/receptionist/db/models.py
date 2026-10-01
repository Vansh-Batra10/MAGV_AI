"""ORM models (DESIGN.md section 4). Portable types only: these must run on SQLite and Postgres."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from receptionist.clock import real_utc_now
from receptionist.db.base import Base, TenantOwned, TimestampMixin, UTCDateTime, uuid_pk

JsonDict = dict[str, Any]


class Tenant(TimestampMixin, Base):
    """Mirror of a tenant JSON file. The file is the source of truth; this row anchors FKs."""

    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    timezone: Mapped[str] = mapped_column(String(64))
    config_hash: Mapped[str] = mapped_column(String(32))
    config_json: Mapped[JsonDict] = mapped_column(JSON)


class Conversation(TenantOwned, TimestampMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("tenant_id", "channel", "external_id"),
        Index("ix_conversations_tenant_started", "tenant_id", "started_at"),
        Index("ix_conversations_tenant_outcome", "tenant_id", "outcome"),
        Index("ix_conversations_tenant_urgency", "tenant_id", "urgency"),
    )

    id: Mapped[str] = uuid_pk()
    channel: Mapped[str] = mapped_column(String(16))  # text | voice
    external_id: Mapped[str | None] = mapped_column(String(128))  # Retell call_id
    status: Mapped[str] = mapped_column(String(16), default="active")
    config_hash: Mapped[str] = mapped_column(String(32))
    language: Mapped[str] = mapped_column(String(8), default="en")
    state_json: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    # Domain timestamps come from the injected Clock (follow DEMO_NOW in demo mode).
    started_at: Mapped[datetime] = mapped_column(UTCDateTime())
    ended_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    real_started_at: Mapped[datetime] = mapped_column(UTCDateTime())
    clock_source: Mapped[str] = mapped_column(String(8), default="system")
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    after_hours: Mapped[bool] = mapped_column(Boolean, default=False)
    outcome: Mapped[str | None] = mapped_column(String(32))
    urgency: Mapped[str | None] = mapped_column(String(16))
    caller_name: Mapped[str | None] = mapped_column(String(200))
    caller_phone_e164: Mapped[str | None] = mapped_column(String(20))
    caller_email: Mapped[str | None] = mapped_column(String(320))
    service_address: Mapped[str | None] = mapped_column(String(500))
    recording_url: Mapped[str | None] = mapped_column(Text)
    public_log_url: Mapped[str | None] = mapped_column(Text)
    disconnection_reason: Mapped[str | None] = mapped_column(String(64))
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    llm_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    demo: Mapped[bool] = mapped_column(Boolean, default=False)


class Message(TenantOwned, Base):
    __tablename__ = "messages"
    __table_args__ = (UniqueConstraint("conversation_id", "seq"),)

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    seq: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(16))  # user | agent | tool | system
    content: Mapped[str] = mapped_column(Text, default="")
    tool_name: Mapped[str | None] = mapped_column(String(64))
    tool_call_id: Mapped[str | None] = mapped_column(String(64))
    interrupted: Mapped[bool] = mapped_column(Boolean, default=False)
    turn_id: Mapped[str | None] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=real_utc_now)


class Turn(TenantOwned, Base):
    __tablename__ = "turns"
    __table_args__ = (Index("ix_turns_conversation_index", "conversation_id", "turn_index"),)

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    turn_index: Mapped[int] = mapped_column(Integer)
    channel_response_id: Mapped[int | None] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(16))  # user_message | reminder | begin
    model: Mapped[str | None] = mapped_column(String(64))
    t_received: Mapped[datetime] = mapped_column(UTCDateTime())
    ttft_ms: Mapped[int | None] = mapped_column(Integer)
    first_audible_ms: Mapped[int | None] = mapped_column(Integer)
    answer_first_chunk_ms: Mapped[int | None] = mapped_column(Integer)
    answer_done_ms: Mapped[int | None] = mapped_column(Integer)
    filler_used: Mapped[bool] = mapped_column(Boolean, default=False)
    tool_wait_ms: Mapped[int | None] = mapped_column(Integer)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cache_read_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cache_write_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    guard_triggers: Mapped[list[str]] = mapped_column(JSON, default=list)


class ToolCall(TenantOwned, Base):
    """Audit log of every tool call the LLM proposed, including rejected ones."""

    __tablename__ = "tool_calls"
    __table_args__ = (
        Index("ix_tool_calls_conversation_created", "conversation_id", "created_at"),
        Index("ix_tool_calls_tenant_tool_created", "tenant_id", "tool_name", "created_at"),
    )

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    turn_id: Mapped[str | None] = mapped_column(String(36))
    tool_name: Mapped[str] = mapped_column(String(64))
    args_json: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    result_json: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(16))  # ok | rejected | error
    reason_code: Mapped[str | None] = mapped_column(String(64))
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=real_utc_now)


class Booking(TenantOwned, TimestampMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (Index("ix_bookings_tenant_start", "tenant_id", "start_utc"),)

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    provider: Mapped[str] = mapped_column(String(16))  # calcom | fake
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)
    # = conversation_id while pending/confirmed/unknown, else NULL. Unique => at most one
    # active booking per conversation, portable across SQLite and Postgres (NULLs never collide).
    active_guard: Mapped[str | None] = mapped_column(String(36), unique=True)
    status: Mapped[str] = mapped_column(String(16))
    provider_booking_uid: Mapped[str | None] = mapped_column(String(128))
    provider_booking_id: Mapped[str | None] = mapped_column(String(64))
    event_type_id: Mapped[str | None] = mapped_column(String(64))
    start_utc: Mapped[datetime] = mapped_column(UTCDateTime())
    end_utc: Mapped[datetime] = mapped_column(UTCDateTime())
    attendee_name: Mapped[str] = mapped_column(String(200))
    attendee_phone_e164: Mapped[str] = mapped_column(String(20))
    attendee_email: Mapped[str | None] = mapped_column(String(320))
    attendee_email_is_placeholder: Mapped[bool] = mapped_column(Boolean, default=False)
    service_address: Mapped[str] = mapped_column(String(500))
    raw_request_json: Mapped[JsonDict | None] = mapped_column(JSON)
    raw_response_json: Mapped[JsonDict | None] = mapped_column(JSON)
    failure_reason: Mapped[str | None] = mapped_column(String(64))


class CallbackRequest(TenantOwned, TimestampMixin, Base):
    __tablename__ = "callback_requests"
    __table_args__ = (Index("ix_callback_requests_tenant_status", "tenant_id", "status"),)

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    reason: Mapped[str] = mapped_column(String(64))
    priority: Mapped[str] = mapped_column(String(16), default="normal")
    preferred_window: Mapped[str | None] = mapped_column(String(200))
    phone_e164: Mapped[str | None] = mapped_column(String(20))
    phone_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    language: Mapped[str] = mapped_column(String(8), default="en")
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="open")


class Lead(TenantOwned, TimestampMixin, Base):
    __tablename__ = "leads"
    __table_args__ = (Index("ix_leads_tenant_created", "tenant_id", "created_at"),)

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    name: Mapped[str | None] = mapped_column(String(200))
    phone_e164: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(320))
    interest: Mapped[str | None] = mapped_column(Text)


class Alert(TenantOwned, TimestampMixin, Base):
    __tablename__ = "alerts"

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    kind: Mapped[str] = mapped_column(String(32))  # on_call
    channel: Mapped[str] = mapped_column(String(32))  # email | sms_simulated
    status: Mapped[str] = mapped_column(String(16))
    dedupe_key: Mapped[str] = mapped_column(String(128), unique=True)


class Summary(TenantOwned, TimestampMixin, Base):
    __tablename__ = "summaries"

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), unique=True)
    schema_version: Mapped[int] = mapped_column(Integer)
    summary_json: Mapped[JsonDict] = mapped_column(JSON)
    summary_text: Mapped[str] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(64))
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)


class OutboundEmail(TenantOwned, TimestampMixin, Base):
    __tablename__ = "outbound_emails"

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str | None] = mapped_column(ForeignKey("conversations.id"))
    kind: Mapped[str] = mapped_column(String(32))
    to_hash: Mapped[str] = mapped_column(String(64))
    message_id: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(16))
    dedupe_key: Mapped[str] = mapped_column(String(128), unique=True)
    error: Mapped[str | None] = mapped_column(Text)


# --- System tables: processed across tenants by infrastructure code (system session only). ---


class Job(TimestampMixin, Base):
    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_status_run_after", "status", "run_after"),)

    id: Mapped[str] = uuid_pk()
    tenant_id: Mapped[str | None] = mapped_column(ForeignKey("tenants.id"))
    kind: Mapped[str] = mapped_column(String(64))
    payload_json: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    dedupe_key: Mapped[str] = mapped_column(String(160), unique=True)
    status: Mapped[str] = mapped_column(String(16), default="queued")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=6)
    run_after: Mapped[datetime] = mapped_column(UTCDateTime())
    locked_by: Mapped[str | None] = mapped_column(String(64))
    locked_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    last_error: Mapped[str | None] = mapped_column(Text)


class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    __table_args__ = (UniqueConstraint("provider", "event_type", "external_id"),)

    id: Mapped[str] = uuid_pk()
    provider: Mapped[str] = mapped_column(String(32))
    event_type: Mapped[str] = mapped_column(String(64))
    external_id: Mapped[str] = mapped_column(String(128))
    tenant_id: Mapped[str | None] = mapped_column(ForeignKey("tenants.id"))
    payload_json: Mapped[JsonDict] = mapped_column(JSON)
    received_at: Mapped[datetime] = mapped_column(UTCDateTime())
    processed_at: Mapped[datetime | None] = mapped_column(UTCDateTime())


TENANT_OWNED_MODELS: tuple[type[Base], ...] = (
    Conversation,
    Message,
    Turn,
    ToolCall,
    Booking,
    CallbackRequest,
    Lead,
    Alert,
    Summary,
    OutboundEmail,
)
