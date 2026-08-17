"""Maps a provider name (as stored in Java's tcfg_llm_provider_cfgs /
returned by InternalLlmConfigController) to the matching LLMProvider
adapter. This is the one place that needs to change to add a new vendor —
agents themselves stay provider-agnostic (see agents/base_agent.py).
"""
from __future__ import annotations

from .anthropic_provider import DEFAULT_MODEL as CLAUDE_DEFAULT_MODEL
from .anthropic_provider import AnthropicProvider
from .base import LLMProvider
from .gemini_provider import DEFAULT_MODEL as GEMINI_DEFAULT_MODEL
from .gemini_provider import GeminiProvider
from .huggingface_provider import DEFAULT_MODEL as HUGGINGFACE_DEFAULT_MODEL
from .huggingface_provider import HuggingFaceProvider

_PROVIDERS = {
    "CLAUDE": (AnthropicProvider, CLAUDE_DEFAULT_MODEL),
    "GEMINI": (GeminiProvider, GEMINI_DEFAULT_MODEL),
    "HUGGINGFACE": (HuggingFaceProvider, HUGGINGFACE_DEFAULT_MODEL),
}


def create_provider(provider: str, api_key: str, model: str | None = None) -> LLMProvider:
    key = provider.upper()
    if key not in _PROVIDERS:
        raise ValueError(f"Unknown LLM provider: {provider!r} (expected one of {sorted(_PROVIDERS)})")
    provider_cls, default_model = _PROVIDERS[key]
    return provider_cls(api_key=api_key, model=model or default_model)