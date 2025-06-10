
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, User } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = board.columns.find(col => col.id === source.droppableId);
    const destColumn = board.columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const draggedTask = sourceColumn.tasks[source.index];

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const newTasks = Array.from(sourceColumn.tasks);
      newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, draggedTask);

      const updatedColumns = board.columns.map(column =>
        column.id === source.droppableId
          ? { ...column, tasks: newTasks }
          : column
      );

      onUpdateBoard(board.id, updatedColumns);
    } else {
      // Moving to a different column
      const sourceTasks = Array.from(sourceColumn.tasks);
      const destTasks = Array.from(destColumn.tasks);

      sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, draggedTask);

      const updatedColumns = board.columns.map(column => {
        if (column.id === source.droppableId) {
          return { ...column, tasks: sourceTasks };
        }
        if (column.id === destination.droppableId) {
          return { ...column, tasks: destTasks };
        }
        return column;
      });

      onUpdateBoard(board.id, updatedColumns);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gradient mb-2">{board.name}</h1>
        <p className="text-muted-foreground">Organize your tasks with the Eisenhower Matrix</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
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

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-3 overflow-y-auto p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-secondary/30' : ''
                    }`}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <TaskCard
                              task={task}
                              columnId={column.id}
                              onMoveTask={handleMoveTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <AddTaskDialog
        isOpen={showAddTask !== null}
        onClose={() => setShowAddTask(null)}
        onAddTask={(task) => showAddTask && handleAddTask(showAddTask, task)}
      />
    </div>
  );
};
