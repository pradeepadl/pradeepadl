package com.cddp.ai.dto;

import java.util.UUID;

/** Response body for POST /api/ai/agents/{agentName}/queries. */
public record SubmitAgentQueryResponse(UUID jobId) {
}