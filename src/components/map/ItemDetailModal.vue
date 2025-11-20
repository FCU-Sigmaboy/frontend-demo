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
                <h2 class="item-title">{{ itemDetail.title }}</h2>
                <p class="item-price">{{ formatPrice(itemDetail.price) }}</p>

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
                  <p class="description">{{ itemDetail.description }}</p>
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
                <div v-if="itemDetail.seller" class="seller-section">
                  <h4>賣家資訊</h4>
                  <div class="seller-card">
                    <div class="seller-avatar">
                      <img
                        v-if="itemDetail.seller.profile_picture_url"
                        :src="itemDetail.seller.profile_picture_url"
                        :alt="itemDetail.seller.nickname"
                      />
                      <i v-else class="bi bi-person-circle"></i>
                    </div>
                    <div class="seller-details">
                      <p class="seller-name">{{ itemDetail.seller.nickname }}</p>
                      <p v-if="itemDetail.seller.trust_level" class="seller-trust">
                        信任等級: {{ itemDetail.seller.trust_level }}
                      </p>
                    </div>
                  </div>
                </div>

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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getItemDetails } from '@/api/get_ItemDetailAPI'
import { createOrGetConversation } from '@/api/conversation.js'
import { useAuthStore } from '@/stores/auth'

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

const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const itemDetail = ref(null)
const currentImageIndex = ref(0)
const showImagePreview = ref(false)
const previewImageIndex = ref(0)

const currencyFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0
})

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
  if (price === null || price === undefined) return '價格未提供'
  return currencyFormatter.format(price)
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

// Handle contact seller
async function handleContact() {
  // Check if user is logged in
  if (!authStore.user) {
    alert('請先登入才能發送訊息')
    router.push('/login')
    return
  }

  // Check if item detail is loaded
  if (!itemDetail.value || !itemDetail.value.user?.id) {
    alert('商品資訊載入中，請稍候再試')
    return
  }

  // Don't allow messaging yourself
  if (itemDetail.value.user.id === authStore.user.id) {
    alert('無法向自己發送訊息')
    return
  }

  try {
    console.log('[ItemDetailModal] Starting chat for item:', props.itemId)
    // Start or find conversation using V2 API
    const result = await createOrGetConversation(itemDetail.value.user.id, props.itemId)
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
  max-width: 600px;
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
    aspect-ratio: 4 / 3;
    background: #f5f5f5;
    overflow: hidden;

    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
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
  padding: 24px;

  .item-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 12px 0;
  }

  .item-price {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: $primary;
    margin: 0 0 20px 0;
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
    line-height: 1.6;
    white-space: pre-wrap;
    margin: 0;
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

    .seller-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 4px 0;
    }

    .seller-trust {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #999;
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
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
  }

  .modal-body {
    // Ensure proper scrolling on mobile
    max-height: calc(95vh - 140px); // Subtract header and footer height
    overflow-y: auto;
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