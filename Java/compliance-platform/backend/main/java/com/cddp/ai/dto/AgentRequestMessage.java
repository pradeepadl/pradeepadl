package com.cddp.ai.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Published onto {@code ai.agent.requests}. Mirrors the Python SDK's
 * core.models.AgentRequest — field names must match after snake_case
 * conversion (see RabbitMqConfig's dedicated ObjectMapper). Keep the two
 * in lockstep.
 */
public record AgentRequestMessage(
        UUID jobId,
        UUID tenantId,
        String agentName,
        UUID correlationId,
        String requestedBy,
        Map<String, Object> context,
        Map<String, Object> input,
        Instant submittedAt
) {
}