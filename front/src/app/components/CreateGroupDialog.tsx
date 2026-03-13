import React, { useState } from 'react';
import { Agent, ChatGroup, Message } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Users } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onCreateGroup: (group: ChatGroup) => void;
}

export function CreateGroupDialog({ open, onOpenChange, agents, onCreateGroup }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [groupPurpose, setGroupPurpose] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedAgents.length === 0) return;

    const pmAgent = agents.find(a => a.isProjectManager);
    
    const newGroup: ChatGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      avatar: '',
      members: selectedAgents,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: pmAgent?.id || 'pm-1',
          senderName: pmAgent?.name || '项目经理',
          senderAvatar: pmAgent?.avatar || '👨‍💼',
          content: `${groupName}已创建！${groupPurpose ? `目标：${groupPurpose}` : '让我们开始协作吧！'}`,
          timestamp: new Date(),
          type: 'text',
        },
      ],
      lastMessage: undefined,
      unreadCount: 0,
      createdAt: new Date(),
      purpose: groupPurpose || '团队协作讨论',
    };

    onCreateGroup(newGroup);
    
    // 重置表单
    setGroupName('');
    setGroupPurpose('');
    setSelectedAgents([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            创建新的协作群组
          </DialogTitle>
          <DialogDescription>
            创建一个新的群组来讨论和协作。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* 群组名称 */}
          <div className="space-y-2">
            <Label htmlFor="groupName">群组名称 *</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例如：前端开发讨论组"
            />
          </div>

          {/* 群组目标 */}
          <div className="space-y-2">
            <Label htmlFor="groupPurpose">群组目标</Label>
            <Input
              id="groupPurpose"
              value={groupPurpose}
              onChange={(e) => setGroupPurpose(e.target.value)}
              placeholder="例如：讨论前端架构和UI实现"
            />
          </div>

          {/* 选择成员 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>选择成员 *</Label>
              <Badge variant="secondary">
                已选择 {selectedAgents.length} 位
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {agents.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id);
                
                return (
                  <div
                    key={agent.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAgentToggle(agent.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleAgentToggle(agent.id)}
                      className="mt-1"
                    />
                    
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                      {agent.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="truncate">{agent.name}</h4>
                        {agent.isProjectManager && (
                          <Badge className="bg-yellow-500 text-xs">PM</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{agent.role}</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedAgents.length === 0}
          >
            创建群组
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}