<template>
  <div class="user-profile-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="[{ label: '個人資料' }]" />

      <div class="profile-container">
        <!-- Loading Skeleton for Profile Header -->
    <section v-if="showProfileSkeleton" class="profile-header">
          <div class="header-content">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-user-info-section">
              <div class="skeleton-name"></div>
              <div class="skeleton-email"></div>
              <div class="skeleton-follow-stats">
                <div class="skeleton-follow-stat"></div>
                <div class="skeleton-follow-stat"></div>
              </div>
              <div class="skeleton-user-stats">
                <div class="skeleton-stat-item" v-for="i in 3" :key="`stat-${i}`"></div>
              </div>
              <div class="skeleton-action-buttons">
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
              </div>
            </div>
            <div class="col-xl-6 col-lg-6 mt-md-4 mt-xl-0">
              <div class="skeleton-badges">
                <div class="skeleton-badge" v-for="i in 4" :key="`badge-${i}`">
                  <div class="skeleton-badge-icon"></div>
                  <div class="skeleton-badge-content">
                    <div class="skeleton-badge-title"></div>
                    <div class="skeleton-badge-progress">
                      <div class="skeleton-badge-progress-bar"></div>
                    </div>
                    <div class="skeleton-badge-meta"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Profile Header Section -->
        <section v-else class="profile-header">
          <div class="header-content">
            <div class="user-avatar-section">
              <img
                v-if="displayAvatar"
                :src="displayAvatar"
                alt="User Avatar"
                class="user-avatar"
                referrerpolicy="no-referrer"
              />
              <i v-else class="bi bi-person-circle default-avatar"></i>
            </div>

            <div class="user-info-section">
              <h1 class="user-name">{{ displayName }}</h1>
              <p class="user-email">{{ authStore.userEmail }}</p>

              <!-- Followers/Following Stats -->
              <div class="follow-stats">
                <button class="follow-stat-btn" @click="goToFollowers">
                  <span class="stat-number">{{ profileData?.following_count || 0 }}</span>
                  <span class="stat-text">追蹤中</span>
                </button>
                <span class="stat-divider">|</span>
                <button class="follow-stat-btn" @click="goToFollowers">
                  <span class="stat-number">{{ profileData?.followers_count || 0 }}</span>
                  <span class="stat-text">追蹤者</span>
                </button>
              </div>

              <div class="user-stats">
                <div class="stat-item">
                  <i class="bi bi-leaf"></i>
                  <span class="stat-value">{{ userPoints }}</span>
                  <span class="stat-label">點數</span>
                </div>
                <div class="stat-item">
                  <i class="bi bi-box-seam"></i>
                  <span class="stat-value">{{ userStats.listings }}</span>
                  <span class="stat-label">刊登中</span>
                </div>
                <div class="stat-item">
                  <i class="bi bi-heart"></i>
                  <span class="stat-value">{{ userStats.favorites }}</span>
                  <span class="stat-label">收藏</span>
                </div>
              </div>

              <div class="action-buttons">
                <button class="edit-profile-btn" @click="goToEditProfile">
                  <i class="bi bi-pencil"></i>
                  編輯個人資料
                </button>
                <button class="review-btn" @click="goToReviews">
                  <i class="bi bi-star"></i>
                  查看評價
                </button>
              </div>
            </div>

            <!-- Achievement Badges -->
            <div class="col-xl-6 col-lg-6 mt-md-4 mt-xl-0">
              <AchievementBadges
                :total-carbon="userCarbonSaved"
                :show-carbon-total="true"
                :show-progress="true"
                :show-threshold="true"
                @badge-click="openBadgeModal"
              />
            </div>
          </div>
        </section>

        <!-- Navigation Tabs -->
        <section class="profile-tabs">
          <div class="tabs-container">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="['tab-btn', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <i :class="['bi', tab.icon]"></i>
              <span>{{ tab.label }}</span>
              <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
            </button>
          </div>
        </section>

        <!-- Tab Content -->
        <section class="tab-content">
          <!-- My Listings Tab -->
          <div v-show="activeTab === 'listings'" class="content-section">
            <div class="section-header">
              <h2 class="section-title">我的刊登</h2>
              <div class="header-actions">
                <button class="manage-btn" @click="goToManageListings">
                  <i class="bi bi-gear"></i>
                  管理刊登
                </button>
              </div>
            </div>

            <!-- Loading Skeleton -->
            <div v-if="isLoadingListings" class="listings-sections">
              <div class="listing-section">
                <div class="subsection-header">
                  <div class="skeleton-subsection-title"></div>
                  <div class="skeleton-subsection-count"></div>
                </div>
                <div class="desktop-grid">
                  <div class="listings-grid">
                    <div v-for="i in 4" :key="`skeleton-${i}`" class="skeleton-product-card">
                      <div class="skeleton-image"></div>
                      <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text short"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Has Listings -->
            <div v-else-if="myListings.length > 0" class="listings-sections">
              <!-- Active Listings Section (已上架) -->
              <div v-if="activeListings.length > 0" class="listing-section">
                <div class="subsection-header">
                  <h3 class="subsection-title">已上架</h3>
                  <span class="subsection-count">{{ activeListings.length }} 件</span>
                </div>

                <!-- Desktop: Grid with Show More -->
                <div class="desktop-grid">
                  <div class="listings-grid">
                    <ProductCard
                      v-for="product in displayedActiveListings"
                      :key="product.item_id"
                      :product="product"
                      @click="goToProductDetail(product.item_id)"
                    />
                  </div>
                  <button
                    v-if="activeListings.length > activeDisplayLimit"
                    class="show-more-btn"
                    @click="activeDisplayLimit += 4"
                  >
                    <i class="bi bi-chevron-down"></i>
                    顯示更多
                  </button>
                </div>

                <!-- Mobile: Swipeable Carousel -->
                <div class="mobile-carousel">
                  <button
                    class="carousel-arrow prev"
                    @click="scrollActivePrev"
                    :disabled="isActivePrevDisabled"
                  >
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <div ref="activeCarousel" class="carousel-container">
                    <div class="carousel-track">
                      <ProductCard
                        v-for="product in activeListings"
                        :key="product.item_id"
                        :product="product"
                        class="carousel-item"
                        @click="goToProductDetail(product.item_id)"
                      />
                    </div>
                  </div>
                  <button
                    class="carousel-arrow next"
                    @click="scrollActiveNext"
                    :disabled="isActiveNextDisabled"
                  >
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>

              <!-- Inactive Listings Section (已下架) -->
              <div v-if="inactiveListings.length > 0" class="listing-section">
                <div class="subsection-header">
                  <h3 class="subsection-title">已下架</h3>
                  <span class="subsection-count">{{ inactiveListings.length }} 件</span>
                </div>

                <!-- Desktop: Grid with Show More -->
                <div class="desktop-grid">
                  <div class="listings-grid">
                    <ProductCard
                      v-for="product in displayedInactiveListings"
                      :key="product.item_id"
                      :product="product"
                      @click="goToProductDetail(product.item_id)"
                    />
                  </div>
                  <button
                    v-if="inactiveListings.length > inactiveDisplayLimit"
                    class="show-more-btn"
                    @click="inactiveDisplayLimit += 4"
                  >
                    <i class="bi bi-chevron-down"></i>
                    顯示更多
                  </button>
                </div>

                <!-- Mobile: Swipeable Carousel -->
                <div class="mobile-carousel">
                  <button
                    class="carousel-arrow prev"
                    @click="scrollInactivePrev"
                    :disabled="isInactivePrevDisabled"
                  >
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <div ref="inactiveCarousel" class="carousel-container">
                    <div class="carousel-track">
                      <ProductCard
                        v-for="product in inactiveListings"
                        :key="product.item_id"
                        :product="product"
                        class="carousel-item"
                        @click="goToProductDetail(product.item_id)"
                      />
                    </div>
                  </div>
                  <button
                    class="carousel-arrow next"
                    @click="scrollInactiveNext"
                    :disabled="isInactiveNextDisabled"
                  >
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <i class="bi bi-box-seam"></i>
              <p>尚無刊登物品</p>
              <button class="action-btn" @click="goToCreateListing">
                <i class="bi bi-plus-circle"></i>
                刊登物品
              </button>
            </div>
          </div>

          <!-- Favorites Tab -->
          <div v-show="activeTab === 'favorites'" class="content-section">
            <div v-if="favoriteItems.length > 0" class="listings-grid">
              <ProductCard
                v-for="product in favoriteItems"
                :key="product.id"
                :product="product"
                @click="goToProductDetail(product.id)"
              />
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-heart"></i>
              <p>尚無收藏物品</p>
              <button class="action-btn" @click="goToHome">
                <i class="bi bi-search"></i>
                探索物品
              </button>
            </div>
          </div>

          <!-- Purchase History Tab -->
          <div v-show="activeTab === 'purchases'" class="content-section">
            <div v-if="purchaseHistory.length > 0" class="transactions-list">
              <TransactionCard
                v-for="transaction in purchaseHistory"
                :key="transaction.id"
                :transaction="transaction"
                @click="goToTransactionDetail(transaction.id)"
              />
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-bag"></i>
              <p>尚無購買紀錄</p>
            </div>
          </div>

          <!-- Sales History Tab -->
          <div v-show="activeTab === 'sales'" class="content-section">
            <div v-if="salesHistory.length > 0" class="transactions-list">
              <TransactionCard
                v-for="transaction in salesHistory"
                :key="transaction.id"
                :transaction="transaction"
                type="sale"
                @click="goToTransactionDetail(transaction.id)"
              />
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-cash-stack"></i>
              <p>尚無銷售紀錄</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <AppFooter />

    <!-- Bootstrap Badge Modal -->
    <div class="modal fade" id="badgeModal" ref="badgeModalRef" tabindex="-1" aria-labelledby="badgeModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title w-100 text-center" id="badgeModalLabel">{{ selectedBadge?.label }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <div v-if="selectedBadge">
              <img :src="selectedBadge.image" :alt="selectedBadge.label" class="img-fluid mb-3" style="max-height: 150px;" />
              <p class="mb-3">{{ selectedBadge.description }}</p>

              <div v-if="selectedBadge.unlocked" class="badge-status unlocked">
                <i class="bi bi-check-circle-fill"></i>
                <span>已解鎖</span>
              </div>
              <div v-else class="badge-status locked">
                <div class="progress-info">
                  <p class="mb-2"><strong>目前進度：{{ selectedBadge.progress }}%</strong></p>
                  <div class="progress mb-2" style="height: 20px;">
                    <div
                      class="progress-bar bg-success"
                      role="progressbar"
                      :style="{ width: selectedBadge.progress + '%' }"
                      :aria-valuenow="selectedBadge.progress"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {{ selectedBadge.progress }}%
                    </div>
                  </div>
                  <p v-if="selectedBadge.remainingKg > 0" class="text-muted small mb-0">
                    還需 <strong class="text-primary">{{ selectedBadge.remainingKg?.toFixed(1) || '0.0' }} kg</strong> 即可解鎖
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useFavoritesStore } from '../stores/favorites';
import { getMyItems } from '../api/get_myItemsAPI';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import ProductCard from '../components/ProductCard.vue';
import TransactionCard from '../components/TransactionCard.vue';
import AchievementBadges from '../components/AchievementBadges.vue';
import { Modal } from 'bootstrap';

