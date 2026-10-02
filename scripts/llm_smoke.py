#!/usr/bin/env python3
"""Live smoke test: one short conversation through the real model (needs ANTHROPIC_API_KEY).

Runs the "Saturday 2:10 PM, AC dead" opening against claude (MODEL_LIVE) with the fake calendar
and a throwaway SQLite database, then prints what the agent said, the tool calls, latency and
cost. Exit code 0 = the API accepted our prompts and tool schemas and the agent replied.

  python scripts/llm_smoke.py
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from fastapi.testclient import TestClient  # noqa: E402

from receptionist.db.migrate import upgrade  # noqa: E402
from receptionist.main import create_app  # noqa: E402
from receptionist.settings import Settings  # noqa: E402

CLIENT = "jolly-brothers-round-rock"
TURNS = [
    "Hi, my AC is dead and it's getting warm in here.",
    "It's Pat Jones, 512-555-0198, and I'm at 2104 Oak St in Round Rock, 78664.",
]


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="llm-smoke-"))
    url = f"sqlite+aiosqlite:///{tmp / 'smoke.db'}"
    settings = Settings(
        app_env="demo",
        demo_now="2026-10-03T14:10",
        demo_clock_mode="frozen",
        database_url=url,
        log_level="WARNING",
        log_format="console",
    )
    if not settings.anthropic_api_key or not settings.anthropic_api_key.get_secret_value():
        print("ANTHROPIC_API_KEY is not set (environment or .env).", file=sys.stderr)
        return 2
    upgrade(url)
    print(f"Model: {settings.model_live} · demo clock Sat Oct 3, 2:10 PM CDT\n")
    with TestClient(create_app(settings)) as client:
        r = client.post(f"/v1/chat/{CLIENT}", json={})
        r.raise_for_status()
        sid = r.json()["session_id"]
        print(f"AGENT [greeting]: {r.json()['messages'][0]['text']}")
        for text in TURNS:
            print(f"\nCALLER: {text}")
            r = client.post(f"/v1/chat/{CLIENT}", json={"session_id": sid, "message": text})
            if r.status_code != 200:
                print(f"HTTP {r.status_code}: {r.text}", file=sys.stderr)
                return 1
            for m in r.json()["messages"]:
                tag = "" if m["source"] == "llm" else f" [{m['source']}]"
                print(f"AGENT{tag}: {m['text']}")
        d = client.get(f"/v1/chat/{CLIENT}/sessions/{sid}/debug").json()

    print("\nTool calls:")
    for t in d["tools"]:
        print(
            f"  turn {t['turn']}: {t['name']} -> {t['status']}"
            f"{' ' + t['reason'] if t['reason'] else ''} ({t['latency_ms']} ms)"
        )
    print("\nTurns:")
    for t in d["turns"]:
        print(
            f"  turn {t['turn']}: first audible {t['first_audible_ms']} ms · "
            f"TTFT {t['ttft_ms']} ms · done {t['answer_done_ms']} ms · "
            f"{t['tokens_in']}/{t['tokens_out']} tokens · ${t['cost_usd']:.4f}"
            f"{' · guards: ' + ', '.join(t['guard_triggers']) if t['guard_triggers'] else ''}"
        )
    state = d["state"]
    print(
        f"\nState: phase={state['phase']} urgency={state['urgency']['level']} "
        f"coverage={state['coverage']} cost=${d['conversation']['cost_usd']:.4f}"
    )

    llm_spoke = any(m["source"] == "llm" for m in d["transcript"] if m["role"] == "agent")
    if not llm_spoke or not d["turns"] or d["turns"][-1]["ttft_ms"] is None:
        print("\nFAILED: the model never replied (see errors above / server log).", file=sys.stderr)
        return 1
    print("\nOK: the live model accepted the prompts and tool schemas and replied.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
