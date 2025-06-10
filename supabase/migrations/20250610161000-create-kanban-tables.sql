-- Create boards table
CREATE TABLE public.boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create columns table
CREATE TABLE public.columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'neither' CHECK (priority IN ('urgent-important', 'important', 'urgent', 'neither')),
  assignee TEXT,
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view their own boards" 
  ON public.boards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" 
  ON public.boards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" 
  ON public.boards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" 
  ON public.boards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for columns
CREATE POLICY "Users can view columns of their boards" 
  ON public.columns 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create columns in their boards" 
  ON public.columns 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update columns in their boards" 
  ON public.columns 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete columns in their boards" 
  ON public.columns 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  ));

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their boards" 
  ON public.tasks 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id 
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in their boards" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id 
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks in their boards" 
  ON public.tasks 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id 
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks in their boards" 
  ON public.tasks 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id 
    AND boards.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_boards_user_id ON public.boards(user_id);
CREATE INDEX idx_columns_board_id ON public.columns(board_id);
CREATE INDEX idx_columns_position ON public.columns(board_id, position);
CREATE INDEX idx_tasks_column_id ON public.tasks(column_id);
CREATE INDEX idx_tasks_position ON public.tasks(column_id, position);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_boards_updated_at 
    BEFORE UPDATE ON public.boards 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_columns_updated_at 
    BEFORE UPDATE ON public.columns 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
