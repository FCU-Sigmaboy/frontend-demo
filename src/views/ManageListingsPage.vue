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

        <!-- Stats Cards (Filter Buttons) -->
        <div class="stats-grid">
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'all' }"
            @click="setFilter('all')"
          >
            <div class="stat-number">{{ stats.all }}</div>
            <div class="stat-label">全部商品</div>
          </div>
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'active' }"
            @click="setFilter('active')"
          >
            <div class="stat-number">{{ stats.active }}</div>
            <div class="stat-label">上架中</div>
          </div>
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'inactive' }"
            @click="setFilter('inactive')"
          >
            <div class="stat-number">{{ stats.inactive }}</div>
            <div class="stat-label">已下架</div>
          </div>
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'sold' }"
            @click="setFilter('sold')"
          >
            <div class="stat-number">{{ stats.sold }}</div>
            <div class="stat-label">已售出</div>
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
                    <a class="product-name" :href="`/items/${listing.id}`">{{ listing.name }}</a>
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
                      v-if="listing.status !== 'sold'"
                      class="btn-sm btn-edit"
                      @click="editListing(listing.id)"
                      title="編輯"
                    >
                      編輯
                    </button>
                    <button
                      v-if="listing.status === 'inactive'"
                      class="btn-sm btn-toggle"
                      @click="toggleStatus(listing.id, true)"
                      title="上架"
                    >
                      上架
                    </button>
                    <button
                      v-if="listing.status === 'active'"
                      class="btn-sm btn-toggle"
                      @click="toggleStatus(listing.id, false)"
                      title="下架"
                    >
                      下架
                    </button>
                    <button
                      v-if="listing.status !== 'sold'"
                      class="btn-sm btn-delete"
                      @click="deleteListing(listing.id)"
                      title="刪除"
                    >
                      刪除
                    </button>
                    <button
                      v-if="listing.status === 'sold'"
                      class="btn-sm btn-view"
                      @click="viewTransaction(listing.id)"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getMyItems } from '../api/get_myItemsAPI';
import { toggleItemStatus, deleteMyItem } from '../api/update_myItemAPI';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const router = useRouter();
const authStore = useAuthStore();

// State
const userPoints = ref(500);
const searchQuery = ref('');
const activeFilter = ref('all');
const listings = ref([]);
const isLoading = ref(false);

// Computed stats
const stats = computed(() => {
  const all = listings.value.length;
  const active = listings.value.filter(item => item.status === 'active').length;
  const inactive = listings.value.filter(item => item.status === 'inactive').length;
  const sold = listings.value.filter(item => item.status === 'sold').length;

  return { all, active, inactive, sold };
});

// Computed filtered listings
const filteredListings = computed(() => {
  let filtered = listings.value;

  // Filter by status
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(item => item.status === activeFilter.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
});

// Load listings from API
const loadListings = async () => {
  if (!authStore.isLoggedIn) {
    console.warn('⚠️ Not logged in, cannot load listings');
    return;
  }

  try {
    isLoading.value = true;
    console.log('🔍 Fetching my items...');

    const items = await getMyItems({
      page: 1,
      size: 100,
      sort_by: 'updated_at',
      sort_direction: 'desc'
    });

    if (items) {
      // Transform API data to match component expectations
      listings.value = items.map(item => {
        // Determine status based on listing_status and other factors
        let status = 'inactive'; // default to inactive (off shelf)

        if (item.listing_status === true) {
          status = 'active'; // on shelf
        } else if (item.listing_status === false) {
          // Check if it's sold or just inactive
          // For now, assume false = inactive (you may need additional field to mark as sold)
          status = 'inactive';
        }

        return {
          id: item.id,
          name: item.title,
          image: item.cover_image_url || 'https://placehold.co/60x60/6fb8a5/ffffff?text=Item',
          status: status,
          publishedDate: formatDate(item.created_at),
          updatedDate: formatDate(item.updated_at),
          price: item.price || 0,
          views: 0, // API doesn't return views yet
          likes: 0  // API doesn't return likes yet
        };
      });

      console.log('✅ Loaded listings:', listings.value.length);
    }
  } catch (error) {
    console.error('❌ Failed to load listings:', error);
    alert('載入刊登失敗，請稍後再試');
  } finally {
    isLoading.value = false;
  }
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '/');
};

// Set filter
const setFilter = (filter) => {
  activeFilter.value = filter;
};

// Methods
const getStatusIcon = (status) => {
  const icons = {
    active: 'bi bi-circle-fill',
    inactive: 'bi bi-dash-circle',
    sold: 'bi bi-check-circle'
  };
  return icons[status] || 'bi-circle';
};

const getStatusText = (status) => {
  const texts = {
    active: '上架中',
    inactive: '已下架',
    sold: '已售出'
  };
  return texts[status] || status;
};

const goToCreateListing = () => {
  router.push({ name: 'CreateListing' });
};

const editListing = (id) => {
  router.push({ name: 'EditListing', params: { id: String(id) } });
};

const viewTransaction = (id) => {
  router.push({ name: 'TransactionDetails', params: { id } });
};

// Toggle listing status (上架/下架)
const toggleStatus = async (id, newStatus) => {
  const action = newStatus ? '上架' : '下架';
  if (!confirm(`確定要${action}此商品嗎？`)) return;

  try {
    console.log(`🔄 Toggling item #${id} status to ${newStatus}`);

    await toggleItemStatus(id, newStatus);

    // Update local state
    const listing = listings.value.find(l => l.id === id);
    if (listing) {
      listing.status = newStatus ? 'active' : 'inactive';
    }

    alert(`${action}成功！`);
  } catch (error) {
    console.error(`❌ Failed to toggle status:`, error);
    alert(`${action}失敗：${error.message}`);
  }
};

// Delete listing
const deleteListing = async (id) => {
  if (!confirm('確定要刪除此刊登嗎？刪除後無法復原。')) return;

  try {
    console.log(`🗑️ Deleting item #${id}`);

    await deleteMyItem(id);

    // Remove from local state
    listings.value = listings.value.filter(l => l.id !== id);

    alert('刪除成功！');
  } catch (error) {
    console.error('❌ Failed to delete item:', error);
    alert(`刪除失敗：${error.message}`);
  }
};

// Load listings on mount
onMounted(() => {
  if (authStore.isLoggedIn) {
    loadListings();
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

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
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &.active {
    border-color: $primary;
    background: #f0f9f7;

    .stat-number {
      color: $primary;
    }

    .stat-label {
      color: $primary;
      font-weight: 600;
    }
  }

  .stat-number {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e1e1e;
    margin-bottom: 8px;
    transition: color 0.3s;
  }

  .stat-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    transition: all 0.3s;
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
    background: $primary;
    border-color: $primary;
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
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
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

  &.status-inactive {
    background: #f5f5f5;
    color: #999;

    i {
      color: #999;
    }
  }

  &.status-sold {
    background: #e3f2fd;
    color: #2196f3;

    i {
      color: #2196f3;
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
    border-color: $primary;
    color: $primary;

    &:hover {
      background: $primary;
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

  &.btn-toggle {
    background: white;
    border-color: $primary;
    color: $primary;

    &:hover {
      background: $primary;
      color: white;
    }
  }

  &.btn-delete {
    background: white;
    border-color: #dc3545;
    color: #dc3545;

    &:hover {
      background: #dc3545;
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
