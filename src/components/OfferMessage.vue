<template>
  <div :class="['offer-message', offerTypeClass, statusClass]">
    <div class="offer-header">
      <div class="offer-icon">
        <i :class="['bi', iconClass]"></i>
      </div>
      <h4 class="offer-title">{{ titleText }}</h4>
    </div>

    <div class="offer-body">
      <div class="offer-detail-row">
        <span class="offer-label">
          {{ offer.offered_by === 'buyer' ? '出價金額' : '還價金額' }}
        </span>
        <span class="offer-amount">{{ offer.amount }}P</span>
      </div>

      <div v-if="offer.original_price" class="offer-detail-row secondary">
        <span class="offer-label">原價</span>
        <span class="offer-value">{{ offer.original_price }}P</span>
      </div>

      <div v-if="offer.status === 'accepted'" class="offer-status-message success">
        <i class="bi bi-check-circle-fill"></i>
        <span>已接受此出價</span>
      </div>

      <div v-if="offer.status === 'declined'" class="offer-status-message declined">
        <i class="bi bi-x-circle-fill"></i>
        <span>已拒絕此出價</span>
      </div>

      <div v-if="offer.status === 'countered'" class="offer-status-message countered">
        <i class="bi bi-arrow-left-right"></i>
        <span>賣家已還價</span>
      </div>
    </div>

    <!-- Action buttons (only show if offer is pending and user can respond) -->
    <div v-if="showActions" class="offer-actions">
      <button
        v-if="canAccept"
        class="offer-action-btn accept"
        @click="handleAccept"
      >
        <i class="bi bi-check-lg"></i>
        接受
      </button>
      <button
        v-if="canCounter"
        class="offer-action-btn counter"
        @click="handleCounter"
      >
        <i class="bi bi-arrow-left-right"></i>
        還價
      </button>
      <button
        v-if="canDecline"
        class="offer-action-btn decline"
        @click="handleDecline"
      >
        <i class="bi bi-x-lg"></i>
        拒絕
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  offer: {
    type: Object,
    required: true
    // Expected structure:
    // {
    //   id: string,
    //   offered_by: 'buyer' | 'seller',
    //   amount: number,
    //   original_price?: number,
    //   status: 'pending' | 'accepted' | 'declined' | 'countered',
    //   created_at: string
    // }
  },
  currentUserId: {
    type: String,
    required: true
  },
  buyerId: {
    type: String,
    required: true
  },
  sellerId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['accept', 'counter', 'decline']);

// Computed
const isBuyer = computed(() => props.currentUserId === props.buyerId);
const isSeller = computed(() => props.currentUserId === props.sellerId);

const offerTypeClass = computed(() => {
  return props.offer.offered_by === 'buyer' ? 'buyer-offer' : 'seller-offer';
});

const statusClass = computed(() => {
  return `status-${props.offer.status}`;
});

const iconClass = computed(() => {
  return props.offer.offered_by === 'buyer' ? 'bi-cash-coin' : 'bi-arrow-left-right';
});

const titleText = computed(() => {
  return props.offer.offered_by === 'buyer' ? '買家出價' : '賣家還價';
});

// Show actions only if offer is pending and user can respond
const showActions = computed(() => {
  if (props.offer.status !== 'pending') return false;

  // Seller can respond to buyer offers
  if (props.offer.offered_by === 'buyer' && isSeller.value) return true;

  // Buyer can respond to seller counter offers
  if (props.offer.offered_by === 'seller' && isBuyer.value) return true;

  return false;
});

const canAccept = computed(() => showActions.value);
const canCounter = computed(() => showActions.value && isSeller.value);
const canDecline = computed(() => showActions.value);

// Methods
function handleAccept() {
  emit('accept', props.offer);
}

function handleCounter() {
  emit('counter', props.offer);
}

function handleDecline() {
  emit('decline', props.offer);
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.offer-message {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  margin: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 400px;
  transition: all 0.3s;

  &.buyer-offer {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
  }

  &.seller-offer {
    background: #f0faf8;
    border-left: 4px solid $primary;
  }

  &.status-accepted {
    background: #e8f5e9;
    border-left-color: #4caf50;
  }

  &.status-declined {
    background: #fafafa;
    border-left-color: #9e9e9e;
    opacity: 0.7;

    .offer-amount,
    .offer-value {
      text-decoration: line-through;
    }
  }
}

.offer-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .offer-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);

    i {
      font-size: 18px;
    }

    .buyer-offer & i {
      color: #2196f3;
    }

    .seller-offer & i {
      color: $primary;
    }

    .status-accepted & i {
      color: #4caf50;
    }

    .status-declined & i {
      color: #9e9e9e;
    }
  }

  .offer-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }
}

.offer-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offer-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  &.secondary {
    .offer-label,
    .offer-value {
      font-size: 13px;
      color: #666;
    }
  }

  .offer-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #555;
    font-weight: 400;
  }

  .offer-amount {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #1e1e1e;
  }

  .offer-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1e1e1e;
  }
}

.offer-status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  font-weight: 500;

  i {
    font-size: 16px;
  }

  &.success {
    background: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }

  &.declined {
    background: rgba(158, 158, 158, 0.1);
    color: #9e9e9e;
  }

  &.countered {
    background: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }
}

.offer-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.offer-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
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

  &.counter {
    background: #ff9800;
    color: white;

    &:hover {
      background: #fb8c00;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
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

// Responsive
@media (max-width: 575.98px) {
  .offer-message {
    max-width: 100%;
    padding: 14px;
  }

  .offer-header {
    .offer-icon {
      width: 32px;
      height: 32px;

      i {
        font-size: 16px;
      }
    }

    .offer-title {
      font-size: 15px;
    }
  }

  .offer-detail-row {
    .offer-amount {
      font-size: 18px;
    }
  }

  .offer-action-btn {
    font-size: 13px;
    padding: 8px 12px;

    i {
      font-size: 14px;
    }
  }
}
</style>
