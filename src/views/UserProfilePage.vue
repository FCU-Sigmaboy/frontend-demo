<template>
  <div class="user-profile-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="[{ label: '個人資料' }]" />

      <div class="profile-container">
        <!-- Profile Header Section -->
        <section class="profile-header">
          <div class="header-content">
            <div class="user-avatar-section">
              <img
                v-if="authStore.userAvatar"
                :src="authStore.userAvatar"
                alt="User Avatar"
                class="user-avatar"
                referrerpolicy="no-referrer"
              />
              <i v-else class="bi bi-person-circle default-avatar"></i>
            </div>

            <div class="user-info-section">
              <h1 class="user-name">{{ authStore.userName || '使用者' }}</h1>
              <p class="user-email">{{ authStore.userEmail }}</p>

              <!-- Followers/Following Stats -->
              <div class="follow-stats">
                <button class="follow-stat-btn" @click="goToFollowers">
                  <span class="stat-number">0</span>
                  <span class="stat-text">追蹤中</span>
                </button>
                <span class="stat-divider">|</span>
                <button class="follow-stat-btn" @click="goToFollowers">
                  <span class="stat-number">0</span>
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

            <div class="achievements-section col-xl-6 col-lg-6 mt-md-4 mt-xl-0">
              <h3 class="achievements-title">
                成就徽章
                <span class="carbon-total">總碳足跡節省: {{ userCarbonSaved.toFixed(1) }} kg</span>
              </h3>
              <div class="achievements-stepper">
                <div class="unlocked-line" :style="{ width: unlockedLineWidth }"></div>
                <div
                    v-for="badge in achievements"
                    :key="badge.id"
                    :class="['step-item', { 'unlocked': badge.unlocked }]"
                    @click="openBadgeModal(badge)"
                >
                  <div class="step-circle">
                    <img :src="badge.image" :alt="badge.label" class="step-image" />
                    <div v-if="!badge.unlocked" class="progress-overlay">
                      <span class="progress-text">{{ badge.progress }}%</span>
                    </div>
                  </div>
                  <span class="step-label">{{ badge.label }}</span>
                  <span v-if="!badge.unlocked" class="step-requirement">{{ badge.threshold }} kg</span>
                </div>
              </div>
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
                <button class="refresh-btn" @click="fetchMyListings" title="重新整理">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
                <button class="manage-btn" @click="goToManageListings">
                  <i class="bi bi-gear"></i>
                  管理刊登
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoadingListings" class="loading-state">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">載入中...</span>
              </div>
              <p>載入中...</p>
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
                    :disabled="activeScrollIndex === 0"
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
                    :disabled="activeScrollIndex >= activeListings.length - 1"
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
                    :disabled="inactiveScrollIndex === 0"
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
                    :disabled="inactiveScrollIndex >= inactiveListings.length - 1"
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
                  <p class="text-muted small mb-0">
                    還需 <strong class="text-primary">{{ selectedBadge.remainingKg.toFixed(1) }} kg</strong> 即可解鎖
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
import { getMyProfileForEdit } from '../api/get_myProfileDetailsAPI';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import ProductCard from '../components/ProductCard.vue';
import TransactionCard from '../components/TransactionCard.vue';
import { Modal } from 'bootstrap';

// --- 徽章圖片 ---
// 請確保您將上傳的圖片放置在 'src/assets/images/' 路徑下
import badgeRookie from '../assets/1badge.png';
import badgeAdept from '../assets/2badge.png';
import badgeExpert from '../assets/3badge.png';
import badgeMaster from '../assets/4badge.png';

const router = useRouter();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

// State
const userPoints = ref(500);
const userCarbonSaved = ref(0); // 使用者節省的碳足跡 (kg)
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

// Achievement Badges (Updated with carbon footprint thresholds)
const achievementThresholds = [
  { id: 1, label: '環保新手', threshold: 10, image: badgeRookie, description: '節省 10kg 碳足跡，開啟您的環保旅程！' },
  { id: 2, label: '環保達人', threshold: 50, image: badgeAdept, description: '節省 50kg 碳足跡，感謝您為地球的貢獻！' },
  { id: 3, label: '環保高手', threshold: 100, image: badgeExpert, description: '節省 100kg 碳足跡，您是環保的實踐家！' },
  { id: 4, label: '環保大師', threshold: 200, image: badgeMaster, description: '節省 200kg 碳足跡，您的環保精神值得敬佩！' },
];

