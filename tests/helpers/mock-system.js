// 外部模組模擬和替換機制
import { vi } from 'vitest'

/**
 * 外部模組模擬管理器
 * 提供統一的外部模組模擬和替換機制
 */
export class ExternalModuleMocker {
  constructor() {
    this.activeMocks = new Map()
    this.originalModules = new Map()
    this.mockFactories = new Map()
  }

  /**
   * 註冊模組模擬工廠
   * @param {string} modulePath - 模組路徑
   * @param {Function} factory - 模擬工廠函數
   */
  registerMockFactory(modulePath, factory) {
    this.mockFactories.set(modulePath, factory)
    console.log(`[ExternalModuleMocker] Registered mock factory for: ${modulePath}`)
    return this
  }

  /**
   * 模擬外部模組
   * @param {string} modulePath - 模組路徑
   * @param {*} mockImplementation - 模擬實作（可選，使用註冊的工廠）
   */
  mockModule(modulePath, mockImplementation = null) {
    // 如果沒有提供模擬實作，嘗試使用註冊的工廠
    if (!mockImplementation && this.mockFactories.has(modulePath)) {
      mockImplementation = this.mockFactories.get(modulePath)()
    }

    if (!mockImplementation) {
      throw new Error(`No mock implementation provided for module: ${modulePath}`)
    }

    // 儲存原始模組（如果尚未儲存）
    if (!this.originalModules.has(modulePath)) {
      try {
        const originalModule = vi.importActual(modulePath)
        this.originalModules.set(modulePath, originalModule)
      } catch (error) {
        console.warn(`[ExternalModuleMocker] Could not import actual module: ${modulePath}`)
      }
    }

    // 應用模擬
    vi.mock(modulePath, () => mockImplementation)
    this.activeMocks.set(modulePath, mockImplementation)
    
    console.log(`[ExternalModuleMocker] Mocked module: ${modulePath}`)
    return mockImplementation
  }

  /**
   * 部分模擬模組（保留部分原始功能）
   * @param {string} modulePath - 模組路徑
   * @param {Object} partialMock - 部分模擬物件
   */
  async mockModulePartially(modulePath, partialMock) {
    const actualModule = await vi.importActual(modulePath)
    const mockImplementation = {
      ...actualModule,
      ...partialMock
    }

    return this.mockModule(modulePath, mockImplementation)
  }

  /**
   * 恢復模組的原始實作
   * @param {string} modulePath - 模組路徑
   */
  restoreModule(modulePath) {
    if (this.activeMocks.has(modulePath)) {
      vi.unmock(modulePath)
      this.activeMocks.delete(modulePath)
      console.log(`[ExternalModuleMocker] Restored module: ${modulePath}`)
    }
    return this
  }

  /**
   * 恢復所有模組
   */
  restoreAllModules() {
    for (const modulePath of this.activeMocks.keys()) {
      this.restoreModule(modulePath)
    }
    console.log('[ExternalModuleMocker] Restored all modules')
    return this
  }

  /**
   * 獲取活動模擬的統計
   */
  getStats() {
    return {
      activeMocks: this.activeMocks.size,
      registeredFactories: this.mockFactories.size,
      originalModules: this.originalModules.size
    }
  }

  /**
   * 清理所有模擬
   */
  cleanup() {
    this.restoreAllModules()
    this.activeMocks.clear()
    this.originalModules.clear()
    // 保留工廠註冊，因為它們可能在多個測試中重複使用
    console.log('[ExternalModuleMocker] Cleaned up all mocks')
    return this
  }
}

/**
 * 常用外部模組的預定義模擬工廠
 */
