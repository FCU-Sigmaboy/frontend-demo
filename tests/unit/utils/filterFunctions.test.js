/**
 * filterFunctions.js 單元測試
 * 測試篩選工具函數
 * 
 * _需求: 6.3, 6.4_
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  filterByPopularity,
  filterByDistance,
  filterByRecentlyCreated,
  filterByPriceRange,
  filterByDiscount,
  filterByStatus,
  combineFilters,
  combineFiltersOr
} from '@/utils/filterFunctions.js'

describe('filterFunctions', () => {
  describe('filterByPopularity', () => {
    it('should filter items with favorites_count >= threshold', () => {
      const filter = filterByPopularity(50)
      
      expect(filter({ favorites_count: 100 })).toBe(true)
      expect(filter({ favorites_count: 50 })).toBe(true)
      expect(filter({ favorites_count: 49 })).toBe(false)
    })

    it('should use default threshold of 50', () => {
      const filter = filterByPopularity()
      
      expect(filter({ favorites_count: 50 })).toBe(true)
      expect(filter({ favorites_count: 49 })).toBe(false)
    })

    it('should handle missing favorites_count as 0', () => {
      const filter = filterByPopularity(50)
      
      expect(filter({})).toBe(false)
      expect(filter({ favorites_count: null })).toBe(false)
    })
  })

  describe('filterByDistance', () => {
    it('should filter items with distance_km <= maxDistance', () => {
      const filter = filterByDistance(5)
      
      expect(filter({ distance_km: 3 })).toBe(true)
      expect(filter({ distance_km: 5 })).toBe(true)
      expect(filter({ distance_km: 6 })).toBe(false)
    })

    it('should use default maxDistance of 5', () => {
      const filter = filterByDistance()
      
      expect(filter({ distance_km: 5 })).toBe(true)
      expect(filter({ distance_km: 6 })).toBe(false)
    })

    it('should handle string distance values', () => {
      const filter = filterByDistance(5)
      
      expect(filter({ distance_km: '3.5' })).toBe(true)
      expect(filter({ distance_km: '6.0' })).toBe(false)
    })

    it('should handle missing distance_km as 999', () => {
      const filter = filterByDistance(5)
      
      expect(filter({})).toBe(false)
    })
  })

  describe('filterByRecentlyCreated', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-11T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should filter items created within specified days', () => {
      const filter = filterByRecentlyCreated(7)
      
      // 3 天前
      expect(filter({ created_at: '2025-12-08T12:00:00.000Z' })).toBe(true)
      // 7 天前
      expect(filter({ created_at: '2025-12-04T12:00:00.000Z' })).toBe(true)
      // 10 天前
      expect(filter({ created_at: '2025-12-01T12:00:00.000Z' })).toBe(false)
    })

    it('should use default days of 7', () => {
      const filter = filterByRecentlyCreated()
      
      expect(filter({ created_at: '2025-12-08T12:00:00.000Z' })).toBe(true)
    })
  })

  describe('filterByPriceRange', () => {
    it('should filter items within price range', () => {
      const filter = filterByPriceRange(100, 500)
      
      expect(filter({ price: 100 })).toBe(true)
      expect(filter({ price: 300 })).toBe(true)
      expect(filter({ price: 500 })).toBe(true)
      expect(filter({ price: 99 })).toBe(false)
      expect(filter({ price: 501 })).toBe(false)
    })

    it('should use default range of 0 to Infinity', () => {
      const filter = filterByPriceRange()
      
      expect(filter({ price: 0 })).toBe(true)
      expect(filter({ price: 1000000 })).toBe(true)
    })

    it('should handle missing price as 0', () => {
      const filter = filterByPriceRange(0, 100)
      
      expect(filter({})).toBe(true)
    })
  })

  describe('filterByDiscount', () => {
    it('should filter items with discount > 0', () => {
      const filter = filterByDiscount()
      
      expect(filter({ discount: 10 })).toBe(true)
      expect(filter({ discount: 0.5 })).toBe(true)
      expect(filter({ discount: 0 })).toBeFalsy()
      expect(filter({ discount: null })).toBeFalsy()
      expect(filter({})).toBeFalsy()
    })
  })

  describe('filterByStatus', () => {
    it('should filter items by exact status match', () => {
      const filter = filterByStatus('active')
      
      expect(filter({ status: 'active' })).toBe(true)
      expect(filter({ status: 'inactive' })).toBe(false)
      expect(filter({ status: 'sold' })).toBe(false)
    })

    it('should handle missing status', () => {
      const filter = filterByStatus('active')
      
      expect(filter({})).toBe(false)
    })
  })

  describe('combineFilters (AND logic)', () => {
    it('should return true only when all filters pass', () => {
      const filter = combineFilters(
        filterByPopularity(50),
        filterByDistance(5)
      )
      
      expect(filter({ favorites_count: 100, distance_km: 3 })).toBe(true)
      expect(filter({ favorites_count: 100, distance_km: 10 })).toBe(false)
      expect(filter({ favorites_count: 10, distance_km: 3 })).toBe(false)
    })

    it('should handle single filter', () => {
      const filter = combineFilters(filterByPopularity(50))
      
      expect(filter({ favorites_count: 100 })).toBe(true)
      expect(filter({ favorites_count: 10 })).toBe(false)
    })

    it('should handle empty filters', () => {
      const filter = combineFilters()
      
      expect(filter({})).toBe(true)
    })
  })

  describe('combineFiltersOr (OR logic)', () => {
    it('should return true when any filter passes', () => {
      const filter = combineFiltersOr(
        filterByPopularity(100),
        filterByDistance(3)
      )
      
      expect(filter({ favorites_count: 100, distance_km: 10 })).toBe(true)
      expect(filter({ favorites_count: 10, distance_km: 2 })).toBe(true)
      expect(filter({ favorites_count: 10, distance_km: 10 })).toBe(false)
    })

    it('should handle single filter', () => {
      const filter = combineFiltersOr(filterByPopularity(50))
      
      expect(filter({ favorites_count: 100 })).toBe(true)
      expect(filter({ favorites_count: 10 })).toBe(false)
    })

    it('should handle empty filters', () => {
      const filter = combineFiltersOr()
      
      expect(filter({})).toBe(false)
    })
  })
})
