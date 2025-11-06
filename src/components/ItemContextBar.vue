<template>
  <div v-if="items && items.length > 0" class="item-context-bar" :class="{ collapsed: isCollapsed }">
    <div class="context-header">
      <div class="header-left">
        <i class="bi bi-box-seam me-2"></i>
        <span class="header-title">討論中的物品 ({{ items.length }})</span>
      </div>
      <button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展開' : '收合'">
        <i :class="isCollapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
      </button>
    </div>

    <div v-if="!isCollapsed" class="items-container">
      <div class="items-scroll">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-card"
          @click="handleItemClick(item)"
        >
          <div class="item-image-wrapper">
            <img
              :src="item.cover_image_url || 'https://placehold.co/80x80/e0e0e0/666?text=No+Image'"
              :alt="item.title"
              class="item-image"
            />
            <span v-if="item.listing_status === 'sold'" class="status-badge sold">已售出</span>
            <span v-else-if="item.listing_status === 'inactive' || item.listing_status === 'deleted'" class="status-badge inactive">已下架</span>
          </div>
          <div class="item-info">
            <p class="item-title">{{ item.title }}</p>
            <p v-if="item.price !== undefined" class="item-price">NT$ {{ item.price }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['item-click'])

const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function handleItemClick(item) {
  emit('item-click', item)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.item-context-bar {
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;

  &.collapsed {
    .items-container {
      display: none;
    }
  }
}

.context-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;

  .header-left {
    display: flex;
    align-items: center;

    i {
      color: $primary;
      font-size: 16px;
    }

    .header-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
    }
  }

  .collapse-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 14px;
      color: #666;
    }

    &:hover {
      background: #f5f5f5;
    }
  }
}

.items-container {
  padding: 12px 24px;
}

.items-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;

    &:hover {
      background: #999;
    }
  }
}

.item-card {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  max-width: 120px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: $primary;
    box-shadow: 0 2px 8px rgba(111, 184, 165, 0.2);
    transform: translateY(-2px);
  }
}

.item-image-wrapper {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: #f5f5f5;

  .item-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .status-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: white;

    &.sold {
      background: #e74c3c;
    }

    &.inactive {
      background: #95a5a6;
    }
  }
}

.item-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;

  .item-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #1e1e1e;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
    line-height: 1.4;
  }

  .item-price {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: $primary;
    margin: 0;
  }
}

// Responsive
@media (max-width: 575.98px) {
  .context-header {
    padding: 10px 16px;
  }

  .items-container {
    padding: 10px 16px;
  }

  .item-card {
    min-width: 100px;
    max-width: 100px;
  }

  .item-image-wrapper {
    height: 100px;
  }
}
</style>

