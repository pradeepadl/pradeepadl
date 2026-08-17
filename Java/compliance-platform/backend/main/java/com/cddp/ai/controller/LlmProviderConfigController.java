package com.cddp.ai.controller;

import com.cddp.ai.dto.LlmProviderConfigRequest;
import com.cddp.ai.dto.LlmProviderConfigResponse;
import com.cddp.ai.service.LlmProviderConfigService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Admin-facing CRUD for AI model provider selection — backs the admin
 * Integrations page's "AI Model Provider" panel (pick Claude/Gemini/
 * HuggingFace, save an API key, mark one active). Never returns a raw
 * API key: LlmProviderConfigService masks it before it leaves the
 * service layer. The decrypted key only ever leaves this app via
 * InternalLlmConfigController, which the Python agent service calls —
 * keep that separation; don't add a "reveal key" endpoint here.
 */
@RestController
@RequestMapping("/api/admin/integrations/llm-providers")
public class LlmProviderConfigController {

    private final LlmProviderConfigService service;

    public LlmProviderConfigController(LlmProviderConfigService service) {
        this.service = service;
    }

    @GetMapping
    public List<LlmProviderConfigResponse> list(@RequestParam UUID tenantId) {
        return service.list(tenantId);
    }

    @PutMapping
    public LlmProviderConfigResponse upsert(
            @RequestParam UUID tenantId,
            @RequestBody LlmProviderConfigRequest request,
            Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "unknown";
        return service.upsert(tenantId, updatedBy, request);
    }

    @PostMapping("/{provider}/activate")
    public LlmProviderConfigResponse activate(
            @RequestParam UUID tenantId,
            @PathVariable String provider,
            Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "unknown";
        return service.activate(tenantId, provider, updatedBy);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> notFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}