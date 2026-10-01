"""Deterministic fake LLM for tests and offline demos.

Each call to stream() consumes the next ScriptStep. A step is either text, tool calls, or both
(text first, as the model would say something before calling a tool), or a callable that
builds the step from the request (handy for asserting on the prompt).
"""

from __future__ import annotations

import itertools
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from typing import Any

from receptionist.adapters.llm.base import (
    Completion,
    LLMError,
    LLMEvent,
    LLMRequest,
    Stop,
    TextDelta,
    ToolUse,
    ToolUseStart,
    Usage,
)


@dataclass
class ScriptStep:
    text: str = ""
    tool_calls: list[tuple[str, dict[str, Any]]] = field(default_factory=list)
    error: LLMError | None = None


StepSource = ScriptStep | Callable[[LLMRequest], ScriptStep]


def say(text: str) -> ScriptStep:
    return ScriptStep(text=text)


def call(name: str, /, **args: Any) -> ScriptStep:
    return ScriptStep(tool_calls=[(name, args)])


class ScriptExhausted(AssertionError):
    pass


class ScriptedLLM:
    def __init__(self, steps: list[StepSource] | None = None, *, model: str = "scripted") -> None:
        self._steps = list(steps or [])
        self._ids = itertools.count(1)
        self.model = model
        self.requests: list[LLMRequest] = []

    def extend(self, steps: list[StepSource]) -> None:
        self._steps.extend(steps)

    @property
    def remaining(self) -> int:
        return len(self._steps)

    def _next(self, req: LLMRequest) -> ScriptStep:
        self.requests.append(req)
        if not self._steps:
            raise ScriptExhausted(f"no scripted step left for {req.purpose} request")
        src = self._steps.pop(0)
        return src(req) if callable(src) else src

    async def stream(self, req: LLMRequest) -> AsyncIterator[LLMEvent]:
        step = self._next(req)
        if step.error:
            raise step.error
        content: list[dict[str, Any]] = []
        if step.text:
            for word in step.text.split(" "):
                yield TextDelta(word + " ")
            content.append({"type": "text", "text": step.text})
        for name, args in step.tool_calls:
            tid = f"toolu_{next(self._ids):04d}"
            yield ToolUseStart(tid, name)
            yield ToolUse(tid, name, args)
            content.append({"type": "tool_use", "id": tid, "name": name, "input": args})
        prompt_chars = sum(len(b.text) for b in req.system) + len(str(req.messages))
        yield Usage(
            self.model, input_tokens=prompt_chars // 4, output_tokens=len(step.text) // 4 + 20
        )
        yield Stop("tool_use" if step.tool_calls else "end_turn", content)

    async def complete(self, req: LLMRequest) -> Completion:
        step = self._next(req)
        if step.error:
            raise step.error
        return Completion(
            step.text, Usage(self.model, output_tokens=len(step.text) // 4), "end_turn"
        )
