// src/stores/favorites.test.js
// Sprint 3: Favorites Store 完整測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFavoritesStore } from './favorites'
import { setupTestPinia, createMockFavoriteItem } from '@/test/helpers'

// ============================================================================
// Mock Favorite API
// ============================================================================
vi.mock('@/api/favoriteAPI.js', () => ({
  getMyFavoriteItems: vi.fn(),
  addFavoriteItem: vi.fn(),
  removeFavoriteItem: vi.fn(),
}))

describe('Favorites Store', () => {
  let favoritesStore

  beforeEach(() => {
    vi.clearAllMocks()
    setupTestPinia()
    favoritesStore = useFavoritesStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // 初始狀態測試
  // ==========================================================================
  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(favoritesStore.favoriteItems).toEqual([])
    })
  })

  // ==========================================================================
  // Getters 測試
  // ==========================================================================
  describe('計算屬性 (Getters)', () => {
    describe('count', () => {
      it('空列表時應返回 0', () => {
        expect(favoritesStore.count).toBe(0)
      })

      it('有收藏時應返回正確數量', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
          createMockFavoriteItem({ item_id: 3 }),
        ]
        expect(favoritesStore.count).toBe(3)
      })
    })
  })

  // ==========================================================================
  // Actions 測試
  // ==========================================================================
  describe('Actions', () => {
    describe('loadFavorites', () => {
      it('應正確載入收藏列表', async () => {
        const { getMyFavoriteItems } = await import('@/api/favoriteAPI.js')
        const mockItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
        ]
        getMyFavoriteItems.mockResolvedValue(mockItems)

        await favoritesStore.loadFavorites()

        expect(getMyFavoriteItems).toHaveBeenCalled()
        expect(favoritesStore.favoriteItems).toEqual(mockItems)
      })

      it('API 返回 null 時應設為空陣列', async () => {
        const { getMyFavoriteItems } = await import('@/api/favoriteAPI.js')
        getMyFavoriteItems.mockResolvedValue(null)

        await favoritesStore.loadFavorites()

        expect(favoritesStore.favoriteItems).toEqual([])
      })

      it('應支援傳遞選項參數', async () => {
        const { getMyFavoriteItems } = await import('@/api/favoriteAPI.js')
        getMyFavoriteItems.mockResolvedValue([])

        await favoritesStore.loadFavorites({ limit: 10, offset: 0 })

        expect(getMyFavoriteItems).toHaveBeenCalledWith({ limit: 10, offset: 0 })
      })
    })

    describe('addFavorite', () => {
      it('應新增收藏項目', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')
        addFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1, favorites_count: 5 })

        await favoritesStore.addFavorite(item)

        expect(addFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(1)
        expect(favoritesStore.favoriteItems[0].favorites_count).toBe(6)
        expect(favoritesStore.favoriteItems[0].favorited_at).toBeDefined()
      })

      it('已收藏的項目不應重複新增', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')

        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.addFavorite(item)

        expect(addFavoriteItem).not.toHaveBeenCalled()
        expect(favoritesStore.favoriteItems).toHaveLength(1)
      })

      it('API 失敗時應記錄錯誤', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')
        addFavoriteItem.mockRejectedValue(new Error('新增失敗'))

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const item = createMockFavoriteItem({ item_id: 1, favorites_count: 5 })

        await favoritesStore.addFavorite(item)

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('removeFavorite', () => {
      it('應移除收藏項目', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')
        removeFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.removeFavorite(item)

        expect(removeFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(0)
      })

      it('未收藏的項目不應呼叫 API', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')

        const item = createMockFavoriteItem({ item_id: 999 })

        await favoritesStore.removeFavorite(item)

        expect(removeFavoriteItem).not.toHaveBeenCalled()
      })

      it('API 失敗時應記錄錯誤', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')
        removeFavoriteItem.mockRejectedValue(new Error('移除失敗'))

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.removeFavorite(item)

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('toggleFavorite', () => {
      it('未收藏時應新增收藏', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')
        addFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1, favorites_count: 5 })

        await favoritesStore.toggleFavorite(item)

        expect(addFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(1)
      })

      it('已收藏時應移除收藏', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')
        removeFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.toggleFavorite(item)

        expect(removeFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(0)
      })
    })

    describe('isFavorite', () => {
      it('收藏列表中有該項目時應返回 true', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
        ]

        expect(favoritesStore.isFavorite(1)).toBe(true)
        expect(favoritesStore.isFavorite(2)).toBe(true)
      })

      it('收藏列表中無該項目時應返回 false', () => {
        favoritesStore.favoriteItems = [createMockFavoriteItem({ item_id: 1 })]

        expect(favoritesStore.isFavorite(999)).toBe(false)
      })

      it('應正確處理字串 ID 的比較', () => {
        favoritesStore.favoriteItems = [createMockFavoriteItem({ item_id: 1 })]

        expect(favoritesStore.isFavorite('1')).toBe(true)
        expect(favoritesStore.isFavorite(1)).toBe(true)
      })
    })

    describe('clearCache', () => {
      it('應清空收藏列表', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
        ]

        favoritesStore.clearCache()

        expect(favoritesStore.favoriteItems).toEqual([])
      })
    })
  })
})
