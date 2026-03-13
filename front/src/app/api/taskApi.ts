import { Task } from '../types';
import { request } from './client';

export interface CreateTaskPayload {
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  requiredSkills: string[];
  assignedBy: string;
}

export interface UpdateTaskPayload {
  status?: 'assigned' | 'in-progress' | 'completed' | 'blocked';
  result?: string;
}

export async function createTask(
  projectId: string,
  payload: CreateTaskPayload,
): Promise<Task> {
  const data = await request<Task>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
  };
}

export async function updateTask(
  projectId: string,
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const data = await request<Task>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
  };
}

