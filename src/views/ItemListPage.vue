<template>
  <div class="item-list-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <div class="breadcrumb-section">
        <div class="breadcrumb-container">
          <nav class="breadcrumb">
            <router-link to="/" class="breadcrumb-link">首頁</router-link>
            <span class="breadcrumb-separator">&gt;</span>
            <router-link to="/items" class="breadcrumb-link" v-if="selectedCategory !== 0 || selectedSubCategory !== 0">物品列表</router-link>
            <span class="breadcrumb-current" v-else>物品列表</span>

            <template v-if="selectedCategory !== 0">
              <span class="breadcrumb-separator">&gt;</span>
              <router-link
                :to="`/items?category=${selectedCategory}`"
                class="breadcrumb-link"
                v-if="selectedSubCategory !== 0"
              >
                {{ mainCategoryName }}
              </router-link>
              <span class="breadcrumb-current" v-else>{{ mainCategoryName }}</span>
            </template>

            <template v-if="selectedSubCategory !== 0">
              <span class="breadcrumb-separator">&gt;</span>
              <span class="breadcrumb-current">{{ subCategoryName }}</span>
            </template>
          </nav>
        </div>
      </div>

      <!-- Search Bar Section -->
      <section class="search-section">
        <SearchBar @search="handleSearch" />
      </section>

      <!-- Category and Filter Section -->
      <section class="filter-header-section">
        <div class="filter-container">
          <!-- Category Breadcrumb Tabs -->
          <CategoryTabs
            v-model="currentTabValue"
            :categories="tabsData"
            :loading="categoriesStore.isLoading"
            @change="handleCategoryChange"
          />

          <!-- Page Title -->
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
      </section>

      <!-- Filter Tabs Section -->
      <section class="filter-section">
        <FilterTabs :items="products" :filters="filters" v-model:sortedItems="displayedProducts" />
      </section>

      <!-- Product Grid Section -->
      <section class="products-section">
        <div class="products-container">
          <!-- Loading Skeleton -->
          <div v-if="loading" class="products-grid">
            <div v-for="i in 8" :key="`skeleton-${i}`" class="skeleton-product-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
              </div>
            </div>
          </div>

          <!-- Actual Product Cards with Animation -->
          <TransitionGroup
            v-else
            name="product-list"
            tag="div"
            class="products-grid"
          >
            <ProductCard
              v-for="product in displayedProducts"
              :key="product.item_id"
              :product="product"
              @click="goToProductDetail(product.item_id)"
              @favorite-toggle="handleFavoriteToggle"
              @contact-seller="handleContactSeller"
            />
          </TransitionGroup>

          <!-- Empty State -->
          <div v-if="!loading && displayedProducts && displayedProducts.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>找不到符合條件的物品</p>
          </div>

          <!-- Load More Button -->
          <div v-if="!loading && hasMore && displayedProducts && displayedProducts.length > 0" class="load-more-section">
            <button class="load-more-btn" @click="loadMore">
              載入更多
            </button>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import SearchBar from '../components/SearchBar.vue';
import ProductCard from '../components/ProductCard.vue';
import CategoryTabs from '../components/CategoryTabs.vue';
import FilterTabs from '../components/FilterTabs.vue';

import { useCategoriesStore } from '@/stores/categories.js';
import { searchItems } from '@/api/get_searchItemsAPI';

const route = useRoute();
const router = useRouter();

const categoriesStore = useCategoriesStore()

if (!categoriesStore.isLoaded) {
  categoriesStore.fetchCategories().catch((error) => {
    console.error('Failed to fetch categories in ExploreSection:', error);
  });
}

const categories = computed(() => categoriesStore.categories);

// State
const userPoints = ref(500);
const selectedCategory = ref(0); // 當前選中的主分類
const selectedSubCategory = ref(0); // 當前選中的子分類
const searchQuery = ref('');
const hasMore = ref(true);
const loading = ref(false);

// Filters
const filters = [
  { id: 1, label: '最新上架' },
  { id: 2, label: '離我最近' },
  { id: 3, label: '為你推薦' }
];

// Products data
const products = ref([]);
const displayedProducts = ref([]);

// Computed

// 動態計算 category tabs 顯示的內容
const tabsData = computed(() => {
  const subCategoryId = route.query.subCategory;
  const categoryId = route.query.category;

  // 場景 1: 有 subCategory - 從 subCategory 反查主分類，顯示該主分類的所有子分類
  if (subCategoryId) {
    const subCat = categoriesStore.getSubCategoryById(Number(subCategoryId));
    if (subCat?.mainCategory) {
      const subCategories = categoriesStore.getSubCategoriesByMainId(subCat.mainCategory.id);
      return [
        { id: 0, name: '全部' },
        ...subCategories
      ];
    }
  }

  // 場景 2: 有 category（但沒有 subCategory）- 顯示該主分類的所有子分類
  if (categoryId) {
    const subCategories = categoriesStore.getSubCategoriesByMainId(Number(categoryId));
    return [
      { id: 0, name: '全部' },
      ...subCategories
    ];
  }

  // 場景 3: 都沒有 - 顯示所有主分類
  return [
    { id: 0, name: '全部' },
    ...categories.value
  ];
});

