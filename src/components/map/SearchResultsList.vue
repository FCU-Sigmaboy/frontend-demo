<template>
  <!-- Backdrop for mobile (only show when results are visible) -->
  <Transition name="backdrop-fade">
    <div v-if="show && sellers.length > 0" class="search-results-backdrop" @click="$emit('toggle-view')"></div>
  </Transition>

  <!-- Results List -->
  <Transition name="slide-up">
    <div v-if="show || sellers.length > 0" class="search-results-list" :class="{ 'has-results': sellers.length > 0, 'collapsed': !show }">
      <!-- Drag handle for mobile -->
      <div class="drag-handle" @click="$emit('toggle-view')">
        <div class="handle-bar"></div>
      </div>

      <div class="results-header">
        <div class="results-count">
          <span class="count-label">結果</span>
          <span class="count-number">{{ sellers.length }}</span>
        </div>
        <button class="collapse-btn" @click="$emit('toggle-view')">
          <i :class="show ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
        </button>
      </div>

    <!-- Sub-category Filter Tabs -->
    <div v-if="subCategoryFilters && subCategoryFilters.length > 0" v-show="show" class="sub-category-filters">
      <FilterTabs
        :items="items"
        :filters="subCategoryFilters"
        @update:filteredItems="$emit('sub-category-filter')"
      />
    </div>

    <div v-show="show" class="results-content">
      <div v-if="sellers.length === 0" class="no-results">
        <i class="bi bi-search"></i>
        <p>沒有找到相關結果</p>
      </div>

      <!-- Seller Group -->
      <div
        v-for="seller in sellers"
        :key="seller.user_id"
        :data-seller-id="seller.user_id"
        class="seller-group"
      >
        <!-- Seller Header -->
        <div class="seller-header" @click="toggleSellerItems(seller)">
          <!-- Seller Avatar -->
          <div class="seller-avatar">
            <img
              v-if="seller.profile_picture_url"
              :src="seller.profile_picture_url"
              :alt="seller.name"
            />
            <i v-else class="bi bi-person-circle"></i>
          </div>

          <div class="seller-info">
            <h3 class="seller-name">{{ seller.name }}</h3>
            <div class="seller-meta">
              <span class="seller-rating">
                <i class="bi bi-star-fill"></i>
                {{ seller.averageRating }}
                <span class="review-count">({{ seller.totalReviews }})</span>
              </span>
              <span class="seller-price-range">{{ seller.priceRange }}</span>
              <span class="seller-item-count">{{ seller.itemCount }} 項物品</span>
            </div>
          </div>
          <i :class="isSellerExpanded(seller.user_id) ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
        </div>

        <!-- Seller Items -->
        <div v-show="isSellerExpanded(seller.user_id)" class="seller-items">
          <div
            v-for="item in seller.items"
            :key="item.item_id"
            class="item-card"
            @click.stop="handleItemClick(item)"
          >
            <div v-if="item.image_url" class="item-image">
              <img :src="item.image_url" :alt="item.title" />
            </div>
            <div class="item-info">
              <h4 class="item-title">{{ item.title }}</h4>
              <div class="item-price">${{ item.price }}點</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import FilterTabs from '@/components/FilterTabs.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  },
  subCategoryFilters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'item-click', 'toggle-view', 'sub-category-filter'])

// Track which sellers are expanded (all expanded by default)
const expandedSellers = ref(new Set())

