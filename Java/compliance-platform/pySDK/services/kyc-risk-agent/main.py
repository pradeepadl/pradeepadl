"""Entry point for the kyc-risk-agent microservice. Registers this
service's agents and starts the shared FastAPI app from cddp_ai_sdk.

`echo` always registers (no external dependencies). `kyc-risk-summarizer`
resolves its LLM provider per request from Java's active config for the
tenant (see agent.py) — it no longer needs ANTHROPIC_API_KEY at startup,
only as a last-resort local-dev fallback if Java has no config. The
try/except here is defensive: nothing in KycRiskSummarizerAgent's
constructor currently raises, but registration failures should degrade to
"agent unavailable" rather than crash the whole service either way.
"""
from __future__ import annotations

import structlog

from cddp_ai_sdk.agents.registry import AgentRegistry
from cddp_ai_sdk.service.app import create_app

from agent import KycRiskSummarizerAgent
from echo_agent import EchoAgent

log = structlog.get_logger()

registry = AgentRegistry()
registry.register(EchoAgent())

try:
    registry.register(KycRiskSummarizerAgent())
except Exception as exc:
    log.warning("agent.registration_skipped", agent="kyc-risk-summarizer", error=str(exc))

app = create_app(registry)