// 當前選中的 tab ID
const currentTabValue = computed(() => {
  // 如果有 subCategory，返回 selectedSubCategory
  if (route.query.subCategory) {
    return selectedSubCategory.value;
  }
  // 如果有 category，返回 0（因為還沒選子分類）
  if (route.query.category) {
    return 0;
  }
  // 否則返回 selectedCategory（主分類層級）
  return selectedCategory.value;
});

// 主分類名稱（用於麵包屑）
const mainCategoryName = computed(() => {
  if (selectedCategory.value === 0) return '';
  const mainCategory = categories.value.find(c => c.id === selectedCategory.value);
  return mainCategory?.name || '';
});

// 子分類名稱（用於麵包屑）
const subCategoryName = computed(() => {
  if (selectedSubCategory.value === 0) return '';
  const subCat = categoriesStore.getSubCategoryById(selectedSubCategory.value);
  return subCat?.name || '';
});

const pageTitle = computed(() => {
  const categoryId = route.query.category;
  const subCategoryId = route.query.subCategory;

  let categoryLabel = '全部物品';

  if (subCategoryId) {
    // 有子分類：顯示子分類名稱
    const subCat = categoriesStore.getSubCategoryById(Number(subCategoryId));
    categoryLabel = subCat?.name || '全部物品';
  } else if (categoryId) {
    // 只有主分類：顯示主分類名稱
    const mainCategory = categories.value.find(c => c.id === Number(categoryId));
    categoryLabel = mainCategory?.name || '全部物品';
  }

  if (searchQuery.value) {
    if (!categoryId && !subCategoryId) {
      return `有關 "${searchQuery.value}" 的物品`;
    }
    return `${categoryLabel} 中有關 "${searchQuery.value}" 的物品`;
  }

  return categoryLabel;
});


// Methods
const handleSearch = (data) => {
  searchQuery.value = data.query;

  // Update URL query params
  const query = { ...route.query };

  if (data.query) {
    query.search = data.query;
  } else {
    delete query.search;
  }

  if (data.distance) {
    query.distance = data.distance;
  } else {
    delete query.distance;
  }

  router.push({ query });

  console.log('Search:', data);
};

const handleCategoryChange = (tabId) => {
  const query = { ...route.query };

  // 判斷當前是在主分類層級還是子分類層級
  const isInSubCategoryLevel = route.query.category || route.query.subCategory;

  if (!isInSubCategoryLevel) {
    // 當前在主分類層級：選擇的是主分類
    if (tabId === 0) {
      delete query.category;
    } else {
      query.category = tabId;
    }
    delete query.subCategory; // 確保清除子分類
  } else {
    // 當前在子分類層級：選擇的是子分類
    if (tabId === 0) {
      // 點擊「全部」- 返回該主分類的「全部」產品
      delete query.subCategory;

      // 需要保留 category 參數，如果沒有則需要從 subCategory 反查
      if (!query.category && route.query.subCategory) {
        const subCat = categoriesStore.getSubCategoryById(Number(route.query.subCategory));
        if (subCat?.mainCategory) {
          query.category = subCat.mainCategory.id;
        }
      }
    } else {
      // 選擇子分類 - 只保留 subCategory，不需要 category
      query.subCategory = tabId;
      delete query.category;
    }
  }

  router.push({ query });
};

const goToProductDetail = (productId) => {
  router.push({ name: 'ItemDetail', params: { id: productId } });
};

const handleFavoriteToggle = (data) => {
  console.log('Favorite toggled:', data);
};

const handleContactSeller = (productId) => {
  console.log('Contact seller for product:', productId);
};

const loadMore = () => {
  console.log('Load more products');
  // Implement pagination logic
  hasMore.value = false;
};

