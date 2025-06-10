
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineEdit } from '@/components/ui/inline-edit';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Task } from './KanbanBoard';
import { Column } from '@/integrations/supabase/types';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  isMatrixView?: boolean;
  kanbanColumn?: Column;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isDragging = false,
  isMatrixView = false,
  kanbanColumn,
  onUpdateTask,
  onDeleteTask 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);

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
  const handleUpdatePriority = async (importance: boolean, urgency: boolean) => {
    if (onUpdateTask) {
      try {
        await onUpdateTask(task.id, { importance, urgency });
        setIsPriorityPopoverOpen(false);
      } catch (error) {
        // Error handling is done in the parent component
        console.error('Failed to update priority:', error);
      }
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
            {!isMatrixView ? (
              // Standard view: show priority badge
              <Popover open={isPriorityPopoverOpen} onOpenChange={setIsPriorityPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className={`priority-badge ${getPriorityColor(task.importance, task.urgency)} cursor-pointer hover:opacity-80 transition-opacity`}>
                    {getPriorityIcon(task.importance, task.urgency)} {getPriorityLabel(task.importance, task.urgency)}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Priority Settings</h4>
                      <p className="text-xs text-muted-foreground">
                        Set the importance and urgency of this task
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="importance"
                          checked={task.importance}
                          onCheckedChange={(checked) => handleUpdatePriority(!!checked, task.urgency)}
                        />
                        <Label htmlFor="importance" className="text-sm font-normal">
                          📊 Important
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="urgency"
                          checked={task.urgency}
                          onCheckedChange={(checked) => handleUpdatePriority(task.importance, !!checked)}
                        />
                        <Label htmlFor="urgency" className="text-sm font-normal">
                          ⏰ Urgent
                        </Label>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.importance && task.urgency && "🔴 Urgent & Important (Do First)"}
                      {task.importance && !task.urgency && "🟡 Important, Not Urgent (Schedule)"}
                      {!task.importance && task.urgency && "🟠 Urgent, Not Important (Delegate)"}
                      {!task.importance && !task.urgency && "⚪ Neither Urgent nor Important (Eliminate)"}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              // Matrix view: show kanban column badge
              kanbanColumn && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {kanbanColumn.title}
                </Badge>
              )
            )}
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
