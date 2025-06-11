import React, { useState, useMemo } from 'react';
import { Task } from './KanbanBoard';
import { Column } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  User, 
  Tag,
  Edit2,
  Trash2
} from 'lucide-react';
import { InlineEdit } from '@/components/ui/inline-edit';
import { Checkbox } from '@/components/ui/checkbox';

interface TableViewProps {
  tasks: Record<string, Task[]>;
  columns: Column[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

type SortField = 'title' | 'status' | 'importance' | 'urgency' | 'assignee' | 'dueDate';
type SortDirection = 'asc' | 'desc' | null;

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  columns,
  onUpdateTask,
  onDeleteTask
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getStatusColor = (status: string) => {
    // Simple color mapping - you can enhance this
    const colors = ['blue', 'yellow', 'orange', 'green'];
    const index = status.length % colors.length;
    return colors[index];
  };

  // Flatten all tasks with their column info
  const allTasks = useMemo(() => {
    const flattened: Array<Task & { status: string; statusColor: string }> = [];
    
    Object.entries(tasks).forEach(([columnId, columnTasks]) => {
      const column = columns.find(col => col.id === columnId);
      const statusName = column?.title || 'Unknown';
      
      columnTasks.forEach(task => {
        flattened.push({
          ...task,
          status: statusName,
          statusColor: getStatusColor(statusName)
        });
      });
    });
    
    return flattened;
  }, [tasks, columns]);

  // Sort tasks based on current sort settings
  const sortedTasks = useMemo(() => {
    if (!sortField || !sortDirection) return allTasks;

    return [...allTasks].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases
      if (sortField === 'status') {
        aValue = a.status;
        bValue = b.status;
      } else if (sortField === 'importance' || sortField === 'urgency') {
        aValue = a[sortField] ? 1 : 0;
        bValue = b[sortField] ? 1 : 0;
      } else if (sortField === 'dueDate') {
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      }

      // Convert to strings for comparison if needed
      aValue = aValue?.toString().toLowerCase() || '';
      bValue = bValue?.toString().toLowerCase() || '';

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [allTasks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    } else if (sortDirection === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const handleUpdateTask = async (taskId: string, field: keyof Task, value: any) => {
    if (!onUpdateTask) return;
    
    try {
      await onUpdateTask(taskId, { [field]: value });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };
  const handleDeleteTask = async (taskId: string) => {
    if (!onDeleteTask) return;
    
    try {
      await onDeleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getPriorityBadge = (task: Task) => {
    if (task.urgency && task.importance) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    } else if (task.importance) {
      return <Badge variant="default" className="text-xs bg-yellow-500">Important</Badge>;
    } else if (task.urgency) {
      return <Badge variant="secondary" className="text-xs bg-orange-500 text-white">Urgent</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs">Normal</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('title')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Title
                  {getSortIcon('title')}
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Priority</TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('assignee')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  <User className="w-4 h-4 mr-1" />
                  Assignee
                  {getSortIcon('assignee')}
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('dueDate')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Due Date
                  {getSortIcon('dueDate')}
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('importance')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Important
                  {getSortIcon('importance')}
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('urgency')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Urgent
                  {getSortIcon('urgency')}
                </Button>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="space-y-1">
                    <InlineEdit
                      value={task.title}
                      onSave={(value) => handleUpdateTask(task.id, 'title', value)}
                      className="font-medium"
                      placeholder="Task title..."
                    />
                    {task.description && (
                      <InlineEdit
                        value={task.description}
                        onSave={(value) => handleUpdateTask(task.id, 'description', value)}
                        className="text-sm text-muted-foreground"
                        placeholder="Add description..."
                        multiline
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`bg-${task.statusColor}-50 text-${task.statusColor}-700 border-${task.statusColor}-200`}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getPriorityBadge(task)}
                </TableCell>
                <TableCell>
                  <InlineEdit
                    value={task.assignee || ''}
                    onSave={(value) => handleUpdateTask(task.id, 'assignee', value || undefined)}
                    className="text-sm"
                    placeholder="Assign to..."
                  />
                </TableCell>
                <TableCell>
                  <InlineEdit
                    value={task.dueDate || ''}
                    onSave={(value) => handleUpdateTask(task.id, 'dueDate', value || undefined)}
                    className="text-sm"
                    placeholder="Set due date..."
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={task.importance}
                    onCheckedChange={(checked) => 
                      handleUpdateTask(task.id, 'importance', checked === true)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={task.urgency}
                    onCheckedChange={(checked) => 
                      handleUpdateTask(task.id, 'urgency', checked === true)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {task.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sortedTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