// Load products function
const loadProducts = async () => {
  loading.value = true;
  try {
    const data = await searchItems();
    products.value = data || [];
    displayedProducts.value = data || [];
    console.log('Products loaded:', data);
  } catch (error) {
    console.error('Failed to load products:', error);
    products.value = [];
    displayedProducts.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch for URL query changes and update selected category/subcategory
watch(() => [route.query.category, route.query.subCategory, categories.value.length],
  ([newCategoryId, newSubCategoryId, categoriesLength]) => {
    // 更新子分類選擇
    if (newSubCategoryId) {
      selectedSubCategory.value = Number(newSubCategoryId);
      // 從子分類反查主分類
      if (categoriesLength > 0) {
        const subCat = categoriesStore.getSubCategoryById(Number(newSubCategoryId));
        selectedCategory.value = subCat?.mainCategory?.id || 0;
      }
    } else {
      selectedSubCategory.value = 0;

      // 更新主分類選擇
      if (!newCategoryId) {
        selectedCategory.value = 0;
      } else {
        const categoryId = Number(newCategoryId);
        // 如果 categories 還沒加載完成，直接使用 ID
        if (categoriesLength === 0) {
          selectedCategory.value = categoryId;
        } else {
          const category = categories.value.find(c => c.id === categoryId);
          selectedCategory.value = category ? category.id : 0;
        }
      }
    }
  },
  { immediate: true }
);

// Watch for category/subcategory changes and reload products
watch([selectedCategory, selectedSubCategory], ([newCategory, newSubCategory], [oldCategory, oldSubCategory]) => {
  // Skip if it's the initial value assignment
  if (oldCategory === undefined && oldSubCategory === undefined) return;

  // Only reload if values actually changed
  if (newCategory !== oldCategory || newSubCategory !== oldSubCategory) {
    loadProducts();
  }
});

// Initialize from route query
onMounted(() => {
  if (route.query.search) {
    searchQuery.value = route.query.search;
  }

  // Load products
  loadProducts();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.item-list-page {
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

// Search Section
.search-section {
  padding: 10px 0 20px;
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

// Filter Header Section
.filter-header-section {
  padding: 30px 0 20px;
  background-color: #f9f9f9;
}

.filter-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;

  :deep(.category-tabs) {
    margin-bottom: 20px;
  }
}

.page-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #1e1e1e;
  margin: 0;
}

// Filter Section
.filter-section {
  padding: 20px 0;
  background-color: #f9f9f9;
}

// Products Section
.products-section {
  padding: 20px 0 40px;
}

.products-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

// Product List Animation
.product-list-move,
.product-list-enter-active,
.product-list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.product-list-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.product-list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-30px);
}

.product-list-leave-active {
  position: absolute;
}

// Skeleton Product Card
.skeleton-product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-image {
  width: 100%;
  height: 280px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;

  i {
    font-size: 64px;
    margin-bottom: 20px;
    display: block;
  }

  p {
    font-size: 18px;
    font-family: 'Noto Sans TC', sans-serif;
  }
}

// Load More
.load-more-section {
  text-align: center;
  padding: 20px 0;
}

.load-more-btn {
  background-color: white;
  border: 1px solid $primary;
  border-radius: 5px;
  padding: 12px 40px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: $primary;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: $primary;
    color: white;
  }
}

// Responsive Design
@media (max-width: 1399.98px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
}

@media (max-width: 991.98px) {
  .breadcrumb-section {
    padding: 12px 0 8px;
  }

  .search-section {
    padding: 8px 0 18px;
  }

  .breadcrumb-container {
    padding: 0 15px;
  }

  .breadcrumb {
    font-size: 13px;
    gap: 6px;
  }

  .filter-header-section {
    padding: 25px 0 18px;
  }

  .filter-container {
    padding: 0 15px;

    :deep(.category-tabs) {
      margin-bottom: 18px;
    }
  }

  .page-title {
    font-size: 24px;
  }

  .filter-section {
    padding: 18px 0;
  }

  .products-section {
    padding: 18px 0 35px;
  }

  .products-container {
    padding: 0 15px;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 35px;
  }

  .empty-state {
    padding: 60px 20px;

    i {
      font-size: 56px;
    }

    p {
      font-size: 16px;
    }
  }

  .load-more-btn {
    padding: 10px 35px;
    font-size: 15px;
  }
}

@media (max-width: 575.98px) {
  .breadcrumb-section {
    padding: 10px 0 6px;
  }

  .search-section {
    padding: 6px 0 15px;
  }

  .breadcrumb-container {
    padding: 0 10px;
  }

  .breadcrumb {
    font-size: 12px;
    gap: 5px;
  }

  .filter-header-section {
    padding: 20px 0 15px;
  }

  .filter-container {
    padding: 0 10px;

    :deep(.category-tabs) {
      margin-bottom: 15px;
    }
  }

  .page-title {
    font-size: 20px;
  }

  .filter-section {
    padding: 15px 0;
  }

  .products-section {
    padding: 15px 0 30px;
  }

  .products-container {
    padding: 0 10px;
  }

  .products-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 30px;
  }

  .empty-state {
    padding: 40px 15px;

    i {
      font-size: 48px;
    }

    p {
      font-size: 14px;
    }
  }

  .load-more-btn {
    padding: 10px 30px;
    font-size: 14px;
  }
}

// Lock minimum width at 360px for phone
@media (max-width: 360px) {
  .filter-container,
  .products-container {
    min-width: 360px;
    padding: 0 10px;
  }
}
</style>
