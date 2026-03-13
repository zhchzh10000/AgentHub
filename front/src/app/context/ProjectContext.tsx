import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Agent, ChatGroup, Message, Milestone, Summary, SummarySettings, Task, SkillExecution, AIModel } from '../types';
import { updateAgentModel as apiUpdateAgentModel, updateAgentStatus as apiUpdateAgentStatus } from '../api/agentApi';

interface ProjectContextType {
  project: Project | null;
  setProject: (project: Project | null) => void;
  addAgent: (agent: Agent) => void;
  addChatGroup: (group: ChatGroup) => void;
  addMessage: (groupId: string, message: Message) => void;
  updateProgress: (progress: number) => void;
  addMilestone: (milestone: Milestone) => void;
  addSummary: (summary: Summary) => void;
  summarySettings: SummarySettings;
  updateSummarySettings: (settings: SummarySettings) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addSkillExecution: (execution: SkillExecution) => void;
  updateAgentModel: (agentId: string, model: AIModel) => void;
  updateAgentStatus: (agentId: string, status: 'online' | 'offline' | 'busy') => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [summarySettings, setSummarySettings] = useState<SummarySettings>({
    timeInterval: 10, // 默认10分钟
    messageInterval: 10, // 默认10轮
    enabled: true,
  });

  const addAgent = (agent: Agent) => {
    if (!project) return;
    setProject({
      ...project,
      agents: [...project.agents, agent],
    });
  };

  const addChatGroup = (group: ChatGroup) => {
    if (!project) return;
    setProject({
      ...project,
      chatGroups: [...project.chatGroups, group],
    });
  };

  const addMessage = (groupId: string, message: Message) => {
    if (!project) return;
    setProject({
      ...project,
      chatGroups: project.chatGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              messages: [...group.messages, message],
              lastMessage: message,
              messageCount: (group.messageCount || 0) + 1,
            }
          : group
      ),
    });
  };

  const updateProgress = (progress: number) => {
    if (!project) return;
    setProject({
      ...project,
      progress,
    });
  };

  const addMilestone = (milestone: Milestone) => {
    if (!project) return;
    setProject({
      ...project,
      milestones: [...project.milestones, milestone],
    });
  };

  const addSummary = (summary: Summary) => {
    if (!project) return;
    setProject({
      ...project,
      summaries: [...(project.summaries || []), summary],
    });
  };

  const updateSummarySettings = (settings: SummarySettings) => {
    setSummarySettings(settings);
  };

  const addTask = (task: Task) => {
    if (!project) return;
    setProject({
      ...project,
      tasks: [...(project.tasks || []), task],
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!project) return;
    setProject({
      ...project,
      tasks: project.tasks?.map(task =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
            }
          : task
      ),
    });
  };

  const addSkillExecution = (execution: SkillExecution) => {
    if (!project) return;
    setProject({
      ...project,
      skillExecutions: [...(project.skillExecutions || []), execution],
    });
  };

  const updateAgentModel = (agentId: string, model: AIModel) => {
    if (!project) return;
    setProject({
      ...project,
      agents: project.agents.map(agent =>
        agent.id === agentId
          ? {
              ...agent,
              model,
            }
          : agent
      ),
    });

    // 同步更新到后端
    apiUpdateAgentModel(project.id, agentId, model).catch((error) => {
      // 在真实应用中可接入全局错误提示组件
      console.error('Failed to update agent model on server', error);
    });
  };

  const updateAgentStatus = (agentId: string, status: 'online' | 'offline' | 'busy') => {
    if (!project) return;
    setProject({
      ...project,
      agents: project.agents.map(agent =>
        agent.id === agentId
          ? {
              ...agent,
              status,
            }
          : agent
      ),
    });

    // 同步更新到后端
    apiUpdateAgentStatus(project.id, agentId, status).catch((error) => {
      console.error('Failed to update agent status on server', error);
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
        addAgent,
        addChatGroup,
        addMessage,
        updateProgress,
        addMilestone,
        addSummary,
        summarySettings,
        updateSummarySettings,
        addTask,
        updateTask,
        addSkillExecution,
        updateAgentModel,
        updateAgentStatus,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}