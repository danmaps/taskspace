import React from 'react';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { TaskSpaceView3D } from '@/components/TaskSpaceView3D';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { demoTasks, demoColumns } from '@/data/demoData';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const Prototype3D = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const boardId = query.get('boardId');
  const { data, loading, error } = useKanbanBoard(boardId); // Use boardId from query string

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading 3D prototype...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Error loading data: {error}</div>
      </div>
    );
  }
  if (!data) {
    // Use demo data as fallback
    const fallbackData = {
      tasks: demoTasks,
      columns: demoColumns
    };
    
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main App
          </Button>          <div>
            <h1 className="text-xl font-bold">3D Task Space</h1>
            <p className="text-sm text-muted-foreground">
              Explore your tasks as cubes in 3D space - X-axis: columns, Y-axis: urgency, Z-axis: importance (Demo Mode)
            </p>
          </div>
        </div>

        {/* 3D View */}
        <div className="flex-1">
          <TaskSpaceView3D 
            tasks={fallbackData.tasks} 
            columns={fallbackData.columns} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Main App
        </Button>        <div>          <h1 className="text-xl font-bold">3D Task Space</h1>
          <p className="text-sm text-muted-foreground">
            Explore your tasks as cubes in 3D space - X-axis: columns, Y-axis: urgency, Z-axis: importance
          </p>
        </div>
      </div>

      {/* 3D View */}
      <div className="flex-1">
        <TaskSpaceView3D 
          tasks={data.tasks} 
          columns={data.columns} 
        />
      </div>
    </div>
  );
};
