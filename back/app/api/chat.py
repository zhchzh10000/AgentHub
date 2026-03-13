from __future__ import annotations

from typing import Literal, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models import ChatGroup, Message, Project
from ..services import chat_service, discussion_service, model_service


router = APIRouter()


class CreateGroupRequest(BaseModel):
    name: str
    purpose: str | None = None
    memberIds: List[str]


class SendMessageRequest(BaseModel):
    senderId: str
    senderName: str
    senderAvatar: str
    content: str
    type: Literal["text", "system", "summary", "task", "skill-execution"] = "text"


class PmHandleTaskRequest(BaseModel):
  userMessageId: str


class AutoCollaborationRequest(BaseModel):
    enabled: bool


@router.post("/{project_id}/chat/groups", response_model=ChatGroup)
def create_group(project_id: str, payload: CreateGroupRequest) -> ChatGroup:
    try:
        return chat_service.create_group(
            project_id,
            name=payload.name,
            purpose=payload.purpose or "",
            member_ids=payload.memberIds,
        )
    except ValueError as exc:
        if "Project not found" in str(exc):
            raise HTTPException(status_code=404, detail="Project not found")
        raise


@router.get("/{project_id}/chat/groups", response_model=list[ChatGroup])
def list_groups(project_id: str) -> list[ChatGroup]:
    try:
        return chat_service.list_groups(project_id)
    except ValueError as exc:
        if "Project not found" in str(exc):
            raise HTTPException(status_code=404, detail="Project not found")
        raise


@router.post("/{project_id}/chat/groups/{group_id}/messages", response_model=Message)
def send_message(
    project_id: str, group_id: str, payload: SendMessageRequest
) -> Message:
    try:
        return chat_service.send_message(
            project_id=project_id,
            group_id=group_id,
            sender_id=payload.senderId,
            sender_name=payload.senderName,
            sender_avatar=payload.senderAvatar,
            content=payload.content,
            message_type=payload.type,
        )
    except ValueError as exc:
        if "Project not found" in str(exc):
            raise HTTPException(status_code=404, detail="Project not found")
        if "Group not found" in str(exc):
            raise HTTPException(status_code=404, detail="Group not found")
        raise


@router.post("/{project_id}/chat/groups/{group_id}/pm-handle-task", response_model=Project)
async def pm_handle_task(project_id: str, group_id: str, payload: PmHandleTaskRequest) -> Project:
    """
    用户在群里发送任务后，由项目经理和其他成员使用真实大模型进行自动回复。
    """
    try:
        project = await model_service.pm_handle_user_task(
            project_id=project_id,
            group_id=group_id,
            user_message_id=payload.userMessageId,
        )
        group = next((item for item in project.chatGroups if item.id == group_id), None)
        if group and group.autoCollaborationEnabled:
            discussion_service.ensure_discussion_loop(project_id, group_id)
        return project
    except ValueError as exc:
        msg = str(exc)
        if "Project not found" in msg:
            raise HTTPException(status_code=404, detail="Project not found")
        if "Group not found" in msg:
            raise HTTPException(status_code=404, detail="Group not found")
        if "User message not found" in msg:
            raise HTTPException(status_code=404, detail="Message not found")
        if "Project manager not found" in msg:
            raise HTTPException(status_code=400, detail="Project manager not found")
        raise


@router.post("/{project_id}/chat/groups/{group_id}/continue-discussion", response_model=Project)
async def continue_discussion(project_id: str, group_id: str) -> Project:
    try:
        return await model_service.continue_group_discussion(project_id=project_id, group_id=group_id)
    except ValueError as exc:
        msg = str(exc)
        if "Project not found" in msg:
            raise HTTPException(status_code=404, detail="Project not found")
        if "Group not found" in msg:
            raise HTTPException(status_code=404, detail="Group not found")
        if "Project manager not found" in msg:
            raise HTTPException(status_code=400, detail="Project manager not found")
        raise


@router.post("/{project_id}/chat/groups/{group_id}/auto-collaboration", response_model=ChatGroup)
def set_auto_collaboration(project_id: str, group_id: str, payload: AutoCollaborationRequest) -> ChatGroup:
    try:
        group = chat_service.set_auto_collaboration(project_id=project_id, group_id=group_id, enabled=payload.enabled)
        if payload.enabled and len(group.messages) > 1 and group.lastMessage and group.lastMessage.senderId != "user":
            discussion_service.ensure_discussion_loop(project_id, group_id)
        else:
            discussion_service.stop_discussion_loop(project_id, group_id)
        return group
    except ValueError as exc:
        msg = str(exc)
        if "Project not found" in msg:
            raise HTTPException(status_code=404, detail="Project not found")
        if "Group not found" in msg:
            raise HTTPException(status_code=404, detail="Group not found")
        raise
