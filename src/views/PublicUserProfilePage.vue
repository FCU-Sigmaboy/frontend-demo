<template>
  <div class="public-user-profile-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="profile-container">
        <!-- Loading Skeleton for Profile Card -->
        <section v-if="isLoadingProfile" class="profile-card">
          <div class="profile-header-row">
            <div class="profile-left col-xl-6 col-lg-6">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-user-info">
                <div class="skeleton-name"></div>
                <div class="skeleton-meta"></div>
                <div class="skeleton-stats">
                  <div class="skeleton-stat"></div>
                  <div class="skeleton-stat"></div>
                </div>
                <div class="skeleton-button"></div>
              </div>
            </div>
            <div class="col-xl-6 col-lg-6 mt-md-4 mt-xl-0">
              <div class="skeleton-badges">
                <div class="skeleton-badge" v-for="i in 3" :key="`badge-${i}`"></div>
              </div>
            </div>
          </div>
          <div class="statistics-section">
            <div class="skeleton-section-title"></div>
            <div class="stats-grid">
              <div class="skeleton-stat-card" v-for="i in 3" :key="`stat-${i}`"></div>
            </div>
          </div>
        </section>

        <!-- User Profile Card -->
        <section v-else class="profile-card">
          <div class="profile-header-row">
            <div class="profile-left col-xl-6 col-lg-6">
              <!-- User Avatar -->
              <div class="user-avatar-section">
                <img :src="userData.avatar" :alt="userData.name" class="user-avatar" />
              </div>

              <!-- User Info -->
              <div class="user-info">
                <h1 class="user-name">{{ userData.name }}</h1>
                <div class="user-meta">
                  <span class="join-date">
                    <i class="bi bi-calendar"></i>
                    加入時間：{{ userData.joinDate }}
                  </span>
                </div>

                <!-- Stats -->
                <div class="user-stats-compact">
                  <div class="stat-item clickable" @click="openFollowersModal('followers')">
                    <span class="stat-number">{{ userData.stats.followers }}</span>
                    <span class="stat-label">追蹤者</span>
                  </div>
                  <div class="stat-item clickable" @click="openFollowersModal('following')">
                    <span class="stat-number">{{ userData.stats.following }}</span>
                    <span class="stat-label">追蹤中</span>
                  </div>
                </div>

                <!-- Action Button -->
                <button
                  :class="['follow-btn', { following: isFollowing, loading: isLoadingFollow }]"
                  @click="toggleFollow"
                  @mouseenter="isFollowBtnHovered = true"
                  @mouseleave="isFollowBtnHovered = false"
                  :disabled="isLoadingFollow"
                >
                  <template v-if="isLoadingFollow">
                    <span
                      class="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span class="btn-text">處理中...</span>
                  </template>
                  <template v-else>
                    <i
                      :class="[
                        'bi',
                        isFollowing ? (isFollowBtnHovered ? 'bi-x' : 'bi-check') : 'bi-plus',
                      ]"
                    ></i>
                    <span class="btn-text">
                      {{ isFollowing ? (isFollowBtnHovered ? '取消追蹤' : '已追蹤') : '追蹤' }}
                    </span>
                  </template>
                </button>
              </div>
            </div>

            <!-- Achievement Badges -->
            <div class="col-xl-6 col-lg-6 mt-md-4 mt-xl-0">
              <CombinedAchievements
                :user-id="userData.id"
                :total-carbon="userData.carbonSaved"
                :show-carbon-total="true"
                :is-own-profile="false"
                @achievement-click="openBadgeModal"
              />
            </div>
          </div>

          <!-- Statistics Section -->
          <div class="statistics-section">
            <h3 class="section-title">統計資料</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <i class="bi bi-box-seam stat-icon"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ userData.stats.totalListings }}</span>
                  <span class="stat-name">刊登物品</span>
                </div>
              </div>
              <div class="stat-card">
                <i class="bi bi-check-circle stat-icon"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ userData.stats.completedDeals }}</span>
                  <span class="stat-name">完成交易</span>
                </div>
              </div>
              <div class="stat-card">
                <i class="bi bi-star stat-icon"></i>
                <div class="stat-info">
                  <span v-if="reviews.length > 0" class="stat-value">{{
                    averageRating.toFixed(1)
                  }}</span>
                  <span v-else class="stat-value">無評分</span>
                  <span class="stat-name">平均評分</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tabs Section -->
        <section class="tabs-section">
          <div class="tabs-header">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="['tab-btn', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <i :class="['bi', tab.icon]"></i>
              <span>{{ tab.label }}</span>
              <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tabs-content">
            <!-- Listings Tab -->
            <div v-show="activeTab === 'listings'" class="tab-pane">
              <!-- Loading Skeleton -->
              <div v-if="isLoadingListings" class="listings-grid">
                <div v-for="i in 6" :key="`skeleton-${i}`" class="skeleton-product-card">
                  <div class="skeleton-image"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                  </div>
                </div>
              </div>
              <!-- Listings Grid -->
              <div v-else-if="userListings.length > 0" class="listings-grid">
                <ProductCard
                  v-for="product in userListings"
                  :key="product.item_id"
                  :product="product"
                  @click="goToProductDetail(product.item_id)"
                />
              </div>
              <!-- Empty State -->
              <div v-else class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>此使用者尚無刊登物品</p>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-show="activeTab === 'reviews'" class="tab-pane">
              <!-- Loading Skeleton -->
              <div v-if="isLoadingReviews" class="reviews-skeleton">
                <div class="skeleton-rating-summary">
                  <div class="skeleton-rating-score"></div>
                  <div class="skeleton-rating-bars">
                    <div v-for="i in 5" :key="`bar-${i}`" class="skeleton-bar"></div>
                  </div>
                </div>
                <div class="skeleton-reviews-list">
                  <div v-for="i in 3" :key="`review-${i}`" class="skeleton-review-card">
                    <div class="skeleton-review-header">
                      <div class="skeleton-review-avatar"></div>
                      <div class="skeleton-review-info">
                        <div class="skeleton-review-name"></div>
                        <div class="skeleton-review-stars"></div>
                      </div>
                    </div>
                    <div class="skeleton-review-text"></div>
                    <div class="skeleton-review-text short"></div>
                  </div>
                </div>
              </div>

              <!-- Reviews Content -->
              <div v-else-if="reviews.length > 0">
                <!-- Rating Summary -->
                <div class="rating-summary">
                  <div class="rating-overview">
                    <div class="rating-score-large">{{ averageRating.toFixed(1) }}</div>
                    <div class="rating-stars-large">
                      <i
                        v-for="n in 5"
                        :key="n"
                        :class="['bi', n <= Math.floor(averageRating) ? 'bi-star-fill' : 'bi-star']"
                      ></i>
                    </div>
                    <p class="rating-count">{{ reviews.length }} 則評價</p>
                  </div>

                  <div class="rating-breakdown">
                    <div v-for="rating in [5, 4, 3, 2, 1]" :key="rating" class="rating-bar-item">
                      <span class="rating-label">{{ rating }} 星</span>
                      <div class="rating-bar">
                        <div
                          class="rating-bar-fill"
                          :style="{ width: `${getRatingPercentage(rating)}%` }"
                        ></div>
                      </div>
                      <span class="rating-percentage">{{ getRatingCount(rating) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Reviews List -->
                <div class="reviews-list">
                  <div v-for="review in reviews" :key="review.id" class="review-card">
                    <div class="review-header">
                      <img
                        :src="review.reviewer.avatar"
                        :alt="review.reviewer.name"
                        class="reviewer-avatar"
                      />
                      <div class="reviewer-info">
                        <h4 class="reviewer-name">{{ review.reviewer.name }}</h4>
                        <div class="review-meta">
                          <div class="review-stars">
                            <i
                              v-for="n in 5"
                              :key="n"
                              :class="['bi', n <= review.rating ? 'bi-star-fill' : 'bi-star']"
                            ></i>
                          </div>
                          <span class="review-date">{{ review.date }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="review-comment">{{ review.comment }}</p>
                    <div v-if="review.transaction" class="review-transaction">
                      <img
                        :src="review.transaction.image"
                        :alt="review.transaction.name"
                        class="transaction-image"
                      />
                      <span class="transaction-name">{{ review.transaction.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="empty-state">
                <i class="bi bi-chat-quote"></i>
                <p>此使用者尚無評價</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <AppFooter />

    <!-- Followers/Following Modal -->
    <FollowersFollowingModal
      v-model="showFollowersModal"
      :user-id="userData.id"
      :initial-tab="followersModalTab"
      :followers-count="userData.stats.followers"
      :following-count="userData.stats.following"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppHeader from '../components/AppHeader.vue'
  import AppFooter from '../components/AppFooter.vue'
  import ProductCard from '../components/ProductCard.vue'
  import CombinedAchievements from '../components/CombinedAchievements.vue'
  import FollowersFollowingModal from '../components/FollowersFollowingModal.vue'
  import { searchItems } from '../api/itemsAPI'
  import { getPublicUserProfile } from '../api/profileAPI'
  import { followUser, unfollowUser } from '../api/followAPI'
  import { getOthersReviews } from '../api/reviewAPI'

  const route = useRoute()
  const router = useRouter()

  // State
  const userPoints = ref(0)
  const activeTab = ref('listings')
  const isLoadingListings = ref(false)
  const isLoadingProfile = ref(false)
  const isLoadingReviews = ref(false)
  const isLoadingFollow = ref(false)
  const isFollowBtnHovered = ref(false)
  const showFollowersModal = ref(false)
  const followersModalTab = ref('followers')

  // User data (from API)
  const userData = ref({
    id: route.params.id || '',
    name: '載入中...',
    handle: '',
    avatar: 'https://placehold.co/150/6fb8a5/ffffff?text=User',
    joinDate: '',
    avgRating: 0,
    carbonSaved: 0, // Added for badge progress calculation
    followed_at: null,
    stats: {
      followers: 0,
      following: 0,
      totalListings: 0,
      completedDeals: 0,
    },
  })

  const isFollowing = computed(() => Boolean(userData.value.followed_at))

  // Achievement badges are now calculated inside AchievementBadges component

  // Tabs
  const tabs = computed(() => [
    { id: 'listings', label: '刊登物品', icon: 'bi-box-seam', count: userListings.value.length },
    { id: 'reviews', label: '評價', icon: 'bi-star', count: reviews.value.length },
  ])

  // User listings (from API)
  const userListings = ref([])

  // User reviews (from API)
  const reviews = ref([])

  // Computed
  const averageRating = computed(() => {
    // Use API average rating if available, otherwise calculate from reviews
    if (userData.value.avgRating > 0) {
      return userData.value.avgRating
    }
    if (reviews.value.length === 0) return 0
    const sum = reviews.value.reduce((acc, review) => acc + review.score, 0)
    return sum / reviews.value.length
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

  // Methods
  const getRatingCount = (rating) => {
    return reviews.value.filter((r) => r.score === rating).length
  }

  const getRatingPercentage = (rating) => {
    if (reviews.value.length === 0) return 0
    return (getRatingCount(rating) / reviews.value.length) * 100
  }

  const toggleFollow = async () => {
    // 防止重複點擊
    if (isLoadingFollow.value) return

    try {
      isLoadingFollow.value = true

      if (isFollowing.value) {
        // 取消追蹤
        await unfollowUser(userData.value.id)
        userData.value.followed_at = null
        // 更新追蹤者數量
        if (userData.value.stats.followers > 0) {
          userData.value.stats.followers--
        }
        console.log('✅ 成功取消追蹤')
      } else {
        // 追蹤使用者
        const result = await followUser(userData.value.id)
        userData.value.followed_at = result?.followed_at || new Date().toISOString()
        // 更新追蹤者數量
        userData.value.stats.followers++
        console.log('✅ 成功追蹤:', result)
      }
    } catch (error) {
      console.error('追蹤操作失敗:', error)
      // 可以在這裡加入 Toast 提示或其他錯誤處理
      alert(error.message || '操作失敗，請稍後再試')
    } finally {
      isLoadingFollow.value = false
      isFollowBtnHovered.value = false
    }
  }

  const goToProductDetail = (id) => {
    router.push({ name: 'ItemDetail', params: { id } })
  }

  const openBadgeModal = (badge) => {
    // TODO: 可以在這裡加入 Modal 顯示邏輯
    console.log('Badge clicked:', badge)
  }

  const openFollowersModal = (tab) => {
    followersModalTab.value = tab
    showFollowersModal.value = true
  }

  // Fetch user's profile
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      console.warn('No user ID provided')
      return
    }

    try {
      isLoadingProfile.value = true
      console.log('Fetching profile for user:', userId)

      const profile = await getPublicUserProfile(userId)

      if (profile) {
        // Format the join date
        const joinDate = new Date(profile.created_at)
        const formattedDate = joinDate.toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
        })

        userData.value = {
          id: profile.id,
          name: profile.nickname || '使用者',
          handle: profile.nickname || 'user',
          avatar: profile.profile_picture_url || 'https://placehold.co/150/6fb8a5/ffffff?text=User',
          joinDate: formattedDate,
          avgRating: profile.avg_rating || 0,
          carbonSaved: profile.carbon_saved_kg || 0, // Added for badge progress calculation
          followed_at: profile.followed_at || null,
          stats: {
            followers: profile.followers_count || 0,
            following: profile.following_count || 0,
            totalListings: 0, // Will be updated from listings
            completedDeals: 0, // TODO: Add this to API if available
          },
        }

        console.log('✅ User profile loaded:', profile)
      } else {
        console.warn('Profile not found for user:', userId)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    } finally {
      isLoadingProfile.value = false
    }
  }

  // Fetch user's listings
  const fetchUserListings = async (userId) => {
    if (!userId) {
      console.warn('No user ID provided')
      return
    }

    try {
      isLoadingListings.value = true
      console.log('Fetching listings for user:', userId)

      const items = await searchItems({
        user_id: userId,
        page: 1,
        size: 20,
        sort_by: 'created_at',
        sort_direction: 'desc',
      })

      if (items) {
        userListings.value = items
        // Update total listings count
        userData.value.stats.totalListings = items.length
        console.log('✅ User listings loaded:', items.length, 'items')
      }
    } catch (error) {
      console.error('Failed to fetch user listings:', error)
      userListings.value = []
    } finally {
      isLoadingListings.value = false
    }
  }

  // Fetch user's reviews
  const fetchUserReviews = async (userId) => {
    if (!userId) {
      console.warn('No user ID provided')
      return
    }

    try {
      isLoadingReviews.value = true
      console.log('Fetching reviews for user:', userId)

      const data = await getOthersReviews({
        userId: userId,
        page: 1,
        pageSize: 100,
        sortBy: 'created_at',
        sortDirection: 'desc',
      })

      if (data) {
        // Transform API data to match template structure
        reviews.value = data.map((review) => ({
          id: review.review_id,
          review_id: review.review_id,
          reviewer: {
            id: review.reviewer_id,
            name: review.reviewer_nickname || '使用者',
            avatar: review.reviewer_avatar || 'https://placehold.co/48/6fb8a5/ffffff?text=U',
          },
          rating: review.score,
          score: review.score,
          comment: review.comment || '此評價未留言',
          date: formatRelativeTime(review.created_at),
          created_at: review.created_at,
          transaction: review.item_id
            ? {
                id: review.item_id,
                name: review.item_title || '商品',
                image: review.item_image || 'https://placehold.co/60x60/6fb8a5/ffffff?text=Item',
              }
            : null,
        }))

        console.log('✅ User reviews loaded:', reviews.value.length, 'reviews')
      }
    } catch (error) {
      console.error('Failed to fetch user reviews:', error)
      reviews.value = []
    } finally {
      isLoadingReviews.value = false
    }
  }

  // Fetch data when component mounts
  onMounted(async () => {
    const userId = route.params.id
    if (userId) {
      // Fetch profile, listings, and reviews in parallel
      await Promise.all([
        fetchUserProfile(userId),
        fetchUserListings(userId),
        fetchUserReviews(userId),
      ])
    }
  })
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .public-user-profile-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f9f9f9;
  }

  .main-content {
    flex: 1;
    padding: 30px 0 60px;
  }

  .profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  // Profile Card
  .profile-card {
    background: white;
    border-radius: 12px;
    padding: 40px;
    margin-bottom: 30px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .profile-header-row {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
  }

  .profile-left {
    display: flex;
    gap: 30px;
    align-items: flex-start;
    flex: 1;
    min-width: 300px;
  }

  .user-avatar-section {
    flex-shrink: 0;

    .user-avatar {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .user-info {
    flex: 1;

    .user-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #1e1e1e;
      margin: 0 0 8px 0;
    }

    .user-meta {
      margin-bottom: 16px;

      .join-date {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #666;

        i {
          font-size: 14px;
        }
      }
    }
  }

  .user-stats-compact {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;

    .stat-item {
      display: flex;
      align-items: baseline;
      gap: 6px;

      &.clickable {
        cursor: pointer;
        transition: opacity 0.3s;

        &:hover {
          opacity: 0.7;
        }
      }

      .stat-number {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #1e1e1e;
      }

      .stat-label {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #666;
      }
    }
  }

  .follow-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 32px;
    background: $primary;
    border: none;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 18px;
    }

    .spinner-border-sm {
      width: 16px;
      height: 16px;
      border-width: 2px;
    }

    &:hover:not(:disabled) {
      background: #5fa795;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    &.loading {
      pointer-events: none;
    }

    &.following {
      background: white;
      border: 2px solid $primary;
      color: $primary;

      &:hover:not(:disabled) {
        background: #dc3545;
        border-color: #dc3545;
        color: white;
        transform: translateY(-2px);
      }
    }
  }

  .follow-btn .btn-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
  }

  // Statistics Section
  .statistics-section {
    .section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 20px 0;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 12px;
    transition: all 0.3s;

    &:hover {
      background: #f0f0f0;
    }

    .stat-icon {
      font-size: 32px;
      color: $primary;
      flex-shrink: 0;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .stat-value {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 24px;
        font-weight: 700;
        color: #1e1e1e;
      }

      .stat-name {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 13px;
        color: #666;
      }
    }
  }

  // Tabs Section
  .tabs-section {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .tabs-header {
    display: flex;
    border-bottom: 2px solid #f0f0f0;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px 30px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: -2px;
    white-space: nowrap;

    i {
      font-size: 20px;
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      background: #e0e0e0;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }

    &:hover {
      color: $primary;
      background: #f9f9f9;
    }

    &.active {
      color: $primary;
      border-bottom-color: $primary;

      .tab-count {
        background: $primary;
        color: white;
      }
    }
  }

  .tabs-content {
    padding: 30px;
  }

  .tab-pane {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  // Listings Grid
  .listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  // Loading State
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;

    .spinner-border {
      width: 3rem;
      height: 3rem;
      margin-bottom: 20px;
    }

    p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      color: #666;
      margin: 0;
    }
  }

  // Rating Summary
  .rating-summary {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 40px;
    padding: 30px;
    background: #f9f9f9;
    border-radius: 12px;
    margin-bottom: 30px;
  }

  .rating-overview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .rating-score-large {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 48px;
      font-weight: 700;
      color: #1e1e1e;
      line-height: 1;
      margin-bottom: 12px;
    }

    .rating-stars-large {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;

      i {
        font-size: 24px;
        color: #ffc107;

        &.bi-star {
          color: #e0e0e0;
        }
      }
    }

    .rating-count {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }

  .rating-breakdown {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .rating-bar-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .rating-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      width: 50px;
      flex-shrink: 0;
    }

    .rating-bar {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;

      .rating-bar-fill {
        height: 100%;
        background: $primary;
        transition: width 0.3s ease;
      }
    }

    .rating-percentage {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      width: 30px;
      flex-shrink: 0;
      text-align: right;
    }
  }

  // Reviews List
  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .review-card {
    padding: 24px;
    background: #f9f9f9;
    border-radius: 12px;
  }

  .review-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;

    .reviewer-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .reviewer-info {
      flex: 1;

      .reviewer-name {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 15px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0 0 6px 0;
      }

      .review-meta {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .review-stars {
        display: flex;
        gap: 2px;

        i {
          font-size: 14px;
          color: #ffc107;

          &.bi-star {
            color: #e0e0e0;
          }
        }
      }

      .review-date {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 13px;
        color: #999;
      }
    }
  }

  .review-comment {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1e1e1e;
    margin: 0 0 16px 0;
  }

  .review-transaction {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border-radius: 8px;

    .transaction-image {
      width: 50px;
      height: 50px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .transaction-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1e1e1e;
    }
  }

  // Empty State
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;

    i {
      font-size: 60px;
      color: #e0e0e0;
      margin-bottom: 16px;
    }

    p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      margin: 0;
    }
  }

  // Skeleton Loading Styles
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .skeleton-avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  .skeleton-user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .skeleton-name {
    width: 200px;
    height: 28px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-meta {
    width: 150px;
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-stats {
    display: flex;
    gap: 24px;
  }

  .skeleton-stat {
    width: 80px;
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-button {
    width: 120px;
    height: 44px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-badges {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .skeleton-badge {
    width: 100px;
    height: 120px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 12px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-section-title {
    width: 120px;
    height: 24px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
    margin-bottom: 20px;
  }

  .skeleton-stat-card {
    height: 80px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 12px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-product-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .skeleton-image {
    width: 100%;
    height: 280px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-title {
    width: 80%;
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-text {
    width: 100%;
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;

    &.short {
      width: 60%;
    }
  }

  // Reviews Skeleton Styles
  .reviews-skeleton {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .skeleton-rating-summary {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 40px;
    padding: 30px;
    background: #f9f9f9;
    border-radius: 12px;
  }

  .skeleton-rating-score {
    width: 120px;
    height: 120px;
    margin: 0 auto;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 12px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-rating-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .skeleton-bar {
    width: 100%;
    height: 24px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-reviews-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .skeleton-review-card {
    padding: 24px;
    background: #f9f9f9;
    border-radius: 12px;
  }

  .skeleton-review-header {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .skeleton-review-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  .skeleton-review-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-review-name {
    width: 120px;
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-review-stars {
    width: 100px;
    height: 14px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-review-text {
    width: 100%;
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
    margin-bottom: 8px;

    &.short {
      width: 70%;
    }
  }

  // Responsive
  @media (max-width: 1199.98px) {
    .profile-header-row {
      flex-wrap: wrap;
      gap: 32px;
    }

    .profile-left {
      flex: 1;
      min-width: 300px;
    }
  }

  @media (max-width: 991.98px) {
    .main-content {
      padding: 20px 0 50px;
    }

    .profile-container {
      padding: 0 15px;
    }

    .profile-card {
      padding: 30px 24px;
      gap: 30px;
    }

    .profile-header-row {
      flex-direction: column;
      gap: 30px;
    }

    .profile-left {
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 100%;
    }

    .user-avatar-section .user-avatar {
      width: 120px;
      height: 120px;
    }

    .user-stats-compact {
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .rating-summary {
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .skeleton-rating-summary {
      grid-template-columns: 1fr;
      gap: 30px;
    }

    // Skeleton responsive
    .skeleton-avatar {
      width: 120px;
      height: 120px;
    }

    .skeleton-user-info {
      align-items: center;
    }

    .skeleton-name {
      width: 180px;
    }

    .skeleton-meta {
      width: 130px;
    }

    .skeleton-stats {
      justify-content: center;
    }
  }

  @media (max-width: 767.98px) {
    .profile-card {
      padding: 24px 20px;
    }

    .user-info .user-name {
      font-size: 24px;
    }

    .tabs-content {
      padding: 20px;
    }

    .tab-btn {
      padding: 16px 20px;
      font-size: 14px;

      i {
        font-size: 18px;
      }

      span:not(.tab-count) {
        display: none;
      }
    }
  }

  @media (max-width: 575.98px) {
    .main-content {
      padding: 15px 0 40px;
    }

    .profile-container {
      padding: 0 10px;
    }

    .profile-card {
      padding: 20px 16px;
      gap: 30px;
    }

    .user-avatar-section .user-avatar {
      width: 100px;
      height: 100px;
    }

    .user-info .user-name {
      font-size: 20px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .listings-grid {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .tabs-content {
      padding: 16px;
    }

    .rating-summary {
      padding: 20px;
    }

    .review-card {
      padding: 16px;
    }

    // Skeleton responsive for small screens
    .skeleton-avatar {
      width: 100px;
      height: 100px;
    }

    .skeleton-name {
      width: 150px;
      height: 24px;
    }

    .skeleton-meta {
      width: 120px;
    }

    .skeleton-button {
      width: 100px;
      height: 40px;
    }

    .skeleton-badge {
      width: 80px;
      height: 100px;
    }
  }
</style>
