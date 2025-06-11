import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/KanbanBoard';
import { BoardSidebar } from '@/components/BoardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useBoards } from '@/hooks/useBoards';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();  // Use remote data hooks
  const { boards, loading: boardsLoading, createBoard, deleteBoard } = useBoards();
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const { data: kanbanData, loading: kanbanLoading, createDefaultBoard, refetch: refetchKanbanData, optimisticMoveTask } = useKanbanBoard(activeBoardId);
  // Set initial active board when boards are loaded
  useEffect(() => {
    if (boards.length > 0 && !activeBoardId) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId]);

  const handleBoardChange = (boardId: string) => {
    setActiveBoardId(boardId);
  };
  const handleCreateBoard = async (name: string) => {
    try {
      const { board } = await createDefaultBoard(name);
      setActiveBoardId(board.id);
      toast({
        title: "Board created",
        description: `"${name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleDeleteBoard = async (boardId: string) => {
    try {
      await deleteBoard(boardId);
      
      // If we deleted the active board, switch to another board
      if (boardId === activeBoardId) {
        const remainingBoards = boards.filter(board => board.id !== boardId);
        if (remainingBoards.length > 0) {
          setActiveBoardId(remainingBoards[0].id);
        } else {
          setActiveBoardId(null);
        }
      }
      
      toast({
        title: "Board deleted",
        description: "The board has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete board. Please try again.",
        variant: "destructive",
      });
    }
  };
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

  // Show loading state while checking authentication or loading boards
  if (authLoading || boardsLoading || kanbanLoading) {
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
      <div className="min-h-screen flex w-full bg-background">        <BoardSidebar
          boards={boards}
          activeBoard={activeBoardId}
          onBoardChange={handleBoardChange}
          onCreateBoard={handleCreateBoard}
          onDeleteBoard={handleDeleteBoard}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-4 border-b border-border/30 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="text-sm text-muted-foreground">
                TaskSpace • Eisenhower Matrix Kanban Board
              </div>
            </div>            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/prototype-3d?boardId=${activeBoardId}`)}
                className="text-muted-foreground hover:text-foreground"
                disabled={!activeBoardId}
              >
                <Boxes className="h-4 w-4 mr-1" />
                3D Prototype
              </Button>
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
          </div>          <KanbanBoard
            kanbanData={kanbanData}
            onDataChange={refetchKanbanData}
            onOptimisticMoveTask={optimisticMoveTask}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
