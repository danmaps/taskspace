
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, User } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { AddTaskDialog } from './AddTaskDialog';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'urgent-important' | 'important' | 'urgent' | 'neither';
  assignee?: string;
  dueDate?: string;
  tags?: string[];
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  board: {
    id: string;
    name: string;
    columns: Column[];
  };
  onUpdateBoard: (boardId: string, columns: Column[]) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, onUpdateBoard }) => {
  const [showAddTask, setShowAddTask] = useState<string | null>(null);

  const handleAddTask = (columnId: string, task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedColumns = board.columns.map(column => 
      column.id === columnId 
        ? { ...column, tasks: [...column.tasks, newTask] }
        : column
    );

    onUpdateBoard(board.id, updatedColumns);
    setShowAddTask(null);
  };

  const handleMoveTask = (taskId: string, fromColumnId: string, toColumnId: string) => {
    const fromColumn = board.columns.find(col => col.id === fromColumnId);
    const task = fromColumn?.tasks.find(t => t.id === taskId);
    
    if (!task) return;

    const updatedColumns = board.columns.map(column => {
      if (column.id === fromColumnId) {
        return { ...column, tasks: column.tasks.filter(t => t.id !== taskId) };
      }
      if (column.id === toColumnId) {
        return { ...column, tasks: [...column.tasks, task] };
      }
      return column;
    });

    onUpdateBoard(board.id, updatedColumns);
  };

  return (
    <div className="flex-1 p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gradient mb-2">{board.name}</h1>
        <p className="text-muted-foreground">Organize your tasks with the Eisenhower Matrix</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {board.columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full min-h-0">
            <div className="column-header mb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {column.tasks.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setShowAddTask(column.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add task
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  columnId={column.id}
                  onMoveTask={handleMoveTask}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AddTaskDialog
        isOpen={showAddTask !== null}
        onClose={() => setShowAddTask(null)}
        onAddTask={(task) => showAddTask && handleAddTask(showAddTask, task)}
      />
    </div>
  );
};
