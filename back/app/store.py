from __future__ import annotations

from typing import Dict

from .models import Project


class InMemoryStore:
    """
    Simple in-memory store for Phase 1.

    Later phases can replace this with a proper repository/ORM layer
    without changing the service or API contracts.
    """

    def __init__(self) -> None:
        self._projects: Dict[str, Project] = {}

    def add_project(self, project: Project) -> None:
        self._projects[project.id] = project

    def get_project(self, project_id: str) -> Project | None:
        return self._projects.get(project_id)

    def update_project(self, project: Project) -> None:
        self._projects[project.id] = project


STORE = InMemoryStore()

