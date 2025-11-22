<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>載入中...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <i class="bi bi-exclamation-circle"></i>
            <p>{{ errorMessage }}</p>
            <button class="btn-retry" @click="loadItemDetails">重試</button>
          </div>

          <!-- Content -->
          <div v-else-if="itemDetail" class="modal-content">
            <!-- Header -->
            <div class="modal-header">
              <h3>物品詳情</h3>
              <button class="close-btn" @click="closeModal">
                <i class="bi bi-x"></i>
              </button>
            </div>

            <!-- Body -->
            <div class="modal-body">
              <!-- Image Gallery -->
              <div v-if="itemDetail.image_urls && itemDetail.image_urls.length > 0" class="image-gallery">
                <div class="image-container">
                  <img
                    :src="itemDetail.image_urls[currentImageIndex]"
                    :alt="itemDetail.title"
                    class="main-image"
                    @click="openImagePreview"
                  />

                  <button
                    v-if="!isOwner"
                    class="favorite-btn"
                    :class="{ active: isFavorite }"
                    :disabled="isProcessingFavorite"
                    @click.stop="toggleFavorite"
                    aria-label="收藏此物品"
                  >
                    <i :class="isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                  </button>

                  <!-- Navigation Arrows -->
                  <button
                    v-if="itemDetail.image_urls.length > 1"
                    class="nav-arrow nav-prev"
                    @click="previousImage"
                    :disabled="currentImageIndex === 0"
                  >
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <button
                    v-if="itemDetail.image_urls.length > 1"
                    class="nav-arrow nav-next"
                    @click="nextImage"
                    :disabled="currentImageIndex === itemDetail.image_urls.length - 1"
                  >
                    <i class="bi bi-chevron-right"></i>
                  </button>

                  <!-- Image Counter -->
                  <div v-if="itemDetail.image_urls.length > 1" class="image-counter">
                    {{ currentImageIndex + 1 }} / {{ itemDetail.image_urls.length }}
                  </div>
                </div>

                <!-- Thumbnail Gallery -->
                <div v-if="itemDetail.image_urls.length > 1" class="thumbnail-gallery">
                  <button
                    v-for="(image, index) in itemDetail.image_urls"
                    :key="index"
                    class="thumbnail"
                    :class="{ active: currentImageIndex === index }"
                    @click="selectImage(index)"
                  >
                    <img :src="image" :alt="`縮圖 ${index + 1}`" />
                  </button>
                </div>
              </div>
              <div v-else class="image-placeholder">
                <i class="bi bi-image"></i>
              </div>

              <!-- Item Info -->
              <div class="item-info">
                <h2 class="item-title clickable" @click="goToItemDetail" title="查看完整商品頁面">
                  {{ itemDetail.title }}
                  <i class="bi bi-box-arrow-up-right"></i>
                </h2>
                <p class="item-price">
                  <i class="bi bi-leaf"></i>
                  <span>{{ formatPrice(itemDetail.price) }}</span>
                </p>

                <div v-if="sellerId" class="seller-summary">
                  <div class="seller-profile" @click="goToSellerProfile">
                    <img :src="sellerAvatar" :alt="sellerName" />
                    <div class="seller-text">
                      <p class="seller-name">{{ sellerName }}</p>
                    </div>
                  </div>

                  <button
                    v-if="!isOwner && sellerId"
                    class="follow-icon-btn"
                    :class="{ active: isFollowing }"
                    :disabled="isProcessingFollow"
                    @click.stop="toggleFollow"
                    :title="isFollowing ? '取消追蹤' : '追蹤'"
                  >
                    <i :class="isFollowing ? 'bi bi-person-check-fill' : 'bi bi-person-plus-fill'"></i>
                  </button>
                </div>

                <!-- Meta Info -->
                <div class="meta-info">
                  <div v-if="itemDetail.distance_km !== null && itemDetail.distance_km !== undefined" class="meta-item">
                    <i class="bi bi-geo-alt"></i>
                    <span>{{ formatDistance(itemDetail.distance_km) }}</span>
                  </div>
                  <div v-if="itemDetail.created_at" class="meta-item">
                    <i class="bi bi-clock"></i>
                    <span>{{ formatDate(itemDetail.created_at) }}</span>
                  </div>
                  <div v-if="itemDetail.status" class="meta-item">
                    <span class="status-badge" :class="getStatusClass(itemDetail.status)">
                      {{ getStatusText(itemDetail.status) }}
                    </span>
                  </div>
                </div>

                <!-- Description -->
                <div v-if="itemDetail.description" class="description-section">
                  <h4>商品描述</h4>
                  <p class="description" :class="{ expanded: isDescriptionExpanded }">
                    {{ itemDetail.description }}
                  </p>
                  <button v-if="showDescriptionToggle" class="toggle-description-btn" @click="toggleDescription">
                    {{ isDescriptionExpanded ? '收起' : '查看更多' }}
                    <i :class="isDescriptionExpanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
                  </button>
                </div>

                <!-- Tags -->
                <div v-if="itemDetail.tags && itemDetail.tags.length > 0" class="tags-section">
                  <h4>標籤</h4>
                  <div class="tags">
                    <span v-for="tag in itemDetail.tags" :key="tag" class="tag">
                      {{ tag }}
                    </span>
                  </div>
                </div>

                <!-- Seller Info -->
                <!-- Location -->
                <div v-if="itemDetail.location" class="location-section">
                  <h4>物品位置</h4>
                  <p class="location-address">
                    <i class="bi bi-geo-alt-fill"></i>
                    {{ itemDetail.location.formatted_address || '位置資訊未提供' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeModal">關閉</button>
              <button v-if="!itemDetail.is_owner" class="btn-primary" @click="handleContact">
                私訊此商品
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Image Preview Modal -->
    <Transition name="preview-fade">
      <div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
        <!-- Close Button -->
        <button class="preview-close-btn" @click="closeImagePreview">
          <i class="bi bi-x-lg"></i>
        </button>

        <!-- Image Counter -->
        <div class="preview-counter">
          {{ previewImageIndex + 1 }} / {{ itemDetail.image_urls.length }}
        </div>

        <!-- Previous Button -->
        <button
          class="preview-nav-btn preview-prev-btn"
          @click.stop="previousPreviewImage"
          :disabled="previewImageIndex === 0"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <!-- Next Button -->
        <button
          class="preview-nav-btn preview-next-btn"
          @click.stop="nextPreviewImage"
          :disabled="previewImageIndex === itemDetail.image_urls.length - 1"
        >
          <i class="bi bi-chevron-right"></i>
        </button>

        <!-- Main Preview Image -->
        <div class="preview-image-container" @click.stop>
          <img
            :src="itemDetail.image_urls[previewImageIndex]"
            :alt="`圖片 ${previewImageIndex + 1}`"
            class="preview-image"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getItemDetails } from '@/api/get_ItemDetailAPI'
import { createOrGetConversation } from '@/api/conversation.js'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { followUser, unfollowUser, checkIsFollowing } from '@/api/followAPI'
import { formatPoints } from '@/utils/formatPoints'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  itemId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'contact-seller'])

