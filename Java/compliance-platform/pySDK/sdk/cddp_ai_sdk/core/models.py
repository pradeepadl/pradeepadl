"""Shared JSON message contract between Java and the Python agent services.

Both sides validate against this shape — Java via a matching Jackson DTO
(see backend com.cddp.ai.dto), Python via these Pydantic models. Keep the
two in lockstep; this file is the source of truth for the wire format.

Field names are snake_case on the wire (Java serializes its camelCase DTOs
through a dedicated snake_case ObjectMapper for exactly this reason) — do
not rename fields here without updating the Java side to match.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    TIMED_OUT = "TIMED_OUT"


class AgentRequest(BaseModel):
    """Published by Java onto `ai.agent.requests`."""

    job_id: UUID
    tenant_id: UUID
    agent_name: str
    correlation_id: UUID
    requested_by: str
    context: dict[str, Any] = Field(default_factory=dict)
    input: dict[str, Any] = Field(default_factory=dict)
    submitted_at: datetime


class TokenUsage(BaseModel):
    input: int = 0
    output: int = 0


class AgentResponse(BaseModel):
    """Published by Python onto `ai.agent.responses`."""

    job_id: UUID
    correlation_id: UUID
    status: JobStatus
    output: dict[str, Any] = Field(default_factory=dict)
    agent_name: str
    model: Optional[str] = None
    token_usage: TokenUsage = Field(default_factory=TokenUsage)
    duration_ms: int = 0
    error: Optional[str] = None
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @classmethod
    def failure(cls, request: "AgentRequest", error: str, duration_ms: int = 0) -> "AgentResponse":
        return cls(
            job_id=request.job_id,
            correlation_id=request.correlation_id,
            status=JobStatus.FAILED,
            agent_name=request.agent_name,
            error=error,
            duration_ms=duration_ms,
        )