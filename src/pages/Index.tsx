import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { KanbanBoard, Column } from '@/components/KanbanBoard';
import { BoardSidebar } from '@/components/BoardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

const defaultColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [
      {
        id: 'task-1',
        title: 'Setup project authentication',
        description: 'Implement user login and registration with Supabase',
        priority: 'urgent-important',
        assignee: 'Alex',
        dueDate: '2024-06-15',
        tags: ['backend', 'auth'],
      },
      {
        id: 'task-2',
        title: 'Design user dashboard',
        description: 'Create wireframes and mockups for the main dashboard',
        priority: 'important',
        assignee: 'Sarah',
        dueDate: '2024-06-18',
        tags: ['design', 'ui'],
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [
      {
        id: 'task-3',
        title: 'Implement drag and drop',
        description: 'Add beautiful drag and drop functionality to the kanban board',
        priority: 'urgent',
        assignee: 'Mike',
        dueDate: '2024-06-16',
        tags: ['frontend', 'interaction'],
      },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    tasks: [
      {
        id: 'task-4',
        title: 'Code review for API endpoints',
        description: 'Review and test all REST API endpoints',
        priority: 'important',
        assignee: 'Jordan',
        tags: ['backend', 'review'],
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [
      {
        id: 'task-5',
        title: 'Setup development environment',
        description: 'Configure development tools and CI/CD pipeline',
        priority: 'neither',
        assignee: 'Alex',
        tags: ['devops', 'setup'],
      },
    ],
  },
];

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [boards, setBoards] = useState<Board[]>([
    {
      id: 'board-1',
      name: 'Product Development',
      columns: defaultColumns,
    },
    {
      id: 'board-2',
      name: 'Marketing Campaign',
      columns: [
        {
          id: 'todo',
          title: 'To Do',
          tasks: [
            {
              id: 'task-6',
              title: 'Create social media strategy',
              description: 'Develop comprehensive social media marketing plan',
              priority: 'important',
              assignee: 'Emma',
              dueDate: '2024-06-20',
              tags: ['marketing', 'strategy'],
            },
          ],
        },
        {
          id: 'in-progress',
          title: 'In Progress',
          tasks: [],
        },
        {
          id: 'review',
          title: 'Review',
          tasks: [],
        },
        {
          id: 'done',
          title: 'Done',
          tasks: [],
        },
      ],
    },
  ]);

  const [activeBoard, setActiveBoard] = useState('board-1');

  const currentBoard = boards.find(board => board.id === activeBoard) || boards[0];

  const handleBoardChange = (boardId: string) => {
    setActiveBoard(boardId);
  };

  const handleCreateBoard = (name: string) => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      name,
      columns: [
        { id: 'todo', title: 'To Do', tasks: [] },
        { id: 'in-progress', title: 'In Progress', tasks: [] },
        { id: 'review', title: 'Review', tasks: [] },
        { id: 'done', title: 'Done', tasks: [] },
      ],
    };

    setBoards(prev => [...prev, newBoard]);
    setActiveBoard(newBoard.id);
  };

  const handleUpdateBoard = (boardId: string, columns: Column[]) => {
    setBoards(prev => 
      prev.map(board => 
        board.id === boardId 
          ? { ...board, columns }
          : board
      )
    );
  };

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <BoardSidebar
          boards={boards}
          activeBoard={activeBoard}
          onBoardChange={handleBoardChange}
          onCreateBoard={handleCreateBoard}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-4 border-b border-border/30 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="text-sm text-muted-foreground">
                TaskFlow • Eisenhower Matrix Kanban Board
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
          <KanbanBoard
            board={currentBoard}
            onUpdateBoard={handleUpdateBoard}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
