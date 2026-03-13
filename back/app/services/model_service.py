from __future__ import annotations

import os
from typing import Iterable
from uuid import uuid4

import httpx

from . import chat_service
from .project_service import _now  # reuse timestamp helper
from ..models import Agent, Message, Project
from ..store import STORE


VLLM_BASE_URL = os.getenv("VLLM_BASE_URL", "http://10.103.0.5:8002/v1")


async def _call_agent_model(agent: Agent, system_prompt: str, user_prompt: str) -> str:
    """
    通用的大模型调用封装，当前统一走 vLLM(GLM-4.7)。
    """
    model_name = agent.model.modelName if agent.model and agent.model.modelName else "GLM-4.7"
    base_url = agent.model.baseUrl if agent.model and agent.model.baseUrl else VLLM_BASE_URL

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": agent.model.temperature if agent.model and agent.model.temperature is not None else 0.7,
        "max_tokens": agent.model.maxTokens if agent.model and agent.model.maxTokens is not None else 1024,
    }

    # 关闭环境代理（如 http_proxy），避免请求 10.103.0.5 时被误走本地代理导致 502。
    async with httpx.AsyncClient(base_url=base_url, timeout=60, trust_env=False) as client:
        resp = await client.post("/chat/completions", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


def _get_project_and_group(project_id: str, group_id: str) -> tuple[Project, Iterable[Message]]:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")

    group = next((g for g in project.chatGroups if g.id == group_id), None)
    if group is None:
        raise ValueError("Group not found")

    return project, group.messages


def _append_messages(project: Project, group_id: str, messages: list[Message]) -> Project:
    return chat_service.append_messages_to_group(project, group_id, messages)


def _build_agent_memory_context(project: Project, agent_id: str, recent_messages: list[Message]) -> str:
    memory = project.agentMemories.get(agent_id)
    rolling_summary = memory.rollingSummary if memory else ""
    recent_events = "\n".join(f"- {event}" for event in (memory.recentEvents[-10:] if memory else []))
    latest_messages = "\n".join(
        f"- {message.senderName}: {message.content}" for message in recent_messages[-10:]
    )
    recent_summaries = "\n".join(
        f"- {summary.content}" for summary in project.summaries[-3:]
    )

    return (
        f"历史滚动摘要：\n{rolling_summary or '暂无'}\n\n"
        f"最近记忆窗口：\n{recent_events or '暂无'}\n\n"
        f"最近消息原文：\n{latest_messages or '暂无'}\n\n"
        f"最近阶段总结：\n{recent_summaries or '暂无'}"
    )


async def pm_handle_user_task(project_id: str, group_id: str, user_message_id: str) -> Project:
    """
    用户在项目主群输入任务说明后：
    - 由项目经理用模型理解任务并给出分解与分配建议
    - 相关员工再各自用模型给出响应
    - 结果以多条 Message 的形式追加到群聊中
    """
    project, messages = _get_project_and_group(project_id, group_id)

    pm_agent = next((a for a in project.agents if a.isProjectManager), None)
    if pm_agent is None:
        raise ValueError("Project manager not found")

    user_message = next((m for m in messages if m.id == user_message_id), None)
    if user_message is None:
        raise ValueError("User message not found")

    # 构造上下文：最近若干条消息 + 当前任务
    message_list = list(messages)
    context_text = _build_agent_memory_context(project, pm_agent.id, message_list)

    system_prompt = (
        "你是一个软件项目的智能项目经理，负责理解用户提出的任务，并为团队成员分解和分配工作。"
        "回答时请先简要复述任务，再列出 1-3 个关键子任务，并点名适合的角色（前端/后端/测试/产品等）。"
    )
    user_prompt = (
        f"当前项目目标：{project.goal}\n\n"
        f"近期对话内容：\n{context_text}\n\n"
        f"用户刚刚提出的新任务是：\n{user_message.content}\n\n"
        "请用项目经理的口吻在群聊中回复。"
    )

    # 1. PM 使用模型回复
    pm_reply = await _call_agent_model(pm_agent, system_prompt, user_prompt)

    pm_message = Message(
        id=user_message.id + "-pm-reply",
        senderId=pm_agent.id,
        senderName=pm_agent.name,
        senderAvatar=pm_agent.avatar,
        content=pm_reply,
        timestamp=_now(),
        type="text",
    )

    # 2. 相关员工依次调用模型回复，当前简单让所有非 PM 成员都回应
    member_replies: list[Message] = []
    for agent in project.agents:
        if agent.isProjectManager:
            continue

        member_system = (
            f"你是项目中的{agent.role}（{agent.name}）。"
            "项目经理刚刚在群里分解并分配了任务，你需要从自己的专业角度给出具体的执行计划或建议。"
        )
        member_user = (
            f"项目目标：{project.goal}\n\n"
            f"你掌握的历史上下文：\n{_build_agent_memory_context(project, agent.id, message_list)}\n\n"
            f"项目经理在群里的最新说明如下：\n{pm_reply}\n\n"
            "请用简洁的方式说明你会如何推进与你相关的子任务，可以包含 1-3 个具体步骤。"
        )

        member_content = await _call_agent_model(agent, member_system, member_user)
        member_replies.append(
            Message(
                id=user_message.id + f"-agent-{agent.id}",
                senderId=agent.id,
                senderName=agent.name,
                senderAvatar=agent.avatar,
                content=member_content,
                timestamp=_now(),
                type="text",
            )
        )

    return _append_messages(project, group_id, [pm_message, *member_replies])


async def continue_group_discussion(project_id: str, group_id: str) -> Project:
    """
    在自动协作开启时，让 PM 基于最近讨论继续推进一轮讨论，
    然后由两个相关成员继续回应。
    """
    project, messages = _get_project_and_group(project_id, group_id)
    group = next(g for g in project.chatGroups if g.id == group_id)
    if not group.autoCollaborationEnabled:
        return project

    pm_agent = next((a for a in project.agents if a.isProjectManager), None)
    if pm_agent is None:
        raise ValueError("Project manager not found")

    message_list = list(messages)
    context_text = _build_agent_memory_context(project, pm_agent.id, message_list)
    system_prompt = (
        "你是一个软件项目的智能项目经理。"
        "请基于团队刚才的讨论，继续推进任务，指出当前最值得继续细化的 1-2 个点，"
        "并明确希望哪些角色继续补充。"
    )
    user_prompt = (
        f"项目目标：{project.goal}\n\n"
        f"最近的群聊内容：\n{context_text}\n\n"
        "请继续主持讨论，推动团队往下协作。"
    )

    pm_reply = await _call_agent_model(pm_agent, system_prompt, user_prompt)
    pm_message = Message(
        id=str(uuid4()),
        senderId=pm_agent.id,
        senderName=pm_agent.name,
        senderAvatar=pm_agent.avatar,
        content=pm_reply,
        timestamp=_now(),
        type="text",
    )

    member_replies: list[Message] = []
    for agent in [a for a in project.agents if not a.isProjectManager][:2]:
        member_system = (
            f"你是项目中的{agent.role}（{agent.name}）。"
            "项目经理刚刚继续推进讨论，请你基于已有上下文补充下一步计划或风险提醒。"
        )
        member_user = (
            f"项目目标：{project.goal}\n\n"
            f"你掌握的历史上下文：\n{_build_agent_memory_context(project, agent.id, message_list)}\n\n"
            f"最近讨论：\n{context_text}\n\n"
            f"项目经理刚刚的新发言：\n{pm_reply}\n\n"
            "请简洁回复，推进讨论。"
        )
        member_content = await _call_agent_model(agent, member_system, member_user)
        member_replies.append(
            Message(
                id=str(uuid4()),
                senderId=agent.id,
                senderName=agent.name,
                senderAvatar=agent.avatar,
                content=member_content,
                timestamp=_now(),
                type="text",
            )
        )

    return _append_messages(project, group_id, [pm_message, *member_replies])

