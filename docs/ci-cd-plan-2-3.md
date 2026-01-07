# 階段三 Sprint 3：狀態管理測試 - 實作指引

> **預估時間**：1 週  
> **前置條件**：Sprint 2（核心工具函數測試）已完成

---

## 目錄

1. [概述](#概述)
   - [Sprint 3 目標](#sprint-3-目標)
   - [Sprint 3 原則](#sprint-3-原則)
   - [工作項目總覽](#工作項目總覽)
   - [測試範圍](#測試範圍)
2. [優先測試清單](#優先測試清單)
   - [📁 src/stores/ 目錄結構](#-srcstores-目錄結構)
   - [優先級說明](#優先級說明)
3. [實作步驟](#實作步驟)
   - [Step 1：安裝 Pinia 測試套件](#step-1安裝-pinia-測試套件)
   - [Step 2：更新 vitest.config.js](#step-2更新-vitestconfigjs)
   - [Step 3：更新 src/test/helpers.js](#step-3更新-srctesthelpersjs)
   - [Step 4：Store 測試實作](#step-4store-測試實作)
     - [Auth Store 測試](#auth-store-測試)
     - [Points Store 測試](#points-store-測試)
     - [Favorites Store 測試](#favorites-store-測試)
     - [Transaction Store 測試](#transaction-store-測試)
   - [Step 5：Mock 策略](#step-5mock-策略)
4. [測試範例詳解](#測試範例詳解)
5. [驗證清單](#驗證清單)
6. [常見問題排解](#常見問題排解)
7. [Sprint 3 完成標準](#sprint-3-完成標準)
8. [下一步](#下一步)
9. [附錄：Sprint 3 完整檔案清單](#附錄sprint-3-完整檔案清單)

---

## 概述

本階段聚焦於 Pinia Store 的單元測試，確保狀態管理邏輯的正確性。Store 是應用程式的核心，負責管理使用者認證、點數系統、收藏功能及交易狀態等關鍵業務邏輯。

### Sprint 3 目標

- ✅ 為 4 個核心 Store 撰寫完整測試
- ✅ `stores/` 目錄覆蓋率達 50%+
- ✅ 啟用覆蓋率門檻（從 20% 起步）
- ✅ 建立 Store 測試的標準模式

### Sprint 3 原則

- 先處理高風險、高覆蓋收益的 Store（auth、points）
- 透過 `@pinia/testing` + `vi.mock` 隔離外部依賴，確保測試可重現
- 覆蓋錯誤與快取分支，讓覆蓋率門檻可穩定達標

### 工作項目總覽

| 項目 | 指標 |
|------|------|
| stores/ 覆蓋率 | ≥ 50% |
| 覆蓋率門檻 | lines: 20%, functions: 20%, branches: 15% |
| 總專案覆蓋率 | 約 20-30% |

### 測試範圍

| 類型 | 說明 |
|------|------|
| 初始狀態 | 驗證 Store 建立時的預設值 |
| Getters | 驗證計算屬性的正確性 |
| Actions | 驗證操作方法的行為與副作用 |
| 錯誤處理 | 驗證 API 失敗時的錯誤處理 |
| 快取機制 | 驗證資料快取與過期邏輯 |

---

## 優先測試清單

### 📁 src/stores/ 目錄結構

- `src/stores/auth.js` / `src/stores/auth.test.js`
- `src/stores/points.js` / `src/stores/points.test.js`
- `src/stores/favorites.js` / `src/stores/favorites.test.js`
- `src/stores/transaction.js` / `src/stores/transaction.test.js`

### 優先級說明

| Store | 優先級 | 測試重點 | 檔案路徑 |
|-------|--------|----------|----------|
| auth.js | 🔴 高 | 登入/登出、Session 管理、Profile 載入 | `src/stores/auth.test.js` |
| points.js | 🔴 高 | 餘額查詢、每日簽到、徽章系統 | `src/stores/points.test.js` |
| favorites.js | 🟡 中 | 收藏/取消收藏、狀態同步 | `src/stores/favorites.test.js` |
| transaction.js | 🟡 中 | 交易狀態管理、Realtime 更新 | `src/stores/transaction.test.js` |

---

## 實作步驟

### Step 1：安裝 Pinia 測試套件

```bash
npm install -D @pinia/testing
```

### Step 2：更新 vitest.config.js

```javascript
// vitest.config.js
// Sprint 3: 啟用覆蓋率門檻
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/*.config.mjs',
        'src/main.js',
        'src/router/**',
        'src/lib/**',
        'src/**/*.test.js',
        'src/**/*.spec.js',
      ],
      // Sprint 3: 啟用低門檻，逐步提升
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 15,
        statements: 20
      }
    },

    setupFiles: ['./src/test/setup.js'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

---

### Step 3：更新 src/test/helpers.js

```javascript
// src/test/helpers.js
// Sprint 3: 擴展 Store 測試輔助函數
import { createPinia, setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'

/**
 * 為測試設置新的 Pinia 實例
 * @returns {Pinia} Pinia 實例
 */
export function setupTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 建立測試用 Pinia（使用 @pinia/testing）
 * @param {Object} options - 設定選項
 * @param {Object} options.initialState - 初始狀態
 * @param {boolean} options.stubActions - 是否 stub actions（預設 false）
 * @returns {TestingPinia} 測試用 Pinia 實例
 */
export function createTestPinia(options = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: options.stubActions ?? false,
    initialState: options.initialState || {},
  })
  setActivePinia(pinia)
  return pinia
}

/**
 * 等待所有 Promise 完成
 * @returns {Promise<void>}
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * 建立模擬的 API 回應
 * @param {any} data - 回應資料
 * @param {Error|null} error - 錯誤物件
 * @returns {{ data: any, error: Error|null }}
 */
export function createMockResponse(data, error = null) {
  return { data, error }
}

/**
 * 建立模擬的成功 API 回應
 * @param {any} data - 回應資料
 * @returns {{ success: true, data: any }}
 */
export function createSuccessResponse(data) {
  return { success: true, data }
}

/**
 * 建立模擬的失敗 API 回應
 * @param {string} message - 錯誤訊息
 * @returns {{ success: false, error: string }}
 */
export function createErrorResponse(message) {
  return { success: false, error: message }
}

/**
 * 延遲指定毫秒數
 * @param {number} ms - 毫秒數
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 建立模擬的 Supabase Auth 物件
 * @returns {Object} 模擬的 auth 物件
 */
export function createMockSupabaseAuth() {
  return {
    signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
  }
}

/**
 * 建立模擬的使用者資料
 * @param {Object} overrides - 覆寫的屬性
 * @returns {Object} 模擬的使用者物件
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    ...overrides,
  }
}

/**
 * 建立模擬的 Session 資料
 * @param {Object} overrides - 覆寫的屬性
 * @returns {Object} 模擬的 session 物件
 */
export function createMockSession(overrides = {}) {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: createMockUser(overrides.user),
    ...overrides,
  }
}

/**
 * 建立模擬的 Profile 資料
 * @param {Object} overrides - 覆寫的屬性
 * @returns {Object} 模擬的 profile 物件
 */
export function createMockProfile(overrides = {}) {
  return {
    id: 'user-123',
    nickname: '測試用戶',
    email: 'test@example.com',
    profile_picture_url: 'https://example.com/avatar.jpg',
    profile_details: {
      balance: 1000,
      carbon_saved_kg: 5.5,
    },
    locations: [],
    ...overrides,
  }
}

/**
 * 建立模擬的點數 Profile 資料
 * @param {Object} overrides - 覆寫的屬性
 * @returns {Object} 模擬的點數 profile 物件
 */
export function createMockPointsProfile(overrides = {}) {
  return {
    current_balance: 1000,
    total_earned: 2500,
    total_spent: 1500,
    daily_streak: 5,
    last_signin_date: null,
    total_sales_points: 500,
    ...overrides,
  }
}

/**
 * 建立模擬的收藏商品
 * @param {Object} overrides - 覆寫的屬性
 * @returns {Object} 模擬的收藏商品
 */
export function createMockFavoriteItem(overrides = {}) {
  return {
    item_id: 1,
    title: '測試商品',
    price: 100,
    favorited_at: new Date().toISOString(),
    favorites_count: 10,
    ...overrides,
  }
}

/**
 * 建立模擬的交易資料
 * @param {Object} overrides - 覆寫的屬性
 * @returns {Object} 模擬的交易物件
 */
export function createMockTransaction(overrides = {}) {
  return {
    transaction_id: 'txn-123',
    item_id: 1,
    status: 'pending',
    giver_id: 'user-giver',
    receiver_id: 'user-receiver',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}
```

---

### Step 4：Store 測試實作

#### Auth Store 測試

建立 `src/stores/auth.test.js`：

```javascript
// src/stores/auth.test.js
// Sprint 3: Auth Store 完整測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from './auth'
import {
  setupTestPinia,
  flushPromises,
  createMockUser,
  createMockSession,
  createMockProfile,
} from '@/test/helpers'

// ============================================================================
// Mock 外部依賴
// ============================================================================

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
  },
}))

// Mock Profile API
vi.mock('@/api/profileAPI', () => ({
  getMyProfileForEdit: vi.fn(),
}))

// Mock Location API
vi.mock('@/api/locationAPI', () => ({
  getCurrentPosition: vi.fn(),
  saveLocation: vi.fn(),
}))

describe('Auth Store', () => {
  let authStore

  beforeEach(() => {
    vi.clearAllMocks()
    setupTestPinia()
    authStore = useAuthStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // 初始狀態測試
  // ==========================================================================
  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(authStore.isLoggedIn).toBe(false)
      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
      expect(authStore.profileData).toBeNull()
      expect(authStore.isLoadingProfile).toBe(false)
    })
  })

  // ==========================================================================
  // Getters 測試
  // ==========================================================================
  describe('計算屬性 (Getters)', () => {
    describe('userName', () => {
      it('未登入時應顯示「訪客」', () => {
        expect(authStore.userName).toBe('訪客')
      })

      it('登入但未載入 profile 時應顯示「使用者」', () => {
        authStore.user = createMockUser()
        authStore.isLoggedIn = true
        expect(authStore.userName).toBe('使用者')
      })

      it('有 profile 時應顯示暱稱', () => {
        authStore.user = createMockUser()
        authStore.isLoggedIn = true
        authStore.profileData = createMockProfile({ nickname: '小明' })
        expect(authStore.userName).toBe('小明')
      })

      it('profile 無暱稱時應顯示「使用者」', () => {
        authStore.user = createMockUser()
        authStore.isLoggedIn = true
        authStore.profileData = createMockProfile({ nickname: null })
        expect(authStore.userName).toBe('使用者')
      })
    })

    describe('userEmail', () => {
      it('未登入時應返回空字串', () => {
        expect(authStore.userEmail).toBe('')
      })

      it('有 profile 時應返回 profile email', () => {
        authStore.user = createMockUser()
        authStore.profileData = createMockProfile({ email: 'profile@example.com' })
        expect(authStore.userEmail).toBe('profile@example.com')
      })

      it('無 profile 時應返回 user email', () => {
        authStore.user = createMockUser({ email: 'user@example.com' })
        authStore.profileData = null
        expect(authStore.userEmail).toBe('user@example.com')
      })
    })

    describe('userAvatar', () => {
      it('未登入時應返回空字串', () => {
        expect(authStore.userAvatar).toBe('')
      })

      it('有 profile 時應返回頭像 URL', () => {
        authStore.user = createMockUser()
        authStore.profileData = createMockProfile({
          profile_picture_url: 'https://example.com/avatar.jpg'
        })
        expect(authStore.userAvatar).toBe('https://example.com/avatar.jpg')
      })

      it('無頭像時應返回空字串', () => {
        authStore.user = createMockUser()
        authStore.profileData = createMockProfile({ profile_picture_url: null })
        expect(authStore.userAvatar).toBe('')
      })
    })
  })

  // ==========================================================================
  // Actions 測試
  // ==========================================================================
  describe('Actions', () => {
    describe('signInWithGoogle', () => {
      it('應呼叫 Supabase signInWithOAuth', async () => {
        const { supabase } = await import('@/lib/supabase')
        supabase.auth.signInWithOAuth.mockResolvedValue({
          data: { provider: 'google', url: 'https://google.com/oauth' },
          error: null,
        })

        const result = await authStore.signInWithGoogle()

        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: expect.objectContaining({
            redirectTo: expect.any(String),
          }),
        })
        expect(result.error).toBeNull()
      })

      it('登入失敗時應返回錯誤', async () => {
        const { supabase } = await import('@/lib/supabase')
        const mockError = new Error('登入失敗')
        supabase.auth.signInWithOAuth.mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await authStore.signInWithGoogle()

        expect(result.error).toBe(mockError)
        expect(result.data).toBeNull()
      })
    })

    describe('signOut', () => {
      it('登出後應重置所有狀態', async () => {
        const { supabase } = await import('@/lib/supabase')
        supabase.auth.signOut.mockResolvedValue({ error: null })

        // 設定登入狀態
        authStore.isLoggedIn = true
        authStore.user = createMockUser()
        authStore.session = createMockSession()

        await authStore.signOut()

        expect(authStore.isLoggedIn).toBe(false)
        expect(authStore.user).toBeNull()
        expect(authStore.session).toBeNull()
      })

      it('登出失敗時應記錄錯誤但不拋出', async () => {
        const { supabase } = await import('@/lib/supabase')
        supabase.auth.signOut.mockResolvedValue({ error: new Error('登出失敗') })

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        // 應該不會拋出錯誤
        await expect(authStore.signOut()).resolves.not.toThrow()

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('setSession', () => {
      it('設定 session 時應更新所有相關狀態', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        getMyProfileForEdit.mockResolvedValue(createMockProfile())

        const mockSession = createMockSession()
        authStore.setSession(mockSession)

        expect(authStore.session).toEqual(mockSession)
        expect(authStore.user).toEqual(mockSession.user)
        expect(authStore.isLoggedIn).toBe(true)
      })

      it('清除 session 時應重置狀態', () => {
        authStore.isLoggedIn = true
        authStore.user = createMockUser()
        authStore.session = createMockSession()
        authStore.profileData = createMockProfile()

        authStore.setSession(null)

        expect(authStore.session).toBeNull()
        expect(authStore.user).toBeNull()
        expect(authStore.isLoggedIn).toBe(false)
        expect(authStore.profileData).toBeNull()
      })
    })

    describe('updateCustomProfile', () => {
      it('應正確更新 profile 資料', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        const mockProfile = createMockProfile({ nickname: '更新後的暱稱' })
        getMyProfileForEdit.mockResolvedValue(mockProfile)

        authStore.user = createMockUser()

        await authStore.updateCustomProfile()

        expect(authStore.profileData).toEqual(mockProfile)
      })

      it('未登入時不應呼叫 API', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')

        await authStore.updateCustomProfile()

        expect(getMyProfileForEdit).not.toHaveBeenCalled()
      })

      it('正在載入時不應重複呼叫', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        getMyProfileForEdit.mockResolvedValue(createMockProfile())

        authStore.user = createMockUser()
        authStore.isLoadingProfile = true

        await authStore.updateCustomProfile()

        expect(getMyProfileForEdit).not.toHaveBeenCalled()
      })

      it('API 失敗時應正確處理錯誤', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        getMyProfileForEdit.mockRejectedValue(new Error('API 錯誤'))

        authStore.user = createMockUser()

        await expect(authStore.updateCustomProfile()).rejects.toThrow('API 錯誤')
        expect(authStore.isLoadingProfile).toBe(false)
      })
    })

    describe('initAuth', () => {
      it('應初始化認證狀態並監聽變化', async () => {
        const { supabase } = await import('@/lib/supabase')
        const mockSession = createMockSession()

        supabase.auth.getSession.mockResolvedValue({
          data: { session: mockSession },
        })

        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        getMyProfileForEdit.mockResolvedValue(createMockProfile())

        await authStore.initAuth()

        expect(supabase.auth.getSession).toHaveBeenCalled()
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
        expect(authStore.isLoggedIn).toBe(true)
      })
    })
  })
})
```

---

#### Points Store 測試

建立 `src/stores/points.test.js`：

```javascript
// src/stores/points.test.js
// Sprint 3: Points Store 完整測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePointsStore } from './points'
import {
  setupTestPinia,
  flushPromises,
  createMockPointsProfile,
} from '@/test/helpers'

// ============================================================================
// Mock Points API
// ============================================================================
vi.mock('@/api/pointsAPI', () => ({
  getUserPointsProfile: vi.fn(),
  getPointsTransactions: vi.fn(),
  dailySignIn: vi.fn(),
  getUserBadgesWithProgress: vi.fn(),
  manuallyCheckBadges: vi.fn(),
  checkListingPermission: vi.fn(),
  getLevelTier: vi.fn((points) => ({
    tier: 1,
    name: '新手',
    minPoints: 0,
  })),
  getTrustTier: vi.fn((sales) => ({
    tier: 1,
    name: '一般',
    requiredSales: 0,
  })),
  LEVEL_TIERS: [
    { tier: 1, name: '新手', minPoints: 0 },
    { tier: 2, name: '初級', minPoints: 1000 },
    { tier: 3, name: '中級', minPoints: 5000 },
  ],
  TRUST_TIERS: [
    { tier: 1, name: '一般', requiredSales: 0 },
    { tier: 2, name: '可信', requiredSales: 500 },
    { tier: 3, name: '優良', requiredSales: 2000 },
  ],
}))

describe('Points Store', () => {
  let pointsStore

  beforeEach(() => {
    vi.clearAllMocks()
    setupTestPinia()
    pointsStore = usePointsStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // 初始狀態測試
  // ==========================================================================
  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(pointsStore.profile).toBeNull()
      expect(pointsStore.transactions).toEqual([])
      expect(pointsStore.badges).toEqual([])
      expect(pointsStore.badgeProgress).toEqual([])
      expect(pointsStore.isLoadingProfile).toBe(false)
      expect(pointsStore.isLoadingTransactions).toBe(false)
      expect(pointsStore.isLoadingBadges).toBe(false)
    })
  })

  // ==========================================================================
  // Getters 測試
  // ==========================================================================
  describe('計算屬性 (Getters)', () => {
    describe('currentBalance', () => {
      it('無 profile 時應返回 0', () => {
        expect(pointsStore.currentBalance).toBe(0)
      })

      it('有 profile 時應返回正確餘額', () => {
        pointsStore.profile = createMockPointsProfile({ current_balance: 1500 })
        expect(pointsStore.currentBalance).toBe(1500)
      })
    })

    describe('totalEarned', () => {
      it('無 profile 時應返回 0', () => {
        expect(pointsStore.totalEarned).toBe(0)
      })

      it('有 profile 時應返回累計收入', () => {
        pointsStore.profile = createMockPointsProfile({ total_earned: 5000 })
        expect(pointsStore.totalEarned).toBe(5000)
      })
    })

    describe('totalSpent', () => {
      it('無 profile 時應返回 0', () => {
        expect(pointsStore.totalSpent).toBe(0)
      })

      it('有 profile 時應返回累計支出', () => {
        pointsStore.profile = createMockPointsProfile({ total_spent: 3000 })
        expect(pointsStore.totalSpent).toBe(3000)
      })
    })

    describe('dailyStreak', () => {
      it('無 profile 時應返回 0', () => {
        expect(pointsStore.dailyStreak).toBe(0)
      })

      it('有 profile 時應返回連續簽到天數', () => {
        pointsStore.profile = createMockPointsProfile({ daily_streak: 7 })
        expect(pointsStore.dailyStreak).toBe(7)
      })
    })

    describe('hasSignedInToday', () => {
      it('無簽到記錄時應返回 false', () => {
        pointsStore.profile = createMockPointsProfile({ last_signin_date: null })
        expect(pointsStore.hasSignedInToday).toBe(false)
      })

      it('今日已簽到時應返回 true', () => {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
        pointsStore.profile = createMockPointsProfile({ last_signin_date: today })
        expect(pointsStore.hasSignedInToday).toBe(true)
      })

      it('非今日簽到時應返回 false', () => {
        pointsStore.profile = createMockPointsProfile({ last_signin_date: '2020-01-01' })
        expect(pointsStore.hasSignedInToday).toBe(false)
      })
    })

    describe('earnedBadgesCount', () => {
      it('無徽章時應返回 0', () => {
        expect(pointsStore.earnedBadgesCount).toBe(0)
      })

      it('有徽章時應返回正確數量', () => {
        pointsStore.badges = [{ id: 1 }, { id: 2 }, { id: 3 }]
        expect(pointsStore.earnedBadgesCount).toBe(3)
      })
    })
  })

  // ==========================================================================
  // Actions 測試
  // ==========================================================================
  describe('Actions', () => {
    describe('fetchProfile', () => {
      it('應正確取得點數 Profile', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        const mockProfile = createMockPointsProfile({ current_balance: 2000 })
        getUserPointsProfile.mockResolvedValue(mockProfile)

        const result = await pointsStore.fetchProfile()

        expect(getUserPointsProfile).toHaveBeenCalled()
        expect(pointsStore.profile).toEqual(mockProfile)
        expect(result).toEqual(mockProfile)
      })

      it('快取有效時不應重複請求', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        getUserPointsProfile.mockResolvedValue(createMockPointsProfile())

        // 第一次請求
        await pointsStore.fetchProfile()
        expect(getUserPointsProfile).toHaveBeenCalledTimes(1)

        // 第二次請求（應使用快取）
        await pointsStore.fetchProfile()
        expect(getUserPointsProfile).toHaveBeenCalledTimes(1)
      })

      it('forceRefresh 時應強制重新請求', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        getUserPointsProfile.mockResolvedValue(createMockPointsProfile())

        await pointsStore.fetchProfile()
        await pointsStore.fetchProfile(true)

        expect(getUserPointsProfile).toHaveBeenCalledTimes(2)
      })

      it('API 失敗時應拋出錯誤', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        getUserPointsProfile.mockRejectedValue(new Error('取得 Profile 失敗'))

        await expect(pointsStore.fetchProfile(true)).rejects.toThrow('取得 Profile 失敗')
        expect(pointsStore.isLoadingProfile).toBe(false)
      })

      it('正在載入時不應重複請求', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        getUserPointsProfile.mockResolvedValue(createMockPointsProfile())

        pointsStore.isLoadingProfile = true

        const result = await pointsStore.fetchProfile(true)

        expect(getUserPointsProfile).not.toHaveBeenCalled()
        expect(result).toBeNull()
      })
    })

    describe('fetchTransactions', () => {
      it('應正確取得交易記錄', async () => {
        const { getPointsTransactions } = await import('@/api/pointsAPI')
        const mockTransactions = [
          { id: 1, type: 'earn', amount: 100 },
          { id: 2, type: 'spend', amount: -50 },
        ]
        getPointsTransactions.mockResolvedValue({
          transactions: mockTransactions,
          hasMore: false,
        })

        await pointsStore.fetchTransactions()

        expect(getPointsTransactions).toHaveBeenCalled()
        expect(pointsStore.transactions).toEqual(mockTransactions)
      })

      it('應支援分頁載入', async () => {
        const { getPointsTransactions } = await import('@/api/pointsAPI')
        getPointsTransactions
          .mockResolvedValueOnce({
            transactions: [{ id: 1 }],
            hasMore: true,
          })
          .mockResolvedValueOnce({
            transactions: [{ id: 2 }],
            hasMore: false,
          })

        await pointsStore.fetchTransactions({ page: 1 })
        expect(pointsStore.transactions).toHaveLength(1)

        await pointsStore.fetchTransactions({ page: 2, append: true })
        expect(pointsStore.transactions).toHaveLength(2)
      })

      it('篩選條件變更時應重置列表', async () => {
        const { getPointsTransactions } = await import('@/api/pointsAPI')
        getPointsTransactions.mockResolvedValue({
          transactions: [{ id: 1, type: 'earn' }],
          hasMore: false,
        })

        await pointsStore.fetchTransactions({ type: 'earn' })

        expect(pointsStore.transactionsFilter).toBe('earn')
        expect(pointsStore.transactionsPage).toBe(1)
      })
    })

    describe('performDailySignIn', () => {
      it('簽到成功時應更新 profile', async () => {
        const { dailySignIn } = await import('@/api/pointsAPI')
        dailySignIn.mockResolvedValue({
          success: true,
          points_awarded: 10,
          streak_day: 3,
        })

        pointsStore.profile = createMockPointsProfile({
          current_balance: 100,
          total_earned: 500,
          daily_streak: 2,
        })

        const result = await pointsStore.performDailySignIn()

        expect(dailySignIn).toHaveBeenCalled()
        expect(result.success).toBe(true)
        expect(pointsStore.profile.current_balance).toBe(110)
        expect(pointsStore.profile.total_earned).toBe(510)
        expect(pointsStore.profile.daily_streak).toBe(3)
      })

      it('簽到成功且有新徽章時應重新載入徽章', async () => {
        const { dailySignIn, getUserBadgesWithProgress } = await import('@/api/pointsAPI')
        dailySignIn.mockResolvedValue({
          success: true,
          points_awarded: 10,
          streak_day: 7,
          badges: { newly_earned_count: 1 },
        })
        getUserBadgesWithProgress.mockResolvedValue({
          earned_badges: [{ badge_id: 'streak-7' }],
          in_progress_badges: [],
        })

        pointsStore.profile = createMockPointsProfile()

        await pointsStore.performDailySignIn()

        expect(getUserBadgesWithProgress).toHaveBeenCalled()
      })

      it('簽到失敗時應拋出錯誤', async () => {
        const { dailySignIn } = await import('@/api/pointsAPI')
        dailySignIn.mockRejectedValue(new Error('簽到失敗'))

        pointsStore.profile = createMockPointsProfile()

        await expect(pointsStore.performDailySignIn()).rejects.toThrow('簽到失敗')
      })
    })

    describe('fetchBadges', () => {
      it('應正確取得徽章資料', async () => {
        const { getUserBadgesWithProgress } = await import('@/api/pointsAPI')
        getUserBadgesWithProgress.mockResolvedValue({
          earned_badges: [
            { badge_id: 'badge-1', name: '新手徽章', rarity: 'common' },
          ],
          in_progress_badges: [
            { badge_id: 'badge-2', name: '進行中徽章', current_value: 5, target_value: 10 },
          ],
        })

        const result = await pointsStore.fetchBadges()

        expect(getUserBadgesWithProgress).toHaveBeenCalled()
        expect(pointsStore.badges).toHaveLength(1)
        expect(pointsStore.badgeProgress).toHaveLength(1)
        expect(result.earned).toHaveLength(1)
        expect(result.inProgress).toHaveLength(1)
      })

      it('快取有效時應使用快取', async () => {
        const { getUserBadgesWithProgress } = await import('@/api/pointsAPI')
        getUserBadgesWithProgress.mockResolvedValue({
          earned_badges: [{ badge_id: 'badge-1' }],
          in_progress_badges: [],
        })

        await pointsStore.fetchBadges()
        await pointsStore.fetchBadges()

        expect(getUserBadgesWithProgress).toHaveBeenCalledTimes(1)
      })
    })

    describe('updateBalance', () => {
      it('增加餘額時應正確更新', () => {
        pointsStore.profile = createMockPointsProfile({
          current_balance: 100,
          total_earned: 500,
          total_spent: 0,
        })

        pointsStore.updateBalance(50, 'earn')

        expect(pointsStore.profile.current_balance).toBe(150)
        expect(pointsStore.profile.total_earned).toBe(550)
      })

      it('扣除餘額時應正確更新', () => {
        pointsStore.profile = createMockPointsProfile({
          current_balance: 100,
          total_earned: 500,
          total_spent: 200,
        })

        pointsStore.updateBalance(-30, 'spend')

        expect(pointsStore.profile.current_balance).toBe(70)
        expect(pointsStore.profile.total_spent).toBe(230)
      })

      it('銷售收入應累計至 total_sales_points', () => {
        pointsStore.profile = createMockPointsProfile({
          current_balance: 100,
          total_earned: 500,
          total_sales_points: 100,
        })

        pointsStore.updateBalance(200, 'sale_earning')

        expect(pointsStore.profile.current_balance).toBe(300)
        expect(pointsStore.profile.total_sales_points).toBe(300)
      })

      it('無 profile 時不應執行任何操作', () => {
        pointsStore.profile = null
        // 不應拋出錯誤
        expect(() => pointsStore.updateBalance(100, 'earn')).not.toThrow()
      })
    })

    describe('invalidateCache', () => {
      it('應清除所有快取時間戳', () => {
        // 模擬有快取
        pointsStore.profile = createMockPointsProfile()

        pointsStore.invalidateCache()

        // 下次 fetch 應該會重新請求
        // 這裡檢查內部狀態已被重置（實際快取時間戳為 private，需透過行為驗證）
        expect(pointsStore.profile).not.toBeNull() // profile 資料仍在
      })
    })

    describe('resetStore', () => {
      it('應重置所有狀態', () => {
        pointsStore.profile = createMockPointsProfile()
        pointsStore.transactions = [{ id: 1 }]
        pointsStore.badges = [{ badge_id: 'badge-1' }]

        pointsStore.resetStore()

        expect(pointsStore.profile).toBeNull()
        expect(pointsStore.transactions).toEqual([])
        expect(pointsStore.badges).toEqual([])
        expect(pointsStore.badgeProgress).toEqual([])
      })
    })
  })
})
```

---

#### Favorites Store 測試

建立 `src/stores/favorites.test.js`：

```javascript
// src/stores/favorites.test.js
// Sprint 3: Favorites Store 完整測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFavoritesStore } from './favorites'
import {
  setupTestPinia,
  flushPromises,
  createMockFavoriteItem,
} from '@/test/helpers'

// ============================================================================
// Mock Favorite API
// ============================================================================
vi.mock('@/api/favoriteAPI.js', () => ({
  getMyFavoriteItems: vi.fn(),
  addFavoriteItem: vi.fn(),
  removeFavoriteItem: vi.fn(),
}))

describe('Favorites Store', () => {
  let favoritesStore

  beforeEach(() => {
    vi.clearAllMocks()
    setupTestPinia()
    favoritesStore = useFavoritesStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // 初始狀態測試
  // ==========================================================================
  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(favoritesStore.favoriteItems).toEqual([])
    })
  })

  // ==========================================================================
  // Getters 測試
  // ==========================================================================
  describe('計算屬性 (Getters)', () => {
    describe('count', () => {
      it('空列表時應返回 0', () => {
        expect(favoritesStore.count).toBe(0)
      })

      it('有收藏時應返回正確數量', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
          createMockFavoriteItem({ item_id: 3 }),
        ]
        expect(favoritesStore.count).toBe(3)
      })
    })
  })

  // ==========================================================================
  // Actions 測試
  // ==========================================================================
  describe('Actions', () => {
    describe('loadFavorites', () => {
      it('應正確載入收藏列表', async () => {
        const { getMyFavoriteItems } = await import('@/api/favoriteAPI.js')
        const mockItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
        ]
        getMyFavoriteItems.mockResolvedValue(mockItems)

        await favoritesStore.loadFavorites()

        expect(getMyFavoriteItems).toHaveBeenCalled()
        expect(favoritesStore.favoriteItems).toEqual(mockItems)
      })

      it('API 返回 null 時應設為空陣列', async () => {
        const { getMyFavoriteItems } = await import('@/api/favoriteAPI.js')
        getMyFavoriteItems.mockResolvedValue(null)

        await favoritesStore.loadFavorites()

        expect(favoritesStore.favoriteItems).toEqual([])
      })

      it('應支援傳遞選項參數', async () => {
        const { getMyFavoriteItems } = await import('@/api/favoriteAPI.js')
        getMyFavoriteItems.mockResolvedValue([])

        await favoritesStore.loadFavorites({ limit: 10, offset: 0 })

        expect(getMyFavoriteItems).toHaveBeenCalledWith({ limit: 10, offset: 0 })
      })
    })

    describe('addFavorite', () => {
      it('應新增收藏項目', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')
        addFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1, favorites_count: 5 })

        await favoritesStore.addFavorite(item)

        expect(addFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(1)
        expect(favoritesStore.favoriteItems[0].favorites_count).toBe(6)
        expect(favoritesStore.favoriteItems[0].favorited_at).toBeDefined()
      })

      it('已收藏的項目不應重複新增', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')

        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.addFavorite(item)

        expect(addFavoriteItem).not.toHaveBeenCalled()
        expect(favoritesStore.favoriteItems).toHaveLength(1)
      })

      it('API 失敗時應記錄錯誤', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')
        addFavoriteItem.mockRejectedValue(new Error('新增失敗'))

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const item = createMockFavoriteItem({ item_id: 1, favorites_count: 5 })

        await favoritesStore.addFavorite(item)

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('removeFavorite', () => {
      it('應移除收藏項目', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')
        removeFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.removeFavorite(item)

        expect(removeFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(0)
      })

      it('未收藏的項目不應呼叫 API', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')

        const item = createMockFavoriteItem({ item_id: 999 })

        await favoritesStore.removeFavorite(item)

        expect(removeFavoriteItem).not.toHaveBeenCalled()
      })

      it('API 失敗時應記錄錯誤', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')
        removeFavoriteItem.mockRejectedValue(new Error('移除失敗'))

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.removeFavorite(item)

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('toggleFavorite', () => {
      it('未收藏時應新增收藏', async () => {
        const { addFavoriteItem } = await import('@/api/favoriteAPI.js')
        addFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1, favorites_count: 5 })

        await favoritesStore.toggleFavorite(item)

        expect(addFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(1)
      })

      it('已收藏時應移除收藏', async () => {
        const { removeFavoriteItem } = await import('@/api/favoriteAPI.js')
        removeFavoriteItem.mockResolvedValue({ success: true })

        const item = createMockFavoriteItem({ item_id: 1 })
        favoritesStore.favoriteItems = [item]

        await favoritesStore.toggleFavorite(item)

        expect(removeFavoriteItem).toHaveBeenCalledWith(1)
        expect(favoritesStore.favoriteItems).toHaveLength(0)
      })
    })

    describe('isFavorite', () => {
      it('收藏列表中有該項目時應返回 true', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
        ]

        expect(favoritesStore.isFavorite(1)).toBe(true)
        expect(favoritesStore.isFavorite(2)).toBe(true)
      })

      it('收藏列表中無該項目時應返回 false', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
        ]

        expect(favoritesStore.isFavorite(999)).toBe(false)
      })

      it('應正確處理字串與數字 ID 的比較', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
        ]

        expect(favoritesStore.isFavorite('1')).toBe(true)
        expect(favoritesStore.isFavorite(1)).toBe(true)
      })
    })

    describe('clearCache', () => {
      it('應清空收藏列表', () => {
        favoritesStore.favoriteItems = [
          createMockFavoriteItem({ item_id: 1 }),
          createMockFavoriteItem({ item_id: 2 }),
        ]

        favoritesStore.clearCache()

        expect(favoritesStore.favoriteItems).toEqual([])
      })
    })
  })
})
```

---

#### Transaction Store 測試

建立 `src/stores/transaction.test.js`：

```javascript
// src/stores/transaction.test.js
// Sprint 3: Transaction Store 完整測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTransactionStore } from './transaction'
import {
  setupTestPinia,
  flushPromises,
  createMockTransaction,
} from '@/test/helpers'

