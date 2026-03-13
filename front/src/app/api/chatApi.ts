import { ChatGroup, Message } from '../types';
import { request } from './client';
import { reviveProjectDates } from './projectApi';
import type { Project } from '../types';

function reviveMessageDates(message: Message): Message {
  return {
    ...message,
    timestamp: new Date(message.timestamp),
    task: message.task
      ? {
          ...message.task,
          createdAt: new Date(message.task.createdAt),
          completedAt: message.task.completedAt ? new Date(message.task.completedAt) : undefined,
        }
      : undefined,
    skillExecution: message.skillExecution
      ? {
          ...message.skillExecution,
          startTime: new Date(message.skillExecution.startTime),
          endTime: message.skillExecution.endTime ? new Date(message.skillExecution.endTime) : undefined,
        }
      : undefined,
  };
}

function reviveChatGroupDates(group: ChatGroup): ChatGroup {
  return {
    ...group,
    createdAt: new Date(group.createdAt),
    lastSummaryTime: group.lastSummaryTime ? new Date(group.lastSummaryTime) : undefined,
    messages: group.messages?.map(reviveMessageDates) ?? [],
    lastMessage: group.lastMessage ? reviveMessageDates(group.lastMessage) : undefined,
  };
}

export interface CreateGroupPayload {
  name: string;
  purpose?: string;
  memberIds: string[];
  avatar?: string;
}

export interface SendMessagePayload {
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type?: Message['type'];
}

export interface PmHandleTaskPayload {
  userMessageId: string;
}

export interface AutoCollaborationPayload {
  enabled: boolean;
}

export async function createGroup(
  projectId: string,
  payload: CreateGroupPayload,
): Promise<ChatGroup> {
  const data = await request<ChatGroup>(`/projects/${projectId}/chat/groups`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return reviveChatGroupDates(data);
}

export async function sendMessage(
  projectId: string,
  groupId: string,
  payload: SendMessagePayload,
): Promise<Message> {
  const data = await request<Message>(
    `/projects/${projectId}/chat/groups/${groupId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        type: payload.type ?? 'text',
      }),
    },
  );
  return reviveMessageDates(data);
}

export async function refreshProject(projectId: string): Promise<Project> {
  const data = await request<Project>(`/projects/${projectId}`);
  return reviveProjectDates(data);
}

export async function pmHandleTask(
  projectId: string,
  groupId: string,
  payload: PmHandleTaskPayload,
): Promise<Project> {
  const data = await request<Project>(
    `/projects/${projectId}/chat/groups/${groupId}/pm-handle-task`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return reviveProjectDates(data);
}

export async function continueDiscussion(projectId: string, groupId: string): Promise<Project> {
  const data = await request<Project>(
    `/projects/${projectId}/chat/groups/${groupId}/continue-discussion`,
    {
      method: 'POST',
    },
  );
  return reviveProjectDates(data);
}

export async function setAutoCollaboration(
  projectId: string,
  groupId: string,
  payload: AutoCollaborationPayload,
): Promise<ChatGroup> {
  const data = await request<ChatGroup>(
    `/projects/${projectId}/chat/groups/${groupId}/auto-collaboration`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return reviveChatGroupDates(data);
}


