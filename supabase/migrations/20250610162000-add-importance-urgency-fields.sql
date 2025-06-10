-- Add importance and urgency fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN importance BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN urgency BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing priority data to new fields
UPDATE public.tasks 
SET 
  importance = CASE 
    WHEN priority IN ('urgent-important', 'important') THEN true 
    ELSE false 
  END,
  urgency = CASE 
    WHEN priority IN ('urgent-important', 'urgent') THEN true 
    ELSE false 
  END;

-- Drop the old priority column
ALTER TABLE public.tasks DROP COLUMN priority;
