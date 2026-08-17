"""Name -> agent instance. Lets a single microservice process host several
named agents; the request's `agent_name` selects which one runs."""
from __future__ import annotations

from .base_agent import BaseAgent


class AgentRegistry:
    def __init__(self) -> None:
        self._agents: dict[str, BaseAgent] = {}

    def register(self, agent: BaseAgent) -> None:
        self._agents[agent.name] = agent

    def get(self, name: str) -> BaseAgent | None:
        return self._agents.get(name)

    def names(self) -> list[str]:
        return sorted(self._agents)
