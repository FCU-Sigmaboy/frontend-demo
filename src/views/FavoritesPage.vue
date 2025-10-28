<template>
  <div class="favorites-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="favorites-container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="back-btn" @click="goBack">
              <i class="bi bi-arrow-left"></i>
            </button>
            <div class="header-info">
              <h1 class="page-title">我的收藏</h1>
              <p class="page-subtitle">{{ favoritesStore.count }} 個物品</p>
            </div>
          </div>

          <div class="header-actions">
            <select v-model="sortBy" class="sort-select">
              <option value="recent">最近收藏</option>
              <option value="price-low">價格：低到高</option>
              <option value="price-high">價格：高到低</option>
              <option value="distance">距離最近</option>
            </select>

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

        <!-- Filter Tabs -->
        <div v-if="filteredFavorites.length > 0 || favoritesStore.count > 0" class="filter-section">
          <div class="filter-tabs">
            <button
              v-for="filter in filters"
              :key="filter.id"
              :class="['filter-tab', { active: activeFilter === filter.id }]"
              @click="activeFilter = filter.id"
            >
              {{ filter.label }}
              <span v-if="filter.count" class="filter-count">{{ filter.count }}</span>
            </button>
          </div>
        </div>

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

        <!-- Favorites Grid -->
        <section v-if="filteredFavorites.length > 0" class="favorites-section">
          <div class="favorites-grid">
            <div
              v-for="product in filteredFavorites"
              :key="product.id"
              :class="['favorite-item', { 'edit-mode': isEditMode, 'selected': isSelected(product.id) }]"
            >
              <!-- Selection Checkbox (Edit Mode) -->
              <div v-if="isEditMode" class="selection-overlay" @click="toggleSelection(product.id)">
                <div class="selection-checkbox">
                  <i v-if="isSelected(product.id)" class="bi bi-check-circle-fill"></i>
                  <i v-else class="bi bi-circle"></i>
                </div>
              </div>

              <!-- Product Card -->
              <ProductCard
                :product="product"
                :show-favorite="!isEditMode"
                @click="!isEditMode && goToProductDetail(product.id)"
                @favorite-toggle="handleFavoriteToggle"
              />
            </div>
          </div>
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '../stores/favorites';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import ProductCard from '../components/ProductCard.vue';

const router = useRouter();
const favoritesStore = useFavoritesStore();

// State
const userPoints = ref(500);
const sortBy = ref('recent');
const activeFilter = ref('all');
const isEditMode = ref(false);
const selectedItems = ref([]);

const filters = computed(() => {
  const availableCount = favoritesStore.favoriteItems.filter(i => i.status === 'available').length;
  const soldCount = favoritesStore.favoriteItems.filter(i => i.status === 'sold').length;

  return [
    { id: 'all', label: '全部', count: favoritesStore.count },
    { id: 'available', label: '可購買', count: availableCount },
    { id: 'sold', label: '已售出', count: soldCount }
  ];
});

// Computed
const filteredFavorites = computed(() => {
  let filtered = favoritesStore.favoriteItems;

  // Filter by status
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(item => item.status === activeFilter.value);
  }

  // Sort
  const sorted = [...filtered];
  switch (sortBy.value) {
    case 'recent':
      sorted.sort((a, b) => new Date(b.favoriteDate) - new Date(a.favoriteDate));
      break;
    case 'price-low':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'distance':
      sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      break;
  }

  return sorted;
});

// Methods
const goBack = () => {
  router.back();
};

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
  if (selectedItems.value.length === filteredFavorites.value.length) {
    selectedItems.value = [];
  } else {
    selectedItems.value = filteredFavorites.value.map(item => item.id);
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

const handleFavoriteToggle = (data) => {
  // Remove from favorites
  favoritesStore.removeFavorite(data.productId);
};
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
  padding: 30px 0 60px;
}

.favorites-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
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
    gap: 16px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;

    i {
      font-size: 20px;
      color: #1e1e1e;
    }

    &:hover {
      background: #f5f5f5;
      transform: translateX(-3px);
    }
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

  .sort-select {
    padding: 10px 16px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    background: white;
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    cursor: pointer;
    outline: none;
    transition: all 0.3s;

    &:focus {
      border-color: $primary;
    }
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
  margin-bottom: 24px;
}

.filter-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;

  .filter-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 8px;
    background: #e0e0e0;
    border-radius: 11px;
    font-size: 12px;
    font-weight: 600;
    color: #666;
  }

  &:hover {
    border-color: $primary;
    color: $primary;
  }

  &.active {
    background: $primary;
    border-color: $primary;
    color: white;

    .filter-count {
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }
  }
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
      font-size: 15px;
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
    padding: 20px 0 50px;
  }

  .favorites-container {
    padding: 0 15px;
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

    .sort-select {
      flex: 1;
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
    padding: 15px 0 40px;
  }

  .favorites-container {
    padding: 0 10px;
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

    .back-btn {
      width: 36px;
      height: 36px;

      i {
        font-size: 18px;
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
