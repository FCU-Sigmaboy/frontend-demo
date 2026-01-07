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
          <div
            class="transaction-icon"
            :style="{ backgroundColor: getTransactionColor(transaction.type) }"
          >
            {{ getTransactionIcon(transaction.type) }}
          </div>

          <div class="transaction-info">
            <h5 class="transaction-title">{{ transaction.description }}</h5>
            <div class="transaction-meta">
              <span class="transaction-type">{{ getTransactionLabel(transaction.type) }}</span>
              <span class="transaction-date">{{ formatDate(transaction.created_at) }}</span>
            </div>
          </div>

          <div
            class="transaction-amount"
            :class="{ positive: transaction.amount > 0, negative: transaction.amount < 0 }"
          >
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

      <TransactionDetailModal
        :transaction="selectedTransaction"
        @close="selectedTransaction = null"
        @navigate="navigateToTransaction"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { TRANSACTION_TYPES } from '@/api/pointsAPI'
  import TransactionDetailModal from '@/components/TransactionDetailModal.vue'

  const router = useRouter()

  const props = defineProps({
    transactions: {
      type: Array,
      default: () => [],
    },
    hasMore: {
      type: Boolean,
      default: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    activeFilter: {
      type: String,
      default: null,
    },
  })

  const emit = defineEmits(['filter', 'load-more'])

  // State
  const activeFilter = ref(props.activeFilter || 'all')
  watch(
    () => props.activeFilter,
    (value) => {
      activeFilter.value = value || 'all'
    }
  )
  const selectedTransaction = ref(null)
  const localIsLoading = ref(false)
  const currentPage = ref(1)

  // Filter tabs configuration
  const filterTabs = [
    { key: 'all', label: '全部', icon: 'bi bi-list' },
    { key: 'income', label: '收入', icon: 'bi bi-arrow-up-circle', rpcType: 'transaction_income' },
    {
      key: 'spending',
      label: '支出',
      icon: 'bi bi-arrow-down-circle',
      rpcType: 'transaction_expense',
    },
    { key: 'rewards', label: '任務獎勵', icon: 'bi bi-gift', rpcType: 'quest_reward' },
  ]

  // Methods
  function handleFilterChange(filterKey) {
    activeFilter.value = filterKey
    currentPage.value = 1

    const selected = filterTabs.find((tab) => tab.key === filterKey)
    emit('filter', {
      type: selected?.rpcType || null,
      page: 1,
      size: 20,
    })
  }

  function handleLoadMore() {
    if (props.isLoading || !props.hasMore) return
    localIsLoading.value = true
    currentPage.value += 1

    emit('load-more', currentPage.value)

    setTimeout(() => {
      localIsLoading.value = false
    }, 1000)
  }

  function selectTransaction(transaction) {
    selectedTransaction.value = transaction
  }

  function navigateToTransaction() {
    if (!selectedTransaction.value?.transaction_id) return

    const transactionId = selectedTransaction.value.transaction_id

    // Close modal
    selectedTransaction.value = null

    // Navigate to MyTransactionsPage with transaction ID
    router.push({
      name: 'TransactionRecords',
      query: { transactionId },
    })
  }

  function getTransactionIcon(type) {
    return TRANSACTION_TYPES[type?.toUpperCase()]?.icon || '💰'
  }

  function getTransactionLabel(type) {
    return TRANSACTION_TYPES[type?.toUpperCase()]?.label || type
  }

  function getTransactionColor(type) {
    return TRANSACTION_TYPES[type?.toUpperCase()]?.color || '#95a5a6'
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
      })
    }
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
  }
</style>
