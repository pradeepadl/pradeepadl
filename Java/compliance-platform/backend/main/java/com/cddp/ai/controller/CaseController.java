package com.cddp.ai.controller;

import com.cddp.ai.repository.CaseLookupRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Minimal read-only case lookup — this is what CaseLookupTool
 * (pySDK/services/kyc-risk-agent) calls to fetch case data for the
 * kyc-risk-summarizer agent. Not a general case-management API; expand
 * (list/create/update, DTO projection, pagination) if this needs to serve
 * the frontend's case pages too.
 */
@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseLookupRepository caseLookupRepository;

    public CaseController(CaseLookupRepository caseLookupRepository) {
        this.caseLookupRepository = caseLookupRepository;
    }

    @GetMapping("/{caseId}")
    public Map<String, Object> getCase(@PathVariable UUID caseId) {
        return caseLookupRepository.findById(caseId)
                .orElseThrow(() -> new NoSuchElementException("Unknown case: " + caseId));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> notFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}
