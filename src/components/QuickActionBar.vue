<template>
  <div class="quick-action-bar">
    <!-- Quick Prompts (shown on first message or when no messages) -->
    <div v-if="showQuickPrompts" class="quick-prompts">
      <button
        v-for="prompt in quickPrompts"
        :key="prompt.id"
        class="prompt-chip"
        @click="sendQuickPrompt(prompt.text)"
      >
        {{ prompt.text }}
      </button>
    </div>

    <!-- Action Buttons (context-aware based on user role and state) -->
    <div class="action-buttons">
      <!-- Buyer Actions -->
      <template v-if="isBuyer">
        <button
          v-if="canMakeOffer"
          class="action-btn offer-btn"
          @click="showOfferModal = true"
        >
          <i class="bi bi-cash-coin"></i>
          <span>出價</span>
        </button>
        <button
          v-if="canRequestOrder"
          class="action-btn order-btn"
          @click="handleRequestOrder"
        >
          <i class="bi bi-file-earmark-text"></i>
          <span>請求訂單</span>
        </button>
      </template>

      <!-- Seller Actions -->
      <template v-if="isSeller && pendingOffer">
        <button
          class="action-btn accept-btn"
          @click="handleAcceptOffer"
        >
          <i class="bi bi-check-circle"></i>
          <span>接受</span>
        </button>
        <button
          class="action-btn counter-btn"
          @click="showCounterModal = true"
        >
          <i class="bi bi-arrow-left-right"></i>
          <span>還價</span>
        </button>
      </template>
    </div>

    <!-- Offer Modal -->
    <teleport to="body">
      <div v-if="showOfferModal" class="modal-overlay" @click="showOfferModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">出價</h3>
            <button class="modal-close" @click="showOfferModal = false">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">出價金額 (P)</label>
              <input
                v-model.number="offerAmount"
                type="number"
                class="form-input"
                placeholder="請輸入出價金額"
                min="0"
                @keypress.enter="handleSubmitOffer"
              />
              <p class="form-hint">原價: {{ currentPrice }}P</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showOfferModal = false">取消</button>
            <button
              class="btn-primary"
              :disabled="!offerAmount || offerAmount <= 0"
              @click="handleSubmitOffer"
            >
              送出出價
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Counter Offer Modal -->
    <teleport to="body">
      <div v-if="showCounterModal" class="modal-overlay" @click="showCounterModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">還價</h3>
            <button class="modal-close" @click="showCounterModal = false">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">還價金額 (P)</label>
              <input
                v-model.number="counterAmount"
                type="number"
                class="form-input"
                placeholder="請輸入還價金額"
                min="0"
                @keypress.enter="handleSubmitCounter"
              />
              <p class="form-hint">
                買家出價: {{ pendingOffer?.amount }}P<br />
                原價: {{ currentPrice }}P
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showCounterModal = false">取消</button>
            <button
              class="btn-primary"
              :disabled="!counterAmount || counterAmount <= 0"
              @click="handleSubmitCounter"
            >
              送出還價
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  conversationId: {
    type: String,
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  },
  sellerId: {
    type: String,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  transactionState: {
    type: String,
    default: 'negotiating' // negotiating, order_requested, buyer_confirmed, completed
  },
  messageCount: {
    type: Number,
    default: 0
  },
  pendingOffer: {
    type: Object,
    default: null // { id, amount, offered_by, status }
  }
});

const emit = defineEmits([
  'send-quick-prompt',
  'make-offer',
  'accept-offer',
  'counter-offer',
  'request-order'
]);

// State
const showOfferModal = ref(false);
const showCounterModal = ref(false);
const offerAmount = ref(null);
const counterAmount = ref(props.currentPrice);

// Quick prompts
const quickPrompts = ref([
  { id: 1, text: '我對這個物品有興趣' },
  { id: 2, text: '可以折扣更多嗎？' },
  { id: 3, text: '可以面交嗎？' }
]);

// Computed
const isBuyer = computed(() => props.currentUserId !== props.sellerId);
const isSeller = computed(() => props.currentUserId === props.sellerId);

// Show quick prompts only when no messages have been sent
const showQuickPrompts = computed(() => props.messageCount === 0);

// Buyer can make offer during negotiation
const canMakeOffer = computed(() => {
  return props.transactionState === 'negotiating';
});

// Buyer can request order after price agreement (no pending offers)
const canRequestOrder = computed(() => {
  return props.transactionState === 'negotiating' && !props.pendingOffer;
});

// Methods
function sendQuickPrompt(text) {
  emit('send-quick-prompt', text);
}

function handleSubmitOffer() {
  if (!offerAmount.value || offerAmount.value <= 0) return;

  emit('make-offer', {
    amount: offerAmount.value,
    originalPrice: props.currentPrice
  });

  showOfferModal.value = false;
  offerAmount.value = null;
}

function handleAcceptOffer() {
  if (!props.pendingOffer) return;

  emit('accept-offer', {
    offerId: props.pendingOffer.id,
    amount: props.pendingOffer.amount
  });
}

function handleSubmitCounter() {
  if (!counterAmount.value || counterAmount.value <= 0) return;

  emit('counter-offer', {
    originalOfferId: props.pendingOffer?.id,
    amount: counterAmount.value
  });

  showCounterModal.value = false;
  counterAmount.value = props.currentPrice;
}

function handleRequestOrder() {
  emit('request-order');
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.quick-action-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}

// Quick Prompts
.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 12px;
}

.prompt-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #f0faf8;
  border: 1px solid #d0ebe7;
  border-radius: 20px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: $primary;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: $primary;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(111, 184, 165, 0.3);
  }
}

// Action Buttons
.action-buttons {
  display: flex;
  gap: 8px;
  padding: 0 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
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

  &.offer-btn {
    background: #e3f2fd;
    color: #2196f3;

    &:hover {
      background: #2196f3;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
    }
  }

  &.order-btn {
    background: #f3e5f5;
    color: #9c27b0;

    &:hover {
      background: #9c27b0;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
    }
  }

  &.accept-btn {
    background: #e8f5e9;
    color: #4caf50;

    &:hover {
      background: #4caf50;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    }
  }

  &.counter-btn {
    background: #fff3e0;
    color: #ff9800;

    &:hover {
      background: #ff9800;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
    }
  }
}

// Modal Styles
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
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;

  .modal-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 24px;
      color: #666;
    }

    &:hover {
      background: #f5f5f5;
    }
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .form-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1e1e1e;
  }

  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    transition: all 0.3s;

    &::placeholder {
      color: #999;
    }

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
    }
  }

  .form-hint {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    color: #666;
    margin: 0;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;

  .btn-secondary,
  .btn-primary {
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-secondary {
    background: #f5f5f5;
    color: #666;

    &:hover {
      background: #e0e0e0;
    }
  }

  .btn-primary {
    background: $primary;
    color: white;

    &:hover:not(:disabled) {
      background: #5fa795;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(111, 184, 165, 0.3);
    }

    &:disabled {
      background: #d0d0d0;
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}

// Responsive
@media (max-width: 575.98px) {
  .action-btn {
    font-size: 13px;
    padding: 8px 16px;

    i {
      font-size: 14px;
    }
  }

  .prompt-chip {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
