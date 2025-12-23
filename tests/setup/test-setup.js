// 全域測試設定檔案
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// DOM 環境設定
import './dom-setup.js'

// 時間模擬控制系統
class TimeController {
  constructor() {
    this.isUsingFakeTimers = false
    this.currentTime = null
    this.originalDateNow = Date.now
    this.originalSetTimeout = global.setTimeout
    this.originalSetInterval = global.setInterval
    this.originalClearTimeout = global.clearTimeout
    this.originalClearInterval = global.clearInterval
  }

  /**
   * 啟用假時間，設定固定的當前時間
   * @param {Date|string|number} fixedTime - 固定時間
   */
  useFakeTimers(fixedTime = new Date('2024-01-01T00:00:00.000Z')) {
    if (this.isUsingFakeTimers) {
      this.useRealTimers()
    }
    
    this.currentTime = new Date(fixedTime)
    this.isUsingFakeTimers = true
    
    // 使用 Vitest 的假時間
    vi.useFakeTimers()
    vi.setSystemTime(this.currentTime)
    
    console.log(`[TimeController] Using fake timers, fixed time: ${this.currentTime.toISOString()}`)
    return this
  }

  /**
   * 恢復真實時間
   */
  useRealTimers() {
    if (this.isUsingFakeTimers) {
      vi.useRealTimers()
      this.isUsingFakeTimers = false
      this.currentTime = null
      console.log('[TimeController] Restored real timers')
    }
    return this
  }

  /**
   * 前進時間
   * @param {number} ms - 前進的毫秒數
   */
  advanceTime(ms) {
    if (!this.isUsingFakeTimers) {
      throw new Error('Must call useFakeTimers() before advancing time')
    }
    
    this.currentTime = new Date(this.currentTime.getTime() + ms)
    vi.advanceTimersByTime(ms)
    vi.setSystemTime(this.currentTime)
    
    console.log(`[TimeController] Advanced time by ${ms}ms to: ${this.currentTime.toISOString()}`)
    return this
  }

  /**
   * 執行所有待處理的計時器
   */
  runAllTimers() {
    if (!this.isUsingFakeTimers) {
      throw new Error('Must call useFakeTimers() before running timers')
    }
    
    vi.runAllTimers()
    console.log('[TimeController] Ran all pending timers')
    return this
  }

  /**
   * 執行所有待處理的微任務
   */
  async runAllTicks() {
    await vi.runAllTicks()
    console.log('[TimeController] Ran all pending ticks')
    return this
  }

  /**
   * 獲取當前模擬時間
   */
  getCurrentTime() {
    return this.isUsingFakeTimers ? new Date(this.currentTime) : new Date()
  }

  /**
   * 設定特定時間
   * @param {Date|string|number} time - 要設定的時間
   */
  setTime(time) {
    if (!this.isUsingFakeTimers) {
      throw new Error('Must call useFakeTimers() before setting time')
    }
    
    this.currentTime = new Date(time)
    vi.setSystemTime(this.currentTime)
    
    console.log(`[TimeController] Set time to: ${this.currentTime.toISOString()}`)
    return this
  }
}

// 隨機數模擬控制系統
class RandomController {
  constructor() {
    this.isUsingMockRandom = false
    this.originalMathRandom = Math.random
    this.seed = null
    this.sequence = []
    this.index = 0
  }

  /**
   * 使用固定種子的偽隨機數
   * @param {number} seed - 隨機數種子
   */
  useMockRandom(seed = 12345) {
    if (this.isUsingMockRandom) {
      this.useRealRandom()
    }
    
    this.seed = seed
    this.isUsingMockRandom = true
    this.index = 0
    
    // 簡單的線性同餘生成器
    let currentSeed = seed
    Math.random = vi.fn(() => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % Math.pow(2, 32)
      return currentSeed / Math.pow(2, 32)
    })
    
