from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.agent import router as agent_router
from .api.chat import router as chat_router
from .api.project import router as project_router
from .services import discussion_service
from .store import STORE


def create_app() -> FastAPI:
    app = FastAPI(title="AgentHub API", version="0.1.0")

    # CORS for local development; adjust origins as needed.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health_check() -> dict:
        return {"status": "ok"}

    @app.on_event("startup")
    async def restore_discussions() -> None:
        for project in STORE.list_projects():
            for group in project.chatGroups:
                if (
                    group.autoCollaborationEnabled
                    and len(group.messages) > 1
                    and group.lastMessage
                    and group.lastMessage.senderId != "user"
                ):
                    discussion_service.ensure_discussion_loop(project.id, group.id)

    app.include_router(project_router, prefix="/projects", tags=["projects"])
    app.include_router(agent_router, prefix="/projects", tags=["agents"])
    app.include_router(chat_router, prefix="/projects", tags=["chat"])

    return app


app = create_app()

