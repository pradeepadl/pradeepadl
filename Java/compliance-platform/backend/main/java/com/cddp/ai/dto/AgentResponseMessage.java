package com.cddp.ai.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Consumed from {@code ai.agent.responses}. Mirrors the Python SDK's
 * core.models.AgentResponse — field names must match after snake_case
 * conversion (see RabbitMqConfig's dedicated ObjectMapper). Keep the two
 * in lockstep.
 */
public record AgentResponseMessage(
        UUID jobId,
        UUID correlationId,
        String status,
        Map<String, Object> output,
        String agentName,
        String model,
        TokenUsage tokenUsage,
        long durationMs,
        String error,
        Instant completedAt
) {
}