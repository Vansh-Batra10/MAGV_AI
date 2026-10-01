"""Rebuild the LLM message history from stored transcript rows.

Row mapping (role / meta.source):
  user                      -> user text (+ meta.llm_note: what the system said deterministically)
  agent, source llm|filler  -> assistant text
  agent, source system      -> skipped (conveyed via llm_note or the tool_result)
  tool_use                  -> assistant tool_use block
  tool_result               -> user tool_result block
Consecutive messages with the same role are merged, so the result always alternates roles
and every tool_use is answered in the very next user message.
"""

from __future__ import annotations

import json
from collections.abc import Iterable
from typing import Any, Protocol


class Row(Protocol):
    role: str
    content: str
    tool_name: str | None
    tool_call_id: str | None
    meta: dict[str, Any] | None


def _block(row: Row) -> tuple[str, dict[str, Any]] | None:
    meta = row.meta or {}
    if row.role == "user":
        text = row.content
        if meta.get("llm_note"):
            text = f"{text}\n\n<system_spoke>{meta['llm_note']}</system_spoke>"
        return "user", {"type": "text", "text": text}
    if row.role == "agent":
        if meta.get("source") == "system" or not row.content.strip():
            return None
        return "assistant", {"type": "text", "text": row.content}
    if row.role == "tool_use":
        return "assistant", {
            "type": "tool_use",
            "id": row.tool_call_id,
            "name": row.tool_name,
            "input": json.loads(row.content),
        }
    if row.role == "tool_result":
        block: dict[str, Any] = {
            "type": "tool_result",
            "tool_use_id": row.tool_call_id,
            "content": row.content,
        }
        if meta.get("is_error"):
            block["is_error"] = True
        return "user", block
    return None


def build_messages(rows: Iterable[Row]) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = []
    for row in rows:
        converted = _block(row)
        if converted is None:
            continue
        role, block = converted
        if messages and messages[-1]["role"] == role:
            messages[-1]["content"].append(block)
        else:
            messages.append({"role": role, "content": [block]})
    return messages


def with_state(messages: list[dict[str, Any]], state_block: str) -> list[dict[str, Any]]:
    """Attach the volatile state block to the final user message (keeps prefixes stable)."""
    if not messages or messages[-1]["role"] != "user":
        raise ValueError("an LLM request must end with a user message")
    out = [
        *messages[:-1],
        {
            "role": "user",
            "content": [*messages[-1]["content"], {"type": "text", "text": state_block}],
        },
    ]
    return out
