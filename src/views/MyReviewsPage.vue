<template>
  <div class="my-reviews-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="reviews-container">
        <!-- Breadcrumb -->
        <Breadcrumb :items="[
          { label: '個人檔案', to: { name: 'UserProfile' } },
          { label: '我的評價' }
        ]" />

        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">我的評價</h1>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>載入中...</p>
        </div>

        <!-- Reviews Content -->
        <div v-else-if="reviews.length > 0">
          <!-- Filter Tabs -->
          <div class="filter-section">
            <FilterTabs
              :items="reviews"
              :filters="filterOptions"
              @update:sortedItems="handleFilteredReviews"
            />
          </div>
          <!-- Rating Summary Section -->
          <div class="rating-summary-section">
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
          <div class="reviews-list">
          <div v-for="review in paginatedReviews" :key="review.id" class="review-card">
            <div class="review-header">
              <div class="reviewer-info" @click="goToUserProfile(review.reviewer.id)">
                <img
                  :src="review.reviewer.avatar"
                  :alt="review.reviewer.name"
                  class="reviewer-avatar"
                />
                <div class="reviewer-details">
                  <h3 class="reviewer-name">{{ review.reviewer.name }}</h3>
                  <div class="review-meta">
                    <div class="stars-small">
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
            </div>

            <div class="review-body">
              <p class="review-comment">{{ review.comment }}</p>
            </div>

            <!-- Transaction Info (if applicable) -->
            <div v-if="review.transaction" class="transaction-info">
              <div class="transaction-item clickable" @click="goToProductDetail(review.transaction.id)">
                <img
                  :src="review.transaction.image"
                  :alt="review.transaction.name"
                  class="transaction-image"
                />
                <span class="transaction-name">{{ review.transaction.name }}</span>
                <i class="bi bi-chevron-right"></i>
              </div>
            </div>
          </div>
          </div>

          <!-- Pagination Controls -->
          <div v-if="filteredReviews.length > itemsPerPage" class="pagination-container">
            <div class="pagination-info">
              顯示第 {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredReviews.length) }} 項，共 {{ filteredReviews.length }} 項
            </div>
            <div class="pagination-controls">
              <button
                class="pagination-btn"
                :disabled="currentPage === 1"
                @click="prevPage"
              >
                <i class="bi bi-chevron-left"></i>
                上一頁
              </button>

              <button
                v-for="(page, index) in pageNumbers"
                :key="index"
                class="pagination-btn page-number"
                :class="{ active: page === currentPage, ellipsis: page === '...' }"
                :disabled="page === '...'"
                @click="typeof page === 'number' ? goToPage(page) : null"
              >
                {{ page }}
              </button>

              <button
                class="pagination-btn"
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                下一頁
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>

            <div class="items-per-page">
              <label for="itemsPerPage">每頁顯示：</label>
              <select id="itemsPerPage" v-model.number="itemsPerPage" @change="currentPage = 1">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="bi bi-chat-quote"></i>
          <h3>尚無評價</h3>
          <p>完成交易後會收到買家或賣家的評價</p>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useReviewStore } from '@/stores/review';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import FilterTabs from '../components/FilterTabs.vue';

const router = useRouter();
const reviewStore = useReviewStore();

// State
const userPoints = ref(500);

// Computed - 從 store 獲取資料
const reviews = computed(() => {
  // 轉換 store 資料格式以符合 template 需求
  return reviewStore.reviews.map(review => ({
    id: review.review_id,
    reviewer: {
      id: review.reviewer_id,
      name: review.reviewer_nickname,
      avatar: review.reviewer_avatar
    },
    rating: review.score,
    comment: review.comment,
    date: review.formatted_date,
    transaction: review.item_id ? {
      id: review.item_id,
      name: review.item_title,
      image: review.item_image
    } : null
  }));
});

const averageRating = computed(() => reviewStore.averageRating);
const isLoading = computed(() => reviewStore.isLoading);

// Methods
const fetchMyReviews = async () => {
  try {
    await reviewStore.fetchReviews();
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    alert(`載入評價失敗：${error.message}`);
  }
};

const goToTransactionRecords = () => {
  router.push({ name: 'TransactionRecords' });
};

const goToUserProfile = (userId) => {
  router.push({ name: 'PublicUserProfile', params: { id: userId } });
};

const goToProductDetail = (itemId) => {
  router.push({ name: 'ItemDetail', params: { id: itemId } });
};

// Filter options for FilterTabs
const filterOptions = [
  {
    id: 1,
    label: '全部評價',
    type: 'filter',
    filterFn: () => true,
    sortable: false
  },
  {
    id: 2,
    label: '5星評價',
    type: 'filter',
    filterKey: 'rating',
    filterValue: 5,
    sortable: false
  },
  {
    id: 3,
    label: '4星評價',
    type: 'filter',
    filterKey: 'rating',
    filterValue: 4,
    sortable: false
  },
  {
    id: 4,
    label: '3星以下',
    type: 'filter',
    filterFn: (review) => review.rating <= 3,
    sortable: false
  },
  {
    id: 5,
    label: '最新評價',
    type: 'sort',
    sortKey: 'date',
    defaultOrder: 'desc',
    ascText: '早到晚',
    descText: '晚到早'
  }
];

