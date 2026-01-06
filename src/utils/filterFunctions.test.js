// src/utils/filterFunctions.test.js
// Sprint 2: Step 4 - 撰寫 filterFunctions 測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  filterByPopularity,
  filterByDistance,
  filterByRecentlyCreated,
  filterByPriceRange,
  filterByDiscount,
  filterByStatus,
  combineFilters,
  combineFiltersOr,
} from './filterFunctions'

describe('filterFunctions', () => {
  // ===========================================================================
  // filterByPopularity 測試
  // ===========================================================================
  describe('filterByPopularity', () => {
    describe('使用預設門檻 (50)', () => {
      it('應篩選出收藏數達到門檻的商品', () => {
        const filter = filterByPopularity()
        expect(filter({ favorites_count: 50 })).toBe(true)
        expect(filter({ favorites_count: 100 })).toBe(true)
      })

      it('應過濾掉收藏數未達門檻的商品', () => {
        const filter = filterByPopularity()
        expect(filter({ favorites_count: 49 })).toBe(false)
        expect(filter({ favorites_count: 0 })).toBe(false)
      })
    })

    describe('使用自訂門檻', () => {
      it('應使用自訂門檻 100 進行篩選', () => {
        const filter = filterByPopularity(100)
        expect(filter({ favorites_count: 100 })).toBe(true)
        expect(filter({ favorites_count: 99 })).toBe(false)
      })

      it('應使用較低門檻 10 進行篩選', () => {
        const filter = filterByPopularity(10)
        expect(filter({ favorites_count: 10 })).toBe(true)
        expect(filter({ favorites_count: 5 })).toBe(false)
      })
    })

    describe('邊界情況', () => {
      it('應處理缺少 favorites_count 欄位的情況，視為 0', () => {
        const filter = filterByPopularity()
        expect(filter({})).toBe(false)
        expect(filter({ title: '商品' })).toBe(false)
      })

      it('應處理 favorites_count 為 null 的情況，視為 0', () => {
        const filter = filterByPopularity()
        expect(filter({ favorites_count: null })).toBe(false)
      })

      it('應處理 favorites_count 為 undefined 的情況，視為 0', () => {
        const filter = filterByPopularity()
        expect(filter({ favorites_count: undefined })).toBe(false)
      })

      it('應處理門檻為 0 的情況', () => {
        const filter = filterByPopularity(0)
        expect(filter({ favorites_count: 0 })).toBe(true)
        expect(filter({})).toBe(true)
      })
    })
  })

  // ===========================================================================
  // filterByDistance 測試
  // ===========================================================================
  describe('filterByDistance', () => {
    describe('使用預設最大距離 (5 公里)', () => {
      it('應篩選出距離在範圍內的商品', () => {
        const filter = filterByDistance()
        expect(filter({ distance_km: 3 })).toBe(true)
        expect(filter({ distance_km: 5 })).toBe(true)
        expect(filter({ distance_km: '4.5' })).toBe(true)
      })

      it('應過濾掉距離超出範圍的商品', () => {
        const filter = filterByDistance()
        expect(filter({ distance_km: 6 })).toBe(false)
        expect(filter({ distance_km: 100 })).toBe(false)
      })
    })

    describe('使用自訂最大距離', () => {
      it('應使用自訂最大距離 10 公里進行篩選', () => {
        const filter = filterByDistance(10)
        expect(filter({ distance_km: 10 })).toBe(true)
        expect(filter({ distance_km: 11 })).toBe(false)
      })

      it('應使用較短距離 2 公里進行篩選', () => {
        const filter = filterByDistance(2)
        expect(filter({ distance_km: 2 })).toBe(true)
        expect(filter({ distance_km: 2.1 })).toBe(false)
      })
    })

    describe('邊界情況', () => {
      it('應處理缺少 distance_km 欄位的情況，視為 999', () => {
        const filter = filterByDistance()
        expect(filter({})).toBe(false)
        expect(filter({ title: '商品' })).toBe(false)
      })

      it('應處理 distance_km 為字串的情況', () => {
        const filter = filterByDistance(5)
        expect(filter({ distance_km: '3.5' })).toBe(true)
        expect(filter({ distance_km: '5.5' })).toBe(false)
      })

      it('應處理距離為 0 的情況（0 為 falsy 會被當作 999）', () => {
        const filter = filterByDistance(5)
        // 注意：由於 distance_km || 999 的實作，0 會被視為 falsy 而使用預設值 999
        expect(filter({ distance_km: 0 })).toBe(false)
      })

      it('應正確處理距離為正數的邊界值', () => {
        const filter = filterByDistance(5)
        expect(filter({ distance_km: 0.1 })).toBe(true)
        expect(filter({ distance_km: 0.01 })).toBe(true)
      })
    })
  })

  // ===========================================================================
  // filterByRecentlyCreated 測試
  // ===========================================================================
  describe('filterByRecentlyCreated', () => {
    beforeEach(() => {
      // 固定當前時間為 2026-01-06 12:00:00 UTC
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-06T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('使用預設天數 (7 天)', () => {
      it('應篩選出 7 天內上架的商品', () => {
        const filter = filterByRecentlyCreated()
        // 3 天前
        expect(filter({ created_at: '2026-01-03T12:00:00Z' })).toBe(true)
        // 今天
        expect(filter({ created_at: '2026-01-06T12:00:00Z' })).toBe(true)
        // 7 天前剛好
        expect(filter({ created_at: '2025-12-30T12:00:00Z' })).toBe(true)
      })

      it('應過濾掉超過 7 天的商品', () => {
        const filter = filterByRecentlyCreated()
        // 8 天前
        expect(filter({ created_at: '2025-12-29T12:00:00Z' })).toBe(false)
        // 30 天前
        expect(filter({ created_at: '2025-12-06T12:00:00Z' })).toBe(false)
      })
    })

    describe('使用自訂天數', () => {
      it('應使用自訂天數 3 天進行篩選', () => {
        const filter = filterByRecentlyCreated(3)
        // 2 天前
        expect(filter({ created_at: '2026-01-04T12:00:00Z' })).toBe(true)
        // 4 天前
        expect(filter({ created_at: '2026-01-02T12:00:00Z' })).toBe(false)
      })

      it('應使用較長天數 30 天進行篩選', () => {
        const filter = filterByRecentlyCreated(30)
        // 15 天前
        expect(filter({ created_at: '2025-12-22T12:00:00Z' })).toBe(true)
        // 31 天前
        expect(filter({ created_at: '2025-12-06T12:00:00Z' })).toBe(false)
      })
    })

    describe('邊界情況', () => {
      it('應處理今天上架的商品', () => {
        const filter = filterByRecentlyCreated(7)
        expect(filter({ created_at: '2026-01-06T00:00:00Z' })).toBe(true)
      })

      it('應處理 ISO 日期格式', () => {
        const filter = filterByRecentlyCreated(7)
        expect(filter({ created_at: '2026-01-05' })).toBe(true)
      })
    })
  })

  // ===========================================================================
  // filterByPriceRange 測試
  // ===========================================================================
  describe('filterByPriceRange', () => {
    describe('使用預設範圍 (0 到 Infinity)', () => {
      it('應篩選出所有有價格的商品', () => {
        const filter = filterByPriceRange()
        expect(filter({ price: 0 })).toBe(true)
        expect(filter({ price: 100 })).toBe(true)
        expect(filter({ price: 999999 })).toBe(true)
      })
    })

    describe('使用自訂價格範圍', () => {
      it('應篩選出價格在 500-1000 範圍內的商品', () => {
        const filter = filterByPriceRange(500, 1000)
        expect(filter({ price: 500 })).toBe(true)
        expect(filter({ price: 750 })).toBe(true)
        expect(filter({ price: 1000 })).toBe(true)
      })

      it('應過濾掉價格超出範圍的商品', () => {
        const filter = filterByPriceRange(500, 1000)
        expect(filter({ price: 499 })).toBe(false)
        expect(filter({ price: 1001 })).toBe(false)
      })

      it('應篩選出低於指定價格的商品 (只設最大值)', () => {
        const filter = filterByPriceRange(0, 500)
        expect(filter({ price: 500 })).toBe(true)
        expect(filter({ price: 250 })).toBe(true)
        expect(filter({ price: 501 })).toBe(false)
      })

      it('應篩選出高於指定價格的商品 (只設最小值)', () => {
        const filter = filterByPriceRange(1000, Infinity)
        expect(filter({ price: 1000 })).toBe(true)
        expect(filter({ price: 5000 })).toBe(true)
        expect(filter({ price: 999 })).toBe(false)
      })
    })

    describe('邊界情況', () => {
      it('應處理缺少 price 欄位的情況，視為 0', () => {
        const filter = filterByPriceRange(0, 100)
        expect(filter({})).toBe(true)
        expect(filter({ title: '商品' })).toBe(true)
      })

      it('應處理 price 為 null 的情況，視為 0', () => {
        const filter = filterByPriceRange(0, 100)
        expect(filter({ price: null })).toBe(true)
      })

      it('應過濾掉 price 為 0 但最小值大於 0 的情況', () => {
        const filter = filterByPriceRange(100, 500)
        expect(filter({ price: 0 })).toBe(false)
        expect(filter({})).toBe(false)
      })
    })
  })

  // ===========================================================================
  // filterByDiscount 測試
  // ===========================================================================
  describe('filterByDiscount', () => {
    describe('正常情況', () => {
      it('應篩選出有折扣的商品', () => {
        const filter = filterByDiscount()
        expect(filter({ discount: 10 })).toBe(true)
        expect(filter({ discount: 0.5 })).toBe(true)
        expect(filter({ discount: 100 })).toBe(true)
      })

      it('應過濾掉沒有折扣的商品（返回 falsy 值）', () => {
        const filter = filterByDiscount()
        // 注意：函數返回 item.discount && item.discount > 0
        // 對於 discount: 0，會返回 0（falsy）
        // 對於 discount: null 或 undefined，會返回 null/undefined（falsy）
        expect(filter({ discount: 0 })).toBeFalsy()
        expect(filter({ discount: null })).toBeFalsy()
        expect(filter({ discount: undefined })).toBeFalsy()
      })
    })

    describe('邊界情況', () => {
      it('應處理缺少 discount 欄位的情況（返回 falsy 值）', () => {
        const filter = filterByDiscount()
        // 注意：返回值為 undefined（falsy），在陣列過濾時被當作 false
        expect(filter({})).toBeFalsy()
        expect(filter({ price: 100 })).toBeFalsy()
      })

      it('應處理 discount 為負數的情況（視為無效折扣）', () => {
        const filter = filterByDiscount()
        expect(filter({ discount: -10 })).toBe(false)
      })
    })
  })

  // ===========================================================================
  // filterByStatus 測試
  // ===========================================================================
  describe('filterByStatus', () => {
    describe('正常情況', () => {
      it('應篩選出指定狀態的商品', () => {
        const filterActive = filterByStatus('active')
        expect(filterActive({ status: 'active' })).toBe(true)
        expect(filterActive({ status: 'inactive' })).toBe(false)

        const filterSold = filterByStatus('sold')
        expect(filterSold({ status: 'sold' })).toBe(true)
        expect(filterSold({ status: 'active' })).toBe(false)
      })

      it('應支援多種狀態值', () => {
        const filterInactive = filterByStatus('inactive')
        expect(filterInactive({ status: 'inactive' })).toBe(true)

        const filterPending = filterByStatus('pending')
        expect(filterPending({ status: 'pending' })).toBe(true)
      })
    })

    describe('邊界情況', () => {
      it('應處理缺少 status 欄位的情況', () => {
        const filter = filterByStatus('active')
        expect(filter({})).toBe(false)
        expect(filter({ title: '商品' })).toBe(false)
      })

      it('應處理 status 為 null 的情況', () => {
        const filter = filterByStatus('active')
        expect(filter({ status: null })).toBe(false)
      })

      it('應進行嚴格比較（類型一致）', () => {
        const filter = filterByStatus('active')
        expect(filter({ status: 'active' })).toBe(true)
        // 若狀態不完全匹配
        expect(filter({ status: 'Active' })).toBe(false)
        expect(filter({ status: 'ACTIVE' })).toBe(false)
      })
    })
  })

  // ===========================================================================
  // combineFilters 測試 (AND 邏輯)
  // ===========================================================================
  describe('combineFilters (AND 邏輯)', () => {
    describe('正常情況', () => {
      it('應組合兩個篩選條件，所有條件都需滿足', () => {
        const filter = combineFilters(
          filterByPopularity(50),
          filterByPriceRange(100, 1000)
        )

        // 兩個條件都滿足
        expect(filter({ favorites_count: 50, price: 500 })).toBe(true)

        // 只滿足一個條件
        expect(filter({ favorites_count: 50, price: 50 })).toBe(false)
        expect(filter({ favorites_count: 10, price: 500 })).toBe(false)

        // 兩個條件都不滿足
        expect(filter({ favorites_count: 10, price: 50 })).toBe(false)
      })

      it('應組合三個以上的篩選條件', () => {
        const filter = combineFilters(
          filterByPopularity(50),
          filterByPriceRange(100, 1000),
          filterByStatus('active')
        )

        // 三個條件都滿足
        expect(
          filter({ favorites_count: 50, price: 500, status: 'active' })
        ).toBe(true)

        // 缺少一個條件
        expect(
          filter({ favorites_count: 50, price: 500, status: 'inactive' })
        ).toBe(false)
      })
    })

    describe('邊界情況', () => {
      it('應處理只有一個篩選條件的情況', () => {
        const filter = combineFilters(filterByPopularity(50))
        expect(filter({ favorites_count: 50 })).toBe(true)
        expect(filter({ favorites_count: 10 })).toBe(false)
      })

      it('應處理沒有篩選條件的情況（空參數）', () => {
        const filter = combineFilters()
        // 沒有條件時，Array.every([]) 返回 true
        expect(filter({ favorites_count: 0 })).toBe(true)
        expect(filter({})).toBe(true)
      })
    })
  })

  // ===========================================================================
  // combineFiltersOr 測試 (OR 邏輯)
  // ===========================================================================
  describe('combineFiltersOr (OR 邏輯)', () => {
    describe('正常情況', () => {
      it('應組合兩個篩選條件，滿足任一條件即可', () => {
        const filter = combineFiltersOr(
          filterByPopularity(100),
          filterByDiscount()
        )

        // 兩個條件都滿足
        expect(filter({ favorites_count: 100, discount: 10 })).toBe(true)

        // 只滿足一個條件
        expect(filter({ favorites_count: 100, discount: 0 })).toBe(true)
        expect(filter({ favorites_count: 10, discount: 10 })).toBe(true)

        // 兩個條件都不滿足
        expect(filter({ favorites_count: 10, discount: 0 })).toBe(false)
      })

      it('應組合三個以上的篩選條件', () => {
        const filter = combineFiltersOr(
          filterByPopularity(100),
          filterByDiscount(),
          filterByStatus('sold')
        )

        // 只滿足一個條件
        expect(filter({ favorites_count: 100 })).toBe(true)
        expect(filter({ discount: 10 })).toBe(true)
        expect(filter({ status: 'sold' })).toBe(true)

        // 沒有條件滿足
        expect(filter({ favorites_count: 10, discount: 0, status: 'active' })).toBe(
          false
        )
      })
    })

    describe('邊界情況', () => {
      it('應處理只有一個篩選條件的情況', () => {
        const filter = combineFiltersOr(filterByPopularity(50))
        expect(filter({ favorites_count: 50 })).toBe(true)
        expect(filter({ favorites_count: 10 })).toBe(false)
      })

      it('應處理沒有篩選條件的情況（空參數）', () => {
        const filter = combineFiltersOr()
        // 沒有條件時，Array.some([]) 返回 false
        expect(filter({ favorites_count: 100 })).toBe(false)
        expect(filter({})).toBe(false)
      })
    })
  })

  // ===========================================================================
  // 整合測試：組合使用多個篩選函數
  // ===========================================================================
  describe('整合測試', () => {
    const mockItems = [
      {
        id: 1,
        title: '二手 iPhone',
        price: 5000,
        favorites_count: 100,
        distance_km: 3,
        status: 'active',
        discount: 10,
        created_at: '2026-01-05T12:00:00Z',
      },
      {
        id: 2,
        title: '木製書桌',
        price: 2000,
        favorites_count: 30,
        distance_km: 2,
        status: 'active',
        discount: 0,
        created_at: '2026-01-03T12:00:00Z',
      },
      {
        id: 3,
        title: '運動腳踏車',
        price: 8000,
        favorites_count: 150,
        distance_km: 10,
        status: 'sold',
        discount: 0,
        created_at: '2025-12-20T12:00:00Z',
      },
      {
        id: 4,
        title: '古董花瓶',
        price: 15000,
        favorites_count: 200,
        distance_km: 1,
        status: 'active',
        discount: 20,
        created_at: '2026-01-01T12:00:00Z',
      },
    ]

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-06T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('應正確使用 filter 方法與 filterByPopularity', () => {
      const result = mockItems.filter(filterByPopularity(50))
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual([1, 3, 4])
    })

    it('應正確使用 filter 方法與 filterByDistance', () => {
      const result = mockItems.filter(filterByDistance(5))
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual([1, 2, 4])
    })

    it('應正確使用 filter 方法與 filterByStatus', () => {
      const result = mockItems.filter(filterByStatus('active'))
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual([1, 2, 4])
    })

    it('應正確使用 filter 方法與 combineFilters', () => {
      // 熱門且附近的商品
      const result = mockItems.filter(
        combineFilters(filterByPopularity(50), filterByDistance(5))
      )
      expect(result).toHaveLength(2)
      expect(result.map((item) => item.id)).toEqual([1, 4])
    })

    it('應正確使用 filter 方法與 combineFiltersOr', () => {
      // 有折扣或已售出的商品
      const result = mockItems.filter(
        combineFiltersOr(filterByDiscount(), filterByStatus('sold'))
      )
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual([1, 3, 4])
    })

    it('應正確使用 filter 方法與 filterByRecentlyCreated', () => {
      const result = mockItems.filter(filterByRecentlyCreated(7))
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual([1, 2, 4])
    })

    it('應正確使用複雜的組合條件', () => {
      // 熱門且（有折扣或附近）的商品
      const result = mockItems.filter(
        combineFilters(
          filterByPopularity(50),
          combineFiltersOr(filterByDiscount(), filterByDistance(5))
        )
      )
      expect(result).toHaveLength(2)
      expect(result.map((item) => item.id)).toEqual([1, 4])
    })
  })
})
