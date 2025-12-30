import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchItems } from '@/api/get_searchItemsAPI'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe('get_searchItemsAPI', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockItems = [
    {
      item_id: 101,
      title: 'IKEA 檯燈',
      price: 500,
      approximate_location: {
        latitude: 25.033,
        longitude: 121.5654
      },
      distance: 2.5,
      created_at: '2025-01-15T10:00:00'
    },
    {
      item_id: 102,
      title: '書桌',
      price: 1000,
      approximate_location: {
        latitude: 25.05,
        longitude: 121.55
      },
      distance: 5.2,
      created_at: '2025-01-14T09:00:00'
    }
  ]

  const mockItemsWithParsedLocation = mockItems.map(item => ({
    ...item,
    latitude: item.approximate_location.latitude,
    longitude: item.approximate_location.longitude
  }))

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('searchItems', () => {
    it('should search items with default parameters when user is logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: mockItems, 
        error: null 
      })

      const result = await searchItems()

      expect(result).toHaveLength(2)
      expect(result[0].latitude).toBe(25.033)
      expect(result[0].longitude).toBe(121.5654)
      expect(supabase.rpc).toHaveBeenCalledWith('search_items_tudever', {
        p_user_latitude: null,
        p_user_longitude: null,
        p_distance_range_km: null,
        p_main_category_id: null,
        p_sub_category_id: null,
        p_keyword: null,
        p_user_id: null,
        p_page: 1,
        p_size: 20,
        p_sort_by: 'created_at',
        p_sort_direction: 'desc'
      })
    })

    it('should search items with custom filters', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: mockItems, 
        error: null 
      })

      const filters = {
        user_latitude: 25.03,
        user_longitude: 121.56,
        distance_range_km: 10,
        main_category_id: 1,
        sub_category_id: 2,
        keyword: '檯燈',
        page: 2,
        size: 10,
        sort_by: 'distance',
        sort_direction: 'asc'
      }

      const result = await searchItems(filters)

      expect(result).toEqual(mockItemsWithParsedLocation)
      expect(supabase.rpc).toHaveBeenCalledWith('search_items_tudever', {
        p_user_latitude: 25.03,
        p_user_longitude: 121.56,
        p_distance_range_km: 10,
        p_main_category_id: 1,
        p_sub_category_id: 2,
        p_keyword: '檯燈',
        p_user_id: null,
        p_page: 2,
        p_size: 10,
        p_sort_by: 'distance',
        p_sort_direction: 'asc'
      })
    })

    it('should search items by user_id', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: mockItems, 
        error: null 
      })

      const result = await searchItems({ user_id: 'seller-456' })

      expect(result).toEqual(mockItemsWithParsedLocation)
      expect(supabase.rpc).toHaveBeenCalledWith('search_items_tudever', 
        expect.objectContaining({
          p_user_id: 'seller-456'
        })
      )
    })

    it('should handle items without approximate_location', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const itemsWithoutLocation = [
        {
          item_id: 103,
          title: '測試物品',
          price: 100,
          approximate_location: null
        }
      ]

      supabase.rpc.mockResolvedValueOnce({ 
        data: itemsWithoutLocation, 
        error: null 
      })

      const result = await searchItems()

      expect(result).toHaveLength(1)
      expect(result[0].latitude).toBeNull()
      expect(result[0].longitude).toBeNull()
    })

    it('should work when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: mockItems, 
        error: null 
      })

      const result = await searchItems()

      expect(result).toEqual(mockItemsWithParsedLocation)
    })

    it('should throw error when RPC call fails', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: '請先設定您的主要地點' } 
      })

      await expect(searchItems()).rejects.toThrow('請先設定您的主要地點')
    })

    it('should return empty array when no items found', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      })

      const result = await searchItems()

      expect(result).toEqual([])
    })
  })
})
