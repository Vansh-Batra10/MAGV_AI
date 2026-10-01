"""Eval runner: simulated callers vs the agent over the text channel engine.

  python -m evals.runner --personas core --parallel 4 --threshold 0.8

Uses the fake calendar (per-persona scenario) and the persona's frozen demo clock. Requires
ANTHROPIC_API_KEY. Exits non-zero below the threshold or on any critical failure.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

from sqlalchemy import select

from evals.checks import Check, RunRecord, run_checks
from evals.personas import Persona, load_personas
from evals.report import render_report
from evals.sim import CallerSimulator
from receptionist.adapters.llm.base import LLMProvider
from receptionist.booking.fake import FakeBookingProvider
from receptionist.booking.registry import BookingProviders
from receptionist.clock import DemoClock, real_utc_now
from receptionist.config import TenantRegistry, load_tenants
from receptionist.db import Database
from receptionist.db.migrate import upgrade
from receptionist.db.models import Conversation, Message, ToolCall, Turn
from receptionist.db.tenant_sync import sync_tenants
from receptionist.engine.engine import EndConversation, Engine, TextChunk, TurnInput
from receptionist.logging import configure_logging, get_logger
from receptionist.settings import Settings

ROOT = Path(__file__).resolve().parents[1]
log = get_logger("evals")


def _cost(settings: Settings, model: str, input_tokens: int, output_tokens: int) -> float:
    price = settings.model_prices.get(model)
    if not price:
        return 0.0
    return (input_tokens * price.input + output_tokens * price.output) / 1_000_000


async def run_persona(
    persona: Persona,
    *,
    settings: Settings,
    tenants: TenantRegistry,
    db: Database,
    agent_llm: LLMProvider,
    caller_llm: LLMProvider,
) -> RunRecord:
    record = RunRecord(persona=persona)
    cfg = tenants[persona.tenant].config
    provider = FakeBookingProvider(cfg, persona.booking_scenario)
    engine = Engine(
        settings=settings,
        tenants=tenants,
        clock=DemoClock(persona.clock, app_env="demo", mode="frozen"),
        db=db,
        llm=agent_llm,
        bookings=BookingProviders(tenants, {persona.tenant: provider}),
    )
    sim = CallerSimulator(caller_llm, persona, cfg.business.name)
    try:
        started = await engine.start_conversation(persona.tenant, channel="text")
        record.conversation_id = started.conversation_id
        agent_said = started.greeting
        record.ended_by = "max_turns"
        for _ in range(persona.max_turns):
            caller_said = await sim.reply(agent_said)
            if caller_said is None:
                record.ended_by = "caller"
                break
            parts: list[str] = []
            ended = False
            async for ev in engine.run_turn(
                persona.tenant, started.conversation_id, TurnInput(caller_said)
            ):
                if isinstance(ev, TextChunk):
                    parts.append(ev.text)
                elif isinstance(ev, EndConversation):
                    ended = True
            agent_said = " ".join(parts)
            if ended:
                record.ended_by = "agent"
                break
    except Exception as exc:  # report, don't crash the whole run
        log.exception("persona_failed", persona=persona.id)
        record.error = f"{type(exc).__name__}: {exc}"
    record.provider_bookings = sum(
        1 for b in provider.bookings.values() if b["status"] == "accepted"
    )
    for c in sim.completions:
        record.caller_cost_usd += _cost(
            settings, c.usage.model, c.usage.input_tokens, c.usage.output_tokens
        )
    if record.conversation_id:
        await _load(record, db, persona.tenant)
    return record


async def _load(record: RunRecord, db: Database, tenant: str) -> None:
    cid = record.conversation_id
    async with db.tenant_session(tenant) as s:
        conv = await s.get(Conversation, cid)
        msgs = (
            await s.scalars(
                select(Message).where(Message.conversation_id == cid).order_by(Message.seq)
            )
        ).all()
        turns = (
            await s.scalars(
                select(Turn).where(Turn.conversation_id == cid).order_by(Turn.turn_index)
            )
        ).all()
        tools = (
            await s.scalars(
                select(ToolCall)
                .where(ToolCall.conversation_id == cid)
                .order_by(ToolCall.created_at)
            )
        ).all()
    assert conv is not None
    turn_index = {t.id: t.turn_index for t in turns}
    record.state = conv.state_json
    record.conversation = {
        "outcome": conv.outcome,
        "urgency": conv.urgency,
        "language": conv.language,
        "status": conv.status,
    }
    record.agent_cost_usd = conv.llm_cost_usd
    record.transcript = [
        {"role": m.role, "text": m.content, "source": (m.meta or {}).get("source")}
        for m in msgs
        if m.role in ("user", "agent")
    ]
    record.turns = [
        {
            "first_audible_ms": t.first_audible_ms,
            "answer_first_chunk_ms": t.answer_first_chunk_ms,
            "guard_triggers": t.guard_triggers,
        }
        for t in turns
    ]
    record.tool_calls = [
        {
            "name": t.tool_name,
            "status": t.status,
            "reason": t.reason_code,
            "result": t.result_json,
            "turn": turn_index.get(t.turn_id or ""),
        }
        for t in tools
    ]


async def run_eval(
    personas: list[Persona],
    *,
    settings: Settings,
    agent_llm: LLMProvider,
    caller_llm: Callable[[Persona], LLMProvider] | LLMProvider,
    parallel: int,
    db_url: str,
) -> list[tuple[RunRecord, list[Check]]]:
    tenants = load_tenants(settings.tenants_dir)
    db = Database(db_url)
    await sync_tenants(db, tenants)
    sem = asyncio.Semaphore(parallel)

    async def one(p: Persona) -> tuple[RunRecord, list[Check]]:
        async with sem:
            sim_llm = caller_llm(p) if callable(caller_llm) else caller_llm
            rec = await run_persona(
                p,
                settings=settings,
                tenants=tenants,
                db=db,
                agent_llm=agent_llm,
                caller_llm=sim_llm,
            )
            return rec, run_checks(rec, tenants[p.tenant].config)

    try:
        return list(await asyncio.gather(*(one(p) for p in personas)))
    finally:
        await db.dispose()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--personas", default="core", help="tag, comma-separated ids, or 'all'")
    parser.add_argument("--file", type=Path, default=ROOT / "evals/personas.yaml")
    parser.add_argument("--parallel", type=int, default=4)
    parser.add_argument("--threshold", type=float, default=0.8)
    parser.add_argument("--agent-model", default=None)
    parser.add_argument("--caller-model", default=None)
    parser.add_argument("--report-dir", type=Path, default=ROOT / "evals/reports")
    args = parser.parse_args(argv)

    overrides: dict[str, Any] = {
        "app_env": "demo",
        "demo_now": None,
        "log_format": "console",
        "log_level": "WARNING",
    }
    if args.agent_model:
        overrides["model_live"] = args.agent_model
    if args.caller_model:
        overrides["model_caller_sim"] = args.caller_model
    settings = Settings(**overrides)
    configure_logging(
        level=settings.log_level, fmt="console", hash_salt=settings.log_hash_salt.get_secret_value()
    )
    if not settings.anthropic_api_key or not settings.anthropic_api_key.get_secret_value():
        print("ANTHROPIC_API_KEY is not set (put it in .env).", file=sys.stderr)
        return 2
    from receptionist.main import _default_llm

    llm = _default_llm(settings)
    assert llm is not None
    personas = load_personas(args.file, args.personas)
    if not personas:
        print(f"No personas match {args.personas!r}", file=sys.stderr)
        return 2

    started = real_utc_now()
    stamp = started.strftime("%Y%m%d-%H%M%S")
    args.report_dir.mkdir(parents=True, exist_ok=True)
    db_url = f"sqlite+aiosqlite:///{args.report_dir / f'eval-{stamp}.db'}"
    print(f"Running {len(personas)} personas ({args.parallel} in parallel)...")
    upgrade(db_url)  # before the event loop starts (Alembic runs its own)
    results = asyncio.run(
        run_eval(
            personas,
            settings=settings,
            agent_llm=llm,
            caller_llm=llm,
            parallel=args.parallel,
            db_url=db_url,
        )
    )
    meta = {
        "started_at": started,
        "selector": args.personas,
        "agent_model": settings.model_live,
        "caller_model": settings.model_caller_sim,
    }
    report, rate, critical = render_report(results, meta=meta, threshold=args.threshold)
    path = args.report_dir / f"eval-{stamp}.md"
    path.write_text(report, encoding="utf-8")
    total = sum(r.agent_cost_usd + r.caller_cost_usd for r, _ in results)
    log.warning(
        "eval_run_completed",
        pass_rate=rate,
        critical=critical,
        cost_usd=round(total, 4),
        report=str(path),
    )
    print(
        f"Pass rate {rate:.0%} (threshold {args.threshold:.0%}), critical={critical}, "
        f"cost ${total:.4f}. Report: {path}"
    )
    return 0 if rate >= args.threshold and not critical else 1


if __name__ == "__main__":
    raise SystemExit(main())
