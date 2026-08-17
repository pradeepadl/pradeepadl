package com.cddp.ai.dto;

/**
 * What InternalLlmConfigController returns — the decrypted key, for the
 * Python agent service only. Never route this DTO to a frontend-facing
 * controller.
 */
public record ActiveLlmConfigResponse(
        String provider,
        String apiKey,
        String modelName
) {
}