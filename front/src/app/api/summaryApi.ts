import { Summary, SummarySettings } from '../types';
import { request } from './client';

export async function getSummaries(projectId: string): Promise<Summary[]> {
  const data = await request<Summary[]>(`/projects/${projectId}/summaries`);
  return data.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
  }));
}

export async function getSummarySettings(
  projectId: string,
): Promise<SummarySettings> {
  const data = await request<SummarySettings>(
    `/projects/${projectId}/summary-settings`,
  );
  return data;
}

export async function updateSummarySettingsApi(
  projectId: string,
  settings: SummarySettings,
): Promise<SummarySettings> {
  const data = await request<SummarySettings>(
    `/projects/${projectId}/summary-settings`,
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    },
  );
  return data;
}

