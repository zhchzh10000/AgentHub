from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from ..models import AgentMemory, ChatGroup, Message, Project, Summary, SummaryMessageRange
from ..store import STORE


def _now() -> datetime:
    return datetime.utcnow()


def _normalize_text(content: str) -> str:
    return " ".join(line.strip() for line in content.splitlines() if line.strip())


def _truncate(content: str, limit: int = 120) -> str:
    normalized = _normalize_text(content)
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _format_message_brief(message: Message, limit: int = 90) -> str:
    return f"{message.senderName}：{_truncate(message.content, limit)}"


def _ensure_agent_memory(project: Project, agent_id: str) -> AgentMemory:
    memory = project.agentMemories.get(agent_id)
    if memory is None:
        memory = AgentMemory(agentId=agent_id, updatedAt=_now())
        project.agentMemories[agent_id] = memory
    return memory


def _compress_agent_memory(memory: AgentMemory) -> None:
    if len(memory.recentEvents) <= 24:
        return

    archived = memory.recentEvents[:12]
    archive_text = "；".join(archived)
    if memory.rollingSummary:
        memory.rollingSummary = _truncate(f"{memory.rollingSummary}；{archive_text}", 1500)
    else:
        memory.rollingSummary = _truncate(f"历史讨论摘要：{archive_text}", 1500)
    memory.recentEvents = memory.recentEvents[12:]


def _update_agent_memories(project: Project, messages: list[Message]) -> None:
    relevant_briefs = [
        _format_message_brief(message, 120)
        for message in messages
        if message.type in {"text", "task", "skill-execution"} and _normalize_text(message.content)
    ]
    if not relevant_briefs:
        return

    for agent in project.agents:
        memory = _ensure_agent_memory(project, agent.id)
        memory.recentEvents.extend(relevant_briefs)
        _compress_agent_memory(memory)
        memory.updatedAt = _now()


def _build_summary(project: Project, group: ChatGroup, messages_slice: list[Message]) -> Summary | None:
    relevant_messages = [
        message
        for message in messages_slice
        if message.type in {"text", "task", "skill-execution"} and _normalize_text(message.content)
    ]
    if not relevant_messages:
        return None

    latest_user_message = next(
        (message for message in reversed(relevant_messages) if message.senderId == "user"),
        None,
    )
    topic = _truncate(latest_user_message.content, 60) if latest_user_message else _truncate(project.goal, 60)
    participants = "、".join(
        _dedupe_preserve_order([message.senderName for message in relevant_messages])
    )
    key_points = _dedupe_preserve_order(
        [_format_message_brief(message) for message in relevant_messages[-5:]]
    )[:5]

    decision_keywords = ("决定", "确认", "采用", "优先", "先", "分配", "安排", "负责")
    decisions = _dedupe_preserve_order(
        [
            _format_message_brief(message)
            for message in relevant_messages
            if any(keyword in message.content for keyword in decision_keywords)
        ]
    )[:3]
    if not decisions:
        pm_messages = [
            message
            for message in relevant_messages
            if "项目经理" in message.senderName or message.senderId != "user"
        ]
        decisions = _dedupe_preserve_order(
            [_format_message_brief(message) for message in pm_messages[:2]]
        )[:2]

    next_step_keywords = ("下一步", "接下来", "计划", "将", "需要", "推进", "跟进", "完成")
    next_steps = _dedupe_preserve_order(
        [
            _format_message_brief(message)
            for message in relevant_messages
            if any(keyword in message.content for keyword in next_step_keywords)
        ]
    )[:3]
    if not next_steps:
        next_steps = _dedupe_preserve_order(
            [_format_message_brief(message) for message in relevant_messages[-3:]]
        )[:3]

    start_index = group.lastSummaryMessageCount + 1
    end_index = group.lastSummaryMessageCount + len(messages_slice)
    summary_lines = [
        f"本轮围绕“{topic}”展开了 {len(relevant_messages)} 条讨论，参与成员包括：{participants}。",
    ]
    if decisions:
        summary_lines.append("当前已经形成的主要结论如下：")
        summary_lines.extend(f"- {item}" for item in decisions)
    if next_steps:
        summary_lines.append("建议继续按以下方向推进：")
        summary_lines.extend(f"- {item}" for item in next_steps)

    return Summary(
        id=str(uuid4()),
        groupId=group.id,
        groupName=group.name,
        content="\n".join(summary_lines),
        keyPoints=key_points,
        decisions=decisions,
        nextSteps=next_steps,
        createdAt=_now(),
        messageRange=SummaryMessageRange(start=start_index, end=end_index),
    )