// Badge images are now imported inside AchievementBadges component

const router = useRouter();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

// State
const userPoints = ref(500);
const activeTab = ref('listings');
const myListings = ref([]);
const isLoadingListings = ref(false);
const selectedBadge = ref(null);
const badgeModalRef = ref(null);
const badgeModalInstance = ref(null);

// Display limits for "Show More"
const activeDisplayLimit = ref(4);
const inactiveDisplayLimit = ref(4);

// Carousel scroll indices for mobile
const activeScrollIndex = ref(0);
const inactiveScrollIndex = ref(0);

// Refs for carousel containers
const activeCarousel = ref(null);
const inactiveCarousel = ref(null);

const userStats = computed(() => ({
  listings: myListings.value.length,
  favorites: favoritesStore.count,
  purchases: 5,
  sales: 3
}));

// 直接使用 authStore 的 profileData，不需要重複呼叫 API
const profileData = computed(() => authStore.profileData);

const userCarbonSaved = computed(() => {
  return profileData.value?.profile_details?.carbon_saved_kg || 0;
});

// 優先使用 profileData 的自定義資料，避免顯示閃爍
// 只有在 profileData 存在時才使用，否則繼續顯示 loading
const displayAvatar = computed(() => {
  return profileData.value?.profile_picture_url || '';
});

