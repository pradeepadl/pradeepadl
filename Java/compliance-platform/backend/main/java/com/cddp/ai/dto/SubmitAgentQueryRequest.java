package com.cddp.ai.dto;

import java.util.Map;

/** Request body for POST /api/ai/agents/{agentName}/queries. */
public record SubmitAgentQueryRequest(
        Map<String, Object> context,
        Map<String, Object> input
) {
}