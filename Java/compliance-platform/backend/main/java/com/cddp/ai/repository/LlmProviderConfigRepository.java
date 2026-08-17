package com.cddp.ai.repository;

import com.cddp.ai.entity.LlmProvider;
import com.cddp.ai.entity.LlmProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LlmProviderConfigRepository extends JpaRepository<LlmProviderConfig, UUID> {

    List<LlmProviderConfig> findByTenantId(UUID tenantId);

    Optional<LlmProviderConfig> findByTenantIdAndProvider(UUID tenantId, LlmProvider provider);

    Optional<LlmProviderConfig> findByTenantIdAndActiveTrue(UUID tenantId);
}