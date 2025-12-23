// 測試環境管理工具
import { vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/**
 * 測試環境管理器
 * 提供統一的測試環境設定和清理功能
 */
export class TestEnvironmentManager {
  constructor() {
    this.originalConsoleWarn = console.warn
    this.originalConsoleError = console.error
    this.mockTimers = false
    this.pinia = null
  }

  /**
   * 設定測試環境
   * @param {Object} options - 設定選項
   */
  setup(options = {}) {
    const {
      mockTimers = false,
      suppressWarnings = true,
      mockPinia = true,
      mockLocalStorage = true,
      mockFetch = true
    } = options

    // 設定 Pinia
    if (mockPinia) {
      this.pinia = createPinia()
      setActivePinia(this.pinia)
    }

    // 設定時間模擬
    if (mockTimers) {
      vi.useFakeTimers()
      this.mockTimers = true
    }

    // 抑制警告訊息
    if (suppressWarnings) {
      this.suppressConsoleWarnings()
    }

    // 模擬 localStorage
    if (mockLocalStorage) {
      this.mockStorage()
    }

    // 模擬 fetch
    if (mockFetch) {
      this.mockFetchAPI()
    }

    // 清理 DOM
    this.cleanupDOM()
  }

  /**
   * 清理測試環境
   */
  cleanup() {
    // 恢復時間
    if (this.mockTimers) {
      vi.useRealTimers()
      this.mockTimers = false
    }

    // 清理所有模擬
    vi.clearAllMocks()
    vi.resetAllMocks()

    // 恢復 console
    this.restoreConsole()

    // 清理 DOM
    this.cleanupDOM()

    // 清理儲存
    this.cleanupStorage()

    // 重置 Pinia
    if (this.pinia) {
      this.pinia = null
    }
  }

  /**
   * 抑制 console 警告
   */
  suppressConsoleWarnings() {
    console.warn = (...args) => {
      const message = args[0]
      if (
        typeof message === 'string' &&
        (message.includes('[Vue warn]') ||
         message.includes('Deprecation warning') ||
         message.includes('Warning:'))
      ) {
        return
      }
      this.originalConsoleWarn.apply(console, args)
    }

    console.error = (...args) => {
      const message = args[0]
      if (
        typeof message === 'string' &&
        message.includes('[Vue warn]')
      ) {
        return
      }
      this.originalConsoleError.apply(console, args)
    }
  }

  /**
   * 恢復 console
   */
  restoreConsole() {
    console.warn = this.originalConsoleWarn
    console.error = this.originalConsoleError
  }

  /**
   * 清理 DOM
   */
  cleanupDOM() {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  }

  /**
   * 清理儲存
   */
  cleanupStorage() {
    localStorage.clear()
    sessionStorage.clear()
  }

  /**
   * 模擬儲存 API
   */
  mockStorage() {
    const createStorageMock = () => {
      const store = new Map()
      return {
        getItem: vi.fn((key) => store.get(key) || null),
        setItem: vi.fn((key, value) => store.set(key, String(value))),
        removeItem: vi.fn((key) => store.delete(key)),
        clear: vi.fn(() => store.clear()),
        get length() { return store.size },
        key: vi.fn((index) => Array.from(store.keys())[index] || null)
      }
    }

    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(),
      writable: true
    })

    Object.defineProperty(window, 'sessionStorage', {
      value: createStorageMock(),
      writable: true
    })
  }

  /**
   * 模擬 Fetch API
   */
  mockFetchAPI() {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        headers: new Headers(),
        url: 'https://example.com',
        redirected: false,
        type: 'basic'
      })
    )
  }

  /**
   * 創建模擬的事件
   * @param {string} type - 事件類型
   * @param {Object} options - 事件選項
   * @returns {Event} 模擬事件
   */
  createMockEvent(type, options = {}) {
    const event = new Event(type, { bubbles: true, cancelable: true, ...options })
    Object.assign(event, options)
    return event
  }

  /**
   * 等待下一個 tick
   * @returns {Promise} Promise
   */
  async nextTick() {
    return new Promise(resolve => setTimeout(resolve, 0))
  }

  /**
   * 等待指定時間
   * @param {number} ms - 毫秒數
   * @returns {Promise} Promise
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 快進時間（需要先啟用 mockTimers）
   * @param {number} ms - 要快進的毫秒數
   */
  advanceTime(ms) {
    if (!this.mockTimers) {
      throw new Error('需要先啟用 mockTimers 才能使用 advanceTime')
    }
    vi.advanceTimersByTime(ms)
  }

  /**
   * 執行所有待處理的 timer
   */
  runAllTimers() {
    if (!this.mockTimers) {
      throw new Error('需要先啟用 mockTimers 才能使用 runAllTimers')
    }
    vi.runAllTimers()
  }
}

// 創建全域測試環境管理器實例
export const testEnv = new TestEnvironmentManager()

/**
 * 自動設定測試環境的 hook
 * @param {Object} options - 設定選項
 */
export function useTestEnvironment(options = {}) {
  beforeEach(() => {
    testEnv.setup(options)
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  return testEnv
}

/**
 * 創建測試用的隨機資料生成器
 */
export class TestDataGenerator {
  /**
   * 生成隨機字串
   * @param {number} length - 字串長度
   * @returns {string} 隨機字串
   */
  static randomString(length = 10) {
    return Math.random().toString(36).substring(2, 2 + length)
  }

  /**
   * 生成隨機數字
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 隨機數字
   */
  static randomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * 生成隨機布林值
   * @returns {boolean} 隨機布林值
   */
  static randomBoolean() {
    return Math.random() > 0.5
  }

  /**
   * 從陣列中隨機選擇一個元素
   * @param {Array} array - 來源陣列
   * @returns {*} 隨機選擇的元素
   */
  static randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * 生成隨機日期
   * @param {Date} start - 開始日期
   * @param {Date} end - 結束日期
   * @returns {Date} 隨機日期
   */
  static randomDate(start = new Date(2020, 0, 1), end = new Date()) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  /**
   * 生成隨機電子郵件
   * @returns {string} 隨機電子郵件
   */
  static randomEmail() {
    const domains = ['example.com', 'test.com', 'demo.org']
    const username = this.randomString(8)
    const domain = this.randomChoice(domains)
    return `${username}@${domain}`
  }

  /**
   * 生成隨機 UUID
   * @returns {string} 隨機 UUID
   */
  static randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

// 預設匯出
export default {
  TestEnvironmentManager,
  testEnv,
  useTestEnvironment,
  TestDataGenerator
}