// Group items by seller and calculate seller statistics
const sellers = computed(() => {
  if (!props.items || props.items.length === 0) return []

  // Group items by user_id (same as SellerListSidebar)
  const sellerMap = new Map()

  props.items.forEach(item => {
    // Use user.user_id or user.id to group sellers
    const userId = item.user?.user_id || item.user?.id
    if (!userId) {
      return
    }

    if (!sellerMap.has(userId)) {
      sellerMap.set(userId, {
        user_id: userId,
        name: item.user?.nickname || '賣家',
        profile_picture_url: item.user?.profile_picture_url || null,
        items: [],
        location: item.formatted_address || item.location_name || '',
        phone: item.user?.phone || '',
        mainCategory: item.main_category_name || '',
        isOpen: item.is_available !== false,
        closingTime: item.closing_time || '01:00',
        distance_km: item.distance_km
      })
    }

    const seller = sellerMap.get(userId)
    seller.items.push(item)

    // Update minimum distance
    if (item.distance_km !== undefined && item.distance_km !== null) {
      if (seller.distance_km === undefined || item.distance_km < seller.distance_km) {
        seller.distance_km = item.distance_km
      }
    }
  })

  // Calculate statistics for each seller
  const result = Array.from(sellerMap.values()).map(seller => {
    const items = seller.items

    // Calculate price range
    const prices = items
      .map(item => item.price || 0)
      .filter(price => price > 0)

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    const priceRange = prices.length > 0
      ? `$${minPrice}-${maxPrice}點`
      : '$0-2000點'

    // Get average rating from user data (backend provides this)
    const averageRating = seller.items[0]?.user?.avg_rating || 0
    const ratingCount = seller.items[0]?.user?.rating_count || 0

    // Format rating display
    const displayRating = averageRating > 0 ? averageRating.toFixed(1) : '無評分'
    const totalReviews = ratingCount

    return {
      ...seller,
      priceRange,
      averageRating: displayRating,
      totalReviews,
      itemCount: items.length
    }
  })

  // Sort by distance
  const sorted = result.sort((a, b) => {
    if (a.distance_km === undefined) return 1
    if (b.distance_km === undefined) return -1
    return a.distance_km - b.distance_km
  })

  // Initialize all sellers as expanded
  sorted.forEach(seller => {
    if (!expandedSellers.value.has(seller.user_id)) {
      expandedSellers.value.add(seller.user_id)
    }
  })

  return sorted
})

// Format distance helper
function formatDistance(km) {
  if (km === null || km === undefined) return ''
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}

// Toggle seller items visibility
function toggleSellerItems(seller) {
  if (expandedSellers.value.has(seller.user_id)) {
    expandedSellers.value.delete(seller.user_id)
  } else {
    expandedSellers.value.add(seller.user_id)
  }
  // Trigger reactivity
  expandedSellers.value = new Set(expandedSellers.value)
}

// Check if seller is expanded
function isSellerExpanded(sellerId) {
  return expandedSellers.value.has(sellerId)
}

function handleItemClick(item) {
  // Emit item click event to parent
  emit('item-click', item)
}

// Scroll to specific seller and expand it
function scrollToSeller(userId) {
  // Make sure the seller is expanded
  if (!expandedSellers.value.has(userId)) {
    expandedSellers.value.add(userId)
    expandedSellers.value = new Set(expandedSellers.value)
  }

  // Wait for DOM update, then scroll
  nextTick(() => {
    const sellerElement = document.querySelector(`.seller-group[data-seller-id="${userId}"]`)
    if (sellerElement) {
      sellerElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })

      // Add highlight effect
      const header = sellerElement.querySelector('.seller-header')
      if (header) {
        header.classList.add('highlight')
        setTimeout(() => {
          header.classList.remove('highlight')
        }, 2000)
      }
    }
  })
}

// Expose method to parent
defineExpose({
  scrollToSeller
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.search-results-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.10);
  overflow: hidden;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  pointer-events: auto; // Allow interaction with this element
  transition: max-height 0.3s ease;

  &.collapsed {
    max-height: auto;
  }
}

// Drag handle (hidden on desktop, visible on mobile)
.drag-handle {
  display: none;
  padding: 12px 0;
  cursor: pointer;
  background: white;
  border-radius: 16px 16px 0 0;
  flex-shrink: 0;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.7;
  }

  .handle-bar {
    width: 40px;
    height: 4px;
    background: #999;
    border-radius: 2px;
    margin: 0 auto;
  }
}

.sub-category-filters {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;

  // 隱藏滾動條
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.filter-tabs-wrapper) {
    padding: 0;
    max-width: 100%;
  }

  :deep(.filter-tabs) {
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 8px;

    // 隱藏滾動條
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  :deep(.filter-tab) {
    flex-shrink: 0;
  }
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;

  .results-count {
    display: flex;
    align-items: center;
    gap: 8px;

    .count-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1e1e1e;
    }

    .count-number {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
    }
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;

    i {
      font-size: 24px;
      color: #666;
    }

    &:hover {
      background: #f5f5f5;
    }
  }
}

