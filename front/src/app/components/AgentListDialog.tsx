import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Agent, AIModel } from '../types';
import { Settings, Cpu, Activity } from 'lucide-react';
import { AgentConfigDialog } from './AgentConfigDialog';

interface AgentListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onUpdateAgentModel: (agentId: string, model: AIModel) => void;
}

export function AgentListDialog({ open, onOpenChange, agents, onUpdateAgentModel }: AgentListDialogProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Agent 配置管理
            </DialogTitle>
            <DialogDescription>
              管理和配置您的Agent列表。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {agents.map((agent) => (
              <Card key={agent.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Agent头像 */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                    {agent.avatar}
                  </div>

                  {/* Agent信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{agent.name}</h3>
                      {agent.isProjectManager && (
                        <Badge className="bg-yellow-500">PM</Badge>
                      )}
                      <Badge variant="outline" className={`
                        ${agent.status === 'online' ? 'bg-green-100 text-green-700' : ''}
                        ${agent.status === 'busy' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${agent.status === 'offline' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {agent.status === 'online' && '● 在线'}
                        {agent.status === 'busy' && '● 忙碌'}
                        {agent.status === 'offline' && '● 离线'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                    
                    {/* 技能 */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {agent.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* AI模型配置 */}
                    {agent.model ? (
                      <div className="bg-blue-50 rounded-lg p-3 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">AI模型</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>• {agent.model.provider.toUpperCase()}: {agent.model.modelName}</p>
                          {agent.model.baseUrl && <p>• 服务地址: {agent.model.baseUrl}</p>}
                          <p>• Temperature: {agent.model.temperature?.toFixed(2) || '0.70'}</p>
                          <p>• Max Tokens: {agent.model.maxTokens || 2000}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">未配置AI模型</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 配置按钮 */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      配置
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent配置对话框 */}
      {selectedAgent && (
        <AgentConfigDialog
          open={!!selectedAgent}
          onOpenChange={() => setSelectedAgent(null)}
          agent={selectedAgent}
          onSave={onUpdateAgentModel}
        />
      )}
    </>
  );
}