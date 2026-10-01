"""Anthropic Messages API adapter (official `anthropic` SDK, streaming)."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import anthropic

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


def _system(req: LLMRequest) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    for b in req.system:
        block: dict[str, Any] = {"type": "text", "text": b.text}
        if b.cache:
            block["cache_control"] = {"type": "ephemeral"}
        blocks.append(block)
    return blocks


def _tools(req: LLMRequest) -> list[dict[str, Any]]:
    # strict: schema-valid arguments (supported on Haiku 4.5). Tool inputs here are tiny, so
    # eager input streaming buys nothing; we still learn the tool name at content_block_start.
    return [
        {
            "name": t.name,
            "description": t.description,
            "input_schema": t.input_schema,
            "strict": True,
        }
        for t in req.tools
    ]


def _content_dicts(content: list[Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for block in content:
        if block.type == "text":
            out.append({"type": "text", "text": block.text})
        elif block.type == "tool_use":
            out.append(
                {"type": "tool_use", "id": block.id, "name": block.name, "input": block.input}
            )
    return out


def _usage(model: str, u: Any) -> Usage:
    return Usage(
        model=model,
        input_tokens=u.input_tokens or 0,
        output_tokens=u.output_tokens or 0,
        cache_read_tokens=getattr(u, "cache_read_input_tokens", None) or 0,
        cache_write_tokens=getattr(u, "cache_creation_input_tokens", None) or 0,
    )


class AnthropicProvider:
    def __init__(self, *, api_key: str | None, models: dict[str, str]) -> None:
        # Retries are owned by the engine (it must not retry after text was spoken).
        self._client = anthropic.AsyncAnthropic(api_key=api_key, max_retries=0)
        self._models = models

    def model_for(self, req: LLMRequest) -> str:
        return self._models[req.purpose]

    def _params(self, req: LLMRequest) -> dict[str, Any]:
        params: dict[str, Any] = {
            "model": self.model_for(req),
            "max_tokens": req.max_tokens,
            "system": _system(req),
            "messages": req.messages,
        }
        if req.tools:
            params["tools"] = _tools(req)
            params["tool_choice"] = {"type": "auto"}
        return params

    async def stream(self, req: LLMRequest) -> AsyncIterator[LLMEvent]:
        model = self.model_for(req)
        client = self._client.with_options(timeout=req.timeout_s)
        try:
            async with client.messages.stream(**self._params(req)) as stream:
                async for event in stream:
                    if event.type == "text":
                        yield TextDelta(event.text)
                    elif (
                        event.type == "content_block_start"
                        and event.content_block.type == "tool_use"
                    ):
                        yield ToolUseStart(event.content_block.id, event.content_block.name)
                final = await stream.get_final_message()
        except anthropic.APIConnectionError as exc:  # includes APITimeoutError
            raise LLMError(f"connection: {exc}", retryable=True) from exc
        except anthropic.RateLimitError as exc:
            raise LLMError("rate limited", retryable=True) from exc
        except anthropic.InternalServerError as exc:
            raise LLMError(f"server error {exc.status_code}", retryable=True) from exc
        except anthropic.APIStatusError as exc:
            raise LLMError(f"status {exc.status_code}: {exc.message}", retryable=False) from exc

        for block in final.content:
            if block.type == "tool_use":
                yield ToolUse(block.id, block.name, dict(block.input))
        yield _usage(model, final.usage)
        yield Stop(final.stop_reason or "end_turn", _content_dicts(final.content))

    async def complete(self, req: LLMRequest) -> Completion:
        text: list[str] = []
        usage = Usage(model=self.model_for(req))
        stop = "end_turn"
        async for ev in self.stream(req):
            if isinstance(ev, TextDelta):
                text.append(ev.text)
            elif isinstance(ev, Usage):
                usage = ev
            elif isinstance(ev, Stop):
                stop = ev.reason
        return Completion("".join(text), usage, stop)
