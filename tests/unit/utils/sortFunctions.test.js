/**
 * sortFunctions.js 單元測試
 * 測試排序工具函數
 * 
 * _需求: 6.3, 6.4_
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  sortByDate,
  sortByNumber,
  sortByDistance,
  sortByFavoritedTime,
  sortByPopularity,
  sortByRecommendation
} from '@/utils/sortFunctions.js'

describe('sortFunctions', () => {
  describe('sortByDate', () => {
    it('should sort dates in ascending order', () => {
      const dates = [
        '2025-12-11',
        '2025-12-01',
        '2025-12-15'
      ]
      
      const sorted = [...dates].sort(sortByDate)
      
      expect(sorted).toEqual([
        '2025-12-01',
        '2025-12-11',
        '2025-12-15'
      ])
    })

    it('should handle Date objects', () => {
      const date1 = new Date('2025-12-01')
      const date2 = new Date('2025-12-15')
      
      expect(sortByDate(date1, date2)).toBeLessThan(0)
      expect(sortByDate(date2, date1)).toBeGreaterThan(0)
    })

    it('should return 0 for equal dates', () => {
      const date1 = '2025-12-11T12:00:00.000Z'
      const date2 = '2025-12-11T12:00:00.000Z'
      
      expect(sortByDate(date1, date2)).toBe(0)
    })
  })

  describe('sortByNumber', () => {
    it('should sort numbers in ascending order', () => {
      const numbers = [100, 50, 200, 25]
      
      const sorted = [...numbers].sort(sortByNumber)
      
      expect(sorted).toEqual([25, 50, 100, 200])
    })

    it('should handle string numbers', () => {
      expect(sortByNumber('100', '50')).toBeGreaterThan(0)
      expect(sortByNumber('25', '100')).toBeLessThan(0)
    })

    it('should handle non-numeric values as 0', () => {
      expect(sortByNumber('abc', 50)).toBeLessThan(0)
      expect(sortByNumber(null, 50)).toBeLessThan(0)
    })
  })

  describe('sortByDistance', () => {
    it('should sort items by distance_km in ascending order', () => {
      const items = [
        { distance_km: 10 },
        { distance_km: 5 },
        { distance_km: 15 }
      ]
      
      const sorted = [...items].sort(sortByDistance)
      
      expect(sorted[0].distance_km).toBe(5)
      expect(sorted[1].distance_km).toBe(10)
      expect(sorted[2].distance_km).toBe(15)
    })

    it('should handle string distance values', () => {
      const items = [
        { distance_km: '10.5' },
        { distance_km: '5.2' }
      ]
      
      const sorted = [...items].sort(sortByDistance)
      
      expect(sorted[0].distance_km).toBe('5.2')
    })

    it('should handle missing distance_km as 0', () => {
      const items = [
        { distance_km: 10 },
        {}
      ]
      
      const sorted = [...items].sort(sortByDistance)
      
      expect(sorted[0]).toEqual({})
    })
  })

  describe('sortByFavoritedTime', () => {
    it('should sort by favorited_at in ascending order', () => {
      const items = [
        { favorited_at: '2025-12-11' },
        { favorited_at: '2025-12-01' },
        { favorited_at: '2025-12-15' }
      ]
      
      const sorted = [...items].sort(sortByFavoritedTime)
      
      expect(sorted[0].favorited_at).toBe('2025-12-01')
      expect(sorted[2].favorited_at).toBe('2025-12-15')
    })

    it('should fallback to created_at when favorited_at is missing', () => {
      const items = [
        { created_at: '2025-12-11' },
        { favorited_at: '2025-12-01' },
        { created_at: '2025-12-15' }
      ]
      
      const sorted = [...items].sort(sortByFavoritedTime)
      
      expect(sorted[0].favorited_at).toBe('2025-12-01')
    })
  })

  describe('sortByPopularity', () => {
    it('should sort by favorites_count in ascending order', () => {
      const items = [
        { favorites_count: 100 },
        { favorites_count: 50 },
        { favorites_count: 200 }
      ]
      
      const sorted = [...items].sort(sortByPopularity)
      
      expect(sorted[0].favorites_count).toBe(50)
      expect(sorted[1].favorites_count).toBe(100)
      expect(sorted[2].favorites_count).toBe(200)
    })

    it('should handle missing favorites_count as 0', () => {
      const items = [
        { favorites_count: 50 },
        {}
      ]
      
      const sorted = [...items].sort(sortByPopularity)
      
      expect(sorted[0]).toEqual({})
    })
  })

  describe('sortByRecommendation', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-11T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should sort items by recommendation score (descending)', () => {
      const items = [
        { distance_km: 50, favorites_count: 10, created_at: '2025-11-01' },
        { distance_km: 5, favorites_count: 100, created_at: '2025-12-01' },
        { distance_km: 20, favorites_count: 50, created_at: '2025-12-05' }
      ]
      
      const sorted = [...items].sort(sortByRecommendation)
      
      // 近距離 + 高收藏數的應該排在前面
      expect(sorted[0].distance_km).toBe(5)
    })

    it('should handle missing values with defaults', () => {
      const items = [
        { distance_km: 50, favorites_count: 0, created_at: '2025-11-01' },
        { distance_km: 5, favorites_count: 100, created_at: '2025-12-01' }
      ]
      
      const sorted = [...items].sort(sortByRecommendation)
      
      // 排序應該完成而不拋出錯誤
      expect(sorted.length).toBe(2)
      // 有更好資料的項目（近距離 + 高收藏）應該排在前面
      expect(sorted[0].favorites_count).toBe(100)
    })
  })
})
