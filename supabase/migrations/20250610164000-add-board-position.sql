-- Add position field to boards table for drag-and-drop ordering
ALTER TABLE public.boards 
ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Update existing boards to have sequential positions based on creation date
UPDATE public.boards 
SET position = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as row_number
  FROM public.boards
) AS subquery 
WHERE public.boards.id = subquery.id;

-- Create index for better performance on position queries
CREATE INDEX idx_boards_user_position ON public.boards(user_id, position);
