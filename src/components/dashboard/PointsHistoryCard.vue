<template>
  <div class="transaction-history-card card">
    <div class="card-body">
      <div class="card-header-section">
        <h3 class="card-title">
          <i class="bi bi-clock-history"></i>
          點數紀錄
        </h3>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: activeFilter === tab.key }"
          @click="handleFilterChange(tab.key)"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="transactions.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>尚無交易記錄</p>
        <small>開始交易來建立您的記錄</small>
      </div>

      <!-- Transactions List -->
      <div v-else-if="transactions.length > 0" class="transactions-list">
        <div
          v-for="transaction in transactions"
          :key="transaction.id"
          class="transaction-item"
          @click="selectTransaction(transaction)"
        >
          <div class="transaction-icon" :style="{ backgroundColor: getTransactionColor(transaction.type) }">
            {{ getTransactionIcon(transaction.type) }}
          </div>

          <div class="transaction-info">
            <h5 class="transaction-title">{{ transaction.description }}</h5>
            <div class="transaction-meta">
              <span class="transaction-type">{{ getTransactionLabel(transaction.type) }}</span>
              <span class="transaction-date">{{ formatDate(transaction.created_at) }}</span>
            </div>
          </div>

          <div class="transaction-amount" :class="{ positive: transaction.amount > 0, negative: transaction.amount < 0 }">
            {{ Intl.NumberFormat('zh-TW', { signDisplay: 'always' }).format(transaction.amount) }}P
          </div>

          <i class="bi bi-chevron-right transaction-arrow"></i>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="transactions.length > 0 && hasMore" class="load-more-section">
        <button class="load-more-btn" @click="handleLoadMore" :disabled="isLoading || !hasMore">
          <i class="bi bi-arrow-down-circle"></i>
          <span v-if="!isLoading">載入更多</span>
          <span v-else>載入中...</span>
        </button>
      </div>

      <!-- Transaction Detail Modal -->
      <div v-if="selectedTransaction" class="modal-overlay" @click="selectedTransaction = null">
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="selectedTransaction = null">
            <i class="bi bi-x-lg"></i>
          </button>

          <div class="modal-transaction-icon" :style="{ backgroundColor: getTransactionColor(selectedTransaction.type) }">
            {{ getTransactionIcon(selectedTransaction.type) }}
          </div>

          <h4 class="modal-transaction-title">{{ selectedTransaction.description }}</h4>

          <div class="modal-transaction-amount" :class="{ positive: selectedTransaction.amount > 0, negative: selectedTransaction.amount < 0 }">
            {{ Intl.NumberFormat('zh-TW', { signDisplay: 'always' }).format(selectedTransaction.amount) }}P
          </div>

          <div class="modal-transaction-details">
            <div class="detail-item">
              <span class="detail-label">交易類型</span>
              <span class="detail-value">{{ getTransactionLabel(selectedTransaction.type) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">交易時間</span>
              <span class="detail-value">{{ formatDateTime(selectedTransaction.created_at) }}</span>
            </div>
            <div v-if="selectedTransaction.reference_type" class="detail-item">
              <span class="detail-label">關聯項目</span>
              <span class="detail-value">{{ selectedTransaction.reference_type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { TRANSACTION_TYPES } from '@/api/pointsAPI';

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  },
  hasMore: {
    type: Boolean,
    default: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  activeFilter: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['filter', 'load-more']);

// State
const activeFilter = ref(props.activeFilter || 'all');
watch(() => props.activeFilter, value => {
  activeFilter.value = value || 'all';
});
const selectedTransaction = ref(null);
const isLoading = ref(false);
const currentPage = ref(1);

// Filter tabs configuration
const filterTabs = [
  { key: 'all', label: '全部', icon: 'bi bi-list' },
  { key: 'income', label: '收入', icon: 'bi bi-arrow-up-circle', rpcType: 'transaction_income' },
  { key: 'spending', label: '支出', icon: 'bi bi-arrow-down-circle', rpcType: 'transaction_expense' },
  { key: 'rewards', label: '任務獎勵', icon: 'bi bi-gift', rpcType: 'quest_reward' }
];

// Methods
function handleFilterChange(filterKey) {
  activeFilter.value = filterKey;
  currentPage.value = 1;

  const selected = filterTabs.find(tab => tab.key === filterKey);
  emit('filter', {
    type: selected?.rpcType || null,
    page: 1,
    size: 20
  });
}

function handleLoadMore() {
  if (props.isLoading || !props.hasMore) return;
  isLoading.value = true;
  currentPage.value += 1;

  emit('load-more', currentPage.value);

  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
}

function selectTransaction(transaction) {
  selectedTransaction.value = transaction;
}

function getTransactionIcon(type) {
  return TRANSACTION_TYPES[type?.toUpperCase()]?.icon || '💰';
}

function getTransactionLabel(type) {
  return TRANSACTION_TYPES[type?.toUpperCase()]?.label || type;
}

function getTransactionColor(type) {
  return TRANSACTION_TYPES[type?.toUpperCase()]?.color || '#95a5a6';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit'
    });
  }
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

.transaction-history-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: white;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
}

.card-body {
  padding: 30px;
}

.card-header-section {
  margin-bottom: 20px;
}

.card-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 22px;
    color: $primary;
  }
}

// Filter Tabs
.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.filter-tab {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #777;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  i {
    font-size: 16px;
  }

  &:hover {
    color: $primary;
    background-color: rgba(111, 184, 165, 0.05);
  }

  &.active {
    color: $primary;
    border-bottom-color: $primary;
    font-weight: 600;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  i {
    font-size: 60px;
    margin-bottom: 15px;
    opacity: 0.3;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    margin: 0 0 8px 0;
  }

  small {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #bbb;
  }
}

// Transactions List
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #f0f0f0;
    transform: translateX(5px);
  }
}

.transaction-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0 0 5px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.transaction-type {
  font-family: 'Noto Sans TC', sans-serif;
  color: #777;
}

.transaction-date {
  font-family: 'Noto Sans TC', sans-serif;
  color: #999;
}

.transaction-amount {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;

  &.positive {
    color: #27ae60;
  }

  &.negative {
    color: #e74c3c;
  }
}

.transaction-arrow {
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
}

// Load More Section
.load-more-section {
  margin-top: 20px;
  text-align: center;
}

.load-more-btn {
  padding: 12px 30px;
  background-color: #f0f0f0;
  color: #555;
  border: none;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 16px;
  }

  &:hover:not(:disabled) {
    background-color: $primary;
    color: white;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Modal
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

// Responsive Design
@media (max-width: 991.98px) {
  .card-body {
    padding: 25px;
  }

  .filter-tabs {
    flex-wrap: wrap;
  }

  .filter-tab {
    flex: 1 1 calc(50% - 5px);
  }

  .transaction-item {
    padding: 12px;
  }

  .transaction-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}

@media (max-width: 575.98px) {
  .card-body {
    padding: 20px;
  }

  .filter-tab {
    padding: 10px 15px;
    font-size: 13px;

    i {
      font-size: 14px;
    }
  }

  .transaction-item {
    padding: 10px;
    gap: 10px;
  }

  .transaction-icon {
    width: 35px;
    height: 35px;
    font-size: 18px;
  }

  .transaction-title {
    font-size: 14px;
  }

  .transaction-amount {
    font-size: 16px;
  }

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
