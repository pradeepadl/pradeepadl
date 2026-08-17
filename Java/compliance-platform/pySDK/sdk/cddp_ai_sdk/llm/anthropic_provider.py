"""Default LLMProvider — Anthropic Claude.

Reads ANTHROPIC_API_KEY from the environment at construction time and
raises immediately if it's missing, rather than failing confusingly on the
first request — callers that want to run without a key (e.g. the `echo`
diagnostic agent) simply don't construct this class.
"""
from __future__ import annotations

import os

from anthropic import AsyncAnthropic
from langchain_anthropic import ChatAnthropic

from .base import LLMProvider, LLMResult

DEFAULT_MODEL = "claude-sonnet-5"


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str | None = None, model: str = DEFAULT_MODEL) -> None:
        # os.environ["ANTHROPIC_API_KEY"] alone isn't enough to detect a
        # missing key: docker-compose's ${ANTHROPIC_API_KEY:-} substitution
        # sets the var to an empty string rather than leaving it unset, so
        # a plain KeyError check silently passes through "" here.
        resolved = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not resolved:
            raise ValueError("ANTHROPIC_API_KEY is not set")
        self._api_key = resolved
        self._model = model
        self._client = AsyncAnthropic(api_key=self._api_key)

    async def complete(self, *, system: str, prompt: str, max_tokens: int = 1024) -> LLMResult:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        return LLMResult(
            text=text,
            model=self._model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )

    def as_langchain(self):
        return ChatAnthropic(model=self._model, api_key=self._api_key)
