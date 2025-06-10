import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Board, BoardInsert, BoardUpdate } from '@/integrations/supabase/types'

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchBoards()    } else {
      setBoards([])
      setLoading(false)
    }
  }, [user])

  const fetchBoards = async () => {
    try {
      setLoading(true)
      // Try to order by position first, fall back to created_at if position column doesn't exist
      let { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('position', { ascending: true })

      // If position column doesn't exist, fall back to created_at ordering
      if (error && error.message.includes('position')) {
        const fallbackResult = await supabase
          .from('boards')
          .select('*')
          .order('created_at', { ascending: false })
        
        data = fallbackResult.data
        error = fallbackResult.error
      }

      if (error) throw error
      setBoards(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')    } finally {
      setLoading(false)
    }
  }

  const createBoard = async (board: Omit<BoardInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Get the next position (max position + 1), default to 0 if position doesn't exist
      const maxPosition = boards.length > 0 ? Math.max(...boards.map(b => b.position || 0)) : -1
      
      // Try creating with position first
      let { data, error } = await supabase
        .from('boards')
        .insert({ ...board, user_id: user.id, position: maxPosition + 1 })
        .select()
        .single()

      // If position column doesn't exist, create without it
      if (error && error.message.includes('position')) {
        const fallbackResult = await supabase
          .from('boards')
          .insert({ ...board, user_id: user.id })
          .select()
          .single()
        
        data = fallbackResult.data
        error = fallbackResult.error
      }

      if (error) throw error
      setBoards(prev => [...prev, data].sort((a, b) => (a.position || 0) - (b.position || 0)))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board')
      throw err
    }
  }

  const updateBoard = async (id: string, updates: BoardUpdate) => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setBoards(prev => prev.map(board => board.id === id ? data : board))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board')
      throw err
    }
  }
  const deleteBoard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', id)

      if (error) throw error
      setBoards(prev => prev.filter(board => board.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board')
      throw err
    }
  }

  const reorderBoards = async (sourceIndex: number, destinationIndex: number) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Optimistically update the local state
      const reorderedBoards = Array.from(boards)
      const [movedBoard] = reorderedBoards.splice(sourceIndex, 1)
      reorderedBoards.splice(destinationIndex, 0, movedBoard)
      
      // Update positions
      const boardUpdates = reorderedBoards.map((board, index) => ({
        id: board.id,
        position: index
      }))

      setBoards(reorderedBoards)

      // Update positions in database
      const updatePromises = boardUpdates.map(({ id, position }) =>
        supabase
          .from('boards')
          .update({ position })
          .eq('id', id)
      )

      const results = await Promise.all(updatePromises)
      
      // Check for any errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error('Failed to update board positions')
      }    } catch (err) {
      // Revert optimistic update on error
      await fetchBoards()
      setError(err instanceof Error ? err.message : 'Failed to reorder boards')
      throw err
    }
  }

  return {
    boards,
    loading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    refetch: fetchBoards
  }
}
