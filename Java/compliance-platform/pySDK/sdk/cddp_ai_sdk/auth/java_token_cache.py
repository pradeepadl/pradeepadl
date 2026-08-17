"""One shared, lazily-refreshed OAuth2 client-credentials token per
process for calling back into Java — used by both JavaBackendTool (case/
client lookups) and llm_config_client (provider config lookups) so
neither fetches its own token independently.
"""
from __future__ import annotations

import os
import time

import httpx


class JavaTokenCache:
    def __init__(self) -> None:
        self._token: str | None = None
        self._expires_at: float = 0.0

    async def get(self) -> str:
        if self._token and time.monotonic() < self._expires_at - 30:
            return self._token
        token_url = os.environ["OAUTH2_TOKEN_URL"]
        client_id = os.environ["OAUTH2_CLIENT_ID"]
        client_secret = os.environ["OAUTH2_CLIENT_SECRET"]
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                # scope must be requested explicitly — Spring Authorization
                # Server does NOT default to a client's full registered
                # scope set when the request omits it; an omitted scope
                # here issues a token with none at all, which then 403s on
                # anything gated by hasAuthority("SCOPE_internal.read")
                # (see com.cddp.config.SecurityConfig).
                data={"grant_type": "client_credentials", "scope": "internal.read"},
                auth=(client_id, client_secret),
            )
            response.raise_for_status()
            body = response.json()
        self._token = body["access_token"]
        self._expires_at = time.monotonic() + body.get("expires_in", 300)
        return self._token


java_token_cache = JavaTokenCache()
