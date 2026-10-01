"""The channel-agnostic conversation engine (DESIGN.md sections 2.2, 3, 7, 8).

A channel calls `start_conversation` once, then `run_turn` per caller utterance, and relays
the EngineEvents it yields (text chunks to speak or show, tool events, end/transfer).
"""

from __future__ import annotations

import asyncio
import json
import re
import time
import uuid
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from typing import Any, Literal

from sqlalchemy import select

from receptionist.adapters.llm.base import (
    LLMError,
    LLMProvider,
    LLMRequest,
    Stop,
    TextDelta,
    ToolUse,
    ToolUseStart,
    Usage,
)
from receptionist.booking.registry import BookingProviders
from receptionist.clock import Clock, real_utc_now
from receptionist.config.hours import is_open
from receptionist.config.loader import TenantRegistry
from receptionist.db.models import Conversation, Message, Turn
from receptionist.db.session import Database
from receptionist.engine import language
from receptionist.engine.context import TurnContext
from receptionist.engine.fillers import EXTERNAL_TOOLS, pick_filler
from receptionist.engine.guards import OutputGuard, SentenceChunker
from receptionist.engine.history import build_messages, with_state
from receptionist.engine.locales import Locale, load_locale
from receptionist.engine.prompts import state_block, system_blocks
from receptionist.engine.speech import find_phone, last_four, normalize_phone, read_back_phone
from receptionist.engine.state import ConversationState, Phase
from receptionist.engine.urgency import assess, max_urgency
from receptionist.logging import get_logger
from receptionist.settings import Settings
from receptionist.tools.gateway import execute_tool
from receptionist.tools.specs import TOOL_SPECS

log = get_logger(__name__)
Source = Literal["llm", "filler", "system"]
_YES_RE = re.compile(
    r"\b(yes|yeah|yep|yup|correct|right|that's it|sí|si|correcto|claro|exacto|eso es)\b", re.I
)


# --- events ----------------------------------------------------------------------------


@dataclass(frozen=True)
class TextChunk:
    text: str
    source: Source


@dataclass(frozen=True)
class ToolEvent:
    name: str
    status: str
    reason_code: str | None
    latency_ms: int


@dataclass(frozen=True)
class EndConversation:
    reason: str


@dataclass(frozen=True)
class TransferRequested:
    simulated: bool


EngineEvent = TextChunk | ToolEvent | EndConversation | TransferRequested


@dataclass(frozen=True)
class TurnInput:
    text: str
    kind: Literal["user_message", "reminder"] = "user_message"


@dataclass(frozen=True)
class StartResult:
    conversation_id: str
    greeting: str


class ConversationNotFound(LookupError):
    pass


class ConversationEnded(RuntimeError):
    pass


# --- outcome --------------------------------------------------------------------------


def compute_outcome(state: ConversationState) -> tuple[str, str | None]:
    if state.flags.spam_suspected:
        return "spam", None
    if state.flags.on_call_alerted:
        return "emergency_escalated", None
    if state.booking.status == "confirmed":
        return "booked", None
    if state.callback.requested:
        return "callback", state.callback.reason
    return "info_only", None


# --- per-turn bookkeeping -----------------------------------------------------------------


@dataclass
class TurnMetrics:
    t0: float = field(default_factory=time.perf_counter)
    ttft_ms: int | None = None
    first_audible_ms: int | None = None
    answer_first_chunk_ms: int | None = None
    answer_done_ms: int | None = None
    round_first_llm_chunk_ms: int | None = None
    filler_used: bool = False
    tool_wait_ms: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0
    cost_usd: float = 0.0
    model: str | None = None
    guard_triggers: list[str] = field(default_factory=list)

    def ms(self) -> int:
        return int((time.perf_counter() - self.t0) * 1000)


