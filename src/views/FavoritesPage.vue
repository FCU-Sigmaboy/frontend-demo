<template>
  <div class="favorites-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <div class="breadcrumb-section">
        <div class="breadcrumb-container">
          <nav class="breadcrumb">
            <router-link to="/" class="breadcrumb-link">首頁</router-link>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">我的收藏</span>
          </nav>
        </div>
      </div>

      <div class="favorites-container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-left">
            <div class="header-info">
              <h1 class="page-title">我的收藏</h1>
              <p class="page-subtitle">{{ favoritesStore.count }} 個物品</p>
            </div>
          </div>

          <div class="header-actions">
            <button
              v-if="favoritesStore.count > 0"
              class="edit-btn"
              @click="toggleEditMode"
            >
              <i :class="['bi', isEditMode ? 'bi-check-lg' : 'bi-pencil']"></i>
              {{ isEditMode ? '完成' : '編輯' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Tabs Section -->
      <section v-if="!isLoading && !error" class="filter-section">
        <FilterTabs
          :items="filteredFavorites"
          :filters="sortFilters"
          v-model:sortedItems="displayedFavorites"
        />
      </section>

      <div class="favorites-container">

        <!-- Edit Mode Actions -->
        <div v-if="isEditMode && selectedItems.length > 0" class="batch-actions">
          <div class="selection-info">
            <span>已選取 {{ selectedItems.length }} 個物品</span>
          </div>
          <div class="action-buttons">
            <button class="action-btn" @click="selectAll">
              <i class="bi bi-check-all"></i>
              全選
            </button>
            <button class="action-btn delete-btn" @click="deleteSelected">
              <i class="bi bi-trash"></i>
              刪除
            </button>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <section v-if="isLoading" class="favorites-section">
          <div class="favorites-grid">
            <div v-for="i in 8" :key="`skeleton-${i}`" class="skeleton-product-card">
              <div class="skeleton-header">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-name"></div>
              </div>
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <i class="bi bi-exclamation-triangle"></i>
          <h3>載入失敗</h3>
          <p>{{ error }}</p>
          <button class="action-btn" @click="loadFavorites">
            <i class="bi bi-arrow-clockwise"></i>
            重試
          </button>
        </div>

        <!-- Favorites Grid -->
        <section v-else-if="displayedFavorites.length > 0" class="favorites-section">
          <TransitionGroup
            name="favorite-list"
            tag="div"
            class="favorites-grid"
          >
            <div
              v-for="product in displayedFavorites"
              :key="product.item_id"
              :class="['favorite-item', { 'edit-mode': isEditMode, 'selected': isSelected(product.item_id) }]"
            >
              <!-- Selection Checkbox (Edit Mode) -->
              <div v-if="isEditMode" class="selection-overlay" @click="toggleSelection(product.item_id)">
                <div class="selection-checkbox">
                  <i v-if="isSelected(product.item_id)" class="bi bi-check-circle-fill"></i>
                  <i v-else class="bi bi-circle"></i>
                </div>
              </div>

              <!-- Product Card -->
              <ProductCard
                :product="product"
                :show-favorite="!isEditMode"
                @click="!isEditMode && goToProductDetail(product.item_id)"
              />
            </div>
          </TransitionGroup>
        </section>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="bi bi-heart"></i>
          <h3>尚無收藏物品</h3>
          <p>開始探索並收藏你喜歡的物品</p>
          <button class="action-btn" @click="goToHome">
            <i class="bi bi-search"></i>
            探索物品
          </button>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '../stores/favorites';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import ProductCard from '../components/ProductCard.vue';
import FilterTabs from '../components/FilterTabs.vue';

const router = useRouter();
const favoritesStore = useFavoritesStore();

// State
const userPoints = ref(500);
const isEditMode = ref(false);
const selectedItems = ref([]);
const isLoading = ref(false);
const error = ref(null);
const displayedFavorites = ref([]);

// FilterTabs 使用的 filters - 使用配置驅動的方式
const sortFilters = [
  {
    id: 1,
    label: '收藏時間',
    sortKey: ['favorited_at', 'created_at'],  // fallback: 如果沒有 favorited_at 就用 created_at
    defaultOrder: 'desc',  // 預設：晚到早
    ascText: '早到晚',
    descText: '晚到早'
  },
  {
    id: 2,
    label: '距離',
    sortKey: 'distance_km',
    defaultOrder: 'asc',   // 預設：近到遠
    ascText: '近到遠',
    descText: '遠到近'
  },
  {
    id: 3,
    label: '價格',
    sortKey: 'price',
    defaultOrder: 'asc',   // 預設：低到高
    ascText: '低到高',
    descText: '高到低'
  }
];

// Computed - 給 FilterTabs 使用
const filteredFavorites = computed(() => {
  return favoritesStore.favoriteItems;
});

// Methods
const goToHome = () => {
  router.push({ name: 'Home' });
};

const goToProductDetail = (id) => {
  router.push({ name: 'ItemDetail', params: { id } });
};

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    selectedItems.value = [];
  }
};

const isSelected = (id) => {
  return selectedItems.value.includes(id);
};

const toggleSelection = (id) => {
  const index = selectedItems.value.indexOf(id);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(id);
  }
};

