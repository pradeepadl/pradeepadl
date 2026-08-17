"""Google Gemini LLMProvider adapter.

`google-genai` and `langchain-google-genai` are lazy imports — they're
not in the SDK's base dependency set (see pySDK/sdk/pyproject.toml's
`gemini` extra), so a deployment that never selects Gemini never needs
them installed. Selecting Gemini without the extra installed fails with a
clear ImportError instead of a confusing one at import time.
"""
from __future__ import annotations

from .base import LLMProvider, LLMResult

DEFAULT_MODEL = "gemini-2.5-flash"


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        try:
            from google import genai
        except ImportError as exc:  # pragma: no cover - depends on optional extra
            raise ImportError(
                "GeminiProvider needs the 'gemini' extra: pip install cddp-ai-sdk[gemini]"
            ) from exc

        self._api_key = api_key
        self._model = model
        self._client = genai.Client(api_key=api_key)

    async def complete(self, *, system: str, prompt: str, max_tokens: int = 1024) -> LLMResult:
        from google.genai import types

        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
            ),
        )
        usage = response.usage_metadata
        return LLMResult(
            text=response.text or "",
            model=self._model,
            input_tokens=getattr(usage, "prompt_token_count", 0) or 0,
            output_tokens=getattr(usage, "candidates_token_count", 0) or 0,
        )

    def as_langchain(self):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ImportError as exc:  # pragma: no cover - depends on optional extra
            raise ImportError(
                "GeminiProvider.as_langchain() needs the 'gemini' extra: pip install cddp-ai-sdk[gemini]"
            ) from exc
        return ChatGoogleGenerativeAI(model=self._model, google_api_key=self._api_key)