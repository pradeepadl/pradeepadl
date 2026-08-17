package com.cddp.ai.scheduler;

import com.cddp.ai.entity.AiAgentJob;
import com.cddp.ai.entity.AiJobStatus;
import com.cddp.ai.repository.AiAgentJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Catches AI agent jobs that never got a response (Python crash, broker
 * hiccup, unroutable message) so they don't sit PENDING/RUNNING forever.
 * A plain {@code @Scheduled} sweep for now — spring-boot-starter-batch is
 * already a dependency, so this could be promoted to a formal batch job
 * later if the sweep logic grows beyond a single query + bulk update.
 */
@Component
public class AiJobTimeoutSweeper {

    private static final Logger log = LoggerFactory.getLogger(AiJobTimeoutSweeper.class);
    private static final long TIMEOUT_MINUTES = 5;

    private final AiAgentJobRepository jobRepository;

    public AiJobTimeoutSweeper(AiAgentJobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Scheduled(fixedDelay = 60_000)
    public void sweep() {
        Instant cutoff = Instant.now().minus(TIMEOUT_MINUTES, ChronoUnit.MINUTES);
        List<AiAgentJob> stale = jobRepository.findByStatusInAndSubmittedTsBefore(
                List.of(AiJobStatus.PENDING, AiJobStatus.RUNNING), cutoff);

        if (stale.isEmpty()) {
            return;
        }

        for (AiAgentJob job : stale) {
            job.setStatus(AiJobStatus.TIMED_OUT);
            job.setErrorMessage("No response received within " + TIMEOUT_MINUTES + " minutes");
            job.setCompletedTs(Instant.now());
        }
        jobRepository.saveAll(stale);
        log.warn("Timed out {} stale AI agent job(s)", stale.size());
    }
}