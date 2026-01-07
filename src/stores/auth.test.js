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
        data: { subscription: { unsubscribe: vi.fn() } },
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
          profile_picture_url: 'https://example.com/avatar.jpg',
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

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const result = await authStore.signInWithGoogle()

        expect(result.error).toBe(mockError)
        expect(result.data).toBeNull()
        consoleSpy.mockRestore()
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
        await flushPromises()

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

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        await expect(authStore.updateCustomProfile()).rejects.toThrow('API 錯誤')
        expect(authStore.isLoadingProfile).toBe(false)

        consoleSpy.mockRestore()
      })

      it('API 返回 null 時應正確處理', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        getMyProfileForEdit.mockResolvedValue(null)

        authStore.user = createMockUser()

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        await authStore.updateCustomProfile()

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('loadCustomProfile', () => {
      it('應正確載入 profile 資料', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        const mockProfile = createMockProfile({ nickname: '測試用戶' })
        getMyProfileForEdit.mockResolvedValue(mockProfile)

        authStore.user = createMockUser()

        await authStore.loadCustomProfile()

        expect(authStore.profileData).toEqual(mockProfile)
        expect(authStore.isLoadingProfile).toBe(false)
      })

      it('未登入時不應呼叫 API', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')

        await authStore.loadCustomProfile()

        expect(getMyProfileForEdit).not.toHaveBeenCalled()
      })

      it('正在載入時不應重複呼叫', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        getMyProfileForEdit.mockResolvedValue(createMockProfile())

        authStore.user = createMockUser()
        authStore.isLoadingProfile = true

        await authStore.loadCustomProfile()

        expect(getMyProfileForEdit).not.toHaveBeenCalled()
      })

      it('API 返回 null 時應正確處理', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        getMyProfileForEdit.mockResolvedValue(null)

        authStore.user = createMockUser()

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        await authStore.loadCustomProfile()

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })

      it('有 locations 時不應自動儲存位置', async () => {
        const { getMyProfileForEdit } = await import('@/api/profileAPI')
        const { getCurrentPosition } = await import('@/api/locationAPI')
        const mockProfile = createMockProfile({
          locations: [{ id: 1, type: '家' }],
        })
        getMyProfileForEdit.mockResolvedValue(mockProfile)

        authStore.user = createMockUser()

        await authStore.loadCustomProfile()

        expect(getCurrentPosition).not.toHaveBeenCalled()
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

      it('無 session 時應保持未登入狀態', async () => {
        const { supabase } = await import('@/lib/supabase')
        supabase.auth.getSession.mockResolvedValue({
          data: { session: null },
        })

        await authStore.initAuth()

        expect(authStore.isLoggedIn).toBe(false)
        expect(authStore.user).toBeNull()
      })

      it('初始化失敗時應記錄錯誤', async () => {
        const { supabase } = await import('@/lib/supabase')
        supabase.auth.getSession.mockRejectedValue(new Error('初始化失敗'))

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        await authStore.initAuth()

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })
  })
})
