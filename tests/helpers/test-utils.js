// 測試輔助工具函數
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

// 匯入其他測試工具
export { testEnv, useTestEnvironment, TestDataGenerator } from './test-environment.js'
export { TestNamingHelper, TestOrganizer, TestTagger } from './test-naming.js'
export { 
  createVueTestEnvironment, 
  mountVueComponent, 
  createComponentTestSuite 
} from './vue-test-utils.js'
export { 
  createMockAuthStore, 
  createMockPointsStore, 
  createMockTransactionStore, 
  createMockStores 
} from '../__mocks__/pinia-stores.js'

/**
 * 創建測試用的 Pinia 實例，支援自動模擬和狀態隔離
 * @param {Object} options - 配置選項
 * @param {boolean} options.stubActions - 是否模擬所有 actions
 * @param {Object} options.initialState - 初始狀態
 * @param {Object} options.plugins - 要安裝的插件
 * @returns {Object} 包含 pinia 實例和輔助方法的物件
 */
export function createTestingPinia(options = {}) {
  const { stubActions = true, initialState = {}, plugins = [] } = options
  
  const pinia = createPinia()
  
  // 安裝插件
  plugins.forEach(plugin => pinia.use(plugin))
  
  // 設定為活動實例
  setActivePinia(pinia)
  
  // 如果需要模擬 actions，創建模擬插件
  if (stubActions) {
    const mockPlugin = ({ store }) => {
      // 模擬所有 actions
      Object.keys(store.$state).forEach(key => {
        if (typeof store[key] === 'function') {
          store[key] = vi.fn(store[key])
        }
      })
    }
    pinia.use(mockPlugin)
  }
  
  // 設定初始狀態
  if (Object.keys(initialState).length > 0) {
    const statePlugin = ({ store }) => {
      const storeInitialState = initialState[store.$id]
      if (storeInitialState) {
        store.$patch(storeInitialState)
      }
    }
    pinia.use(statePlugin)
  }
  
  return {
    pinia,
    // 輔助方法
    mockStore: (storeId, mockState = {}) => {
      const store = pinia._s.get(storeId)
      if (store) {
        store.$patch(mockState)
      }
      return store
    },
    resetStore: (storeId) => {
      const store = pinia._s.get(storeId)
      if (store && store.$reset) {
        store.$reset()
      }
    },
    resetAllStores: () => {
      pinia._s.forEach(store => {
        if (store.$reset) {
          store.$reset()
        }
      })
    }
  }
}

/**
 * 標準化的 Vue 組件掛載函數，支援自動依賴注入和模擬
 * @param {Component} component - 要掛載的組件
 * @param {Object} options - 掛載選項
 * @param {Object} options.props - 組件 props
 * @param {Object} options.slots - 組件插槽
 * @param {Object} options.storeState - Pinia store 初始狀態
 * @param {Object} options.routeOptions - 路由選項
 * @param {boolean} options.shallow - 是否使用淺層掛載
 * @param {Object} options.supabaseOverrides - Supabase 客戶端覆寫
 * @returns {VueWrapper} 掛載的組件包裝器
 */
