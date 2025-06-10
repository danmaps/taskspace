import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { AddTaskDialog } from './AddTaskDialog';
import { InlineEdit } from '@/components/ui/inline-edit';
import { KanbanData } from '@/hooks/useKanbanBoard';
import { useTasks } from '@/hooks/useTasks';
import { useBoards } from '@/hooks/useBoards';
import { useColumns } from '@/hooks/useColumns';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  importance: boolean;
  urgency: boolean;
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
  kanbanData: KanbanData;
  onDataChange?: () => void;
  onOptimisticMoveTask?: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ kanbanData, onDataChange, onOptimisticMoveTask }) => {
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateBoard } = useBoards();
  const { updateColumn } = useColumns(kanbanData.board?.id || null);

  // Create task hooks for each column
  const taskHooks = kanbanData.columns.reduce((acc, column) => {
    acc[column.id] = useTasks(column.id);
    return acc;
  }, {} as Record<string, ReturnType<typeof useTasks>>);
  const handleAddTask = async (columnId: string, task: Omit<Task, 'id'>) => {
    const taskHook = taskHooks[columnId];
    if (!taskHook) return;

    try {      await taskHook.createTask({
        title: task.title,
        description: task.description || null,
        importance: task.importance,
        urgency: task.urgency,
        assignee: task.assignee || null,
        due_date: task.dueDate || null,
        tags: task.tags || []
      });
      
      setShowAddTask(null);
      toast({
        title: "Task created",
        description: "Your task has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBoardTitleEdit = async (newTitle: string) => {
    if (!kanbanData.board || !newTitle.trim()) return;
    
    try {
      await updateBoard(kanbanData.board.id, { name: newTitle.trim() });
      toast({
        title: "Board updated",
        description: "Board title has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update board title. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to reset the input
    }
  };
  const handleColumnTitleEdit = async (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      await updateColumn(columnId, { title: newTitle.trim() });
      toast({
        title: "Column updated",
        description: "Column title has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update column title. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to reset the input
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // Find which column this task belongs to
    const columnId = Object.keys(kanbanData.tasks).find(colId => 
      kanbanData.tasks[colId]?.some(task => task.id === taskId)
    );
    
    if (!columnId) return;
    
    const taskHook = taskHooks[columnId];
    if (!taskHook) return;

    try {      // Convert Task interface to database format
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.importance !== undefined) dbUpdates.importance = updates.importance;
      if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
      if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee || null;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags || [];

      await taskHook.updateTask(taskId, dbUpdates);
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Find which column this task belongs to
    const columnId = Object.keys(kanbanData.tasks).find(colId => 
      kanbanData.tasks[colId]?.some(task => task.id === taskId)
    );
    
    if (!columnId) return;
    
    const taskHook = taskHooks[columnId];
    if (!taskHook) return;

    try {
      await taskHook.deleteTask(taskId);
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleDragEnd = async (result: DropResult) => {
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

    try {
      const sourceColumnId = source.droppableId;
      const destColumnId = destination.droppableId;
      
      if (sourceColumnId === destColumnId) {
        // Reordering within the same column
        const sourceTaskHook = taskHooks[sourceColumnId];
        if (sourceTaskHook) {
          const tasks = kanbanData.tasks[sourceColumnId] || [];
          const reorderedTasks = Array.from(tasks);
          const [removed] = reorderedTasks.splice(source.index, 1);
          reorderedTasks.splice(destination.index, 0, removed);
          
          await sourceTaskHook.reorderTasks(reorderedTasks);
          // Trigger data refresh to ensure UI consistency
          onDataChange?.();
        }
      } else {
        // Moving to a different column
        const sourceTaskHook = taskHooks[sourceColumnId];
        if (sourceTaskHook) {
          await sourceTaskHook.moveTask(draggableId, destColumnId, destination.index);
          // Trigger data refresh to ensure UI consistency across columns
          onDataChange?.();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move task. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!kanbanData.board) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <p className="text-muted-foreground">No board selected</p>
      </div>
    );
  }

  return (    <div className="flex-1 p-6 overflow-hidden">
      <div className="mb-6">
        <InlineEdit
          value={kanbanData.board.name}
          onSave={handleBoardTitleEdit}
          className="text-3xl font-bold text-gradient mb-2 hover:bg-muted/30 rounded px-2 py-1 -mx-2 -my-1"
          placeholder="Board title..."
          maxLength={100}
        />
        {/* <p className="text-muted-foreground">Organize your tasks with the Eisenhower Matrix</p> */}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {kanbanData.columns.map((column) => {
            const columnTasks = kanbanData.tasks[column.id] || [];
            
            return (              <div key={column.id} className="flex flex-col h-full min-h-0">
                <div className="column-header mb-4 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <InlineEdit
                      value={column.title}
                      onSave={(newTitle) => handleColumnTitleEdit(column.id, newTitle)}
                      className="font-semibold text-lg hover:bg-muted/30 rounded px-2 py-1 -mx-2 -my-1"
                      placeholder="Column title..."
                      maxLength={50}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
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
                        snapshot.isDraggingOver 
                          ? 'bg-primary/5 ring-2 ring-primary/20' 
                          : 'bg-muted/30'
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >                              <TaskCard
                                task={{
                                  id: task.id,
                                  title: task.title,
                                  description: task.description || undefined,
                                  importance: task.importance,
                                  urgency: task.urgency,
                                  assignee: task.assignee || undefined,
                                  dueDate: task.due_date || undefined,
                                  tags: task.tags || []
                                }}
                                isDragging={snapshot.isDragging}
                                onUpdateTask={handleUpdateTask}
                                onDeleteTask={handleDeleteTask}
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
            );
          })}
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
