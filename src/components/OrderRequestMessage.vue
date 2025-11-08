<template>
  <div :class="['order-request-message', statusClass]">
    <div class="order-header">
      <div class="order-icon">
        <i class="bi bi-file-earmark-text-fill"></i>
      </div>
      <h4 class="order-title">訂單請求</h4>
    </div>

    <div class="order-body">
      <div class="order-item-preview">
        <img
          v-if="orderRequest.item?.image"
          :src="orderRequest.item.image"
          :alt="orderRequest.item.title"
          class="item-thumbnail"
        />
        <div class="item-info">
          <h5 class="item-title">{{ orderRequest.item?.title || '物品' }}</h5>
          <p class="item-location">
            <i class="bi bi-geo-alt"></i>
            {{ orderRequest.item?.location || '面交' }}
          </p>
        </div>
      </div>

      <div class="order-details">
        <div class="detail-row">
          <span class="detail-label">議定價格</span>
          <span class="detail-value">{{ orderRequest.agreed_price }}P</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">取貨方式</span>
          <span class="detail-value">{{ orderRequest.delivery_method || '面交' }}</span>
        </div>
      </div>

      <div v-if="orderRequest.status === 'accepted'" class="order-status-message success">
        <i class="bi bi-check-circle-fill"></i>
        <span>訂單已接受，請前往交易確認頁面</span>
      </div>

      <div v-if="orderRequest.status === 'declined'" class="order-status-message declined">
        <i class="bi bi-x-circle-fill"></i>
        <span>訂單已拒絕</span>
      </div>
    </div>

    <!-- Action buttons (only show if pending and user is seller) -->
    <div v-if="showActions" class="order-actions">
      <button
        class="order-action-btn accept"
        @click="handleAccept"
      >
        <i class="bi bi-check-lg"></i>
        接受訂單
      </button>
      <button
        class="order-action-btn decline"
        @click="handleDecline"
      >
        <i class="bi bi-x-lg"></i>
        拒絕
      </button>
    </div>

    <!-- View Details button (only show if accepted) -->
    <div v-if="orderRequest.status === 'accepted'" class="order-footer">
      <button
        class="view-details-btn"
        @click="handleViewDetails"
      >
        前往確認交易
        <i class="bi bi-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  orderRequest: {
    type: Object,
    required: true
    // Expected structure:
    // {
    //   id: string,
    //   conversation_id: string,
    //   item: {
    //     id: string,
    //     title: string,
    //     image: string,
    //     location?: string
    //   },
    //   agreed_price: number,
    //   delivery_method?: string,
    //   status: 'pending' | 'accepted' | 'declined',
    //   created_at: string
    // }
  },
  currentUserId: {
    type: String,
    required: true
  },
  sellerId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['accept', 'decline', 'view-details']);

// Computed
const isSeller = computed(() => String(props.currentUserId) === String(props.sellerId));

const statusClass = computed(() => {
  return `status-${props.orderRequest.status}`;
});

// Show actions only if order is pending and user is seller
const showActions = computed(() => {
  return props.orderRequest.status === 'pending' && isSeller.value;
});

// Methods
function handleAccept() {
  emit('accept', props.orderRequest);
}

function handleDecline() {
  emit('decline', props.orderRequest);
}

function handleViewDetails() {
  emit('view-details', props.orderRequest);
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.order-request-message {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  margin: 8px 0;
  background: #f3e5f5;
  border-left: 4px solid #9c27b0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 450px;
  transition: all 0.3s;

  &.status-accepted {
    background: #e8f5e9;
    border-left-color: #4caf50;
  }

  &.status-declined {
    background: #fafafa;
    border-left-color: #9e9e9e;
    opacity: 0.7;
  }
}

.order-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .order-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);

    i {
      font-size: 20px;
      color: #9c27b0;
    }

    .status-accepted & i {
      color: #4caf50;
    }

    .status-declined & i {
      color: #9e9e9e;
    }
  }

  .order-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }
}

.order-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-item-preview {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;

  .item-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .item-info {
    flex: 1;
    min-width: 0;

    .item-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 6px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-location {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #666;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;

      i {
        font-size: 12px;
      }
    }
  }
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .detail-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #555;
    font-weight: 400;
  }

  .detail-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #1e1e1e;
  }
}

.order-status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  font-weight: 500;

  i {
    font-size: 16px;
  }

  &.success {
    background: rgba(76, 175, 80, 0.15);
    color: #4caf50;
  }

  &.declined {
    background: rgba(158, 158, 158, 0.15);
    color: #9e9e9e;
  }
}

.order-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.order-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }

  &.accept {
    background: #4caf50;
    color: white;

    &:hover {
      background: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    }
  }

  &.decline {
    background: #f5f5f5;
    color: #666;

    &:hover {
      background: #e0e0e0;
    }
  }
}

.order-footer {
  margin-top: 8px;
}

.view-details-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: $primary;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }

  &:hover {
    background: #5fa795;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(111, 184, 165, 0.3);
  }
}

// Responsive
@media (max-width: 575.98px) {
  .order-request-message {
    max-width: 100%;
    padding: 16px;
  }

  .order-header {
    .order-icon {
      width: 36px;
      height: 36px;

      i {
        font-size: 18px;
      }
    }

    .order-title {
      font-size: 16px;
    }
  }

  .order-item-preview {
    padding: 10px;

    .item-thumbnail {
      width: 50px;
      height: 50px;
    }

    .item-info {
      .item-title {
        font-size: 14px;
      }

      .item-location {
        font-size: 12px;
      }
    }
  }

  .order-details {
    padding: 10px;
  }

  .detail-row {
    .detail-label {
      font-size: 13px;
    }

    .detail-value {
      font-size: 14px;
    }
  }

  .order-action-btn {
    font-size: 13px;
    padding: 10px 14px;

    i {
      font-size: 14px;
    }
  }

  .view-details-btn {
    font-size: 13px;
    padding: 10px 14px;
  }
}
</style>
