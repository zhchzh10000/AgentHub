from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from ..models import Project, SkillExecution, Task
from ..store import STORE


def _now() -> datetime:
    return datetime.utcnow()


def _get_project(project_id: str) -> Project:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")
    return project


def create_task(
    project_id: str,
    title: str,
    description: str,
    assigned_to: str,
    priority: str,
    required_skills: list[str],
    assigned_by: str,
) -> Task:
    project = _get_project(project_id)

    task = Task(
        id=str(uuid4()),
        title=title,
        description=description,
        assignedTo=assigned_to,
        assignedBy=assigned_by,
        status="assigned",
        priority=priority,  # type: ignore[arg-type]
        requiredSkills=required_skills,
        createdAt=_now(),
    )

    project.tasks.append(task)
    STORE.update_project(project)
    return task


def update_task(
    project_id: str,
    task_id: str,
    status: Optional[str] = None,
    result: Optional[str] = None,
) -> Task:
    project = _get_project(project_id)

    for task in project.tasks:
        if task.id == task_id:
            if status is not None:
                task.status = status  # type: ignore[assignment]
                if status == "completed":
                    task.completedAt = _now()
            if result is not None:
                task.result = result
            STORE.update_project(project)
            return task

    raise ValueError("Task not found")


def record_skill_execution(
    project_id: str,
    agent_id: str,
    skill_name: str,
    input_text: str,
    output_text: str,
    status: str,
    task_id: Optional[str] = None,
) -> SkillExecution:
    project = _get_project(project_id)

    execution = SkillExecution(
        id=str(uuid4()),
        agentId=agent_id,
        skillName=skill_name,
        taskId=task_id,
        input=input_text,
        output=output_text,
        status=status,  # type: ignore[arg-type]
        startTime=_now(),
    )

    project.skillExecutions.append(execution)
    STORE.update_project(project)
    return execution