// Composables
const router = useRouter()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()

const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const itemDetail = ref(null)
const currentImageIndex = ref(0)
const showImagePreview = ref(false)
const previewImageIndex = ref(0)
const isFavorite = ref(false)
const isProcessingFavorite = ref(false)
const isFollowing = ref(false)
const isProcessingFollow = ref(false)
const isDescriptionExpanded = ref(false)
const showDescriptionToggle = ref(false)

const sellerId = computed(() => itemDetail.value?.seller?.id || itemDetail.value?.user?.id || null)
const isOwner = computed(() => authStore.user && sellerId.value && authStore.user.id === sellerId.value)
const sellerName = computed(() => itemDetail.value?.seller?.nickname || itemDetail.value?.user?.nickname || '賣家')
const sellerAvatar = computed(() => itemDetail.value?.seller?.profile_picture_url || itemDetail.value?.user?.profile_picture_url || 'https://placehold.co/48/6fb8a5/ffffff?text=U')

function checkDescriptionLength() {
  const desc = itemDetail.value?.description || ''
  // Simple estimation: show toggle if text length > 100 chars or has > 3 newlines
  showDescriptionToggle.value = desc.length > 100 || (desc.match(/\n/g) || []).length > 2
  // If description is short, expand it by default to avoid hidden text
  if (!showDescriptionToggle.value) {
    isDescriptionExpanded.value = true
  }
}