export function mountComponent(component, options = {}) {
  const {
    props = {},
    slots = {},
    storeState = {},
    routeOptions = {},
    shallow = false,
    supabaseOverrides = {},
    ...restOptions
  } = options

  // 創建測試用的 Pinia 實例
  const { pinia } = createTestingPinia({
    initialState: storeState,
    stubActions: true
  })

  // 創建模擬的路由器和路由
  const { router, route } = mockRouter(routeOptions)

  // 創建模擬的 Supabase 客戶端
  const mockSupabase = createMockSupabaseClient(supabaseOverrides)

  const defaultOptions = {
    props,
    slots,
    global: {
      plugins: [pinia],
      stubs: {
        'router-link': true,
        'router-view': true,
        'transition': false,
        'transition-group': false,
        // 常用的第三方組件存根
        'v-tooltip': true,
        'v-loading': true,
        ...restOptions.global?.stubs
      },
      mocks: {
        $router: router,
        $route: route,
        $supabase: mockSupabase,
        // 常用的全域方法模擬
        $t: (key) => key, // i18n 模擬
        $tc: (key, count) => `${key} ${count}`,
        $d: (date) => date?.toString() || '',
        $n: (number) => number?.toString() || '0',
        ...restOptions.global?.mocks
      },
      provide: {
        // 提供常用的依賴注入
        supabase: mockSupabase,
        ...restOptions.global?.provide
      },
      components: {
        // 註冊常用的測試組件
        ...restOptions.global?.components
      }
    },
    attachTo: document.body, // 確保事件正確觸發
    ...restOptions
  }

  // 合併選項
  const mergedOptions = {
    ...defaultOptions,
    global: {
      ...defaultOptions.global,
      plugins: [
        ...defaultOptions.global.plugins,
        ...(restOptions.global?.plugins || [])
      ]
    }
  }

  // 根據 shallow 選項選擇掛載方式
  const mountFn = shallow ? shallowMount : mount
  const wrapper = mountFn(component, mergedOptions)

  // 增強包裝器，添加便利方法
  wrapper.mockSupabase = mockSupabase
  wrapper.mockRouter = router
  wrapper.mockRoute = route
  wrapper.pinia = pinia

  // 添加便利的查找方法
  wrapper.findByTestId = (testId) => wrapper.find(`[data-testid="${testId}"]`)
  wrapper.findAllByTestId = (testId) => wrapper.findAll(`[data-testid="${testId}"]`)
  wrapper.findByRole = (role) => wrapper.find(`[role="${role}"]`)
  wrapper.findAllByRole = (role) => wrapper.findAll(`[role="${role}"]`)

  // 添加便利的事件觸發方法
  wrapper.clickByTestId = async (testId) => {
    const element = wrapper.findByTestId(testId)
    await element.trigger('click')
    await wrapper.vm.$nextTick()
  }

  wrapper.typeInInput = async (selector, value) => {
    const input = wrapper.find(selector)
    await input.setValue(value)
    await input.trigger('input')
    await wrapper.vm.$nextTick()
  }

  return wrapper
}

/**
 * 淺層掛載組件（不渲染子組件）
 * @param {Component} component - 要掛載的組件
 * @param {Object} options - 掛載選項
 * @returns {VueWrapper} 掛載的組件包裝器
 */
export function shallowMountComponent(component, options = {}) {
  const defaultOptions = {
    global: {
      plugins: [createTestingPinia()],
      stubs: {
        'router-link': true,
        'router-view': true
      }
    }
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    global: {
      ...defaultOptions.global,
      ...options.global
    }
  }

  return shallowMount(component, mergedOptions)
}

/**
 * 創建增強的 Vue Router 模擬，支援導航守衛和路由解析
 * @param {Object} routeOptions - 路由選項
 * @param {Array} routes - 路由配置
 * @returns {Object} 模擬的路由器和路由物件
 */
export function mockRouter(routeOptions = {}, routes = []) {
  const mockRoute = {
    params: {},
    query: {},
    hash: '',
    path: '/',
    name: 'home',
    fullPath: '/',
    matched: [],
    meta: {},
    redirectedFrom: undefined,
    ...routeOptions
  }

  // 創建路由記錄
  const routeRecords = routes.length > 0 ? routes : [
    { path: '/', name: 'home', component: {} },
    { path: '/profile', name: 'profile', component: {} },
    { path: '/dashboard', name: 'dashboard', component: {} }
  ]

  const mockRouterInstance = {
    // 導航方法
    push: vi.fn().mockImplementation((to) => {
      console.log('Router push called with:', to)
      return Promise.resolve()
    }),
    replace: vi.fn().mockImplementation((to) => {
      console.log('Router replace called with:', to)
      return Promise.resolve()
    }),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),

    // 路由狀態
    currentRoute: { value: mockRoute },
    options: { routes: routeRecords },

    // 路由管理
    addRoute: vi.fn(),
    removeRoute: vi.fn(),
    hasRoute: vi.fn().mockReturnValue(true),
    getRoutes: vi.fn().mockReturnValue(routeRecords),

    // 路由解析
    resolve: vi.fn().mockImplementation((to) => {
      const resolved = typeof to === 'string' 
        ? { path: to, name: null }
        : { path: to.path || '/', name: to.name || null }
      
      return {
        href: resolved.path,
        route: {
          ...mockRoute,
          ...resolved,
          fullPath: resolved.path
        }
      }
    }),

    // 導航守衛
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),

    // 準備狀態
    isReady: vi.fn().mockResolvedValue(true),

    // 輔助方法
    updateRoute: (newRouteData) => {
      Object.assign(mockRoute, newRouteData)
      mockRouterInstance.currentRoute.value = mockRoute
    },

    // 模擬導航
    simulateNavigation: async (to) => {
      const resolved = mockRouterInstance.resolve(to)
      mockRouterInstance.updateRoute(resolved.route)
      return resolved
    }
  }

  return {
    router: mockRouterInstance,
    route: mockRoute,
    // 便利方法
    setRoute: (newRoute) => mockRouterInstance.updateRoute(newRoute),
    navigateTo: (to) => mockRouterInstance.simulateNavigation(to)
  }
}

