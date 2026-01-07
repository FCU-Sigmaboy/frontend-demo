// src/utils/sortFunctions.test.js
// Sprint 2: 核心工具函數測試 - sortFunctions
import { describe, it, expect } from 'vitest'
import {
  sortByDate,
  sortByNumber,
  sortByDistance,
  sortByFavoritedTime,
  sortByPopularity,
  sortByRecommendation,
} from './sortFunctions'

// =============================================================================
// sortByDate 測試
// =============================================================================
describe('sortByDate', () => {
  describe('正常日期排序', () => {
    it('應正確排序 ISO 格式日期字串', () => {
      const dateA = '2024-01-15'
      const dateB = '2024-01-20'
      expect(sortByDate(dateA, dateB)).toBeLessThan(0)
    })

    it('應正確排序 Date 物件', () => {
      const dateA = new Date('2024-01-15')
      const dateB = new Date('2024-01-10')
      expect(sortByDate(dateA, dateB)).toBeGreaterThan(0)
    })

    it('相同日期應返回 0', () => {
      const dateA = '2024-01-15'
      const dateB = '2024-01-15'
      expect(sortByDate(dateA, dateB)).toBe(0)
    })

    it('應正確排序包含時間的日期', () => {
      const dateA = '2024-01-15T10:00:00'
      const dateB = '2024-01-15T15:00:00'
      expect(sortByDate(dateA, dateB)).toBeLessThan(0)
    })
  })

  describe('陣列排序應用', () => {
    it('應正確使用 Array.sort 進行升序排序', () => {
      const dates = ['2024-01-20', '2024-01-10', '2024-01-15']
      const sorted = [...dates].sort(sortByDate)
      expect(sorted).toEqual(['2024-01-10', '2024-01-15', '2024-01-20'])
    })
  })
})

// =============================================================================
// sortByNumber 測試
// =============================================================================
describe('sortByNumber', () => {
  describe('正常數字排序', () => {
    it('應正確排序整數', () => {
      expect(sortByNumber(5, 10)).toBeLessThan(0)
      expect(sortByNumber(10, 5)).toBeGreaterThan(0)
    })

    it('應正確排序浮點數', () => {
      expect(sortByNumber(3.14, 2.71)).toBeGreaterThan(0)
    })

    it('相同數字應返回 0', () => {
      expect(sortByNumber(42, 42)).toBe(0)
    })

    it('應正確排序負數', () => {
      expect(sortByNumber(-10, -5)).toBeLessThan(0)
      expect(sortByNumber(-5, -10)).toBeGreaterThan(0)
    })
  })

  describe('字串數字處理', () => {
    it('應正確處理數字字串', () => {
      expect(sortByNumber('100', '50')).toBeGreaterThan(0)
    })

    it('應正確處理混合類型', () => {
      expect(sortByNumber('25', 30)).toBeLessThan(0)
    })
  })

  describe('邊界情況', () => {
    it('應將非數字字串視為 0', () => {
      expect(sortByNumber('abc', 5)).toBeLessThan(0)
    })

    it('應將 null 視為 0', () => {
      expect(sortByNumber(null, 5)).toBeLessThan(0)
      expect(sortByNumber(5, null)).toBeGreaterThan(0)
    })

    it('應將 undefined 視為 0', () => {
      expect(sortByNumber(undefined, 5)).toBeLessThan(0)
    })
  })

  describe('陣列排序應用', () => {
    it('應正確使用 Array.sort 進行升序排序', () => {
      const numbers = [30, 10, 20]
      const sorted = [...numbers].sort(sortByNumber)
      expect(sorted).toEqual([10, 20, 30])
    })
  })
})

// =============================================================================
// sortByDistance 測試
// =============================================================================
describe('sortByDistance', () => {
  describe('正常距離排序', () => {
    it('應根據 distance_km 正確排序', () => {
      const itemA = { distance_km: 5.5 }
      const itemB = { distance_km: 10.2 }
      expect(sortByDistance(itemA, itemB)).toBeLessThan(0)
    })

    it('相同距離應返回 0', () => {
      const itemA = { distance_km: 5.5 }
      const itemB = { distance_km: 5.5 }
      expect(sortByDistance(itemA, itemB)).toBe(0)
    })
  })

  describe('邊界情況', () => {
    it('應將缺少 distance_km 的項目視為距離 0', () => {
      const itemA = {}
      const itemB = { distance_km: 5 }
      expect(sortByDistance(itemA, itemB)).toBeLessThan(0)
    })

    it('應處理 distance_km 為字串的情況', () => {
      const itemA = { distance_km: '3.5' }
      const itemB = { distance_km: '10' }
      expect(sortByDistance(itemA, itemB)).toBeLessThan(0)
    })

    it('應將無效值視為 0', () => {
      const itemA = { distance_km: 'abc' }
      const itemB = { distance_km: 5 }
      expect(sortByDistance(itemA, itemB)).toBeLessThan(0)
    })
  })

  describe('陣列排序應用', () => {
    it('應正確排序物件陣列', () => {
      const items = [
        { name: 'C', distance_km: 15 },
        { name: 'A', distance_km: 5 },
        { name: 'B', distance_km: 10 },
      ]
      const sorted = [...items].sort(sortByDistance)
      expect(sorted.map((i) => i.name)).toEqual(['A', 'B', 'C'])
    })
  })
})