// Load item details
async function loadItemDetails() {
  if (!props.itemId) return

  loading.value = true
  error.value = false
  errorMessage.value = ''
  itemDetail.value = null
  currentImageIndex.value = 0

  try {
    const response = await getItemDetails(props.itemId)

    if (response.success && response.data) {
      itemDetail.value = response.data
      // Ensure favorites are loaded to correctly check state
      if (authStore.user && favoritesStore.count === 0) {
        await favoritesStore.loadFavorites()
      }
      syncEngagementStates()
      
      // Double check follow status if user is logged in
      if (authStore.user && sellerId.value && !isOwner.value) {
        isFollowing.value = await checkIsFollowing(sellerId.value)
      }
      
      checkDescriptionLength()
    } else {
      error.value = true
      errorMessage.value = response.message || '無法載入物品詳情'
    }
  } catch (err) {
    console.error('[ItemDetailModal] Failed to load item details:', err)
    error.value = true
    errorMessage.value = '載入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

function syncEngagementStates() {
  if (!itemDetail.value) return
  // Check both the item detail's own property AND the store state
  isFavorite.value = !!itemDetail.value.favorited_at || favoritesStore.isFavorite(itemDetail.value.item_id || itemDetail.value.id)
  isFollowing.value = !!(itemDetail.value.seller?.followed_at || itemDetail.value.user?.followed_at)
}

// Image navigation
function previousImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

function nextImage() {
  if (itemDetail.value && currentImageIndex.value < itemDetail.value.image_urls.length - 1) {
    currentImageIndex.value++
  }
}

function selectImage(index) {
  currentImageIndex.value = index
}

// Image preview
function openImagePreview() {
  previewImageIndex.value = currentImageIndex.value
  showImagePreview.value = true
}

function closeImagePreview() {
  showImagePreview.value = false
}

function previousPreviewImage() {
  if (previewImageIndex.value > 0) {
    previewImageIndex.value--
  }
}

function nextPreviewImage() {
  if (itemDetail.value && previewImageIndex.value < itemDetail.value.image_urls.length - 1) {
    previewImageIndex.value++
  }
}

// Format price
function formatPrice(price) {
  if (price === null || price === undefined) return '點數未提供'
  return formatPoints(price)
}

// Format distance
function formatDistance(km) {
  if (km === null || km === undefined) return ''
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}

// Format date
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 週前`
  return date.toLocaleDateString('zh-TW')
}

// Get status class
function getStatusClass(status) {
  const statusMap = {
    'available': 'status-available',
    'sold': 'status-sold',
    'reserved': 'status-reserved',
    'unavailable': 'status-unavailable'
  }
  return statusMap[status] || ''
}

// Get status text
function getStatusText(status) {
  const statusMap = {
    'available': '可交易',
    'sold': '已售出',
    'reserved': '已保留',
    'unavailable': '不可用'
  }
  return statusMap[status] || status
}

// Close modal
function closeModal() {
  emit('update:modelValue', false)
}

function getFavoritePayload() {
  if (!itemDetail.value) return null
  return {
    ...itemDetail.value,
    item_id: itemDetail.value.item_id ?? itemDetail.value.id ?? props.itemId
  }
}

async function toggleFavorite() {
  if (isProcessingFavorite.value) return
  if (!authStore.user) {
    await authStore.signInWithGoogle()
    return
  }
  const payload = getFavoritePayload()
  if (!payload?.item_id) return
  isProcessingFavorite.value = true
  try {
    await favoritesStore.toggleFavorite(payload)
    // Re-sync local state from store after toggling
    isFavorite.value = favoritesStore.isFavorite(payload.item_id)
  } catch (error) {
    console.error('[ItemDetailModal] Failed to toggle favorite:', error)
    alert('收藏失敗，請稍後再試')
  } finally {
    isProcessingFavorite.value = false
  }
}

async function toggleFollow() {
  if (isProcessingFollow.value || !sellerId.value || isOwner.value) return
  if (!authStore.user) {
    await authStore.signInWithGoogle()
    return
  }
  isProcessingFollow.value = true
  try {
    if (isFollowing.value) {
      await unfollowUser(sellerId.value)
      isFollowing.value = false
    } else {
      await followUser(sellerId.value)
      isFollowing.value = true
    }
  } catch (error) {
    console.error('[ItemDetailModal] Failed to toggle follow:', error)
    alert('更新追蹤狀態失敗，請稍後再試')
  } finally {
    isProcessingFollow.value = false
  }
}

function toggleDescription() {
  isDescriptionExpanded.value = !isDescriptionExpanded.value
}

const goToItemDetail = () => {
  if (props.itemId) {
    router.push({ name: 'ItemDetail', params: { id: props.itemId } })
  }
}

const goToSellerProfile = () => {
  if (sellerId.value) {
    router.push({ name: 'PublicUserProfile', params: { id: sellerId.value } })
  }
}

// Handle contact seller
async function handleContact() {
  // Check if user is logged in
  if (!authStore.user) {
    alert('請先登入才能發送訊息')
    router.push('/login')
    return
  }

  // Check if item detail is loaded
  if (!itemDetail.value || !sellerId.value) {
    alert('商品資訊載入中，請稍候再試')
    return
  }

  // Don't allow messaging yourself
  if (sellerId.value === authStore.user.id) {
    alert('無法向自己發送訊息')
    return
  }

  try {
    console.log('[ItemDetailModal] Starting chat for item:', props.itemId)
    // Start or find conversation using V2 API
    const result = await createOrGetConversation(sellerId.value, props.itemId)
    console.log('[ItemDetailModal] Chat started, conversation ID:', result.conversation_id)

    // Close modal
    closeModal()

    // Navigate to messages page with query parameters
    router.push({
      path: '/messages',
      query: {
        conversationId: result.conversation_id,
        itemId: props.itemId,
        itemTitle: itemDetail.value?.title || ''
      }
    })
  } catch (error) {
    console.error('[ItemDetailModal] Failed to start chat:', error)
    alert('無法開始聊天,請稍後再試')
  }
}

// Watch for modal open/close and itemId changes
watch(() => [props.modelValue, props.itemId], ([isOpen, newItemId]) => {
  if (isOpen && newItemId) {
    loadItemDetails()
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 400px; // Narrower card as requested
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  i {
    font-size: 48px;
    color: #e0e0e0;
    margin-bottom: 16px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
    margin: 0;
  }

  .btn-retry {
    margin-top: 16px;
    padding: 8px 24px;
    background: $primary;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: darken($primary, 5%);
    }
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid $primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    i {
      font-size: 24px;
      color: #666;
    }

    &:hover {
      background: #f5f5f5;

      i {
        color: #1e1e1e;
      }
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  max-height: calc(90vh - 140px);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.image-gallery {
  width: 100%;
  background: #f5f5f5;

  .image-container {
    position: relative;
    width: 100%;
    height: 300px; // Fixed height to control size
    background: #f5f5f5;
    overflow: hidden;

    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover; // Fills the space, removing white bars
      background-color: #f9f9f9;
      cursor: pointer;
    }

    .favorite-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.85);
      color: #ff6f91;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        color: #ff4b6e;
        background: rgba(255, 255, 255, 0.95);
      }

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 10;

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.7);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      &.nav-prev {
        left: 12px;
      }

      &.nav-next {
        right: 12px;
      }
    }

    .image-counter {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      z-index: 10;
    }
  }

  .thumbnail-gallery {
    display: flex;
    gap: 8px;
    padding: 12px;
    overflow-x: auto;
    background: white;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
    }

    .thumbnail {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      border: 2px solid transparent;
      border-radius: 8px;
      overflow: hidden;
      background: #f5f5f5;
      cursor: pointer;
      transition: all 0.2s;
      padding: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.active {
        border-color: $primary;
      }

      &:hover {
        border-color: lighten($primary, 20%);
      }
    }
  }
}

.image-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 64px;
    color: #d0d0d0;
  }
}

  .item-info {
    padding: 20px;

    .item-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 12px 0;

      &.clickable {
        cursor: pointer;
        transition: color 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;

        i {
          font-size: 16px;
          color: #999;
          transition: color 0.2s;
        }

        &:hover {
          color: $primary;

          i {
            color: $primary;
          }
        }
      }
    }

  .item-price {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: $primary;
    margin: 0 0 20px 0;

    i {
      font-size: 20px;
    }
  }
}

  .seller-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;

    .seller-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;

      img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #f1f1f1;
      }

      .seller-text {
        display: flex;
        flex-direction: column;
        justify-content: center;

        .seller-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e1e1e;
          margin: 0;
        }
      }
    }

    .follow-icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid $primary;
      background: white;
      color: $primary;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        background: $primary;
        color: white;
      }

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

.meta-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #666;

    i {
      font-size: 14px;
      color: #999;
    }
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;

    &.status-available {
      background: rgba(111, 184, 165, 0.1);
      color: $primary;
    }

    &.status-sold {
      background: rgba(0, 0, 0, 0.05);
      color: #999;
    }

    &.status-reserved {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    &.status-unavailable {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
  }
}

.description-section,
.tags-section,
.seller-section,
.location-section {
  margin-bottom: 24px;

  h4 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 12px 0;
  }

    .description {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      white-space: pre-wrap;
      margin: 0 0 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: all 0.3s ease;

      &.expanded {
        -webkit-line-clamp: unset;
        overflow: visible;
      }
    }

    .toggle-description-btn {
      background: none;
      border: none;
      padding: 0;
      color: $primary;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      
      &:hover {
        text-decoration: underline;
      }

      i {
        font-size: 12px;
      }
    }
  }

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tag {
    padding: 6px 12px;
    background: #f5f5f5;
    border-radius: 16px;
    font-size: 12px;
    color: #666;
  }
}

.seller-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 12px;

  .seller-avatar {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    background: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    i {
      font-size: 32px;
      color: #999;
    }
  }

    .seller-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .seller-name {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0;
      }
    }
}

.location-address {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;

  i {
    font-size: 16px;
    color: $primary;
    margin-top: 2px;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  min-height: 76px;

  button {
    flex: 1;
    padding: 12px 24px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-secondary {
    background: #f5f5f5;
    color: #666;

    &:hover {
      background: #e0e0e0;
      color: #1e1e1e;
    }
  }

  .btn-primary {
    background: $primary;
    color: white;

    &:hover {
      background: darken($primary, 5%);
    }
  }
}

// Image Preview Modal
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;

  .preview-close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .preview-counter {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10;
  }

  .preview-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &.preview-prev-btn {
      left: 20px;
    }

    &.preview-next-btn {
      right: 20px;
    }
  }

  .preview-image-container {
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;

    .preview-image {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
    }
  }
}

// Modal Transitions
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
}

// Preview Modal Transitions
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.3s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

// Responsive
@media (max-width: 575.98px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-container {
    max-width: 100%;
    max-height: 85vh; // Slightly smaller on mobile
    border-radius: 16px 16px 0 0;
  }

  .modal-body {
    // Ensure proper scrolling on mobile
    max-height: calc(85vh - 130px); // Adjusted for header/footer
    overflow-y: auto;
  }

  .image-container {
     height: 280px; // Slightly smaller image on mobile
  }

  .item-info {
    padding: 20px;

    .item-title {
      font-size: 20px;
    }

    .item-price {
      font-size: 24px;
    }
  }

  // Limit description height on mobile
  .description-section {
    .description {
      max-height: 200px;
      overflow-y: auto;

      // Custom scrollbar for description
      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 2px;

        &:hover {
          background: #a8a8a8;
        }
      }
    }
  }

  .modal-fade-enter-from .modal-container,
  .modal-fade-leave-to .modal-container {
    transform: translateY(100%);
  }

  // Adjust image preview for mobile
  .image-preview-modal {
    .preview-close-btn {
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      font-size: 20px;
    }

    .preview-counter {
      top: 10px;
      font-size: 12px;
      padding: 6px 12px;
    }

    .preview-nav-btn {
      width: 48px;
      height: 48px;
      font-size: 24px;

      &.preview-prev-btn {
        left: 10px;
      }

      &.preview-next-btn {
        right: 10px;
      }
    }
  }
}
</style>