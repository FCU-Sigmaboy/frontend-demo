<template>
  <div class="item-detail-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="breadcrumbItems" />

      <!-- Product Detail Section -->
      <section class="product-detail-section">
        <div class="container">
          <!-- Error State -->
          <div v-if="error" class="error-state">
            <i class="bi bi-exclamation-triangle"></i>
            <h3>載入失敗</h3>
            <p>{{ error }}</p>
            <button class="action-btn" @click="retryLoadProduct">
              <i class="bi bi-arrow-clockwise"></i>
              重試
            </button>
          </div>

          <!-- Loading Skeleton -->
          <div v-else-if="loading" class="product-detail-wrapper">
            <!-- Left Side: Image Gallery Skeleton -->
            <div class="image-gallery">
              <div class="skeleton-main-image"></div>
              <div class="thumbnail-gallery">
                <div v-for="i in 3" :key="`skeleton-thumb-${i}`" class="skeleton-thumbnail"></div>
              </div>
            </div>

            <!-- Right Side: Transaction Card Skeleton -->
            <div class="transaction-card-wrapper">
              <div class="skeleton-transaction-card">
                <div class="skeleton-title"></div>
                <div class="skeleton-badges">
                  <div class="skeleton-badge"></div>
                  <div class="skeleton-badge"></div>
                </div>
                <div class="skeleton-info"></div>
                <div class="skeleton-info"></div>
                <div class="skeleton-divider"></div>
                <div class="skeleton-section-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-divider"></div>
                <div class="skeleton-section-title"></div>
                <div class="skeleton-seller">
                  <div class="skeleton-avatar"></div>
                  <div class="skeleton-seller-info">
                    <div class="skeleton-seller-name"></div>
                    <div class="skeleton-seller-rating"></div>
                  </div>
                </div>
                <div class="skeleton-divider"></div>
                <div class="skeleton-button"></div>
              </div>
            </div>
          </div>

          <!-- Actual Content -->
          <div v-else class="product-detail-wrapper">
            <!-- Left Side: Image Gallery -->
            <div class="image-gallery">
              <!-- Main Image -->
              <div class="main-image-wrapper" :style="{ backgroundImage: `url(${currentImage})` }">
                <img
                  :src="currentImage"
                  alt="Product Image"
                  class="main-image"
                  @click="openImagePreview(currentImageIndex)"
                  style="cursor: pointer;"
                />

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
                  v-for="(image, index) in product.image_urls"
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
              <ItemDetailsCard
                :product-id="String(product.id)"
                :product-name="product.title"
                :price="product.price"
                :condition="product.condition"
                :carbon-value="product.carbon_value"
                :listing-status="product.listing_status"
                :tags="product.tags"
                :location="product.location?.formatted_address"
                :distance="product.distance_km ? `${product.distance_km}km` : '距離未知'"
                :posted-time="product.created_at"
                :description="product.description"
                :seller-name="product.user?.nickname"
                :seller-avatar="product.user?.profile_picture_url"
                :seller-id="product.user?.id"
                :image-url="product.image_urls?.[0]"
                :rating="product.user?.avg_rating"
                :is-in-transaction="isInTransaction"
                :transaction-status-text="transactionStatusText"
                @message="handleMessage"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Related Products Section -->
      <section class="related-products-section">
        <div class="container">
          <h3 class="section-title">相似物品 ({{ loadingRelated ? '...' : relatedProducts.length }})</h3>

          <!-- Loading Skeleton for Related Products -->
          <div v-if="loadingRelated" class="products-grid">
            <div v-for="i in 4" :key="`skeleton-${i}`" class="skeleton-product-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-product-title"></div>
                <div class="skeleton-product-text"></div>
                <div class="skeleton-product-text short"></div>
              </div>
            </div>
          </div>

          <!-- Empty State for No Related Products -->
          <div v-else-if="!loadingRelated && relatedProducts.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>沒有相關物品</p>
          </div>

          <!-- Actual Product Cards -->
          <div v-else class="products-grid">
            <ProductCard
              v-for="product in relatedProducts"
              :key="product.item_id || product.id"
              :product="product"
              @click="goToProduct(product.item_id || product.id)"
              @favorite-toggle="handleFavoriteToggle"
              @contact-seller="handleContactSeller"
            />
          </div>
        </div>
      </section>
    </main>

    <AppFooter />

    <!-- Image Preview Modal -->
    <Transition name="modal-fade">
      <div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
        <!-- Close Button -->
        <button class="modal-close-btn" @click="closeImagePreview">
          <i class="bi bi-x-lg"></i>
        </button>

        <!-- Image Counter -->
        <div class="image-counter">
          {{ previewImageIndex + 1 }} / {{ product.image_urls.length }}
        </div>

        <!-- Previous Button -->
        <button
          class="modal-nav-btn modal-prev-btn"
          @click.stop="previousPreviewImage"
          :disabled="product.image_urls.length <= 1"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <!-- Next Button -->
        <button
          class="modal-nav-btn modal-next-btn"
          @click.stop="nextPreviewImage"
          :disabled="product.image_urls.length <= 1"
        >
          <i class="bi bi-chevron-right"></i>
        </button>

        <!-- Main Preview Image -->
        <div class="modal-image-container" @click.stop>
          <img
            :src="product.image_urls[previewImageIndex]"
            :alt="`Product Image ${previewImageIndex + 1}`"
            class="modal-image"
          />
        </div>

        <!-- Thumbnail Strip -->
        <div class="modal-thumbnail-strip" @click.stop>
          <button
            v-for="(image, index) in product.image_urls"
            :key="index"
            class="modal-thumbnail"
            :class="{ active: previewImageIndex === index }"
            @click="previewImageIndex = index"
          >
            <img :src="image" :alt="`Thumbnail ${index + 1}`" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import ItemDetailsCard from '../components/ItemDetailsCard.vue';
