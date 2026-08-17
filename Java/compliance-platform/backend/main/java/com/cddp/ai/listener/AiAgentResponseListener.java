package com.cddp.ai.listener;

import com.cddp.ai.config.RabbitMqConfig;
import com.cddp.ai.dto.AgentResponseMessage;
import com.cddp.ai.entity.AiAgentJob;
import com.cddp.ai.entity.AiJobStatus;
import com.cddp.ai.repository.AiAgentJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/** Consumes {@code ai.agent.responses} and updates the matching job row. */
@Component
public class AiAgentResponseListener {

    private static final Logger log = LoggerFactory.getLogger(AiAgentResponseListener.class);

    private final AiAgentJobRepository jobRepository;

    public AiAgentResponseListener(AiAgentJobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @RabbitListener(queues = RabbitMqConfig.RESPONSE_QUEUE)
    public void onResponse(AgentResponseMessage message) {
        jobRepository.findById(message.jobId()).ifPresentOrElse(job -> {
            job.setStatus(AiJobStatus.valueOf(message.status()));
            job.setResponsePayload(message.output());
            job.setModel(message.model());
            job.setErrorMessage(message.error());
            job.setDurationMs(message.durationMs());
            job.setCompletedTs(message.completedAt() != null ? message.completedAt() : Instant.now());

            if (message.tokenUsage() != null) {
                Map<String, Object> usage = new HashMap<>();
                usage.put("input", message.tokenUsage().input());
                usage.put("output", message.tokenUsage().output());
                job.setTokenUsage(usage);
            }

            jobRepository.save(job);
            log.info("AI job {} updated to {}", job.getId(), job.getStatus());
        }, () -> log.warn("Received AI agent response for unknown job {}", message.jobId()));
    }
}