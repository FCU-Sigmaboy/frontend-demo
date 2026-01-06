// src/utils/formatPoints.test.js
// Sprint 1 基礎測試 + Sprint 2 進階擴展
import { describe, it, expect } from 'vitest'
import { formatPoints } from './formatPoints'

describe('formatPoints', () => {
  // =========================================================================
  // 正常數值測試
  // =========================================================================
  describe('正常數值', () => {
    it('應將 1000 格式化為 "1,000 點"', () => {
      expect(formatPoints(1000)).toBe('1,000 點')
    })

    it('應將 1000000 格式化為 "1,000,000 點"', () => {
      expect(formatPoints(1000000)).toBe('1,000,000 點')
    })

    it('應將 0 格式化為 "0 點"', () => {
      expect(formatPoints(0)).toBe('0 點')
    })

    it('應將 100 格式化為 "100 點"', () => {
      expect(formatPoints(100)).toBe('100 點')
    })
  })

  // =========================================================================
  // 邊界情況測試
  // =========================================================================
  describe('邊界情況', () => {
    it('應處理 null 值，返回 "0 點"', () => {
      expect(formatPoints(null)).toBe('0 點')
    })

    it('應處理 undefined，返回 "0 點"', () => {
      expect(formatPoints(undefined)).toBe('0 點')
    })

    it('應處理非數字字串，返回 "0 點"', () => {
      expect(formatPoints('abc')).toBe('0 點')
    })

    it('應處理數字字串 "1500"，返回 "1,500 點"', () => {
      expect(formatPoints('1500')).toBe('1,500 點')
    })

    it('應處理負數 -500，返回 "-500 點"', () => {
      expect(formatPoints(-500)).toBe('-500 點')
    })
  })

  // =========================================================================
  // 進階情況測試（Sprint 2 擴展）
  // =========================================================================
  describe('進階情況', () => {
    it('應處理小數', () => {
      expect(formatPoints(1000.5)).toBe('1,000.5 點')
    })

    it('應處理極大數字', () => {
      expect(formatPoints(999999999)).toBe('999,999,999 點')
    })

    it('應處理 NaN', () => {
      expect(formatPoints(NaN)).toBe('0 點')
    })

    it('應處理 Infinity', () => {
      expect(formatPoints(Infinity)).toBe('∞ 點')
    })

    it('應處理負 Infinity', () => {
      expect(formatPoints(-Infinity)).toBe('-∞ 點')
    })

    it('應處理空物件', () => {
      expect(formatPoints({})).toBe('0 點')
    })

    it('應處理空陣列', () => {
      expect(formatPoints([])).toBe('0 點')
    })

    it('應處理布林值 true', () => {
      expect(formatPoints(true)).toBe('1 點')
    })

    it('應處理布林值 false', () => {
      expect(formatPoints(false)).toBe('0 點')
    })
  })
})