const displayName = computed(() => {
  if (!profileData.value) {
    return '使用者';
  }
  return profileData.value.nickname || '使用者';
});

const showProfileSkeleton = computed(() => {
  if (!authStore.isLoggedIn) {
    return false;
  }
  if (authStore.isLoadingProfile) {
    return true;
  }
  return !profileData.value;
});

// Achievement badges are now calculated inside AchievementBadges component

const tabs = computed(() => [
  { id: 'listings', label: '我的刊登', icon: 'bi-box-seam', count: userStats.value.listings },
  { id: 'favorites', label: '收藏', icon: 'bi-heart', count: userStats.value.favorites },
  { id: 'purchases', label: '購買紀錄', icon: 'bi-bag', count: userStats.value.purchases },
  { id: 'sales', label: '銷售紀錄', icon: 'bi-cash-stack', count: userStats.value.sales }
]);

const favoriteItems = computed(() => {
  console.log('Favorites from store:', favoritesStore.favoriteItems.length);
  return favoritesStore.favoriteItems;
});
const purchaseHistory = ref([]);
const salesHistory = ref([]);

// Split listings into active/inactive
const activeListings = computed(() => {
  return myListings.value.filter(item => item.listing_status === true);
});

const inactiveListings = computed(() => {
  return myListings.value.filter(item => item.listing_status === false);
});

