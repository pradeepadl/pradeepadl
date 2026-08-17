"""Publishes AgentResponse messages onto `ai.agent.responses`.

Uses the default (nameless) exchange with routing_key = queue name, which
RabbitMQ auto-binds to every queue — the same mechanism the Java side uses
via RabbitTemplate.convertAndSend(queueName, message), so neither side
needs to declare an explicit exchange or binding.
"""
from __future__ import annotations

import aio_pika

from ..core.models import AgentResponse

RESPONSE_QUEUE = "ai.agent.responses"


class ResponsePublisher:
    def __init__(self, connection: aio_pika.abc.AbstractRobustConnection) -> None:
        self._connection = connection

    async def publish(self, response: AgentResponse) -> None:
        channel = await self._connection.channel()
        await channel.declare_queue(RESPONSE_QUEUE, durable=True)
        await channel.default_exchange.publish(
            aio_pika.Message(
                body=response.model_dump_json().encode("utf-8"),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                correlation_id=str(response.correlation_id),
            ),
            routing_key=RESPONSE_QUEUE,
        )
