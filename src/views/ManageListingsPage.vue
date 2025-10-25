<template>
  <div class="manage-listings-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="manage-container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a href="/" class="breadcrumb-link">首頁</a>
          <i class="bi bi-chevron-right"></i>
          <a href="/profile" class="breadcrumb-link">個人檔案</a>
          <i class="bi bi-chevron-right"></i>
          <span class="breadcrumb-current">管理刊登</span>
        </nav>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ stats.active }}</div>
            <div class="stat-label">上架中</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.pending }}</div>
            <div class="stat-label">待審核</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.sold }}</div>
            <div class="stat-label">已售出</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.hidden }}</div>
            <div class="stat-label">隱藏</div>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="actions-bar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋"
              class="search-input"
            />
          </div>
          <button class="action-btn primary" @click="goToCreateListing">
            <i class="bi bi-plus-circle"></i>
            刊登
          </button>
        </div>

        <!-- Listings Table -->
        <div class="table-container">
          <table class="listings-table">
            <thead>
              <tr>
                <th class="col-image">物品</th>
                <th class="col-status">狀態</th>
                <th class="col-date">發布日期</th>
                <th class="col-date">更新日期</th>
                <th class="col-price">點數</th>
                <th class="col-stats">瀏覽</th>
                <th class="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="listing in filteredListings" :key="listing.id" class="listing-row">
                <!-- Product Info -->
                <td class="col-image">
                  <div class="product-info">
                    <img :src="listing.image" :alt="listing.name" class="product-image" />
                    <span class="product-name">{{ listing.name }}</span>
                  </div>
                </td>

                <!-- Status -->
                <td class="col-status">
                  <span :class="['status-badge', `status-${listing.status}`]">
                    <i :class="getStatusIcon(listing.status)"></i>
                    {{ getStatusText(listing.status) }}
                  </span>
                </td>

                <!-- Published Date -->
                <td class="col-date">{{ listing.publishedDate }}</td>

                <!-- Updated Date -->
                <td class="col-date">{{ listing.updatedDate }}</td>

                <!-- Price -->
                <td class="col-price">{{ listing.price }}p</td>

                <!-- Stats -->
                <td class="col-stats">
                  <div class="stats-cell">
                    <span class="stat-item">
                      <i class="bi bi-eye"></i>
                      {{ listing.views }}
                    </span>
                    <span class="stat-item">
                      <i class="bi bi-heart"></i>
                      {{ listing.likes }}
                    </span>
                  </div>
                </td>

                <!-- Actions -->
                <td class="col-actions">
                  <div class="action-buttons">
                    <button
                      v-if="listing.status === 'active'"
                      class="btn-sm btn-view"
                      @click="viewListing(listing.id)"
                      title="查看"
                    >
                      查看
                    </button>
                    <button
                      v-if="listing.status === 'active' || listing.status === 'pending'"
                      class="btn-sm btn-edit"
                      @click="editListing(listing.id)"
                      title="管理"
                    >
                      管理
                    </button>
                    <button
                      v-if="listing.status === 'active'"
                      class="btn-sm btn-hide"
                      @click="hideListing(listing.id)"
                      title="隱藏"
                    >
                      隱藏
                    </button>
                    <button
                      v-if="listing.status === 'sold'"
                      class="btn-sm btn-relist"
                      @click="markAsAvailable(listing.id)"
                      title="查看交易"
                    >
                      查看交易
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div v-if="filteredListings.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>找不到符合條件的刊登</p>
          </div>
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
const searchQuery = ref('');

const stats = ref({
  active: 2,
  pending: 1,
  sold: 1,
  hidden: 4
});

// Mock listings data
const listings = ref([
  {
    id: 1,
    name: 'Comell復刻機械鍵盤',
    image: 'https://placehold.co/60x60/6fb8a5/ffffff?text=KB',
    status: 'active',
    publishedDate: '2025/08/27',
    updatedDate: '2025/08/27',
    price: 100,
    views: 127,
    likes: 15
  },
  {
    id: 2,
    name: '兒童綜本套書20本',
    image: 'https://placehold.co/60x60/5a9d8c/ffffff?text=Books',
    status: 'active',
    publishedDate: '2025/08/27',
    updatedDate: '2025/08/27',
    price: 100,
    views: 127,
    likes: 15
  },
  {
    id: 3,
    name: '木質書桌 120×60cm',
    image: 'https://placehold.co/60x60/4a8b7d/ffffff?text=Desk',
    status: 'pending',
    publishedDate: '2025/08/27',
    updatedDate: '2025/08/27',
    price: 100,
    views: 127,
    likes: 15
  },
  {
    id: 4,
    name: '不鏽鋼餐具組',
    image: 'https://placehold.co/60x60/3a7a6e/ffffff?text=Set',
    status: 'sold',
    publishedDate: '2025/08/27',
    updatedDate: '2025/08/27',
    price: 101,
    views: 127,
    likes: 15
  }
]);