class Recorder:
    """Appends transcript rows in order. LLM text is buffered into one row per stretch."""

    def __init__(self, conv: Conversation, turn_id: str, next_seq: int) -> None:
        self.conv = conv
        self.turn_id = turn_id
        self.seq = next_seq
        self.rows: list[Message] = []
        self._llm_buf: list[str] = []

    def _add(self, role: str, content: str, **kw: Any) -> Message:
        row = Message(
            tenant_id=self.conv.tenant_id,
            conversation_id=self.conv.id,
            seq=self.seq,
            role=role,
            content=content,
            turn_id=self.turn_id,
            **kw,
        )
        self.seq += 1
        self.rows.append(row)
        return row

    def user(self, text: str) -> Message:
        return self._add("user", text, meta={})

    def llm_text(self, text: str) -> None:
        self._llm_buf.append(text)

    def flush_llm(self) -> None:
        if self._llm_buf:
            self._add("agent", " ".join(self._llm_buf), meta={"source": "llm"})
            self._llm_buf = []

    def agent(self, text: str, source: Source) -> None:
        self.flush_llm()
        self._add("agent", text, meta={"source": source})

    def tool_use(self, tu: ToolUse) -> None:
        self.flush_llm()
        self._add("tool_use", json.dumps(tu.input), tool_name=tu.name, tool_call_id=tu.id)

    def tool_result(self, tu: ToolUse, result: dict[str, Any], is_error: bool) -> None:
        self._add(
            "tool_result",
            json.dumps(result, default=str),
            tool_name=tu.name,
            tool_call_id=tu.id,
            meta={"is_error": is_error},
        )


# --- engine ---------------------------------------------------------------------------


class Engine:
    def __init__(
        self,
        *,
        settings: Settings,
        tenants: TenantRegistry,
        clock: Clock,
        db: Database,
        llm: LLMProvider | None,
        bookings: BookingProviders,
    ) -> None:
        self.settings = settings
        self.tenants = tenants
        self.clock = clock
        self.db = db
        self.llm = llm
        self.bookings = bookings

    def locale(self, lang: str) -> Locale:
        return load_locale(self.settings.locales_dir, lang)

    # -- start ---------------------------------------------------------------------------

    async def start_conversation(
        self,
        client_id: str,
        *,
        channel: Literal["text", "voice"],
        external_id: str | None = None,
        caller_id_phone: str | None = None,
    ) -> StartResult:
        tenant = self.tenants[client_id]
        cfg = tenant.config
        now = self.clock.now(cfg.tz)
        state = ConversationState(phase=Phase.TRIAGE)
        state.flags.disclosure_given = True
        if caller_id_phone and (e164 := normalize_phone(caller_id_phone)):
            state.caller.phone_e164, state.caller.phone_from_caller_id = e164, True
        greeting = f"{cfg.disclosure.en} {self.locale('en').t('lines.greeting_prompt')}"
        conv = Conversation(
            tenant_id=client_id,
            channel=channel,
            external_id=external_id,
            config_hash=tenant.config_hash,
            started_at=now,
            real_started_at=real_utc_now(),
            clock_source=self.clock.source,
            after_hours=not is_open(cfg, now),
            demo=cfg.demo.enabled,
            caller_phone_e164=state.caller.phone_e164,
            state_json=state.model_dump(mode="json"),
        )
        async with self.db.tenant_session(client_id) as session:
            session.add(conv)
            await session.flush()
            session.add(
                Message(
                    tenant_id=client_id,
                    conversation_id=conv.id,
                    seq=0,
                    role="agent",
                    content=greeting,
                    meta={"source": "system", "kind": "greeting"},
                )
            )
            await session.commit()
        log.info(
            "conversation_started",
            tenant_id=client_id,
            conversation_id=conv.id,
            channel=channel,
            after_hours=conv.after_hours,
        )
        return StartResult(conv.id, greeting)

    # -- turn ----------------------------------------------------------------------------

    async def run_turn(
        self, client_id: str, conversation_id: str, turn: TurnInput
    ) -> AsyncIterator[EngineEvent]:
        """Process one caller turn, yielding events as they happen."""
        queue: asyncio.Queue[EngineEvent | None] = asyncio.Queue()
        task = asyncio.create_task(
            self._process(client_id, conversation_id, turn, queue.put_nowait)
        )
        task.add_done_callback(lambda _: queue.put_nowait(None))
        try:
            while (event := await queue.get()) is not None:
                yield event
        finally:
            await asyncio.shield(task)  # persist the turn even if the consumer stops early

    async def _process(
        self,
        client_id: str,
        conversation_id: str,
        turn: TurnInput,
        emit: Callable[[EngineEvent], None],
    ) -> None:
        tenant = self.tenants[client_id]
        provider, breaker = self.bookings.get(client_id)
        async with self.db.tenant_session(client_id) as session:
            conv = await session.get(Conversation, conversation_id)
            if conv is None:
                raise ConversationNotFound(conversation_id)
            if conv.status != "active":
                raise ConversationEnded(conversation_id)
            state = ConversationState.model_validate(conv.state_json)
            history = list(
                (
                    await session.scalars(
                        select(Message)
                        .where(Message.conversation_id == conversation_id)
                        .order_by(Message.seq)
                    )
                ).all()
            )
            turn_id = str(uuid.uuid4())
            recorder = Recorder(conv, turn_id, (history[-1].seq + 1) if history else 0)
            last_agent = []
            for row in reversed(history):
                if row.role == "user":
                    break
                if row.role == "agent":
                    last_agent.insert(0, row.content)
            state.turns += 1
            ctx = TurnContext(
                tenant=tenant,
                conversation_id=conversation_id,
                session=session,
                state=state,
                clock=self.clock,
                booking=provider,
                breaker=breaker,
                locale=self.locale("en"),
                settings=self.settings,
                turn_id=turn_id,
                turn_index=state.turns,
                last_agent_text=" ".join(last_agent),
                current_user_text=turn.text,
            )
            runner = _TurnRunner(self, ctx, recorder, history, emit, turn.kind)
            try:
                await runner.run(turn)
            finally:
                await runner.persist(conv)
                await session.commit()


