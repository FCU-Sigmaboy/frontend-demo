<template>
  <div class="home-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Search Bar Section -->
      <section class="search-section">
        <SearchBar @search="handleSearch" />
      </section>

      <!-- Hero Banner Section -->
      <section class="hero-section">
        <HeroBanner />
      </section>

      <!-- Explore Categories Section -->
      <ExploreSection @category-click="handleCategoryClick" />

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

          <!-- Actual Product Cards -->
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
        </div>
      </section>

      <!-- Scroll to Top Button -->
      <button
        v-show="showScrollTop"
        class="scroll-top-btn"
        @click="scrollToTop"
      >
        <i class="bi bi-arrow-up-circle-fill"></i>
      </button>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import SearchBar from '../components/SearchBar.vue';
import HeroBanner from '../components/HeroBanner.vue';
import ExploreSection from '../components/ExploreSection.vue';
import FilterTabs from '../components/FilterTabs.vue';
import ProductCard from '../components/ProductCard.vue';

import { supabase } from '@/lib/supabase';
import { searchItems } from '@/api/get_searchItemsAPI';

const router = useRouter();

// State
const userPoints = ref(500);
const showScrollTop = ref(false);

const authenticatedUser = ref(null);

// Filters
const filters = ref([
  { id: 1, label: '最新上架' },
  { id: 2, label: '離我最近' },
]);

// Products data
const products = ref([]);
const displayedProducts = ref([]);
const loading = ref(false);

// Methods
const handleSearch = (searchData) => {
  console.log('Search:', searchData);
  // Navigate to item list page with search query
  router.push({
    name: 'ItemList',
    query: { search: searchData.query, distance: searchData.distance }
  });
};

const handleCategoryClick = (category) => {
  console.log('Category clicked:', category);
  // Navigate to item list page with category filter
  router.push({
    name: 'ItemList',
    query: { category: category.id }
  });
};

const handleFavoriteToggle = (data) => {
  console.log('Favorite toggled:', data);
  // Implement favorite logic
};

const handleContactSeller = (productId) => {
  console.log('Contact seller for product:', productId);
  // Implement contact logic
};

const goToProductDetail = (productId) => {
  router.push({ name: 'ItemDetail', params: { id: productId } });
};

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 500;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Lifecycle
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  authenticatedUser.value = user;
  if (authenticatedUser.value) {
    filters.value.push({ id: 3, label: '為你推薦' });
  }

  // Load products
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

  // Add scroll listener
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped lang="scss">
.home-page {
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
  position: relative;
  z-index: 1;
}

// Hero Section
.hero-section {
  padding: 20px 0;
}

// Filter Section
.filter-section {
  padding: 30px 0 20px;
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
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 20px;
  justify-content: space-between;
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
  height: 330px;
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

// Product List Animations
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

// Scroll to Top Button
.scroll-top-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 32px;
    color: #1e1e1e;
  }

  &:hover {
    background-color: #f5f5f5;
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(-3px);
  }
}

// Responsive
@media (max-width: 1199.98px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
}

@media (max-width: 991.98px) {
  .search-section {
    padding: 15px 0;
    margin-top: 5px;
  }

  .hero-section {
    padding: 15px 0;
  }

  .filter-section {
    padding: 25px 0 18px;
  }

  .products-section {
    padding: 18px 0 35px;
  }

  .products-container {
    padding: 0 15px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }

  .scroll-top-btn {
    width: 44px;
    height: 44px;
    bottom: 25px;
    right: 25px;

    i {
      font-size: 28px;
    }
  }
}

@media (max-width: 575.98px) {
  .search-section {
    padding: 12px 0;
    margin-top: 0;
  }

  .hero-section {
    padding: 12px 0;
  }

  .filter-section {
    padding: 20px 0 15px;
  }

  .products-section {
    padding: 15px 0 30px;
  }

  .products-container {
    padding: 0 10px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
    gap: 12px;
  }

  .scroll-top-btn {
    width: 40px;
    height: 40px;
    bottom: 20px;
    right: 20px;

    i {
      font-size: 24px;
    }
  }
}
</style>
