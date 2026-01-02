import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createItem, createItemWithImages } from '@/api/create_myItemAPI'
import { uploadItemImages } from '@/api/image'

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

describe.sequential('create_myItemAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.rpc.mockReset()
    supabase.auth.getUser.mockReset()
    uploadItemImages.mockReset()
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

    it('should handle different condition values', async () => {
      const conditions = ['全新', '近全新', '良好', '普通', '需修理']
      
      for (const condition of conditions) {
        const mockItemData = {
          sub_category_id: 1,
          title: '測試',
          description: '描述',
          condition: condition,
          price: 100
        }
        
        supabase.rpc.mockResolvedValueOnce({ data: { item_id: 1 }, error: null })
        
        const result = await createItem(mockItemData)
        
        expect(result).toEqual({ item_id: 1 })
        expect(supabase.rpc).toHaveBeenCalledWith('create_item', expect.objectContaining({
          p_condition: condition
        }))
      }
    })

    it('should handle error when sub_category does not exist', async () => {
      const mockError = { message: '子分類不存在' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      const mockItemData = {
        sub_category_id: 9999,
        title: '測試',
        description: '描述',
        condition: '良好',
        price: 100
      }

      await expect(createItem(mockItemData))
        .rejects.toThrow('子分類不存在')
    })

    it('should handle error for secondary location', async () => {
      const mockError = { message: '請先在個人資料中設定次要地點後再刊登物品' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      const mockItemData = {
        sub_category_id: 1,
        title: '測試',
        description: '描述',
        condition: '良好',
        price: 100,
        use_primary_location: false
      }

      await expect(createItem(mockItemData))
        .rejects.toThrow('請先在個人資料中設定次要地點後再刊登物品')
    })
  })

  describe('createItemWithImages', () => {
    const mockUser = { id: 'user-123' }

    it('should skip compression when filesAlreadyCompressed is true', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      const mockItemData = {
        sub_category_id: 1,
        title: '測試商品',
        description: '測試描述',
        condition: '良好',
        price: 100
      }

      const mockImageFiles = [new File([''], 'compressed.jpg')]
      const mockImageUrls = ['https://storage.url/compressed.jpg']

      uploadItemImages.mockResolvedValueOnce(mockImageUrls)
      supabase.rpc.mockResolvedValueOnce({ data: { item_id: 123 }, error: null })

      await createItemWithImages(mockItemData, mockImageFiles, true)

      expect(uploadItemImages).toHaveBeenCalledWith(
        mockImageFiles,
        mockUser.id,
        expect.stringMatching(/^temp-\d+$/),
        false // shouldCompress = false
      )
    })

    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

      const mockItemData = {
        sub_category_id: 1,
        title: '測試',
        description: '描述',
        condition: '良好',
        price: 100
      }

      await expect(createItemWithImages(mockItemData, []))
        .rejects.toThrow('使用者未登入')
    })

    it('should pass all optional fields to createItem', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      const mockItemData = {
        sub_category_id: 1,
        title: '測試',
        description: '描述',
        condition: '全新',
        price: 200,
        use_primary_location: false,
        carbon_value: 75,
        tags: ['測試', '範例']
      }

      const mockImageFiles = [new File([''], 'image.jpg')]
      const mockImageUrls = ['https://storage.url/image.jpg']

      uploadItemImages.mockResolvedValueOnce(mockImageUrls)
      supabase.rpc.mockResolvedValueOnce({ data: { item_id: 999 }, error: null })

      await createItemWithImages(mockItemData, mockImageFiles)

      expect(supabase.rpc).toHaveBeenCalledWith('create_item', {
        p_sub_category_id: 1,
        p_title: '測試',
        p_description: '描述',
        p_condition: '全新',
        p_price: 200,
        p_use_primary_location: false,
        p_carbon_value: 75,
        p_image_urls: mockImageUrls,
        p_tags: ['測試', '範例']
      })
    })
  })
})