import ProductCard from '../components/ProductCard.vue';

import { useAuthStore } from '../stores/auth';
import { useTransactionStore } from '../stores/transaction';
import { getItemDetails, searchItems } from '@/api/itemsAPI';
import { createOrGetConversation } from '@/api/conversationAPI.js';

const authStore = useAuthStore();
const transactionStore = useTransactionStore();

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(0);
const currentImageIndex = ref(0);
const loading = ref(true);
const error = ref(null);

// Product data
const product = ref({
  image_urls: [],
  tags: []
});

// Related products
const relatedProducts = ref([]);
const loadingRelated = ref(true);

// Image preview modal
const showImagePreview = ref(false);
const previewImageIndex = ref(0);

// Breadcrumb items
const breadcrumbItems = computed(() => {
  const items = [];

  if (product.value.category) {
    items.push({
      label: product.value.category.main_category_name,
      to: { name: 'ItemList', query: { category: product.value.category.main_category_id } }
    });
    items.push({
      label: product.value.category.sub_category_name,
      to: { name: 'ItemList', query: { subCategory: product.value.category.sub_category_id } }
    });
  }

  items.push({
    label: product.value.title || '物品資訊'
  });

  return items;
});

// Transaction status check
const transactionInfo = computed(() => {
  if (!product.value.id) return null;
  return transactionStore.getTransactionByItem(product.value.id);
});

const isInTransaction = computed(() => {
  return transactionInfo.value !== null;
});

const transactionStatusText = computed(() => {
  if (!transactionInfo.value) return null;
  const statusMap = {
    'waiting': '等待確認中',
    'in_transaction': '交易進行中',
    'sold': '已售出'
  };
  return statusMap[transactionInfo.value.status] || '交易中';
});

// Computed
const currentImage = computed(() => {
  if (!product.value.image_urls || product.value.image_urls.length === 0) {
    return '';
  }
  return product.value.image_urls[currentImageIndex.value];
});

// Methods
const selectImage = (index) => {
  currentImageIndex.value = index;
};

const previousImage = () => {
  if (!product.value.image_urls || product.value.image_urls.length === 0) return;

  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  } else {
    currentImageIndex.value = product.value.image_urls.length - 1;
  }
};

const nextImage = () => {
  if (!product.value.image_urls || product.value.image_urls.length === 0) return;

  if (currentImageIndex.value < product.value.image_urls.length - 1) {
    currentImageIndex.value++;
  } else {
    currentImageIndex.value = 0;
  }
};

const handleMessage = async () => {
  // Check if user is logged in
  if (!authStore.user) {
    alert('請先登入才能發送訊息');
    router.push('/login');
    return;
  }

  // Don't allow messaging yourself
  if (product.value.user?.id === authStore.user.id) {
    alert('無法向自己發送訊息');
    return;
  }

  try {
    console.log('Starting chat for item:', product.value.id);
    // Start or find conversation using V2 API
    const result = await createOrGetConversation(product.value.user.id, product.value.id);
    console.log('Chat started, conversation ID:', result.conversation_id);

    // Navigate to messages page
    router.push('/messages');
  } catch (error) {
    console.error('Failed to start chat:', error);
    alert('無法開始聊天，請稍後再試');
  }
};

const goToProduct = (productId) => {
  // 切換路由，watch 會自動重新載入商品資料
  router.push({ name: 'ItemDetail', params: { id: productId } });
  // 滾動到頁面頂部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleFavoriteToggle = (data) => {
  console.log('Favorite toggled:', data);
};

