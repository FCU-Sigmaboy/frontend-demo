<template>
  <div class="my-reviews-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="reviews-container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a href="/" class="breadcrumb-link">首頁</a>
          <i class="bi bi-chevron-right"></i>
          <a href="/profile" class="breadcrumb-link">個人檔案</a>
          <i class="bi bi-chevron-right"></i>
          <span class="breadcrumb-current">我的評價</span>
        </nav>

        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">我的評價 ({{ reviews.length }})</h1>
          <div class="rating-summary">
            <div class="stars">
              <i
                v-for="n in 5"
                :key="n"
                :class="['bi', n <= Math.floor(averageRating) ? 'bi-star-fill' : 'bi-star']"
              ></i>
            </div>
            <span class="rating-score">{{ averageRating.toFixed(1) }}</span>
          </div>
          <button class="action-btn" @click="showAllReviews">
            交易紀錄
          </button>
        </div>

        <!-- Reviews List -->
        <div v-if="reviews.length > 0" class="reviews-list">
          <div v-for="review in reviews" :key="review.id" class="review-card">
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
              <div class="transaction-item">
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
          <h3>尚無評價</h3>
          <p>完成交易後會收到買家或賣家的評價</p>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const router = useRouter();

// State
const userPoints = ref(500);

// Mock reviews data
const reviews = ref([
  {
    id: 1,
    reviewer: {
      id: 1,
      name: '使用者名稱',
      avatar: 'https://placehold.co/48/6fb8a5/ffffff?text=U1'
    },
    rating: 4,
    comment: '好棒的交易！',
    date: '1個月',
    transaction: {
      name: 'iPhone 13 Pro',
      image: 'https://placehold.co/60x60/6fb8a5/ffffff?text=Phone'
    }
  },
  {
    id: 2,
    reviewer: {
      id: 2,
      name: '使用者名稱',
      avatar: 'https://placehold.co/48/5a9d8c/ffffff?text=U2'
    },
    rating: 5,
    comment: '非常好的賣家，商品狀況完美！',
    date: '1個月',
    transaction: {
      name: '復古沙發',
      image: 'https://placehold.co/60x60/5a9d8c/ffffff?text=Sofa'
    }
  }
]);

// Computed
const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0;
  const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.value.length;
});

// Methods
const showAllReviews = () => {
  console.log('Show all reviews');
  // Navigate to transaction history or filter reviews
};

const goToUserProfile = (userId) => {
  router.push({ name: 'PublicUserProfile', params: { id: userId } });
};
</script>

<style scoped lang="scss">
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
    color: #6fb8a5;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;

  .page-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  .rating-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    .stars {
      display: flex;
      gap: 4px;

      i {
        font-size: 18px;
        color: #ffc107;

        &.bi-star {
          color: #e0e0e0;
        }
      }
    }

    .rating-score {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #1e1e1e;
    }
  }

  .action-btn {
    padding: 10px 24px;
    background: #6fb8a5;
    border: none;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #5fa795;
    }
  }
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

// Responsive
@media (max-width: 767.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .reviews-container {
    padding: 0 15px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;

    .rating-summary {
      width: 100%;
    }

    .action-btn {
      width: 100%;
    }
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
