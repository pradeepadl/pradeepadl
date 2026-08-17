"""Consumes AgentRequest messages from `ai.agent.requests`, dispatches to
the matching agent in the registry, and publishes the result.
"""
from __future__ import annotations

import aio_pika
import structlog

from ..agents.registry import AgentRegistry
from ..core.models import AgentRequest, AgentResponse
from .publisher import ResponsePublisher

REQUEST_QUEUE = "ai.agent.requests"
log = structlog.get_logger()


class RequestConsumer:
    def __init__(self, connection: aio_pika.abc.AbstractRobustConnection, registry: AgentRegistry) -> None:
        self._connection = connection
        self._registry = registry

    async def start(self) -> None:
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=4)
        queue = await channel.declare_queue(REQUEST_QUEUE, durable=True)
        publisher = ResponsePublisher(self._connection)
        await queue.consume(self._make_handler(publisher))
        log.info("consumer.started", queue=REQUEST_QUEUE, agents=self._registry.names())

    def _make_handler(self, publisher: ResponsePublisher):
        async def handle(message: aio_pika.IncomingMessage) -> None:
            async with message.process():
                request = AgentRequest.model_validate_json(message.body)
                log.info("job.received", job_id=str(request.job_id), agent=request.agent_name)

                agent = self._registry.get(request.agent_name)
                if agent is None:
                    log.error("agent.unknown", agent=request.agent_name)
                    response = AgentResponse.failure(request, error=f"Unknown agent: {request.agent_name}")
                else:
                    response = await agent.handle(request)

                await publisher.publish(response)
                log.info("job.completed", job_id=str(request.job_id), status=response.status)

        return handle
