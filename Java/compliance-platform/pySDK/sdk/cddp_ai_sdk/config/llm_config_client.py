"""Fetches the active LLM provider config for a tenant from Java's
InternalLlmConfigController (com.cddp.ai.controller) — the DB-backed
counterpart to the admin Integrations page's "AI Model Provider" panel.
Agents call this instead of hardcoding a provider/key, so switching
Claude/Gemini/HuggingFace (or rotating a key) never needs a redeploy.
"""
from __future__ import annotations

import os

import httpx

from ..auth.java_token_cache import java_token_cache


class NoActiveLlmConfigError(RuntimeError):
    """Raised when the tenant has no active provider configured in Java."""


async def fetch_active_llm_config(tenant_id: str) -> dict:
    """Returns {"provider": "CLAUDE"|"GEMINI"|"HUGGINGFACE", "api_key": str,
    "model_name": str | None} for the given tenant's active provider."""
    base_url = os.environ["JAVA_BACKEND_URL"]
    token = await java_token_cache.get()
    url = f"{base_url.rstrip('/')}/api/internal/llm-config/active"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            params={"tenantId": tenant_id},
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code == 404:
            raise NoActiveLlmConfigError(f"No active AI provider configured for tenant {tenant_id}")
        response.raise_for_status()
        return response.json()