import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getUserPointsProfile,
  getPointsTransactions,
  dailySignIn,
  getUserBadgesWithProgress,
  manuallyCheckBadges,
  checkListingPermission,
  getLevelTier,
  getTrustTier,
  LEVEL_TIERS,
  TRUST_TIERS,
} from '@/api/pointsAPI'

export const usePointsStore = defineStore('points', () => {
  // State
  const profile = ref(null)
  const transactions = ref([])
  const badges = ref([])
  const badgeProgress = ref([])
  const isLoadingProfile = ref(false)
  const isLoadingTransactions = ref(false)
  const isLoadingBadges = ref(false)
  const lastProfileFetch = ref(null)
  const lastTransactionsFetch = ref(null)
  const lastBadgesFetch = ref(null)
  const transactionsHasMore = ref(true)
  const transactionsFilter = ref(null)
  const transactionsPage = ref(1)

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
    const currentIndex = LEVEL_TIERS.findIndex((t) => t.tier === currentTier.tier)
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
    const currentIndex = TRUST_TIERS.findIndex((t) => t.tier === currentTier.tier)
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
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
    return lastSigninDate.value === today
  })

  const isStreakBroken = computed(() => {
    // Streak is broken if user has never signed in or streak is 1 and hasn't signed in today
    if (!lastSigninDate.value || dailyStreak.value === 0) {
      return true
    }
    // If streak is 1 and user hasn't signed in today, it means the streak was broken
    if (dailyStreak.value === 1 && !hasSignedInToday.value) {
      return true
    }
    return false
  })

  const earnedBadgesCount = computed(() => badges.value.length)
  const inProgressBadgesCount = computed(() => badgeProgress.value.length)

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
    if (!forceRefresh && isCacheValid(lastProfileFetch.value) && profile.value) {
      console.log('Using cached profile data')
      return profile.value
    }

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
        streak: data.daily_streak,
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
    const size = params.size || 20
    const requestedType = params.type !== undefined ? params.type : transactionsFilter.value
    const requestedPage = params.page || (params.append ? transactionsPage.value + 1 : 1)
    const isFilterChanged = requestedType !== transactionsFilter.value
    const shouldReset = forceRefresh || isFilterChanged || requestedPage === 1

    if (
      !forceRefresh &&
      isCacheValid(lastTransactionsFetch.value) &&
      !requestedType &&
      requestedPage === 1 &&
      transactions.value.length > 0
    ) {
      return {
        transactions: transactions.value,
        total: transactions.value.length,
        page: 1,
        hasMore: transactionsHasMore.value,
      }
    }

    if (isLoadingTransactions.value) {
      console.log('Transactions fetch already in progress, skipping...')
      return {
        transactions: transactions.value,
        total: transactions.value.length,
        page: transactionsPage.value,
        hasMore: transactionsHasMore.value,
      }
    }

    try {
      isLoadingTransactions.value = true
      if (shouldReset) {
        transactionsPage.value = 1
        if (requestedPage === 1) {
          transactions.value = []
        }
      }

      const result = await getPointsTransactions({
        type: requestedType,
        page: requestedPage,
        size,
      })

      if (requestedPage === 1) {
        transactions.value = result.transactions
      } else {
        transactions.value = [...transactions.value, ...result.transactions]
      }

      transactionsFilter.value = requestedType || null
      transactionsPage.value = requestedPage
      transactionsHasMore.value = Boolean(result.hasMore)
      if (requestedPage === 1) {
        lastTransactionsFetch.value = Date.now()
      }

      console.log('Transactions fetched:', transactions.value.length, 'loaded')
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

      if (result.success && profile.value) {
        if (result.new_balance !== undefined) {
          profile.value.current_balance = result.new_balance
        } else {
          profile.value.current_balance += result.points_awarded
        }

        profile.value.total_earned += result.points_awarded
        profile.value.daily_streak = result.streak_day
        profile.value.last_signin_date = new Date().toLocaleDateString('en-CA', {
          timeZone: 'Asia/Taipei',
        })

        lastProfileFetch.value = null
      }

      if (result.badges?.newly_earned_count > 0) {
        await fetchBadges(true)
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
    if (!forceRefresh && isCacheValid(lastBadgesFetch.value) && badges.value.length > 0) {
      console.log('Using cached badges data')
      return {
        earned: badges.value,
        inProgress: badgeProgress.value,
      }
    }

    if (isLoadingBadges.value) {
      console.log('Badges fetch already in progress, skipping...')
      return {
        earned: badges.value,
        inProgress: badgeProgress.value,
      }
    }

    try {
      isLoadingBadges.value = true
      const data = await getUserBadgesWithProgress()

      const earnedBadges = (data?.earned_badges || []).map(normalizeEarnedBadge).filter(Boolean)
      const inProgressBadges = (data?.in_progress_badges || [])
        .map(normalizeProgressBadge)
        .filter(Boolean)

      badges.value = earnedBadges
      badgeProgress.value = inProgressBadges
      lastBadgesFetch.value = Date.now()

      console.log('Badges fetched:', {
        earned: earnedBadges.length,
        inProgress: inProgressBadges.length,
      })

      return {
        earned: earnedBadges,
        inProgress: inProgressBadges,
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
      throw error
    } finally {
      isLoadingBadges.value = false
    }
  }

  /**
   * 手動觸發徽章檢查
   */
  async function triggerBadgeCheck() {
    try {
      const result = await manuallyCheckBadges()

      if (result?.newly_earned_count > 0) {
        await fetchBadges(true)
      }

      return result
    } catch (error) {
      console.error('Error manually checking badges:', error)
      throw error
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

      if (type === 'sale_earning') {
        profile.value.total_sales_points = (profile.value.total_sales_points || 0) + amount
      }
    } else {
      profile.value.total_spent += Math.abs(amount)
    }

    console.log('Balance updated:', {
      amount,
      type,
      newBalance: profile.value.current_balance,
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
    badgeProgress.value = []
    lastProfileFetch.value = null
    lastTransactionsFetch.value = null
    lastBadgesFetch.value = null
    console.log('Points store reset')
  }

  /**
   * Normalize earned badge payload for UI consumption
   * @param {object} badge
   * @returns {object|null}
   */
  function normalizeEarnedBadge(badge) {
    if (!badge) return null

    const rarity = badge.rarity ? badge.rarity.toLowerCase() : 'common'

    return {
      id: badge.badge_id,
      badge_id: badge.badge_id,
      name: badge.name,
      icon: badge.icon,
      description: badge.description,
      rarity,
      category: badge.category,
      points_reward: badge.points_reward,
      points_rewarded: badge.points_reward,
      earned_at: badge.earned_at,
    }
  }

  /**
   * Normalize in-progress badge payload with safe percentage values
   * @param {object} badge
   * @returns {object|null}
   */
  function normalizeProgressBadge(badge) {
    if (!badge) return null

    const rarity = badge.rarity ? badge.rarity.toLowerCase() : 'common'
    const hasPercentage = badge.percentage !== undefined && badge.percentage !== null
    const derivedPercentage = badge.target_value
      ? (badge.current_value / badge.target_value) * 100
      : 0

    return {
      badge_id: badge.badge_id,
      name: badge.name,
      icon: badge.icon,
      description: badge.description,
      rarity,
      category: badge.category,
      points_reward: badge.points_reward,
      current_value: badge.current_value || 0,
      target_value: badge.target_value || 0,
      percentage: Number((hasPercentage ? badge.percentage : derivedPercentage).toFixed(2)),
    }
  }

  return {
    // State
    profile,
    transactions,
    badges,
    badgeProgress,
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
    isStreakBroken,
    earnedBadgesCount,
    inProgressBadgesCount,
    transactionsHasMore,
    transactionsFilter,
    transactionsPage,

    // Actions
    fetchProfile,
    fetchTransactions,
    performDailySignIn,
    fetchBadges,
    triggerBadgeCheck,
    canListItem,
    updateBalance,
    invalidateCache,
    resetStore,
  }
})
