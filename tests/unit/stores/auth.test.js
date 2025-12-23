import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('Auth Store', () => {
  let useAuthStore
  let pinia

  beforeEach(async () => {
    // Create fresh pinia instance for each test
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Mock dependencies before importing the store
    vi.doMock('@/api/profileAPI', () => ({
      getMyProfileForEdit: vi.fn()
    }))
    
    vi.doMock('@/api/locationAPI', () => ({
      getCurrentPosition: vi.fn(),
      saveLocation: vi.fn()
    }))
    
    // Clear module cache to ensure fresh imports
    vi.resetModules()
    
    // Import store after mocking dependencies
    const authModule = await import('@/stores/auth')
    useAuthStore = authModule.useAuthStore
  })

  describe('Store Creation', () => {
    it('should create store instance successfully', () => {
      const store = useAuthStore()
      expect(store).toBeDefined()
      expect(typeof store.signInWithGoogle).toBe('function')
      expect(typeof store.signOut).toBe('function')
      expect(typeof store.setSession).toBe('function')
    })

    it('should have initial state properties', () => {
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(false)
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
      expect(store.profileData).toBeNull()
      expect(store.isLoadingProfile).toBe(false)
    })

    it('should have computed properties', () => {
      const store = useAuthStore()
      expect(store.userName).toBe('訪客')
      expect(store.userEmail).toBe('')
      expect(store.userAvatar).toBe('')
    })
  })

  describe('State Management', () => {
    it('should update computed properties when state changes', () => {
      const store = useAuthStore()
      
      // Test userName computation
      store.user = { id: 'test-id', email: 'test@example.com' }
      expect(store.userName).toBe('使用者')
      
      store.profileData = { nickname: 'Test User' }
      expect(store.userName).toBe('Test User')
    })

    it('should handle session setting', () => {
      const store = useAuthStore()
      const mockSession = {
        user: { id: 'test-id', email: 'test@example.com' },
        access_token: 'token'
      }

      store.setSession(mockSession)

      expect(store.session).toStrictEqual(mockSession)
      expect(store.user).toStrictEqual(mockSession.user)
      expect(store.isLoggedIn).toBe(true)
    })

    it('should clear state when session is null', () => {
      const store = useAuthStore()
      
      // Set up initial state
      store.isLoggedIn = true
      store.user = { id: 'test-id' }
      store.session = { access_token: 'token' }
      store.profileData = { nickname: 'Test' }

      store.setSession(null)

      expect(store.session).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.profileData).toBeNull()
    })
  })

  describe('Profile Management', () => {
    it('should not call API when user is not logged in', async () => {
      const { getMyProfileForEdit } = await import('@/api/profileAPI')
      const store = useAuthStore()
      store.user = null

      await store.updateCustomProfile()

      expect(getMyProfileForEdit).not.toHaveBeenCalled()
    })

    it('should prevent duplicate calls when already loading', async () => {
      const { getMyProfileForEdit } = await import('@/api/profileAPI')
      const store = useAuthStore()
      store.user = { id: 'test-id' }
      store.isLoadingProfile = true

      await store.updateCustomProfile()

      expect(getMyProfileForEdit).not.toHaveBeenCalled()
    })
  })

  describe('Authentication Actions', () => {
    it('should reset state on sign out', async () => {
      const store = useAuthStore()
      
      // Set up initial state
      store.isLoggedIn = true
      store.user = { id: 'test-id' }
      store.session = { access_token: 'token' }
      store.profileData = { nickname: 'Test' }

      await store.signOut()

      expect(store.isLoggedIn).toBe(false)
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
      expect(store.profileData).toBeNull()
    })
  })
})