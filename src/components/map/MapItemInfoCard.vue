<template>
  <Teleport to="body">
    <div
      v-if="show && item"
      class="item-info-card-wrapper"
      :class="{ 'card-visible': show }"
    >
      <!-- Backdrop -->
      <div class="card-backdrop" @click="handleClose"></div>

      <!-- Card content -->
      <div class="item-info-card" :class="{ 'card-mobile': isMobile }">
        <!-- Close button -->
        <button
          class="btn-close"
          @click="handleClose"
          aria-label="關閉"
        ></button>

        <!-- Item image -->
        <div class="card-image">
          <img
            :src="item.image_url || '/placeholder-image.jpg'"
            :alt="item.title"
            @error="handleImageError"
          >
          <!-- Favorite button overlay -->
          <button
            class="btn-favorite"
            :class="{ 'is-favorited': item.favorited_at }"
            @click="toggleFavorite"
            aria-label="加入收藏"
          >
            <i class="bi" :class="item.favorited_at ? 'bi-heart-fill' : 'bi-heart'"></i>
          </button>
        </div>

        <!-- Card body -->
        <div class="card-body">
          <!-- Title -->
          <h5 class="card-title">{{ item.title }}</h5>

          <!-- Price -->
          <div class="card-price">
            <strong>NT$ {{ formatPrice(item.price) }}</strong>
          </div>

          <!-- Distance -->
          <div class="card-distance">
            <i class="bi bi-geo-alt me-1"></i>
            {{ formatDistance(item.distance_km) }}
          </div>

          <!-- Seller info -->
          <div class="card-seller">
            <img
              :src="item.user?.profile_picture_url || '/default-avatar.png'"
              :alt="item.user?.nickname || '賣家'"
              class="seller-avatar"
              @error="handleAvatarError"
            >
            <div class="seller-info">
              <div class="seller-name">{{ item.user?.nickname || '匿名賣家' }}</div>
              <div class="seller-stats text-muted">
                <i class="bi bi-heart me-1"></i>
                {{ item.favorites_count || 0 }} 人收藏
              </div>
            </div>
          </div>

          <!-- View details button -->
          <button
            class="btn btn-primary w-100"
            @click="viewDetails"
          >
            查看詳情
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/favorites'

// Props
const props = defineProps({
  item: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'favorite-toggle'])

// Composables
const router = useRouter()
const favoritesStore = useFavoritesStore()

// Computed
const isMobile = computed(() => window.innerWidth < 768)

// Methods
function handleClose() {
  emit('close')
}

function formatPrice(price) {
  return Math.floor(price).toLocaleString()
}

function formatDistance(distanceKm) {
  const distance = parseFloat(distanceKm)
  if (distance < 1) {
    return `${Math.round(distance * 1000)} 公尺`
  }
  return `${distance.toFixed(1)} 公里`
}

async function toggleFavorite() {
  if (!props.item) return

  try {
    await favoritesStore.toggleFavorite(props.item)
    emit('favorite-toggle', props.item)
  } catch (error) {
    console.error('[MapItemInfoCard] Failed to toggle favorite:', error)
  }
}

function viewDetails() {
  if (!props.item) return
  router.push(`/items/${props.item.item_id}`)
}

function handleImageError(event) {
  event.target.src = '/placeholder-image.jpg'
}

function handleAvatarError(event) {
  event.target.src = '/default-avatar.png'
}

// Handle escape key
function handleEscapeKey(event) {
  if (event.key === 'Escape' && props.show) {
    handleClose()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.item-info-card-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &.card-visible {
    opacity: 1;
    pointer-events: all;
  }
}

.card-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.item-info-card {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  z-index: 2;
  transform: translateY(20px);
  transition: transform 0.3s ease;

  .card-visible & {
    transform: translateY(0);
  }

  // Mobile bottom sheet style
  &.card-mobile {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: none;
    border-radius: 20px 20px 0 0;
    transform: translateY(100%);

    .card-visible & {
      transform: translateY(0);
    }
  }
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  background: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  opacity: 0.9;

  &:hover {
    opacity: 1;
  }
}

.card-image {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.btn-favorite {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  cursor: pointer;

  i {
    font-size: 1.5rem;
    color: #999;
  }

  &.is-favorited i {
    color: #FF6B6B;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-price {
  font-size: 1.5rem;
  color: $primary;
  margin-bottom: 0.5rem;

  strong {
    font-weight: 700;
  }
}

.card-distance {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;

  i {
    color: $primary;
  }
}

.card-seller {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.seller-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.seller-info {
  flex: 1;
}

.seller-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.seller-stats {
  font-size: 0.85rem;

  i {
    color: #FF6B6B;
  }
}

// Responsive
@media (max-width: 575.98px) {
  .card-image {
    height: 200px;
  }

  .card-body {
    padding: 1rem;
  }

  .card-price {
    font-size: 1.3rem;
  }
}
</style>