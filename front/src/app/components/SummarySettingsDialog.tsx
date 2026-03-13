import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { SummarySettings } from '../types';
import { Settings } from 'lucide-react';

interface SummarySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SummarySettings;
  onSave: (settings: SummarySettings) => void;
}

export function SummarySettingsDialog({ open, onOpenChange, settings, onSave }: SummarySettingsDialogProps) {
  const [timeInterval, setTimeInterval] = useState(settings.timeInterval);
  const [messageInterval, setMessageInterval] = useState(settings.messageInterval);
  const [enabled, setEnabled] = useState(settings.enabled);

  useEffect(() => {
    setTimeInterval(settings.timeInterval);
    setMessageInterval(settings.messageInterval);
    setEnabled(settings.enabled);
  }, [settings, open]);

  const handleSave = () => {
    onSave({
      timeInterval,
      messageInterval,
      enabled,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            总结设置
          </DialogTitle>
          <DialogDescription>
            配置自动总结的参数
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 启用总结 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">启用自动总结</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* 时间间隔 */}
          <div className="space-y-2">
            <Label htmlFor="timeInterval">时间间隔（分钟）</Label>
            <Input
              id="timeInterval"
              type="number"
              min="1"
              value={timeInterval}
              onChange={(e) => setTimeInterval(Number(e.target.value))}
              disabled={!enabled}
            />
            <p className="text-sm text-gray-500">
              项目经理每隔此时间自动生成讨论总结
            </p>
          </div>

          {/* 消息轮数 */}
          <div className="space-y-2">
            <Label htmlFor="messageInterval">消息轮数</Label>
            <Input
              id="messageInterval"
              type="number"
              min="1"
              value={messageInterval}
              onChange={(e) => setMessageInterval(Number(e.target.value))}
              disabled={!enabled}
            />
            <p className="text-sm text-gray-500">
              每隔此消息数自动生成讨论总结
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              💡 触发条件：满足时间间隔或消息轮数任一条件即会触发总结
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存设置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}