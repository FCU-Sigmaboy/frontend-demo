import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getUserPointsProfile,
  getPointLogs,
  getPointsTransactions,
  dailySignIn,
  getUserBadgesWithProgress,
  getUserBadges,
  manuallyCheckBadges,
  checkListingPermission,
  getLevelTier,
  getTrustTier,
  calculateStreakReward,
  LEVEL_TIERS,
  TRUST_TIERS,
  BADGE_DEFINITIONS,
  TRANSACTION_TYPES
} from '@/api/pointsAPI.js'

// 模擬 Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe.sequential('pointsAPI', () => {
  beforeEach(() => {
    // 完全重置 mock，清除所有配置和調用歷史
    vi.clearAllMocks()
    // 重新創建干淨的 mock 函數
    supabase.auth.getUser.mockReset()
    supabase.rpc.mockReset()
  })

  describe('getUserPointsProfile', () => {
    it('should return user points profile when user is authenticated', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockProfile = {
        user_id: 'test-user-123',
        current_balance: 1500,
        total_earned: 3000,
        total_spent: 1500,
        daily_streak: 7,
        level_tier: 3
      }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: mockProfile, error: null })

      // Act
      const result = await getUserPointsProfile()

      // Assert
      expect(supabase.auth.getUser).toHaveBeenCalled()
      expect(result).toEqual(mockProfile)
    })

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

      // Act & Assert
      await expect(getUserPointsProfile()).rejects.toThrow('使用者未登入')
    })

    it('should throw error when RPC call fails', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockError = { message: 'Database error' }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      // Act & Assert
      await expect(getUserPointsProfile()).rejects.toThrow('Database error')
    })

    it('should throw default error message when RPC error has no message', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockError = {}

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      // Act & Assert
      await expect(getUserPointsProfile()).rejects.toThrow('獲取使用者資料失敗')
    })
  })

  describe('getPointLogs', () => {
    it('should return normalized point logs with default parameters', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockLogs = [
        {
          point_log_id: 'log-1',
          user_id: 'test-user-123',
          type: 'DAILY_SIGNIN',
          amount: 50,
          description: '每日簽到',
          balance_after: 1050,
          created_at: '2024-12-11T10:00:00Z'
        }
      ]

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: mockLogs, error: null })

      // Act
      const result = await getPointLogs()

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_point_logs', {
        p_log_type: null,
        p_page: 1,
        p_size: 20
      })
      expect(result).toEqual({
        transactions: [{
          id: 'log-1',
          user_id: 'test-user-123',
          type: 'DAILY_SIGNIN',
          amount: 50,
          description: '每日簽到',
          created_at: '2024-12-11T10:00:00Z',
          transaction_id: null
        }],
        total: 1,
        page: 1,
        hasMore: false
      })
    })

    it('should handle custom parameters', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const params = { logType: 'DAILY_SIGNIN', page: 2, size: 10 }
      const mockEmptyLogs = []

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: mockEmptyLogs, error: null })

      // Act
      const result = await getPointLogs(params)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_point_logs', {
        p_log_type: 'DAILY_SIGNIN',
        p_page: 2,
        p_size: 10
      })
      expect(result.transactions).toEqual([])
      expect(result.page).toBe(2)
      expect(result.hasMore).toBe(false)
    })

    it('should indicate hasMore when results equal page size', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockLogs = new Array(20).fill(0).map((_, i) => ({
        point_log_id: `log-${i}`,
        type: 'DAILY_SIGNIN',
        amount: 50,
        description: '每日簽到',
        created_at: '2024-12-11T10:00:00Z'
      }))

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: mockLogs, error: null })

      // Act
      const result = await getPointLogs({ size: 20 })

      // Assert
      expect(result.hasMore).toBe(true)
    })

    it('should throw error when RPC call fails', async () => {
        const mockUser = { id: 'test-user-123' }
        supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
        supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Fetch logs failed' } })
        
        await expect(getPointLogs()).rejects.toThrow('Fetch logs failed')
    })

    it('should handle missing fields in normalization', async () => {
       const mockUser = { id: 'test-user-123' }
       const mockIncompleteLog = [{
         type: 'TEST_TYPE',
         amount: 100,
         description: 'Test',
         created_at: '2024-01-01'
       }]
 
       supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
       supabase.rpc.mockResolvedValueOnce({ data: mockIncompleteLog, error: null })
 
       const result = await getPointLogs()
       const log = result.transactions[0]
       
       // normalizePointLog 不回傳這些欄位，所以應為 undefined
       expect(log.balance_before).toBeUndefined()
       expect(log.transaction_id).toBeNull()
       expect(log.reference_id).toBeUndefined()
       // Should generate fallback ID
       expect(log.id).toContain('1-0-2024-01-01')
    })
  })

  describe('getPointsTransactions', () => {
    it('should call getPointLogs with correct parameters', async () => {
      // Mock getPointLogs indirectly by catching the rpc call it makes
      const mockUser = { id: 'test-user-123' }
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: [], error: null })

      await getPointsTransactions({ type: 'TEST', page: 2, size: 5 })

      expect(supabase.rpc).toHaveBeenCalledWith('get_point_logs', {
        p_log_type: 'TEST',
        p_page: 2,
        p_size: 5
      })
    })
  })

  describe('manuallyCheckBadges', () => {
    it('should successfully check badges', async () => {
      const mockUser = { id: 'test-user-123' }
      const mockResponse = {
        newly_earned_count: 1,
        total_points_awarded: 50,
        badges: [{ badge_id: 'points_1000' }]
      }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await manuallyCheckBadges()

      expect(supabase.rpc).toHaveBeenCalledWith('manually_check_badges')
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
      await expect(manuallyCheckBadges()).rejects.toThrow('使用者未登入')
    })

    it('should throw error when RPC fails', async () => {
      const mockUser = { id: 'test-user-123' }
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Check badges failed' } })

      await expect(manuallyCheckBadges()).rejects.toThrow('Check badges failed')
    })

    it('should throw default error when RPC fails with no message', async () => {
      const mockUser = { id: 'test-user-123' }
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: null, error: {} })

      await expect(manuallyCheckBadges()).rejects.toThrow('手動檢查徽章失敗')
    })
  })

  describe('dailySignIn', () => {
    it('should perform daily sign-in successfully', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockSignInResult = {
        success: true,
        points_earned: 50,
        current_streak: 8,
        badges_earned: []
      }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValueOnce({ data: mockSignInResult, error: null })

      // Act
      const result = await dailySignIn()

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('daily_check_in')
      expect(result).toEqual(mockSignInResult)
    })

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

      // Act & Assert
      await expect(dailySignIn()).rejects.toThrow('使用者未登入')
    })

    it('should throw error when RPC works fails', async () => {
        const mockUser = { id: 'test-user-123' }
        supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } })
        supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Sign in failed' } })
  
        await expect(dailySignIn()).rejects.toThrow('Sign in failed')
    })
  })

  describe('getUserBadgesWithProgress', () => {
    it('should return user badges with progress', async () => {
      // Arrange
      const mockBadgesData = {
        user_id: 'test-user-123',
        earned_badges: [{ badge_id: 'streak_7', earned_at: '2024-12-11T00:00:00Z' }],
        in_progress_badges: [{ badge_id: 'streak_30', progress: 0.5 }]
      }

      supabase.rpc.mockResolvedValueOnce({ data: mockBadgesData, error: null })

      // Act
      const result = await getUserBadgesWithProgress('test-user-123')

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_badges_with_progress', {
        p_user_id: 'test-user-123'
      })
      expect(result).toEqual(mockBadgesData)
    })

    it('should handle null userId parameter', async () => {
      // Arrange
      supabase.rpc.mockResolvedValueOnce({ data: {}, error: null })

      // Act
      const result = await getUserBadgesWithProgress()

      // Assert
      expect(result).toEqual({})
    })

    it('should throw error when RPC fails', async () => {
        supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Fetch badges failed' } })
        await expect(getUserBadgesWithProgress()).rejects.toThrow('Fetch badges failed')
    })
  })

  describe('getUserBadges', () => {
    it('should return only earned badges array', async () => {
      // Arrange
      const mockBadgesData = {
        earned_badges: [{ badge_id: 'streak_7' }],
        in_progress_badges: [{ badge_id: 'streak_30' }]
      }

      supabase.rpc.mockResolvedValueOnce({ data: mockBadgesData, error: null })

      // Act
      const result = await getUserBadges('test-user-123')

      // Assert
      expect(result).toEqual([{ badge_id: 'streak_7' }])
    })

    it('should return empty array when no earned badges', async () => {
      // Arrange
      supabase.rpc.mockResolvedValueOnce({ data: { earned_badges: null }, error: null })

      // Act
      const result = await getUserBadges()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('checkListingPermission', () => {
    it('should allow listing when price is within trust level limit', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockProfile = {
        trust_level_tier: 2,
        total_sales_points: 600
      }

      // checkListingPermission 呼叫 getUserPointsProfile,所以需要兩次 auth mock
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } }) // 第一次在 checkListingPermission
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } }) // 第二次在 getUserPointsProfile
      supabase.rpc.mockResolvedValueOnce({ data: mockProfile, error: null })

      // Act
      const result = await checkListingPermission(800) // Within tier 2 limit (1000)

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.current_trust_level).toEqual(TRUST_TIERS[1])
    })

    it('should deny listing when price exceeds trust level limit', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockProfile = {
        trust_level_tier: 1,
        total_sales_points: 100
      }

      // checkListingPermission 呼叫 getUserPointsProfile,所以需要兩次 auth mock
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } }) // 第一次在 checkListingPermission
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser } }) // 第二次在 getUserPointsProfile
      supabase.rpc.mockResolvedValueOnce({ data: mockProfile, error: null })

      // Act
      const result = await checkListingPermission(1500) // Exceeds tier 1 limit (500)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.current_trust_level).toEqual(TRUST_TIERS[0])
      expect(result.required_trust_level).toEqual(TRUST_TIERS[2])
      expect(result.sales_needed).toBeGreaterThan(0)
    })
  })

  describe('getLevelTier', () => {
    it('should return correct tier for given points', async () => {
      // Act & Assert
      expect(getLevelTier(0)).toEqual(LEVEL_TIERS[0])
      expect(getLevelTier(750)).toEqual(LEVEL_TIERS[1])
      expect(getLevelTier(1500)).toEqual(LEVEL_TIERS[2])
      expect(getLevelTier(3000)).toEqual(LEVEL_TIERS[3])
      expect(getLevelTier(25000)).toEqual(LEVEL_TIERS[6])
    })

    it('should return first tier for invalid points', async () => {
      // Act & Assert
      expect(getLevelTier(-100)).toEqual(LEVEL_TIERS[0])
    })
  })

  describe('getTrustTier', () => {
    it('should return correct trust tier for given sales points', async () => {
      // Act & Assert
      expect(getTrustTier(0)).toEqual(TRUST_TIERS[0])
      expect(getTrustTier(600)).toEqual(TRUST_TIERS[1])
      expect(getTrustTier(2500)).toEqual(TRUST_TIERS[2])
      expect(getTrustTier(6000)).toEqual(TRUST_TIERS[3])
      expect(getTrustTier(20000)).toEqual(TRUST_TIERS[4])
    })
  })

  describe('calculateStreakReward', () => {
    it('should return correct rewards for specific streak days', async () => {
      // Act & Assert
      expect(calculateStreakReward(1)).toBe(5)
      expect(calculateStreakReward(2)).toBe(5)
      expect(calculateStreakReward(3)).toBe(10)
      expect(calculateStreakReward(7)).toBe(20)
      expect(calculateStreakReward(14)).toBe(30)
      expect(calculateStreakReward(30)).toBe(50)
      expect(calculateStreakReward(100)).toBe(200)
    })

    it('should return default reward for other days', async () => {
      // Act & Assert
      expect(calculateStreakReward(5)).toBe(5)
      expect(calculateStreakReward(15)).toBe(5)
      expect(calculateStreakReward(50)).toBe(5)
    })
  })

  describe('Constants', () => {
    it('should have correct LEVEL_TIERS structure', async () => {
      expect(LEVEL_TIERS).toHaveLength(7)
      expect(LEVEL_TIERS[0]).toMatchObject({
        tier: 1,
        name: '新手交易者',
        minPoints: 0,
        maxPoints: 499
      })
    })

    it('should have correct TRUST_TIERS structure', async () => {
      expect(TRUST_TIERS).toHaveLength(5)
      expect(TRUST_TIERS[0]).toMatchObject({
        tier: 1,
        name: '新手賣家',
        maxListingValue: 500,
        requiredSales: 0
      })
    })

    it('should have BADGE_DEFINITIONS with expected badges', async () => {
      expect(BADGE_DEFINITIONS).toHaveProperty('streak_7')
      expect(BADGE_DEFINITIONS).toHaveProperty('first_sale')
      expect(BADGE_DEFINITIONS).toHaveProperty('points_1000')
    })

    it('should have TRANSACTION_TYPES with expected types', async () => {
      expect(TRANSACTION_TYPES).toHaveProperty('DAILY_SIGNIN')
      expect(TRANSACTION_TYPES).toHaveProperty('TRANSACTION_INCOME')
      expect(TRANSACTION_TYPES).toHaveProperty('SALE_EARNING')
    })
  })
})