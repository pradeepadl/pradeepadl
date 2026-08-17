"""LangChain Tool base class for agents that need to call back into Java's
REST API (case/client/party lookups) mid-reasoning. Uses the shared
JavaTokenCache (cddp_ai_sdk.auth) so individual tools don't each
reimplement OAuth2 client-credentials auth.
"""
from __future__ import annotations

import os

import httpx
from langchain_core.tools import BaseTool

from ..auth.java_token_cache import java_token_cache


class JavaBackendTool(BaseTool):
    """Subclass and set `name`/`description`/`path` to expose a single Java
    REST endpoint as a LangGraph tool. `path` may contain `{}` placeholders
    filled from the tool call's kwargs, e.g. `"api/cases/{case_id}"`."""

    path: str = ""

    async def _acall_json(self, **path_params) -> dict:
        base_url = os.environ["JAVA_BACKEND_URL"]
        token = await java_token_cache.get()
        url = base_url.rstrip("/") + "/" + self.path.format(**path_params).lstrip("/")
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
            return response.json()

    def _run(self, *args, **kwargs):  # pragma: no cover - async-only tool
        raise NotImplementedError("JavaBackendTool is async-only; use _arun")
