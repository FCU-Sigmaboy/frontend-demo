// src/stores/points.test.js
// Sprint 3: Points Store 完整測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePointsStore } from './points'
import { setupTestPinia, createMockPointsProfile } from '@/test/helpers'

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
    name: '新手交易者',
    minPoints: 0,
  })),
  getTrustTier: vi.fn(() => ({
    tier: 1,
    name: '新手賣家',
    requiredSales: 0,
  })),
  LEVEL_TIERS: [
    { tier: 1, name: '新手交易者', minPoints: 0, maxPoints: 499 },
    { tier: 2, name: '青銅交易者', minPoints: 500, maxPoints: 999 },
    { tier: 3, name: '白銀交易者', minPoints: 1000, maxPoints: 2499 },
  ],
  TRUST_TIERS: [
    { tier: 1, name: '新手賣家', requiredSales: 0 },
    { tier: 2, name: '可信賣家', requiredSales: 500 },
    { tier: 3, name: '優質賣家', requiredSales: 2000 },
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
        // Use fake timers to ensure consistent date across test execution
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-06-15T12:00:00+08:00'))
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
        pointsStore.profile = createMockPointsProfile({ last_signin_date: today })
        expect(pointsStore.hasSignedInToday).toBe(true)
        vi.useRealTimers()
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

        const result = await pointsStore.fetchProfile(true)

        expect(getUserPointsProfile).toHaveBeenCalled()
        expect(pointsStore.profile).toEqual(mockProfile)
        expect(result).toEqual(mockProfile)
      })

      it('快取有效時不應重複請求', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        getUserPointsProfile.mockResolvedValue(createMockPointsProfile())

        // 第一次請求
        await pointsStore.fetchProfile(true)
        expect(getUserPointsProfile).toHaveBeenCalledTimes(1)

        // 第二次請求（應使用快取）
        await pointsStore.fetchProfile()
        expect(getUserPointsProfile).toHaveBeenCalledTimes(1)
      })

      it('forceRefresh 時應強制重新請求', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        getUserPointsProfile.mockResolvedValue(createMockPointsProfile())

        await pointsStore.fetchProfile(true)
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
        // Simulate a pending API request by using a never-resolving promise
        let resolveFirst
        getUserPointsProfile.mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveFirst = resolve
            })
        )

        // Start first fetch
        const firstFetchPromise = pointsStore.fetchProfile(true)

        // Attempt second fetch while first is in progress
        const secondResult = await pointsStore.fetchProfile(true)

        // Second fetch should return null without calling API again
        expect(getUserPointsProfile).toHaveBeenCalledTimes(1)
        expect(secondResult).toBeNull()

        // Clean up: resolve the first promise
        resolveFirst(createMockPointsProfile())
        await firstFetchPromise
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

        await pointsStore.fetchTransactions({}, true)

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

        await pointsStore.fetchTransactions({ page: 1 }, true)
        expect(pointsStore.transactions).toHaveLength(1)

        await pointsStore.fetchTransactions({ page: 2, append: true }, true)
        expect(pointsStore.transactions).toHaveLength(2)
      })

      it('篩選條件變更時應重置列表', async () => {
        const { getPointsTransactions } = await import('@/api/pointsAPI')
        getPointsTransactions.mockResolvedValue({
          transactions: [{ id: 1, type: 'earn' }],
          hasMore: false,
        })

        await pointsStore.fetchTransactions({ type: 'DAILY_SIGNIN' }, true)

        expect(pointsStore.transactionsFilter).toBe('DAILY_SIGNIN')
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
          earned_badges: [{ badge_id: 'badge-1', name: '新手徽章', rarity: 'common' }],
          in_progress_badges: [
            { badge_id: 'badge-2', name: '進行中徽章', current_value: 5, target_value: 10 },
          ],
        })

        const result = await pointsStore.fetchBadges(true)

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

        await pointsStore.fetchBadges(true)
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
      it('應清除所有快取時間戳', async () => {
        const { getUserPointsProfile } = await import('@/api/pointsAPI')
        getUserPointsProfile.mockResolvedValue(createMockPointsProfile())

        // 模擬有快取
        await pointsStore.fetchProfile(true)
        expect(getUserPointsProfile).toHaveBeenCalledTimes(1)

        pointsStore.invalidateCache()

        // 下次 fetch 應該會重新請求
        await pointsStore.fetchProfile()
        expect(getUserPointsProfile).toHaveBeenCalledTimes(2)
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
