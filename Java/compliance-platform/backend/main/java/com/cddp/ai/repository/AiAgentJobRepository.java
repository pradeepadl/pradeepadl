package com.cddp.ai.repository;

import com.cddp.ai.entity.AiAgentJob;
import com.cddp.ai.entity.AiJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AiAgentJobRepository extends JpaRepository<AiAgentJob, UUID> {

    List<AiAgentJob> findByStatusInAndSubmittedTsBefore(List<AiJobStatus> statuses, Instant cutoff);
}