def _check_and_generate_summary(project: Project, group: ChatGroup) -> Summary | None:
    settings = project.summarySettings
    if not settings.enabled:
        return None

    current_message_count = len(group.messages)
    if current_message_count <= group.lastSummaryMessageCount:
        return None

    baseline_time = group.lastSummaryTime or group.createdAt
    elapsed_minutes = (_now() - baseline_time).total_seconds() / 60
    new_message_count = current_message_count - group.lastSummaryMessageCount

    should_generate = (
        elapsed_minutes >= settings.timeInterval
        or new_message_count >= settings.messageInterval
    )
    if not should_generate:
        return None

    messages_slice = group.messages[group.lastSummaryMessageCount:current_message_count]
    summary = _build_summary(project, group, messages_slice)
    if summary is None:
        return None

    pm_agent = next((agent for agent in project.agents if agent.isProjectManager), None)
    summary_message = Message(
        id=str(uuid4()),
        senderId=pm_agent.id if pm_agent else "system",
        senderName=pm_agent.name if pm_agent else "项目经理",
        senderAvatar=pm_agent.avatar if pm_agent else "👨‍💼",
        content=(
            f"本轮讨论已生成阶段总结，已记录 {summary.messageRange.start}-{summary.messageRange.end} "
            "号消息的关键结论，可在“查看总结”中回顾。"
        ),
        timestamp=summary.createdAt,
        type="summary",
    )

    group.messages.append(summary_message)
    group.lastMessage = summary_message
    group.messageCount = len(group.messages)
    group.lastSummaryTime = summary.createdAt
    group.lastSummaryMessageCount = len(group.messages)
    project.summaries.append(summary)
    return summary


def append_messages_to_group(project: Project, group_id: str, messages: list[Message]) -> Project:
    group = next((g for g in project.chatGroups if g.id == group_id), None)
    if group is None:
        raise ValueError("Group not found")

    if messages:
        group.messages.extend(messages)
        group.lastMessage = messages[-1]
        group.messageCount = len(group.messages)
        _update_agent_memories(project, messages)

    if any(message.type != "summary" for message in messages):
        _check_and_generate_summary(project, group)

    STORE.update_project(project)
    return project


def create_group(
    project_id: str, name: str, purpose: str, member_ids: List[str]
) -> ChatGroup:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")

    # Find project manager as default system sender
    pm_agent = next((a for a in project.agents if a.isProjectManager), None)

    welcome_message = Message(
        id=str(uuid4()),
        senderId=pm_agent.id if pm_agent else "system",
        senderName=pm_agent.name if pm_agent else "系统",
        senderAvatar=pm_agent.avatar if pm_agent else "💬",
        content=f"{name}已创建！{f'目标：{purpose}' if purpose else '让我们开始协作吧！'}",
        timestamp=_now(),
        type="text",
    )

    group = ChatGroup(
        id=str(uuid4()),
        name=name,
        avatar="",
        members=member_ids,
        messages=[welcome_message],
        lastMessage=welcome_message,
        unreadCount=0,
        createdAt=_now(),
        purpose=purpose or "团队协作讨论",
        messageCount=1,
        lastSummaryTime=welcome_message.timestamp,
        lastSummaryMessageCount=1,
    )

    project.chatGroups.append(group)
    STORE.update_project(project)
    return group


def list_groups(project_id: str) -> List[ChatGroup]:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")
    return project.chatGroups


def send_message(
    project_id: str,
    group_id: str,
    sender_id: str,
    sender_name: str,
    sender_avatar: str,
    content: str,
    message_type: str = "text",
) -> Message:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")

    group = next((g for g in project.chatGroups if g.id == group_id), None)
    if group is None:
        raise ValueError("Group not found")

    message = Message(
        id=str(uuid4()),
        senderId=sender_id,
        senderName=sender_name,
        senderAvatar=sender_avatar,
        content=content,
        timestamp=_now(),
        type=message_type,  # type: ignore[arg-type]
    )

    append_messages_to_group(project, group_id, [message])
    return message


def set_auto_collaboration(project_id: str, group_id: str, enabled: bool) -> ChatGroup:
    project = STORE.get_project(project_id)
    if project is None:
        raise ValueError("Project not found")

    group = next((g for g in project.chatGroups if g.id == group_id), None)
    if group is None:
        raise ValueError("Group not found")

    group.autoCollaborationEnabled = enabled
    STORE.update_project(project)
    return group