// Display limited versions for desktop
const displayedActiveListings = computed(() => {
  return activeListings.value.slice(0, activeDisplayLimit.value);
});

const displayedInactiveListings = computed(() => {
  return inactiveListings.value.slice(0, inactiveDisplayLimit.value);
});

// Computed properties for carousel arrow disabled states
const isActivePrevDisabled = computed(() => {
  return activeScrollIndex.value === 0;
});

const isActiveNextDisabled = computed(() => {
  const visibleCards = getVisibleCardsCount();
  return activeScrollIndex.value >= activeListings.value.length - visibleCards;
});

const isInactivePrevDisabled = computed(() => {
  return inactiveScrollIndex.value === 0;
});

const isInactiveNextDisabled = computed(() => {
  const visibleCards = getVisibleCardsCount();
  return inactiveScrollIndex.value >= inactiveListings.value.length - visibleCards;
});

// 確保 profile 資料已載入
const ensureProfileLoaded = async () => {
  if (!authStore.isLoggedIn) {
    console.warn('[Profile] Not logged in, skipping');
    return;
  }

  try {
    // 如果 authStore 還沒載入 profileData，等待載入完成
    if (!authStore.profileData) {
      console.log('[Profile] Loading from auth store');
      await authStore.loadCustomProfile();
    } else {
      console.log('[Profile] Profile data already loaded');
    }
  } catch (error) {
    console.error('[Profile] Failed to load profile data:', error);
  }
};

// Define fetchMyListings FIRST before using it
const fetchMyListings = async () => {
  if (!authStore.isLoggedIn) {
    console.warn('⚠️ Not logged in, skipping fetch');
    return;
  }

  try {
    isLoadingListings.value = true;

    console.log('🔍 Fetching my items for user:', authStore.user?.id || 'unknown');

    const items = await getMyItems({
      page: 1,
      size: 20,
      sort_by: 'created_at',
      sort_direction: 'desc'
    });

    console.log('📦 Raw API response:', items);

    if (items) {
      // Transform API data to match ProductCard expectations
      myListings.value = items.map(item => ({
        item_id: item.item_id, // ProductCard expects item_id, not id
        title: item.title,
        image_url: item.image_url,
        price: item.price,
        condition: item.condition,
        listing_status: item.listing_status,
        distance_km: 0, // My own items, no distance needed
        formatted_address: item.location || '台中市', // Default location
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          // My own items, use current user info
          id: authStore.user?.id || '',
          nickname: authStore.userName || '我',
          profile_picture_url: authStore.userAvatar || ''
        }
      }));

      console.log('✅ My listings transformed:', myListings.value.length, 'items');
      console.log('First item:', myListings.value[0]);
    }
  } catch (error) {
    console.error('Failed to fetch my listings:', error);
  } finally {
    isLoadingListings.value = false;
  }
};

// Keep track of whether data has been loaded to prevent duplicates
let dataLoaded = false;

// Watch for auth state changes
watch(() => authStore.isLoggedIn, async (isLoggedIn) => {
  console.log('🔐 Auth state changed, logged in:', isLoggedIn);
  if (isLoggedIn && !dataLoaded) {
    dataLoaded = true;
    // Load all data in parallel to improve performance
    await Promise.allSettled([
      ensureProfileLoaded(),
      fetchMyListings(),
      favoritesStore.count === 0 ?
        favoritesStore.loadFavorites({
          page: 1,
          size: 100,
          sort_by: 'favorited_at',
          sort_direction: 'desc'
        }).then(() => {
          console.log('✅ Favorites loaded:', favoritesStore.count);
        }).catch((error) => {
          console.error('Failed to load favorites:', error);
        })
      : Promise.resolve()
    ]);
  } else if (!isLoggedIn) {
    dataLoaded = false;
  }
}, { immediate: true }); // Run immediately on mount

