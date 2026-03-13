from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.agent import router as agent_router
from .api.chat import router as chat_router
from .api.project import router as project_router


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

    app.include_router(project_router, prefix="/projects", tags=["projects"])
    app.include_router(agent_router, prefix="/projects", tags=["agents"])
    app.include_router(chat_router, prefix="/projects", tags=["chat"])

    return app


app = create_app()