// Computed
const filteredListings = computed(() => {
  if (!searchQuery.value) return listings.value;

  return listings.value.filter(listing =>
    listing.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Methods
const getStatusIcon = (status) => {
  const icons = {
    active: 'bi bi-circle-fill',
    pending: 'bi bi-clock',
    sold: 'bi bi-check-circle',
    hidden: 'bi bi-eye-slash'
  };
  return icons[status] || 'bi-circle';
};

const getStatusText = (status) => {
  const texts = {
    active: '上架中',
    pending: '待審核中',
    sold: '已售出',
    hidden: '已隱藏'
  };
  return texts[status] || status;
};

const goToCreateListing = () => {
  router.push({ name: 'CreateListing' });
};

const viewListing = (id) => {
  router.push({ name: 'ItemDetail', params: { id } });
};

const editListing = (id) => {
  router.push({ name: 'EditListing', params: { id } });
};

const hideListing = (id) => {
  if (confirm('確定要隱藏此刊登嗎？')) {
    const listing = listings.value.find(l => l.id === id);
    if (listing) {
      listing.status = 'hidden';
      stats.value.active--;
      stats.value.hidden++;
    }
  }
};

const markAsAvailable = (id) => {
  router.push({ name: 'TransactionDetails', params: { id } });
};
</script>

<style scoped lang="scss">
.manage-listings-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.manage-container {
  max-width: 1600px;
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

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .stat-number {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e1e1e;
    margin-bottom: 8px;
  }

  .stat-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
  }
}

// Actions Bar
.actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  padding: 10px 16px;
  flex: 1;
  max-width: 400px;

  i {
    font-size: 16px;
    color: #999;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    outline: none;

    &::placeholder {
      color: #999;
    }
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }

  &.primary {
    background: #6fb8a5;
    border-color: #6fb8a5;
    color: white;

    &:hover {
      background: #5fa795;
    }
  }

  &:hover {
    background: #f5f5f5;
  }
}

// Table
.table-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.listings-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Noto Sans TC', sans-serif;

  thead {
    background: #f9f9f9;

    th {
      padding: 16px 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      white-space: nowrap;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.3s;

      &:hover {
        background: #fafafa;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 16px 12px;
      font-size: 14px;
      color: #1e1e1e;
      vertical-align: middle;
    }
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .product-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .product-name {
    font-weight: 500;
    color: #1e1e1e;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  i {
    font-size: 10px;
  }

  &.status-active {
    background: #e8f5f3;
    color: #00b894;

    i {
      color: #00b894;
    }
  }

  &.status-pending {
    background: #fff3e0;
    color: #f39c12;

    i {
      color: #f39c12;
    }
  }

  &.status-sold {
    background: #e3f2fd;
    color: #2196f3;

    i {
      color: #2196f3;
    }
  }

  &.status-hidden {
    background: #f5f5f5;
    color: #999;

    i {
      color: #999;
    }
  }
}

.stats-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #666;

    i {
      font-size: 14px;
      color: #999;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 12px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &.btn-view {
    background: white;
    border-color: #6fb8a5;
    color: #6fb8a5;

    &:hover {
      background: #6fb8a5;
      color: white;
    }
  }

  &.btn-edit {
    background: white;
    border-color: #2196f3;
    color: #2196f3;

    &:hover {
      background: #2196f3;
      color: white;
    }
  }

  &.btn-hide {
    background: white;
    border-color: #999;
    color: #999;

    &:hover {
      background: #999;
      color: white;
    }
  }

  &.btn-relist {
    background: white;
    border-color: #6fb8a5;
    color: #6fb8a5;

    &:hover {
      background: #6fb8a5;
      color: white;
    }
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
@media (max-width: 1199.98px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 991.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .manage-container {
    padding: 0 15px;
  }
}

@media (max-width: 767.98px) {
  .stats-grid {
    gap: 12px;
  }

  .stat-card {
    padding: 20px 16px;

    .stat-number {
      font-size: 28px;
    }

    .stat-label {
      font-size: 13px;
    }
  }

  .actions-bar {
    .search-box {
      max-width: 100%;
    }

    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }

  .table-container {
    padding: 16px;
    overflow-x: scroll;
  }

  .listings-table {
    min-width: 800px;
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .manage-container {
    padding: 0 10px;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
