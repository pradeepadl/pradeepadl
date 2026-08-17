"""kyc-risk-summarizer: given a case_id, fetches the case's data from Java
and asks the LLM for a plain-language risk summary a human reviewer can
scan quickly.

The LLM provider is resolved per request from the tenant's active config
in Java (admin Integrations page -> "AI Model Provider" panel ->
tcfg_llm_provider_cfgs), not hardcoded — this is what lets an admin
switch Claude/Gemini/HuggingFace, or rotate a key, without redeploying
this service. See cddp_ai_sdk.config.llm_config_client and llm.factory.

Falls back to ANTHROPIC_API_KEY from the environment only when Java has
no active config for the tenant (or is unreachable) — a local-dev
convenience, not the intended production path.
"""
from __future__ import annotations

import structlog

from cddp_ai_sdk.agents.base_agent import AgentRunResult, BaseAgent
from cddp_ai_sdk.config.llm_config_client import NoActiveLlmConfigError, fetch_active_llm_config
from cddp_ai_sdk.core.models import AgentRequest, TokenUsage
from cddp_ai_sdk.llm.anthropic_provider import AnthropicProvider
from cddp_ai_sdk.llm.base import LLMProvider
from cddp_ai_sdk.llm.factory import create_provider
from cddp_ai_sdk.tools.java_backend_tool import JavaBackendTool

log = structlog.get_logger()

SYSTEM_PROMPT = (
    "You are a compliance analyst assistant. Given raw case data, write a "
    "concise, plain-language risk summary for a human reviewer: 3-5 "
    "sentences, no speculation beyond what the data supports."
)


class CaseLookupTool(JavaBackendTool):
    name: str = "lookup_case"
    description: str = "Fetch a compliance case's details by case_id."
    path: str = "api/cases/{case_id}"

    async def _arun(self, case_id: str) -> dict:
        return await self._acall_json(case_id=case_id)


class KycRiskSummarizerAgent(BaseAgent):
    name = "kyc-risk-summarizer"

    def __init__(self) -> None:
        self._lookup = CaseLookupTool()

    async def _resolve_provider(self, tenant_id: str) -> LLMProvider:
        try:
            config = await fetch_active_llm_config(tenant_id)
            return create_provider(config["provider"], config["api_key"], config.get("model_name"))
        except NoActiveLlmConfigError:
            log.warning("llm_config.fallback_to_env", tenant_id=tenant_id, reason="no active config in Java")
            return AnthropicProvider()

    async def run(self, request: AgentRequest) -> AgentRunResult:
        case_id = request.context.get("case_id")
        if not case_id:
            raise ValueError("context.case_id is required")

        llm = await self._resolve_provider(str(request.tenant_id))
        case_data = await self._lookup._arun(case_id=case_id)
        question = request.input.get("question", "Summarize this case.")

        result = await llm.complete(
            system=SYSTEM_PROMPT,
            prompt=f"Case data (JSON):\n{case_data}\n\nQuestion: {question}",
        )

        return AgentRunResult(
            output={"answer": result.text},
            model=result.model,
            token_usage=TokenUsage(input=result.input_tokens, output=result.output_tokens),
        )