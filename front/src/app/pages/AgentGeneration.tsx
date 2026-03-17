import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Agent } from '../types';
import { generateTeam } from '../api/projectApi';
import { Loader2, CheckCircle2, Users, MessageSquare, ArrowRight } from 'lucide-react';

export function AgentGeneration() {
  const { project, isProjectLoading, setProject } = useProject();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('分析项目目标...');
  const [generatedAgents, setGeneratedAgents] = useState<Agent[]>([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isProjectLoading) {
      return;
    }
    if (!project) {
      navigate('/');
      return;
    }

    // 防止重复执行
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // 模拟Agent生成过程（视觉上保持原有步骤），同时在后台调用后端生成团队
    const steps = [
      { progress: 20, step: '分析项目目标...', delay: 1000 },
      { progress: 40, step: '识别所需角色...', delay: 1500 },
      { progress: 60, step: '生成项目经理Agent...', delay: 1000 },
      { progress: 80, step: '生成团队成员Agent...', delay: 1500 },
      { progress: 100, step: '创建协作群组...', delay: 1000 },
    ];

    let timeoutId: NodeJS.Timeout;
    let currentStepIndex = 0;

    const getAvatarUrl = (role: string) => {
      const avatars: Record<string, string> = {
        'project manager': '👨‍💼',
        'frontend': '👨‍💻',
        'backend': '👩‍💻',
        'designer': '👨‍🎨',
        'tester': '👩‍🔬',
        'devops': '👨‍🔧',
        'product': '👩‍💼',
      };
      return avatars[role.toLowerCase()] || '👤';
    };

    const generateAgentsBasedOnGoal = (goal: string): Agent[] => {
      const agents: Agent[] = [];
      
      agents.push({
        id: 'agent-frontend',
        name: '前端开发工程师',
        role: '前端开发',
        avatar: getAvatarUrl('frontend'),
        skills: ['React', 'TypeScript', 'UI/UX实现', '性能优化'],
        status: 'online',
        description: '负责前端界面开发和用户体验实现',
      });

      agents.push({
        id: 'agent-backend',
        name: '后端开发工程师',
        role: '后端开发',
        avatar: getAvatarUrl('backend'),
        skills: ['Node.js', 'Database', 'API设计', '系统架构'],
        status: 'online',
        description: '负责后端服务开发和数据库设计',
      });

      if (goal.includes('设计') || goal.includes('界面') || goal.includes('UI')) {
        agents.push({
          id: 'agent-designer',
          name: 'UI/UX设计师',
          role: 'UI/UX设计',
          avatar: getAvatarUrl('designer'),
          skills: ['界面设计', '用户体验', '原型设计', '视觉设计'],
          status: 'online',
          description: '负责产品界面和用户体验设计',
        });
      }

      agents.push({
        id: 'agent-tester',
        name: '测试工程师',
        role: '质量保证',
        avatar: getAvatarUrl('tester'),
        skills: ['自动化测试', '性能测试', 'Bug跟踪', '质量把控'],
        status: 'online',
        description: '负责产品测试和质量保证',
      });

      if (goal.includes('部署') || goal.includes('运维') || goal.includes('服务器')) {
        agents.push({
          id: 'agent-devops',
          name: 'DevOps工程师',
          role: 'DevOps',
          avatar: getAvatarUrl('devops'),
          skills: ['CI/CD', '云服务', '容器化', '监控运维'],
          status: 'online',
          description: '负责自动化部署和运维监控',
        });
      }

      agents.push({
        id: 'agent-product',
        name: '产品经理',
        role: '产品管理',
        avatar: getAvatarUrl('product'),
        skills: ['需求分析', '产品规划', '用户研究', '数据分析'],
        status: 'online',
        description: '负责产品需求分析和功能规划',
      });

      return agents;
    };

    let backendProject: typeof project | null = null;

    const goal = project?.goal ?? '';

    const runNextStep = () => {
      if (currentStepIndex >= steps.length) return;
      const { progress: prog, step, delay } = steps[currentStepIndex];
      setProgress(prog);
      setCurrentStep(step);

      try {
        if (prog === 60) {
          // 生成项目经理
          const pmAgent: Agent = {
            id: 'pm-1',
            name: '智能项目经理',
            role: '项目经理',
            avatar: getAvatarUrl('project manager'),
            skills: ['项目管理', '团队协调', '进度把控', '风险管理'],
            status: 'online',
            description: '负责整体项目规划、团队协调和进度管理',
            isProjectManager: true,
          };
          setGeneratedAgents([pmAgent]);
        } else if (prog === 80) {
          // 根据项目目标生成其他Agent（使用安全 goal，避免报错卡住进度）
          const agents = generateAgentsBasedOnGoal(goal);
          setGeneratedAgents((prev) => [...prev, ...agents]);
        } else if (prog === 100) {
          // 生成完成，优先使用后端返回的真实项目数据
          if (backendProject) {
            setProject(backendProject);
            setGeneratedAgents(backendProject.agents);
          } else {
            // 后端请求失败时，退回到本地模拟数据
            const pmAgent: Agent = {
              id: 'pm-1',
              name: '智能项目经理',
              role: '项目经理',
              avatar: getAvatarUrl('project manager'),
              skills: ['项目管理', '团队协调', '进度把控', '风险管理'],
              status: 'online',
              description: '负责整体项目规划、团队协调和进度管理',
              isProjectManager: true,
            };

            const allAgents = [pmAgent, ...generateAgentsBasedOnGoal(goal)];
            setGeneratedAgents(allAgents);
            setProject({
              ...project,
              agents: allAgents,
              summaries: [],
              tasks: [],
              skillExecutions: [],
            });
          }

          setTimeout(() => {
            setIsGenerating(false);
          }, 500);
        }
      } catch (e) {
        console.error('Agent generation step error', e);
      }

      currentStepIndex++;
      if (currentStepIndex < steps.length) {
        timeoutId = setTimeout(runNextStep, delay);
      }
    };

    // 并行：启动前端动画步骤 & 调用后端生成团队
    runNextStep();

    (async () => {
      try {
        backendProject = await generateTeam(project.id);
      } catch (error) {
        console.error('Failed to generate team from backend', error);
      }
    })();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [project, isProjectLoading, navigate, setProject]);

  const handleStartCollaboration = () => {
    navigate('/chat');
  };

  if (isProjectLoading || !project) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2">AI团队生成中</h1>
          <p className="text-gray-600">项目目标：{project.goal}</p>
        </div>

        {/* 进度条 */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            {isGenerating ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{currentStep}</span>
                <span className="text-sm">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </Card>

        {/* Agent列表 */}
        {generatedAgents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl">生成的团队成员</h2>
              <Badge variant="secondary">{generatedAgents.length} 位成员</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedAgents.map((agent) => (
                <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                      {agent.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="truncate">{agent.name}</h3>
                        {agent.isProjectManager && (
                          <Badge className="bg-yellow-500">PM</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{agent.role}</p>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {agent.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {agent.skills.slice(0, 3).map((skill) => (
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
          </div>
        )}

        {/* 完成后的操作按钮 */}
        {!isGenerating && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="text-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl mb-2">团队组建完成！</h2>
              <p className="text-gray-600">
                已创建 {generatedAgents.length} 位专业Agent，准备开始协作
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleStartCollaboration}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                进入协作聊天
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/project')}
                size="lg"
                variant="outline"
              >
                查看项目管理
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}