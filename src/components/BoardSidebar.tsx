
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
import { Kanban, Plus, Settings } from 'lucide-react';
import { Column } from './KanbanBoard';

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

interface BoardSidebarProps {
  boards: Board[];
  activeBoard: string;
  onBoardChange: (boardId: string) => void;
  onCreateBoard: (name: string) => void;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({
  boards,
  activeBoard,
  onBoardChange,
  onCreateBoard,
}) => {
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim());
      setNewBoardName('');
      setShowNewBoard(false);
    }
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
          <h2 className="text-xl font-bold text-gradient">TaskFlow</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Eisenhower Matrix Kanban
        </p>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Your Boards
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {boards.map((board) => (
                <SidebarMenuItem key={board.id}>
                  <SidebarMenuButton
                    onClick={() => onBoardChange(board.id)}
                    isActive={activeBoard === board.id}
                    className="w-full justify-start p-3 rounded-lg transition-all hover:bg-sidebar-accent"
                  >
                    <Kanban className="h-4 w-4 mr-3" />
                    <span className="font-medium">{board.name}</span>
                  </SidebarMenuButton>
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
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start p-3 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
