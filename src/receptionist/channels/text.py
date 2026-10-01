"""Text channel: POST /v1/chat/{client_id} (DESIGN.md 2.3). Protocol only, no business logic."""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select

from receptionist.config.hours import is_open
from receptionist.db.models import Booking, CallbackRequest, Conversation, Message, ToolCall, Turn
from receptionist.engine.engine import (
    ConversationEnded,
    ConversationNotFound,
    EndConversation,
    Engine,
    TextChunk,
    TransferRequested,
    TurnInput,
)

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str | None = Field(default=None, max_length=2000)


class ChatMessage(BaseModel):
    text: str
    source: str


class ChatResponse(BaseModel):
    session_id: str
    messages: list[ChatMessage]
    ended: bool = False
    transfer_requested: bool = False
    llm_configured: bool = True


class RateLimiter:
    """In-memory token bucket per key (good enough for one process; DESIGN.md 9)."""

    def __init__(self, per_minute: int = 30) -> None:
        self.capacity = per_minute
        self.rate = per_minute / 60.0
        self._buckets: dict[str, tuple[float, float]] = defaultdict(
            lambda: (float(per_minute), time.monotonic())
        )

    def allow(self, key: str) -> bool:
        tokens, last = self._buckets[key]
        now = time.monotonic()
        tokens = min(self.capacity, tokens + (now - last) * self.rate)
        if tokens < 1:
            self._buckets[key] = (tokens, now)
            return False
        self._buckets[key] = (tokens - 1, now)
        return True


def _engine(request: Request, client_id: str) -> Engine:
    engine: Engine = request.app.state.engine
    if client_id not in engine.tenants:
        raise HTTPException(404, "unknown client_id")
    limiter: RateLimiter = request.app.state.rate_limiter
    ip = request.client.host if request.client else "unknown"
    if not limiter.allow(f"{ip}:{client_id}"):
        raise HTTPException(429, "too many requests")
    return engine


@router.post("/v1/chat/{client_id}", response_model=ChatResponse)
async def chat(client_id: str, body: ChatRequest, request: Request) -> ChatResponse:
    engine = _engine(request, client_id)
    messages: list[ChatMessage] = []
    session_id = body.session_id
    if session_id is None:
        started = await engine.start_conversation(client_id, channel="text")
        session_id = started.conversation_id
        messages.append(ChatMessage(text=started.greeting, source="system"))
    ended = transfer = False
    if body.message and body.message.strip():
        try:
            async for event in engine.run_turn(client_id, session_id, TurnInput(body.message)):
                if isinstance(event, TextChunk):
                    # Voice streams sentence chunks; chat shows one bubble per speaker stretch.
                    if messages and messages[-1].source == event.source == "llm":
                        messages[-1].text += " " + event.text
                    else:
                        messages.append(ChatMessage(text=event.text, source=event.source))
                elif isinstance(event, EndConversation):
                    ended = True
                elif isinstance(event, TransferRequested):
                    transfer = True
        except ConversationNotFound as exc:
            raise HTTPException(404, "unknown session_id") from exc
        except ConversationEnded as exc:
            raise HTTPException(409, "conversation has ended; start a new one") from exc
    return ChatResponse(
        session_id=session_id,
        messages=messages,
        ended=ended,
        transfer_requested=transfer,
        llm_configured=engine.llm is not None,
    )


@router.get("/v1/chat/{client_id}/sessions/{session_id}/debug")
async def debug(client_id: str, session_id: str, request: Request) -> dict[str, Any]:
    """Full state, tool timeline and turn metrics for the web chat's debug panel."""
    if request.app.state.settings.app_env == "production":
        raise HTTPException(404)
    engine: Engine = request.app.state.engine
    if client_id not in engine.tenants:
        raise HTTPException(404, "unknown client_id")
    cfg = engine.tenants[client_id].config
    async with engine.db.tenant_session(client_id) as s:
        conv = await s.get(Conversation, session_id)
        if conv is None:
            raise HTTPException(404, "unknown session_id")
        tools = (
            await s.scalars(
                select(ToolCall)
                .where(ToolCall.conversation_id == session_id)
                .order_by(ToolCall.created_at)
            )
        ).all()
        turns = (
            await s.scalars(
                select(Turn).where(Turn.conversation_id == session_id).order_by(Turn.turn_index)
            )
        ).all()
        msgs = (
            await s.scalars(
                select(Message).where(Message.conversation_id == session_id).order_by(Message.seq)
            )
        ).all()
        bookings = (
            await s.scalars(select(Booking).where(Booking.conversation_id == session_id))
        ).all()
        callbacks = (
            await s.scalars(
                select(CallbackRequest).where(CallbackRequest.conversation_id == session_id)
            )
        ).all()
    turn_index = {t.id: t.turn_index for t in turns}
    now = engine.clock.now(cfg.tz)
    return {
        "conversation": {
            "id": conv.id,
            "status": conv.status,
            "outcome": conv.outcome,
            "urgency": conv.urgency,
            "language": conv.language,
            "after_hours": conv.after_hours,
            "started_at_local": conv.started_at.astimezone(cfg.tz).isoformat(timespec="minutes"),
            "cost_usd": round(conv.llm_cost_usd, 5),
            "tokens_in": conv.tokens_in,
            "tokens_out": conv.tokens_out,
        },
        "clock": {
            "source": engine.clock.source,
            "local_now": now.strftime("%a %b %d, %I:%M %p %Z"),
            "open_now": is_open(cfg, now),
        },
        "state": conv.state_json,
        "tools": [
            {
                "turn": turn_index.get(t.turn_id or ""),
                "name": t.tool_name,
                "status": t.status,
                "reason": t.reason_code,
                "latency_ms": t.latency_ms,
                "args": t.args_json,
                "result": t.result_json,
            }
            for t in tools
        ],
        "turns": [
            {
                "turn": t.turn_index,
                "ttft_ms": t.ttft_ms,
                "first_audible_ms": t.first_audible_ms,
                "answer_first_chunk_ms": t.answer_first_chunk_ms,
                "answer_done_ms": t.answer_done_ms,
                "filler_used": t.filler_used,
                "tool_wait_ms": t.tool_wait_ms,
                "tokens_in": t.input_tokens,
                "tokens_out": t.output_tokens,
                "cost_usd": round(t.cost_usd, 5),
                "guard_triggers": t.guard_triggers,
            }
            for t in turns
        ],
        "transcript": [
            {"role": m.role, "text": m.content, "source": (m.meta or {}).get("source")}
            for m in msgs
            if m.role in ("user", "agent")
        ],
        "bookings": [
            {
                "id": b.id,
                "status": b.status,
                "start_local": b.start_utc.astimezone(cfg.tz).isoformat(timespec="minutes"),
                "provider": b.provider,
                "provider_uid": b.provider_booking_uid,
                "failure": b.failure_reason,
            }
            for b in bookings
        ],
        "callbacks": [
            {"reason": c.reason, "priority": c.priority, "language": c.language} for c in callbacks
        ],
    }