const handleContactSeller = async (productId) => {
  // Check if user is logged in
  if (!authStore.user) {
    alert('請先登入才能發送訊息');
    router.push('/login');
    return;
  }

  try {
    console.log('Starting chat for item:', productId);

    // Find the product in relatedProducts to get seller ID
    const targetProduct = relatedProducts.value.find(p => (p.item_id || p.id) === productId);
    if (!targetProduct || !targetProduct.user?.id) {
      throw new Error('無法找到商品資訊');
    }

    // Don't allow messaging yourself
    if (targetProduct.user.id === authStore.user.id) {
      alert('無法向自己發送訊息');
      return;
    }

    // Start or find conversation using V2 API
    const result = await createOrGetConversation(targetProduct.user.id, productId);
    console.log('Chat started, conversation ID:', result.conversation_id);

    // Navigate to messages page
    router.push('/messages');
  } catch (error) {
    console.error('Failed to start chat:', error);
    alert('無法開始聊天，請稍後再試');
  }
};

// Image preview methods
const openImagePreview = (index) => {
  previewImageIndex.value = index;
  showImagePreview.value = true;
  document.body.style.overflow = 'hidden'; // Prevent body scroll
};

const closeImagePreview = () => {
  showImagePreview.value = false;
  document.body.style.overflow = ''; // Restore body scroll
};

const previousPreviewImage = () => {
  if (!product.value.image_urls || product.value.image_urls.length === 0) return;

  if (previewImageIndex.value > 0) {
    previewImageIndex.value--;
  } else {
    previewImageIndex.value = product.value.image_urls.length - 1;
  }
};

const nextPreviewImage = () => {
  if (!product.value.image_urls || product.value.image_urls.length === 0) return;

  if (previewImageIndex.value < product.value.image_urls.length - 1) {
    previewImageIndex.value++;
  } else {
    previewImageIndex.value = 0;
  }
};

const handleKeyDown = (event) => {
  if (!showImagePreview.value) return;

  if (event.key === 'Escape') {
    closeImagePreview();
  } else if (event.key === 'ArrowLeft') {
    previousPreviewImage();
  } else if (event.key === 'ArrowRight') {
    nextPreviewImage();
  }
};

// Load related products based on sub-category
const loadRelatedProducts = async (subCategoryId, currentItemId) => {
  if (!subCategoryId) return;

  loadingRelated.value = true;
  try {
    const data = await searchItems({
      sub_category_id: subCategoryId,
      page: 1,
      size: 8
    });

    // Filter out the current item from related products
    if (data) {
      // 使用新的 API 格式中的 id 欄位
      relatedProducts.value = data.filter(item => (item.item_id || item.id) !== currentItemId);
      // Limit to 4 items if there are more
      if (relatedProducts.value.length > 4) {
        relatedProducts.value = relatedProducts.value.slice(0, 4);
      }
    }
    console.log('Related products loaded:', relatedProducts.value);
  } catch (error) {
    console.error('Error loading related products:', error);
    relatedProducts.value = [];
  } finally {
    loadingRelated.value = false;
  }
};

// Load product details
const loadProductDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const itemId = Number(route.params.id);

    // 驗證 itemId
    if (!itemId || itemId <= 0) {
      error.value = '無效的物品 ID';
      return;
    }

    console.log(`Loading item details for ID: ${itemId}`);
    
    // v4.0 API - 自動處理使用者位置和登入狀態
    const response = await getItemDetails(itemId);
    console.log('Fetched item details:', response);

    // 檢查回應格式
    if (response && response.success && response.data) {
      product.value = response.data;
      
      // 重置圖片索引
      currentImageIndex.value = 0;

      // 顯示位置資訊（如果有）
      if (response.isAuthenticated) {
        if (response.hasDistance && response.data.distance_km) {
          console.log(`距離: ${response.data.distance_km} km`);
        }
        console.log(`位置來源: ${response.locationSource}`);
      }

      // Load related products based on sub-category
      if (response.data.category?.sub_category_id) {
        await loadRelatedProducts(response.data.category.sub_category_id, response.data.id);
      }

      // Fetch transaction data if user is logged in
      if (authStore.user) {
        await transactionStore.fetchAllTransactions();
      }
    } else {
      // Handle item not found or unavailable
      error.value = response?.message || '找不到此物品，可能已下架或不存在';
      console.warn(`${response?.code}: ${response?.message}`);
    }
  } catch (err) {
    console.error('Error loading item details:', err);
    error.value = err.message || '載入物品資訊時發生錯誤，請稍後再試';
  } finally {
    loading.value = false;
  }
};

// Retry loading product
const retryLoadProduct = () => {
  loadProductDetails();
};

