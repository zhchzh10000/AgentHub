import React from 'react';
import { ChatGroup } from '../types';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  groups: ChatGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
}

export function ChatList({ groups, selectedGroupId, onSelectGroup }: ChatListProps) {
  return (
    <div className="h-full flex flex-col bg-white border-r">
      {/* 头部 */}
      <div className="p-4 border-b">
        <h2 className="text-xl">消息</h2>
      </div>

      {/* 群组列表 */}
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => {
          const isSelected = group.id === selectedGroupId;
          const lastMsg = group.messages[group.messages.length - 1];
          
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`w-full p-4 border-b hover:bg-gray-50 transition-colors text-left ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* 群头像 */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  👥
                </div>

                {/* 群信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="truncate">{group.name}</h3>
                    {lastMsg && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatDistanceToNow(lastMsg.timestamp, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {lastMsg ? `${lastMsg.senderName}: ${lastMsg.content}` : group.purpose}
                    </p>
                    {group.unreadCount > 0 && (
                      <Badge className="bg-red-500 ml-2 flex-shrink-0">
                        {group.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {group.members.length} 位成员
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}