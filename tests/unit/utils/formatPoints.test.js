/**
 * formatPoints.js 單元測試
 * 測試積分格式化功能
 * 
 * _需求: 6.3, 6.4_
 */
import { describe, it, expect } from 'vitest'
import { formatPoints } from '@/utils/formatPoints.js'

describe('formatPoints', () => {
  describe('基本格式化功能', () => {
    it('should format positive integers with thousands separator', () => {
      expect(formatPoints(1000)).toBe('1,000 點')
      expect(formatPoints(1000000)).toBe('1,000,000 點')
    })

    it('should format zero correctly', () => {
      expect(formatPoints(0)).toBe('0 點')
    })

    it('should format negative numbers with thousands separator', () => {
      expect(formatPoints(-1000)).toBe('-1,000 點')
    })

    it('should format small numbers without separator', () => {
      expect(formatPoints(100)).toBe('100 點')
      expect(formatPoints(999)).toBe('999 點')
    })
  })

  describe('邊界情況處理', () => {
    it('should handle null and undefined as 0', () => {
      expect(formatPoints(null)).toBe('0 點')
      expect(formatPoints(undefined)).toBe('0 點')
    })

    it('should handle string numbers', () => {
      expect(formatPoints('1000')).toBe('1,000 點')
      expect(formatPoints('0')).toBe('0 點')
    })

    it('should handle non-numeric strings as 0', () => {
      expect(formatPoints('abc')).toBe('0 點')
      expect(formatPoints('')).toBe('0 點')
    })

    it('should handle decimal numbers', () => {
      const result = formatPoints(1000.5)
      expect(result).toContain('點')
    })
  })
})
