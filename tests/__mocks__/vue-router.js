// Vue Router 模擬 - 增強版本
import { vi } from 'vitest'
import { ref, reactive } from 'vue'

// 預設路由配置
const defaultRoutes = [
  { path: '/', name: 'home', component: {}, meta: { title: '首頁' } },
  { path: '/profile', name: 'profile', component: {}, meta: { title: '個人資料', requiresAuth: true } },
  { path: '/dashboard', name: 'dashboard', component: {}, meta: { title: '儀表板', requiresAuth: true } },
  { path: '/messages', name: 'messages', component: {}, meta: { title: '訊息', requiresAuth: true } },
  { path: '/transactions', name: 'transactions', component: {}, meta: { title: '交易記錄', requiresAuth: true } },
  { path: '/items', name: 'items', component: {}, meta: { title: '物品列表' } },
  { path: '/items/:id', name: 'item-detail', component: {}, meta: { title: '物品詳情' } },
  { path: '/create-listing', name: 'create-listing', component: {}, meta: { title: '發布物品', requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: {}, meta: { title: '我的收藏', requiresAuth: true } },
  { path: '/about', name: 'about', component: {}, meta: { title: '關於我們' } },
  { path: '/faq', name: 'faq', component: {}, meta: { title: '常見問題' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: {}, meta: { title: '頁面不存在' } }
]

// 創建響應式路由狀態
const routeState = reactive({
  params: {},
  query: {},
  hash: '',
  path: '/',
  name: 'home',
  fullPath: '/',
  matched: [],
  meta: {},
  redirectedFrom: undefined
})

// 模擬路由物件
const mockRoute = routeState

// 導航歷史記錄
const navigationHistory = []
let currentHistoryIndex = -1

// 模擬路由器物件
const mockRouter = {
  // 導航方法
  push: vi.fn().mockImplementation(async (to) => {
    const resolved = mockRouter.resolve(to)
    const newRoute = resolved.route
    
    // 記錄導航歷史
    navigationHistory.splice(currentHistoryIndex + 1)
    navigationHistory.push({ ...newRoute })
    currentHistoryIndex = navigationHistory.length - 1
    
    // 更新當前路由
    Object.assign(routeState, newRoute)
    
    console.log(`[MockRouter] Navigated to: ${newRoute.path}`)
    return Promise.resolve()
  }),
  
  replace: vi.fn().mockImplementation(async (to) => {
    const resolved = mockRouter.resolve(to)
    const newRoute = resolved.route
    
    // 替換當前歷史記錄
    if (currentHistoryIndex >= 0) {
      navigationHistory[currentHistoryIndex] = { ...newRoute }
    } else {
      navigationHistory.push({ ...newRoute })
      currentHistoryIndex = 0
    }
    
    // 更新當前路由
    Object.assign(routeState, newRoute)
    
    console.log(`[MockRouter] Replaced route with: ${newRoute.path}`)
    return Promise.resolve()
  }),
  
  go: vi.fn().mockImplementation((delta) => {
    const newIndex = currentHistoryIndex + delta
    if (newIndex >= 0 && newIndex < navigationHistory.length) {
      currentHistoryIndex = newIndex
      const newRoute = navigationHistory[currentHistoryIndex]
      Object.assign(routeState, newRoute)
      console.log(`[MockRouter] Went ${delta} steps to: ${newRoute.path}`)
    }
  }),
  
  back: vi.fn().mockImplementation(() => mockRouter.go(-1)),
  forward: vi.fn().mockImplementation(() => mockRouter.go(1)),

  // 路由狀態
  currentRoute: { value: mockRoute },
  options: { routes: defaultRoutes },

  // 路由管理
  addRoute: vi.fn().mockImplementation((route) => {
    defaultRoutes.push(route)
    console.log(`[MockRouter] Added route: ${route.path}`)
  }),
  
  removeRoute: vi.fn().mockImplementation((name) => {
    const index = defaultRoutes.findIndex(route => route.name === name)
    if (index !== -1) {
      defaultRoutes.splice(index, 1)
      console.log(`[MockRouter] Removed route: ${name}`)
    }
  }),
  
  hasRoute: vi.fn().mockImplementation((name) => {
    return defaultRoutes.some(route => route.name === name)
  }),
  
  getRoutes: vi.fn().mockReturnValue(defaultRoutes),

  // 路由解析
  resolve: vi.fn().mockImplementation((to) => {
    let resolved = { path: '/', name: null, params: {}, query: {}, hash: '', meta: {} }
    
    if (typeof to === 'string') {
      // 字符串路徑
      const url = new URL(to, 'http://localhost')
      resolved.path = url.pathname
      resolved.fullPath = to
      
      // 解析查詢參數
      url.searchParams.forEach((value, key) => {
        resolved.query[key] = value
      })
      
      resolved.hash = url.hash
      
      // 尋找匹配的路由
      const matchedRoute = defaultRoutes.find(route => {
        if (route.path === resolved.path) return true
        // 簡單的動態路由匹配
        const routeRegex = route.path.replace(/:([^/]+)/g, '([^/]+)')
        const regex = new RegExp(`^${routeRegex}$`)
        return regex.test(resolved.path)
      })
      
      if (matchedRoute) {
        resolved.name = matchedRoute.name
        resolved.meta = matchedRoute.meta || {}
        resolved.matched = [matchedRoute]
        
        // 解析路由參數
        if (matchedRoute.path.includes(':')) {
          const routeRegex = matchedRoute.path.replace(/:([^/]+)/g, '([^/]+)')
          const regex = new RegExp(`^${routeRegex}$`)
          const matches = resolved.path.match(regex)
          if (matches) {
            const paramNames = matchedRoute.path.match(/:([^/]+)/g)?.map(p => p.slice(1)) || []
            paramNames.forEach((name, index) => {
              resolved.params[name] = matches[index + 1]
            })
          }
        }
      }
    } else if (typeof to === 'object') {
      // 路由物件
      if (to.name) {
        const matchedRoute = defaultRoutes.find(route => route.name === to.name)
        if (matchedRoute) {
          resolved.name = to.name
          resolved.path = matchedRoute.path
          resolved.meta = matchedRoute.meta || {}
          resolved.matched = [matchedRoute]
          
          // 替換路由參數
          if (to.params && matchedRoute.path.includes(':')) {
            let path = matchedRoute.path
            Object.entries(to.params).forEach(([key, value]) => {
              path = path.replace(`:${key}`, value)
            })
            resolved.path = path
          }
        }
      } else if (to.path) {
        resolved.path = to.path
      }
      
      resolved.params = { ...resolved.params, ...to.params }
      resolved.query = { ...resolved.query, ...to.query }
      resolved.hash = to.hash || resolved.hash
      
      // 構建完整路徑
      const queryString = new URLSearchParams(resolved.query).toString()
      resolved.fullPath = resolved.path + 
        (queryString ? `?${queryString}` : '') + 
        (resolved.hash || '')
    }
    
    return {
      href: resolved.fullPath,
      route: resolved
    }
  }),

  // 導航守衛
  beforeEach: vi.fn(),
  beforeResolve: vi.fn(),
  afterEach: vi.fn(),
  onError: vi.fn(),

  // 準備狀態
  isReady: vi.fn().mockResolvedValue(true),

  // 測試輔助方法
  _setCurrentRoute: (route) => {
    Object.assign(routeState, route)
  },
  
  _getNavigationHistory: () => [...navigationHistory],
  
  _clearHistory: () => {
    navigationHistory.length = 0
    currentHistoryIndex = -1
  },
  
  _reset: () => {
    Object.assign(routeState, {
      params: {},
      query: {},
      hash: '',
      path: '/',
      name: 'home',
      fullPath: '/',
      matched: [],
      meta: {},
      redirectedFrom: undefined
    })
    mockRouter._clearHistory()
    
    // 清除所有模擬函數的呼叫記錄
    Object.values(mockRouter).forEach(fn => {
      if (vi.isMockFunction(fn)) {
        fn.mockClear()
      }
    })
  }
}

// 匯出模擬的 composables
export const useRouter = vi.fn(() => mockRouter)
export const useRoute = vi.fn(() => mockRoute)

// 匯出模擬的路由器創建函數
export const createRouter = vi.fn(() => mockRouter)
export const createWebHistory = vi.fn(() => ({}))
export const createWebHashHistory = vi.fn(() => ({}))
export const createMemoryHistory = vi.fn(() => ({}))

// 匯出模擬的組件
export const RouterLink = 'router-link'
export const RouterView = 'router-view'

// 匯出模擬的導航守衛
export const onBeforeRouteEnter = vi.fn()
export const onBeforeRouteUpdate = vi.fn()
export const onBeforeRouteLeave = vi.fn()

// 匯出模擬的路由匹配器
export const createRouterMatcher = vi.fn()

// 預設匯出
export default {
  useRouter,
  useRoute,
  createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory,
  RouterLink,
  RouterView,
  onBeforeRouteEnter,
  onBeforeRouteUpdate,
  onBeforeRouteLeave
}