    console.log(`[RandomController] Using mock random with seed: ${seed}`)
    return this
  }

  /**
   * 使用預定義的隨機數序列
   * @param {number[]} sequence - 隨機數序列 (0-1 之間)
   */
  useSequence(sequence) {
    if (!Array.isArray(sequence) || sequence.some(n => n < 0 || n > 1)) {
      throw new Error('Sequence must be an array of numbers between 0 and 1')
    }
    
    this.sequence = [...sequence]
    this.index = 0
    this.isUsingMockRandom = true
    
    Math.random = vi.fn(() => {
      if (this.index >= this.sequence.length) {
        this.index = 0 // 循環使用序列
      }
      const value = this.sequence[this.index]
      this.index++
      return value
    })
    
    console.log(`[RandomController] Using predefined sequence of ${sequence.length} values`)
    return this
  }

  /**
   * 恢復真實隨機數
   */
  useRealRandom() {
    if (this.isUsingMockRandom) {
      Math.random = this.originalMathRandom
      this.isUsingMockRandom = false
      this.seed = null
      this.sequence = []
      this.index = 0
      console.log('[RandomController] Restored real random')
    }
    return this
  }

  /**
   * 重置隨機數序列索引
   */
  resetSequence() {
    this.index = 0
    console.log('[RandomController] Reset sequence index')
    return this
  }
}

// 模擬物件自動清理系統
class MockCleanupSystem {
  constructor() {
    this.registeredMocks = new Set()
    this.moduleOverrides = new Map()
    this.globalOverrides = new Map()
  }

  /**
   * 註冊需要清理的模擬物件
   * @param {*} mockObject - 模擬物件
   * @param {string} name - 模擬物件名稱
   */
  registerMock(mockObject, name = 'unnamed') {
    this.registeredMocks.add({ mock: mockObject, name })
    console.log(`[MockCleanup] Registered mock: ${name}`)
    return mockObject
  }

  /**
   * 註冊模組覆寫
   * @param {string} modulePath - 模組路徑
   * @param {*} mockImplementation - 模擬實作
   */
  registerModuleOverride(modulePath, mockImplementation) {
    this.moduleOverrides.set(modulePath, mockImplementation)
    console.log(`[MockCleanup] Registered module override: ${modulePath}`)
    return mockImplementation
  }

  /**
   * 註冊全域變數覆寫
   * @param {string} globalName - 全域變數名稱
   * @param {*} originalValue - 原始值
   * @param {*} mockValue - 模擬值
   */
  registerGlobalOverride(globalName, originalValue, mockValue) {
    this.globalOverrides.set(globalName, { original: originalValue, mock: mockValue })
    global[globalName] = mockValue
    console.log(`[MockCleanup] Registered global override: ${globalName}`)
    return mockValue
  }

  /**
   * 清理所有註冊的模擬物件
   */
  cleanupAll() {
    let cleanedCount = 0

    // 清理模擬物件
    for (const { mock, name } of this.registeredMocks) {
      if (vi.isMockFunction(mock)) {
        mock.mockClear()
        cleanedCount++
      } else if (mock && typeof mock === 'object') {
        // 清理物件中的所有模擬函數
        Object.values(mock).forEach(value => {
          if (vi.isMockFunction(value)) {
            value.mockClear()
            cleanedCount++
          }
        })
      }
    }

    // 恢復全域變數
    for (const [globalName, { original }] of this.globalOverrides) {
      global[globalName] = original
      cleanedCount++
    }

    // 清理註冊記錄
    this.registeredMocks.clear()
    this.moduleOverrides.clear()
    this.globalOverrides.clear()

    console.log(`[MockCleanup] Cleaned up ${cleanedCount} mocks and overrides`)
    return cleanedCount
  }

  /**
   * 獲取清理統計
   */
  getStats() {
    return {
      registeredMocks: this.registeredMocks.size,
      moduleOverrides: this.moduleOverrides.size,
      globalOverrides: this.globalOverrides.size
    }
  }
}

// 創建全域實例
const timeController = new TimeController()
const randomController = new RandomController()
const mockCleanupSystem = new MockCleanupSystem()

// 設定 Vue Test Utils 全域配置
config.global.stubs = {
  // 常用組件的存根
  'router-link': true,
  'router-view': true,
  'transition': false,
  'transition-group': false
}

// 全域模擬設定
vi.mock('@/lib/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))

// 模擬 Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/',
    name: 'home'
  }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn(),
  RouterLink: 'router-link',
  RouterView: 'router-view'
}))

