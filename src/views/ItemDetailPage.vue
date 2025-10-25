<template>
  <div class="item-detail-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <div class="breadcrumb-section">
        <div class="container">
          <nav class="breadcrumb">
            <a href="/" class="breadcrumb-link">首頁</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">物品詳情</span>
          </nav>
        </div>
      </div>

      <!-- Product Detail Section -->
      <section class="product-detail-section">
        <div class="container">
          <div class="product-detail-wrapper">
            <!-- Left Side: Image Gallery -->
            <div class="image-gallery">
              <!-- Main Image -->
              <div class="main-image-wrapper">
                <img :src="currentImage" alt="Product Image" class="main-image" />

                <!-- Navigation Arrows for Mobile -->
                <button class="nav-arrow nav-prev" @click="previousImage">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <button class="nav-arrow nav-next" @click="nextImage">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>

              <!-- Thumbnail Gallery -->
              <div class="thumbnail-gallery">
                <button
                  v-for="(image, index) in product.images"
                  :key="index"
                  class="thumbnail"
                  :class="{ active: currentImageIndex === index }"
                  @click="selectImage(index)"
                >
                  <img :src="image" :alt="`Thumbnail ${index + 1}`" />
                </button>
              </div>
            </div>

            <!-- Right Side: Transaction Card -->
            <div class="transaction-card-wrapper">
              <TransactionCard
                :product-name="product.name"
                :is-free="product.isFree"
                :tags="product.tags"
                :location="product.location"
                :distance="product.distance"
                :posted-time="product.postedTime"
                :description="product.description"
                :seller-name="product.sellerName"
                :seller-avatar="product.sellerAvatar"
                :seller-id="product.sellerId"
                :rating="product.rating"
                @transaction="handleTransaction"
                @message="handleMessage"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Related Products Section -->
      <section class="related-products-section">
        <div class="container">
          <h3 class="section-title">我的刊登 ({{ relatedProducts.length }})</h3>
          <div class="products-grid">
            <ProductCard
              v-for="product in relatedProducts"
              :key="product.id"
              :product="product"
              @click="goToProduct(product.id)"
              @favorite-toggle="handleFavoriteToggle"
              @contact-seller="handleContactSeller"
            />
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import TransactionCard from '../components/TransactionCard.vue';
import ProductCard from '../components/ProductCard.vue';

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(500);
const currentImageIndex = ref(0);

// Mock product data
const product = ref({
  id: 1,
  name: '物品名稱',
  isFree: true, // Change to false for paid items
  tags: ['標籤 1', '標籤 2'],
  location: '台北市北投區',
  distance: '4.2公里',
  postedTime: '3天前',
  description: '物品描述... 這是一個很棒的物品，使用狀況良好，適合需要的人使用。',
  sellerName: '提供者名稱',
  sellerAvatar: 'https://placehold.co/49/1e1e1e/ffffff?text=A',
  sellerId: 1,
  rating: 4.5,
  images: [
    'https://placehold.co/600x600/6fb8a5/ffffff?text=Image+1',
    'https://placehold.co/600x600/5a9d8c/ffffff?text=Image+2',
    'https://placehold.co/600x600/4a8b7d/ffffff?text=Image+3',
    'https://placehold.co/600x600/3a7a6e/ffffff?text=Image+4'
  ]
});

// Related products
const relatedProducts = ref([
  {
    id: 2,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/6fb8a5/ffffff?text=Product+1',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=A',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  },
  {
    id: 3,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/5a9d8c/ffffff?text=Product+2',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=B',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  },
  {
    id: 4,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/4a8b7d/ffffff?text=Product+3',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=C',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  },
  {
    id: 5,
    name: '物品名稱',
    price: 700,
    image: 'https://placehold.co/330x250/3a7a6e/ffffff?text=Product+4',
    sellerName: '提供者名稱',
    sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=D',
    location: '台中市西屯區',
    distance: '500m',
    postedTime: '3天前'
  }
]);

// Computed
const currentImage = computed(() => product.value.images[currentImageIndex.value]);

