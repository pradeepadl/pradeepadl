package com.cddp.ai.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Response body for GET /api/ai/agents/queries/{jobId} — what the UI polls. */
public record AgentJobStatusResponse(
        UUID jobId,
        String status,
        Map<String, Object> output,
        String model,
        TokenUsage tokenUsage,
        String errorMessage,
        Instant submittedTs,
        Instant completedTs,
        Long durationMs
) {
}