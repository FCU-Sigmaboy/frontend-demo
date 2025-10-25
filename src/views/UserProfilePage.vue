<template>
  <div class="user-profile-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
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
              <button class="edit-avatar-btn">
                <i class="bi bi-camera"></i>
              </button>
            </div>

            <div class="user-info-section">
              <h1 class="user-name">{{ authStore.userName || '使用者' }}</h1>
              <p class="user-email">{{ authStore.userEmail }}</p>
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
              <button class="edit-profile-btn" @click="goToEditProfile">
                <i class="bi bi-pencil"></i>
                編輯個人資料
              </button>
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
            <div v-if="myListings.length > 0" class="listings-grid">
              <ProductCard
                v-for="product in myListings"
                :key="product.id"
                :product="product"
                @click="goToProductDetail(product.id)"
              />
            </div>
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import ProductCard from '../components/ProductCard.vue';
import TransactionCard from '../components/TransactionCard.vue';

const router = useRouter();
const authStore = useAuthStore();

// State
const userPoints = ref(500);
const activeTab = ref('listings');

const userStats = ref({
  listings: 12,
  favorites: 8,
  purchases: 5,
  sales: 3
});

const tabs = [
  { id: 'listings', label: '我的刊登', icon: 'bi-box-seam', count: userStats.value.listings },
  { id: 'favorites', label: '收藏', icon: 'bi-heart', count: userStats.value.favorites },
  { id: 'purchases', label: '購買紀錄', icon: 'bi-bag', count: userStats.value.purchases },
  { id: 'sales', label: '銷售紀錄', icon: 'bi-cash-stack', count: userStats.value.sales }
];

// Mock data
const myListings = ref([
  {
    id: 1,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/6fb8a5/ffffff?text=Product+1',
    sellerName: authStore.userName,
    sellerAvatar: authStore.userAvatar,
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    status: 'active'
  }
]);

const favoriteItems = ref([]);
const purchaseHistory = ref([]);
const salesHistory = ref([]);

// Methods
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
</script>

<style scoped lang="scss">
.user-profile-page {
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

  .edit-avatar-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #6fb8a5;
    border: 3px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 18px;
      color: white;
    }

    &:hover {
      background: #5fa795;
      transform: scale(1.05);
    }
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
    margin: 0 0 24px 0;
  }
}

.user-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 24px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      font-size: 24px;
      color: #6fb8a5;
    }

    .stat-value {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
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

.edit-profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 2px solid #6fb8a5;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #6fb8a5;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }

  &:hover {
    background: #6fb8a5;
    color: white;
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
    color: #6fb8a5;
    background: #f9f9f9;
  }

  &.active {
    color: #6fb8a5;
    border-bottom-color: #6fb8a5;

    .tab-count {
      background: #6fb8a5;
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

// Responsive
@media (max-width: 991.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .profile-container {
    padding: 0 15px;
  }

  .profile-header {
    padding: 30px 24px;
  }

  .header-content {
    gap: 30px;
  }

  .user-avatar-section {
    .user-avatar,
    .default-avatar {
      width: 120px;
      height: 120px;
    }

    .default-avatar {
      font-size: 120px;
    }
  }

  .user-info-section {
    .user-name {
      font-size: 28px;
    }
  }

  .user-stats {
    gap: 30px;
  }

  .listings-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
}

@media (max-width: 767.98px) {
  .header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
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
    width: 100%;

    .user-name {
      font-size: 24px;
    }
  }

  .user-stats {
    justify-content: center;
    gap: 24px;
  }

  .edit-profile-btn {
    width: 100%;
    justify-content: center;
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

  .profile-header {
    padding: 24px 16px;
    margin-bottom: 20px;
  }

  .user-stats {
    gap: 20px;
    flex-wrap: wrap;

    .stat-item {
      gap: 6px;

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

  .listings-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .empty-state {
    padding: 60px 20px;

    i {
      font-size: 60px;
    }

    p {
      font-size: 16px;
    }
  }
}
</style>
