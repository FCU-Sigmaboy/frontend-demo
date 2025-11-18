import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getUserPointsProfile,
  getPointsTransactions,
  dailySignIn,
  getUserBadges,
  checkListingPermission,
  getLevelTier,
  getTrustTier,
  LEVEL_TIERS,
  TRUST_TIERS
} from '@/api/pointsAPI'

export const usePointsStore = defineStore('points', () => {
  // State
  const profile = ref(null)
  const transactions = ref([])
  const badges = ref([])
  const isLoadingProfile = ref(false)
  const isLoadingTransactions = ref(false)
  const isLoadingBadges = ref(false)
  const lastProfileFetch = ref(null)
  const lastTransactionsFetch = ref(null)
  const lastBadgesFetch = ref(null)

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000

  // Getters
  const currentBalance = computed(() => profile.value?.current_balance || 0)

  const totalEarned = computed(() => profile.value?.total_earned || 0)

  const totalSpent = computed(() => profile.value?.total_spent || 0)

  const dailyStreak = computed(() => profile.value?.daily_streak || 0)

  const lastSigninDate = computed(() => profile.value?.last_signin_date || null)

  const currentLevelTier = computed(() => {
    if (!profile.value) return LEVEL_TIERS[0]
    return getLevelTier(profile.value.total_earned)
  })

  const nextLevelTier = computed(() => {
    const currentTier = currentLevelTier.value
    const currentIndex = LEVEL_TIERS.findIndex(t => t.tier === currentTier.tier)
    if (currentIndex === LEVEL_TIERS.length - 1) return null
    return LEVEL_TIERS[currentIndex + 1]
  })

  const levelProgress = computed(() => {
    const current = currentLevelTier.value
    const next = nextLevelTier.value

    if (!next) return 100 // Max level reached

    const earned = totalEarned.value
    const pointsIntoCurrentLevel = earned - current.minPoints
    const pointsNeededForLevel = next.minPoints - current.minPoints

    return Math.round((pointsIntoCurrentLevel / pointsNeededForLevel) * 100)
  })

  const pointsToNextLevel = computed(() => {
    const next = nextLevelTier.value
    if (!next) return 0
    return Math.max(0, next.minPoints - totalEarned.value)
  })

  const currentTrustTier = computed(() => {
    if (!profile.value) return TRUST_TIERS[0]
    return getTrustTier(profile.value.total_sales_points || 0)
  })

  const nextTrustTier = computed(() => {
    const currentTier = currentTrustTier.value
    const currentIndex = TRUST_TIERS.findIndex(t => t.tier === currentTier.tier)
    if (currentIndex === TRUST_TIERS.length - 1) return null
    return TRUST_TIERS[currentIndex + 1]
  })

  const salesPointsToNextTrust = computed(() => {
    const next = nextTrustTier.value
    if (!next) return 0
    const currentSalesPoints = profile.value?.total_sales_points || 0
    return Math.max(0, next.requiredSales - currentSalesPoints)
  })

  const hasSignedInToday = computed(() => {
    if (!lastSigninDate.value) return false
    const today = new Date().toISOString().split('T')[0]
    return lastSigninDate.value === today
  })

  const earnedBadgesCount = computed(() => badges.value.length)

  // Actions

  /**
   * Check if cache is still valid
   */
  function isCacheValid(lastFetch) {
    if (!lastFetch) return false
    return Date.now() - lastFetch < CACHE_DURATION
  }

  /**
   * Fetch user points profile
   * @param {boolean} forceRefresh - Force refresh even if cache is valid
   */
  async function fetchProfile(forceRefresh = false) {
    // Return cached data if valid
    if (!forceRefresh && isCacheValid(lastProfileFetch.value) && profile.value) {
      console.log('Using cached profile data')
      return profile.value
    }

    // Prevent duplicate calls
    if (isLoadingProfile.value) {
      console.log('Profile fetch already in progress, skipping...')
      return profile.value
    }

    try {
      isLoadingProfile.value = true
      const data = await getUserPointsProfile()
      profile.value = data
      lastProfileFetch.value = Date.now()

      console.log('Points profile fetched:', {
        balance: data.current_balance,
        level: currentLevelTier.value.name,
        trust: currentTrustTier.value.name,
        streak: data.daily_streak
      })

      return data
    } catch (error) {
      console.error('Error fetching points profile:', error)
      throw error
    } finally {
      isLoadingProfile.value = false
    }
  }

  /**
   * Fetch points transactions
   * @param {object} params - Filter parameters
   * @param {boolean} forceRefresh - Force refresh even if cache is valid
   */
  async function fetchTransactions(params = {}, forceRefresh = false) {
    // Return cached data if valid and no filters
    if (!forceRefresh && isCacheValid(lastTransactionsFetch.value) &&
        transactions.value.length > 0 && !params.type && !params.startDate) {
      console.log('Using cached transactions data')
      return transactions.value
    }

    // Prevent duplicate calls
    if (isLoadingTransactions.value) {
      console.log('Transactions fetch already in progress, skipping...')
      return transactions.value
    }

    try {
      isLoadingTransactions.value = true
      const result = await getPointsTransactions(params)

      // Only cache if no filters
      if (!params.type && !params.startDate) {
        transactions.value = result.transactions
        lastTransactionsFetch.value = Date.now()
      }

      console.log('Transactions fetched:', result.total, 'total')
      return result
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    } finally {
      isLoadingTransactions.value = false
    }
  }

  /**
   * Perform daily sign-in
   */
  async function performDailySignIn() {
    try {
      const result = await dailySignIn()

      // Update profile after sign-in
      if (result.success && profile.value) {
        // Use new_balance from RPC if available, otherwise calculate
        if (result.new_balance !== undefined) {
          profile.value.current_balance = result.new_balance
        } else {
          profile.value.current_balance += result.points_awarded
        }

        profile.value.total_earned += result.points_awarded
        profile.value.daily_streak = result.streak_day
        profile.value.last_signin_date = new Date().toISOString().split('T')[0]

        // Invalidate cache to force refresh on next fetch
        lastProfileFetch.value = null
      }

      console.log('Daily sign-in successful:', result)
      return result
    } catch (error) {
      console.error('Error performing daily sign-in:', error)
      throw error
    }
  }

  /**
   * Fetch user badges
   * @param {boolean} forceRefresh - Force refresh even if cache is valid
   */
  async function fetchBadges(forceRefresh = false) {
    // Return cached data if valid
    if (!forceRefresh && isCacheValid(lastBadgesFetch.value) && badges.value.length > 0) {
      console.log('Using cached badges data')
      return badges.value
    }

    // Prevent duplicate calls
    if (isLoadingBadges.value) {
      console.log('Badges fetch already in progress, skipping...')
      return badges.value
    }

    try {
      isLoadingBadges.value = true
      const data = await getUserBadges()
      badges.value = data
      lastBadgesFetch.value = Date.now()

      console.log('Badges fetched:', data.length, 'badges')
      return data
    } catch (error) {
      console.error('Error fetching badges:', error)
      throw error
    } finally {
      isLoadingBadges.value = false
    }
  }

  /**
   * Check if user can list an item at given price
   * @param {number} itemPrice - Item price to check
   */
  async function canListItem(itemPrice) {
    try {
      const result = await checkListingPermission(itemPrice)
      return result
    } catch (error) {
      console.error('Error checking listing permission:', error)
      throw error
    }
  }

  /**
   * Update balance after transaction
   * @param {number} amount - Amount to add (positive) or deduct (negative)
   * @param {string} type - Transaction type
   */
  function updateBalance(amount, type) {
    if (!profile.value) return

    profile.value.current_balance += amount

    if (amount > 0) {
      profile.value.total_earned += amount

      // Update sales points if it's a sale
      if (type === 'sale_earning') {
        profile.value.total_sales_points = (profile.value.total_sales_points || 0) + amount
      }
    } else {
      profile.value.total_spent += Math.abs(amount)
    }

    console.log('Balance updated:', {
      amount,
      type,
      newBalance: profile.value.current_balance
    })
  }

  /**
   * Invalidate all caches and force refresh
   */
  function invalidateCache() {
    lastProfileFetch.value = null
    lastTransactionsFetch.value = null
    lastBadgesFetch.value = null
    console.log('Cache invalidated')
  }

  /**
   * Reset store state
   */
  function resetStore() {
    profile.value = null
    transactions.value = []
    badges.value = []
    lastProfileFetch.value = null
    lastTransactionsFetch.value = null
    lastBadgesFetch.value = null
    console.log('Points store reset')
  }

  return {
    // State
    profile,
    transactions,
    badges,
    isLoadingProfile,
    isLoadingTransactions,
    isLoadingBadges,

    // Getters
    currentBalance,
    totalEarned,
    totalSpent,
    dailyStreak,
    lastSigninDate,
    currentLevelTier,
    nextLevelTier,
    levelProgress,
    pointsToNextLevel,
    currentTrustTier,
    nextTrustTier,
    salesPointsToNextTrust,
    hasSignedInToday,
    earnedBadgesCount,

    // Actions
    fetchProfile,
    fetchTransactions,
    performDailySignIn,
    fetchBadges,
    canListItem,
    updateBalance,
    invalidateCache,
    resetStore
  }
})
