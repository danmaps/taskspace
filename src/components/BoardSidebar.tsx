
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Kanban, Plus, Settings, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Board } from '@/integrations/supabase/types';

interface BoardSidebarProps {
  boards: Board[];
  activeBoard: string | null;
  onBoardChange: (boardId: string) => void;
  onCreateBoard: (name: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onReorderBoards?: (sourceIndex: number, destinationIndex: number) => Promise<void>;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({
  boards,
  activeBoard,
  onBoardChange,
  onCreateBoard,
  onDeleteBoard,
}) => {
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim());
      setNewBoardName('');
      setShowNewBoard(false);
    }
  };

  const handleDeleteClick = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent board selection
    setBoardToDelete(board);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (boardToDelete) {
      onDeleteBoard(boardToDelete.id);
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  };  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBoardToDelete(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateBoard();
    }
    if (e.key === 'Escape') {
      setShowNewBoard(false);
      setNewBoardName('');
    }
  };

  return (
    <Sidebar className="board-gradient border-r border-border/30">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Kanban className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">TaskSpace</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Eisenhower Matrix Kanban
        </p>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Your Boards
          </SidebarGroupLabel>          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {boards.map((board, index) => (
                <SidebarMenuItem key={board.id}>
                  <div className="flex items-center group">
                    <SidebarMenuButton
                      onClick={() => onBoardChange(board.id)}
                      isActive={activeBoard === board.id}
                      className="flex-1 justify-start p-3 rounded-lg transition-all hover:bg-sidebar-accent"
                    >
                      <Kanban className="h-4 w-4 mr-3" />
                      <span className="font-medium truncate">{board.name}</span>
                    </SidebarMenuButton>
                    {boards.length > 3 && !['Work', 'Personal', 'Home'].includes(board.name) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(board, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Board
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
              
              <SidebarMenuItem>
                {showNewBoard ? (
                  <div className="p-2 space-y-2">
                    <Input
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Board name..."
                      className="h-8 text-sm bg-background/50 border-border/50"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={handleCreateBoard}
                        className="h-7 px-2 text-xs"
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowNewBoard(false);
                          setNewBoardName('');
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <SidebarMenuButton
                    onClick={() => setShowNewBoard(true)}
                    className="w-full justify-start p-3 rounded-lg text-muted-foreground hover:text-foreground transition-all hover:bg-sidebar-accent"
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    <span>Add Board</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start p-3 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </SidebarFooter>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{boardToDelete?.name}"? This action cannot be undone and will permanently delete all tasks and columns in this board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
};
