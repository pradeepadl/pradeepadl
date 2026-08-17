package com.cddp.ai.service;

import com.cddp.ai.crypto.ApiKeyCipher;
import com.cddp.ai.dto.ActiveLlmConfigResponse;
import com.cddp.ai.dto.LlmProviderConfigRequest;
import com.cddp.ai.dto.LlmProviderConfigResponse;
import com.cddp.ai.entity.LlmProvider;
import com.cddp.ai.entity.LlmProviderConfig;
import com.cddp.ai.repository.LlmProviderConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Backs the admin Integrations page's "AI Model Provider" panel and the
 * Python agent service's provider lookup. See
 * files/ai-agent-integration-plan.md and backend/.../ai/entity/LlmProviderConfig.java.
 */
@Service
public class LlmProviderConfigService {

    private final LlmProviderConfigRepository repository;
    private final ApiKeyCipher cipher;

    public LlmProviderConfigService(LlmProviderConfigRepository repository, ApiKeyCipher cipher) {
        this.repository = repository;
        this.cipher = cipher;
    }

    /** Masked — safe for the admin UI. */
    public List<LlmProviderConfigResponse> list(UUID tenantId) {
        return repository.findByTenantId(tenantId).stream().map(this::toResponse).toList();
    }

    /**
     * Create-or-replace the config for (tenantId, provider). Setting
     * active=true deactivates every other provider for this tenant first
     * — enforced here AND at the DB level (partial unique index on
     * tenant_id WHERE is_active), so a race loses to the constraint
     * rather than silently leaving two providers active.
     */
    @Transactional
    public LlmProviderConfigResponse upsert(UUID tenantId, String updatedBy, LlmProviderConfigRequest request) {
        if (request.apiKey() == null || request.apiKey().isBlank()) {
            throw new IllegalArgumentException("apiKey is required");
        }
        LlmProvider provider;
        try {
            provider = LlmProvider.valueOf(request.provider().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown provider: " + request.provider());
        }

        if (request.active()) {
            deactivateAll(tenantId);
        }

        String encryptedKey = cipher.encrypt(request.apiKey());
        LlmProviderConfig config = repository.findByTenantIdAndProvider(tenantId, provider)
                .orElseGet(() -> new LlmProviderConfig(
                        UUID.randomUUID(), tenantId, provider, request.modelName(),
                        encryptedKey, request.active(), updatedBy, Instant.now()));

        config.setModelName(request.modelName());
        config.setApiKeyEncrypted(encryptedKey);
        config.setActive(request.active());
        config.setLastUpdatedBy(updatedBy);
        config.setLastUpdatedTs(Instant.now());

        return toResponse(repository.save(config));
    }

    @Transactional
    public LlmProviderConfigResponse activate(UUID tenantId, String providerName, String updatedBy) {
        LlmProvider target;
        try {
            target = LlmProvider.valueOf(providerName.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown provider: " + providerName);
        }
        LlmProviderConfig config = repository.findByTenantIdAndProvider(tenantId, target)
                .orElseThrow(() -> new NoSuchElementException("No config saved for provider: " + providerName));

        deactivateAll(tenantId);
        config.setActive(true);
        config.setLastUpdatedBy(updatedBy);
        config.setLastUpdatedTs(Instant.now());
        return toResponse(repository.save(config));
    }

    /**
     * Decrypted — internal use only (InternalLlmConfigController), never
     * exposed to the admin UI or any frontend-facing response.
     */
    public ActiveLlmConfigResponse getActiveForPython(UUID tenantId) {
        LlmProviderConfig config = repository.findByTenantIdAndActiveTrue(tenantId)
                .orElseThrow(() -> new NoSuchElementException("No active AI provider configured for tenant " + tenantId));
        return new ActiveLlmConfigResponse(
                config.getProvider().name(), cipher.decrypt(config.getApiKeyEncrypted()), config.getModelName());
    }

    private void deactivateAll(UUID tenantId) {
        repository.findByTenantId(tenantId).forEach(config -> {
            if (config.isActive()) {
                config.setActive(false);
                repository.save(config);
            }
        });
    }

    private LlmProviderConfigResponse toResponse(LlmProviderConfig config) {
        return new LlmProviderConfigResponse(
                config.getId(), config.getProvider().name(), config.getModelName(),
                mask(cipher.decrypt(config.getApiKeyEncrypted())), config.isActive(), config.getLastUpdatedTs());
    }

    private static String mask(String apiKey) {
        if (apiKey.length() <= 4) {
            return "••••";
        }
        return "••••••••" + apiKey.substring(apiKey.length() - 4);
    }
}