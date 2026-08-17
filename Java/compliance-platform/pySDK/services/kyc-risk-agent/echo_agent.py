"""Diagnostic agent with no external dependencies (no LLM key, no Java
call). Proves the RabbitMQ + Java job-tracking wiring works end-to-end
independent of any real agent's logic — useful for standing the service up
and testing the full path before an ANTHROPIC_API_KEY is available. Not
meant for production use beyond that.
"""
from __future__ import annotations

from cddp_ai_sdk.agents.base_agent import AgentRunResult, BaseAgent
from cddp_ai_sdk.core.models import AgentRequest, TokenUsage


class EchoAgent(BaseAgent):
    name = "echo"

    async def run(self, request: AgentRequest) -> AgentRunResult:
        return AgentRunResult(
            output={"echo": request.input, "context": request.context},
            model="none",
            token_usage=TokenUsage(),
        )
