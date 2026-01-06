import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMyReviews, createReview, canCreateReview } from '@/api/reviewAPI'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useReviewStore = defineStore('review', () => {
  // State
  const reviews = ref([])
  const isLoading = ref(false)
  const lastFetchTime = ref(null)
  const error = ref(null)

  // Computed
  const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const sum = reviews.value.reduce((acc, review) => acc + review.score, 0)
    return sum / reviews.value.length
  })

  const reviewCount = computed(() => reviews.value.length)

  const hasFreshData = computed(() => {
    if (!lastFetchTime.value) return false
    return Date.now() - lastFetchTime.value < CACHE_TTL
  })

  // Helper: Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        return diffInMinutes <= 1 ? '剛剛' : `${diffInMinutes}分鐘前`
      }
      return `${diffInHours}小時前`
    } else if (diffInDays < 30) {
      return `${diffInDays}天前`
    } else if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30)
      return `${diffInMonths}個月前`
    } else {
      const diffInYears = Math.floor(diffInDays / 365)
      return `${diffInYears}年前`
    }
  }

  // Actions
  let activeRequest = null

  /**
   * Fetch all reviews for the current user
   */
  async function fetchReviews(forceRefresh = false) {
    console.log('[ReviewStore] fetchReviews called', {
      forceRefresh,
      hasFreshData: hasFreshData.value,
      lastFetch: lastFetchTime.value,
    })

    // Use cache if available and fresh
    if (!forceRefresh && hasFreshData.value && !error.value) {
      console.log('[ReviewStore] Using cached reviews')
      return
    }

    // Reuse active request if exists
    if (activeRequest) {
      console.log('[ReviewStore] Reusing active fetch request')
      return activeRequest
    }

    isLoading.value = true
    error.value = null

    activeRequest = getMyReviews({
      page: 1,
      pageSize: 100,
      sortBy: 'created_at',
      sortDirection: 'desc',
    })
      .then((data) => {
        console.log('[ReviewStore] Reviews fetched', { count: data.length })

        // Transform API data to UI format
        reviews.value = data.map((review) => ({
          id: review.review_id,
          review_id: review.review_id,
          reviewer_id: review.reviewer_id,
          reviewer_nickname: review.reviewer_nickname,
          reviewer_avatar: review.reviewer_avatar || 'https://placehold.co/48/6fb8a5/ffffff?text=U',
          score: review.score,
          comment: review.comment || '此評價未留言',
          created_at: review.created_at,
          formatted_date: formatRelativeTime(review.created_at),
          transaction_id: review.transaction_id,
          item_id: review.item_id,
          item_title: review.item_title,
          item_image: review.item_image || 'https://placehold.co/60x60/6fb8a5/ffffff?text=Item',
        }))

        lastFetchTime.value = Date.now()
      })
      .catch((err) => {
        console.error('[ReviewStore] Failed to fetch reviews:', err)
        error.value = err
        throw err
      })
      .finally(() => {
        isLoading.value = false
        activeRequest = null
      })

    return activeRequest
  }

  /**
   * Add a new review to the store
   */
  async function addReview(reviewData) {
    console.log('[ReviewStore] addReview called', reviewData)

    try {
      isLoading.value = true
      error.value = null

      // Call API to create review
      const newReview = await createReview(reviewData)

      console.log('[ReviewStore] Review created successfully', newReview)

      // Refresh reviews from server
      await fetchReviews(true)

      return newReview
    } catch (err) {
      console.error('[ReviewStore] Failed to create review:', err)
      error.value = err
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Check if user can review a transaction
   */
  async function checkCanReview(transactionId) {
    try {
      const result = await canCreateReview(transactionId)
      return result
    } catch (err) {
      console.error('[ReviewStore] Failed to check review permission:', err)
      return {
        canReview: false,
        reason: '系統錯誤',
      }
    }
  }

  /**
   * Get review by ID
   */
  function getReviewById(reviewId) {
    return reviews.value.find((r) => r.review_id === reviewId) || null
  }

  /**
   * Get reviews for a specific transaction
   */
  function getReviewsByTransaction(transactionId) {
    return reviews.value.filter((r) => r.transaction_id === transactionId)
  }

  /**
   * Get reviews by reviewer
   */
  function getReviewsByReviewer(reviewerId) {
    return reviews.value.filter((r) => r.reviewer_id === reviewerId)
  }

  /**
   * Clear all reviews and cache
   */
  function clearAll() {
    reviews.value = []
    lastFetchTime.value = null
    error.value = null
    console.log('[ReviewStore] All reviews cleared')
  }

  /**
   * Get reviews grouped by rating
   */
  const reviewsByRating = computed(() => {
    const grouped = {
      5: [],
      4: [],
      3: [],
      2: [],
      1: [],
    }

    reviews.value.forEach((review) => {
      if (grouped[review.score]) {
        grouped[review.score].push(review)
      }
    })

    return grouped
  })

  /**
   * Get rating distribution
   */
  const ratingDistribution = computed(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    reviews.value.forEach((review) => {
      if (distribution[review.score] !== undefined) {
        distribution[review.score]++
      }
    })

    return distribution
  })

  return {
    // State
    reviews,
    isLoading,
    lastFetchTime,
    error,

    // Computed
    averageRating,
    reviewCount,
    hasFreshData,
    reviewsByRating,
    ratingDistribution,

    // Actions
    fetchReviews,
    addReview,
    checkCanReview,
    getReviewById,
    getReviewsByTransaction,
    getReviewsByReviewer,
    clearAll,
  }
})
