
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from './KanbanBoard';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
}

export const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  isOpen,
  onClose,
  onAddTask,
}) => {  const [formData, setFormData] = useState({
    title: '',
    description: '',
    importance: false,
    urgency: false,
    assignee: '',
    dueDate: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;    const task: Omit<Task, 'id'> = {
      title: formData.title,
      description: formData.description || undefined,
      importance: formData.importance,
      urgency: formData.urgency,
      assignee: formData.assignee || undefined,
      dueDate: formData.dueDate || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined,
    };

    onAddTask(task);
    setFormData({
      title: '',
      description: '',
      importance: false,
      urgency: false,
      assignee: '',
      dueDate: '',
      tags: '',
    });
  };
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter task title..."
              className="bg-background/50 border-border/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add task description..."
              className="bg-background/50 border-border/50 min-h-[80px]"
            />
          </div>          <div className="space-y-4">
            <Label>Eisenhower Matrix Classification</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importance"
                  checked={formData.importance}
                  onCheckedChange={(checked) => handleChange('importance', !!checked)}
                />
                <Label htmlFor="importance" className="text-sm font-normal">
                  📊 Important
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgency"
                  checked={formData.urgency}
                  onCheckedChange={(checked) => handleChange('urgency', !!checked)}
                />
                <Label htmlFor="urgency" className="text-sm font-normal">
                  ⏰ Urgent
                </Label>
              </div>
            </div>
            <div className="text-xs text-muted-foreground pl-1">
              {formData.importance && formData.urgency && "🔴 Urgent & Important (Do First)"}
              {formData.importance && !formData.urgency && "🟡 Important, Not Urgent (Schedule)"}
              {!formData.importance && formData.urgency && "🟠 Urgent, Not Important (Delegate)"}
              {!formData.importance && !formData.urgency && "⚪ Neither Urgent nor Important (Eliminate)"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) => handleChange('assignee', e.target.value)}
                placeholder="Assign to..."
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="frontend, bug, high-priority..."
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Add Task
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
