package com.cddp.ai.entity;

/**
 * Mirrors the JobStatus enum in the Python SDK's core.models — keep the
 * two in lockstep, the string values cross the wire as-is.
 */
public enum AiJobStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED,
    TIMED_OUT
}