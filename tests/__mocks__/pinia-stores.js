// Pinia Store 模擬系統
import { vi } from 'vitest'
import { ref, computed, reactive } from 'vue'

/**
 * 創建模擬的認證 Store
 * @param {Object} initialState - 初始狀態
 * @returns {Object} 模擬的認證 Store
 */
export function createMockAuthStore(initialState = {}) {
  const defaultState = {
    isLoggedIn: false,
    user: null,
    session: null,
    profileData: null,
    isLoadingProfile: false
  }

  const state = reactive({ ...defaultState, ...initialState })

  const store = {
    // 狀態
    isLoggedIn: computed(() => state.isLoggedIn),
    user: computed(() => state.user),
    session: computed(() => state.session),
    profileData: computed(() => state.profileData),
    isLoadingProfile: computed(() => state.isLoadingProfile),

    // Getters
    userName: computed(() => {
      if (!state.user) return '訪客'
      if (!state.profileData) return '使用者'
      return state.profileData.nickname || '使用者'
    }),
    userEmail: computed(() => {
      if (!state.user) return ''
      return state.profileData?.email || state.user.email || ''
    }),
    userAvatar: computed(() => {
      if (!state.user) return ''
      return state.profileData?.profile_picture_url || ''
    }),

    // Actions (模擬)
    signInWithGoogle: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockImplementation(() => {
      state.isLoggedIn = false
      state.user = null
      state.session = null
      state.profileData = null
      return Promise.resolve()
    }),
    initAuth: vi.fn().mockResolvedValue(),
    setSession: vi.fn().mockImplementation((newSession) => {
      state.session = newSession
      state.user = newSession?.user || null
      state.isLoggedIn = !!newSession
    }),
    updateCustomProfile: vi.fn().mockResolvedValue(),
    loadCustomProfile: vi.fn().mockResolvedValue(),

    // 測試輔助方法
    $patch: (updates) => {
      Object.assign(state, updates)
    },
    $reset: () => {
      Object.assign(state, defaultState)
    },
    $state: state,
    $id: 'auth'
  }

  return store
}

/**
 * 創建模擬的積分 Store
 * @param {Object} initialState - 初始狀態
 * @returns {Object} 模擬的積分 Store
 */
export function createMockPointsStore(initialState = {}) {
  const defaultState = {
    profile: null,
    transactions: [],
    badges: [],
    badgeProgress: [],
    isLoadingProfile: false,
    isLoadingTransactions: false,
    isLoadingBadges: false,
    lastProfileFetch: null,
    lastTransactionsFetch: null,
    lastBadgesFetch: null,
    transactionsHasMore: true,
    transactionsFilter: null,
    transactionsPage: 1
  }

  const state = reactive({ ...defaultState, ...initialState })

  const store = {
    // 狀態
    profile: computed(() => state.profile),
    transactions: computed(() => state.transactions),
    badges: computed(() => state.badges),
    badgeProgress: computed(() => state.badgeProgress),
    isLoadingProfile: computed(() => state.isLoadingProfile),
    isLoadingTransactions: computed(() => state.isLoadingTransactions),
    isLoadingBadges: computed(() => state.isLoadingBadges),
    transactionsHasMore: computed(() => state.transactionsHasMore),
    transactionsFilter: computed(() => state.transactionsFilter),
    transactionsPage: computed(() => state.transactionsPage),

    // Getters
    currentBalance: computed(() => state.profile?.current_balance || 0),
    totalEarned: computed(() => state.profile?.total_earned || 0),
    totalSpent: computed(() => state.profile?.total_spent || 0),
    dailyStreak: computed(() => state.profile?.daily_streak || 0),
    lastSigninDate: computed(() => state.profile?.last_signin_date || null),
    hasSignedInToday: computed(() => {
      if (!state.profile?.last_signin_date) return false
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
      return state.profile.last_signin_date === today
    }),
    earnedBadgesCount: computed(() => state.badges.length),
    inProgressBadgesCount: computed(() => state.badgeProgress.length),

    // Actions (模擬)
    fetchProfile: vi.fn().mockImplementation(async (forceRefresh = false) => {
      state.isLoadingProfile = true
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 100))
      state.isLoadingProfile = false
      return state.profile
    }),
    fetchTransactions: vi.fn().mockImplementation(async (params = {}, forceRefresh = false) => {
      state.isLoadingTransactions = true
      await new Promise(resolve => setTimeout(resolve, 100))
      state.isLoadingTransactions = false
      return {
        transactions: state.transactions,
        total: state.transactions.length,
        page: 1,
        hasMore: state.transactionsHasMore
      }
    }),
    performDailySignIn: vi.fn().mockImplementation(async () => {
      const result = {
        success: true,
        points_awarded: 10,
        streak_day: (state.profile?.daily_streak || 0) + 1,
        new_balance: (state.profile?.current_balance || 0) + 10
      }
      
      if (state.profile) {
        state.profile.current_balance = result.new_balance
        state.profile.daily_streak = result.streak_day
        state.profile.last_signin_date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
      }
      
      return result
    }),
    fetchBadges: vi.fn().mockImplementation(async (forceRefresh = false) => {
      state.isLoadingBadges = true
      await new Promise(resolve => setTimeout(resolve, 100))
      state.isLoadingBadges = false
      return {
        earned: state.badges,
        inProgress: state.badgeProgress
      }
    }),
    triggerBadgeCheck: vi.fn().mockResolvedValue({ newly_earned_count: 0 }),
    canListItem: vi.fn().mockResolvedValue({ can_list: true }),
    updateBalance: vi.fn().mockImplementation((amount, type) => {
      if (state.profile) {
        state.profile.current_balance += amount
        if (amount > 0) {
          state.profile.total_earned += amount
        } else {
          state.profile.total_spent += Math.abs(amount)
        }
      }
    }),
    invalidateCache: vi.fn().mockImplementation(() => {
      state.lastProfileFetch = null
      state.lastTransactionsFetch = null
      state.lastBadgesFetch = null
    }),
    resetStore: vi.fn().mockImplementation(() => {
      Object.assign(state, defaultState)
    }),

    // 測試輔助方法
    $patch: (updates) => {
      Object.assign(state, updates)
    },
    $reset: () => {
      Object.assign(state, defaultState)
    },
    $state: state,
    $id: 'points'
  }

  return store
}

