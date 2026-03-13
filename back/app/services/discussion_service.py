from __future__ import annotations

import asyncio
from typing import Dict, Tuple

from ..store import STORE
from . import model_service


_RUNNING_TASKS: Dict[Tuple[str, str], asyncio.Task[None]] = {}
DISCUSSION_INTERVAL_SECONDS = 8


async def _discussion_loop(project_id: str, group_id: str) -> None:
    try:
        while True:
            await asyncio.sleep(DISCUSSION_INTERVAL_SECONDS)
            project = STORE.get_project(project_id)
            if project is None:
                break

            group = next((item for item in project.chatGroups if item.id == group_id), None)
            if group is None or not group.autoCollaborationEnabled:
                break

            await model_service.continue_group_discussion(project_id, group_id)
    finally:
        _RUNNING_TASKS.pop((project_id, group_id), None)


def ensure_discussion_loop(project_id: str, group_id: str) -> None:
    task_key = (project_id, group_id)
    existing = _RUNNING_TASKS.get(task_key)
    if existing and not existing.done():
        return
    _RUNNING_TASKS[task_key] = asyncio.create_task(_discussion_loop(project_id, group_id))


def stop_discussion_loop(project_id: str, group_id: str) -> None:
    task = _RUNNING_TASKS.pop((project_id, group_id), None)
    if task and not task.done():
        task.cancel()
