// Supabase 客戶端模擬 - 完整版本
import { vi } from 'vitest'

// 測試用戶資料
export const mockTestUser = {
  id: 'test-user-id-12345',
  email: 'test@example.com',
  user_metadata: {
    nickname: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z'
}

// 測試會話資料
export const mockTestSession = {
  access_token: 'mock-access-token-12345',
  refresh_token: 'mock-refresh-token-12345',
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockTestUser
}

// 模擬認證回應
const mockAuthResponse = {
  data: {
    user: mockTestUser,
    session: mockTestSession
  },
  error: null
}

// 模擬資料庫回應
const mockDbResponse = {
  data: [],
  error: null,
  status: 200,
  statusText: 'OK'
}

// 模擬錯誤回應
export const mockErrorResponse = {
  data: null,
  error: {
    message: 'Mock error',
    details: 'This is a test error',
    hint: null,
    code: 'MOCK_ERROR'
  }
}

// 創建增強的查詢建構器模擬
const createMockQueryBuilder = (tableName = 'unknown') => {
  const queryState = {
    table: tableName,
    method: null,
    data: null,
    filters: [],
    orderBy: [],
    limit: null,
    range: null,
    select: '*'
  }

  const queryBuilder = {
    // 查詢方法
    select: vi.fn().mockImplementation((columns = '*') => {
      queryState.method = 'select'
      queryState.select = columns
      return queryBuilder
    }),
    insert: vi.fn().mockImplementation((data) => {
      queryState.method = 'insert'
      queryState.data = data
      return queryBuilder
    }),
    update: vi.fn().mockImplementation((data) => {
      queryState.method = 'update'
      queryState.data = data
      return queryBuilder
    }),
    delete: vi.fn().mockImplementation(() => {
      queryState.method = 'delete'
      return queryBuilder
    }),
    upsert: vi.fn().mockImplementation((data) => {
      queryState.method = 'upsert'
      queryState.data = data
      return queryBuilder
    }),

    // 過濾方法
    eq: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'eq', column, value })
      return queryBuilder
    }),
    neq: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'neq', column, value })
      return queryBuilder
    }),
    gt: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'gt', column, value })
      return queryBuilder
    }),
    gte: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'gte', column, value })
      return queryBuilder
    }),
    lt: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'lt', column, value })
      return queryBuilder
    }),
    lte: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'lte', column, value })
      return queryBuilder
    }),
    like: vi.fn().mockImplementation((column, pattern) => {
      queryState.filters.push({ type: 'like', column, value: pattern })
      return queryBuilder
    }),
    ilike: vi.fn().mockImplementation((column, pattern) => {
      queryState.filters.push({ type: 'ilike', column, value: pattern })
      return queryBuilder
    }),
    is: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'is', column, value })
      return queryBuilder
    }),
    in: vi.fn().mockImplementation((column, values) => {
      queryState.filters.push({ type: 'in', column, value: values })
      return queryBuilder
    }),
    contains: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'contains', column, value })
      return queryBuilder
    }),
    containedBy: vi.fn().mockImplementation((column, value) => {
      queryState.filters.push({ type: 'containedBy', column, value })
      return queryBuilder
    }),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockImplementation((query) => {
      Object.entries(query).forEach(([column, value]) => {
        queryState.filters.push({ type: 'eq', column, value })
      })
      return queryBuilder
    }),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),

    // 排序和分頁
    order: vi.fn().mockImplementation((column, options = {}) => {
      queryState.orderBy.push({ column, ...options })
      return queryBuilder
    }),
    limit: vi.fn().mockImplementation((count) => {
      queryState.limit = count
      return queryBuilder
    }),
    range: vi.fn().mockImplementation((from, to) => {
      queryState.range = { from, to }
      return queryBuilder
    }),

    // 執行方法
    single: vi.fn().mockImplementation(() => {
      console.log(`Mock query executed on ${tableName}:`, queryState)
      return Promise.resolve(mockDbResponse)
    }),
    maybeSingle: vi.fn().mockImplementation(() => {
      console.log(`Mock query executed on ${tableName}:`, queryState)
      return Promise.resolve(mockDbResponse)
    }),
    then: vi.fn().mockImplementation((onResolve) => {
      console.log(`Mock query executed on ${tableName}:`, queryState)
      const result = mockDbResponse
      return Promise.resolve(result).then(onResolve)
    }),

    // 其他方法
    csv: vi.fn().mockResolvedValue(''),
    geojson: vi.fn().mockResolvedValue({}),
    explain: vi.fn().mockResolvedValue(mockDbResponse),
    rollback: vi.fn().mockResolvedValue(mockDbResponse),
    returns: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),

    // 內部狀態存取（用於測試驗證）
    _getQueryState: () => ({ ...queryState }),
    _resetQueryState: () => {
      queryState.method = null
      queryState.data = null
      queryState.filters = []
      queryState.orderBy = []
      queryState.limit = null
      queryState.range = null
      queryState.select = '*'
    }
  }

  return queryBuilder
}

// 模擬 Supabase 客戶端
export const supabase = {
  // 認證相關
  auth: {
    getUser: vi.fn().mockResolvedValue(mockAuthResponse),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signUp: vi.fn().mockResolvedValue(mockAuthResponse),
    signInWithPassword: vi.fn().mockResolvedValue(mockAuthResponse),
    signInWithOAuth: vi.fn().mockResolvedValue(mockAuthResponse),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue(mockAuthResponse),
    setSession: vi.fn().mockResolvedValue(mockAuthResponse),
    refreshSession: vi.fn().mockResolvedValue(mockAuthResponse),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  },

  // 資料庫相關
  from: vi.fn().mockImplementation(() => createMockQueryBuilder()),
  
  // RPC 呼叫
  rpc: vi.fn().mockResolvedValue(mockDbResponse),
  
  // 儲存相關
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ 
        data: { signedUrl: 'https://example.com/signed-url' }, 
        error: null 
      }),
      createSignedUrls: vi.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      }),
      getPublicUrl: vi.fn().mockReturnValue({ 
        data: { publicUrl: 'https://example.com/public-url' } 
      })
    })
  },

  // 即時訂閱
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({
      unsubscribe: vi.fn()
    })
  }),

  // 移除頻道
  removeChannel: vi.fn(),
  removeAllChannels: vi.fn(),
  getChannels: vi.fn().mockReturnValue([])
}

// 預設匯出
export default supabase