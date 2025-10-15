<template>
  <div class="home-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Search Bar Section -->
      <section class="search-section">
        <SearchBar @search="handleSearch" />
      </section>

      <!-- Banner Carousel Section -->
      <section class="banner-section">
        <BCarousel
          id="banner-carousel"
          v-model="currentSlide"
          :interval="5000"
          controls
          indicators
          class="banner-carousel"
        >
          <BCarouselSlide
            v-for="(banner, index) in banners"
            :key="index"
            :img-src="banner.image"
          />
        </BCarousel>
      </section>

      <!-- Filter Tabs Section -->
      <section class="filter-section">
        <BContainer fluid>
          <div class="filter-tabs d-flex gap-3">
            <BButton
              v-for="filter in filters"
              :key="filter.id"
              :variant="activeFilter === filter.id ? 'dark' : 'light'"
              class="filter-btn"
              @click="activeFilter = filter.id"
            >
              {{ filter.label }}
            </BButton>
          </div>
        </BContainer>
      </section>

      <!-- Product Grid Section -->
      <section class="products-section">
        <BContainer fluid>
          <BRow class="g-4">
            <BCol
              v-for="product in products"
              :key="product.id"
              cols="12"
              sm="6"
              lg="4"
              xl="3"
            >
              <ProductCard
                :product="product"
                @favorite-toggle="handleFavoriteToggle"
                @contact-seller="handleContactSeller"
              />
            </BCol>
          </BRow>
        </BContainer>
      </section>

      <!-- Scroll to Top Button -->
      <BButton
        v-show="showScrollTop"
        variant="light"
        class="scroll-top-btn"
        @click="scrollToTop"
      >
        <i class="bi bi-arrow-up-circle fs-1"></i>
      </BButton>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { BContainer, BRow, BCol, BButton, BCarousel, BCarouselSlide } from 'bootstrap-vue-next';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import SearchBar from '../components/SearchBar.vue';
import ProductCard from '../components/ProductCard.vue';

// State
const userPoints = ref(500);
const currentSlide = ref(0);
const activeFilter = ref(1);
const showScrollTop = ref(false);

// Filters
const filters = [
  { id: 1, label: '最新上架' },
  { id: 2, label: '離我最近' },
  { id: 3, label: '為你推薦' }
];

// Banner data (placeholder)
const banners = [
  { image: 'https://via.placeholder.com/1600x400/4fc3f7/ffffff?text=Banner+1' },
  { image: 'https://via.placeholder.com/1600x400/81c784/ffffff?text=Banner+2' },
  { image: 'https://via.placeholder.com/1600x400/ffb74d/ffffff?text=Banner+3' }
];

// Mock product data
const products = ref([
  {
    id: 1,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/400x300/b49393/ffffff?text=Product+1',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/80/64978a/ffffff?text=A',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  },
  {
    id: 2,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/400x300/8a9164/ffffff?text=Product+2',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/80/90534d/ffffff?text=B',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  },
  {
    id: 3,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/400x300/64978a/ffffff?text=Product+3',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/80/b49393/ffffff?text=C',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  },
  {
    id: 4,
    name: '物品名稱',
    price: 700,
    image: 'https://via.placeholder.com/400x300/90534d/ffffff?text=Product+4',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://via.placeholder.com/80/8a9164/ffffff?text=D',
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
  background-color: #e7e1d9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

// Search Section
.search-section {
  padding: 20px 0;
  margin-top: 20px;
}

// Banner Section
.banner-section {
  padding: 30px 20px;
  max-width: 1600px;
  margin: 0 auto;

  .banner-carousel {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    :deep(.carousel-item img) {
      width: 100%;
      height: 268px;
      object-fit: cover;
    }

    :deep(.carousel-control-prev),
    :deep(.carousel-control-next) {
      width: 50px;
      height: 50px;
      background-color: rgba(171, 186, 188, 0.6);
      backdrop-filter: blur(10px);
      border: 3px solid #8c8c7d;
      border-radius: 50%;
      top: 50%;
      transform: translateY(-50%);
      opacity: 1;

      &:hover {
        background-color: rgba(171, 186, 188, 0.8);
      }
    }

    :deep(.carousel-control-prev) {
      left: -60px;
    }

    :deep(.carousel-control-next) {
      right: -60px;
    }

    :deep(.carousel-control-prev-icon),
    :deep(.carousel-control-next-icon) {
      filter: invert(1);
    }
  }
}

// Filter Section
.filter-section {
  padding: 20px 0;
  max-width: 1600px;
  margin: 0 auto;

  .filter-tabs {
    padding: 0 20px;

    .filter-btn {
      border: 1px solid #90534d;
      border-radius: 20px;
      padding: 5px 20px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
      transition: all 0.3s;

      &.btn-dark {
        background-color: #000;
        border-color: #90534d;
        color: #fff;
      }

      &.btn-light {
        background-color: #fff;
        border-color: #90534d;
        color: #000;
      }

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// Products Section
.products-section {
  padding: 30px 20px;
  max-width: 1600px;
  margin: 0 auto;
}

// Scroll to Top Button
.scroll-top-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #fff;
  border: 2px solid #90534d;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: all 0.3s;

  i {
    color: #1e1e1e;
  }

  &:hover {
    background-color: #f0f0f0;
    transform: translateY(-5px);
  }
}

// Responsive
@media (max-width: 1199.98px) {
  .banner-section {
    .banner-carousel {
      :deep(.carousel-control-prev) {
        left: 10px;
      }

      :deep(.carousel-control-next) {
        right: 10px;
      }
    }
  }
}

@media (max-width: 767.98px) {
  .search-section {
    padding: 15px 0;
    margin-top: 10px;
  }

  .banner-section {
    padding: 20px 10px;

    .banner-carousel {
      :deep(.carousel-item img) {
        height: 180px;
      }

      :deep(.carousel-control-prev),
      :deep(.carousel-control-next) {
        width: 40px;
        height: 40px;
      }
    }
  }

  .filter-section {
    .filter-tabs {
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        display: none;
      }

      .filter-btn {
        white-space: nowrap;
        font-size: 14px;
      }
    }
  }

  .products-section {
    padding: 20px 10px;
  }

  .scroll-top-btn {
    width: 50px;
    height: 50px;
    bottom: 20px;
    right: 20px;

    i {
      font-size: 1.5rem;
    }
  }
}
</style>
