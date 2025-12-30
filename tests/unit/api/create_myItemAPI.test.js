import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createItem } from '@/api/create_myItemAPI'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}))

// Mock image API
vi.mock('@/api/image', () => ({
  uploadItemImages: vi.fn()
}))

describe('create_myItemAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createItem', () => {
    it('should create item successfully with all required fields', async () => {
      // Arrange
      const mockItemData = {
        sub_category_id: 1,
        title: '測試商品',
        description: '測試描述',
        condition: '良好',
        price: 100
      }

      const mockResponse = {
        item_id: 123,
        title: '測試商品',
        status: 'available'
      }

      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      // Act
      const result = await createItem(mockItemData)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('create_item', {
        p_sub_category_id: 1,
        p_title: '測試商品',
        p_description: '測試描述',
        p_condition: '良好',
        p_price: 100,
        p_use_primary_location: true,
        p_carbon_value: undefined,
        p_image_urls: undefined,
        p_tags: undefined
      })
      expect(result).toEqual(mockResponse)
    })

    it('should create item with optional fields', async () => {
      // Arrange
      const mockItemData = {
        sub_category_id: 2,
        title: '商品標題',
        description: '商品描述',
        condition: '全新',
        price: 200,
        use_primary_location: false,
        carbon_value: 50,
        image_urls: ['url1.jpg', 'url2.jpg'],
        tags: ['電子產品', '3C']
      }

      const mockResponse = { item_id: 456 }
      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      // Act
      const result = await createItem(mockItemData)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('create_item', expect.objectContaining({
        p_use_primary_location: false,
        p_carbon_value: 50,
        p_image_urls: ['url1.jpg', 'url2.jpg'],
        p_tags: ['電子產品', '3C']
      }))
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when RPC fails', async () => {
      // Arrange
      const mockError = { message: '請先在個人資料中設定主要地點後再刊登物品' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      const mockItemData = {
        sub_category_id: 1,
        title: '測試',
        description: '描述',
        condition: '良好',
        price: 100
      }

      // Act & Assert
      await expect(createItem(mockItemData))
        .rejects.toThrow('請先在個人資料中設定主要地點後再刊登物品')
    })

    it('should default use_primary_location to true when not provided', async () => {
      // Arrange
      const mockItemData = {
        sub_category_id: 1,
        title: '測試',
        description: '描述',
        condition: '良好',
        price: 100
        // use_primary_location not provided
      }

      supabase.rpc.mockResolvedValueOnce({ data: { item_id: 789 }, error: null })

      // Act
      await createItem(mockItemData)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('create_item', expect.objectContaining({
        p_use_primary_location: true
      }))
    })
  })
})
