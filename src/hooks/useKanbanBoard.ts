import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Board, Column, Task } from '@/integrations/supabase/types'

export type KanbanData = {
  board: Board | null
  columns: Column[]
  tasks: Record<string, Task[]> // columnId -> tasks
}

export function useKanbanBoard(boardId: string | null) {
  const [data, setData] = useState<KanbanData>({
    board: null,
    columns: [],
    tasks: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  useEffect(() => {
    if (boardId && user?.id) {
      fetchKanbanData()
    } else {
      setData({ board: null, columns: [], tasks: {} })
      setLoading(false)
    }
  }, [boardId, user?.id])

  // Separate effect for setting up subscriptions after data is loaded
  useEffect(() => {
    if (boardId && user?.id && data.columns.length > 0) {
      const cleanup = setupRealTimeSubscriptions()
      return cleanup
    }
  }, [boardId, user?.id, data.columns.length])

  const fetchKanbanData = async () => {
    if (!boardId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch board, columns, and tasks in parallel
      const [boardResponse, columnsResponse, tasksResponse] = await Promise.all([
        supabase.from('boards').select('*').eq('id', boardId).single(),
        supabase.from('columns').select('*').eq('board_id', boardId).order('position'),
        supabase
          .from('tasks')
          .select(`
            *,
            columns!inner(board_id)
          `)
          .eq('columns.board_id', boardId)
          .order('position')
      ])

      if (boardResponse.error) throw boardResponse.error
      if (columnsResponse.error) throw columnsResponse.error
      if (tasksResponse.error) throw tasksResponse.error

      // Group tasks by column
      const tasksByColumn: Record<string, Task[]> = {}
      columnsResponse.data.forEach(column => {
        tasksByColumn[column.id] = tasksResponse.data.filter(
          task => task.column_id === column.id
        )
      })

      setData({
        board: boardResponse.data,
        columns: columnsResponse.data,
        tasks: tasksByColumn
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kanban data')
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeSubscriptions = () => {
    if (!boardId || !data.columns.length) return

    // Use a simple debounce to prevent excessive refetches
    let refetchTimeout: NodeJS.Timeout | null = null
    const debouncedRefetch = () => {
      if (refetchTimeout) clearTimeout(refetchTimeout)
      refetchTimeout = setTimeout(() => {
        fetchKanbanData()
      }, 100)
    }

    // Subscribe to column changes
    const columnsChannel = supabase
      .channel(`columns-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`
        },
        debouncedRefetch
      )
      .subscribe()

    // Subscribe to task changes - only for tasks in this board's columns
    const columnIds = data.columns.map(col => col.id).join(',')
    const tasksChannel = supabase
      .channel(`tasks-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          // Only refetch if the task belongs to one of our columns
          const newRecord = payload.new as any
          const oldRecord = payload.old as any
          const relevantColumnId = newRecord?.column_id || oldRecord?.column_id
          
          if (relevantColumnId && data.columns.some(col => col.id === relevantColumnId)) {
            debouncedRefetch()
          }
        }
      )
      .subscribe()

    return () => {
      if (refetchTimeout) clearTimeout(refetchTimeout)
      supabase.removeChannel(columnsChannel)
      supabase.removeChannel(tasksChannel)
    }
  }
  const createDefaultBoard = async (name: string = 'My Kanban Board') => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Create board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({ name, user_id: user.id })
        .select()
        .single()

      if (boardError) throw boardError

      // Create default columns
      const defaultColumns = [
        { title: 'Backlog', position: 0 },
        { title: 'Next Up', position: 1 },
        { title: 'In Progress', position: 2 },
        { title: 'Complete', position: 3 }
      ]

      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .insert(
          defaultColumns.map(col => ({
            ...col,
            board_id: board.id
          }))
        )
        .select()

      if (columnsError) throw columnsError

      return { board, columns }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board')
      throw err
    }
  }

  const optimisticMoveTask = (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => {
    setData(prevData => {
      const newTasks = { ...prevData.tasks }
      
      // Find and remove task from source column
      const sourceColumn = newTasks[sourceColumnId] || []
      const taskIndex = sourceColumn.findIndex(task => task.id === taskId)
      if (taskIndex === -1) return prevData // Task not found
      
      const [task] = sourceColumn.splice(taskIndex, 1)
      
      // Add task to destination column at specified index
      const destColumn = newTasks[destColumnId] || []
      destColumn.splice(destIndex, 0, { ...task, column_id: destColumnId })
      
      return {
        ...prevData,
        tasks: newTasks
      }
    })
  }
  return {
    data,
    loading,
    error,
    refetch: fetchKanbanData,
    createDefaultBoard,
    optimisticMoveTask
  }
}