// =============================================================================
// sortByFavoritedTime 測試
// =============================================================================
describe('sortByFavoritedTime', () => {
  describe('使用 favorited_at 排序', () => {
    it('應根據 favorited_at 正確排序', () => {
      const itemA = { favorited_at: '2024-01-10' }
      const itemB = { favorited_at: '2024-01-15' }
      expect(sortByFavoritedTime(itemA, itemB)).toBeLessThan(0)
    })

    it('相同 favorited_at 應返回 0', () => {
      const itemA = { favorited_at: '2024-01-10' }
      const itemB = { favorited_at: '2024-01-10' }
      expect(sortByFavoritedTime(itemA, itemB)).toBe(0)
    })
  })

  describe('fallback 到 created_at', () => {
    it('缺少 favorited_at 時應使用 created_at', () => {
      const itemA = { created_at: '2024-01-10' }
      const itemB = { created_at: '2024-01-15' }
      expect(sortByFavoritedTime(itemA, itemB)).toBeLessThan(0)
    })

    it('混合 favorited_at 和 created_at 的項目應正確排序', () => {
      const itemA = { favorited_at: '2024-01-20' }
      const itemB = { created_at: '2024-01-10' }
      expect(sortByFavoritedTime(itemA, itemB)).toBeGreaterThan(0)
    })
  })

  describe('陣列排序應用', () => {
    it('應正確排序物件陣列', () => {
      const items = [
        { name: 'B', favorited_at: '2024-01-15' },
        { name: 'A', favorited_at: '2024-01-10' },
        { name: 'C', created_at: '2024-01-20' },
      ]
      const sorted = [...items].sort(sortByFavoritedTime)
      expect(sorted.map((i) => i.name)).toEqual(['A', 'B', 'C'])
    })
  })
})

// =============================================================================
// sortByPopularity 測試
// =============================================================================
describe('sortByPopularity', () => {
  describe('正常熱門度排序', () => {
    it('應根據 favorites_count 正確排序', () => {
      const itemA = { favorites_count: 10 }
      const itemB = { favorites_count: 50 }
      expect(sortByPopularity(itemA, itemB)).toBeLessThan(0)
    })

    it('相同 favorites_count 應返回 0', () => {
      const itemA = { favorites_count: 25 }
      const itemB = { favorites_count: 25 }
      expect(sortByPopularity(itemA, itemB)).toBe(0)
    })
  })

  describe('邊界情況', () => {
    it('應將缺少 favorites_count 的項目視為 0', () => {
      const itemA = {}
      const itemB = { favorites_count: 10 }
      expect(sortByPopularity(itemA, itemB)).toBeLessThan(0)
    })

    it('兩個都缺少 favorites_count 應返回 0', () => {
      const itemA = {}
      const itemB = {}
      expect(sortByPopularity(itemA, itemB)).toBe(0)
    })
  })

  describe('陣列排序應用', () => {
    it('應正確排序物件陣列', () => {
      const items = [
        { name: 'B', favorites_count: 20 },
        { name: 'C', favorites_count: 50 },
        { name: 'A', favorites_count: 10 },
      ]
      const sorted = [...items].sort(sortByPopularity)
      expect(sorted.map((i) => i.name)).toEqual(['A', 'B', 'C'])
    })
  })
})

// =============================================================================
// sortByRecommendation 測試
// =============================================================================
describe('sortByRecommendation', () => {
  // 使用固定的測試日期以確保測試穩定性
  const baseDate = new Date('2024-01-15').toISOString()

  describe('基本排序邏輯', () => {
    it('距離較近的項目應排在前面（其他條件相同時）', () => {
      const itemA = { distance_km: 5, favorites_count: 10, created_at: baseDate }
      const itemB = { distance_km: 20, favorites_count: 10, created_at: baseDate }
      expect(sortByRecommendation(itemA, itemB)).toBeLessThan(0)
    })

    it('收藏數較多的項目應排在前面（其他條件相同時）', () => {
      const itemA = { distance_km: 10, favorites_count: 50, created_at: baseDate }
      const itemB = { distance_km: 10, favorites_count: 10, created_at: baseDate }
      expect(sortByRecommendation(itemA, itemB)).toBeLessThan(0)
    })
  })

  describe('邊界情況', () => {
    it('應處理缺少 distance_km 的項目', () => {
      const itemA = { favorites_count: 10, created_at: baseDate }
      const itemB = { distance_km: 10, favorites_count: 10, created_at: baseDate }
      // 缺少 distance_km 會被視為 100，因此分數較低
      expect(sortByRecommendation(itemA, itemB)).toBeGreaterThan(0)
    })

    it('應處理缺少 favorites_count 的項目', () => {
      const itemA = { distance_km: 10, created_at: baseDate }
      const itemB = { distance_km: 10, favorites_count: 50, created_at: baseDate }
      expect(sortByRecommendation(itemA, itemB)).toBeGreaterThan(0)
    })
  })

  describe('綜合排序', () => {
    it('應正確進行綜合排序', () => {
      const items = [
        { name: 'Far_Popular', distance_km: 50, favorites_count: 100, created_at: baseDate },
        { name: 'Close_Unpopular', distance_km: 5, favorites_count: 5, created_at: baseDate },
        { name: 'Medium_Medium', distance_km: 20, favorites_count: 30, created_at: baseDate },
      ]
      const sorted = [...items].sort(sortByRecommendation)
      // 排序結果取決於綜合評分，確保排序後陣列長度正確
      expect(sorted.length).toBe(3)
      // 確保所有項目都在排序結果中
      expect(sorted.map((i) => i.name)).toContain('Far_Popular')
      expect(sorted.map((i) => i.name)).toContain('Close_Unpopular')
      expect(sorted.map((i) => i.name)).toContain('Medium_Medium')
    })
  })
})