/**
 * 創建模擬的交易 Store
 * @param {Object} initialState - 初始狀態
 * @returns {Object} 模擬的交易 Store
 */
export function createMockTransactionStore(initialState = {}) {
  const defaultState = {
    confirming: { giver: [], receiver: [] },
    pending: { giver: [], receiver: [] },
    completed: { giver: [], receiver: [] },
    isLoading: false,
    lastFetchTime: null,
    error: null,
    isRealtimeActive: false
  }

  const state = reactive({ ...defaultState, ...initialState })

  const store = {
    // 狀態
    confirming: computed(() => state.confirming),
    pending: computed(() => state.pending),
    completed: computed(() => state.completed),
    isLoading: computed(() => state.isLoading),
    lastFetchTime: computed(() => state.lastFetchTime),
    error: computed(() => state.error),
    isRealtimeActive: computed(() => state.isRealtimeActive),

    // Getters
    allConfirmingTransactions: computed(() => [
      ...state.confirming.giver.map(t => ({ ...t, role: 'giver' })),
      ...state.confirming.receiver.map(t => ({ ...t, role: 'receiver' }))
    ]),
    allPendingTransactions: computed(() => [
      ...state.pending.giver.map(t => ({ ...t, role: 'giver' })),
      ...state.pending.receiver.map(t => ({ ...t, role: 'receiver' }))
    ]),
    allCompletedTransactions: computed(() => [
      ...state.completed.giver.map(t => ({ ...t, role: 'giver' })),
      ...state.completed.receiver.map(t => ({ ...t, role: 'receiver' }))
    ]),
    itemToTransactionMap: computed(() => new Map()),
    hasFreshData: computed(() => {
      if (!state.lastFetchTime) return false
      return Date.now() - state.lastFetchTime < 300000 // 5 minutes
    }),

    // Actions (模擬)
    fetchAllTransactions: vi.fn().mockImplementation(async (forceRefresh = false) => {
      state.isLoading = true
      await new Promise(resolve => setTimeout(resolve, 100))
      state.isLoading = false
      state.lastFetchTime = Date.now()
    }),
    confirmTransaction: vi.fn().mockImplementation((transactionId, role = 'receiver') => {
      // 模擬從 confirming 移動到 pending
      const sourceList = state.confirming[role]
      const index = sourceList.findIndex(t => t.transaction_id === transactionId)
      if (index !== -1) {
        const [transaction] = sourceList.splice(index, 1)
        transaction.status = 'pending'
        state.pending[role].unshift(transaction)
        return transaction
      }
      return null
    }),
    completeTransaction: vi.fn().mockImplementation((transactionId, role = 'receiver') => {
      // 模擬從 pending 移動到 completed
      const sourceList = state.pending[role]
      const index = sourceList.findIndex(t => t.transaction_id === transactionId)
      if (index !== -1) {
        const [transaction] = sourceList.splice(index, 1)
        transaction.status = 'completed'
        transaction.completed_at = new Date().toISOString()
        state.completed[role].unshift(transaction)
        return transaction
      }
      return null
    }),
    upsertTransaction: vi.fn(),
    clearAll: vi.fn().mockImplementation(() => {
      state.confirming = { giver: [], receiver: [] }
      state.pending = { giver: [], receiver: [] }
      state.completed = { giver: [], receiver: [] }
      state.lastFetchTime = null
      state.error = null
    }),
    getTransactionByItem: vi.fn().mockReturnValue(null),
    startRealtime: vi.fn().mockImplementation((userId) => {
      state.isRealtimeActive = true
    }),
    stopRealtime: vi.fn().mockImplementation(async () => {
      state.isRealtimeActive = false
    }),
    setRealtimeCallbacks: vi.fn(),

    // 測試輔助方法
    $patch: (updates) => {
      Object.assign(state, updates)
    },
    $reset: () => {
      Object.assign(state, defaultState)
    },
    $state: state,
    $id: 'transaction'
  }

  return store
}

/**
 * 創建完整的 Store 模擬集合
 * @param {Object} storeOverrides - Store 覆寫配置
 * @returns {Object} 所有模擬的 Store
 */
export function createMockStores(storeOverrides = {}) {
  return {
    auth: createMockAuthStore(storeOverrides.auth),
    points: createMockPointsStore(storeOverrides.points),
    transaction: createMockTransactionStore(storeOverrides.transaction)
  }
}

/**
 * 為 Pinia 測試創建模擬插件
 * @param {Object} mockStores - 模擬的 Store 集合
 * @returns {Function} Pinia 插件函數
 */
export function createMockStorePlugin(mockStores) {
  return ({ store }) => {
    const mockStore = mockStores[store.$id]
    if (mockStore) {
      // 將模擬的方法和狀態合併到實際 store 中
      Object.assign(store, mockStore)
    }
  }
}

// 預設匯出
export default {
  createMockAuthStore,
  createMockPointsStore,
  createMockTransactionStore,
  createMockStores,
  createMockStorePlugin
}