/**
 * 等待 Vue 的下一個 tick
 * @returns {Promise} Promise
 */
export async function nextTick() {
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}

/**
 * 等待指定的毫秒數
 * @param {number} ms - 等待的毫秒數
 * @returns {Promise} Promise
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 觸發 DOM 事件
 * @param {Element} element - 目標元素
 * @param {string} eventType - 事件類型
 * @param {Object} eventData - 事件資料
 */
export function triggerEvent(element, eventType, eventData = {}) {
  const event = new Event(eventType, { bubbles: true, cancelable: true })
  Object.assign(event, eventData)
  element.dispatchEvent(event)
}

/**
 * 模擬用戶輸入
 * @param {VueWrapper} wrapper - 組件包裝器
 * @param {string} selector - 輸入元素選擇器
 * @param {string} value - 輸入值
 */
export async function setInputValue(wrapper, selector, value) {
  const input = wrapper.find(selector)
  await input.setValue(value)
  await input.trigger('input')
  await wrapper.vm.$nextTick()
}

/**
 * 模擬點擊事件
 * @param {VueWrapper} wrapper - 組件包裝器
 * @param {string} selector - 元素選擇器
 */
export async function clickElement(wrapper, selector) {
  const element = wrapper.find(selector)
  await element.trigger('click')
  await wrapper.vm.$nextTick()
}

/**
 * 清理測試環境
 * 重置所有模擬和清理 DOM
 */
export function cleanupTestEnvironment() {
  // 清理所有 Vitest 模擬
  vi.clearAllMocks()
  vi.resetAllMocks()
  
  // 清理 DOM
  document.body.innerHTML = ''
  
  // 清理 localStorage 和 sessionStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // 重置 Pinia 狀態
  if (window.__PINIA__) {
    window.__PINIA__ = undefined
  }
}

/**
 * 設置測試環境
 * 初始化必要的全域物件和模擬
 */
export function setupTestEnvironment() {
  // 模擬 ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // 模擬 IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // 模擬 matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  // 模擬 scrollTo
  window.scrollTo = vi.fn()
  
  // 模擬 alert, confirm, prompt
  window.alert = vi.fn()
  window.confirm = vi.fn(() => true)
  window.prompt = vi.fn(() => 'test')
}

/**
 * 創建完整的 Supabase 客戶端模擬，支援所有主要功能
 * @param {Object} overrides - 覆寫的方法或屬性
 * @param {Object} defaultResponses - 預設回應資料
 * @returns {Object} 模擬的 Supabase 客戶端
 */
