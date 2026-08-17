package com.cddp.ai.controller;

import com.cddp.ai.dto.AgentJobStatusResponse;
import com.cddp.ai.dto.SubmitAgentQueryRequest;
import com.cddp.ai.dto.SubmitAgentQueryResponse;
import com.cddp.ai.service.AiJobService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Submit/poll surface the frontend calls (see
 * files/ai-agent-integration-plan.md, "async job + polling"). Submitting
 * publishes to RabbitMQ and returns immediately; the UI polls the status
 * endpoint until the job reaches a terminal state.
 */
@RestController
@RequestMapping("/api/ai/agents")
public class AiAgentController {

    private final AiJobService jobService;

    public AiAgentController(AiJobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping("/{agentName}/queries")
    public ResponseEntity<SubmitAgentQueryResponse> submit(
            @PathVariable String agentName,
            // Phase 1 simplification: no multi-tenant session context yet
            // in this codebase, so the caller passes tenantId explicitly.
            // Replace with a resolved-from-auth tenant once that exists.
            @RequestParam UUID tenantId,
            @RequestBody SubmitAgentQueryRequest request,
            Authentication authentication) {
        String requestedBy = authentication != null ? authentication.getName() : "unknown";
        UUID jobId = jobService.submit(agentName, tenantId, requestedBy, request);
        return ResponseEntity
                .created(URI.create("/api/ai/agents/queries/" + jobId))
                .body(new SubmitAgentQueryResponse(jobId));
    }

    @GetMapping("/queries/{jobId}")
    public AgentJobStatusResponse status(@PathVariable UUID jobId) {
        return jobService.getStatus(jobId);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> notFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}