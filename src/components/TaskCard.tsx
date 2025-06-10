
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
import { Task } from './KanbanBoard';

interface TaskCardProps {
  task: Task;
  columnId: string;
  onMoveTask: (taskId: string, fromColumnId: string, toColumnId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, columnId, onMoveTask }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent-important':
        return 'priority-urgent-important';
      case 'important':
        return 'priority-important';
      case 'urgent':
        return 'priority-urgent';
      default:
        return 'priority-neither';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent-important':
        return 'Urgent & Important';
      case 'important':
        return 'Important';
      case 'urgent':
        return 'Urgent';
      default:
        return 'Neither';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="kanban-card group">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {task.title}
          </h4>
          <div className={`priority-badge ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

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
          
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