export const commonMockFactories = {
  // Axios HTTP 客戶端模擬
  axios: () => ({
    get: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
    post: vi.fn().mockResolvedValue({ data: {}, status: 201 }),
    put: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
    patch: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
    delete: vi.fn().mockResolvedValue({ data: {}, status: 204 }),
    create: vi.fn().mockReturnThis(),
    defaults: { headers: {} },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }),

  // Lodash 工具庫模擬
  lodash: () => ({
    debounce: vi.fn((fn) => fn),
    throttle: vi.fn((fn) => fn),
    cloneDeep: vi.fn((obj) => JSON.parse(JSON.stringify(obj))),
    merge: vi.fn((target, ...sources) => Object.assign(target, ...sources)),
    get: vi.fn((obj, path, defaultValue) => {
      const keys = path.split('.')
      let result = obj
      for (const key of keys) {
        result = result?.[key]
        if (result === undefined) return defaultValue
      }
      return result
    }),
    set: vi.fn((obj, path, value) => {
      const keys = path.split('.')
      let current = obj
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) current[keys[i]] = {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return obj
    }),
    isEmpty: vi.fn((value) => {
      if (value == null) return true
      if (Array.isArray(value) || typeof value === 'string') return value.length === 0
      if (typeof value === 'object') return Object.keys(value).length === 0
      return false
    })
  }),

  // Day.js 日期庫模擬
  dayjs: () => {
    const mockDayjs = vi.fn((date) => ({
      format: vi.fn(() => '2024-01-01 00:00:00'),
      add: vi.fn(() => mockDayjs()),
      subtract: vi.fn(() => mockDayjs()),
      startOf: vi.fn(() => mockDayjs()),
      endOf: vi.fn(() => mockDayjs()),
      isBefore: vi.fn(() => false),
      isAfter: vi.fn(() => false),
      isSame: vi.fn(() => true),
      diff: vi.fn(() => 0),
      valueOf: vi.fn(() => Date.now()),
      toDate: vi.fn(() => new Date()),
      toString: vi.fn(() => '2024-01-01T00:00:00.000Z')
    }))
    
    mockDayjs.extend = vi.fn()
    mockDayjs.locale = vi.fn()
    return mockDayjs
  },

  // Socket.io 客戶端模擬
  'socket.io-client': () => {
    const mockSocket = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      connected: true,
      id: 'mock-socket-id'
    }
    
    return {
      io: vi.fn(() => mockSocket),
      Socket: vi.fn(() => mockSocket)
    }
  },

  // Chart.js 圖表庫模擬
  'chart.js': () => ({
    Chart: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      update: vi.fn(),
      render: vi.fn(),
      resize: vi.fn(),
      clear: vi.fn(),
      toBase64Image: vi.fn(() => 'data:image/png;base64,mock-image'),
      getElementsAtEventForMode: vi.fn(() => []),
      getDatasetMeta: vi.fn(() => ({}))
    })),
    registerables: []
  }),

  // File-saver 檔案下載模擬
  'file-saver': () => ({
    saveAs: vi.fn()
  }),

  // QR Code 生成器模擬
  qrcode: () => ({
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
    toString: vi.fn().mockResolvedValue('mock-qr-string'),
    toCanvas: vi.fn().mockResolvedValue(document.createElement('canvas'))
  })
}

/**
 * 全域模組模擬器實例
 */
export const globalModuleMocker = new ExternalModuleMocker()

// 註冊常用模擬工廠
Object.entries(commonMockFactories).forEach(([modulePath, factory]) => {
  globalModuleMocker.registerMockFactory(modulePath, factory)
})

/**
 * 便利函數：快速模擬常用模組
 */
export const quickMock = {
  axios: () => globalModuleMocker.mockModule('axios'),
  lodash: () => globalModuleMocker.mockModule('lodash'),
  dayjs: () => globalModuleMocker.mockModule('dayjs'),
  socketIO: () => globalModuleMocker.mockModule('socket.io-client'),
  chartJS: () => globalModuleMocker.mockModule('chart.js'),
  fileSaver: () => globalModuleMocker.mockModule('file-saver'),
  qrcode: () => globalModuleMocker.mockModule('qrcode')
}

/**
 * 瀏覽器 API 模擬工廠
 */
export const browserAPIMocks = {
  // Geolocation API 模擬
  geolocation: {
    getCurrentPosition: vi.fn((success) => {
      success({
        coords: {
          latitude: 25.0330,
          longitude: 121.5654,
          accuracy: 10
        },
        timestamp: Date.now()
      })
    }),
    watchPosition: vi.fn(() => 1),
    clearWatch: vi.fn()
  },

  // Notification API 模擬
  notification: vi.fn().mockImplementation((title, options) => ({
    title,
    body: options?.body || '',
    icon: options?.icon || '',
    close: vi.fn(),
    onclick: null,
    onclose: null,
    onerror: null,
    onshow: null
  })),

  // IntersectionObserver API 模擬
  intersectionObserver: vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '0px',
    thresholds: [0]
  })),

  // ResizeObserver API 模擬
  resizeObserver: vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })),

  // MutationObserver API 模擬
  mutationObserver: vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  })),

  // Web Storage API 模擬
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
  },

  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
  }
}

/**
 * 設置瀏覽器 API 模擬
 */
export function setupBrowserAPIMocks() {
  // Geolocation
  Object.defineProperty(global.navigator, 'geolocation', {
    value: browserAPIMocks.geolocation,
    configurable: true
  })

  // Notification
  global.Notification = browserAPIMocks.notification
  global.Notification.permission = 'granted'
  global.Notification.requestPermission = vi.fn().mockResolvedValue('granted')

  // Observers
  global.IntersectionObserver = browserAPIMocks.intersectionObserver
  global.ResizeObserver = browserAPIMocks.resizeObserver
  global.MutationObserver = browserAPIMocks.mutationObserver

  // Storage
  Object.defineProperty(global, 'localStorage', {
    value: browserAPIMocks.localStorage,
    configurable: true
  })
  
  Object.defineProperty(global, 'sessionStorage', {
    value: browserAPIMocks.sessionStorage,
    configurable: true
  })

  console.log('[BrowserAPIMocks] Set up browser API mocks')
}

/**
 * 清理瀏覽器 API 模擬
 */
export function cleanupBrowserAPIMocks() {
  // 清理所有模擬函數的呼叫記錄
  Object.values(browserAPIMocks).forEach(mockAPI => {
    if (typeof mockAPI === 'object' && mockAPI !== null) {
      Object.values(mockAPI).forEach(fn => {
        if (vi.isMockFunction(fn)) {
          fn.mockClear()
        }
      })
    } else if (vi.isMockFunction(mockAPI)) {
      mockAPI.mockClear()
    }
  })

  console.log('[BrowserAPIMocks] Cleaned up browser API mocks')
}