const selectAll = () => {
  if (selectedItems.value.length === displayedFavorites.value.length) {
    selectedItems.value = [];
  } else {
    selectedItems.value = displayedFavorites.value.map(item => item.item_id);
  }
};

const deleteSelected = () => {
  if (confirm(`確定要移除 ${selectedItems.value.length} 個收藏？`)) {
    selectedItems.value.forEach(itemId => {
      favoritesStore.removeFavorite(itemId);
    });
    selectedItems.value = [];
    isEditMode.value = false;
  }
};

// 載入收藏列表
const loadFavorites = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await favoritesStore.loadFavorites({
      page: 1,
      size: 100,
      sort_by: 'favorited_at',
      sort_direction: 'desc'
    });
  } catch (err) {
    error.value = err.message || '載入收藏列表失敗';
    console.error('Failed to load favorites:', err);
  } finally {
    isLoading.value = false;
  }
};

// 頁面載入時獲取收藏列表
onMounted(() => {
  loadFavorites();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.favorites-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

// Breadcrumb Section
.breadcrumb-section {
  padding: 15px 0 10px;
  background-color: #f9f9f9;
}

.breadcrumb-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;
  flex-wrap: wrap;
}

.breadcrumb-link {
  color: $primary;
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    color: #5fa795;
    text-decoration: underline;
  }
}

.breadcrumb-separator {
  color: #999;
}

.breadcrumb-current {
  color: #1e1e1e;
  font-weight: 500;
}

.favorites-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 30px 20px 0;
}

// Page Header
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  .header-left {
    display: flex;
    align-items: center;
  }

  .header-info {
    display: flex;
    flex-direction: column;

    .page-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #1e1e1e;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
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

    &:hover {
      background: #f5f5f5;
      border-color: $primary;
      color: $primary;
    }
  }
}

// Filter Section
.filter-section {
  padding: 20px 0;
  background-color: #f9f9f9;
}

// Batch Actions
.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .selection-info {
    span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #1e1e1e;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #1e1e1e;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 16px;
    }

    &:hover {
      background: #f5f5f5;
      border-color: $primary;
      color: $primary;
    }

    &.delete-btn {
      &:hover {
        background: #dc3545;
        border-color: #dc3545;
        color: white;
      }
    }
  }
}

// Favorites Grid
.favorites-section {
  margin-bottom: 40px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 20px;
}

// Favorite List Animation
.favorite-list-move,
.favorite-list-enter-active,
.favorite-list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.favorite-list-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.favorite-list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-30px);
}

.favorite-list-leave-active {
  position: absolute;
}

.favorite-item {
  position: relative;

  &.edit-mode {
    cursor: pointer;

    &:hover {
      .selection-overlay {
        background: rgba(0, 0, 0, 0.1);
      }
    }
  }

  &.selected {
    .selection-overlay {
      background: rgba(111, 184, 165, 0.1);
    }
  }
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 12px;
  background: transparent;
  transition: all 0.3s;
  border-radius: 12px;

  .selection-checkbox {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    i {
      font-size: 24px;
      color: $primary;

      &.bi-circle {
        color: #d0d0d0;
      }
    }
  }
}

// Skeleton Product Card
.skeleton-product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 0.5px solid #e0e0e0;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-name {
  flex: 1;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-image {
  width: 100%;
  height: 250px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-content {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-title {
  width: 80%;
  height: 18px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-text {
  width: 100%;
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;

  &.short {
    width: 60%;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Error State
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  i {
    font-size: 100px;
    color: #ff6b6b;
    margin-bottom: 24px;
  }

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 12px 0;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #999;
    margin: 0 0 32px 0;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
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
    font-size: 100px;
    color: #e0e0e0;
    margin-bottom: 24px;
  }

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 12px 0;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #999;
    margin: 0 0 32px 0;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
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

// Responsive
@media (max-width: 991.98px) {
  .main-content {
    padding-bottom: 50px;
  }

  .breadcrumb-section {
    padding: 12px 0 8px;
  }

  .breadcrumb-container {
    padding: 0 15px;
  }

  .breadcrumb {
    font-size: 13px;
    gap: 6px;
  }

  .favorites-container {
    padding: 25px 15px 0;
  }

  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
}

@media (max-width: 767.98px) {
  .page-header {
    .header-left {
      flex: 1;
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }

    .header-info {
      .page-title {
        font-size: 24px;
      }
    }
  }

  .batch-actions {
    flex-direction: column;
    gap: 16px;

    .selection-info,
    .action-buttons {
      width: 100%;
    }

    .action-buttons {
      justify-content: flex-end;
    }
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding-bottom: 40px;
  }

  .breadcrumb-section {
    padding: 10px 0 6px;
  }

  .breadcrumb-container {
    padding: 0 10px;
  }

  .breadcrumb {
    font-size: 12px;
    gap: 5px;
  }

  .favorites-container {
    padding: 20px 10px 0;
  }

  .page-header {
    margin-bottom: 20px;

    .header-info {
      .page-title {
        font-size: 20px;
      }

      .page-subtitle {
        font-size: 13px;
      }
    }
  }

  .favorites-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .empty-state {
    padding: 80px 20px;

    i {
      font-size: 80px;
    }

    h3 {
      font-size: 20px;
    }

    p {
      font-size: 14px;
    }
  }
}
</style>
