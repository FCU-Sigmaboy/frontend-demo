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

          <!-- Filter Options -->
          <div class="filter-options">
            <button
              v-for="filter in filters"
              :key="filter.id"
              class="filter-btn"
              :class="{ active: activeFilter === filter.id }"
              @click="activeFilter = filter.id"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Product Grid Section -->
      <section class="products-section">
        <div class="products-container">
          <div class="products-grid">
            <ProductCard
              v-for="product in filteredProducts"
              :key="product.id"
              :product="product"
              @click="goToProductDetail(product.id)"
              @favorite-toggle="handleFavoriteToggle"
              @contact-seller="handleContactSeller"
            />
          </div>

          <!-- Empty State -->
          <div v-if="filteredProducts.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>找不到符合條件的物品</p>
          </div>

          <!-- Load More Button -->
          <div v-if="hasMore && filteredProducts.length > 0" class="load-more-section">
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

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(500);
const selectedCategory = ref(0); // Default to '全部物品'
const activeFilter = ref(1);
const searchQuery = ref('');
const hasMore = ref(true);

// Categories
const categories = [
  { id: 0, category_id: 0, name: '全部物品', icon: '', image: '' },
  { id: 1, category_id: 1, name: '流行服飾', icon: 'bi bi-bag', image: 'https://placehold.co/150/f4a261/ffffff?text=流行服飾' },
  { id: 2, category_id: 2, name: '鞋包配件', icon: 'bi bi-handbag', image: 'https://placehold.co/150/e76f51/ffffff?text=鞋包配件' },
  { id: 3, category_id: 3, name: '美妝保養', icon: 'bi bi-flower1', image: 'https://placehold.co/150/f4c2c2/ffffff?text=美妝保養' },
  { id: 4, category_id: 4, name: '電子 3C', icon: 'bi bi-laptop', image: 'https://placehold.co/150/457b9d/ffffff?text=電子3C' },
  { id: 5, category_id: 5, name: '家電用品', icon: 'bi bi-tv', image: 'https://placehold.co/150/a8dadc/ffffff?text=家電用品' },
  { id: 6, category_id: 6, name: '家具家飾', icon: 'bi bi-house', image: 'https://placehold.co/150/8d99ae/ffffff?text=家具家飾' },
  { id: 7, category_id: 7, name: '親子婦幼', icon: 'bi bi-heart', image: 'https://placehold.co/150/ffc8dd/ffffff?text=親子婦幼' },
  { id: 8, category_id: 8, name: '生活娛樂', icon: 'bi bi-controller', image: 'https://placehold.co/150/cdb4db/ffffff?text=生活娛樂' },
  { id: 9, category_id: 9, name: '圖書影音', icon: 'bi bi-book', image: 'https://placehold.co/150/ffafcc/ffffff?text=圖書影音' }
];

// Filters
const filters = [
  { id: 1, label: '最新上架' },
  { id: 2, label: '離我最近' },
  { id: 3, label: '為你推薦' }
];

// Mock product data (same structure as HomePage)
const products = ref([
  {
    id: 1,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/6fb8a5/ffffff?text=Product+1',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=A',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 2,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/5a9d8c/ffffff?text=Product+2',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=B',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 3,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/4a8b7d/ffffff?text=Product+3',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=C',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'furniture'
  },
  {
    id: 4,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/3a7a6e/ffffff?text=Product+4',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=D',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 5,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/6fb8a5/ffffff?text=Product+5',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=E',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 6,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/5a9d8c/ffffff?text=Product+6',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=F',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'books'
  },
  {
    id: 7,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/4a8b7d/ffffff?text=Product+7',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=G',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 8,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/3a7a6e/ffffff?text=Product+8',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=H',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  }
]);

// Computed
const pageTitle = computed(() => {
  const categoryLabel = categories.find(c => c.category_id === selectedCategory.value)?.name || '全部物品';

  if (searchQuery.value) {
    if (selectedCategory.value === 0) {
      return `有關 "${searchQuery.value}" 的物品`;
    }
    return `${categoryLabel} 中有關 "${searchQuery.value}" 的物品`;
  }

  return categoryLabel;
});

const filteredProducts = computed(() => {
  let result = products.value;

  // Filter by category
  if (selectedCategory.value !== 0) {
    result = result.filter(p => p.category === selectedCategory.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return result;
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

  // Find the category object to get category_id
  const category = categories.find(c => c.category_id === categoryId);

  if (categoryId === 0 || !category) {
    // Remove category param if it's 'all'
    delete query.category;
  } else {
    // Use category_id (number) in URL
    query.category = category.category_id;
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

// Watch for URL changes (e.g., browser back/forward)
watch(() => route.query.category, (newCategoryId) => {
  if (!newCategoryId) {
    selectedCategory.value = 0;
  } else {
    // Convert category_id (number) back to id (string)
    const category = categories.find(c => c.category_id === Number(newCategoryId));
    selectedCategory.value = category ? category.category_id : 0;
  }
});

// Initialize from route query
onMounted(() => {
  if (route.query.search) {
    searchQuery.value = route.query.search;
  }
  if (route.query.category) {
    // Convert category_id (number) from URL to id (string)
    const category = categories.find(c => c.category_id === Number(route.query.category));
    selectedCategory.value = category ? category.category_id : 0;
  }
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
  margin: 0 0 20px 0;
}

.filter-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  background-color: white;
  border: 1px solid #d0d0d0;
  border-radius: 5px;
  padding: 6px 16px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background-color: #f5f5f5;
    border-color: #6fb8a5;
  }

  &.active {
    background-color: #6fb8a5;
    border-color: #6fb8a5;
    color: white;
    font-weight: 500;
  }
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
    margin-bottom: 18px;
  }

  .filter-options {
    gap: 10px;
  }

  .filter-btn {
    font-size: 13px;
    padding: 5px 14px;
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
    margin-bottom: 15px;
  }

  .filter-options {
    gap: 8px;
  }

  .filter-btn {
    font-size: 12px;
    padding: 4px 12px;
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
