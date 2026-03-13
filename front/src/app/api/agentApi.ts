import { Agent, AIModel } from '../types';
import { request } from './client';

export async function updateAgentModel(
  projectId: string,
  agentId: string,
  model: AIModel
): Promise<Agent> {
  const data = await request<Agent>(`/projects/${projectId}/agents/${agentId}/model`, {
    method: 'PUT',
    body: JSON.stringify({ model }),
  });

  return data;
}

export async function updateAgentStatus(
  projectId: string,
  agentId: string,
  status: 'online' | 'offline' | 'busy'
): Promise<Agent> {
  const data = await request<Agent>(`/projects/${projectId}/agents/${agentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

  return data;
}

