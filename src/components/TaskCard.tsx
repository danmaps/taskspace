
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineEdit } from '@/components/ui/inline-edit';
import { Task } from './KanbanBoard';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isDragging = false,
  onUpdateTask,
  onDeleteTask 
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleUpdateTitle = async (newTitle: string) => {
    if (onUpdateTask) {
      await onUpdateTask(task.id, { title: newTitle });
    }
  };

  const handleUpdateDescription = async (newDescription: string) => {
    if (onUpdateTask) {
      await onUpdateTask(task.id, { description: newDescription });
    }
  };

  const handleUpdateAssignee = async (newAssignee: string) => {
    if (onUpdateTask) {
      await onUpdateTask(task.id, { assignee: newAssignee });
    }
  };

  const handleDelete = async () => {
    if (onDeleteTask && confirm('Are you sure you want to delete this task?')) {
      await onDeleteTask(task.id);
    }  };
  const getPriorityColor = (importance: boolean, urgency: boolean) => {
    if (importance && urgency) return 'priority-urgent-important';
    if (importance && !urgency) return 'priority-important';
    if (!importance && urgency) return 'priority-urgent';
    return 'priority-neither';
  };

  const getPriorityLabel = (importance: boolean, urgency: boolean) => {
    if (importance && urgency) return 'Urgent & Important';
    if (importance && !urgency) return 'Important';
    if (!importance && urgency) return 'Urgent';
    return 'Neither';
  };

  const getPriorityIcon = (importance: boolean, urgency: boolean) => {
    if (importance && urgency) return '🔴';
    if (importance && !urgency) return '🟡';
    if (!importance && urgency) return '🟠';
    return '⚪';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return (
    <div 
      className={`kanban-card group ${isDragging ? 'opacity-50' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <InlineEdit
            value={task.title}
            onSave={handleUpdateTitle}
            className="font-medium text-foreground group-hover:text-primary transition-colors flex-1"
            placeholder="Task title..."
            maxLength={200}
          />          <div className="flex items-center gap-1 ml-2">
            <div className={`priority-badge ${getPriorityColor(task.importance, task.urgency)}`}>
              {getPriorityIcon(task.importance, task.urgency)} {getPriorityLabel(task.importance, task.urgency)}
            </div>
            {isHovering && onDeleteTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <InlineEdit
          value={task.description || ''}
          onSave={handleUpdateDescription}
          className="text-sm text-muted-foreground"
          placeholder="Add description..."
          multiline
          maxLength={500}
        />

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          
          <InlineEdit
            value={task.assignee || ''}
            onSave={handleUpdateAssignee}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:bg-muted/30 rounded px-1 py-0.5"
            placeholder="Assign to..."
            maxLength={50}
          />
        </div>
      </div>
    </div>
  );
};
