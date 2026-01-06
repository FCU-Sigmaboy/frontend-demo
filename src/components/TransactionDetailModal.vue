<template>
  <div v-if="transaction" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <button class="modal-close" @click="handleClose">
        <i class="bi bi-x-lg"></i>
      </button>

      <div class="modal-transaction-icon" :style="{ backgroundColor: getTransactionColor(transaction.type) }">
        {{ getTransactionIcon(transaction.type) }}
      </div>

      <h4 class="modal-transaction-title">{{ transaction.description }}</h4>

      <div class="modal-transaction-amount" :class="{ positive: transaction.amount > 0, negative: transaction.amount < 0 }">
        {{ Intl.NumberFormat('zh-TW', { signDisplay: 'always' }).format(transaction.amount) }}P
      </div>

      <div class="modal-transaction-details">
        <div class="detail-item">
          <span class="detail-label">交易類型</span>
          <span class="detail-value">{{ getTransactionLabel(transaction.type) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">交易時間</span>
          <span class="detail-value">{{ formatDateTime(transaction.created_at) }}</span>
        </div>
      </div>

      <div class="modal-action" v-if="transaction.transaction_id">
        <button class="btn-view-transaction" @click="emit('navigate')">
          <i class="bi bi-arrow-right-circle"></i>
          查看交易詳情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { TRANSACTION_TYPES } from '@/api/pointsAPI';

defineProps({
  transaction: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'navigate']);

function handleClose() {
  emit('close');
}

function getTransactionIcon(type) {
  return TRANSACTION_TYPES[type?.toUpperCase()]?.icon || '🎁';
}

function getTransactionLabel(type) {
  return TRANSACTION_TYPES[type?.toUpperCase()]?.label || type;
}

function getTransactionColor(type) {
  return TRANSACTION_TYPES[type?.toUpperCase()]?.color || '#95a5a6';
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  position: relative;
  animation: slideUp 0.3s;
  text-align: center;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #1e1e1e;
    transform: scale(1.1);
  }
}

.modal-transaction-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto 20px;
}

.modal-transaction-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1e1e1e;
  margin: 0 0 15px 0;
}

.modal-transaction-amount {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 25px;

  &.positive {
    color: #27ae60;
  }

  &.negative {
    color: #e74c3c;
  }
}

.modal-transaction-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #777;
}

.detail-value {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1e1e1e;
}

.modal-action {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-view-transaction {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: $primary;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }

  &:hover {
    background: #5fa795;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

@media (max-width: 575.98px) {
  .modal-content {
    padding: 30px 20px;
  }

  .modal-transaction-icon {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }

  .modal-transaction-amount {
    font-size: 28px;
  }
}
</style>