// Reset carousel scroll positions when window is resized
const handleResize = () => {
  activeScrollIndex.value = 0;
  inactiveScrollIndex.value = 0;

  // Re-scroll to ensure proper positioning
  if (activeCarousel.value) {
    scrollCarousel(activeCarousel.value, 0);
  }
  if (inactiveCarousel.value) {
    scrollCarousel(inactiveCarousel.value, 0);
  }
};

// Fetch data on mount if user is already logged in and data hasn't been loaded yet
onMounted(async () => {
  if (authStore.isLoggedIn && !dataLoaded) {
    dataLoaded = true;
    // Load all data in parallel to improve performance
    await Promise.allSettled([
      ensureProfileLoaded(),
      fetchMyListings(),
      favoritesStore.count === 0 ?
        favoritesStore.loadFavorites({
          page: 1,
          size: 100,
          sort_by: 'favorited_at',
          sort_direction: 'desc'
        }).then(() => {
          console.log('✅ Favorites loaded on mount:', favoritesStore.count);
        }).catch((error) => {
          console.error('Failed to load favorites:', error);
        })
      : Promise.resolve()
    ]);
  }

  if (badgeModalRef.value) {
    badgeModalInstance.value = new Modal(badgeModalRef.value);
  }

  // Add window resize listener to reset carousel positions
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (badgeModalInstance.value) {
    badgeModalInstance.value.dispose();
  }

  // Remove resize listener
  window.removeEventListener('resize', handleResize);
});

// Methods
const openBadgeModal = (badge) => {
  selectedBadge.value = badge;
  if (badgeModalInstance.value) {
    badgeModalInstance.value.show();
  }
};

const goToEditProfile = () => {
  router.push({ name: 'EditProfile' });
};

const goToCreateListing = () => {
  router.push({ name: 'CreateListing' });
};

const goToHome = () => {
  router.push({ name: 'Home' });
};

const goToProductDetail = (id) => {
  router.push({ name: 'ItemDetail', params: { id } });
};

const goToTransactionDetail = (id) => {
  router.push({ name: 'TransactionDetails', params: { id } });
};

const goToManageListings = () => {
  router.push({ name: 'ManageListings' });
};

const goToReviews = () => {
  router.push({ name: 'MyReviews' });
};

const goToFollowers = () => {
  router.push({ name: 'MyFollowers' });
};

// Get number of visible cards based on screen width
const getVisibleCardsCount = () => {
  const width = window.innerWidth;
  if (width < 768) return 1; // Mobile: 1 card
  if (width < 1200) return 2; // Tablet: 2 cards
  return 1; // This shouldn't be used since desktop uses grid, but default to 1
};

// Carousel scroll functions for mobile and tablet
const scrollActivePrev = () => {
  const visibleCards = getVisibleCardsCount();
  if (activeScrollIndex.value > 0) {
    activeScrollIndex.value = Math.max(0, activeScrollIndex.value - visibleCards);
    scrollCarousel(activeCarousel.value, activeScrollIndex.value);
  }
};

const scrollActiveNext = () => {
  const visibleCards = getVisibleCardsCount();
  const maxIndex = Math.max(0, activeListings.value.length - visibleCards);
  if (activeScrollIndex.value < maxIndex) {
    activeScrollIndex.value = Math.min(maxIndex, activeScrollIndex.value + visibleCards);
    scrollCarousel(activeCarousel.value, activeScrollIndex.value);
  }
};

const scrollInactivePrev = () => {
  const visibleCards = getVisibleCardsCount();
  if (inactiveScrollIndex.value > 0) {
    inactiveScrollIndex.value = Math.max(0, inactiveScrollIndex.value - visibleCards);
    scrollCarousel(inactiveCarousel.value, inactiveScrollIndex.value);
  }
};

const scrollInactiveNext = () => {
  const visibleCards = getVisibleCardsCount();
  const maxIndex = Math.max(0, inactiveListings.value.length - visibleCards);
  if (inactiveScrollIndex.value < maxIndex) {
    inactiveScrollIndex.value = Math.min(maxIndex, inactiveScrollIndex.value + visibleCards);
    scrollCarousel(inactiveCarousel.value, inactiveScrollIndex.value);
  }
};

