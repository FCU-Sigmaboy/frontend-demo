import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getMyFavoriteItems, 
  addFavoriteItem, 
  removeFavoriteItem 
} from '@/api/favorite'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe('favorite', () => {
  const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockFavoriteItems = [
    {
      id: 1,
      title: '測試物品1',
      price: 100,
      distance: 5.2,
      favorited_at: '2025-01-15T10:00:00'
    },
    {
      id: 2,
      title: '測試物品2',
      price: 200,
      distance: 3.1,
      favorited_at: '2025-01-14T09:00:00'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMyFavoriteItems', () => {
    it('should fetch favorite items with default options', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: mockFavoriteItems, 
        error: null 
      })

      const result = await getMyFavoriteItems()

      expect(result).toEqual(mockFavoriteItems)
      expect(supabase.rpc).toHaveBeenCalledWith('get_my_favorite_items', {
        p_page: 1,
        p_size: 20,
        p_sort_by: 'favorited_at',
        p_sort_direction: 'desc'
      })
    })

    it('should fetch favorite items with custom options', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: mockFavoriteItems, 
        error: null 
      })

      const options = {
        page: 2,
        size: 10,
        sort_by: 'price',
        sort_direction: 'asc'
      }

      await getMyFavoriteItems(options)

      expect(supabase.rpc).toHaveBeenCalledWith('get_my_favorite_items', {
        p_page: 2,
        p_size: 10,
        p_sort_by: 'price',
        p_sort_direction: 'asc'
      })
    })

    it('should return null when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      const result = await getMyFavoriteItems()

      expect(result).toBeNull()
    })

    it('should throw error when RPC call fails', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'RPC 失敗' }
      })

      await expect(getMyFavoriteItems())
        .rejects.toThrow('RPC 失敗')
    })
  })

  describe('addFavoriteItem', () => {
    it('should add item to favorites successfully', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockResult = {
        success: true,
        message: '已加入收藏'
      }

      supabase.rpc.mockResolvedValueOnce({ 
        data: mockResult, 
        error: null 
      })

      const result = await addFavoriteItem(1)

      expect(result).toEqual(mockResult)
      expect(supabase.rpc).toHaveBeenCalledWith('add_favorite_item', {
        p_item_id: 1
      })
    })

    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      await expect(addFavoriteItem(1))
        .rejects.toThrow('使用者未登入，無法新增收藏')
    })

    it('should throw error when RPC call fails', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: '無法收藏自己的物品' }
      })

      await expect(addFavoriteItem(1))
        .rejects.toThrow('無法收藏自己的物品')
    })
  })

  describe('removeFavoriteItem', () => {
    it('should remove item from favorites successfully', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockMatch = vi.fn().mockResolvedValue({ 
        data: null, 
        error: null 
      })

      const mockDelete = vi.fn().mockReturnValue({
        match: mockMatch
      })

      supabase.from.mockReturnValue({ 
        delete: mockDelete
      })

      const result = await removeFavoriteItem(1)

      expect(result).toBe(true)
    })

    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      await expect(removeFavoriteItem(1))
        .rejects.toThrow('使用者未登入，無法取消收藏')
    })

    it('should throw error when delete operation fails', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockMatch = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: '刪除失敗' }
      })

      supabase.from.mockReturnValue({ 
        delete: vi.fn().mockReturnValue({
          match: mockMatch
        })
      })

      await expect(removeFavoriteItem(1))
        .rejects.toThrow('刪除失敗')
    })
  })
})
