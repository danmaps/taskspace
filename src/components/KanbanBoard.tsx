import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, Columns, Table } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { AddTaskDialog } from './AddTaskDialog';
import { EisenhowerMatrixView } from './EisenhowerMatrixView';
import { TableView } from './TableView';
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Record<string, Task[]>>(kanbanData.tasks);
  
  // Update local tasks when kanbanData changes (initial load and background refreshes)
  useEffect(() => {
    setLocalTasks(kanbanData.tasks);
  }, [kanbanData.tasks]);

  // Helper function to update local tasks
  const updateLocalTasks = (columnId: string, updatedTasks: Task[]) => {
    setLocalTasks(prev => ({
      ...prev,
      [columnId]: updatedTasks
    }));
  };

  // Persist view state in localStorage with support for three views
  const [viewMode, setViewMode] = useState<'kanban' | 'matrix' | 'table'>(() => {
    const saved = localStorage.getItem('kanban-view-mode');
    return (saved === 'matrix' || saved === 'table' || saved === 'kanban') ? saved : 'kanban';
  });
  
  // Save view preference to localStorage when it changes
  const handleViewChange = (newMode: 'kanban' | 'matrix' | 'table') => {
    setViewMode(newMode);
    localStorage.setItem('kanban-view-mode', newMode);
  };
  
  const { toast } = useToast();
  const { updateBoard } = useBoards();
  const { updateColumn } = useColumns(kanbanData.board?.id || null);

  // Create task hooks for each column
  const taskHooks = kanbanData.columns.reduce((acc, column) => {
    acc[column.id] = useTasks(column.id);
    return acc;
  }, {} as Record<string, ReturnType<typeof useTasks>>);  const handleAddTask = async (columnId: string, task: Omit<Task, 'id'>) => {
    const taskHook = taskHooks[columnId];
    if (!taskHook) return;

    try {
      // Generate a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        title: task.title,
        description: task.description,
        importance: task.importance,
        urgency: task.urgency,
        assignee: task.assignee,
        dueDate: task.dueDate,
        tags: task.tags || []
      };

      // Optimistically update local state
      updateLocalTasks(columnId, [...(localTasks[columnId] || []), optimisticTask]);
      setShowAddTask(null);

      // Perform the actual database operation
      const createdTask = await taskHook.createTask({
        title: task.title,
        description: task.description || null,
        importance: task.importance,
        urgency: task.urgency,
        assignee: task.assignee || null,
        due_date: task.dueDate || null,
        tags: task.tags || []
      });      // Update local state with the real task ID
      if (createdTask) {
        setLocalTasks(prev => ({
          ...prev,
          [columnId]: prev[columnId].map(t => 
            t.id === tempId ? {
              id: createdTask.id,
              title: createdTask.title,
              description: createdTask.description || undefined,
              importance: createdTask.importance,
              urgency: createdTask.urgency,
              assignee: createdTask.assignee || undefined,
              dueDate: createdTask.due_date || undefined,
              tags: createdTask.tags || []
            } : t
          )
        }));
      }

      toast({
        title: "Task created",
        description: "Your task has been added successfully.",
      });
    } catch (error) {
      // Revert optimistic update on error
      updateLocalTasks(columnId, localTasks[columnId].filter(t => !t.id.startsWith('temp-')));
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleCloseEditDialog = () => {
    setEditingTask(null);
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
    const columnId = Object.keys(localTasks).find(colId => 
      localTasks[colId]?.some(task => task.id === taskId)
    );
    
    if (!columnId) return;
    
    const taskHook = taskHooks[columnId];
    if (!taskHook) return;

    try {
      // Optimistically update local state
      updateLocalTasks(columnId, localTasks[columnId].map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));

      // Convert Task interface to database format
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.importance !== undefined) dbUpdates.importance = updates.importance;
      if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
      if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee || null;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags || [];

      // Perform the actual database update
      await taskHook.updateTask(taskId, dbUpdates);
      
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });    } catch (error) {
      // Revert optimistic update on error by restoring original state
      setLocalTasks(kanbanData.tasks);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const columnId = Object.keys(localTasks).find(colId => 
      localTasks[colId]?.some(task => task.id === taskId)
    );
    
    if (!columnId) return;
    
    const taskHook = taskHooks[columnId];
    if (!taskHook) return;    try {
      // Store the task before deleting for potential rollback
      const deletedTask = localTasks[columnId].find(t => t.id === taskId);
      const originalTasks = [...localTasks[columnId]];
      
      // Optimistically update local state
      updateLocalTasks(columnId, localTasks[columnId].filter(t => t.id !== taskId));

      // Perform the actual database operation
      await taskHook.deleteTask(taskId);
      
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });    } catch (error) {
      // Revert optimistic update on error by restoring the full original state
      setLocalTasks(kanbanData.tasks);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMatrixDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId) {
      return; // Same quadrant, no priority change needed
    }

    // Map matrix quadrants to importance/urgency values
    const getQuadrantPriority = (quadrantId: string) => {
      switch (quadrantId) {
        case 'urgent-important': return { importance: true, urgency: true };
        case 'important-not-urgent': return { importance: true, urgency: false };
        case 'urgent-not-important': return { importance: false, urgency: true };
        case 'neither': return { importance: false, urgency: false };
        default: return { importance: false, urgency: false };
      }
    };

    const newPriority = getQuadrantPriority(destination.droppableId);
    
    // Update the task's importance and urgency
    try {
      await handleUpdateTask(draggableId, newPriority);
    } catch (error) {
      // Error already handled in handleUpdateTask
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

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    try {
      if (sourceColumnId === destColumnId) {
        // Optimistically update local state for reordering
        const tasks = localTasks[sourceColumnId] || [];
        const reorderedTasks = Array.from(tasks);
        const [removed] = reorderedTasks.splice(source.index, 1);
        reorderedTasks.splice(destination.index, 0, removed);
        updateLocalTasks(sourceColumnId, reorderedTasks);        // Perform the actual database operation
        const sourceTaskHook = taskHooks[sourceColumnId];
        if (sourceTaskHook) {
          // Convert to the format expected by reorderTasks (only need id and position)
          const taskUpdates = reorderedTasks.map((task, index) => ({
            id: task.id,
            position: index,
            // Include other required database fields (will be ignored by upsert)
            column_id: sourceColumnId,
            title: task.title,
            description: task.description || '',
            importance: task.importance,
            urgency: task.urgency,
            assignee: task.assignee || '',
            due_date: task.dueDate || '',
            tags: task.tags || [],
            created_at: '',
            updated_at: ''
          }));
          await sourceTaskHook.reorderTasks(taskUpdates);
        }
      } else {
        // Optimistically update local state for moving between columns
        const sourceTask = localTasks[sourceColumnId].find(t => t.id === draggableId);
        if (sourceTask) {
          const newSourceTasks = localTasks[sourceColumnId].filter(t => t.id !== draggableId);
          const newDestTasks = localTasks[destColumnId] || [];
          newDestTasks.splice(destination.index, 0, sourceTask);
          
          updateLocalTasks(sourceColumnId, newSourceTasks);
          updateLocalTasks(destColumnId, newDestTasks);
          
          // Perform the actual database operation
          const sourceTaskHook = taskHooks[sourceColumnId];
          if (sourceTaskHook) {
            try {
              await sourceTaskHook.moveTask(draggableId, destColumnId, destination.index);            } catch (error) {
              // Revert optimistic update on error
              setLocalTasks(kanbanData.tasks);
              throw error;
            }
          }
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
  return (
    <div className="flex-1 p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <InlineEdit
            value={kanbanData.board.name}
            onSave={handleBoardTitleEdit}
            className="text-3xl font-bold text-gradient mb-2 hover:bg-muted/30 rounded px-2 py-1 -mx-2 -my-1"
            placeholder="Board title..."
            maxLength={100}
          />
        </div>          {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange('kanban')}
            className="gap-2"
          >
            <Columns className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'matrix' ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange('matrix')}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Matrix
          </Button>
          <Button
            variant={viewMode === 'table' ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange('table')}
            className="gap-2"
          >
            <Table className="h-4 w-4" />
            Table
          </Button>
        </div>
      </div>      {/* Conditional View Rendering */}
      {viewMode === 'matrix' ? (        <EisenhowerMatrixView
          tasks={localTasks}
          columns={kanbanData.columns}
          onDragEnd={handleMatrixDragEnd}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />) : viewMode === 'table' ? (
        <TableView
          tasks={localTasks}
          columns={kanbanData.columns}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
        />
      ) : (        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
            {kanbanData.columns.map((column) => {
              const columnTasks = localTasks[column.id] || [];
              
              return (
                <div key={column.id} className="flex flex-col h-full min-h-0">
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
                              >
                                <TaskCard
                                  task={{
                                    id: task.id,
                                    title: task.title,
                                    description: task.description || undefined,
                                    importance: task.importance,
                                    urgency: task.urgency,
                                    assignee: task.assignee || undefined,
                                    dueDate: task.dueDate || undefined,
                                    tags: task.tags || []
                                  }}
                                  isDragging={snapshot.isDragging}
                                  onUpdateTask={handleUpdateTask}
                                  onDeleteTask={handleDeleteTask}
                                  onEditTask={handleEditTask}
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
      )}      <AddTaskDialog
        isOpen={showAddTask !== null || editingTask !== null}
        onClose={() => {
          setShowAddTask(null);
          setEditingTask(null);
        }}
        onAddTask={(task) => showAddTask && handleAddTask(showAddTask, task)}
        onUpdateTask={handleUpdateTask}
        editingTask={editingTask}
      />
    </div>
  );
};