// Note: Pinia is not mocked globally to allow proper store testing

// 全域錯誤處理
const originalConsoleError = console.error
console.error = (...args) => {
  // 過濾掉一些已知的測試警告
  const message = args[0]
  if (
    typeof message === 'string' &&
    (message.includes('[Vue warn]') ||
     message.includes('ResizeObserver loop limit exceeded'))
  ) {
    return
  }
  originalConsoleError.apply(console, args)
}

// 匯入測試輔助工具
import { createPinia, setActivePinia } from 'pinia'

// 測試前後的清理
beforeEach(() => {
  // 清理所有模擬
  vi.clearAllMocks()
  
  // 重置 DOM
  document.body.innerHTML = ''
  
  // 清理任何全域狀態
  if (window.localStorage) {
    window.localStorage.clear()
  }
  if (window.sessionStorage) {
    window.sessionStorage.clear()
  }
  
  // 設定新的 Pinia 實例
  const pinia = createPinia()
  setActivePinia(pinia)
  
  // 重置模組模擬
  vi.resetModules()
  
  // 重置時間控制器
  timeController.useRealTimers()
  
  // 重置隨機數控制器
  randomController.useRealRandom()
  
  // 清理模擬物件系統
  mockCleanupSystem.cleanupAll()
})

afterEach(() => {
  // 清理任何剩餘的計時器
  vi.clearAllTimers()
  
  // 恢復所有模擬
  vi.restoreAllMocks()
  
  // 恢復真實時間（如果使用了假時間）
  timeController.useRealTimers()
  vi.useRealTimers()
  
  // 恢復真實隨機數
  randomController.useRealRandom()
  
  // 執行模擬清理系統
  mockCleanupSystem.cleanupAll()
  
  // 清理 DOM
  document.body.innerHTML = ''
})

// 設定測試超時時間
vi.setConfig({
  testTimeout: 10000, // 10 秒
  hookTimeout: 10000  // 10 秒
})

// 匯入開發工具 (暫時註解以避免循環依賴)
// import { watchController, performanceAnalyzer } from '../helpers/watch-mode.js'
// import { devReporter } from '../helpers/dev-reporter.js'
// import { testDebugger, troubleshooter } from '../helpers/test-debugger.js'

// 在開發模式下啟用增強功能
if (process.env.NODE_ENV === 'development') {
  // 啟用詳細報告
  console.log('🔧 Development mode: Enhanced test reporting enabled')
}

// 在除錯模式下啟用除錯工具
if (process.env.DEBUG_TESTS === 'true') {
  testDebugger.enable()
  console.log('🐛 Debug mode: Test debugger enabled')
}

// 設置性能監控 (暫時註解)
// beforeAll(() => {
//   performanceAnalyzer.startAnalysis()
// })

// afterAll(() => {
//   performanceAnalyzer.endAnalysis()
//   
//   // 在開發模式下顯示性能報告
//   if (process.env.NODE_ENV === 'development') {
//     const report = performanceAnalyzer.getPerformanceReport()
//     if (report.slowTests.length > 0 || report.recommendations.length > 0) {
//       console.log('\n' + '='.repeat(50))
//       console.log('📊 Performance Report')
//       console.log('='.repeat(50))
//       
//       if (report.slowTests.length > 0) {
//         console.log(`\n🐌 Slow Tests (>${performanceAnalyzer.slowTestThreshold}ms):`)
//         report.slowTests.forEach(test => {
//           console.log(`  • ${test.name}: ${Math.round(test.duration)}ms`)
//         })
//       }
//       
//       if (report.recommendations.length > 0) {
//         console.log('\n💡 Recommendations:')
//         report.recommendations.forEach(rec => {
//           console.log(`  • ${rec}`)
//         })
//       }
//       
//       console.log('='.repeat(50))
//     }
//   }
// })

// 增強錯誤處理已在上面設定，這裡不需要重複

// 匯出常用的測試工具供全域使用
global.testHelpers = {
  createPinia,
  setActivePinia,
  timeController,
  randomController,
  mockCleanupSystem,
  // watchController,
  // performanceAnalyzer,
  // testDebugger,
  // troubleshooter
}