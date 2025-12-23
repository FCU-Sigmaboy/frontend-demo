import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('Points Store', () => {
  let usePointsStore
  let pinia

  beforeEach(async () => {
    // Create fresh pinia instance for each test
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Mock dependencies before importing the store
    vi.doMock('@/api/pointsAPI', () => ({
      getUserPointsProfile: vi.fn(),
      getPointsTransactions: vi.fn(),
      dailySignIn: vi.fn(),
      getUserBadgesWithProgress: vi.fn(),
      manuallyCheckBadges: vi.fn(),
      checkListingPermission: vi.fn(),
      getLevelTier: vi.fn().mockReturnValue({ tier: 1, name: '新手交易者', minPoints: 0 }),
      getTrustTier: vi.fn().mockReturnValue({ tier: 1, name: '新手賣家', requiredSales: 0 }),
      LEVEL_TIERS: [
        { tier: 1, name: '新手交易者', icon: '🌱', minPoints: 0, maxPoints: 499 },
        { tier: 2, name: '青銅交易者', icon: '🥉', minPoints: 500, maxPoints: 999 }
      ],
      TRUST_TIERS: [
        { tier: 1, name: '新手賣家', maxListingValue: 500, requiredSales: 0 },
        { tier: 2, name: '可信賣家', maxListingValue: 1000, requiredSales: 500 }
      ]
    }))
    
    // Clear module cache to ensure fresh imports
    vi.resetModules()
    
    // Import store after mocking dependencies
    const pointsModule = await import('@/stores/points')
    usePointsStore = pointsModule.usePointsStore
  })

  describe('Store Creation', () => {
    it('should create store instance successfully', () => {
      const store = usePointsStore()
      expect(store).toBeDefined()
      expect(typeof store.fetchProfile).toBe('function')
      expect(typeof store.fetchTransactions).toBe('function')
      expect(typeof store.performDailySignIn).toBe('function')
    })

    it('should have initial state properties', () => {
      const store = usePointsStore()
      expect(store.profile).toBeNull()
      expect(store.transactions).toEqual([])
      expect(store.badges).toEqual([])
      expect(store.badgeProgress).toEqual([])
      expect(store.isLoadingProfile).toBe(false)
      expect(store.isLoadingTransactions).toBe(false)
      expect(store.isLoadingBadges).toBe(false)
    })

    it('should have computed properties with default values', () => {
      const store = usePointsStore()
      expect(store.currentBalance).toBe(0)
      expect(store.totalEarned).toBe(0)
      expect(store.totalSpent).toBe(0)
      expect(store.dailyStreak).toBe(0)
      expect(store.hasSignedInToday).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('should return correct profile-based computed values', () => {
      const store = usePointsStore()
      store.profile = {
        current_balance: 1500,
        total_earned: 3000,
        total_spent: 1500,
        daily_streak: 7,
        last_signin_date: '2023-12-11'
      }

      expect(store.currentBalance).toBe(1500)
      expect(store.totalEarned).toBe(3000)
      expect(store.totalSpent).toBe(1500)
      expect(store.dailyStreak).toBe(7)
      expect(store.lastSigninDate).toBe('2023-12-11')
    })

    it('should calculate hasSignedInToday correctly', () => {
      const store = usePointsStore()
      store.profile = { last_signin_date: null }
      expect(store.hasSignedInToday).toBe(false)

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
      store.profile.last_signin_date = today
      expect(store.hasSignedInToday).toBe(true)

      store.profile.last_signin_date = '2023-01-01'
      expect(store.hasSignedInToday).toBe(false)
    })

    it('should calculate badge counts correctly', () => {
      const store = usePointsStore()
      store.badges = [{ id: 1 }, { id: 2 }]
      store.badgeProgress = [{ badge_id: 3 }]
      
      expect(store.earnedBadgesCount).toBe(2)
      expect(store.inProgressBadgesCount).toBe(1)
    })
  })

  describe('Profile Management', () => {
    it('should prevent duplicate calls when already loading', async () => {
      const { getUserPointsProfile } = await import('@/api/pointsAPI')
      const store = usePointsStore()
      store.isLoadingProfile = true

      const result = await store.fetchProfile()

      expect(getUserPointsProfile).not.toHaveBeenCalled()
      expect(result).toBe(store.profile)
    })

    it('should use cached data when cache is valid', async () => {
      const { getUserPointsProfile } = await import('@/api/pointsAPI')
      const store = usePointsStore()
      store.profile = { current_balance: 500 }
      store.lastProfileFetch = Date.now() - 60000 // 1 minute ago (within 5 minute cache)

      const result = await store.fetchProfile()

      expect(getUserPointsProfile).not.toHaveBeenCalled()
      expect(result).toBe(store.profile)
    })
  })

  describe('Balance Management', () => {
    it('should update balance for positive amount', () => {
      const store = usePointsStore()
      store.profile = {
        current_balance: 1000,
        total_earned: 2000,
        total_spent: 1000,
        total_sales_points: 500
      }

      store.updateBalance(100, 'earning')

      expect(store.profile.current_balance).toBe(1100)
      expect(store.profile.total_earned).toBe(2100)
      expect(store.profile.total_spent).toBe(1000) // unchanged
    })

    it('should update balance for negative amount', () => {
      const store = usePointsStore()
      store.profile = {
        current_balance: 1000,
        total_earned: 2000,
        total_spent: 1000,
        total_sales_points: 500
      }

      store.updateBalance(-50, 'spending')

      expect(store.profile.current_balance).toBe(950)
      expect(store.profile.total_earned).toBe(2000) // unchanged
      expect(store.profile.total_spent).toBe(1050)
    })

    it('should update sales points for sale earnings', () => {
      const store = usePointsStore()
      store.profile = {
        current_balance: 1000,
        total_earned: 2000,
        total_spent: 1000,
        total_sales_points: 500
      }

      store.updateBalance(200, 'sale_earning')

      expect(store.profile.current_balance).toBe(1200)
      expect(store.profile.total_earned).toBe(2200)
      expect(store.profile.total_sales_points).toBe(700)
    })

    it('should not update when profile is null', () => {
      const store = usePointsStore()
      store.profile = null

      store.updateBalance(100, 'earning')

      expect(store.profile).toBeNull()
    })
  })

  describe('Store Management', () => {
    it('should invalidate cache correctly', () => {
      const store = usePointsStore()
      store.lastProfileFetch = Date.now()
      store.lastTransactionsFetch = Date.now()
      store.lastBadgesFetch = Date.now()

      store.invalidateCache()

      expect(store.lastProfileFetch).toBeNull()
      expect(store.lastTransactionsFetch).toBeNull()
      expect(store.lastBadgesFetch).toBeNull()
    })

    it('should reset store state correctly', () => {
      const store = usePointsStore()
      
      // Set up some state
      store.profile = { balance: 1000 }
      store.transactions = [{ id: 1 }]
      store.badges = [{ id: 1 }]
      store.lastProfileFetch = Date.now()

      store.resetStore()

      expect(store.profile).toBeNull()
      expect(store.transactions).toEqual([])
      expect(store.badges).toEqual([])
      expect(store.lastProfileFetch).toBeNull()
    })
  })
})