const scrollCarousel = (carouselRef, index) => {
  if (carouselRef) {
    const track = carouselRef.querySelector('.carousel-track');
    if (track) {
      const items = track.querySelectorAll('.carousel-item');
      if (items.length === 0) return;

      const itemWidth = items[0].offsetWidth;
      const trackStyles = window.getComputedStyle(track);
      const gap = parseFloat(trackStyles.gap) || 12;

      const scrollPosition = index * (itemWidth + gap);
      track.style.transform = `translateX(-${scrollPosition}px)`;
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.user-profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

.profile-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

// Profile Header
.profile-header {
  background: white;
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.user-avatar-section {
  position: relative;
  flex-shrink: 0;

  .user-avatar,
  .default-avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
  }

  .default-avatar {
    font-size: 150px;
    color: #e0e0e0;
  }
}

.user-info-section {
  flex: 1;

  .user-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0 0 8px 0;
  }

  .user-email {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #666;
    margin: 0 0 16px 0;
  }
}

.follow-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  .follow-stat-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    padding: 0;

    .stat-number {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #1e1e1e;
    }

    .stat-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
    }

    &:hover {
      .stat-number,
      .stat-text {
        color: $primary;
      }
    }
  }

  .stat-divider {
    color: #d0d0d0;
    font-size: 14px;
  }
}

.user-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    min-width: fit-content;

    i {
      font-size: 24px;
      color: $primary;
      flex-shrink: 0;
    }

    .stat-value {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #1e1e1e;
      flex-shrink: 0;
    }

    .stat-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      flex-shrink: 0;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.edit-profile-btn,
.review-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 2px solid $primary;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: $primary;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }

  &:hover {
    background: $primary;
    color: white;
  }
}

// Badge Modal Styles
.badge-status {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;

  &.unlocked {
    background: #e6f4f0;
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;

    i {
      font-size: 24px;
    }
  }

  &.locked {
    background: #f9f9f9;

    .progress-info {
      text-align: left;
    }
  }
}

// Profile Tabs
.profile-tabs {
  background: white;
  border-radius: 12px;
  padding: 0;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.tabs-container {
  display: flex;
  gap: 0;
  min-width: fit-content;
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
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
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

// Tab Content
.tab-content {
  min-height: 400px;
}

.content-section {
  animation: fadeIn 0.3s ease;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .section-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .manage-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: white;
    border: 1px solid $primary;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: $primary;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 16px;
    }

    &:hover {
      background: $primary;
      color: white;
    }
  }
}

// Listings Sections
.listings-sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.listing-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.subsection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;

  .subsection-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }

  .subsection-count {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    background: #f5f5f5;
    padding: 4px 12px;
    border-radius: 12px;
  }
}

// Desktop grid (default)
.desktop-grid {
  display: block;
}

.mobile-carousel {
  display: none;
}

.show-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 20px auto 0;
  padding: 12px 32px;
  background: white;
  border: 1px solid $primary;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: $primary;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
    transition: transform 0.3s;
  }

  &:hover {
    background: $primary;
    color: white;

    i {
      transform: translateY(3px);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); // Default: 4 columns for large screens
  gap: 20px;

  // 1200-1399px: 3 columns
  @media (max-width: 1399.98px) {
    grid-template-columns: repeat(3, 1fr);
  }

  // 768-1199px: 2 columns
  @media (max-width: 1199.98px) {
    grid-template-columns: repeat(2, 1fr);
  }

  // <768px: 1 column (but carousel will be shown instead)
  @media (max-width: 767.98px) {
    grid-template-columns: 1fr;
  }
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  i {
    font-size: 80px;
    color: #e0e0e0;
    margin-bottom: 20px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    color: #999;
    margin: 0 0 24px 0;
  }

  .action-btn {
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
      font-size: 20px;
      color: white;
      margin: 0;
    }

    &:hover {
      background: #5fa795;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }
  }
}

// Responsive Design
// Large tablets and small desktops (992px - 1199px)
@media (max-width: 1199.98px) {
  .header-content {
    flex-wrap: wrap;
    gap: 32px;
  }

  .user-avatar-section {
    flex-shrink: 0;
  }

  .user-info-section {
    flex: 1;
    min-width: 300px;
  }

  // Achievement badges section responsive
  .col-xl-6.col-lg-6 {
    width: 100%;
  }
}

