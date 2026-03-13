import { Project, ChatGroup, Message } from '../types';
import { request } from './client';

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
          endTime: message.skillExecution.endTime
            ? new Date(message.skillExecution.endTime)
            : undefined,
        }
      : undefined,
  };
}

function reviveChatGroupDates(group: ChatGroup): ChatGroup {
  return {
    ...group,
    createdAt: new Date(group.createdAt),
    messages: group.messages?.map(reviveMessageDates) ?? [],
    lastMessage: group.lastMessage ? reviveMessageDates(group.lastMessage) : undefined,
  };
}

export function reviveProjectDates(project: Project): Project {
  return {
    ...project,
    createdAt: new Date(project.createdAt),
    chatGroups: project.chatGroups?.map(reviveChatGroupDates) ?? [],
    tasks:
      project.tasks?.map((task) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      })) ?? [],
    summaries:
      project.summaries?.map((summary) => ({
        ...summary,
        createdAt: new Date(summary.createdAt),
      })) ?? [],
    skillExecutions:
      project.skillExecutions?.map((execution) => ({
        ...execution,
        startTime: new Date(execution.startTime),
        endTime: execution.endTime ? new Date(execution.endTime) : undefined,
      })) ?? [],
  };
}

export async function createProject(goal: string): Promise<Project> {
  const data = await request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({ goal }),
  });
  return reviveProjectDates(data);
}

export async function generateTeam(projectId: string): Promise<Project> {
  const data = await request<Project>(`/projects/${projectId}/generate-team`, {
    method: 'POST',
  });
  return reviveProjectDates(data);
}

export async function getProject(projectId: string): Promise<Project> {
  const data = await request<Project>(`/projects/${projectId}`);
  return reviveProjectDates(data);
}

