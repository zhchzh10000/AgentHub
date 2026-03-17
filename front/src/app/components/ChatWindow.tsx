import React, { useState, useRef, useEffect } from 'react';
import { ChatGroup, Agent, Message } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Send, Users, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
  group: ChatGroup;
  agents: Agent[];
  onSendMessage: (content: string) => void;
  onAgentReply: () => void;
  onToggleAutoCollaboration: () => void;
}

export function ChatWindow({ group, agents, onSendMessage, onAgentReply, onToggleAutoCollaboration }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [group.messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentById = (id: string) => {
    return agents.find(a => a.id === id);
  };

  const groupedMessages = group.messages.reduce((acc, msg, idx) => {
    const prevMsg = group.messages[idx - 1];
    const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
    acc.push({ ...msg, showAvatar });
    return acc;
  }, [] as Array<Message & { showAvatar: boolean }>);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white">
              👥
            </div>
            <div>
              <h2 className="text-lg">{group.name}</h2>
              <p className="text-sm text-gray-500">{group.members.length} 位成员</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupedMessages.map((msg) => {
          const isSystem = msg.type === 'system';
          const agent = getAgentById(msg.senderId);

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <Badge variant="secondary" className="text-xs">
                  {msg.content}
                </Badge>
              </div>
            );
          }

          const isSummary = msg.type === 'summary';

          return (
            <div key={msg.id} className="flex items-start gap-3">
              {/* 头像 */}
              {msg.showAvatar ? (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  {msg.senderAvatar}
                </div>
              ) : (
                <div className="w-10 flex-shrink-0" />
              )}

              {/* 消息内容 */}
              <div className="flex-1 min-w-0">
                {msg.showAvatar && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{msg.senderName}</span>
                    {agent?.isProjectManager && (
                      <Badge className="bg-yellow-500 text-xs">PM</Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {format(msg.timestamp, 'HH:mm')}
                    </span>
                  </div>
                )}
                <div className={`rounded-lg p-3 shadow-sm inline-block max-w-2xl ${
                  isSummary 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200' 
                    : 'bg-white'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部工具栏 */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center gap-2 mb-3">
          <Button
            onClick={onAgentReply}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            🤖 推进一轮讨论
          </Button>
          <Button
            onClick={onToggleAutoCollaboration}
            size="sm"
            variant={group.autoCollaborationEnabled ?? true ? 'destructive' : 'outline'}
            className="text-xs"
          >
            {group.autoCollaborationEnabled ?? true ? '结束本轮自动讨论' : '开启自动协作'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}