// Computed achievements with unlock status and progress
const achievements = computed(() => {
  return achievementThresholds.map((badge, index) => {
    const unlocked = userCarbonSaved.value >= badge.threshold;
    const nextThreshold = badge.threshold;
    const prevThreshold = index > 0 ? achievementThresholds[index - 1].threshold : 0;

    // Calculate progress to next badge (0-100%)
    let progress = 0;
    if (unlocked) {
      progress = 100;
    } else {
      const rangeSize = nextThreshold - prevThreshold;
      const currentProgress = userCarbonSaved.value - prevThreshold;
      progress = Math.max(0, Math.min(100, (currentProgress / rangeSize) * 100));
    }

    return {
      ...badge,
      unlocked,
      progress: Math.round(progress),
      currentKg: userCarbonSaved.value,
      remainingKg: Math.max(0, nextThreshold - userCarbonSaved.value)
    };
  });
});

// Computed property for unlocked line width (Added)
const unlockedSteps = computed(() => {
  return achievements.value.filter(b => b.unlocked).length;
});

const unlockedLineWidth = computed(() => {
  const totalSteps = achievements.value.length;
  if (unlockedSteps.value <= 1) {
    return '0%';
  }
  // 寬度是 (已解鎖 - 1) / (總數 - 1) * 75% (線條總寬度)
  const percentage = (unlockedSteps.value - 1) / (totalSteps - 1);
  return `${percentage * 75}%`;
});

// 給手機版使用的寬度計算 (Added)
const unlockedLineWidthMobile = computed(() => {
  const totalSteps = achievements.value.length;
  if (unlockedSteps.value <= 1) return '0%';
  // 在手機版，線條總寬度是 80%
  const percentage = (unlockedSteps.value - 1) / (totalSteps - 1);
  return `${percentage * 80}%`;
});

const tabs = computed(() => [
  { id: 'listings', label: '我的刊登', icon: 'bi-box-seam', count: userStats.value.listings },
  { id: 'favorites', label: '收藏', icon: 'bi-heart', count: userStats.value.favorites },
  { id: 'purchases', label: '購買紀錄', icon: 'bi-bag', count: userStats.value.purchases },
  { id: 'sales', label: '銷售紀錄', icon: 'bi-cash-stack', count: userStats.value.sales }
]);

