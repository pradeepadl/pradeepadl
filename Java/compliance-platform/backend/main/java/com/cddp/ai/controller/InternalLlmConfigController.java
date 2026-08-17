package com.cddp.ai.controller;

import com.cddp.ai.dto.ActiveLlmConfigResponse;
import com.cddp.ai.service.LlmProviderConfigService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Service-to-service only — the Python agent service calls this to
 * resolve which LLM provider/key to use for a tenant (see
 * pySDK/sdk/cddp_ai_sdk/config/llm_config_client.py). Returns the
 * decrypted API key; never route this to the admin UI/frontend.
 *
 * <p>Secured the same as every other endpoint in this app (Spring
 * Security's default — see files/ai-agent-integration-plan.md for the
 * still-open OAuth2 client-credentials wiring a real deployment needs so
 * Python can actually authenticate here).
 */
@RestController
@RequestMapping("/api/internal/llm-config")
public class InternalLlmConfigController {

    private final LlmProviderConfigService service;

    public InternalLlmConfigController(LlmProviderConfigService service) {
        this.service = service;
    }

    @GetMapping("/active")
    public ActiveLlmConfigResponse active(@RequestParam UUID tenantId) {
        return service.getActiveForPython(tenantId);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> notFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}