// Filtered reviews from FilterTabs
const filteredReviews = ref([]);

// Handle filtered reviews from FilterTabs
const handleFilteredReviews = (items) => {
  filteredReviews.value = items;
  currentPage.value = 1; // Reset to first page when filter changes
};

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Computed total pages
const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage.value);
});

// Computed paginated reviews (for display)
const paginatedReviews = computed(() => {
  // Ensure current page doesn't exceed total pages
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value;
  }

  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredReviews.value.slice(start, end);
});

// Pagination methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Get page numbers to display
const pageNumbers = computed(() => {
  const pages = [];
  const maxVisible = 5;

  if (totalPages.value <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Show smart pagination
    if (currentPage.value <= 3) {
      // Near start
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages.value);
    } else if (currentPage.value >= totalPages.value - 2) {
      // Near end
      pages.push(1);
      pages.push('...');
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) pages.push(i);
    } else {
      // Middle
      pages.push(1);
      pages.push('...');
      pages.push(currentPage.value - 1);
      pages.push(currentPage.value);
      pages.push(currentPage.value + 1);
      pages.push('...');
      pages.push(totalPages.value);
    }
  }

  return pages;
});

// Rating helpers
const getRatingCount = (rating) => {
  return reviews.value.filter(r => r.rating === rating).length;
};

const getRatingPercentage = (rating) => {
  if (reviews.value.length === 0) return 0;
  return (getRatingCount(rating) / reviews.value.length) * 100;
};

// Lifecycle
onMounted(() => {
  fetchMyReviews();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.my-reviews-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.reviews-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

// Breadcrumb
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;

  .breadcrumb-link {
    color: $primary;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #5fa795;
    }
  }

  i {
    font-size: 12px;
    color: #999;
  }

  .breadcrumb-current {
    color: #1e1e1e;
  }
}

// Page Header
.page-header {
  margin-bottom: 30px;

  .page-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }
}

// Rating Summary Section
.rating-summary-section {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 40px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f0f0f0;
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #999;
    margin: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Reviews List
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.reviewer-info {
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.7;
  }

  .reviewer-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .reviewer-details {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .reviewer-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
    }

    .review-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
}

.stars-small {
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

.review-body {
  margin-bottom: 16px;

  .review-comment {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1e1e1e;
    margin: 0;
  }
}

.transaction-info {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s;

  &.clickable {
    cursor: pointer;

    &:hover {
      background: #e8e8e8;
      transform: translateX(4px);

      .transaction-name {
        color: $primary;
      }

      i {
        color: $primary;
      }
    }
  }

  .transaction-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .transaction-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1e1e1e;
    flex: 1;
    transition: color 0.3s;
  }

  i {
    font-size: 16px;
    color: #999;
    transition: color 0.3s;
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  i {
    font-size: 80px;
    color: #e0e0e0;
    margin-bottom: 20px;
  }

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 8px 0;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

// Filter Section
.filter-section {
  margin-bottom: 30px;
}

// Pagination Container
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
  gap: 20px;
}

.pagination-info {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #666;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: $primary;
    color: $primary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.page-number {
    min-width: 40px;
    justify-content: center;

    &.active {
      background: $primary;
      color: white;
      border-color: $primary;
    }

    &.ellipsis {
      border: none;
      cursor: default;

      &:hover {
        background: white;
        color: #1e1e1e;
      }
    }
  }

  i {
    font-size: 12px;
  }
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
  }

  select {
    padding: 6px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    background: white;
    cursor: pointer;
    transition: border-color 0.3s;

    &:hover {
      border-color: $primary;
    }

    &:focus {
      outline: none;
      border-color: $primary;
    }
  }
}

// Responsive
@media (max-width: 991.98px) {
  .rating-summary-section {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 24px;
  }

  .pagination-container {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .items-per-page {
    justify-content: center;
  }
}

@media (max-width: 767.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .reviews-container {
    padding: 0 15px;
  }

  .page-header {
    .page-title {
      font-size: 24px;
    }
  }

  .rating-summary-section {
    padding: 20px;
  }

  .review-card {
    padding: 20px;
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .reviews-container {
    padding: 0 10px;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .page-header {
    .page-title {
      font-size: 20px;
    }
  }

  .rating-summary-section {
    padding: 16px;
  }

  .review-card {
    padding: 16px;
  }

  .reviewer-info {
    .reviewer-avatar {
      width: 40px;
      height: 40px;
    }

    .reviewer-details {
      .reviewer-name {
        font-size: 15px;
      }
    }
  }

  .empty-state {
    padding: 80px 20px;

    i {
      font-size: 60px;
    }

    h3 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
    }
  }
}
</style>
