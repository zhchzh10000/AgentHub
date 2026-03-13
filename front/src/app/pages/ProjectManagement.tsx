import React from 'react';
import { useNavigate } from 'react-router';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ArrowLeft,
  MessageSquare,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export function ProjectManagement() {
  const { project, isProjectLoading } = useProject();
  const navigate = useNavigate();

  if (!project && !isProjectLoading) {
    navigate('/');
    return null;
  }
  if (isProjectLoading || !project) return null;

  const projectManager = project.agents.find(a => a.isProjectManager);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/summaries')}>
                <FileText className="w-4 h-4 mr-2" />
                查看总结
              </Button>
              <Button onClick={() => navigate('/chat')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                进入聊天
              </Button>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl mb-2">项目管理中心</h1>
              <p className="text-gray-600">{project.goal}</p>
            </div>
            <Badge
              className={
                project.status === 'completed'
                  ? 'bg-green-500'
                  : project.status === 'in-progress'
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }
            >
              {project.status === 'completed'
                ? '已完成'
                : project.status === 'in-progress'
                ? '进行中'
                : '规划中'}
            </Badge>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">整体进度</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl mb-2">{project.progress}%</div>
            <Progress value={project.progress} className="h-2" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">团队成员</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl">{project.agents.length}</div>
            <p className="text-sm text-gray-500">位AI Agent</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">工作群组</span>
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl">{project.chatGroups.length}</div>
            <p className="text-sm text-gray-500">个协作群</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">里程碑</span>
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl">{project.milestones.length}</div>
            <p className="text-sm text-gray-500">个任务节点</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">讨论总结</span>
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl">{project.summaries?.length || 0}</div>
            <p className="text-sm text-gray-500">条总结记录</p>
          </Card>
        </div>

        {/* 项目经理区域 */}
        {projectManager && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl">
                {projectManager.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl">{projectManager.name}</h3>
                  <Badge className="bg-yellow-500">项目经理</Badge>
                </div>
                <p className="text-gray-700 mb-4">{projectManager.description}</p>
                <div className="flex flex-wrap gap-2">
                  {projectManager.skills.map(skill => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 标签页内容 */}
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="agents">团队成员</TabsTrigger>
            <TabsTrigger value="groups">工作群组</TabsTrigger>
            <TabsTrigger value="milestones">项目里程碑</TabsTrigger>
          </TabsList>

          {/* 团队成员 */}
          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.agents.map(agent => (
                <Card key={agent.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                      {agent.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="truncate">{agent.name}</h3>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            agent.status === 'online'
                              ? 'bg-green-500'
                              : agent.status === 'busy'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{agent.role}</p>
                      <p className="text-sm text-gray-500 mb-3">{agent.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.skills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 工作群组 */}
          <TabsContent value="groups" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.chatGroups.map(group => (
                <Card key={group.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-2xl">
                      👥
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{group.purpose}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {group.members.length} 位成员
                        </span>
                        <span className="text-sm text-gray-500">
                          {group.messages.length} 条消息
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 项目里程碑 */}
          <TabsContent value="milestones" className="space-y-4">
            {project.milestones.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl mb-2 text-gray-600">暂无里程碑</h3>
                <p className="text-gray-500 mb-4">
                  项目经理Agent将在团队讨论后创建项目里程碑
                </p>
                <Button onClick={() => navigate('/chat')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  开始团队讨论
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {project.milestones.map(milestone => (
                  <Card key={milestone.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {milestone.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : milestone.status === 'in-progress' ? (
                          <Clock className="w-6 h-6 text-blue-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg">{milestone.title}</h3>
                          <Badge
                            variant={
                              milestone.status === 'completed'
                                ? 'default'
                                : milestone.status === 'in-progress'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {milestone.status === 'completed'
                              ? '已完成'
                              : milestone.status === 'in-progress'
                              ? '进行中'
                              : '待开始'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {milestone.description}
                        </p>
                        {milestone.assignedAgents.length > 0 && (
                          <div className="text-sm text-gray-500">
                            负责人：{milestone.assignedAgents.length} 位Agent
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}