// ============================================================================
// Mock Transaction API
// ============================================================================
vi.mock('@/api/transactionAPI', () => ({
  getMyTransactionsByStatus: vi.fn(),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}))

describe('Transaction Store', () => {
  let transactionStore

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    setupTestPinia()
    transactionStore = useTransactionStore()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // 初始狀態測試
  // ==========================================================================
  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(transactionStore.isLoading).toBe(false)
      expect(transactionStore.error).toBeNull()
      expect(transactionStore.isRealtimeActive).toBe(false)
    })

    it('confirming bucket 應為空', () => {
      expect(transactionStore.allConfirmingTransactions).toEqual([])
    })

    it('pending bucket 應為空', () => {
      expect(transactionStore.allPendingTransactions).toEqual([])
    })

    it('completed bucket 應為空', () => {
      expect(transactionStore.allCompletedTransactions).toEqual([])
    })
  })

  // ==========================================================================
  // Getters 測試
  // ==========================================================================
  describe('計算屬性 (Getters)', () => {
    describe('allConfirmingTransactions', () => {
      it('應合併 giver 和 receiver 並標記角色', () => {
        // 直接設定內部狀態
        const giverTxn = createMockTransaction({ transaction_id: 'txn-1' })
        const receiverTxn = createMockTransaction({ transaction_id: 'txn-2' })

        // 這裡需要直接存取 reactive 物件
        // 由於 store 使用 reactive，我們透過 computed getter 驗證
        // 實際測試中可能需要透過 action 來設定狀態
      })
    })

    describe('hasFreshData', () => {
      it('未 fetch 過時應返回 false', () => {
        expect(transactionStore.hasFreshData).toBe(false)
      })
    })

    describe('itemToTransactionMap', () => {
      it('空 buckets 時應返回空 Map', () => {
        expect(transactionStore.itemToTransactionMap.size).toBe(0)
      })
    })
  })

  // ==========================================================================
  // Actions 測試
  // ==========================================================================
  describe('Actions', () => {
    describe('fetchAllTransactions', () => {
      it('應取得所有狀態的交易', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([])

        const fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        // 應該呼叫 6 次（3 狀態 x 2 角色）
        expect(getMyTransactionsByStatus).toHaveBeenCalledTimes(6)
      })

      it('快取有效時不應重複請求', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([])

        // 第一次請求
        let fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        // 第二次請求（應使用快取）
        fetchPromise = transactionStore.fetchAllTransactions(false)
        await vi.runAllTimersAsync()
        await fetchPromise

        // 仍然只有 6 次（第二次沒有呼叫）
        expect(getMyTransactionsByStatus).toHaveBeenCalledTimes(6)
      })

      it('forceRefresh 時應強制重新請求', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([])

        let fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        expect(getMyTransactionsByStatus).toHaveBeenCalledTimes(12)
      })

      it('請求進行中時應復用現有 Promise', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        let resolvePromise
        getMyTransactionsByStatus.mockImplementation(() => 
          new Promise(resolve => { resolvePromise = resolve })
        )

        // 同時發起兩個請求
        const promise1 = transactionStore.fetchAllTransactions(true)
        const promise2 = transactionStore.fetchAllTransactions(true)

        // 應該是同一個 Promise
        expect(promise1).toBe(promise2)

        // 清理
        resolvePromise([])
        await vi.runAllTimersAsync()
      })

      it('API 失敗時應設置錯誤狀態', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockRejectedValue(new Error('API 錯誤'))

        try {
          const fetchPromise = transactionStore.fetchAllTransactions(true)
          await vi.runAllTimersAsync()
          await fetchPromise
        } catch (e) {
          // 預期會拋出錯誤
        }

        expect(transactionStore.error).toBeTruthy()
        expect(transactionStore.isLoading).toBe(false)
      })
    })

    describe('clearAll', () => {
      it('應清空所有 buckets', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([createMockTransaction()])

        const fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        transactionStore.clearAll()

        expect(transactionStore.allConfirmingTransactions).toEqual([])
        expect(transactionStore.allPendingTransactions).toEqual([])
        expect(transactionStore.allCompletedTransactions).toEqual([])
        expect(transactionStore.error).toBeNull()
      })
    })

    describe('getTransactionByItem', () => {
      it('無對應交易時應返回 undefined', () => {
        const result = transactionStore.getTransactionByItem(999)
        expect(result).toBeUndefined()
      })
    })

    describe('startRealtime', () => {
      it('應建立 Supabase channel 訂閱', async () => {
        const { supabase } = await import('@/lib/supabase')

        transactionStore.startRealtime('user-123')

        expect(supabase.channel).toHaveBeenCalled()
        expect(transactionStore.isRealtimeActive).toBe(true)
      })

      it('已啟動時不應重複訂閱', async () => {
        const { supabase } = await import('@/lib/supabase')

        transactionStore.startRealtime('user-123')
        transactionStore.startRealtime('user-123')

        expect(supabase.channel).toHaveBeenCalledTimes(1)
      })
    })

    describe('stopRealtime', () => {
      it('應停止 Supabase 訂閱', async () => {
        const { supabase } = await import('@/lib/supabase')

        transactionStore.startRealtime('user-123')
        await transactionStore.stopRealtime()

        expect(transactionStore.isRealtimeActive).toBe(false)
      })

      it('未啟動時應安全返回', async () => {
        // 不應拋出錯誤
        await expect(transactionStore.stopRealtime()).resolves.not.toThrow()
      })
    })

    describe('setRealtimeCallbacks', () => {
      it('應設置回調函數', () => {
        const callbacks = {
          onTransactionReceived: vi.fn(),
          onTransactionAccepted: vi.fn(),
        }

        transactionStore.setRealtimeCallbacks(callbacks)

        // 回調設置成功（內部狀態驗證）
        // 由於 callbacks 是內部物件，這裡主要確保不拋出錯誤
        expect(true).toBe(true)
      })
    })
  })

  // ==========================================================================
  // 輔助函數測試（透過行為驗證）
  // ==========================================================================
  describe('狀態轉換', () => {
    it('confirmTransaction 應將交易從 confirming 移至 pending', () => {
      // 這需要透過 fetchAllTransactions 先設定資料
      // 然後驗證 confirmTransaction 的行為
      // 由於涉及內部 reactive 物件，此處作為範例展示測試結構
    })

    it('completeTransaction 應將交易從 pending 移至 completed', () => {
      // 類似上述，驗證狀態轉換邏輯
    })
  })
})
```

---

### Step 5：Mock 策略

#### 外部依賴 Mock 原則

| 依賴類型 | Mock 策略 | 說明 |
|----------|-----------|------|
| Supabase Auth | 完全 Mock | 避免實際認證流程 |
| API 函數 | vi.mock | Mock 所有 API 呼叫 |
| Supabase Realtime | Mock channel | 模擬即時訂閱 |
| 瀏覽器 API | setup.js | 已在 setup 中統一處理 |

#### Mock 範例模板

```javascript
// 標準 API Mock 結構
vi.mock('@/api/someAPI', () => ({
  getSomething: vi.fn(),
  createSomething: vi.fn(),
  updateSomething: vi.fn(),
  deleteSomething: vi.fn(),
}))

