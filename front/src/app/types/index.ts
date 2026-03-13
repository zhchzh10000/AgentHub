// Agent类型定义
export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  status: 'online' | 'offline' | 'busy';
  description: string;
  isProjectManager?: boolean;
  model?: AIModel; // AI大模型配置
  workload?: number; // 工作负载 0-100
}

// 默认 vLLM 服务地址（与后端部署一致时可使用）
export const VLLM_DEFAULT_BASE_URL = 'http://10.103.0.5:8002/v1';

// AI模型类型定义
export interface AIModel {
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'vllm';
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  /** vLLM 等自建服务时使用，例如 http://10.103.0.5:8002/v1 */
  baseUrl?: string;
}

// 可用的AI模型列表
export const AI_MODELS = {
  openai: [
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  ],
  anthropic: [
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' },
  ],
  google: [
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google' },
    { id: 'gemini-ultra', name: 'Gemini Ultra', provider: 'google' },
  ],
  azure: [
    { id: 'azure-gpt-4', name: 'Azure GPT-4', provider: 'azure' },
  ],
  vllm: [
    { id: 'GLM-4.7', name: 'GLM-4.7', provider: 'vllm' },
  ],
} as const;

// 消息类型定义
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'summary' | 'task' | 'skill-execution';
  task?: Task; // 如果是任务消息
  skillExecution?: SkillExecution; // 如果是技能执行消息
}

// 任务类型定义
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Agent ID
  assignedBy: string; // Agent ID (通常是PM)
  status: 'assigned' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  requiredSkills: string[];
  createdAt: Date;
  completedAt?: Date;
  result?: string;
}

// 技能执行记录
export interface SkillExecution {
  id: string;
  agentId: string;
  skillName: string;
  taskId?: string;
  input: string;
  output: string;
  status: 'running' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number; // 毫秒
}

// 群聊类型定义
export interface ChatGroup {
  id: string;
  name: string;
  avatar: string;
  members: string[]; // Agent IDs
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  purpose: string;
  messageCount?: number; // 用于追踪消息数量
  autoCollaborationEnabled?: boolean;
}

// 项目类型定义
export interface Project {
  id: string;
  goal: string;
  status: 'planning' | 'in-progress' | 'completed';
  progress: number;
  createdAt: Date;
  agents: Agent[];
  chatGroups: ChatGroup[];
  milestones: Milestone[];
  summaries: Summary[];
  tasks: Task[];
  skillExecutions: SkillExecution[];
}

// 里程碑类型定义
export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  assignedAgents: string[];
}

// 讨论总结类型定义
export interface Summary {
  id: string;
  groupId: string;
  groupName: string;
  content: string;
  keyPoints: string[];
  decisions: string[];
  nextSteps: string[];
  createdAt: Date;
  messageRange: {
    start: number;
    end: number;
  };
}

// 总结设置类型定义
export interface SummarySettings {
  timeInterval: number; // 分钟
  messageInterval: number; // 消息轮数
  enabled: boolean;
}