<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <!-- Modal Header -->
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="bi bi-grid-3x3-gap"></i>
              {{ userName }} 的刊登物品
            </h3>
            <button class="close-btn" @click="closeModal">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">載入中...</span>
              </div>
              <p class="loading-text">載入物品中...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="error-state">
              <i class="bi bi-exclamation-circle"></i>
              <p class="error-text">{{ error }}</p>
              <button class="retry-btn" @click="loadItems">重新載入</button>
            </div>

            <!-- Empty State -->
            <div v-else-if="items.length === 0" class="empty-state">
              <i class="bi bi-box-seam"></i>
              <p class="empty-text">尚無刊登物品</p>
            </div>

            <!-- Items List -->
            <div v-else class="items-list">
              <div
                v-for="item in items"
                :key="item.item_id"
                class="item-card"
              >
                <div class="item-image" @click="goToItemDetail(item.item_id)">
                  <img
                    :src="item.image_url"
                    :alt="item.title"
                  />
                </div>
                <div class="item-details">
                  <h4 class="item-title" @click="goToItemDetail(item.item_id)">
                    {{ item.title }}
                  </h4>
                  <div class="item-price">
                    <i class="bi bi-leaf"></i>
                    <span>{{ formatPrice(item.price) }}</span>
                  </div>
                </div>
                <button class="dm-btn" @click="handleDMClick(item)">
                  <i class="bi bi-chat-dots"></i>
                  <span class="dm-text">私訊</span>
                </button>
              </div>
            </div>

            <!-- Load More Button -->
            <div v-if="!isLoading && items.length > 0 && hasMore" class="load-more-container">
              <button
                class="load-more-btn"
                :disabled="isLoadingMore"
                @click="loadMoreItems"
              >
                <span v-if="isLoadingMore" class="spinner-border spinner-border-sm" role="status"></span>
                <span>{{ isLoadingMore ? '載入中...' : '載入更多' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { searchItems } from '@/api/itemsAPI';

const router = useRouter();

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: '使用者'
  }
});

const emit = defineEmits(['update:modelValue', 'dm-item']);

const items = ref([]);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const error = ref(null);
const currentPage = ref(1);
const hasMore = ref(true);
const pageSize = 12;

const formatPrice = (price) => {
  return new Intl.NumberFormat().format(price);
};

const closeModal = () => {
  emit('update:modelValue', false);
};

const goToItemDetail = (itemId) => {
  closeModal();
  router.push({ name: 'ItemDetail', params: { id: itemId } });
};

const handleDMClick = (item) => {
  emit('dm-item', item);
};

const loadItems = async () => {
  if (!props.userId) return;

  try {
    isLoading.value = true;
    error.value = null;
    currentPage.value = 1;

    const result = await searchItems({
      user_id: props.userId,
      page: 1,
      size: pageSize,
      sort_by: 'created_at',
      sort_direction: 'desc'
    });

    items.value = result || [];
    hasMore.value = result && result.length >= pageSize;
  } catch (err) {
    console.error('Failed to load user items:', err);
    error.value = '載入物品失敗，請稍後再試';
    items.value = [];
  } finally {
    isLoading.value = false;
  }
};

const loadMoreItems = async () => {
  if (!props.userId || isLoadingMore.value) return;

  try {
    isLoadingMore.value = true;
    currentPage.value += 1;

    const result = await searchItems({
      user_id: props.userId,
      page: currentPage.value,
      size: pageSize,
      sort_by: 'created_at',
      sort_direction: 'desc'
    });

    if (result && result.length > 0) {
      items.value = [...items.value, ...result];
      hasMore.value = result.length >= pageSize;
    } else {
      hasMore.value = false;
    }
  } catch (err) {
    console.error('Failed to load more items:', err);
  } finally {
    isLoadingMore.value = false;
  }
};

// Watch for modal open/close
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadItems();
  }
});
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
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    color: $primary;
    font-size: 22px;
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-state {
  .spinner-border {
    width: 40px;
    height: 40px;
    border-color: $primary;
    border-right-color: transparent;
  }

  .loading-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    margin-top: 16px;
  }
}

.error-state {
  i {
    font-size: 48px;
    color: #ff6b6b;
    margin-bottom: 16px;
  }

  .error-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    margin: 0 0 20px 0;
  }

  .retry-btn {
    padding: 10px 24px;
    background: $primary;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: darken($primary, 10%);
    }
  }
}

.empty-state {
  i {
    font-size: 64px;
    color: #e0e0e0;
    margin-bottom: 16px;
  }

  .empty-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #999;
    margin: 0;
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    border-color: rgba($primary, 0.3);
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
    cursor: pointer;
    transition: all 0.2s;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  .item-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .item-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: $primary;
      }
    }

    .item-price {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #1e1e1e;

      i {
        font-size: 14px;
        color: $primary;
      }
    }
  }

  .dm-btn {
    flex-shrink: 0;
    padding: 8px 16px;
    background: $primary;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;

    i {
      font-size: 14px;
    }

    &:hover {
      background: darken($primary, 8%);
      transform: translateY(-1px);
    }
  }
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.load-more-btn {
  padding: 10px 32px;
  background: transparent;
  color: $primary;
  border: 1px solid $primary;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: $primary;
    color: white;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .spinner-border {
    border-color: $primary;
    border-right-color: transparent;
  }
}

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

@media (max-width: 991.98px) {
  .item-card {
    .item-image {
      width: 60px;
      height: 60px;
    }

    .dm-btn {
      padding: 8px 12px;
      font-size: 12px;
    }
  }
}

@media (max-width: 575.98px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-container {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
  }

  .modal-header {
    padding: 16px 20px;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }

  .modal-title {
    font-size: 18px;

    i {
      font-size: 20px;
    }
  }

  .modal-body {
    padding: 16px;
  }

  .item-card {
    padding: 10px;
    gap: 10px;

    .item-image {
      width: 56px;
      height: 56px;
    }

    .item-details {
      .item-title {
        font-size: 14px;
      }

      .item-price {
        font-size: 14px;

        i {
          font-size: 13px;
        }
      }
    }

    .dm-btn {
      padding: 6px 10px;
      font-size: 12px;

      .dm-text {
        display: none;
      }

      i {
        font-size: 16px;
      }
    }
  }

  .modal-fade-enter-from .modal-container,
  .modal-fade-leave-to .modal-container {
    transform: translateY(100%);
  }
}
</style>