.results-content {
  flex: 1;
  overflow-y: auto;

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 4px;

    &:hover {
      background: #b0b0b0;
    }
  }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #999;

  i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    margin: 0;
  }
}

// Seller Group Styles
.seller-group {
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }
}

.seller-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.3s;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;

  &:hover {
    background: #f0f0f0;
  }

  &.highlight {
    background: #e3f2fd;
    animation: highlightPulse 2s ease-in-out;
  }

  .seller-avatar {
    width: 56px;
    height: 56px;
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
      font-size: 36px;
      color: #999;
    }
  }

  .seller-info {
    flex: 1;
    min-width: 0;

    .seller-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 8px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .seller-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .seller-rating {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: #1e1e1e;

        i {
          color: #ffc107;
          font-size: 14px;
        }

        .review-count {
          color: #666;
          font-size: 13px;
        }
      }

      .seller-price-range {
        font-size: 14px;
        color: #666;

        &::before {
          content: '·';
          margin-right: 8px;
          color: #999;
        }
      }

      .seller-item-count {
        font-size: 14px;
        color: #666;

        &::before {
          content: '·';
          margin-right: 8px;
          color: #999;
        }
      }
    }
  }

  > i {
    font-size: 20px;
    color: #999;
    flex-shrink: 0;
    transition: transform 0.2s;
  }
}

.seller-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 16px;
  background: white;
}

.item-card {
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: $primary;
  }

  .item-image {
    width: 100%;
    height: 120px;
    overflow: hidden;
    background: #e0e0e0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .item-info {
    padding: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .item-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
      min-height: 2.8em;
    }

    .item-price {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: $primary;
      margin: 0;
    }
  }
}

.results-footer {
  padding: 12px 20px;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;

  .view-on-map-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.2s;

    i {
      font-size: 18px;
      color: #1e1e1e;
    }

    span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
    }

    &:hover {
      background: #f5f5f5;
      border-color: rgba(0, 0, 0, 0.12);
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

// Mobile backdrop
.search-results-backdrop {
  display: none;
}

// Transition animations
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(0);
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

@media (max-width: 767.98px) {
  // Backdrop overlay for mobile
  .search-results-backdrop {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1999;
    pointer-events: auto;
  }

  .search-results-list {
    // Mobile: fixed position from bottom
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
    border-radius: 16px 16px 0 0;
    z-index: 2000;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);

    &.collapsed {
      transform: translateY(100%);
    }
  }

  // Show drag handle on mobile
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 16px 16px 0 0;
  }

  // Slide up transition for mobile
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(100%);
  }

  .slide-up-enter-to,
  .slide-up-leave-from {
    transform: translateY(0);
  }

  .seller-header {
    padding: 12px 16px;
    gap: 10px;

    .seller-avatar {
      width: 48px;
      height: 48px;

      i {
        font-size: 32px;
      }
    }

    .seller-info {
      .seller-name {
        font-size: 15px;
      }

      .seller-meta {
        gap: 6px;

        .seller-rating {
          font-size: 13px;

          i {
            font-size: 13px;
          }

          .review-count {
            font-size: 12px;
          }
        }

        .seller-price-range {
          font-size: 13px;
        }

        .seller-item-count {
          font-size: 13px;
        }
      }
    }

    > i {
      font-size: 18px;
    }
  }

  .seller-items {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    padding: 12px;
  }

  .item-card {
    .item-image {
      height: 100px;
    }

    .item-info {
      padding: 10px;

      .item-title {
        font-size: 13px;
      }

      .item-price {
        font-size: 14px;
      }
    }
  }
}

// Highlight animation
@keyframes highlightPulse {
  0% {
    background: #e3f2fd;
  }
  50% {
    background: #bbdefb;
  }
  100% {
    background: #f9f9f9;
  }
}
</style>