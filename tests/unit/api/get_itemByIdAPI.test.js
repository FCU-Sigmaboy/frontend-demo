import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getItemById } from '@/api/get_itemByIdAPI'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe('get_itemByIdAPI', () => {
  const mockItem = {
    id: 1,
    user_id: 'mock-user-id',
    sub_category_id: 1,
    title: '測試物品',
    description: '這是一個測試物品',
    condition: 'like_new',
    listing_status: true,
    price: 100,
    use_primary_location: true,
    image_urls: ['https://example.com/image.jpg'],
    tags: ['測試'],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getItemById', () => {
    it('should fetch item successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: mockItem, 
            error: null 
          })
        })
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      const result = await getItemById(1)

      expect(result).toEqual(mockItem)
      expect(supabase.from).toHaveBeenCalledWith('items')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id'))
    })

    it('should return null when item not found (PGRST116)', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116', message: 'Item not found' }
          })
        })
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      const result = await getItemById(999)

      expect(result).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('items')
    })

    it('should throw error when database error occurs', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST000', message: '資料庫錯誤' }
          })
        })
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      await expect(getItemById(1))
        .rejects.toThrow('資料庫錯誤')
    })

    it('should throw error when exception occurs', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('網路錯誤'))
        })
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      await expect(getItemById(1))
        .rejects.toThrow('網路錯誤')
    })
  })
})
