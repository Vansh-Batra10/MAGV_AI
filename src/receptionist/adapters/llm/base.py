"""LLM provider interface (DESIGN.md section 5).

Messages use a canonical block format (role + content blocks of type text / tool_use /
tool_result) that maps 1:1 onto the Anthropic Messages API. Another provider's adapter would
convert from it.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

Purpose = Literal["live_turn", "summary", "judge", "caller_sim"]
Message = dict[str, Any]


@dataclass(frozen=True)
class SystemBlock:
    text: str
    cache: bool = False  # mark the end of a stable prefix for prompt caching


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    input_schema: dict[str, Any]


@dataclass
class LLMRequest:
    purpose: Purpose
    system: list[SystemBlock]
    messages: list[Message]
    tools: list[ToolSpec] = field(default_factory=list)
    max_tokens: int = 300
    timeout_s: float = 8.0


@dataclass(frozen=True)
class TextDelta:
    text: str


@dataclass(frozen=True)
class ToolUseStart:
    """Emitted as soon as the tool name is known, before its arguments finish streaming."""

    id: str
    name: str


@dataclass(frozen=True)
class ToolUse:
    id: str
    name: str
    input: dict[str, Any]


@dataclass(frozen=True)
class Usage:
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0


@dataclass(frozen=True)
class Stop:
    reason: str  # end_turn | tool_use | max_tokens | refusal | ...
    content: list[dict[str, Any]]  # the assistant message content, for history


LLMEvent = TextDelta | ToolUseStart | ToolUse | Usage | Stop


@dataclass(frozen=True)
class Completion:
    text: str
    usage: Usage
    stop_reason: str


class LLMError(Exception):
    """Provider failure (timeout, network, 5xx, bad request)."""

    def __init__(self, message: str, *, retryable: bool) -> None:
        super().__init__(message)
        self.retryable = retryable


class LLMProvider(Protocol):
    def stream(self, req: LLMRequest) -> AsyncIterator[LLMEvent]: ...

    async def complete(self, req: LLMRequest) -> Completion: ...