class _TurnRunner:
    def __init__(
        self,
        engine: Engine,
        ctx: TurnContext,
        recorder: Recorder,
        history: list[Message],
        emit: Callable[[EngineEvent], None],
        kind: str,
    ) -> None:
        self.e = engine
        self.kind = kind
        self.ctx = ctx
        self.rec = recorder
        self.history = history
        self._emit = emit
        self.m = TurnMetrics()
        self.ended: str | None = None
        self.llm_called = False
        self.pre_llm_system_lines: list[str] = []
        self.filler_count = 0
        self.user_row: Message | None = None
        st = ctx.state
        self.guard = OutputGuard(
            ctx.cfg,
            booking_confirmed=st.booking.status == "confirmed",
            blocked_line=ctx.locale.t("lines.booked_claim_blocked"),
        )

    @property
    def state(self) -> ConversationState:
        return self.ctx.state

    # -- emitting -------------------------------------------------------------------------

    def _mark_audible(self) -> None:
        now = self.m.ms()
        if self.m.first_audible_ms is None:
            self.m.first_audible_ms = now
        self.m.answer_done_ms = now

    def say(self, text: str, source: Source) -> None:
        """Speak a deterministic line (filler or system)."""
        self._mark_audible()
        self.rec.agent(text, source)
        if source == "system" and not self.llm_called:
            self.pre_llm_system_lines.append(text)
        self._emit(TextChunk(text, source))

    def _say_llm(self, chunk: str) -> None:
        result = self.guard.check(chunk)
        self.m.guard_triggers.extend(result.triggers)
        if result.triggers:
            log.warning("guard_triggered", triggers=result.triggers)
        if not result.text:
            return
        self._mark_audible()
        if self.m.round_first_llm_chunk_ms is None:
            self.m.round_first_llm_chunk_ms = self.m.ms()
        self.rec.llm_text(result.text)
        self._emit(TextChunk(result.text, "llm"))

    # -- main flow ------------------------------------------------------------------------

    async def run(self, turn: TurnInput) -> None:
        st, ctx = self.state, self.ctx
        self.user_row = self.rec.user(turn.text)
        st.caller_text.append(turn.text)
        if (
            not st.capture.active
            and ctx.cfg.language_support.es == "callback_only"
            and st.language == "en"
            and language.detect(turn.text).language == "es"
        ):
            st.language = "es"
            log.info("language_detected", language="es")

        await self._apply_rules()  # safety first, in every flow

        if st.capture.active:
            if await self._capture_step(turn.text):
                return
        elif st.language == "es" and ctx.cfg.language_support.es == "callback_only":
            await self._start_capture("language_es", "es")
            return
        if self.e.llm is None:
            self.say(ctx.locale.t("lines.llm_fallback_callback"), "system")
            await self._start_capture("llm_failure", "en", intro=False)
            return
        await self._llm_loop()

    async def _apply_rules(self) -> None:
        """Deterministic urgency floor, safety scripts and on-call alert (DESIGN.md 3.8)."""
        st, ctx = self.state, self.ctx
        result = assess(ctx.cfg, " ".join(st.caller_text), ctx.now_local.date())
        st.urgency.rule_floor = result.level
        st.urgency.matched_rules = [m.rule_id for m in result.matches]
        new_level = max_urgency(st.urgency.level, result.level)
        if new_level != st.urgency.level:
            st.urgency.level, st.urgency.source = new_level, "rule"
        for rule_id, script in result.safety_scripts:
            if rule_id in st.flags.safety_scripts_given:
                continue
            line = script.es if st.language == "es" and script.es else script.en
            self.say(line, "system")
            st.flags.safety_scripts_given.append(rule_id)
            st.phase = Phase.SAFETY
        if result.alert_on_call and not st.flags.on_call_alerted:
            labels = ", ".join(m.label for m in result.matches if m.urgency == "emergency")
            await self._tool("alert_on_call", {"summary": f"Rule match: {labels}"}, "engine")

    async def _tool(self, name: str, args: dict[str, Any], source: str) -> Any:
        outcome, latency = await execute_tool(self.ctx, name, args, source=source)
        if name in EXTERNAL_TOOLS:
            self.m.tool_wait_ms += latency
        self._emit(ToolEvent(name, outcome.status, outcome.reason_code, latency))
        return outcome

    # -- LLM loop -------------------------------------------------------------------------

    async def _llm_loop(self) -> None:
        st, ctx, s = self.state, self.ctx, self.e.settings
        assert self.e.llm is not None
        for round_no in range(s.max_tool_rounds + 1):
            if round_no == s.max_tool_rounds:
                self.say(ctx.locale.t("lines.hold_too_long"), "system")
                if st.caller.phone_e164 and not st.callback.requested:
                    await self._tool("request_callback", {"reason": "turn_limit"}, "engine")
                return
            self._note_pre_llm_speech()
            self.llm_called = True
            request = LLMRequest(
                purpose="live_turn",
                system=system_blocks(ctx.cfg),
                messages=with_state(
                    build_messages([*self.history, *self.rec.rows]),
                    state_block(ctx.cfg, st, ctx.now_local),
                ),
                tools=TOOL_SPECS,
                max_tokens=300,
                timeout_s=s.llm_live_timeout_s,
            )
            self.m.round_first_llm_chunk_ms = None
            try:
                tool_uses, stop = await self._stream(request)
            except LLMError as exc:
                await self._llm_failed(exc)
                return
            st.llm_failures_in_a_row = 0
            if self.m.round_first_llm_chunk_ms is not None:
                self.m.answer_first_chunk_ms = self.m.round_first_llm_chunk_ms
            if stop.reason in ("refusal", "max_tokens") and tool_uses:
                log.warning("llm_stop_unusable", stop_reason=stop.reason)
                tool_uses = []
            if not tool_uses:
                self.rec.flush_llm()
                return
            for tu in tool_uses:
                self.rec.tool_use(tu)
            for tu in tool_uses:
                outcome = await self._tool(tu.name, tu.input, "llm")
                self.rec.tool_result(tu, outcome.result, outcome.status != "ok")
                for line in outcome.speak:
                    self.say(line, "system")
                if outcome.end_conversation:
                    self.ended = outcome.end_conversation
                if outcome.transfer:
                    self._emit(TransferRequested(simulated=False))
            self.guard.booking_confirmed = st.booking.status == "confirmed"
            if self.ended:
                return

    def _note_pre_llm_speech(self) -> None:
        if self.pre_llm_system_lines and self.user_row is not None:
            self.user_row.meta = {
                **(self.user_row.meta or {}),
                "llm_note": " ".join(self.pre_llm_system_lines),
            }

    async def _stream(self, request: LLMRequest) -> tuple[list[ToolUse], Stop]:
        assert self.e.llm is not None
        attempt = 0
        while True:
            chunker = SentenceChunker()
            tool_uses: list[ToolUse] = []
            stop = Stop("end_turn", [])
            spoke_before = self.m.answer_done_ms
            try:
                async for ev in self.e.llm.stream(request):
                    if isinstance(ev, TextDelta):
                        if self.m.ttft_ms is None:
                            self.m.ttft_ms = self.m.ms()
                        for chunk in chunker.feed(ev.text):
                            self._say_llm(chunk)
                    elif isinstance(ev, ToolUseStart):
                        for chunk in chunker.flush():
                            self._say_llm(chunk)
                        if ev.name in EXTERNAL_TOOLS:
                            self._filler(ev.name)
                    elif isinstance(ev, ToolUse):
                        tool_uses.append(ev)
                    elif isinstance(ev, Usage):
                        self._usage(ev)
                    elif isinstance(ev, Stop):
                        stop = ev
                for chunk in chunker.flush():
                    self._say_llm(chunk)
                return tool_uses, stop
            except LLMError as exc:
                nothing_spoken = self.m.answer_done_ms == spoke_before
                if attempt == 0 and exc.retryable and nothing_spoken:
                    attempt += 1
                    log.warning("llm_retry", error=str(exc))
                    continue
                raise

    def _filler(self, tool: str) -> None:
        st = self.state
        line = pick_filler(
            self.ctx.locale,
            tool,
            seed=f"{self.ctx.conversation_id}:{self.ctx.turn_index}",
            last_used=st.last_filler,
            second_in_turn=self.filler_count > 0,
        )
        self.filler_count += 1
        st.last_filler = line
        self.m.filler_used = True
        self.say(line, "filler")

    def _usage(self, u: Usage) -> None:
        self.m.model = u.model
        self.m.input_tokens += u.input_tokens
        self.m.output_tokens += u.output_tokens
        self.m.cache_read_tokens += u.cache_read_tokens
        self.m.cache_write_tokens += u.cache_write_tokens
        price = self.e.settings.model_prices.get(u.model)
        if price:
            self.m.cost_usd += (
                u.input_tokens * price.input
                + u.output_tokens * price.output
                + u.cache_read_tokens * price.cache_read
                + u.cache_write_tokens * price.cache_write
            ) / 1_000_000

    async def _llm_failed(self, exc: LLMError) -> None:
        st = self.state
        st.llm_failures_in_a_row += 1
        log.error("llm_failed", error=str(exc), failures_in_a_row=st.llm_failures_in_a_row)
        self.rec.flush_llm()
        if st.llm_failures_in_a_row >= 2:
            await self._start_capture("llm_failure", "en")
        else:
            self.say(self.ctx.locale.t("lines.llm_retry"), "system")

    # -- deterministic callback capture (Spanish, LLM failure) --------------------------

    async def _start_capture(self, reason: str, lang: str, *, intro: bool = True) -> None:
        st = self.state
        cap = st.capture
        cap.active, cap.reason, cap.attempts = True, reason, 0
        loc = self.e.locale(lang)
        lines = []
        if intro:
            lines.append(loc.t("capture.intro", business=self.ctx.cfg.business.name))
        if st.caller.phone_e164:
            cap.candidate_phone, cap.step = st.caller.phone_e164, "await_confirm"
            lines.append(
                loc.t("capture.confirm_caller_id", last4=last_four(st.caller.phone_e164, lang))
            )
        else:
            cap.step = "await_number"
            lines.append(loc.t("capture.ask_number"))
        st.phase = Phase.LANGUAGE_CALLBACK if reason == "language_es" else Phase.CALLBACK
        self.say(" ".join(lines), "system")

    async def _capture_step(self, text: str) -> bool:
        """Advance the capture flow. Returns False if the caller left it (asked for English)."""
        st = self.state
        cap = st.capture
        lang = "es" if cap.reason == "language_es" else "en"
        loc = self.e.locale(lang)
        if lang == "es" and language.detect(text).reason == "english requested":
            cap.active, st.language = False, "en"
            st.phase = Phase.TRIAGE
            return False
        phone = find_phone(text)
        if cap.step == "await_confirm":
            if phone and phone != cap.candidate_phone:
                cap.candidate_phone = phone
                self.say(
                    loc.t("capture.confirm_number", digits=read_back_phone(phone, lang)), "system"
                )
                return True
            if _YES_RE.search(text) and cap.candidate_phone:
                await self._finish_capture(loc)
                return True
            cap.step = "await_number"
            self.say(loc.t("capture.ask_number"), "system")
            return True
        # await_number
        if phone:
            cap.candidate_phone, cap.step = phone, "await_confirm"
            self.say(loc.t("capture.confirm_number", digits=read_back_phone(phone, lang)), "system")
            return True
        cap.attempts += 1
        if cap.attempts >= 2:
            await self._finish_capture(loc)
            return True
        self.say(loc.t("capture.retry_number"), "system")
        return True

    async def _finish_capture(self, loc: Locale) -> None:
        st = self.state
        cap = st.capture
        if cap.candidate_phone:
            st.caller.phone_e164 = cap.candidate_phone
            st.caller.phone_confirmed = True
            await self._tool("request_callback", {"reason": cap.reason}, "engine")
        cap.step, cap.active = "done", False
        self.say(loc.t("capture.done"), "system")
        st.phase = Phase.ENDED
        self.ended = "completed"

    # -- persistence ----------------------------------------------------------------------

    async def persist(self, conv: Conversation) -> None:
        st, ctx, m = self.state, self.ctx, self.m
        self.rec.flush_llm()
        if self.ended:
            st.phase = Phase.ENDED
        outcome, reason = compute_outcome(st)
        st.outcome, st.outcome_reason = outcome, reason
        for row in self.rec.rows:
            ctx.session.add(row)
        ctx.session.add(
            Turn(
                tenant_id=conv.tenant_id,
                id=ctx.turn_id,
                conversation_id=conv.id,
                turn_index=ctx.turn_index,
                kind=self.kind,
                model=m.model,
                t_received=real_utc_now(),
                ttft_ms=m.ttft_ms,
                first_audible_ms=m.first_audible_ms,
                answer_first_chunk_ms=m.answer_first_chunk_ms,
                answer_done_ms=m.answer_done_ms,
                filler_used=m.filler_used,
                tool_wait_ms=m.tool_wait_ms or None,
                input_tokens=m.input_tokens,
                output_tokens=m.output_tokens,
                cache_read_tokens=m.cache_read_tokens,
                cache_write_tokens=m.cache_write_tokens,
                cost_usd=m.cost_usd,
                guard_triggers=m.guard_triggers,
            )
        )
        c = st.caller
        conv.state_json = st.model_dump(mode="json")
        conv.language = st.language
        conv.urgency = st.urgency.level
        conv.outcome = outcome
        conv.caller_name = c.name
        conv.caller_phone_e164 = c.phone_e164
        conv.caller_email = c.email
        conv.service_address = c.address.one_line() if c.address else None
        conv.tokens_in += m.input_tokens + m.cache_read_tokens + m.cache_write_tokens
        conv.tokens_out += m.output_tokens
        conv.llm_cost_usd += m.cost_usd
        if self.ended:
            now_utc = ctx.clock.now_utc(ctx.cfg.tz)
            conv.status, conv.ended_at = "ended", now_utc
            conv.duration_ms = int((now_utc - conv.started_at).total_seconds() * 1000)
            self._emit(EndConversation(self.ended))
        log.info(
            "turn_completed",
            turn=ctx.turn_index,
            ttft_ms=m.ttft_ms,
            first_audible_ms=m.first_audible_ms,
            answer_first_chunk_ms=m.answer_first_chunk_ms,
            answer_done_ms=m.answer_done_ms,
            filler_used=m.filler_used,
            tool_wait_ms=m.tool_wait_ms,
            tokens_in=m.input_tokens,
            tokens_out=m.output_tokens,
            cost_usd=round(m.cost_usd, 6),
            guard_triggers=m.guard_triggers,
            phase=st.phase.value,
            outcome=outcome,
        )