// 監聽路由參數變化
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadProductDetails();
    }
  }
);

onMounted(async () => {
  await authStore.initAuth();
  loadProductDetails();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = ''; // Ensure scroll is restored
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

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
  overflow: hidden;
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
    object-fit: contain;
    backdrop-filter: blur(20px) brightness(0.8);
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
    border-color: $primary;
  }

  &.active {
    border-color: $primary;
    box-shadow: 0 0 0 1px $primary;
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

// Skeleton Loaders
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Product Detail Skeleton
.skeleton-main-image {
  width: 100%;
  padding-top: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-thumbnail {
  width: 80px;
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 5px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-transaction-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-title {
  width: 70%;
  height: 28px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-badges {
  display: flex;
  gap: 8px;
}

.skeleton-badge {
  width: 60px;
  height: 26px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 15px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-info {
  width: 100%;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 8px 0;
}

.skeleton-section-title {
  width: 40%;
  height: 22px;
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
}

.skeleton-seller {
  display: flex;
  align-items: center;
  gap: 15px;
}

.skeleton-avatar {
  width: 49px;
  height: 49px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-seller-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-seller-name {
  width: 120px;
  height: 18px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-seller-rating {
  width: 150px;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-button {
  width: 100%;
  height: 48px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 5px;
  animation: shimmer 1.5s ease-in-out infinite;
}

// Related Products Skeleton
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

.skeleton-product-title {
  width: 80%;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-product-text {
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

// Empty State for Related Products
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
    margin: 0;
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
  min-height: 400px;

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
    text-align: center;
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

  .empty-state {
    padding: 60px 20px;

    i {
      font-size: 56px;
    }

    p {
      font-size: 16px;
    }
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

  .empty-state {
    padding: 40px 15px;

    i {
      font-size: 48px;
    }

    p {
      font-size: 14px;
    }
  }

  .error-state {
    padding: 80px 20px;
    min-height: 300px;

    i {
      font-size: 80px;
    }

    h3 {
      font-size: 20px;
    }

    p {
      font-size: 14px;
    }

    .action-btn {
      padding: 12px 28px;
      font-size: 15px;
    }
  }
}

// Lock minimum width at 360px for phone
@media (max-width: 360px) {
  .container {
    min-width: 360px;
    padding: 0 10px;
  }
}

// Image Preview Modal Styles
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 24px;
  cursor: pointer;
  z-index: 10001;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: rotate(90deg);
  }
}

.image-counter {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  z-index: 10001;
}

.modal-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 30px;
  cursor: pointer;
  z-index: 10001;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-50%) scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.modal-prev-btn {
    left: 30px;
  }

  &.modal-next-btn {
    right: 30px;
  }
}

.modal-image-container {
  max-width: 90%;
  max-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;

  .modal-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
}

.modal-thumbnail-strip {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 12px;
  max-width: 90%;
  overflow-x: auto;
  z-index: 10001;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
}

.modal-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
  background: none;
  padding: 0;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.05);
  }

  &.active {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba(111, 184, 165, 0.3);
  }
}

// Modal Transition
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

// Responsive styles for modal
@media (max-width: 991.98px) {
  .modal-nav-btn {
    width: 50px;
    height: 50px;
    font-size: 24px;

    &.modal-prev-btn {
      left: 20px;
    }

    &.modal-next-btn {
      right: 20px;
    }
  }

  .image-counter {
    top: 20px;
    font-size: 14px;
    padding: 6px 16px;
  }

  .modal-close-btn {
    top: 15px;
    right: 15px;
    width: 44px;
    height: 44px;
    font-size: 20px;
  }

  .modal-image-container {
    max-height: calc(100vh - 180px);
  }

  .modal-thumbnail-strip {
    bottom: 20px;
    padding: 12px;
    gap: 10px;
  }

  .modal-thumbnail {
    width: 70px;
    height: 70px;
  }
}

@media (max-width: 575.98px) {
  .image-preview-modal {
    padding: 10px;
  }

  .modal-nav-btn {
    width: 44px;
    height: 44px;
    font-size: 20px;

    &.modal-prev-btn {
      left: 10px;
    }

    &.modal-next-btn {
      right: 10px;
    }
  }

  .image-counter {
    top: 15px;
    font-size: 13px;
    padding: 5px 14px;
  }

  .modal-close-btn {
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .modal-image-container {
    max-height: calc(100vh - 160px);
  }

  .modal-thumbnail-strip {
    bottom: 15px;
    padding: 10px;
    gap: 8px;

    &::-webkit-scrollbar {
      height: 4px;
    }
  }

  .modal-thumbnail {
    width: 60px;
    height: 60px;
    border-width: 2px;
  }
}
</style>
