"""LLM provider abstraction — agents talk to this interface, never to a
specific vendor SDK directly, so the underlying model can be swapped
without touching agent/graph code."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LLMResult:
    text: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, *, system: str, prompt: str, max_tokens: int = 1024) -> LLMResult:
        """Single-turn completion. Agents needing tool-use/multi-turn
        reasoning should use `as_langchain()` inside a LangGraph graph
        instead of this convenience method."""

    @abstractmethod
    def as_langchain(self):
        """Return a LangChain-compatible chat model for use inside
        LangGraph graphs (tool calling, streaming, multi-step agents)."""
