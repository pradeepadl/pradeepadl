package com.cddp.ai.dto;

import java.time.Instant;
import java.util.UUID;

/** What the admin UI sees — maskedApiKey only, never the real key. */
public record LlmProviderConfigResponse(
        UUID id,
        String provider,
        String modelName,
        String maskedApiKey,
        boolean active,
        Instant lastUpdatedTs
) {
}