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
          <div class="category-tabs">
            <button
              v-for="category in categories"
              :key="category.id"
              class="category-tab"
              :class="{ active: selectedCategory === category.id }"
              @click="selectCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import SearchBar from '../components/SearchBar.vue';
import ProductCard from '../components/ProductCard.vue';

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(500);
const selectedCategory = ref('all');
const activeFilter = ref(1);
const searchQuery = ref('');
const hasMore = ref(true);

// Categories
const categories = [
  { id: 'all', label: '全部物品' },
  { id: 'electronics', label: '電子產品' },
  { id: 'furniture', label: '家具' },
  { id: 'clothing', label: '服飾' },
  { id: 'books', label: '書籍' },
  { id: 'sports', label: '運動用品' }
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
    image: 'https://via.placeholder.com/330x250/6fb8a5/ffffff?text=Product+1',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=A',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 2,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/330x250/5a9d8c/ffffff?text=Product+2',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=B',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 3,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/330x250/4a8b7d/ffffff?text=Product+3',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=C',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'furniture'
  },
  {
    id: 4,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/330x250/3a7a6e/ffffff?text=Product+4',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=D',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 5,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/330x250/6fb8a5/ffffff?text=Product+5',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=E',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 6,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/330x250/5a9d8c/ffffff?text=Product+6',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=F',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'books'
  },
  {
    id: 7,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/330x250/4a8b7d/ffffff?text=Product+7',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=G',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  },
  {
    id: 8,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/330x250/3a7a6e/ffffff?text=Product+8',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/32/1e1e1e/ffffff?text=H',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前',
    category: 'electronics'
  }
]);

// Computed
const pageTitle = computed(() => {
  const categoryLabel = categories.find(c => c.id === selectedCategory.value)?.label || '全部物品';

  if (searchQuery.value) {
    if (selectedCategory.value === 'all') {
      return `有關 "${searchQuery.value}" 的物品`;
    }
    return `${categoryLabel}中有關 "${searchQuery.value}" 的物品`;
  }

  return categoryLabel;
});

const filteredProducts = computed(() => {
  let result = products.value;

  // Filter by category
  if (selectedCategory.value !== 'all') {
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
  // In real app, would also handle distance filter
  console.log('Search:', data);
};

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId;
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

// Initialize from route query
onMounted(() => {
  if (route.query.search) {
    searchQuery.value = route.query.search;
  }
  if (route.query.category) {
    selectedCategory.value = route.query.category;
  }
});
</script>

<style scoped lang="scss">
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
}

.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.category-tab {
  background-color: white;
  border: 1px solid #d0d0d0;
  border-radius: 16px;
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
  border: 1px solid #6fb8a5;
  border-radius: 5px;
  padding: 12px 40px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: #6fb8a5;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #6fb8a5;
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
  }

  .category-tabs {
    gap: 10px;
    margin-bottom: 18px;
  }

  .category-tab {
    font-size: 13px;
    padding: 5px 14px;
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
  }

  .category-tabs {
    gap: 8px;
    margin-bottom: 15px;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 5px;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #d0d0d0;
      border-radius: 2px;
    }
  }

  .category-tab {
    font-size: 12px;
    padding: 4px 12px;
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
