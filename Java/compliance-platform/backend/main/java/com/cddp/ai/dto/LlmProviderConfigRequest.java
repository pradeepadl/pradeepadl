package com.cddp.ai.dto;

/** Request body for PUT /api/admin/integrations/llm-providers. */
public record LlmProviderConfigRequest(
        String provider,
        String apiKey,
        String modelName,
        boolean active
) {
}