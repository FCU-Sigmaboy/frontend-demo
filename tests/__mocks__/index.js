// 模擬物件統一匯出
// 第三方服務模擬
export { default as supabase } from './supabase.js'
export * from './vue-router.js'

// API 模擬
export { default as pointsAPI } from './api/pointsAPI.js'
export { default as transactionAPI } from './api/transactionAPI.js'

// 常用模擬設定
export const mockConfigurations = {
  /**
   * Supabase 認證成功設定
   */
  supabaseAuthSuccess: {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }),
      getSession: () => Promise.resolve({
        data: { session: { access_token: 'mock-token' } },
        error: null
      })
    }
  },

  /**
   * Supabase 認證失敗設定
   */
  supabaseAuthError: {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: null },
        error: { message: '未授權' }
      }),
      getSession: () => Promise.resolve({
        data: { session: null },
        error: { message: '無效的 session' }
      })
    }
  },

  /**
   * Vue Router 基本設定
   */
  vueRouterBasic: {
    currentRoute: { value: { path: '/', name: 'home' } },
    push: () => Promise.resolve(),
    replace: () => Promise.resolve()
  }
}

// 模擬工廠函數
export const createMockConfigurations = {
  /**
   * 創建自訂的 Supabase 模擬設定
   * @param {Object} overrides - 覆寫設定
   * @returns {Object} Supabase 模擬設定
   */
  supabase: (overrides = {}) => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      ...overrides.auth
    },
    from: () => ({
      select: () => ({ then: () => Promise.resolve({ data: [], error: null }) }),
      insert: () => ({ then: () => Promise.resolve({ data: null, error: null }) }),
      update: () => ({ then: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ then: () => Promise.resolve({ data: null, error: null }) })
    }),
    ...overrides
  }),

  /**
   * 創建自訂的 Vue Router 模擬設定
   * @param {Object} overrides - 覆寫設定
   * @returns {Object} Vue Router 模擬設定
   */
  vueRouter: (overrides = {}) => ({
    currentRoute: { value: { path: '/', name: 'home', params: {}, query: {} } },
    push: () => Promise.resolve(),
    replace: () => Promise.resolve(),
    go: () => {},
    back: () => {},
    forward: () => {},
    ...overrides
  })
}