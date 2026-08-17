"""Base class every concrete agent (e.g. kyc-risk-summarizer) implements.

Adapts an agent's own logic (LangGraph graph, direct LLM call, whatever it
needs) to the AgentRequest/AgentResponse message contract, and guarantees
that any failure inside `run()` becomes a FAILED AgentResponse rather than
an unhandled exception that would crash the consumer loop or leave the
Java-side job stuck PENDING forever.
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from ..core.models import AgentRequest, AgentResponse, JobStatus, TokenUsage


@dataclass
class AgentRunResult:
    output: dict
    model: str | None = None
    token_usage: TokenUsage = field(default_factory=TokenUsage)


class BaseAgent(ABC):
    name: str

    @abstractmethod
    async def run(self, request: AgentRequest) -> AgentRunResult:
        """Execute the agent and return its result. Raise on unrecoverable
        failure — `handle()` turns exceptions into a FAILED AgentResponse."""

    async def handle(self, request: AgentRequest) -> AgentResponse:
        started = time.monotonic()
        try:
            result = await self.run(request)
            return AgentResponse(
                job_id=request.job_id,
                correlation_id=request.correlation_id,
                status=JobStatus.COMPLETED,
                output=result.output,
                agent_name=self.name,
                model=result.model,
                token_usage=result.token_usage,
                duration_ms=int((time.monotonic() - started) * 1000),
            )
        except Exception as exc:  # noqa: BLE001 — deliberately broad, see docstring
            return AgentResponse.failure(
                request,
                error=str(exc),
                duration_ms=int((time.monotonic() - started) * 1000),
            )
