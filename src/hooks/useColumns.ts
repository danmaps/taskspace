import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Column, ColumnInsert, ColumnUpdate } from '@/integrations/supabase/types'

export function useColumns(boardId: string | null) {
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (boardId) {
      fetchColumns()
    } else {
      setColumns([])
      setLoading(false)
    }
  }, [boardId])

  const fetchColumns = async () => {
    if (!boardId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })

      if (error) throw error
      setColumns(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createColumn = async (column: Omit<ColumnInsert, 'board_id'>) => {
    if (!boardId) throw new Error('Board ID is required')

    try {
      // Get the next position
      const maxPosition = Math.max(...columns.map(c => c.position), -1)
      
      const { data, error } = await supabase
        .from('columns')
        .insert({ 
          ...column, 
          board_id: boardId,
          position: maxPosition + 1
        })
        .select()
        .single()

      if (error) throw error
      setColumns(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create column')
      throw err
    }
  }

  const updateColumn = async (id: string, updates: ColumnUpdate) => {
    try {
      const { data, error } = await supabase
        .from('columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setColumns(prev => prev.map(column => column.id === id ? data : column))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column')
      throw err
    }
  }

  const deleteColumn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', id)

      if (error) throw error
      setColumns(prev => prev.filter(column => column.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete column')
      throw err
    }
  }

  const reorderColumns = async (newColumns: Column[]) => {
    try {
      // Update positions in batch
      const updates = newColumns.map((column, index) => ({
        id: column.id,
        position: index
      }))

      // Update each column individually to avoid type issues
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('columns')
          .update({ position: update.position })
          .eq('id', update.id)
        
        if (updateError) throw updateError
      }

      setColumns(newColumns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder columns')
      throw err
    }
  }

  return {
    columns,
    loading,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    refetch: fetchColumns
  }
}
