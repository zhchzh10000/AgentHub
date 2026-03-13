from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models import SkillExecution, Task
from ..services import task_service


router = APIRouter()


class CreateTaskRequest(BaseModel):
    title: str
    description: str
    assignedTo: str
    priority: str
    requiredSkills: List[str]
    assignedBy: str


class UpdateTaskRequest(BaseModel):
    status: Optional[str] = None
    result: Optional[str] = None


class RecordSkillExecutionRequest(BaseModel):
    agentId: str
    skillName: str
    input: str
    output: str
    status: str
    taskId: Optional[str] = None


@router.post("", response_model=Task)
def create_task(project_id: str, payload: CreateTaskRequest) -> Task:
    try:
        return task_service.create_task(
            project_id=project_id,
            title=payload.title,
            description=payload.description,
            assigned_to=payload.assignedTo,
            priority=payload.priority,
            required_skills=payload.requiredSkills,
            assigned_by=payload.assignedBy,
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")


@router.patch("/{task_id}", response_model=Task)
def update_task(project_id: str, task_id: str, payload: UpdateTaskRequest) -> Task:
    try:
        return task_service.update_task(
            project_id=project_id,
            task_id=task_id,
            status=payload.status,
            result=payload.result,
        )
    except ValueError as exc:
        detail = "Project not found" if "Project" in str(exc) else "Task not found"
        raise HTTPException(status_code=404, detail=detail)


@router.post("/skill-executions", response_model=SkillExecution)
def record_skill_execution(project_id: str, payload: RecordSkillExecutionRequest) -> SkillExecution:
    try:
        return task_service.record_skill_execution(
            project_id=project_id,
            agent_id=payload.agentId,
            skill_name=payload.skillName,
            input_text=payload.input,
            output_text=payload.output,
            status=payload.status,
            task_id=payload.taskId,
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")

