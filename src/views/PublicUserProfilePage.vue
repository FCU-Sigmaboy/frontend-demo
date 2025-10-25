<template>
  <div class="public-user-profile-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="profile-container">
        <!-- User Profile Card -->
        <section class="profile-card">
          <div class="profile-left">
            <!-- User Avatar -->
            <div class="user-avatar-section">
              <img
                :src="userData.avatar"
                :alt="userData.name"
                class="user-avatar"
              />
            </div>

            <!-- User Info -->
            <div class="user-info">
              <h1 class="user-name">{{ userData.name }}</h1>
              <p class="user-handle">@{{ userData.handle }}</p>
              <div class="user-meta">
                <span class="join-date">
                  <i class="bi bi-calendar"></i>
                  加入時間：{{ userData.joinDate }}
                </span>
              </div>

              <!-- Bio -->
              <p v-if="userData.bio" class="user-bio">{{ userData.bio }}</p>

              <!-- Stats -->
              <div class="user-stats-compact">
                <div class="stat-item">
                  <span class="stat-number">{{ userData.stats.followers }}</span>
                  <span class="stat-label">追蹤者</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ userData.stats.following }}</span>
                  <span class="stat-label">追蹤中</span>
                </div>
              </div>

              <!-- Action Button -->
              <button
                :class="['follow-btn', { following: isFollowing }]"
                @click="toggleFollow"
              >
                <i :class="['bi', isFollowing ? 'bi-check' : 'bi-plus']"></i>
                {{ isFollowing ? '追蹤中' : '追蹤' }}
              </button>
            </div>
          </div>

          <!-- Achievement Badges -->
          <div class="achievements-section">
            <h3 class="section-title">成就徽章</h3>
            <div class="badges-grid">
              <div
                v-for="badge in achievements"
                :key="badge.id"
                :class="['badge-item', { unlocked: badge.unlocked }]"
                :title="badge.description"
              >
                <div class="badge-icon">
                  <i :class="['bi', badge.icon]"></i>
                </div>
                <span class="badge-label">{{ badge.label }}</span>
                <span v-if="badge.unlocked" class="badge-date">{{ badge.unlockedDate }}</span>
              </div>
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
                  <span class="stat-value">{{ averageRating.toFixed(1) }}</span>
                  <span class="stat-name">平均評分</span>
                </div>
              </div>
              <div class="stat-card">
                <i class="bi bi-clock-history stat-icon"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ userData.stats.responseTime }}</span>
                  <span class="stat-name">回應時間</span>
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
              {{ tab.label }}
              <span v-if="tab.count" class="tab-count">({{ tab.count }})</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tabs-content">
            <!-- Listings Tab -->
            <div v-show="activeTab === 'listings'" class="tab-pane">
              <div v-if="userListings.length > 0" class="listings-grid">
                <ProductCard
                  v-for="product in userListings"
                  :key="product.id"
                  :product="product"
                  @click="goToProductDetail(product.id)"
                />
              </div>
              <div v-else class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>此使用者尚無刊登物品</p>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-show="activeTab === 'reviews'" class="tab-pane">
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
                  <div
                    v-for="rating in [5, 4, 3, 2, 1]"
                    :key="rating"
                    class="rating-bar-item"
                  >
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
              <div v-if="reviews.length > 0" class="reviews-list">
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import ProductCard from '../components/ProductCard.vue';

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(500);
const activeTab = ref('listings');
const isFollowing = ref(false);

// Mock user data
const userData = ref({
  id: route.params.id || 1,
  name: '使用者名稱',
  handle: '使用者帳號',
  avatar: 'https://placehold.co/150/6fb8a5/ffffff?text=User',
  bio: '熱愛環保，喜歡透過二手交易延續物品的生命，讓資源得到更好的利用。',
  joinDate: 'November 2010',
  stats: {
    followers: 80,
    following: 100,
    totalListings: 45,
    completedDeals: 32,
    responseTime: '2小時內'
  }
});

// Achievement badges
const achievements = ref([
  {
    id: 1,
    label: '新手交易',
    icon: 'bi-1-circle',
    description: '完成第一筆交易',
    unlocked: true,
    unlockedDate: '2024-01-15'
  },
  {
    id: 2,
    label: '交易達人',
    icon: 'bi-2-circle',
    description: '完成10筆交易',
    unlocked: true,
    unlockedDate: '2024-03-20'
  },
  {
    id: 3,
    label: '環保戰士',
    icon: 'bi-3-circle',
    description: '完成50筆交易',
    unlocked: false,
    unlockedDate: null
  },
  {
    id: 4,
    label: '綠色大師',
    icon: 'bi-4-circle',
    description: '完成100筆交易',
    unlocked: false,
    unlockedDate: null
  }
]);

