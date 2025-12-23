// 測試輔助工具統一匯出
// 主要測試工具
export {
  createTestingPinia,
  mountComponent,
  shallowMountComponent,
  mockRouter,
  nextTick,
  sleep,
  triggerEvent,
  setInputValue,
  clickElement,
  cleanupTestEnvironment,
  setupTestEnvironment,
  createMockSupabaseClient,
  flushPromises,
  createTimeController,
  createErrorHandler
} from './test-utils.js'

// 測試環境管理
export {
  TestEnvironmentManager,
  testEnv,
  useTestEnvironment,
  TestDataGenerator
} from './test-environment.js'

// 測試命名和組織
export {
  TestNamingHelper,
  TestOrganizer,
  TestTagger
} from './test-naming.js'

// 常用的測試設定組合
export const commonTestSetups = {
  /**
   * Vue 組件測試的標準設定
   */
  vueComponent: {
    mockTimers: false,
    suppressWarnings: true,
    mockPinia: true,
    mockLocalStorage: true,
    mockFetch: true
  },

  /**
   * API 測試的標準設定
   */
  apiTesting: {
    mockTimers: false,
    suppressWarnings: true,
    mockPinia: false,
    mockLocalStorage: false,
    mockFetch: true
  },

  /**
   * Store 測試的標準設定
   */
  storeTesting: {
    mockTimers: false,
    suppressWarnings: true,
    mockPinia: true,
    mockLocalStorage: true,
    mockFetch: true
  },

  /**
   * 工具函數測試的標準設定
   */
  utilTesting: {
    mockTimers: false,
    suppressWarnings: true,
    mockPinia: false,
    mockLocalStorage: false,
    mockFetch: false
  },

  /**
   * 時間相關測試的標準設定
   */
  timeTesting: {
    mockTimers: true,
    suppressWarnings: true,
    mockPinia: false,
    mockLocalStorage: false,
    mockFetch: false
  }
}

// 快速設定函數
export const quickSetup = {
  /**
   * 快速設定 Vue 組件測試環境
   */
  forVueComponent: () => useTestEnvironment(commonTestSetups.vueComponent),

  /**
   * 快速設定 API 測試環境
   */
  forApi: () => useTestEnvironment(commonTestSetups.apiTesting),

  /**
   * 快速設定 Store 測試環境
   */
  forStore: () => useTestEnvironment(commonTestSetups.storeTesting),

  /**
   * 快速設定工具函數測試環境
   */
  forUtil: () => useTestEnvironment(commonTestSetups.utilTesting),

  /**
   * 快速設定時間相關測試環境
   */
  forTime: () => useTestEnvironment(commonTestSetups.timeTesting)
}