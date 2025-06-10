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
      // Temporarily use created_at ordering until position column migration is applied
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBoards(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  const createBoard = async (board: Omit<BoardInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Temporarily create without position until migration is applied
      const { data, error } = await supabase
        .from('boards')
        .insert({ ...board, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      setBoards(prev => [...prev, data])
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
  // Temporarily disabled until position column migration is applied
  // const reorderBoards = async (sourceIndex: number, destinationIndex: number) => {
  //   // Function temporarily disabled
  // }

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