// Tabs
const tabs = computed(() => [
  { id: 'listings', label: '刊登物品', count: userListings.value.length },
  { id: 'reviews', label: '評價', count: reviews.value.length }
]);

// Mock listings
const userListings = ref([
  {
    id: 1,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/6fb8a5/ffffff?text=Product+1',
    sellerName: userData.value.name,
    sellerAvatar: userData.value.avatar,
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  },
  {
    id: 2,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/5a9d8c/ffffff?text=Product+2',
    sellerName: userData.value.name,
    sellerAvatar: userData.value.avatar,
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  }
]);

// Mock reviews
const reviews = ref([
  {
    id: 1,
    reviewer: {
      name: '評價者名稱',
      avatar: 'https://placehold.co/48/4a8b7d/ffffff?text=R1'
    },
    rating: 5,
    comment: '非常好的賣家！商品狀況如同描述，交易過程順利愉快。',
    date: '1個月前',
    transaction: {
      name: 'iPhone 13 Pro',
      image: 'https://placehold.co/60x60/6fb8a5/ffffff?text=Phone'
    }
  },
  {
    id: 2,
    reviewer: {
      name: '評價者名稱',
      avatar: 'https://placehold.co/48/3a7a6e/ffffff?text=R2'
    },
    rating: 4,
    comment: '交易順利，賣家很親切。',
    date: '2個月前',
    transaction: {
      name: '復古沙發',
      image: 'https://placehold.co/60x60/5a9d8c/ffffff?text=Sofa'
    }
  },
  {
    id: 3,
    reviewer: {
      name: '評價者名稱',
      avatar: 'https://placehold.co/48/6fb8a5/ffffff?text=R3'
    },
    rating: 5,
    comment: '很棒的交易經驗，推薦！',
    date: '3個月前',
    transaction: null
  }
]);

// Computed
const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0;
  const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.value.length;
});

// Methods
const getRatingCount = (rating) => {
  return reviews.value.filter(r => r.rating === rating).length;
};

const getRatingPercentage = (rating) => {
  if (reviews.value.length === 0) return 0;
  return (getRatingCount(rating) / reviews.value.length) * 100;
};

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value;
};

const goToProductDetail = (id) => {
  router.push({ name: 'ItemDetail', params: { id } });
};
</script>

<style scoped lang="scss">
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
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
}

.profile-left {
  display: flex;
  gap: 30px;
  align-items: flex-start;
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

  .user-handle {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #999;
    margin: 0 0 12px 0;
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

  .user-bio {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #1e1e1e;
    margin: 0 0 20px 0;
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
  background: #6fb8a5;
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

  &:hover {
    background: #5fa795;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
  }

  &.following {
    background: white;
    border: 2px solid #6fb8a5;
    color: #6fb8a5;

    &:hover {
      background: #dc3545;
      border-color: #dc3545;
      color: white;
      transform: translateY(-2px);

      &::after {
        content: '取消追蹤';
      }

      i {
        display: none;
      }
    }

    &:not(:hover)::after {
      content: '追蹤中';
    }

    &:not(:hover) i {
      display: inline;
    }
  }
}

// Achievements Section
.achievements-section {
  .section-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 20px 0;
  }
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  transition: all 0.3s;

  &.unlocked {
    background: #e8f5f3;
    cursor: pointer;

    .badge-icon {
      background: #6fb8a5;

      i {
        color: white;
      }
    }

    .badge-label {
      color: #1e1e1e;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.2);
    }
  }

  .badge-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;

    i {
      font-size: 28px;
      color: #999;
    }
  }

  .badge-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #999;
    text-align: center;
  }

  .badge-date {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    color: #999;
    margin-top: 4px;
  }
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
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
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
    color: #6fb8a5;
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
  padding: 20px;
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

  .tab-count {
    color: #999;
  }

  &:hover {
    color: #6fb8a5;
    background: #f9f9f9;
  }

  &.active {
    color: #6fb8a5;
    border-bottom-color: #6fb8a5;

    .tab-count {
      color: #6fb8a5;
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
      background: #6fb8a5;
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

// Responsive
@media (max-width: 991.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .profile-container {
    padding: 0 15px;
  }

  .profile-card {
    padding: 30px 24px;
  }

  .profile-left {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-avatar-section .user-avatar {
    width: 120px;
    height: 120px;
  }

  .user-stats-compact {
    justify-content: center;
  }

  .badges-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rating-summary {
    grid-template-columns: 1fr;
    gap: 30px;
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
    padding: 16px;
    font-size: 14px;

    .tab-count {
      font-size: 13px;
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

  .badges-grid,
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .badge-item {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;

    .badge-icon {
      width: 50px;
      height: 50px;
      margin-bottom: 0;

      i {
        font-size: 24px;
      }
    }
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
}
</style>
