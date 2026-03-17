import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { useProject } from '../context/ProjectContext';
import { Sparkles, Target, Users, History } from 'lucide-react';
import { createProject, listProjects, getProject } from '../api/projectApi';
import type { ProjectListItem } from '../api/projectApi';

export function Home() {
  const [goal, setGoal] = useState('');
  const [historyList, setHistoryList] = useState<ProjectListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const navigate = useNavigate();
  const { setProject } = useProject();

  useEffect(() => {
    listProjects()
      .then(setHistoryList)
      .catch(() => setHistoryList([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!goal.trim()) return;

    try {
      const project = await createProject(goal);
      setProject(project);
      navigate('/generate');
    } catch (error) {
      console.error('Failed to create project', error);
      // Phase 1: 简单控制台报错，后续可接入全局通知
    }
  };

  const handleEnterProject = async (item: ProjectListItem) => {
    try {
      const project = await getProject(item.id);
      setProject(project);
      navigate('/project');
    } catch (error) {
      console.error('Failed to load project', error);
    }
  };

  const statusLabel = (s: string) =>
    s === 'completed' ? '已完成' : s === 'in-progress' ? '进行中' : '规划中';
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Agent 协作平台
          </h1>
          <p className="text-xl text-gray-600">
            输入您的项目目标，AI将为您组建专业团队
          </p>
        </div>

        {/* 特性卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 text-center border-2 border-blue-100 hover:border-blue-300 transition-colors">
            <Target className="w-8 h-8 mx-auto mb-3 text-blue-600" />
            <h3 className="mb-2">智能分析</h3>
            <p className="text-sm text-gray-600">AI项目经理自动分析目标</p>
          </Card>
          <Card className="p-6 text-center border-2 border-purple-100 hover:border-purple-300 transition-colors">
            <Users className="w-8 h-8 mx-auto mb-3 text-purple-600" />
            <h3 className="mb-2">团队生成</h3>
            <p className="text-sm text-gray-600">自动创建所需专业角色</p>
          </Card>
          <Card className="p-6 text-center border-2 border-pink-100 hover:border-pink-300 transition-colors">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-pink-600" />
            <h3 className="mb-2">协作讨论</h3>
            <p className="text-sm text-gray-600">团队成员实时协作沟通</p>
          </Card>
        </div>

        {/* 输入区域 */}
        <Card className="p-8 shadow-xl border-2">
          <label className="block mb-4">
            <span className="text-lg mb-2 block">描述您的项目目标</span>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例如：开发一个在线教育平台，包含课程管理、学生管理、在线直播、作业批改等功能..."
              className="min-h-[200px] text-base resize-none"
            />
          </label>
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              {goal.length} 字符
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!goal.trim()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              开始生成团队
            </Button>
          </div>
        </Card>

        {/* 历史创建的团队 */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            历史创建的团队
          </h2>
          {historyLoading ? (
            <p className="text-sm text-gray-500">加载中...</p>
          ) : historyList.length === 0 ? (
            <p className="text-sm text-gray-500">暂无历史团队</p>
          ) : (
            <ul className="space-y-2">
              {historyList.map((item) => (
                <li key={item.id}>
                  <Card
                    className="p-4 cursor-pointer border-2 border-gray-100 hover:border-blue-300 transition-colors"
                    onClick={() => handleEnterProject(item)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-medium text-gray-900 line-clamp-2 flex-1 min-w-0">
                        {item.goal}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            item.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : item.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {statusLabel(item.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.agentCount} 人 · 进度 {item.progress}%
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 示例提示 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">示例项目目标：</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              '开发一个电商网站',
              '创建一个移动应用',
              '设计一个营销活动',
              '建立数据分析系统',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setGoal(example)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}