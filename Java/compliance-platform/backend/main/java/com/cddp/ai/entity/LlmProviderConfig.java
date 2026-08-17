package com.cddp.ai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Maps to tcfg_llm_provider_cfgs (backend/main/resources/db/changelog/ddl/0012-llm-provider-cfgs.yaml).
 * One row per (tenant, provider); at most one row per tenant has
 * active=true (enforced by a partial unique index in the DB, and by
 * LlmProviderConfigService deactivating siblings before activating one).
 */
@Entity
@Table(name = "tcfg_llm_provider_cfgs")
public class LlmProviderConfig {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private LlmProvider provider;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "api_key_encrypted", nullable = false, columnDefinition = "text")
    private String apiKeyEncrypted;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "crtd_ts", nullable = false)
    private Instant createdTs;

    @Column(name = "crtd_nm")
    private String createdBy;

    @Column(name = "last_updd_ts")
    private Instant lastUpdatedTs;

    @Column(name = "last_updd_nm")
    private String lastUpdatedBy;

    @Column(name = "ver", nullable = false)
    private long version;

    protected LlmProviderConfig() {
        // JPA
    }

    public LlmProviderConfig(UUID id, UUID tenantId, LlmProvider provider, String modelName,
                              String apiKeyEncrypted, boolean active, String createdBy, Instant createdTs) {
        this.id = id;
        this.tenantId = tenantId;
        this.provider = provider;
        this.modelName = modelName;
        this.apiKeyEncrypted = apiKeyEncrypted;
        this.active = active;
        this.createdBy = createdBy;
        this.createdTs = createdTs;
        this.version = 0;
    }

    public UUID getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public LlmProvider getProvider() {
        return provider;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getApiKeyEncrypted() {
        return apiKeyEncrypted;
    }

    public void setApiKeyEncrypted(String apiKeyEncrypted) {
        this.apiKeyEncrypted = apiKeyEncrypted;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedTs() {
        return createdTs;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Instant getLastUpdatedTs() {
        return lastUpdatedTs;
    }

    public void setLastUpdatedTs(Instant lastUpdatedTs) {
        this.lastUpdatedTs = lastUpdatedTs;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public long getVersion() {
        return version;
    }
}