export function createMockSupabaseClient(overrides = {}, defaultResponses = {}) {
  // 預設的認證回應
  const defaultAuthResponse = {
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          nickname: 'Test User'
        }
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000
      }
    },
    error: null
  }

  // 預設的資料庫回應
  const defaultDbResponse = {
    data: [],
    error: null,
    status: 200,
    statusText: 'OK'
  }

  // 創建查詢建構器模擬
  const createMockQueryBuilder = (tableName = 'unknown') => {
    const queryBuilder = {
      // 查詢方法
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),

      // 過濾方法
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),

      // 排序和分頁
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),

      // 執行方法
      single: vi.fn().mockResolvedValue(defaultResponses[tableName]?.single || defaultDbResponse),
      maybeSingle: vi.fn().mockResolvedValue(defaultResponses[tableName]?.maybeSingle || defaultDbResponse),
      then: vi.fn().mockResolvedValue(defaultResponses[tableName]?.select || defaultDbResponse),

      // 其他方法
      csv: vi.fn().mockResolvedValue(''),
      geojson: vi.fn().mockResolvedValue({}),
      explain: vi.fn().mockResolvedValue(defaultDbResponse),
      rollback: vi.fn().mockResolvedValue(defaultDbResponse),
      returns: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),

      // 內部狀態追蹤
      _tableName: tableName,
      _query: {
        method: null,
        filters: [],
        orderBy: [],
        limit: null,
        range: null
      }
    }

    return queryBuilder
  }

  // 創建即時訂閱模擬
  const createMockChannel = (channelName) => {
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        if (callback) {
          setTimeout(() => callback('SUBSCRIBED'), 0)
        }
        return {
          unsubscribe: vi.fn()
        }
      }),
      unsubscribe: vi.fn(),
      _channelName: channelName,
      _listeners: []
    }

    return channel
  }

  const mockClient = {
    // 認證相關
    auth: {
      getUser: vi.fn().mockResolvedValue(defaultResponses.auth?.getUser || defaultAuthResponse),
      getSession: vi.fn().mockResolvedValue(defaultResponses.auth?.getSession || { data: { session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue(defaultResponses.auth?.signUp || defaultAuthResponse),
      signInWithPassword: vi.fn().mockResolvedValue(defaultResponses.auth?.signInWithPassword || defaultAuthResponse),
      signInWithOAuth: vi.fn().mockResolvedValue(defaultResponses.auth?.signInWithOAuth || defaultAuthResponse),
      signOut: vi.fn().mockResolvedValue(defaultResponses.auth?.signOut || { error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue(defaultResponses.auth?.resetPasswordForEmail || { error: null }),
      updateUser: vi.fn().mockResolvedValue(defaultResponses.auth?.updateUser || defaultAuthResponse),
      setSession: vi.fn().mockResolvedValue(defaultResponses.auth?.setSession || defaultAuthResponse),
      refreshSession: vi.fn().mockResolvedValue(defaultResponses.auth?.refreshSession || defaultAuthResponse),
      onAuthStateChange: vi.fn().mockImplementation((callback) => {
        // 模擬認證狀態變化
        if (callback) {
          setTimeout(() => callback('SIGNED_IN', defaultAuthResponse.data.session), 0)
        }
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      }),
      ...overrides.auth
    },

    // 資料庫相關
    from: vi.fn().mockImplementation((tableName) => {
      return createMockQueryBuilder(tableName)
    }),

    // RPC 呼叫
    rpc: vi.fn().mockResolvedValue(defaultResponses.rpc || defaultDbResponse),

    // 儲存相關
    storage: {
      from: vi.fn().mockImplementation((bucketName) => ({
        upload: vi.fn().mockResolvedValue(defaultResponses.storage?.upload || { data: null, error: null }),
        download: vi.fn().mockResolvedValue(defaultResponses.storage?.download || { data: null, error: null }),
        list: vi.fn().mockResolvedValue(defaultResponses.storage?.list || { data: [], error: null }),
        remove: vi.fn().mockResolvedValue(defaultResponses.storage?.remove || { data: [], error: null }),
        createSignedUrl: vi.fn().mockResolvedValue(defaultResponses.storage?.createSignedUrl || { 
          data: { signedUrl: `https://example.com/signed-url/${bucketName}` }, 
          error: null 
        }),
        createSignedUrls: vi.fn().mockResolvedValue(defaultResponses.storage?.createSignedUrls || { 
          data: [], 
          error: null 
        }),
        getPublicUrl: vi.fn().mockImplementation((path) => ({ 
          data: { publicUrl: `https://example.com/public/${bucketName}/${path}` } 
        })),
        _bucketName: bucketName
      }))
    },

    // 即時訂閱
    channel: vi.fn().mockImplementation((channelName) => {
      return createMockChannel(channelName)
    }),

    // 頻道管理
    removeChannel: vi.fn().mockResolvedValue(true),
    removeAllChannels: vi.fn().mockResolvedValue(true),
    getChannels: vi.fn().mockReturnValue([]),

    // 輔助方法
    _reset: () => {
      // 重置所有模擬的呼叫記錄
      Object.values(mockClient.auth).forEach(fn => {
        if (vi.isMockFunction(fn)) fn.mockClear()
      })
      mockClient.from.mockClear()
      mockClient.rpc.mockClear()
      mockClient.channel.mockClear()
    },

    _setResponse: (path, response) => {
      // 動態設定回應資料
      const keys = path.split('.')
      let target = defaultResponses
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {}
        target = target[keys[i]]
      }
      target[keys[keys.length - 1]] = response
    },

    ...overrides
  }

  return mockClient
}

/**
 * 等待所有 Promise 完成
 * @returns {Promise} Promise
 */
export async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve))
}

/**
 * 模擬時間控制
 * @returns {Object} 時間控制物件
 */
export function createTimeController() {
  vi.useFakeTimers()
  
  return {
    advanceTime: (ms) => vi.advanceTimersByTime(ms),
    runAllTimers: () => vi.runAllTimers(),
    runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
    restore: () => vi.useRealTimers()
  }
}

/**
 * 創建測試用的錯誤處理器
 * @returns {Object} 錯誤處理器
 */
export function createErrorHandler() {
  const errors = []
  
  const handler = (error) => {
    errors.push(error)
  }
  
  return {
    handler,
    errors,
    clear: () => errors.splice(0, errors.length),
    hasErrors: () => errors.length > 0,
    getLastError: () => errors[errors.length - 1]
  }
}