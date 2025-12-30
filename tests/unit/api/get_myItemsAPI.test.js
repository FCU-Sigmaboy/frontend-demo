import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMyItems } from '@/api/get_myItemsAPI'
import { supabase } from '@/lib/supabase'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}))

describe('get_myItemsAPI', () => {
  const mockUser = { id: 'user-123' }

  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.getUser.mockReset()
    supabase.rpc.mockReset()
  })

  describe('getMyItems', () => {
    it('should get my items successfully with default options', async () => {
      const mockItems = [
        { id: 1, title: '商品1', price: 100, favorites_count: 5 },
        { id: 2, title: '商品2', price: 200, favorites_count: 3 }
      ]

      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })
      supabase.rpc.mockResolvedValueOnce({ data: mockItems, error: null })

      const result = await getMyItems()

      expect(supabase.auth.getUser).toHaveBeenCalled()
      expect(supabase.rpc).toHaveBeenCalledWith('get_my_items', {
        p_page: 1,
        p_size: 20,
        p_sort_by: 'created_at',
        p_sort_direction: 'desc'
      })
      expect(result).toEqual(mockItems)
    })

    it('should get my items with custom options', async () => {
      const mockItems = [{ id: 1, title: '商品1' }]
      
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })
      supabase.rpc.mockResolvedValueOnce({ data: mockItems, error: null })

      const options = {
        page: 2,
        size: 10,
        sort_by: 'price',
        sort_direction: 'asc'
      }

      const result = await getMyItems(options)

      expect(supabase.rpc).toHaveBeenCalledWith('get_my_items', {
        p_page: 2,
        p_size: 10,
        p_sort_by: 'price',
        p_sort_direction: 'asc'
      })
      expect(result).toEqual(mockItems)
    })

    it('should get my items with partial options', async () => {
      const mockItems = []
      
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })
      supabase.rpc.mockResolvedValueOnce({ data: mockItems, error: null })

      const options = { page: 3, sort_by: 'title' }

      const result = await getMyItems(options)

      expect(supabase.rpc).toHaveBeenCalledWith('get_my_items', {
        p_page: 3,
        p_size: 20,
        p_sort_by: 'title',
        p_sort_direction: 'desc'
      })
      expect(result).toEqual(mockItems)
    })

    it('should return null when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      const result = await getMyItems()

      expect(result).toBeNull()
    })

    it('should throw error when RPC fails', async () => {
      const mockError = { message: '資料庫錯誤' }
      
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      await expect(getMyItems()).rejects.toThrow('資料庫錯誤')
    })

    it('should return empty array when user has no items', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })
      supabase.rpc.mockResolvedValueOnce({ data: [], error: null })

      const result = await getMyItems()

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
