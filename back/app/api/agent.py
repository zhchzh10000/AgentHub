from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models import AIModel, Agent
from ..services import agent_service


router = APIRouter()


class UpdateAgentModelRequest(BaseModel):
    model: AIModel


class UpdateAgentStatusRequest(BaseModel):
    status: Literal["online", "offline", "busy"]


@router.put("/{project_id}/agents/{agent_id}/model", response_model=Agent)
def update_agent_model(project_id: str, agent_id: str, payload: UpdateAgentModelRequest) -> Agent:
    try:
        return agent_service.update_agent_model(project_id, agent_id, payload.model)
    except ValueError as exc:
        if "Project not found" in str(exc):
            raise HTTPException(status_code=404, detail="Project not found")
        if "Agent not found" in str(exc):
            raise HTTPException(status_code=404, detail="Agent not found")
        raise


@router.put("/{project_id}/agents/{agent_id}/status", response_model=Agent)
def update_agent_status(project_id: str, agent_id: str, payload: UpdateAgentStatusRequest) -> Agent:
    try:
        return agent_service.update_agent_status(project_id, agent_id, payload.status)
    except ValueError as exc:
        if "Project not found" in str(exc):
            raise HTTPException(status_code=404, detail="Project not found")
        if "Agent not found" in str(exc):
            raise HTTPException(status_code=404, detail="Agent not found")
        raise

