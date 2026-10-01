"""Validate -> execute -> audit every tool call the LLM proposes (DESIGN.md 3.1)."""

from __future__ import annotations

import asyncio
import time
from typing import Any

from receptionist.db.models import ToolCall
from receptionist.engine.context import TurnContext
from receptionist.engine.fillers import EXTERNAL_TOOLS
from receptionist.logging import get_logger
from receptionist.tools.handlers import HANDLERS, ToolOutcome, failed, parse_args

log = get_logger(__name__)


async def execute_tool(
    ctx: TurnContext, name: str, raw_args: dict[str, Any], *, source: str = "llm"
) -> tuple[ToolOutcome, int]:
    """Run one tool call. Returns the outcome and its latency in ms. Never raises for tool
    failures: a crash becomes an error result the LLM can recover from."""
    started = time.perf_counter()
    parsed = parse_args(name, raw_args)
    if isinstance(parsed, ToolOutcome):
        outcome = parsed
    else:
        _, handler = HANDLERS[name]
        try:
            coro = handler(ctx, parsed)
            # Side effects with external systems must finish even if the turn is abandoned
            # (barge-in, hangup): shield them from cancellation.
            outcome = await (asyncio.shield(coro) if name in EXTERNAL_TOOLS else coro)
        except Exception:
            log.exception("tool_crashed", tool=name)
            outcome = failed("INTERNAL_ERROR", "Something went wrong; offer a callback instead.")
    latency_ms = int((time.perf_counter() - started) * 1000)

    ctx.state.tool_errors_in_a_row = (
        0 if outcome.status == "ok" else ctx.state.tool_errors_in_a_row + 1
    )
    ctx.session.add(
        ToolCall(
            conversation_id=ctx.conversation_id,
            turn_id=ctx.turn_id,
            tool_name=name,
            args_json={**raw_args, "_source": source},
            result_json=outcome.result,
            status=outcome.status,
            reason_code=outcome.reason_code,
            latency_ms=latency_ms,
        )
    )
    log.info(
        "tool_call",
        tool=name,
        status=outcome.status,
        reason=outcome.reason_code,
        latency_ms=latency_ms,
        source=source,
    )
    return outcome, latency_ms
