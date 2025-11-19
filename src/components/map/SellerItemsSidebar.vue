<template>
  <Transition name="sidebar-slide">
    <div v-if="show" class="seller-items-sidebar">
      <!-- Mobile drag handle -->
      <div class="mobile-drag-handle">
        <div class="drag-bar"></div>
      </div>

      <!-- Header -->
      <div class="sidebar-header">
        <div class="seller-info">
          <div class="seller-avatar">
            <img
              v-if="seller?.profile_picture_url"
              :src="seller.profile_picture_url"
              :alt="seller.nickname"
            />
            <i v-else class="bi bi-person-circle"></i>
          </div>
          <div class="seller-details">
            <h3 class="seller-name">{{ seller?.nickname || '賣家' }}</h3>
            <p class="items-count">{{ items.length }} 件物品</p>
          </div>
        </div>
        <button class="close-btn" @click="handleClose">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <!-- Items List -->
      <div class="sidebar-body">
        <div v-if="items.length === 0" class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>沒有物品</p>
        </div>

        <div v-else class="items-list">
          <div
            v-for="item in items"
            :key="item.item_id"
            class="item-card"
            @click="handleItemClick(item)"
          >
            <div class="item-image">
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.title"
              />
              <i v-else class="bi bi-box-seam"></i>
            </div>

            <div class="item-details">
              <h4 class="item-title">{{ item.title }}</h4>
              <p v-if="item.price" class="item-price">{{ formatPrice(item.price) }}</p>
              <div class="item-meta">
                <span v-if="item.distance_km !== undefined" class="distance">
                  <i class="bi bi-geo-alt"></i>
                  {{ formatDistance(item.distance_km) }}
                </span>
                <span v-if="item.favorited_at" class="favorited">
                  <i class="bi bi-heart-fill"></i>
                  已收藏
                </span>
              </div>
            </div>

            <div class="item-arrow">
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

const emit = defineEmits(['close', 'item-click'])

// Get seller info from first item
const seller = computed(() => {
  if (props.items.length === 0) return null
  return props.items[0].user
})

const currencyFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0
})

function formatPrice(price) {
  if (price === null || price === undefined) return ''
  return currencyFormatter.format(price)
}

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

function handleItemClick(item) {
  emit('item-click', item)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.seller-items-sidebar {
  position: fixed;
  left: 0;
  top: 60px; // Below header
  bottom: 0;
  width: 400px;
  background: white;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-drag-handle {
  display: none; // Hidden on desktop
  padding: 12px 0 8px;
  cursor: grab;

  .drag-bar {
    width: 40px;
    height: 4px;
    background: #d0d0d0;
    border-radius: 2px;
    margin: 0 auto;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;

  .seller-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .seller-avatar {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 50%;
      overflow: hidden;
      background: #f0f0f0;
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
      min-width: 0;

      .seller-name {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 18px;
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
        color: #999;
        margin: 0;
      }
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

.items-list {
  .item-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
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

    .item-image {
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      border-radius: 8px;
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
        font-size: 24px;
        color: #999;
      }
    }

    .item-details {
      flex: 1;
      min-width: 0;

      .item-title {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0 0 4px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-price {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: $primary;
        margin: 0 0 8px 0;
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;

        span {
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 4px;

          i {
            font-size: 12px;
          }
        }

        .favorited {
          color: #FF6B6B;

          i {
            color: #FF6B6B;
          }
        }
      }
    }

    .item-arrow {
      flex-shrink: 0;

      i {
        font-size: 18px;
        color: #999;
        transition: transform 0.2s;
      }
    }

    &:hover .item-arrow i {
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
  .seller-items-sidebar {
    width: 100%;
    max-width: 400px;
  }
}

@media (max-width: 575.98px) {
  .seller-items-sidebar {
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

  // Show drag handle on mobile
  .mobile-drag-handle {
    display: block;
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
    padding: 12px 16px;

    .seller-info {
      .seller-avatar {
        width: 40px;
        height: 40px;

        i {
          font-size: 28px;
        }
      }

      .seller-details {
        .seller-name {
          font-size: 16px;
        }

        .items-count {
          font-size: 13px;
        }
      }
    }
  }

  .items-list .item-card {
    padding: 10px;

    .item-image {
      width: 56px;
      height: 56px;

      i {
        font-size: 20px;
      }
    }

    .item-details {
      .item-title {
        font-size: 14px;
      }

      .item-price {
        font-size: 13px;
      }
    }
  }
}
</style>