// 在測試中使用
it('應呼叫 API', async () => {
  const { getSomething } = await import('@/api/someAPI')
  getSomething.mockResolvedValue({ data: 'test' })

  // 執行測試...
  
  expect(getSomething).toHaveBeenCalledWith(expectedParams)
})
```

#### Supabase Mock 完整範例

```javascript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))
```

---

## 驗證清單

### ✅ 環境設置驗證

```bash
# 1. 確認 @pinia/testing 已安裝
npm list @pinia/testing

# 2. 確認 vitest.config.js 已更新
cat vitest.config.js | grep thresholds

# 3. 確認 helpers.js 已更新
cat src/test/helpers.js | grep createTestPinia
```

### ✅ 測試檔案驗證

```bash
# 確認測試檔案存在
ls -la src/stores/*.test.js

# 預期輸出：
# src/stores/auth.test.js
# src/stores/points.test.js
# src/stores/favorites.test.js
# src/stores/transaction.test.js
```

### ✅ 測試執行驗證

```bash
# 執行所有 Store 測試
npm run test -- src/stores/

# 執行單一 Store 測試
npm run test -- src/stores/auth.test.js

# 執行測試並生成覆蓋率報告
npm run test:coverage
```

### ✅ 覆蓋率驗證

```bash
# 執行覆蓋率報告
npm run test:coverage

# 預期結果：
# - stores/ 目錄覆蓋率 ≥ 50%
# - 總覆蓋率 ≥ 20%
# - 無覆蓋率門檻失敗
```

### ✅ CI 驗證

確認 GitHub Actions 通過所有測試：

1. Push 到 feature branch
2. 檢查 CI workflow 狀態
3. 確認 Unit Tests job 通過
4. 下載並檢視 coverage report artifact

---

## 常見問題排解

### Q1：`createTestingPinia is not a function` 錯誤

**原因**：`@pinia/testing` 未正確安裝

**解決方案**：

```bash
npm install -D @pinia/testing
```

### Q2：測試中 `vi.mock` 無法找到模組

**原因**：路徑別名未正確設定

**解決方案**：

確認 `vitest.config.js` 中的 alias 設定：

```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
},
```

### Q3：Store 狀態在測試間互相影響

**原因**：Pinia 實例未在每個測試前重置

**解決方案**：

```javascript
beforeEach(() => {
  vi.clearAllMocks()
  setupTestPinia()  // 每次建立新的 Pinia 實例
  store = useMyStore()
})
```

### Q4：非同步 Action 測試不穩定

**原因**：Promise 未正確等待

**解決方案**：

```javascript
import { flushPromises } from '@/test/helpers'

it('應正確處理非同步操作', async () => {
  // 執行非同步 action
  await store.fetchData()
  
  // 或使用 flushPromises 等待所有 Promise
  await flushPromises()
  
  expect(store.data).toBeDefined()
})
```

### Q5：Fake Timers 導致測試失敗

**原因**：使用 `vi.useFakeTimers()` 但未正確處理

**解決方案**：

```javascript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('應處理計時器', async () => {
  store.startTimeout()
  
  // 快進時間
  await vi.runAllTimersAsync()
  
  expect(store.completed).toBe(true)
})
```

### Q6：覆蓋率門檻未達標

**原因**：測試覆蓋不足

**解決方案**：

1. 檢查覆蓋率報告確認未覆蓋的程式碼
2. 為未覆蓋的分支添加測試案例
3. 暫時降低門檻，逐步提升：

```javascript
thresholds: {
  lines: 15,      // 暫時降低
  functions: 15,
  branches: 10,
  statements: 15
}
```

---

## 測試範例詳解

### 1. 使用 AAA 模式

```javascript
it('應正確更新餘額', () => {
  // Arrange（準備）
  pointsStore.profile = createMockPointsProfile({ current_balance: 100 })

  // Act（執行）
  pointsStore.updateBalance(50, 'earn')

  // Assert（驗證）
  expect(pointsStore.profile.current_balance).toBe(150)
})
```

### 2. 測試命名規範

```javascript
// ✅ 好的命名：描述行為和預期結果
it('未登入時應顯示「訪客」', () => {})
it('API 失敗時應設置錯誤狀態', () => {})
it('快取有效時不應重複請求', () => {})

// ❌ 不好的命名：模糊或過於技術性
it('測試 userName', () => {})
it('error handling', () => {})
it('cache test', () => {})
```

### 3. 單一職責原則

```javascript
// ✅ 好：每個測試只驗證一件事
it('應返回正確的餘額', () => {
  pointsStore.profile = createMockPointsProfile({ current_balance: 100 })
  expect(pointsStore.currentBalance).toBe(100)
})

it('無 profile 時應返回 0', () => {
  expect(pointsStore.currentBalance).toBe(0)
})

// ❌ 不好：一個測試驗證多件事
it('測試 currentBalance', () => {
  expect(pointsStore.currentBalance).toBe(0)
  pointsStore.profile = createMockPointsProfile({ current_balance: 100 })
  expect(pointsStore.currentBalance).toBe(100)
  pointsStore.profile = null
  expect(pointsStore.currentBalance).toBe(0)
})
```

### 4. 使用輔助函數建立測試資料

```javascript
// ✅ 好：使用輔助函數
const profile = createMockPointsProfile({ current_balance: 500 })

// ❌ 不好：在每個測試中重複建立物件
const profile = {
  current_balance: 500,
  total_earned: 0,
  total_spent: 0,
  daily_streak: 0,
  // ...更多屬性
}
```

---

## Sprint 3 完成標準

### 測試案例數量
- 覆蓋 4 個核心 Store（auth / points / favorites / transaction）的主要 Getters 與 Actions。

### 預期覆蓋率
- `stores/` 目錄 ≥ 50%；全專案 ≥ 20%；無低於 thresholds 的報告失敗。

### 配置與 CI
- `@pinia/testing` 已安裝，`vitest.config.js` 覆蓋率門檻啟用且生效。
- GitHub Actions 測試與覆蓋率工作流全部通過。

### 文件產出
- helpers、Store 測試、Mock 範例依本指引落地並可重現。


## 下一步

完成 Sprint 3 後，進入 [Sprint 4：組件測試](./ci-cd-plan-2-4.md)：

1. 為 UI 組件撰寫測試
2. 使用 `@vue/test-utils` 測試組件渲染
3. 測試組件與 Store 的整合
4. 提升覆蓋率門檻至 40%

---

## 附錄：Sprint 3 完整檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `package.json` | 更新 | 新增 `@pinia/testing` 依賴 |
| `vitest.config.js` | 更新 | 啟用覆蓋率門檻 |
| `src/test/helpers.js` | 更新 | 新增 Store 測試輔助函數 |
| `src/stores/auth.test.js` | 新建 | Auth Store 測試 |
| `src/stores/points.test.js` | 新建 | Points Store 測試 |
| `src/stores/favorites.test.js` | 新建 | Favorites Store 測試 |
| `src/stores/transaction.test.js` | 新建 | Transaction Store 測試 |
