from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from pathlib import Path

from .models import Project


class SQLiteStore:
    """
    Lightweight SQLite-backed project store.

    We persist the whole project document as JSON so the current prototype
    can keep its Pydantic-first service layer while still surviving restarts.
    """

    def __init__(self) -> None:
        db_path = os.getenv("AGENTHUB_DB_PATH", str(Path(__file__).resolve().parents[1] / "agenthub.db"))
        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def add_project(self, project: Project) -> None:
        payload = project.model_dump_json()
        now = datetime.utcnow().isoformat()
        with self._connect() as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO projects (id, data, created_at, updated_at)
                VALUES (?, ?, COALESCE((SELECT created_at FROM projects WHERE id = ?), ?), ?)
                """,
                (project.id, payload, project.id, now, now),
            )
            connection.commit()

    def get_project(self, project_id: str) -> Project | None:
        with self._connect() as connection:
            row = connection.execute("SELECT data FROM projects WHERE id = ?", (project_id,)).fetchone()
        if row is None:
            return None
        return Project.model_validate_json(row["data"])

    def update_project(self, project: Project) -> None:
        payload = project.model_dump_json()
        now = datetime.utcnow().isoformat()
        with self._connect() as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO projects (id, data, created_at, updated_at)
                VALUES (?, ?, COALESCE((SELECT created_at FROM projects WHERE id = ?), ?), ?)
                """,
                (project.id, payload, project.id, now, now),
            )
            connection.commit()

    def list_projects(self) -> list[Project]:
        with self._connect() as connection:
            rows = connection.execute("SELECT data FROM projects ORDER BY updated_at DESC").fetchall()
        return [Project.model_validate_json(row["data"]) for row in rows]

    def clear(self) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM projects")
            connection.commit()


STORE = SQLiteStore()