const favoriteItems = computed(() => {
  console.log('🎯 Favorites from store:', favoritesStore.favoriteItems.length);
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

// Fetch user's carbon footprint data
const fetchUserCarbonData = async () => {
  if (!authStore.isLoggedIn) {
    console.warn('[Carbon] Not logged in, skipping fetch');
    return;
  }

  try {
    console.log('[Carbon] Fetching user carbon data');
    const profileData = await getMyProfileForEdit();

    if (profileData?.profile_details?.carbon_saved_kg) {
      userCarbonSaved.value = parseFloat(profileData.profile_details.carbon_saved_kg);
      console.log('[Carbon] User saved:', userCarbonSaved.value, 'kg');
    } else {
      userCarbonSaved.value = 0;
      console.log('[Carbon] No data found, default to 0 kg');
    }
  } catch (error) {
    console.error('[Carbon] Failed to fetch:', error);
    userCarbonSaved.value = 0;
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

// NOW watch for auth state changes
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  console.log('🔐 Auth state changed, logged in:', isLoggedIn);
  if (isLoggedIn) {
    fetchUserCarbonData();
    fetchMyListings();

    // Load favorites
    if (favoritesStore.count === 0) {
      favoritesStore.loadFavorites({
        page: 1,
        size: 100,
        sort_by: 'favorited_at',
        sort_direction: 'desc'
      }).then(() => {
        console.log('✅ Favorites loaded:', favoritesStore.count);
      }).catch((error) => {
        console.error('Failed to load favorites:', error);
      });
    }
  }
}, { immediate: true }); // Run immediately on mount

// Also fetch on mount (for case where auth is already ready)
onMounted(async () => {
  if (authStore.isLoggedIn) {
    await fetchUserCarbonData();
    await fetchMyListings();

    if (favoritesStore.count === 0) {
      try {
        await favoritesStore.loadFavorites({
          page: 1,
          size: 100,
          sort_by: 'favorited_at',
          sort_direction: 'desc'
        });
        console.log('✅ Favorites loaded on mount:', favoritesStore.count);
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }
  if (badgeModalRef.value) {
    badgeModalInstance.value = new Modal(badgeModalRef.value);
  }
});

onBeforeUnmount(() => {
  if (badgeModalInstance.value) {
    badgeModalInstance.value.dispose();
  }
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

// Carousel scroll functions for mobile
const scrollActivePrev = () => {
  if (activeScrollIndex.value > 0) {
    activeScrollIndex.value--;
    scrollCarousel(activeCarousel.value, activeScrollIndex.value);
  }
};

const scrollActiveNext = () => {
  if (activeScrollIndex.value < activeListings.value.length - 1) {
    activeScrollIndex.value++;
    scrollCarousel(activeCarousel.value, activeScrollIndex.value);
  }
};

const scrollInactivePrev = () => {
  if (inactiveScrollIndex.value > 0) {
    inactiveScrollIndex.value--;
    scrollCarousel(inactiveCarousel.value, inactiveScrollIndex.value);
  }
};

const scrollInactiveNext = () => {
  if (inactiveScrollIndex.value < inactiveListings.value.length - 1) {
    inactiveScrollIndex.value++;
    scrollCarousel(inactiveCarousel.value, inactiveScrollIndex.value);
  }
};

const scrollCarousel = (carouselRef, index) => {
  if (carouselRef) {
    const track = carouselRef.querySelector('.carousel-track');
    if (track) {
      const itemWidth = track.querySelector('.carousel-item')?.offsetWidth || 0;
      const gap = 16; // gap between items
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

// Achievement Badges (Updated)
.achievements-section {
  .achievements-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;

    .carbon-total {
      font-size: 14px;
      font-weight: 500;
      color: $primary;
      background: #e6f4f0;
      padding: 6px 12px;
      border-radius: 20px;
    }
  }
}

.achievements-stepper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50px;
    left: 12.5%;
    width: 75%;
    height: 4px;
    background: #e9ecef;
    z-index: 0;
    transform: translateY(-50%);
  }

  .unlocked-line {
    position: absolute;
    top: 50px;
    left: 12.5%;
    height: 4px;
    background: $primary;
    z-index: 1;
    transform: translateY(-50%);
    transition: width 0.5s ease;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
    text-align: center;
    cursor: pointer;

    .step-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      background-color: #f0f7f5;
      border: 2px solid #e0e0e0;
      transition: all 0.3s;
      padding: 10px;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;

      .step-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: filter 0.3s;
        filter: grayscale(100%) opacity(0.6);
      }

      .progress-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(111, 184, 165, 0.9);
        padding: 4px 0;
        display: flex;
        align-items: center;
        justify-content: center;

        .progress-text {
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }
      }
    }

    .step-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      font-weight: 500;
      transition: all 0.3s;
    }

    .step-requirement {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #999;
      margin-top: 2px;
    }

    &.unlocked {
      .step-circle {
        border-color: $primary;
        background-color: #e6f4f0;

        .step-image {
          filter: grayscale(0%) opacity(1);
        }
      }
      .step-label {
        color: #1e1e1e;
      }
    }
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

  .refresh-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: white;
    border: 1px solid $primary;
    border-radius: 8px;
    color: $primary;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 18px;
    }

    &:hover {
      background: $primary;
      color: white;
      transform: rotate(180deg);
    }
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
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 20px;
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

  .achievements-section {
    width: 100%;
    margin-top: 0 !important;
  }

  .achievements-stepper {
    gap: 18px;

    .step-item {
      .step-circle {
        width: 90px;
        height: 90px;
        padding: 9px;
      }

      .step-label {
        font-size: 13px;
      }
    }

    &::before {
      top: 45px;
    }

    .unlocked-line {
      top: 45px;
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

  .achievements-stepper {
    gap: 16px;

    .step-item {
      .step-circle {
        width: 85px;
        height: 85px;
        padding: 8px;
      }

      .step-label {
        font-size: 13px;
      }
    }

    &::before {
      top: 42px;
    }

    .unlocked-line {
      top: 42px;
    }
  }

  .listings-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
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

  .achievements-section {
    width: 100%;
  }

  .achievements-title {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 10px;
    font-size: 16px !important;

    .carbon-total {
      font-size: 13px;
    }
  }

  .achievements-stepper {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 16px;

    &::before {
      display: none;
    }

    .unlocked-line {
      display: none;
    }

    .step-item {
      .step-circle {
        width: 75px;
        height: 75px;
        padding: 8px;
      }

      .step-label {
        font-size: 12px;
      }

      .step-requirement {
        font-size: 10px;
      }
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

  .achievements-title {
    font-size: 15px !important;

    .carbon-total {
      font-size: 12px;
      padding: 4px 10px;
    }
  }

  .achievements-stepper {
    gap: 16px 12px;

    .step-item {
      .step-circle {
        width: 65px;
        height: 65px;
        padding: 6px;
      }

      .step-label {
        font-size: 11px;
      }

      .step-requirement {
        font-size: 9px;
      }
    }
  }

  .listings-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  // Mobile: Hide desktop grid, show carousel
  .desktop-grid {
    display: none;
  }

  .mobile-carousel {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
  }

  .carousel-container {
    flex: 1;
    overflow: hidden;
  }

  .carousel-track {
    display: flex;
    gap: 12px;
    transition: transform 0.3s ease;
  }

  .carousel-item {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .carousel-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: white;
    border: 1px solid $primary;
    border-radius: 50%;
    color: $primary;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;

    i {
      font-size: 16px;
    }

    &:hover:not(:disabled) {
      background: $primary;
      color: white;
      transform: scale(1.1);
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

  .empty-state {
    padding: 50px 16px;

    i {
      font-size: 50px;
    }

    p {
      font-size: 15px;
    }
  }
}
</style>
