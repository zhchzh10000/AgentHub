import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useProject } from '../context/ProjectContext';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { CreateGroupDialog } from '../components/CreateGroupDialog';
import { SummarySettingsDialog } from '../components/SummarySettingsDialog';
import { TaskAssignDialog } from '../components/TaskAssignDialog';
import { AgentListDialog } from '../components/AgentListDialog';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus, Settings, FileText, ClipboardList, Users } from 'lucide-react';
import { Message, ChatGroup, Task } from '../types';
import { createGroup as createGroupApi, sendMessage as sendMessageApi, refreshProject, pmHandleTask, continueDiscussion, setAutoCollaboration as setAutoCollaborationApi } from '../api/chatApi';
import { updateSummarySettingsApi } from '../api/summaryApi';
import { createTask as createTaskApi } from '../api/taskApi';
import { getProject } from '../api/projectApi';

export function Chat() {
  const { project, setProject, addChatGroup, summarySettings, updateSummarySettings, updateAgentModel } = useProject();
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isTaskAssignDialogOpen, setIsTaskAssignDialogOpen] = useState(false);
  const [isAgentListDialogOpen, setIsAgentListDialogOpen] = useState(false);
  const [discussionLoopActive, setDiscussionLoopActive] = useState(false);
  const [discussionRequestInFlight, setDiscussionRequestInFlight] = useState(false);

  useEffect(() => {
    if (!project) {
      navigate('/');
      return;
    }

    if (project.chatGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(project.chatGroups[0].id);
    }
  }, [project, navigate, selectedGroupId]);

  const handleSendMessage = (content: string) => {
    if (!selectedGroupId || !project) return;

    (async () => {
      try {
        const userMessage = await sendMessageApi(project.id, selectedGroupId, {
          senderId: 'user',
          senderName: '我',
          senderAvatar: '👤',
          content,
          type: 'text',
        });
        // 发送完成后，若开启自动协作，则触发项目经理+成员的模型对话
        if (selectedGroup?.autoCollaborationEnabled ?? true) {
          const updatedProject = await pmHandleTask(project.id, selectedGroupId, {
            userMessageId: userMessage.id,
          });
          setProject(updatedProject);
          setDiscussionLoopActive(true);
        } else {
          const updated = await refreshProject(project.id);
          setProject(updated);
        }
      } catch (error) {
        console.error('Failed to send message', error);
      }
    })();
  };

  useEffect(() => {
    if (!project || !selectedGroupId || !discussionLoopActive || discussionRequestInFlight) return;

    const currentGroup = project.chatGroups.find(g => g.id === selectedGroupId);
    if (!currentGroup?.autoCollaborationEnabled) {
      setDiscussionLoopActive(false);
      return;
    }

    if (!currentGroup.lastMessage || currentGroup.lastMessage.senderId === 'user') return;

    setDiscussionRequestInFlight(true);
    (async () => {
      try {
        const updatedProject = await continueDiscussion(project.id, selectedGroupId);
        setProject(updatedProject);
      } catch (error) {
        setDiscussionLoopActive(false);
      } finally {
        setDiscussionRequestInFlight(false);
      }
    })();
  }, [project, selectedGroupId, discussionLoopActive, discussionRequestInFlight, setProject]);

  const handleAgentReply = () => {
    if (!selectedGroupId || !project) return;

    (async () => {
      try {
        const pmAgent = project.agents.find(a => a.isProjectManager);
        const pmTasks = (project.tasks || []).filter(task => {
          if (!pmAgent) return false;
          return task.assignedTo === pmAgent.id && task.status === 'assigned';
        });

        const agentsToReply = project.agents.filter(a => !a.isProjectManager);

        for (const agent of agentsToReply) {
          const directlyAssignedTasks = (project.tasks || []).filter(task => {
            if (task.assignedTo !== agent.id) return false;
            if (pmAgent && task.assignedBy !== pmAgent.id) return false;
            return task.status === 'assigned';
          });

          const usePmTasks = directlyAssignedTasks.length === 0 && pmTasks.length > 0;
          const relatedTasks = usePmTasks ? pmTasks : directlyAssignedTasks;
          const hasTasks = relatedTasks.length > 0;

          const tasksDescription = hasTasks
            ? relatedTasks
                .map(task => `【${task.title}】 - ${task.description}`)
                .join('\n')
            : '目前没有新的指派任务，我会持续关注项目进展。';

          const content = hasTasks
            ? usePmTasks
              ? `根据项目经理当前的总体任务规划，我将从「${agent.role}」的角度参与以下工作：\n${tasksDescription}`
              : `收到项目经理的指派，我将负责以下任务：\n${tasksDescription}`
            : tasksDescription;

          await sendMessageApi(project.id, selectedGroupId, {
            senderId: agent.id,
            senderName: agent.name,
            senderAvatar: agent.avatar,
            content,
            type: 'text',
          });
        }

        const updated = await refreshProject(project.id);
        setProject(updated);
      } catch (error) {
        console.error('Failed to trigger agent reply', error);
      }
    })();
  };

  const handleCreateGroup = (group: ChatGroup) => {
    if (!project) return;
    (async () => {
      try {
        const created = await createGroupApi(project.id, {
          name: group.name,
          purpose: group.purpose,
          memberIds: group.members,
          avatar: group.avatar,
        });
        addChatGroup(created);
        setSelectedGroupId(created.id);
      } catch (error) {
        console.error('Failed to create group', error);
      }
    })();
  };

  if (!project) return null;

  const selectedGroup = project.chatGroups.find(g => g.id === selectedGroupId);

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/project')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回项目
          </Button>
          <div>
            <h1 className="text-xl">团队协作</h1>
            <p className="text-sm text-gray-500">{project.goal}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/summaries')}>
            <FileText className="w-4 h-4 mr-2" />
            查看总结
            {project.summaries && project.summaries.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                {project.summaries.length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            总结设置
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建群组
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsTaskAssignDialogOpen(true)}>
            <ClipboardList className="w-4 h-4 mr-2" />
            分配任务
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAgentListDialogOpen(true)}>
            <Users className="w-4 h-4 mr-2" />
            Agent配置
          </Button>
          <Button
            variant={(selectedGroup?.autoCollaborationEnabled ?? true) ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => {
              if (!project || !selectedGroupId || !selectedGroup) return;
              const nextEnabled = !selectedGroup.autoCollaborationEnabled;
              (async () => {
                try {
                  const updatedGroup = await setAutoCollaborationApi(project.id, selectedGroupId, { enabled: nextEnabled });
                  setProject({
                    ...project,
                    chatGroups: project.chatGroups.map(group =>
                      group.id === selectedGroupId ? updatedGroup : group
                    ),
                  });
                  if (!nextEnabled) {
                    setDiscussionLoopActive(false);
                  }
                } catch (error) {
                  console.error('Failed to toggle auto collaboration', error);
                }
              })();
            }}
          >
            {(selectedGroup?.autoCollaborationEnabled ?? true) ? '停止自动协作' : '开启自动协作'}
          </Button>
        </div>
      </div>

      {/* 聊天界面 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧群组列表 */}
        <div className="w-80 flex-shrink-0">
          <ChatList
            groups={project.chatGroups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
        </div>

        {/* 右侧聊天窗口 */}
        <div className="flex-1">
          {selectedGroup ? (
            <ChatWindow
              group={selectedGroup}
              agents={project.agents}
              onSendMessage={handleSendMessage}
              onAgentReply={handleAgentReply}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>选择一个群组开始聊天</p>
            </div>
          )}
        </div>
      </div>

      {/* 创建群组对话框 */}
      <CreateGroupDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        agents={project.agents}
        onCreateGroup={handleCreateGroup}
      />

      {/* 总结设置对话框 */}
      <SummarySettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        settings={summarySettings}
        onSave={(settings) => {
          if (!project) return;
          (async () => {
            try {
              await updateSummarySettingsApi(project.id, settings);
              updateSummarySettings(settings);
              const updated = await getProject(project.id);
              setProject(updated);
            } catch (error) {
              console.error('Failed to update summary settings', error);
            }
          })();
        }}
      />

      {/* 任务分配对话框 */}
      <TaskAssignDialog
        open={isTaskAssignDialogOpen}
        onOpenChange={setIsTaskAssignDialogOpen}
        agents={project.agents}
        onAddTask={(task: Task) => {
          if (!project) return;
          (async () => {
            try {
              await createTaskApi(project.id, {
                title: task.title,
                description: task.description,
                assignedTo: task.assignedTo,
                priority: task.priority,
                requiredSkills: task.requiredSkills,
                assignedBy: task.assignedBy,
              });
              const updated = await getProject(project.id);
              setProject(updated);
            } catch (error) {
              console.error('Failed to create task', error);
            }
          })();
        }}
      />

      {/* Agent配置对话框 */}
      <AgentListDialog
        open={isAgentListDialogOpen}
        onOpenChange={setIsAgentListDialogOpen}
        agents={project.agents}
        onUpdateAgentModel={updateAgentModel}
      />
    </div>
  );
}