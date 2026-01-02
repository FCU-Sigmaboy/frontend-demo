import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAllCategories } from '@/api/get_categoriesAPI'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe.sequential('get_categoriesAPI', () => {
  const mockCategories = [
    {
      id: 1,
      name: '電子產品',
      icon: 'electronics',
      color: '#3498db',
      sub_categories: [
        {
          id: 1,
          name: '手機',
          default_carbon_value: '5.20'
        },
        {
          id: 2,
          name: '筆記型電腦',
          default_carbon_value: '8.50'
        }
      ]
    },
    {
      id: 2,
      name: '居家生活',
      icon: 'home',
      color: '#2ecc71',
      sub_categories: [
        {
          id: 3,
          name: '家具',
          default_carbon_value: '15.00'
        }
      ]
    },
    {
      id: 3,
      name: '書籍文具',
      icon: 'book',
      color: '#e74c3c',
      sub_categories: []
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllCategories', () => {
    it('should fetch all categories with sub_categories successfully', async () => {
      const mockOrder = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ 
          data: mockCategories, 
          error: null 
        })
      })

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAllCategories()

      expect(result).toEqual(mockCategories)
      expect(supabase.from).toHaveBeenCalledWith('main_categories')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('sub_categories'))
    })

    it('should return empty array when no categories exist', async () => {
      const mockOrder = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        })
      })

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAllCategories()

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should throw error when database query fails', async () => {
      const mockOrder = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: '資料庫連接失敗' }
        })
      })

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      await expect(getAllCategories())
        .rejects.toThrow('資料庫連接失敗')
    })

    it('should handle categories with empty sub_categories array', async () => {
      const categoriesWithEmpty = [
        {
          id: 1,
          name: '測試分類',
          icon: 'test',
          color: '#000000',
          sub_categories: []
        }
      ]

      const mockOrder = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ 
          data: categoriesWithEmpty, 
          error: null 
        })
      })

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder
      })

      supabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAllCategories()

      expect(result[0].sub_categories).toEqual([])
    })
  })
})
