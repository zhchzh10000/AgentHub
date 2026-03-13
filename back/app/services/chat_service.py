from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from ..models import ChatGroup, Message
from ..store import STORE


def _now() -> datetime:
    return datetime.utcnow()


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

    group.messages.append(message)
    group.lastMessage = message
    group.messageCount = (group.messageCount or 0) + 1

    STORE.update_project(project)
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
