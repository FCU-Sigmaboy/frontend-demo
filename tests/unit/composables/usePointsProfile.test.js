import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

// 模擬 pointsAPI
const mockGetUserPointsProfile = vi.fn()
vi.mock('@/api/pointsAPI', () => ({
  getUserPointsProfile: mockGetUserPointsProfile
}))

describe('usePointsProfile', () => {
  let mockProfile
  let originalDateNow
  let usePointsProfile

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // 模擬固定時間
    originalDateNow = Date.now
    Date.now = vi.fn(() => 1000000000) // 固定時間戳
    
    mockProfile = {
      user_id: 'test-user-123',
      current_balance: 1500,
      total_earned: 3000,
      total_spent: 1500,
      daily_streak: 7,
      last_signin_date: '2024-12-11'
    }

    // 重新導入模組以重置狀態
    await vi.resetModules()
    const module = await import('@/composables/usePointsProfile.js')
    usePointsProfile = module.usePointsProfile
    
    // 重置共享狀態
    module.resetPointsProfileState()
    
    // 重置模擬函數的調用計數
    mockGetUserPointsProfile.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Date.now = originalDateNow
  })

  describe('fetchPointsProfile', () => {
    it('should fetch profile data successfully on first call', async () => {
      // Arrange
      mockGetUserPointsProfile.mockResolvedValue(mockProfile)
      const { profile, isLoadingProfile, profileError, fetchPointsProfile } = usePointsProfile()

      // Act
      const result = await fetchPointsProfile()

      // Assert
      expect(mockGetUserPointsProfile).toHaveBeenCalled()
      expect(result).toEqual(mockProfile)
      expect(profile.value).toEqual(mockProfile)
      expect(isLoadingProfile.value).toBe(false)
      expect(profileError.value).toBeNull()
    })

    it('should handle API errors correctly', async () => {
      // Arrange
      const mockError = new Error('API Error')
      mockGetUserPointsProfile.mockRejectedValue(mockError)
      
      const { profile, isLoadingProfile, profileError, fetchPointsProfile } = usePointsProfile()

      // Act & Assert
      await expect(fetchPointsProfile()).rejects.toThrow('API Error')
      expect(profileError.value).toBe(mockError)
      expect(isLoadingProfile.value).toBe(false)
      expect(profile.value).toBeNull()
    })

    it('should use cached data when cache is fresh', async () => {
      // Arrange
      mockGetUserPointsProfile.mockResolvedValue(mockProfile)
      const { fetchPointsProfile } = usePointsProfile()

      // Act - first call
      await fetchPointsProfile()
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(1)

      // Act - second call within cache duration (should use cache)
      Date.now = vi.fn(() => 1000000000 + 30000) // 30 seconds later
      const result = await fetchPointsProfile()

      // Assert
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(1) // Still only called once
      expect(result).toEqual(mockProfile)
    })

    it('should refetch data when cache is expired', async () => {
      // Arrange
      const updatedProfile = { ...mockProfile, current_balance: 2000 }
      mockGetUserPointsProfile
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(updatedProfile)
      
      const { profile, fetchPointsProfile } = usePointsProfile()

      // Act - first call
      await fetchPointsProfile()
      expect(profile.value).toEqual(mockProfile)

      // Act - second call after cache expiry (61 seconds later)
      Date.now = vi.fn(() => 1000000000 + 61000)
      const result = await fetchPointsProfile()

      // Assert
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(2)
      expect(result).toEqual(updatedProfile)
      expect(profile.value).toEqual(updatedProfile)
    })

    it('should force refresh when forceRefresh is true', async () => {
      // Arrange
      const updatedProfile = { ...mockProfile, current_balance: 2000 }
      mockGetUserPointsProfile
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(updatedProfile)
      
      const { profile, fetchPointsProfile } = usePointsProfile()

      // Act - first call
      await fetchPointsProfile()
      expect(profile.value).toEqual(mockProfile)

      // Act - force refresh immediately
      const result = await fetchPointsProfile(true)

      // Assert
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(2)
      expect(result).toEqual(updatedProfile)
      expect(profile.value).toEqual(updatedProfile)
    })
  })

  describe('shared state behavior', () => {
    it('should share state between multiple instances', async () => {
      // Arrange
      mockGetUserPointsProfile.mockResolvedValue(mockProfile)
      
      const instance1 = usePointsProfile()
      const instance2 = usePointsProfile()

      // Act
      await instance1.fetchPointsProfile()

      // Assert - both instances should have the same state
      expect(instance1.profile.value).toEqual(mockProfile)
      expect(instance2.profile.value).toEqual(mockProfile)
      expect(instance1.isLoadingProfile.value).toBe(false)
      expect(instance2.isLoadingProfile.value).toBe(false)
    })
  })

  describe('reactive behavior', () => {
    it('should maintain reactivity when profile data changes', async () => {
      // Arrange
      mockGetUserPointsProfile.mockResolvedValue(mockProfile)
      const { profile, fetchPointsProfile } = usePointsProfile()

      // Act
      await fetchPointsProfile()
      
      // Assert - initial state
      expect(profile.value).toEqual(mockProfile)

      // Act - update profile data
      const updatedProfile = { ...mockProfile, current_balance: 2500 }
      mockGetUserPointsProfile.mockResolvedValue(updatedProfile)
      await fetchPointsProfile(true)

      // Assert - reactive update
      expect(profile.value).toEqual(updatedProfile)
      expect(profile.value.current_balance).toBe(2500)
    })

    it('should clear error state on successful fetch', async () => {
      // Arrange
      const mockError = new Error('First error')
      mockGetUserPointsProfile
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockProfile)
      
      const { profileError, fetchPointsProfile } = usePointsProfile()

      // Act - first call fails
      await expect(fetchPointsProfile()).rejects.toThrow('First error')
      expect(profileError.value).toBe(mockError)

      // Act - second call succeeds
      await fetchPointsProfile(true) // force refresh

      // Assert
      expect(profileError.value).toBeNull()
    })
  })

  describe('cache behavior', () => {
    it('should respect CACHE_DURATION_MS constant', async () => {
      // Arrange
      mockGetUserPointsProfile.mockResolvedValue(mockProfile)
      const { fetchPointsProfile } = usePointsProfile()

      // Act - first call
      await fetchPointsProfile()
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(1)

      // Act - call just before cache expiry (59 seconds)
      Date.now = vi.fn(() => 1000000000 + 59000)
      await fetchPointsProfile()
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(1) // Still cached

      // Act - call just after cache expiry (61 seconds)
      Date.now = vi.fn(() => 1000000000 + 61000)
      await fetchPointsProfile()
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(2) // Cache expired
    })
  })

  describe('loading state management', () => {
    it('should prevent concurrent API calls', async () => {
      // Arrange
      let resolvePromise
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockGetUserPointsProfile.mockReturnValue(pendingPromise)
      
      const { fetchPointsProfile } = usePointsProfile()

      // Act - make two concurrent calls
      const promise1 = fetchPointsProfile()
      const promise2 = fetchPointsProfile()

      // Complete the API call
      resolvePromise(mockProfile)
      const [result1, result2] = await Promise.all([promise1, promise2])

      // Assert - only one API call should be made
      expect(mockGetUserPointsProfile).toHaveBeenCalledTimes(1)
      // First call gets the actual result
      expect(result1).toEqual(mockProfile)
      // Second call returns the current state (null) since it's still loading
      // This is the expected behavior - concurrent calls return cached value
      expect(result2).toBeNull()
    })
  })
})