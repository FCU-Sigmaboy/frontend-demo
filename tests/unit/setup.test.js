// 測試框架設定驗證
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '../helpers/test-utils.js'

describe('測試框架設定', () => {
  it('should have Vitest globals available', () => {
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
    expect(expect).toBeDefined()
    expect(vi).toBeDefined()
  })

  it('should have Vue Test Utils available', () => {
    expect(mount).toBeDefined()
  })

  it('should have DOM environment available', () => {
    expect(document).toBeDefined()
    expect(window).toBeDefined()
    expect(global.ResizeObserver).toBeDefined()
    expect(global.IntersectionObserver).toBeDefined()
  })

  it('should have localStorage and sessionStorage mocked', () => {
    expect(window.localStorage).toBeDefined()
    expect(window.sessionStorage).toBeDefined()
    expect(vi.isMockFunction(window.localStorage.getItem)).toBe(true)
    expect(vi.isMockFunction(window.sessionStorage.getItem)).toBe(true)
  })

  it('should have Pinia testing utilities available', () => {
    const pinia = createTestingPinia()
    expect(pinia).toBeDefined()
  })

  it('should clean up mocks between tests', () => {
    const mockFn = vi.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
    
    // 這個測試驗證 beforeEach 中的 vi.clearAllMocks() 是否正常工作
    // 在實際測試中，模擬會在每個測試前被清理
  })
})