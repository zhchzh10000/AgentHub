import React from 'react';
import { useNavigate } from 'react-router';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, FileText, Calendar, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export function Summaries() {
  const { project, isProjectLoading } = useProject();
  const navigate = useNavigate();

  if (!project && !isProjectLoading) {
    navigate('/');
    return null;
  }
  if (isProjectLoading || !project) return null;

  const sortedSummaries = [...(project.summaries || [])].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/project')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回项目
            </Button>
            <Button onClick={() => navigate('/chat')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              进入聊天
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl mb-2">讨论总结</h1>
              <p className="text-gray-600">项目目标：{project.goal}</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              共 {project.summaries?.length || 0} 条总结
            </Badge>
          </div>
        </div>
      </div>

      {/* 总结列表 */}
      <div className="max-w-5xl mx-auto p-6">
        {sortedSummaries.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl mb-2 text-gray-600">暂无讨论总结</h3>
            <p className="text-gray-500 mb-4">
              项目经理会定期生成讨论总结，请先进行团队讨论
            </p>
            <Button onClick={() => navigate('/chat')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              开始讨论
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedSummaries.map((summary, index) => (
              <Card key={summary.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* 总结头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                      👨‍💼
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg">项目经理总结 #{sortedSummaries.length - index}</h3>
                        <Badge className="bg-yellow-500">PM</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {summary.groupName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(summary.createdAt, 'yyyy-MM-dd HH:mm')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          消息 {summary.messageRange.start}-{summary.messageRange.end}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 总结内容 */}
                <div className="space-y-4">
                  {/* 主要内容 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 总结内容</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {summary.content}
                    </p>
                  </div>

                  <Separator />

                  {/* 关键要点 */}
                  {summary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 关键要点</h4>
                      <ul className="space-y-2">
                        {summary.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-gray-700 flex-1">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 决策事项 */}
                  {summary.decisions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                        决策事项
                      </h4>
                      <ul className="space-y-2">
                        {summary.decisions.map((decision, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 flex-1">{decision}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 下一步行动 */}
                  {summary.nextSteps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        <ArrowRight className="w-4 h-4 inline mr-1 text-purple-600" />
                        下一步行动
                      </h4>
                      <ul className="space-y-2">
                        {summary.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 flex-1">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}