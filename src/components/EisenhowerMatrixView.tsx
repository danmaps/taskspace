import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { Task } from './KanbanBoard';
import { Column } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';

interface EisenhowerMatrixViewProps {
  tasks: Record<string, Task[]>;
  columns: Column[];
  onDragEnd: (result: DropResult) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onEditTask?: (task: Task) => void;
}

export const EisenhowerMatrixView: React.FC<EisenhowerMatrixViewProps> = ({
  tasks,
  columns,
  onDragEnd,
  onUpdateTask,
  onDeleteTask,
  onEditTask
}) => {
  // Get all tasks and organize by importance/urgency
  const allTasks = Object.values(tasks).flat();
  const tasksByQuadrant = {
    'urgent-important': allTasks.filter(task => task.urgency && task.importance),
    'important-not-urgent': allTasks.filter(task => !task.urgency && task.importance),
    'urgent-not-important': allTasks.filter(task => task.urgency && !task.importance),
    'neither': allTasks.filter(task => !task.urgency && !task.importance)
  };

  // Create a map to find which column a task belongs to
  const taskToColumnMap = new Map<string, Column>();
  Object.entries(tasks).forEach(([columnId, columnTasks]) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      columnTasks.forEach(task => {
        taskToColumnMap.set(task.id, column);
      });
    }
  });

  const getQuadrantTitle = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'Do First';
      case 'important-not-urgent': return 'Schedule';
      case 'urgent-not-important': return 'Delegate';
      case 'neither': return 'Eliminate';
      default: return '';
    }
  };

  const getQuadrantSubtitle = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'Urgent & Important';
      case 'important-not-urgent': return 'Important, Not Urgent';
      case 'urgent-not-important': return 'Urgent, Not Important';
      case 'neither': return 'Neither Urgent nor Important';
      default: return '';
    }
  };

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'border-red-500/30 bg-red-500/5';
      case 'important-not-urgent': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'urgent-not-important': return 'border-orange-500/30 bg-orange-500/5';
      case 'neither': return 'border-gray-500/30 bg-gray-500/5';
      default: return '';
    }
  };
  return (
    <div className="h-full flex flex-col">


      {/* Matrix Container with Axis Labels */}
      <div className="relative flex-1 min-h-0 pl-16 pb-12">
        {/* Y-axis label (Importance) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-muted-foreground whitespace-nowrap">
          IMPORTANCE
        </div>
        
        {/* X-axis label (Urgency) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-semibold text-muted-foreground">
          URGENCY
        </div>

        {/* Y-axis indicators */}
        <div className="absolute left-10 top-6 text-xs text-muted-foreground font-medium">High</div>
        <div className="absolute left-10 bottom-20 text-xs text-muted-foreground font-medium">Low</div>
        
        {/* X-axis indicators */}
        <div className="absolute bottom-8 left-20 text-xs text-muted-foreground font-medium">Low</div>
        <div className="absolute bottom-8 right-4 text-xs text-muted-foreground font-medium">High</div>        <DragDropContext onDragEnd={onDragEnd}>
          {/* Matrix Grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full border-2 border-border/30 rounded-lg p-4 bg-background/50">
            {/* Top Left: Important, Not Urgent */}
            <Droppable droppableId="important-not-urgent">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border-2 rounded-lg p-4 flex flex-col ${getQuadrantColor('important-not-urgent')} ${
                    snapshot.isDraggingOver ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">{getQuadrantTitle('important-not-urgent')}</h3>
                    <p className="text-xs text-muted-foreground">{getQuadrantSubtitle('important-not-urgent')}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {tasksByQuadrant['important-not-urgent'].length}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasksByQuadrant['important-not-urgent'].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}                          >
                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                              isMatrixView={true}
                              kanbanColumn={taskToColumnMap.get(task.id)}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Top Right: Urgent & Important */}
            <Droppable droppableId="urgent-important">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border-2 rounded-lg p-4 flex flex-col ${getQuadrantColor('urgent-important')} ${
                    snapshot.isDraggingOver ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">{getQuadrantTitle('urgent-important')}</h3>
                    <p className="text-xs text-muted-foreground">{getQuadrantSubtitle('urgent-important')}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {tasksByQuadrant['urgent-important'].length}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasksByQuadrant['urgent-important'].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                              isMatrixView={true}
                              kanbanColumn={taskToColumnMap.get(task.id)}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Bottom Left: Neither */}
            <Droppable droppableId="neither">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border-2 rounded-lg p-4 flex flex-col ${getQuadrantColor('neither')} ${
                    snapshot.isDraggingOver ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">{getQuadrantTitle('neither')}</h3>
                    <p className="text-xs text-muted-foreground">{getQuadrantSubtitle('neither')}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {tasksByQuadrant['neither'].length}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasksByQuadrant['neither'].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}                          >
                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                              isMatrixView={true}
                              kanbanColumn={taskToColumnMap.get(task.id)}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Bottom Right: Urgent, Not Important */}
            <Droppable droppableId="urgent-not-important">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`border-2 rounded-lg p-4 flex flex-col ${getQuadrantColor('urgent-not-important')} ${
                    snapshot.isDraggingOver ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">{getQuadrantTitle('urgent-not-important')}</h3>
                    <p className="text-xs text-muted-foreground">{getQuadrantSubtitle('urgent-not-important')}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {tasksByQuadrant['urgent-not-important'].length}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasksByQuadrant['urgent-not-important'].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                              isMatrixView={true}
                              kanbanColumn={taskToColumnMap.get(task.id)}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};
