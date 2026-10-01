"""Markdown report for an eval run."""

from __future__ import annotations

import statistics
from collections import defaultdict
from typing import Any

from evals.checks import Check, RunRecord


def _pct(values: list[int], q: float) -> str:
    if not values:
        return "–"
    values = sorted(values)
    idx = min(len(values) - 1, round(q * (len(values) - 1)))
    return f"{values[idx]} ms"


def render_report(
    results: list[tuple[RunRecord, list[Check]]], *, meta: dict[str, Any], threshold: float
) -> tuple[str, float, bool]:
    """Returns (markdown, pass_rate, critical_failure)."""
    n = len(results)
    passed_runs = [r for r, cs in results if all(c.passed for c in cs)]
    pass_rate = len(passed_runs) / n if n else 0.0
    critical = any(not c.passed and c.critical for _, cs in results for c in cs)
    by_check: dict[str, list[bool]] = defaultdict(list)
    for _, cs in results:
        for c in cs:
            by_check[c.name].append(c.passed)

    audible = [
        t["first_audible_ms"]
        for r, _ in results
        for t in r.turns
        if t.get("first_audible_ms") is not None
    ]
    answer = [
        t["answer_first_chunk_ms"]
        for r, _ in results
        for t in r.turns
        if t.get("answer_first_chunk_ms") is not None
    ]
    agent_cost = sum(r.agent_cost_usd for r, _ in results)
    caller_cost = sum(r.caller_cost_usd for r, _ in results)
    verdict = "PASS" if pass_rate >= threshold and not critical else "FAIL"

    lines = [
        f"# Eval report: {verdict}",
        "",
        f"- Run: {meta['started_at']:%Y-%m-%d %H:%M UTC} · personas: {meta['selector']} ({n})",
        f"- Agent model: `{meta['agent_model']}` · caller simulator: `{meta['caller_model']}` · "
        f"judge: none (Phase 4)",
        f"- **Pass rate: {pass_rate:.0%}** ({len(passed_runs)}/{n}) · threshold {threshold:.0%} · "
        f"critical failures: {'yes' if critical else 'no'}",
        "",
        "## Cost",
        "",
        "| Agent | Caller simulator | Judge | Total | Per conversation |",
        "|---|---|---|---|---|",
        f"| ${agent_cost:.4f} | ${caller_cost:.4f} | $0.0000 | ${agent_cost + caller_cost:.4f} | "
        f"${(agent_cost + caller_cost) / max(n, 1):.4f} |",
        "",
        "## Latency (server-side, per turn)",
        "",
        "| Metric | p50 | p95 |",
        "|---|---|---|",
        f"| First audible | {_pct(audible, 0.5)} | {_pct(audible, 0.95)} |",
        f"| Answer starts | {_pct(answer, 0.5)} | {_pct(answer, 0.95)} |",
        "",
        "## Criteria",
        "",
        "| Check | Pass rate | Runs |",
        "|---|---|---|",
    ]
    for name, vals in sorted(by_check.items()):
        lines.append(f"| {name} | {sum(vals) / len(vals):.0%} | {sum(vals)}/{len(vals)} |")
    lines += [
        "",
        "## Personas",
        "",
        "| Persona | Result | Outcome | Urgency | Turns | Cost | Failed checks |",
        "|---|---|---|---|---|---|---|",
    ]
    for r, cs in results:
        failed = [c.name for c in cs if not c.passed]
        result = "✅" if not failed else "❌"
        lines.append(
            f"| {r.persona.id} | {result} | {r.conversation.get('outcome', '–')} | "
            f"{r.conversation.get('urgency') or '–'} | {len(r.turns)} | "
            f"${r.agent_cost_usd + r.caller_cost_usd:.4f} | {', '.join(failed) or '–'} |"
        )
    failures = [(r, cs) for r, cs in results if not all(c.passed for c in cs)]
    if failures:
        lines += ["", "## Failing cases", ""]
    for r, cs in failures:
        lines += [f"### {r.persona.id}", ""]
        for c in cs:
            if not c.passed:
                lines.append(
                    f"- ❌ **{c.name}**{' (critical)' if c.critical else ''}: `{c.detail}`"
                )
        if r.error:
            lines.append(f"- Error: `{r.error}`")
        lines += ["", "<details open><summary>Transcript</summary>", "", "```text"]
        tools_by_turn: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for t in r.tool_calls:
            tools_by_turn[t.get("turn") or 0].append(t)
        turn_no = 0
        for t in r.transcript:
            if t["role"] == "user":
                turn_no += 1
                lines.append(f"CALLER: {t['text']}")
                continue
            tag = "" if t["source"] == "llm" else f" [{t['source']}]"
            lines.append(f"AGENT{tag}: {t['text']}")
            for tc in tools_by_turn.pop(turn_no, []):
                reason = f" {tc['reason']}" if tc.get("reason") else ""
                lines.append(f"    · tool {tc['name']} -> {tc['status']}{reason}")
        lines += ["```", "", "</details>", ""]
    stats = statistics.mean(len(r.turns) for r, _ in results) if results else 0
    lines += ["", f"_Average turns per conversation: {stats:.1f}._"]
    return "\n".join(lines) + "\n", pass_rate, critical
