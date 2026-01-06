// src/test/setup.js
// Sprint 1: 基礎設置 - 模擬瀏覽器 API
import { vi } from 'vitest'

// ============================================================================
// 瀏覽器 API Mock
// ============================================================================

// 模擬 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模擬 IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver

// 模擬 ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver

// 模擬 localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value.toString()
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  }),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// 模擬 sessionStorage
const sessionStorageMock = {
  store: {},
  getItem: vi.fn((key) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    sessionStorageMock.store[key] = value.toString()
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {}
  }),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// 模擬 scrollTo
window.scrollTo = vi.fn()

// ============================================================================
// 測試生命週期
// ============================================================================

// 每個測試後清理 mock 並恢復原始實作
afterEach(() => {
  vi.restoreAllMocks()
  localStorageMock.store = {}
  sessionStorageMock.store = {}
})

// 所有測試完成後重置模組
afterAll(() => {
  vi.resetModules()
})
