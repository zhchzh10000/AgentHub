import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Agent, Task } from '../types';
import { ClipboardList, User, AlertCircle } from 'lucide-react';

interface TaskAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onAddTask: (task: Task) => void;
}

export function TaskAssignDialog({ open, onOpenChange, agents, onAddTask }: TaskAssignDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const pmAgent = agents.find(a => a.isProjectManager);
  if (!pmAgent) return null;

  const handleSubmit = () => {
    if (!title.trim() || !assignedTo) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      assignedTo,
      assignedBy: pmAgent.id,
      status: 'assigned',
      priority,
      requiredSkills: selectedSkills,
      createdAt: new Date(),
    };

    onAddTask(task);
    
    // 重置表单
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPriority('medium');
    setSelectedSkills([]);
    onOpenChange(false);
  };

  const selectedAgent = agents.find(a => a.id === assignedTo);
  const availableSkills = selectedAgent?.skills || [];

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            分配任务
          </DialogTitle>
          <DialogDescription>
            分配任务给团队成员，并指定所需技能和优先级。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 任务标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">任务标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：设计用户登录界面"
            />
          </div>

          {/* 任务描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">任务描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述任务要求、验收标准等..."
              className="min-h-[100px]"
            />
          </div>

          {/* 分配给 */}
          <div className="space-y-2">
            <Label htmlFor="assignTo">分配给 *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignTo">
                <SelectValue placeholder="选择团队成员" />
              </SelectTrigger>
              <SelectContent>
                {agents.filter(a => !a.isProjectManager).map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <span>{agent.avatar}</span>
                      <span>{agent.name}</span>
                      <span className="text-xs text-gray-500">({agent.role})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 优先级 */}
          <div className="space-y-2">
            <Label htmlFor="priority">优先级</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    低优先级
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    中优先级
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    高优先级
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 所需技能 */}
          {selectedAgent && (
            <div className="space-y-2">
              <Label>所需技能</Label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {selectedAgent.name} 的技能
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                      {selectedSkills.includes(skill) && ' ✓'}
                    </Badge>
                  ))}
                </div>
                {selectedSkills.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      已选择 {selectedSkills.length} 个技能
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">💡 任务分配提示</p>
                <ul className="space-y-1 text-xs">
                  <li>• Agent 将使用所选技能来完成任务</li>
                  <li>• 选择的技能将影响任务执行的方式和结果</li>
                  <li>• Agent 会调用配置的AI大模型来协助完成任务</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !assignedTo}>
            分配任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}