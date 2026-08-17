package com.cddp.ai.entity;

/**
 * Mirrors the CHECK constraint on tcfg_llm_provider_cfgs.provider and the
 * Python SDK's llm.factory provider names — keep the three in lockstep.
 */
public enum LlmProvider {
    CLAUDE,
    GEMINI,
    HUGGINGFACE
}