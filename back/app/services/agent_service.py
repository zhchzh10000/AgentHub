from __future__ import annotations

from typing import Literal

from ..models import AIModel, Agent
from ..store import STORE


def update_agent_model(project_id: str, agent_id: str, model: AIModel) -> Agent:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")

    for idx, agent in enumerate(project.agents):
        if agent.id == agent_id:
            updated_agent = agent.model_copy(update={"model": model})
            project.agents[idx] = updated_agent
            STORE.update_project(project)
            return updated_agent

    raise ValueError("Agent not found")


def update_agent_status(
    project_id: str, agent_id: str, status: Literal["online", "offline", "busy"]
) -> Agent:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")

    for idx, agent in enumerate(project.agents):
        if agent.id == agent_id:
            updated_agent = agent.model_copy(update={"status": status})
            project.agents[idx] = updated_agent
            STORE.update_project(project)
            return updated_agent

    raise ValueError("Agent not found")