// Methods
const selectImage = (index) => {
  currentImageIndex.value = index;
};

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  } else {
    currentImageIndex.value = product.value.images.length - 1;
  }
};

const nextImage = () => {
  if (currentImageIndex.value < product.value.images.length - 1) {
    currentImageIndex.value++;
  } else {
    currentImageIndex.value = 0;
  }
};

const handleTransaction = () => {
  // Navigate to transaction page
  router.push({ name: 'TransactionDetails', params: { id: product.value.id } });
};

const handleMessage = () => {
  console.log('Message seller');
  // Implement messaging logic
};

const goToProduct = (productId) => {
  router.push({ name: 'ItemDetail', params: { id: productId } });
};

const handleFavoriteToggle = (data) => {
  console.log('Favorite toggled:', data);
};

const handleContactSeller = (productId) => {
  console.log('Contact seller for product:', productId);
};
</script>

<style scoped lang="scss">
.item-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

// Breadcrumb
.breadcrumb-section {
  padding: 20px 0;
  background-color: #f9f9f9;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;
}

.breadcrumb-link {
  color: #6fb8a5;
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
}

// Product Detail Section
.product-detail-section {
  padding: 30px 0;
  background-color: white;
}

.product-detail-wrapper {
  display: grid;
  grid-template-columns: 600px 1fr;
  gap: 40px;
  align-items: start;
}

// Image Gallery
.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;

  .main-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nav-arrow {
    display: none; // Hidden on desktop, shown on mobile
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.9);
    border: none;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s;

    i {
      font-size: 24px;
      color: #1e1e1e;
    }

    &:hover {
      background-color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.nav-prev {
      left: 15px;
    }

    &.nav-next {
      right: 15px;
    }
  }
}

.thumbnail-gallery {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 5px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
  background: none;
  padding: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    border-color: #6fb8a5;
  }

  &.active {
    border-color: #6fb8a5;
    box-shadow: 0 0 0 1px #6fb8a5;
  }
}

// Transaction Card
.transaction-card-wrapper {
  position: sticky;
  top: 80px;
}

// Related Products Section
.related-products-section {
  padding: 40px 0;
  background-color: #f9f9f9;
}

.section-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0 0 25px 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

// Responsive Design
@media (max-width: 1399.98px) {
  .product-detail-wrapper {
    grid-template-columns: 500px 1fr;
    gap: 35px;
  }

  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
}

@media (max-width: 1199.98px) {
  .product-detail-wrapper {
    grid-template-columns: 450px 1fr;
    gap: 30px;
  }
}

@media (max-width: 991.98px) {
  .container {
    padding: 0 15px;
  }

  .breadcrumb-section {
    padding: 15px 0;
  }

  .breadcrumb {
    font-size: 13px;
  }

  .product-detail-section {
    padding: 25px 0;
  }

  .product-detail-wrapper {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .image-gallery {
    gap: 15px;
  }

  .transaction-card-wrapper {
    position: static;
  }

  .related-products-section {
    padding: 35px 0;
  }

  .section-title {
    font-size: 19px;
    margin-bottom: 22px;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}

@media (max-width: 575.98px) {
  .container {
    padding: 0 10px;
  }

  .breadcrumb-section {
    padding: 12px 0;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .product-detail-section {
    padding: 20px 0;
  }

  .product-detail-wrapper {
    gap: 25px;
  }

  .image-gallery {
    gap: 12px;
  }

  .main-image-wrapper {
    border-radius: 5px;

    .nav-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;

      i {
        font-size: 20px;
      }

      &.nav-prev {
        left: 10px;
      }

      &.nav-next {
        right: 10px;
      }
    }
  }

  .thumbnail-gallery {
    gap: 8px;
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

  .thumbnail {
    width: 70px;
    height: 70px;
    flex-shrink: 0;
  }

  .related-products-section {
    padding: 30px 0;
  }

  .section-title {
    font-size: 18px;
    margin-bottom: 20px;
  }

  .products-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

// Lock minimum width at 360px for phone
@media (max-width: 360px) {
  .container {
    min-width: 360px;
    padding: 0 10px;
  }
}
</style>