// Specific fix for carousel layout issues
.listing-section {
  // Desktop Grid Layout (1200px+)
  .desktop-grid {
    display: block;

    @media (max-width: 1199.98px) {
      display: none; // Hide desktop grid on smaller screens
    }
  }

  // Mobile Carousel Layout
  .mobile-carousel {
    display: none; // Default: hide mobile carousel

    // Tablet Layout (768px - 1199px): Show 2 cards with arrows
    @media (max-width: 1199.98px) and (min-width: 768px) {
      display: flex !important;
      align-items: center;
      gap: 10px;
      position: relative;

      .carousel-container {
        flex: 1;
        overflow: hidden;
      }

      .carousel-track {
        display: flex;
        gap: 20px; // Consistent gap
        transition: transform 0.3s ease;
      }

      .carousel-item {
        flex: 0 0 calc(50% - 10px) !important; // 2 cards per view (50% each - half gap)
        max-width: calc(50% - 10px) !important;
        min-width: calc(50% - 10px) !important;
        box-sizing: border-box !important;

        // Ensure ProductCard doesn't get overridden by global styles
        .product-card {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          border: 0.1px solid $primary !important; // Maintain original border
        }
      }

      .carousel-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: white !important;
        border: 1px solid $primary !important;
        border-radius: 50% !important;
        color: $primary !important;
        cursor: pointer !important;
        transition: all 0.3s !important;
        flex-shrink: 0 !important;
        z-index: 10 !important;

        i {
          font-size: 16px !important;
        }

        &:hover:not(:disabled) {
          background: $primary !important;
          color: white !important;
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        &.prev {
          order: -1;
        }

        &.next {
          order: 1;
        }
      }
    }
  }
}

// Tablets (768px - 991px)
@media (max-width: 991.98px) {
  .profile-container {
    padding: 0 15px;
  }

  .profile-header {
    padding: 30px 20px;
  }

  .header-content {
    gap: 28px;
  }

  .user-avatar-section {
    .user-avatar,
    .default-avatar {
      width: 100px;
      height: 100px;
    }

    .default-avatar {
      font-size: 100px;
    }
  }

  .user-info-section {
    .user-name {
      font-size: 26px;
    }

    .user-email {
      font-size: 15px;
    }
  }

  .user-stats {
    gap: 24px;

    .stat-item {
      i {
        font-size: 22px;
      }

      .stat-value {
        font-size: 22px;
      }

      .stat-label {
        font-size: 13px;
      }
    }
  }

  .action-buttons {
    .edit-profile-btn,
    .review-btn {
      font-size: 15px;
      padding: 10px 20px;
    }
  }

  // Skeleton responsive
  .skeleton-avatar {
    width: 120px;
    height: 120px;
  }

  .skeleton-user-info-section {
    align-items: center;
  }

  .skeleton-name {
    width: 180px;
  }

  .skeleton-email {
    width: 130px;
  }

  .skeleton-follow-stats {
    justify-content: center;
  }

  .skeleton-badges {
    gap: 12px;
  }

  .skeleton-badge {
    width: 100%;
    max-width: none;
  }

  .skeleton-badge-icon {
    width: 56px;
    height: 56px;
  }
}

