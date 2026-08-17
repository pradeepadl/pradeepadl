package com.cddp.ai.dto;

/** Mirrors the Python SDK's core.models.TokenUsage. */
public record TokenUsage(int input, int output) {
}