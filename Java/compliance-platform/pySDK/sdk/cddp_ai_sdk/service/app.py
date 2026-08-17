"""FastAPI scaffold every agent microservice runs. Exposes /health and
/agents for introspection, and starts the RabbitMQ consumer loop on
startup. The primary transport is RabbitMQ, not HTTP — /invoke exists only
as a synchronous escape hatch for local testing without a broker or a real
Java caller.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

import aio_pika
from fastapi import FastAPI, HTTPException

from ..agents.registry import AgentRegistry
from ..core.models import AgentRequest
from ..messaging.consumer import RequestConsumer


def create_app(registry: AgentRegistry) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        rabbitmq_url = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost/")
        connection = await aio_pika.connect_robust(rabbitmq_url)
        consumer = RequestConsumer(connection, registry)
        await consumer.start()
        app.state.rabbitmq_connection = connection
        yield
        await connection.close()

    app = FastAPI(title="CDDP AI Agent Service", lifespan=lifespan)

    @app.get("/health")
    async def health():
        return {"status": "ok", "agents": registry.names()}

    @app.get("/agents")
    async def agents():
        return {"agents": registry.names()}

    @app.post("/invoke")
    async def invoke(request: AgentRequest):
        """Synchronous escape hatch for local testing — bypasses RabbitMQ
        entirely. Not used by the real Java integration."""
        agent = registry.get(request.agent_name)
        if agent is None:
            raise HTTPException(404, f"Unknown agent: {request.agent_name}")
        return await agent.handle(request)

    return app
