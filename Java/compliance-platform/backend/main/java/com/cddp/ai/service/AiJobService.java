package com.cddp.ai.service;

import com.cddp.ai.config.RabbitMqConfig;
import com.cddp.ai.dto.AgentJobStatusResponse;
import com.cddp.ai.dto.AgentRequestMessage;
import com.cddp.ai.dto.SubmitAgentQueryRequest;
import com.cddp.ai.dto.TokenUsage;
import com.cddp.ai.entity.AiAgentJob;
import com.cddp.ai.entity.AiJobStatus;
import com.cddp.ai.repository.AiAgentJobRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class AiJobService {

    private final AiAgentJobRepository jobRepository;
    private final RabbitTemplate rabbitTemplate;

    public AiJobService(AiAgentJobRepository jobRepository, RabbitTemplate rabbitTemplate) {
        this.jobRepository = jobRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Creates the job row and publishes the request to Python. The job id
     * doubles as the AMQP correlation id — the same idempotency-guard
     * shape already used by TSUB_DUPLICATE_IDEMPOTENCY, applied here to
     * message redelivery.
     *
     * <p>{@code tenantId} is accepted as an explicit argument for now
     * (Phase 1 walking skeleton) rather than resolved from an
     * authenticated tenant context — there's no multi-tenant session
     * plumbing in this codebase yet. Replace once that exists.
     */
    public UUID submit(String agentName, UUID tenantId, String requestedBy, SubmitAgentQueryRequest request) {
        UUID jobId = UUID.randomUUID();
        Instant now = Instant.now();

        Map<String, Object> context = request.context() == null ? Map.of() : request.context();
        Map<String, Object> input = request.input() == null ? Map.of() : request.input();

        AiAgentJob job = new AiAgentJob(
                jobId, tenantId, agentName, requestedBy,
                extractUuid(context, "case_id"), extractUuid(context, "client_id"),
                AiJobStatus.PENDING,
                Map.of("context", context, "input", input),
                now
        );
        jobRepository.save(job);

        AgentRequestMessage message = new AgentRequestMessage(
                jobId, tenantId, agentName, jobId, requestedBy, context, input, now
        );
        rabbitTemplate.convertAndSend(RabbitMqConfig.REQUEST_QUEUE, message);

        return jobId;
    }

    public AgentJobStatusResponse getStatus(UUID jobId) {
        AiAgentJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new NoSuchElementException("Unknown AI job: " + jobId));

        TokenUsage tokenUsage = null;
        if (job.getTokenUsage() != null) {
            tokenUsage = new TokenUsage(
                    toInt(job.getTokenUsage().get("input")),
                    toInt(job.getTokenUsage().get("output"))
            );
        }

        return new AgentJobStatusResponse(
                job.getId(), job.getStatus().name(), job.getResponsePayload(), job.getModel(),
                tokenUsage, job.getErrorMessage(), job.getSubmittedTs(), job.getCompletedTs(), job.getDurationMs()
        );
    }

    private static int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private static UUID extractUuid(Map<String, Object> context, String key) {
        Object value = context.get(key);
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}