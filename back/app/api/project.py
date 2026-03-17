from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models import Project, Summary, SummarySettings
from ..services import project_service
from ..store import STORE


router = APIRouter()


class CreateProjectRequest(BaseModel):
    goal: str


class ProjectListItem(BaseModel):
    id: str
    goal: str
    status: str
    progress: int
    createdAt: datetime
    agentCount: int


@router.get("", response_model=list[ProjectListItem])
def list_projects() -> list[ProjectListItem]:
    projects = STORE.list_projects()
    return [
        ProjectListItem(
            id=p.id,
            goal=p.goal,
            status=p.status,
            progress=p.progress,
            createdAt=p.createdAt,
            agentCount=len(p.agents),
        )
        for p in projects
    ]


@router.post("", response_model=Project)
def create_project(payload: CreateProjectRequest) -> Project:
    return project_service.create_project(payload.goal)


@router.post("/{project_id}/generate-team", response_model=Project)
def generate_team(project_id: str) -> Project:
    try:
        return project_service.generate_team_for_project(project_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")


@router.get("/{project_id}", response_model=Project)
def get_project(project_id: str) -> Project:
    project = STORE.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/summaries", response_model=list[Summary])
def list_summaries(project_id: str) -> list[Summary]:
    project = STORE.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.summaries


@router.get("/{project_id}/summary-settings", response_model=SummarySettings)
def get_summary_settings(project_id: str) -> SummarySettings:
    project = STORE.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.summarySettings


@router.put("/{project_id}/summary-settings", response_model=SummarySettings)
def update_summary_settings(project_id: str, payload: SummarySettings) -> SummarySettings:
    project = STORE.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    project.summarySettings = payload
    STORE.update_project(project)
    return project.summarySettings

