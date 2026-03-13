from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class AIModel(BaseModel):
    provider: Literal["openai", "anthropic", "google", "azure", "vllm"]
    modelName: str
    temperature: Optional[float] = None
    maxTokens: Optional[int] = None
    baseUrl: Optional[str] = None  # vLLM 等自建服务地址，如 http://10.103.0.5:8002/v1


class Task(BaseModel):
    id: str
    title: str
    description: str
    assignedTo: str
    assignedBy: str
    status: Literal["assigned", "in-progress", "completed", "blocked"]
    priority: Literal["low", "medium", "high"]
    requiredSkills: list[str]
    createdAt: datetime
    completedAt: Optional[datetime] = None
    result: Optional[str] = None


class SkillExecution(BaseModel):
    id: str
    agentId: str
    skillName: str
    taskId: Optional[str] = None
    input: str
    output: str
    status: Literal["running", "success", "failed"]
    startTime: datetime
    endTime: Optional[datetime] = None
    duration: Optional[int] = None


class Message(BaseModel):
    id: str
    senderId: str
    senderName: str
    senderAvatar: str
    content: str
    timestamp: datetime
    type: Literal["text", "system", "summary", "task", "skill-execution"]
    task: Optional[Task] = None
    skillExecution: Optional[SkillExecution] = None


class ChatGroup(BaseModel):
    id: str
    name: str
    avatar: str
    members: list[str]
    messages: list[Message] = Field(default_factory=list)
    lastMessage: Optional[Message] = None
    unreadCount: int = 0
    createdAt: datetime
    purpose: str
    messageCount: Optional[int] = None
    autoCollaborationEnabled: bool = True
    # 用于自动总结的状态追踪
    lastSummaryTime: Optional[datetime] = None
    lastSummaryMessageCount: int = 0


class Agent(BaseModel):
    id: str
    name: str
    role: str
    avatar: str
    skills: list[str]
    status: Literal["online", "offline", "busy"]
    description: str
    isProjectManager: Optional[bool] = False
    model: Optional[AIModel] = None
    workload: Optional[int] = None


class AgentMemory(BaseModel):
    agentId: str
    rollingSummary: str = ""
    recentEvents: list[str] = Field(default_factory=list)
    updatedAt: datetime


class Milestone(BaseModel):
    id: str
    title: str
    description: str
    status: Literal["pending", "in-progress", "completed"]
    dueDate: Optional[datetime] = None
    assignedAgents: list[str]


class SummaryMessageRange(BaseModel):
    start: int
    end: int


class Summary(BaseModel):
    id: str
    groupId: str
    groupName: str
    content: str
    keyPoints: list[str]
    decisions: list[str]
    nextSteps: list[str]
    createdAt: datetime
    messageRange: SummaryMessageRange


class SummarySettings(BaseModel):
    timeInterval: int
    messageInterval: int
    enabled: bool


class Project(BaseModel):
    id: str
    goal: str
    status: Literal["planning", "in-progress", "completed"]
    progress: int
    createdAt: datetime
    agents: list[Agent] = Field(default_factory=list)
    chatGroups: list[ChatGroup] = Field(default_factory=list)
    milestones: list[Milestone] = Field(default_factory=list)
    summaries: list[Summary] = Field(default_factory=list)
    tasks: list[Task] = Field(default_factory=list)
    skillExecutions: list[SkillExecution] = Field(default_factory=list)
    agentMemories: dict[str, AgentMemory] = Field(default_factory=dict)
    summarySettings: SummarySettings = Field(
        default_factory=lambda: SummarySettings(timeInterval=10, messageInterval=10, enabled=True)
    )

