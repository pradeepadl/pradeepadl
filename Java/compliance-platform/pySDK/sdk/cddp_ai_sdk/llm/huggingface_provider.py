"""Hugging Face Inference LLMProvider adapter.

`huggingface_hub` and `langchain-huggingface` are lazy imports — see the
'huggingface' extra in pySDK/sdk/pyproject.toml and the note in
gemini_provider.py for why.
"""
from __future__ import annotations

from .base import LLMProvider, LLMResult

DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct"


class HuggingFaceProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        try:
            from huggingface_hub import AsyncInferenceClient
        except ImportError as exc:  # pragma: no cover - depends on optional extra
            raise ImportError(
                "HuggingFaceProvider needs the 'huggingface' extra: pip install cddp-ai-sdk[huggingface]"
            ) from exc

        self._api_key = api_key
        self._model = model
        self._client = AsyncInferenceClient(model=model, token=api_key)

    async def complete(self, *, system: str, prompt: str, max_tokens: int = 1024) -> LLMResult:
        # chat_completion() is OpenAI-compatible across HF Inference
        # providers, unlike the older text_generation() endpoint, which
        # varies per model.
        response = await self._client.chat_completion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
        )
        choice = response.choices[0].message
        usage = response.usage
        return LLMResult(
            text=choice.content or "",
            model=self._model,
            input_tokens=getattr(usage, "prompt_tokens", 0) or 0,
            output_tokens=getattr(usage, "completion_tokens", 0) or 0,
        )

    def as_langchain(self):
        try:
            from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
        except ImportError as exc:  # pragma: no cover - depends on optional extra
            raise ImportError(
                "HuggingFaceProvider.as_langchain() needs the 'huggingface' extra: "
                "pip install cddp-ai-sdk[huggingface]"
            ) from exc
        endpoint = HuggingFaceEndpoint(repo_id=self._model, huggingfacehub_api_token=self._api_key)
        return ChatHuggingFace(llm=endpoint)