import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Agent, AIModel, AI_MODELS, VLLM_DEFAULT_BASE_URL } from '../types';
import { Settings, Cpu, Zap } from 'lucide-react';
import { Input } from './ui/input';

interface AgentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  onSave: (agentId: string, model: AIModel) => void;
}

export function AgentConfigDialog({ open, onOpenChange, agent, onSave }: AgentConfigDialogProps) {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'azure' | 'vllm'>(
    agent.model?.provider || 'vllm'
  );
  const [modelName, setModelName] = useState(
    () => agent.model?.modelName || (AI_MODELS.vllm[0]?.id ?? 'GLM-4.7')
  );
  const [temperature, setTemperature] = useState(agent.model?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(agent.model?.maxTokens || 2000);
  const [baseUrl, setBaseUrl] = useState(
    agent.model?.baseUrl || VLLM_DEFAULT_BASE_URL
  );

  const handleSave = () => {
    const model: AIModel = {
      provider,
      modelName,
      temperature,
      maxTokens,
      ...(provider === 'vllm' && baseUrl ? { baseUrl } : {}),
    };
    onSave(agent.id, model);
    onOpenChange(false);
  };

  const availableModels = AI_MODELS[provider] ?? AI_MODELS.vllm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            配置 Agent：{agent.name}
          </DialogTitle>
          <DialogDescription>
            调整Agent的AI模型配置，以优化其性能和输出。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{agent.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{agent.name}</h3>
                  {agent.isProjectManager && (
                    <Badge className="bg-yellow-500">PM</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI模型选择 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold">AI大模型配置</h4>
            </div>

            {/* 提供商选择 */}
            <div className="space-y-2">
              <Label htmlFor="provider">模型提供商</Label>
              <Select
                value={provider}
                onValueChange={(value: any) => {
                  setProvider(value);
                  const models = AI_MODELS[value as keyof typeof AI_MODELS];
                  setModelName(models?.[0]?.id ?? 'GLM-4.7');
                }}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vllm">vLLM（自建 / GLM-4.7）</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* vLLM 服务地址 */}
            {provider === 'vllm' && (
              <div className="space-y-2">
                <Label htmlFor="baseUrl">vLLM 服务地址</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://10.103.0.5:8002/v1"
                />
                <p className="text-xs text-gray-500">
                  OpenAI 兼容接口，例如 http://10.103.0.5:8002/v1
                </p>
              </div>
            )}

            {/* 模型选择 */}
            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Select value={modelName} onValueChange={setModelName}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-gray-500">{temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(values) => setTemperature(values[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                控制输出的随机性。较低的值更确定，较高的值更有创造性。
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>最大Token数</Label>
                <span className="text-sm text-gray-500">{maxTokens}</span>
              </div>
              <Slider
                value={[maxTokens]}
                onValueChange={(values) => setMaxTokens(values[0])}
                min={500}
                max={4000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                生成回复的最大长度限制。
              </p>
            </div>
          </div>

          {/* 配置预览 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">配置预览</span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• 提供商：{provider.toUpperCase()}</p>
              {provider === 'vllm' && baseUrl && <p>• 服务地址：{baseUrl}</p>}
              <p>• 模型：{availableModels.find(m => m.id === modelName)?.name}</p>
              <p>• Temperature：{temperature.toFixed(2)}</p>
              <p>• 最大Token数：{maxTokens}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}