// Mobile devices (< 768px)
@media (max-width: 767.98px) {
  .profile-header {
    padding: 24px 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
  }

  .user-avatar-section {
    .user-avatar,
    .default-avatar {
      width: 90px;
      height: 90px;
    }

    .default-avatar {
      font-size: 90px;
    }
  }

  .user-info-section {
    width: 100%;

    .user-name {
      font-size: 22px;
    }

    .user-email {
      font-size: 14px;
    }
  }

  .follow-stats {
    justify-content: center;

    .follow-stat-btn {
      .stat-number {
        font-size: 15px;
      }

      .stat-text {
        font-size: 13px;
      }
    }
  }

  .user-stats {
    justify-content: center;
    gap: 20px;

    .stat-item {
      i {
        font-size: 20px;
      }

      .stat-value {
        font-size: 20px;
      }

      .stat-label {
        font-size: 12px;
      }
    }
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;

    .edit-profile-btn,
    .review-btn {
      width: 100%;
      justify-content: center;
      font-size: 14px;
      padding: 10px 16px;
    }
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

  .skeleton-badges {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .skeleton-badge {
    width: 100%;
    min-width: 0;
    max-width: none;
  }

  // Mobile Layout: Show carousel with 1 card at a time
  .listing-section {
    .mobile-carousel {
      display: flex !important;
      align-items: center;
      gap: 10px;
      position: relative;

      .carousel-container {
        flex: 1;
        overflow: hidden;
      }

      .carousel-track {
        display: flex;
        gap: 15px; // Smaller gap for mobile
        transition: transform 0.3s ease;
      }

      .carousel-item {
        flex: 0 0 100% !important; // 1 card per view
        max-width: 100% !important;
        min-width: 100% !important;
        box-sizing: border-box !important;

        // Ensure ProductCard doesn't get overridden by global styles
        .product-card {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          border: 0.1px solid $primary !important;
        }
      }

      .carousel-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: white !important;
        border: 1px solid $primary !important;
        border-radius: 50% !important;
        color: $primary !important;
        cursor: pointer !important;
        transition: all 0.3s !important;
        flex-shrink: 0 !important;
        z-index: 10 !important;

        i {
          font-size: 16px !important;
        }

        &:hover:not(:disabled) {
          background: $primary !important;
          color: white !important;
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        &.prev {
          order: -1;
        }

        &.next {
          order: 1;
        }
      }
    }
  }
}

// Small mobile devices (< 576px)
@media (max-width: 575.98px) {
  .profile-container {
    padding: 0 10px;
  }

  .profile-header {
    padding: 20px 12px;
    margin-bottom: 16px;
  }

  .header-content {
    gap: 20px;
  }

  .user-avatar-section {
    .user-avatar,
    .default-avatar {
      width: 80px;
      height: 80px;
    }

    .default-avatar {
      font-size: 80px;
    }
  }

  .user-info-section {
    .user-name {
      font-size: 20px;
    }

    .user-email {
      font-size: 13px;
    }
  }

  .follow-stats {
    .follow-stat-btn {
      .stat-number {
        font-size: 14px;
      }

      .stat-text {
        font-size: 12px;
      }
    }
  }

  .user-stats {
    gap: 16px;
    flex-wrap: wrap;

    .stat-item {
      gap: 6px;

      i {
        font-size: 18px;
      }

      .stat-value {
        font-size: 18px;
      }

      .stat-label {
        font-size: 11px;
      }
    }
  }

  .action-buttons {
    gap: 8px;

    .edit-profile-btn,
    .review-btn {
      font-size: 13px;
      padding: 8px 12px;
    }
  }

  // Adjust carousel arrow size for smaller screens
  .carousel-arrow {
    width: 32px;
    height: 32px;

    i {
      font-size: 16px;
    }
  }

  .empty-state {
    padding: 50px 16px;

    i {
      font-size: 50px;
    }

    p {
      font-size: 15px;
    }
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

  .skeleton-email {
    width: 120px;
  }

  .skeleton-button {
    width: 100px;
    height: 40px;
  }

  .skeleton-badge {
    width: 100%;
    min-width: 0;
    max-width: none;
    padding: 14px;
  }

  .skeleton-badge-icon {
    width: 52px;
    height: 52px;
  }
}

/* Override global card styles that interfere with ProductCard */
.listings-sections .product-card,
.mobile-carousel .product-card {
  padding: 0 !important;
  margin: 0 !important;
  border: 0.1px solid $primary !important; // Preserve original border
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

.skeleton-user-info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-name {
  width: 250px;
  height: 32px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-email {
  width: 200px;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-follow-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.skeleton-follow-stat {
  width: 80px;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-user-stats {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.skeleton-stat-item {
  width: 100px;
  height: 40px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.skeleton-button {
  width: 150px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  width: calc(50% - 16px);
  min-width: 220px;
  max-width: 260px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skeleton-badge-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-badge-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
}

.skeleton-badge-title,
.skeleton-badge-meta {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-badge-title {
  width: 70%;
}

.skeleton-badge-meta {
  width: 50%;
}

.skeleton-badge-progress {
  height: 10px;
  width: 100%;
  border-radius: 6px;
  background: #f3f3f3;
  overflow: hidden;
}

.skeleton-badge-progress-bar {
  height: 100%;
  width: 60%;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-subsection-title {
  width: 100px;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-subsection-count {
  width: 60px;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-product-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-product-card > .skeleton-image,
.skeleton-product-card > .skeleton-content {
  width: 100%;
}

.skeleton-image {
  width: 100%;
  height: 280px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1199.98px) {
  .skeleton-product-card {
    flex-direction: column;
  }
}

@media (max-width: 767.98px) {
  .skeleton-product-card {
    flex-direction: column;
  }
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
</style>
