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
        <FilterTabs v-model="activeFilter" :filters="filters" />
      </section>

      <!-- Product Grid Section -->
      <section class="products-section">
        <div class="products-container">
          <div class="products-grid">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @favorite-toggle="handleFavoriteToggle"
              @contact-seller="handleContactSeller"
            />
          </div>
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
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import SearchBar from '../components/SearchBar.vue';
import HeroBanner from '../components/HeroBanner.vue';
import ExploreSection from '../components/ExploreSection.vue';
import FilterTabs from '../components/FilterTabs.vue';
import ProductCard from '../components/ProductCard.vue';

// State
const userPoints = ref(500);
const activeFilter = ref(1);
const showScrollTop = ref(false);

// Filters
const filters = [
  { id: 1, label: '最新上架' },
  { id: 2, label: '離我最近' },
  { id: 3, label: '為你推薦' }
];

// Mock product data
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
    postedTime: '3天前'
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
    postedTime: '3天前'
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
    postedTime: '3天前'
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
    postedTime: '3天前'
  }
]);

// Methods
const handleSearch = (searchData) => {
  console.log('Search:', searchData);
  // Implement search logic
};

const handleCategoryClick = (category) => {
  console.log('Category clicked:', category);
  // Implement category filter logic
};

const handleFavoriteToggle = (data) => {
  console.log('Favorite toggled:', data);
  // Implement favorite logic
};

const handleContactSeller = (productId) => {
  console.log('Contact seller for product:', productId);
  // Implement contact logic
};

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 500;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Lifecycle
onMounted(() => {
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
