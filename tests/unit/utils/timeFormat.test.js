/**
 * timeFormat.js 單元測試
 * 測試時間格式化功能
 * 
 * _需求: 6.3, 6.4_
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime } from '@/utils/timeFormat.js'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // 固定當前時間為 2025-12-11 12:00:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-11T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('無效輸入處理', () => {
    it('should return "未知時間" for null input', () => {
      expect(formatRelativeTime(null)).toBe('未知時間')
    })

    it('should return "未知時間" for undefined input', () => {
      expect(formatRelativeTime(undefined)).toBe('未知時間')
    })

    it('should return "未知時間" for empty string', () => {
      expect(formatRelativeTime('')).toBe('未知時間')
    })
  })

  describe('未來時間處理', () => {
    it('should return "剛剛" for future dates', () => {
      const futureDate = new Date('2025-12-12T12:00:00.000Z')
      expect(formatRelativeTime(futureDate)).toBe('剛剛')
    })
  })

  describe('秒級時間差', () => {
    it('should return "剛剛" for times less than 60 seconds ago', () => {
      const date = new Date('2025-12-11T11:59:30.000Z') // 30 秒前
      expect(formatRelativeTime(date)).toBe('剛剛')
    })
  })

  describe('分鐘級時間差', () => {
    it('should return minutes ago for times between 1-59 minutes', () => {
      const date5min = new Date('2025-12-11T11:55:00.000Z') // 5 分鐘前
      expect(formatRelativeTime(date5min)).toBe('5分鐘前')

      const date30min = new Date('2025-12-11T11:30:00.000Z') // 30 分鐘前
      expect(formatRelativeTime(date30min)).toBe('30分鐘前')
    })
  })

  describe('小時級時間差', () => {
    it('should return hours ago for times between 1-23 hours', () => {
      const date2hours = new Date('2025-12-11T10:00:00.000Z') // 2 小時前
      expect(formatRelativeTime(date2hours)).toBe('2小時前')

      const date12hours = new Date('2025-12-11T00:00:00.000Z') // 12 小時前
      expect(formatRelativeTime(date12hours)).toBe('12小時前')
    })
  })

  describe('天級時間差', () => {
    it('should return days ago for times between 1-29 days', () => {
      const date1day = new Date('2025-12-10T12:00:00.000Z') // 1 天前
      expect(formatRelativeTime(date1day)).toBe('1天前')

      const date7days = new Date('2025-12-04T12:00:00.000Z') // 7 天前
      expect(formatRelativeTime(date7days)).toBe('7天前')
    })
  })

  describe('月級時間差', () => {
    it('should return months ago for times between 1-11 months', () => {
      const date2months = new Date('2025-10-11T12:00:00.000Z') // 約 2 個月前
      expect(formatRelativeTime(date2months)).toBe('2個月前')
    })
  })

  describe('年級時間差', () => {
    it('should return years ago for times over 12 months', () => {
      const date1year = new Date('2024-12-11T12:00:00.000Z') // 1 年前
      expect(formatRelativeTime(date1year)).toBe('1年前')

      const date2years = new Date('2023-12-11T12:00:00.000Z') // 2 年前
      expect(formatRelativeTime(date2years)).toBe('2年前')
    })
  })

  describe('字串日期輸入', () => {
    it('should handle ISO date strings', () => {
      const dateString = '2025-12-11T11:55:00.000Z'
      expect(formatRelativeTime(dateString)).toBe('5分鐘前')
    })
  })
})
