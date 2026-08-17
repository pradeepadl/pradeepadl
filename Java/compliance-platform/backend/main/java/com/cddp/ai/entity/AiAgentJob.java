package com.cddp.ai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Maps to tlog_ai_agent_jobs (backend/main/resources/db/changelog/ddl/0011-ai-jobs.yaml).
 * One row per AI agent invocation submitted from the UI via AiAgentController;
 * updated in place by AiAgentResponseListener when the Python side replies.
 */
@Entity
@Table(name = "tlog_ai_agent_jobs")
public class AiAgentJob {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "agent_name", nullable = false, length = 100)
    private String agentName;

    @Column(name = "requested_by", length = 150)
    private String requestedBy;

    @Column(name = "case_id")
    private UUID caseId;

    @Column(name = "client_id")
    private UUID clientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AiJobStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_payload", columnDefinition = "jsonb")
    private Map<String, Object> requestPayload;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_payload", columnDefinition = "jsonb")
    private Map<String, Object> responsePayload;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "model", length = 100)
    private String model;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "token_usage", columnDefinition = "jsonb")
    private Map<String, Object> tokenUsage;

    @Column(name = "submitted_ts", nullable = false)
    private Instant submittedTs;

    @Column(name = "completed_ts")
    private Instant completedTs;

    @Column(name = "duration_ms")
    private Long durationMs;

    protected AiAgentJob() {
        // JPA
    }

    public AiAgentJob(UUID id, UUID tenantId, String agentName, String requestedBy,
                       UUID caseId, UUID clientId, AiJobStatus status,
                       Map<String, Object> requestPayload, Instant submittedTs) {
        this.id = id;
        this.tenantId = tenantId;
        this.agentName = agentName;
        this.requestedBy = requestedBy;
        this.caseId = caseId;
        this.clientId = clientId;
        this.status = status;
        this.requestPayload = requestPayload;
        this.submittedTs = submittedTs;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public String getAgentName() {
        return agentName;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public UUID getCaseId() {
        return caseId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public AiJobStatus getStatus() {
        return status;
    }

    public void setStatus(AiJobStatus status) {
        this.status = status;
    }

    public Map<String, Object> getRequestPayload() {
        return requestPayload;
    }

    public Map<String, Object> getResponsePayload() {
        return responsePayload;
    }

    public void setResponsePayload(Map<String, Object> responsePayload) {
        this.responsePayload = responsePayload;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Map<String, Object> getTokenUsage() {
        return tokenUsage;
    }

    public void setTokenUsage(Map<String, Object> tokenUsage) {
        this.tokenUsage = tokenUsage;
    }

    public Instant getSubmittedTs() {
        return submittedTs;
    }

    public Instant getCompletedTs() {
        return completedTs;
    }

    public void setCompletedTs(Instant completedTs) {
        this.completedTs = completedTs;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }
}