import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Task, TaskInsert, TaskUpdate } from '@/integrations/supabase/types'

export function useTasks(columnId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (columnId) {
      fetchTasks()
    } else {
      setTasks([])
      setLoading(false)
    }
  }, [columnId])

  const fetchTasks = async () => {
    if (!columnId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('column_id', columnId)
        .order('position', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (task: Omit<TaskInsert, 'column_id'>) => {
    if (!columnId) throw new Error('Column ID is required')

    try {
      // Get the next position
      const maxPosition = Math.max(...tasks.map(t => t.position), -1)
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({ 
          ...task, 
          column_id: columnId,
          position: maxPosition + 1
        })
        .select()
        .single()

      if (error) throw error
      setTasks(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      throw err
    }
  }

  const updateTask = async (id: string, updates: TaskUpdate) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTasks(prev => prev.map(task => task.id === id ? data : task))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }

  const moveTask = async (taskId: string, newColumnId: string, newPosition: number) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          column_id: newColumnId, 
          position: newPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      if (newColumnId !== columnId) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      } else {
        setTasks(prev => prev.map(task => task.id === taskId ? data : task))
      }

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task')
      throw err
    }
  }

  const sanitizeTask = (task: Task, index: number) => {
    const sanitized: any = {
      ...task,
      position: index,
      updated_at: task.updated_at && task.updated_at !== "" ? task.updated_at : new Date().toISOString(),
      due_date: task.due_date && task.due_date !== "" ? task.due_date : null,
      description: task.description && task.description !== "" ? task.description : null,
      assignee: task.assignee && task.assignee !== "" ? task.assignee : null,
    };
    delete sanitized.created_at;
    return sanitized;
  };

  const reorderTasks = async (newTasks: Task[]) => {
    try {
      const updates = newTasks.map(sanitizeTask);
      const { error } = await supabase
        .from('tasks')
        .upsert(updates);

      if (error) throw error;
      setTasks(newTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks');
      throw err;
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTasks,
    refetch: fetchTasks
  }
}

// Hook for fetching tasks across all columns of a board
export function useBoardTasks(boardId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (boardId) {
      fetchBoardTasks()
    } else {
      setTasks([])
      setLoading(false)
    }
  }, [boardId])

  const fetchBoardTasks = async () => {
    if (!boardId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          columns!inner(board_id)
        `)
        .eq('columns.board_id', boardId)
        .order('position', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return {
    tasks,
    loading,
    error,
    refetch: fetchBoardTasks
  }
}
