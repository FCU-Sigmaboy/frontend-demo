<template>
  <Transition name="sidebar-slide">
    <div v-if="show" class="seller-list-sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="header-info">
          <h3 class="header-title">搜尋結果</h3>
          <p class="seller-count">找到 {{ sellers.length }} 位賣家</p>
        </div>
        <button class="close-btn" @click="handleClose">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <!-- Sellers List -->
      <div class="sidebar-body">
        <div v-if="sellers.length === 0" class="empty-state">
          <i class="bi bi-search"></i>
          <p>沒有找到賣家</p>
        </div>

        <div v-else class="sellers-list">
          <div
            v-for="seller in sellers"
            :key="seller.user_id"
            class="seller-card"
            @click="handleSellerClick(seller)"
          >
            <div class="seller-avatar">
              <img
                v-if="seller.profile_picture_url"
                :src="seller.profile_picture_url"
                :alt="seller.nickname"
              />
              <i v-else class="bi bi-person-circle"></i>
            </div>

            <div class="seller-details">
              <h4 class="seller-name">{{ seller.nickname || '賣家' }}</h4>
              <p class="items-count">{{ seller.item_count }} 件物品</p>
              <div v-if="seller.min_distance !== undefined" class="seller-distance">
                <i class="bi bi-geo-alt"></i>
                {{ formatDistance(seller.min_distance) }}
              </div>
            </div>

            <div class="seller-arrow">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'seller-click'])

// Group items by seller
const sellers = computed(() => {
  const sellerMap = new Map()

  props.items.forEach(item => {
    const userId = item.user?.user_id || item.user?.id
    if (!userId) return

    if (!sellerMap.has(userId)) {
      sellerMap.set(userId, {
        user_id: userId,
        nickname: item.user?.nickname,
        profile_picture_url: item.user?.profile_picture_url,
        items: [],
        item_count: 0,
        min_distance: item.distance_km
      })
    }

    const seller = sellerMap.get(userId)
    seller.items.push(item)
    seller.item_count++

    // Update minimum distance
    if (item.distance_km !== undefined && item.distance_km !== null) {
      if (seller.min_distance === undefined || item.distance_km < seller.min_distance) {
        seller.min_distance = item.distance_km
      }
    }
  })

  // Convert map to array and sort by distance
  return Array.from(sellerMap.values()).sort((a, b) => {
    if (a.min_distance === undefined) return 1
    if (b.min_distance === undefined) return -1
    return a.min_distance - b.min_distance
  })
})

function formatDistance(km) {
  if (km === null || km === undefined) return ''
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}

function handleClose() {
  emit('close')
}

function handleSellerClick(seller) {
  emit('seller-click', seller)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.seller-list-sidebar {
  position: fixed;
  left: 0;
  top: 60px; // Below header
  bottom: 0;
  width: 350px;
  background: white;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;

  .header-info {
    flex: 1;
    min-width: 0;

    .header-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 4px 0;
    }

    .seller-count {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      margin: 0;
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
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

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  // Custom scrollbar
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

.empty-state {
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
}

.sellers-list {
  .seller-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f9f9f9;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f0f0f0;
      border-color: $primary;
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

    .seller-details {
      flex: 1;
      min-width: 0;

      .seller-name {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0 0 4px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .items-count {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #666;
        margin: 0 0 4px 0;
      }

      .seller-distance {
        font-size: 12px;
        color: #999;
        display: flex;
        align-items: center;
        gap: 4px;

        i {
          font-size: 12px;
        }
      }
    }

    .seller-arrow {
      flex-shrink: 0;

      i {
        font-size: 18px;
        color: #999;
        transition: transform 0.2s;
      }
    }

    &:hover .seller-arrow i {
      transform: translateX(4px);
    }
  }
}

// Sidebar slide animation - Desktop
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
}

// Responsive
@media (max-width: 767.98px) {
  .seller-list-sidebar {
    width: 100%;
    max-width: 350px;
  }
}

@media (max-width: 575.98px) {
  .seller-list-sidebar {
    top: auto; // Remove top positioning
    bottom: 0; // Position at bottom
    left: 0;
    right: 0;
    width: 100%;
    max-width: none;
    max-height: 70vh; // Limit height on mobile
    border-radius: 20px 20px 0 0; // Rounded top corners
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }

  // Mobile slide animation - from bottom
  .sidebar-slide-enter-from,
  .sidebar-slide-leave-to {
    transform: translateY(100%);
  }

  .sidebar-slide-enter-to,
  .sidebar-slide-leave-from {
    transform: translateY(0);
  }

  .sidebar-header {
    padding: 16px;

    .header-info {
      .header-title {
        font-size: 16px;
      }

      .seller-count {
        font-size: 13px;
      }
    }
  }

  .sellers-list .seller-card {
    padding: 12px;

    .seller-avatar {
      width: 48px;
      height: 48px;

      i {
        font-size: 32px;
      }
    }

    .seller-details {
      .seller-name {
        font-size: 15px;
      }

      .items-count {
        font-size: 13px;
      }
    }
  }
}
</style>