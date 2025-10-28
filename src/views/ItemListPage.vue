<template>
  <div class="item-list-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Search Bar Section -->
      <section class="search-section">
        <SearchBar @search="handleSearch" />
      </section>

      <!-- Category and Filter Section -->
      <section class="filter-header-section">
        <div class="filter-container">
          <!-- Category Breadcrumb Tabs -->
          <CategoryTabs
            v-model="selectedCategory"
            :categories="categories"
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
          <div v-if="!loading && displayedProducts.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>找不到符合條件的物品</p>
          </div>

          <!-- Load More Button -->
          <div v-if="!loading && hasMore && displayedProducts.length > 0" class="load-more-section">
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
const selectedCategory = ref(0); // Default to '全部物品'
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
const pageTitle = computed(() => {
  const categoryLabel = categories.value.find(c => c.id === selectedCategory.value)?.name || '全部物品';

  if (searchQuery.value) {
    if (selectedCategory.value === 0) {
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

const handleCategoryChange = (categoryId) => {
  // Update URL query params when category changes
  const query = { ...route.query };

  if (categoryId === 0) {
    // Remove category param if it's 'all'
    delete query.category;
  } else {
    // Use category.id (number) in URL
    query.category = categoryId;
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
    products.value = data;
    displayedProducts.value = data;
    console.log('Products loaded:', data);
  } catch (error) {
    console.error('Failed to load products:', error);
  } finally {
    loading.value = false;
  }
};

// Watch for URL changes (e.g., browser back/forward)
watch(() => route.query.category, (newCategoryId) => {
  if (!newCategoryId) {
    selectedCategory.value = 0;
  } else {
    // Convert category_id (number) back to id (string)
    const category = categories.value.find(c => c.id === Number(newCategoryId));
    selectedCategory.value = category ? category.id : 0;
  }
});

// Watch for selectedCategory changes and reload products
watch(selectedCategory, (newVal, oldVal) => {
  // Skip if it's the initial value assignment
  if (oldVal === undefined) return;
  loadProducts();
});

// Watch categories to initialize selectedCategory when data is loaded
watch(categories, (newCategories) => {
  if (newCategories.length > 0 && route.query.category) {
    const category = newCategories.find(c => c.id === Number(route.query.category));
    if (category) {
      selectedCategory.value = category.id;
    }
  }
}, { immediate: true });

// Initialize from route query
onMounted(() => {
  if (route.query.search) {
    searchQuery.value = route.query.search;
  }
  // Category initialization is handled by the categories watcher above

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

// Search Section
.search-section {
  padding: 20px 0;
  margin-top: 10px;
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
  .search-section {
    padding: 15px 0;
    margin-top: 5px;
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
  .search-section {
    padding: 12px 0;
    margin-top: 0;
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
