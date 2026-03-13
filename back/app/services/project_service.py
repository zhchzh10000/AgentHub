from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4
import os

from ..models import AIModel, Agent, ChatGroup, Message, Project
from ..store import STORE


def _now() -> datetime:
    return datetime.utcnow()


def _generate_agent_avatar(role: str) -> str:
    mapping = {
        "project manager": "👨‍💼",
        "frontend": "👨‍💻",
        "backend": "👩‍💻",
        "designer": "👨‍🎨",
        "tester": "👩‍🔬",
        "devops": "👨‍🔧",
        "product": "👩‍💼",
    }
    return mapping.get(role.lower(), "👤")


def _default_agent_model() -> AIModel:
    """
    默认为每个 Agent 绑定的模型配置。

    当前统一绑定到内部 vLLM 服务上的 GLM-4.7。
    """
    base_url = os.getenv("VLLM_BASE_URL", "http://10.103.0.5:8002/v1")
    return AIModel(
        provider="vllm",
        modelName="GLM-4.7",
        temperature=0.7,
        maxTokens=2048,
        baseUrl=base_url,
    )


def _generate_team_for_goal(goal: str) -> List[Agent]:
    agents: List[Agent] = []

    pm_agent = Agent(
        id=str(uuid4()),
        name="智能项目经理",
        role="项目经理",
        avatar=_generate_agent_avatar("project manager"),
        skills=["项目管理", "团队协调", "进度把控", "风险管理"],
        status="online",
        description="负责整体项目规划、团队协调和进度管理",
        isProjectManager=True,
        model=_default_agent_model(),
    )
    agents.append(pm_agent)

    agents.append(
        Agent(
            id=str(uuid4()),
            name="前端开发工程师",
            role="前端开发",
            avatar=_generate_agent_avatar("frontend"),
            skills=["React", "TypeScript", "UI/UX实现", "性能优化"],
            status="online",
            description="负责前端界面开发和用户体验实现",
            model=_default_agent_model(),
        )
    )

    agents.append(
        Agent(
            id=str(uuid4()),
            name="后端开发工程师",
            role="后端开发",
            avatar=_generate_agent_avatar("backend"),
            skills=["FastAPI", "Database", "API设计", "系统架构"],
            status="online",
            description="负责后端服务开发和数据库设计",
            model=_default_agent_model(),
        )
    )

    if any(keyword in goal for keyword in ["设计", "界面", "UI"]):
        agents.append(
            Agent(
                id=str(uuid4()),
                name="UI/UX设计师",
                role="UI/UX设计",
                avatar=_generate_agent_avatar("designer"),
                skills=["界面设计", "用户体验", "原型设计", "视觉设计"],
                status="online",
                description="负责产品界面和用户体验设计",
                 model=_default_agent_model(),
            )
        )

    agents.append(
        Agent(
            id=str(uuid4()),
            name="测试工程师",
            role="质量保证",
            avatar=_generate_agent_avatar("tester"),
            skills=["自动化测试", "性能测试", "Bug跟踪", "质量把控"],
            status="online",
            description="负责产品测试和质量保证",
            model=_default_agent_model(),
        )
    )

    if any(keyword in goal for keyword in ["部署", "运维", "服务器"]):
        agents.append(
            Agent(
                id=str(uuid4()),
                name="DevOps工程师",
                role="DevOps",
                avatar=_generate_agent_avatar("devops"),
                skills=["CI/CD", "云服务", "容器化", "监控运维"],
                status="online",
                description="负责自动化部署和运维监控",
                model=_default_agent_model(),
            )
        )

    agents.append(
        Agent(
            id=str(uuid4()),
            name="产品经理",
            role="产品管理",
            avatar=_generate_agent_avatar("product"),
            skills=["需求分析", "产品规划", "用户研究", "数据分析"],
            status="online",
            description="负责产品需求分析和功能规划",
            model=_default_agent_model(),
        )
    )

    return agents


def create_project(goal: str) -> Project:
    project = Project(
        id=str(uuid4()),
        goal=goal,
        status="planning",
        progress=0,
        createdAt=_now(),
    )
    STORE.add_project(project)
    return project


def generate_team_for_project(project_id: str) -> Project:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")

    agents = _generate_team_for_goal(project.goal)
    pm_agent = next(a for a in agents if a.isProjectManager)

    welcome_message = Message(
        id=str(uuid4()),
        senderId=pm_agent.id,
        senderName=pm_agent.name,
        senderAvatar=pm_agent.avatar,
        content=f'大家好！我已经为项目"{project.goal}"组建了团队。让我们开始协作吧！',
        timestamp=_now(),
        type="text",
    )

    main_group = ChatGroup(
        id=str(uuid4()),
        name="项目主群",
        avatar="",
        members=[a.id for a in agents],
        messages=[welcome_message],
        lastMessage=welcome_message,
        unreadCount=0,
        createdAt=_now(),
        purpose="主要工作讨论群",
        messageCount=1,
    )

    project.agents = agents
    project.chatGroups = [main_group]
    project.status = "in-progress"

    STORE.update_project(project)
    return project

