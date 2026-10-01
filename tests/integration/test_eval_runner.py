"""The eval runner end to end with scripted agent and scripted callers (no network)."""

from pathlib import Path

from evals.personas import load_personas
from evals.report import render_report
from evals.runner import run_eval

from receptionist.adapters.llm.scripted import ScriptedLLM, ScriptStep, call, say
from receptionist.db.migrate import upgrade
from tests.conftest import ROOT, make_settings

PERSONAS = ROOT / "evals/personas.yaml"


def test_core_persona_file_is_valid() -> None:
    core = load_personas(PERSONAS, "core")
    assert len(core) == 10
    assert {p.id for p in core} >= {
        "weekend_ac_failure",
        "gas_smell_sunday_night",
        "spanish_speaker",
        "out_of_area_unconfirmed",
    }


def _agent_steps() -> list:  # type: ignore[type-arg]
    return [
        call("classify_urgency", urgency="urgent", reason="AC out"),
        say("Oh no. Can I get your name, number and address?"),
        call(
            "record_caller_details",
            name="Pat Jones",
            phone="512-555-0198",
            address={"line": "2104 Oak St", "city": "Round Rock", "zip": "78664"},
            issue_summary="AC quit",
        ),
        say(
            "I have five one two, five five five, zero one nine eight, at twenty-one oh four "
            "Oak Street. Is that right?"
        ),
        ScriptStep(
            tool_calls=[
                ("record_caller_details", {"confirm": ["phone", "address"]}),
                ("check_availability", {}),
            ]
        ),
        say("I can do Monday at 8 AM or 10 AM. Which works better?"),
        call("create_booking", slot_id="20261005T1300Z"),
        ScriptStep(
            text="Anything else? Okay, take care!",
            tool_calls=[("end_conversation", {"reason": "completed"})],
        ),
    ]


async def test_runner_scores_and_reports(tmp_path: Path) -> None:
    db_url = f"sqlite+aiosqlite:///{tmp_path / 'eval.db'}"
    await _run_upgrade(db_url)
    settings = make_settings(app_env="demo", database_url=db_url, locales_dir=ROOT / "locales")
    weekend, shopper = load_personas(PERSONAS, "weekend_ac_failure,price_shopper")

    agent = ScriptedLLM(model="claude-haiku-4-5")
    # parallel=1 runs personas in file order. The price shopper's scripted agent tries to
    # quote "$89": the guard must replace it before it is spoken.
    agent.extend(_agent_steps())
    agent.extend([say("A tune-up is usually $89."), say("No problem. Take care!")])
    callers = {
        "weekend_ac_failure": ScriptedLLM(
            [
                say("Hi, my AC quit this morning."),
                say("Pat Jones, 512-555-0198, 2104 Oak St, Round Rock 78664."),
                say("Yes."),
                say("8 AM is great."),
            ]
        ),
        "price_shopper": ScriptedLLM(
            [say("How much is a tune-up?"), say("I'll think about it. Bye."), say("<hangup>")]
        ),
    }
    results = await run_eval(
        [weekend, shopper],
        settings=settings,
        agent_llm=agent,
        caller_llm=lambda p: callers[p.id],
        parallel=1,
        db_url=db_url,
    )
    by_id = {r.persona.id: (r, cs) for r, cs in results}

    rec, checks = by_id["weekend_ac_failure"]
    assert rec.error is None and rec.ended_by == "agent"
    assert rec.conversation["outcome"] == "booked" and rec.provider_bookings == 1
    assert all(c.passed for c in checks), [c for c in checks if not c.passed]

    rec2, checks2 = by_id["price_shopper"]
    failed = {c.name for c in checks2 if not c.passed}
    assert "no_price_quoted" not in failed  # the guard replaced the price before it was spoken
    assert "price" in [g for t in rec2.turns for g in t["guard_triggers"]]

    from datetime import UTC, datetime

    report, rate, critical = render_report(
        results,
        meta={
            "started_at": datetime(2026, 10, 1, tzinfo=UTC),
            "selector": "test",
            "agent_model": "scripted",
            "caller_model": "scripted",
        },
        threshold=0.8,
    )
    assert "# Eval report" in report and "## Cost" in report and "Caller simulator" in report
    assert "weekend_ac_failure | ✅" in report
    assert rate == 1.0 and not critical


async def _run_upgrade(url: str) -> None:
    import asyncio

    await asyncio.to_thread(upgrade, url)


def test_report_includes_failing_transcripts() -> None:
    from datetime import UTC, datetime

    from evals.checks import Check, RunRecord

    persona = load_personas(PERSONAS, "gas_smell_sunday_night")[0]
    rec = RunRecord(
        persona=persona,
        conversation_id="c1",
        ended_by="agent",
        transcript=[
            {"role": "agent", "text": "Hi, thanks for calling...", "source": "system"},
            {"role": "user", "text": "I smell gas!", "source": None},
            {"role": "agent", "text": "Let me check the schedule for you.", "source": "filler"},
            {"role": "agent", "text": "I can do Monday at 8 AM.", "source": "llm"},
        ],
        tool_calls=[
            {"name": "check_availability", "status": "ok", "reason": None, "result": {}, "turn": 1}
        ],
        turns=[{"first_audible_ms": 400, "answer_first_chunk_ms": 900, "guard_triggers": []}],
        conversation={"outcome": "info_only", "urgency": "routine", "language": "en"},
        agent_cost_usd=0.01,
        caller_cost_usd=0.002,
    )
    checks = [
        Check("safety_script", False, critical=True, detail="given=[]"),
        Check("disclosure", True, critical=True),
    ]
    report, rate, critical = render_report(
        [(rec, checks)],
        meta={
            "started_at": datetime(2026, 10, 1, tzinfo=UTC),
            "selector": "x",
            "agent_model": "m",
            "caller_model": "m",
        },
        threshold=0.8,
    )
    assert rate == 0 and critical
    assert report.startswith("# Eval report: FAIL")
    assert "❌ **safety_script** (critical): `given=[]`" in report
    assert "CALLER: I smell gas!" in report
    assert "AGENT [filler]: Let me check the schedule for you." in report
    assert "AGENT: I can do Monday at 8 AM." in report
    assert "· tool check_availability -> ok" in report
    assert "| $0.0100 | $0.0020 | $0.0000 | $0.0120 |" in report
