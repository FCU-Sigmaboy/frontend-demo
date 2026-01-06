// src/utils/timeFormat.test.js
// Sprint 2: 核心工具函數測試 - timeFormat
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime } from './timeFormat'

describe('formatRelativeTime', () => {
  // =========================================================================
  // 測試設置：固定當前時間
  // =========================================================================
  beforeEach(() => {
    // 固定當前時間為 2026-01-06 12:00:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-06T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // 無效輸入測試
  // =========================================================================
  describe('無效輸入', () => {
    it('應處理 null 值，返回 "未知時間"', () => {
      expect(formatRelativeTime(null)).toBe('未知時間')
    })

    it('應處理 undefined，返回 "未知時間"', () => {
      expect(formatRelativeTime(undefined)).toBe('未知時間')
    })

    it('應處理空字串，返回 "未知時間"', () => {
      expect(formatRelativeTime('')).toBe('未知時間')
    })
  })

  // =========================================================================
  // 時間格式化測試
  // =========================================================================
  describe('時間格式化', () => {
    it('應顯示「剛剛」於 1 分鐘內（30秒前）', () => {
      const thirtySecondsAgo = new Date('2026-01-06T11:59:30')
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('剛剛')
    })

    it('應顯示「剛剛」於 0 秒差距', () => {
      const now = new Date('2026-01-06T12:00:00')
      expect(formatRelativeTime(now)).toBe('剛剛')
    })

    it('應顯示分鐘數（5分鐘前）', () => {
      const fiveMinutesAgo = new Date('2026-01-06T11:55:00')
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分鐘前')
    })

    it('應顯示分鐘數（1分鐘前）', () => {
      const oneMinuteAgo = new Date('2026-01-06T11:59:00')
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1分鐘前')
    })

    it('應顯示分鐘數（59分鐘前）', () => {
      const fiftyNineMinutesAgo = new Date('2026-01-06T11:01:00')
      expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59分鐘前')
    })

    it('應顯示小時數（1小時前）', () => {
      const oneHourAgo = new Date('2026-01-06T11:00:00')
      expect(formatRelativeTime(oneHourAgo)).toBe('1小時前')
    })

    it('應顯示小時數（3小時前）', () => {
      const threeHoursAgo = new Date('2026-01-06T09:00:00')
      expect(formatRelativeTime(threeHoursAgo)).toBe('3小時前')
    })

    it('應顯示小時數（23小時前）', () => {
      const twentyThreeHoursAgo = new Date('2026-01-05T13:00:00')
      expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23小時前')
    })

    it('應顯示天數（1天前）', () => {
      const oneDayAgo = new Date('2026-01-05T12:00:00')
      expect(formatRelativeTime(oneDayAgo)).toBe('1天前')
    })

    it('應顯示天數（2天前）', () => {
      const twoDaysAgo = new Date('2026-01-04T12:00:00')
      expect(formatRelativeTime(twoDaysAgo)).toBe('2天前')
    })

    it('應顯示天數（29天前）', () => {
      const twentyNineDaysAgo = new Date('2025-12-08T12:00:00')
      expect(formatRelativeTime(twentyNineDaysAgo)).toBe('29天前')
    })

    it('應顯示月份數（1個月前）', () => {
      const oneMonthAgo = new Date('2025-12-06T12:00:00')
      expect(formatRelativeTime(oneMonthAgo)).toBe('1個月前')
    })

    it('應顯示月份數（2個月前）', () => {
      const twoMonthsAgo = new Date('2025-11-06T12:00:00')
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2個月前')
    })

    it('應顯示月份數（11個月前）', () => {
      const elevenMonthsAgo = new Date('2025-02-06T12:00:00')
      expect(formatRelativeTime(elevenMonthsAgo)).toBe('11個月前')
    })

    it('應顯示年數（1年前）', () => {
      const oneYearAgo = new Date('2025-01-06T12:00:00')
      expect(formatRelativeTime(oneYearAgo)).toBe('1年前')
    })

    it('應顯示年數（2年前）', () => {
      const twoYearsAgo = new Date('2024-01-06T12:00:00')
      expect(formatRelativeTime(twoYearsAgo)).toBe('2年前')
    })
  })

  // =========================================================================
  // 未來時間測試
  // =========================================================================
  describe('未來時間', () => {
    it('應顯示「剛剛」於未來時間（1小時後）', () => {
      const futureTime = new Date('2026-01-06T13:00:00')
      expect(formatRelativeTime(futureTime)).toBe('剛剛')
    })

    it('應顯示「剛剛」於未來時間（1天後）', () => {
      const futureDayTime = new Date('2026-01-07T12:00:00')
      expect(formatRelativeTime(futureDayTime)).toBe('剛剛')
    })
  })

  // =========================================================================
  // 不同輸入格式測試
  // =========================================================================
  describe('輸入格式', () => {
    it('應接受 Date 物件', () => {
      const dateObject = new Date('2026-01-06T11:55:00')
      expect(formatRelativeTime(dateObject)).toBe('5分鐘前')
    })

    it('應接受 ISO 8601 字串', () => {
      const isoString = '2026-01-06T11:55:00'
      expect(formatRelativeTime(isoString)).toBe('5分鐘前')
    })

    it('應接受時間戳字串', () => {
      const timestampString = '2026-01-06T09:00:00Z'
      // UTC 時間轉換後可能有時差，此處主要測試格式接受性
      const result = formatRelativeTime(timestampString)
      expect(result).toMatch(/小時前|分鐘前/)
    })
  })
})
