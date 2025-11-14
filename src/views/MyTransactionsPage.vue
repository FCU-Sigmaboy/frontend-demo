<template>
  <div class="transaction-records-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="records-container">
        <!-- Breadcrumb -->
        <Breadcrumb :items="[
          { label: '個人檔案', to: { name: 'UserProfile' } },
          { label: '我的交易' }
        ]" />

        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="page-title">我的交易</h1>
          <div class="spacer"></div>
        </div>

        <!-- Tabs -->
        <div class="tabs-section">
          <div class="tabs-container">
            <button
              :class="['tab-btn', { active: activeTab === 'confirming' }]"
              @click="activeTab = 'confirming'"
            >
              <i class="bi bi-hourglass-split"></i>
              <span>待確認</span>
              <span class="tab-count">{{ confirmingTransactions.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'pending' }]"
              @click="activeTab = 'pending'"
            >
              <i class="bi bi-clock-history"></i>
              <span>交易中</span>
              <span class="tab-count">{{ pendingTransactions.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'completed' }]"
              @click="activeTab = 'completed'"
            >
              <i class="bi bi-check-circle-fill"></i>
              <span>已完成</span>
              <span class="tab-count">{{ completedTransactions.length }}</span>
            </button>
          </div>
        </div>

        <!-- Transaction List -->
        <div class="transactions-section">
          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>載入中...</p>
          </div>

          <!-- Confirming Transactions Tab -->
          <div v-else-if="activeTab === 'confirming'">
            <div v-if="confirmingTransactions.length > 0" class="transactions-list">
              <div
                v-for="transaction in confirmingTransactions"
                :key="transaction.transaction_id"
                class="transaction-card"
              >
                <div class="card-header">
                  <div class="transaction-type" :class="transaction.role">
                    <i :class="['bi', transaction.role === 'giver' ? 'bi-cash-stack' : 'bi-bag-fill']"></i>
                    <span>{{ transaction.role === 'giver' ? '賣出' : '買入' }}</span>
                  </div>
                  <span class="status-badge confirming">
                    待確認
                  </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="transaction.item_image_url || 'https://placehold.co/80x80/6fb8a5/ffffff?text=Item'"
                      :alt="transaction.item_title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item_title }}</h3>
                      <p class="item-meta">
                        {{ transaction.role === 'giver' ? '買家' : '賣家' }}: {{ transaction.other_user_nickname }}
                      </p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row" v-if="transaction.giver_note">
                      <span class="meta-label">賣家備註</span>
                      <span class="meta-value">{{ transaction.giver_note }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.receiver_note">
                      <span class="meta-label">買家備註</span>
                      <span class="meta-value">{{ transaction.receiver_note }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">{{ transaction.item_price }} 點</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="transaction-actions">
                    <template v-if="transaction.role === 'receiver'">
                      <button
                        class="btn-action btn-reject"
                        @click.stop="handleRejectTransaction(transaction)"
                      >
                        <i class="bi bi-x-circle"></i>
                        拒絕
                      </button>
                      <button
                        class="btn-action btn-confirm"
                        @click.stop="handleConfirmTransaction(transaction)"
                      >
                        <i class="bi bi-check-circle"></i>
                        確認交易
                      </button>
                    </template>
                    <button
                      v-else
                      class="btn-action btn-waiting"
                      disabled
                    >
                      <i class="bi bi-hourglass-split"></i>
                      等待對方接受
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-hourglass-split"></i>
              <p>目前沒有待確認的交易</p>
            </div>
          </div>

          <!-- Pending Transactions Tab -->
          <div v-else-if="activeTab === 'pending'">
            <div v-if="pendingTransactions.length > 0" class="transactions-list">
              <div
                v-for="transaction in pendingTransactions"
                :key="transaction.transaction_id"
                class="transaction-card"
              >
                <div class="card-header">
                  <div class="transaction-type" :class="transaction.role">
                    <i :class="['bi', transaction.role === 'giver' ? 'bi-cash-stack' : 'bi-bag-fill']"></i>
                    <span>{{ transaction.role === 'giver' ? '賣出' : '買入' }}</span>
                  </div>
                  <span class="status-badge pending">
                    交易中
                  </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="transaction.item_image_url || 'https://placehold.co/80x80/6fb8a5/ffffff?text=Item'"
                      :alt="transaction.item_title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item_title }}</h3>
                      <p class="item-meta">
                        {{ transaction.role === 'giver' ? '買家' : '賣家' }}: {{ transaction.other_user_nickname }}
                      </p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row" v-if="transaction.role === 'giver' && transaction.code">
                      <span class="meta-label">交易確認碼</span>
                      <button
                        class="code-view-btn"
                        @click.stop="handleViewCode(transaction)"
                      >
                        <span class="meta-value">點擊查看</span>
                        <i class="bi bi-eye"></i>
                      </button>
                    </div>
                    <div class="meta-row" v-if="transaction.giver_note">
                      <span class="meta-label">賣家備註</span>
                      <span class="meta-value">{{ transaction.giver_note }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.receiver_note">
                      <span class="meta-label">買家備註</span>
                      <span class="meta-value">{{ transaction.receiver_note }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">{{ transaction.item_price }} 點</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="transaction-actions">
                    <button
                      v-if="transaction.role === 'receiver'"
                      class="btn-action btn-primary"
                      @click.stop="handleInputCode(transaction)"
                    >
                      <i class="bi bi-keyboard"></i>
                      輸入確認碼完成交易
                    </button>
                    <button
                      v-else
                      class="btn-action btn-waiting"
                      disabled
                    >
                      <i class="bi bi-clock-history"></i>
                      等待買家完成交易
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-clock-history"></i>
              <p>目前沒有進行中的交易</p>
            </div>
          </div>

          <!-- Completed Transactions Tab -->
          <div v-else-if="activeTab === 'completed'">
            <div v-if="completedTransactions.length > 0" class="transactions-list">
              <div
                v-for="transaction in completedTransactions"
                :key="transaction.transaction_id"
                class="transaction-card"
              >
                <div class="card-header">
                  <div class="transaction-type" :class="transaction.role">
                    <i :class="['bi', transaction.role === 'giver' ? 'bi-cash-stack' : 'bi-bag-fill']"></i>
                    <span>{{ transaction.role === 'giver' ? '賣出' : '買入' }}</span>
                  </div>
                  <span class="status-badge completed">
                    已完成
                  </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="transaction.item_image_url || 'https://placehold.co/80x80/6fb8a5/ffffff?text=Item'"
                      :alt="transaction.item_title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item_title }}</h3>
                      <p class="item-meta">
                        {{ transaction.role === 'giver' ? '買家' : '賣家' }}: {{ transaction.other_user_nickname }}
                      </p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row" v-if="transaction.completed_at">
                      <span class="meta-label">完成時間</span>
                      <span class="meta-value">{{ formatDate(transaction.completed_at) }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.giver_note">
                      <span class="meta-label">賣家備註</span>
                      <span class="meta-value">{{ transaction.giver_note }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.receiver_note">
                      <span class="meta-label">買家備註</span>
                      <span class="meta-value">{{ transaction.receiver_note }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">{{ transaction.item_price }} 點</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-check-circle-fill"></i>
              <p>目前沒有已完成的交易</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />

    <!-- Confirm Transaction Modal -->
    <ConfirmTransactionModal
      v-model="showConfirmModal"
      :transaction="selectedTransaction"
      @confirm="handleConfirmModalSubmit"
    />

    <!-- Input Code Modal -->
    <InputCodeModal
      v-model="showInputCodeModal"
      :transaction="selectedTransactionForCode"
      @confirm="handleInputCodeSubmit"
    />

    <!-- View Code Modal -->
    <ViewCodeModal
      v-model="showViewCodeModal"
      :code="selectedCodeTransaction?.code"
      :transaction="selectedCodeTransaction"
    />

    <!-- Reject Transaction Modal -->
    <RejectTransactionModal
      v-model="showRejectModal"
      :transaction="selectedTransactionForReject"
      @confirm="handleRejectModalSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import ConfirmTransactionModal from '../components/transaction/ConfirmTransactionModal.vue';
import InputCodeModal from '../components/transaction/InputCodeModal.vue';
import ViewCodeModal from '../components/transaction/ViewCodeModal.vue';
import RejectTransactionModal from '../components/transaction/RejectTransactionModal.vue';
import { getMyTransactionsByStatus, buyerConfirmTransaction, cancelTransaction } from '@/api/transaction_before_meetAPI';
import { finalizeTransactionWithCode } from '@/api/transaction_meetAPI';

const router = useRouter();

// State
const userPoints = ref(500);
const activeTab = ref('confirming');
const isLoading = ref(false);
const confirmingTransactionsGiver = ref([]);
const confirmingTransactionsReceiver = ref([]);
const pendingTransactionsGiver = ref([]);
const pendingTransactionsReceiver = ref([]);
const completedTransactionsGiver = ref([]);
const completedTransactionsReceiver = ref([]);
const showConfirmModal = ref(false);
const selectedTransaction = ref(null);
const showInputCodeModal = ref(false);
const selectedTransactionForCode = ref(null);
const showViewCodeModal = ref(false);
const selectedCodeTransaction = ref(null);
const showRejectModal = ref(false);
const selectedTransactionForReject = ref(null);

// Computed
const confirmingTransactions = computed(() => {
  const giver = confirmingTransactionsGiver.value.map(t => ({ ...t, role: 'giver' }));
  const receiver = confirmingTransactionsReceiver.value.map(t => ({ ...t, role: 'receiver' }));
  return [...giver, ...receiver].sort((a, b) => b.transaction_id - a.transaction_id);
});

const pendingTransactions = computed(() => {
  const giver = pendingTransactionsGiver.value.map(t => ({ ...t, role: 'giver' }));
  const receiver = pendingTransactionsReceiver.value.map(t => ({ ...t, role: 'receiver' }));
  return [...giver, ...receiver].sort((a, b) => b.transaction_id - a.transaction_id);
});

const completedTransactions = computed(() => {
  const giver = completedTransactionsGiver.value.map(t => ({ ...t, role: 'giver' }));
  const receiver = completedTransactionsReceiver.value.map(t => ({ ...t, role: 'receiver' }));
  return [...giver, ...receiver].sort((a, b) => b.transaction_id - a.transaction_id);
});

// Methods
const fetchTransactions = async () => {
  isLoading.value = true;
  try {
    // Fetch all transaction statuses
    const [
      confirmingGiver,
      confirmingReceiver,
      pendingGiver,
      pendingReceiver,
      completedGiver,
      completedReceiver
    ] = await Promise.all([
      getMyTransactionsByStatus('confirming', 'giver').catch(() => []),
      getMyTransactionsByStatus('confirming', 'receiver').catch(() => []),
      getMyTransactionsByStatus('pending', 'giver').catch(() => []),
      getMyTransactionsByStatus('pending', 'receiver').catch(() => []),
      getMyTransactionsByStatus('completed', 'giver').catch(() => []),
      getMyTransactionsByStatus('completed', 'receiver').catch(() => [])
    ]);

    confirmingTransactionsGiver.value = confirmingGiver || [];
    confirmingTransactionsReceiver.value = confirmingReceiver || [];
    pendingTransactionsGiver.value = pendingGiver || [];
    pendingTransactionsReceiver.value = pendingReceiver || [];
    completedTransactionsGiver.value = completedGiver || [];
    completedTransactionsReceiver.value = completedReceiver || [];
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getStatusText = (status) => {
  const statusMap = {
    completed: '已完成',
    pending: '進行中',
    confirming: '待確認',
    cancelled: '已取消',
    failed: '失敗'
  };
  return statusMap[status] || status;
};

const handleConfirmTransaction = (transaction) => {
  // 買家確認交易（從 confirming -> pending）
  selectedTransaction.value = transaction;
  showConfirmModal.value = true;
};

const handleRejectTransaction = (transaction) => {
  // 買家拒絕交易（從 confirming -> cancelled）
  selectedTransactionForReject.value = transaction;
  showRejectModal.value = true;
};

const handleRejectModalSubmit = async () => {
  if (!selectedTransactionForReject.value) return;

  try {
    isLoading.value = true;
    await cancelTransaction(selectedTransactionForReject.value.transaction_id);

    alert('已拒絕交易，商品已重新上架。');

    // 重新載入交易列表
    await fetchTransactions();
  } catch (error) {
    console.error('Failed to reject transaction:', error);
    alert(`拒絕交易失敗：${error.message}`);
  } finally {
    isLoading.value = false;
    selectedTransactionForReject.value = null;
  }
};

const handleConfirmModalSubmit = async (note) => {
  if (!selectedTransaction.value) return;

  try {
    isLoading.value = true;
    await buyerConfirmTransaction(selectedTransaction.value.transaction_id, note || '');

    alert('交易已確認！請與賣家約定時間地點面交。');

    // 重新載入交易列表
    await fetchTransactions();
  } catch (error) {
    console.error('Failed to confirm transaction:', error);
    alert(`確認交易失敗：${error.message}`);
  } finally {
    isLoading.value = false;
    selectedTransaction.value = null;
  }
};

const handleInputCode = (transaction) => {
  // 買家輸入確認碼完成交易（從 pending -> completed）
  selectedTransactionForCode.value = transaction;
  showInputCodeModal.value = true;
};

const handleInputCodeSubmit = async (code) => {
  if (!selectedTransactionForCode.value) return;

  try {
    isLoading.value = true;
    const result = await finalizeTransactionWithCode(selectedTransactionForCode.value.transaction_id, code);

    alert(`交易完成！\n\n您的新點數餘額：${result.new_balance} 點`);

    // 重新載入交易列表
    await fetchTransactions();
  } catch (error) {
    console.error('Failed to finalize transaction:', error);
    alert(`完成交易失敗：${error.message}`);
  } finally {
    isLoading.value = false;
    selectedTransactionForCode.value = null;
  }
};

const handleViewCode = (transaction) => {
  selectedCodeTransaction.value = transaction;
  showViewCodeModal.value = true;
};

// Lifecycle
onMounted(() => {
  fetchTransactions();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.transaction-records-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.records-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

// Breadcrumb
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;

  .breadcrumb-link {
    color: $primary;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #5fa795;
    }
  }

  i {
    font-size: 12px;
    color: #999;
  }

  .breadcrumb-current {
    color: #1e1e1e;
  }
}

// Page Header
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    i {
      font-size: 20px;
      color: #1e1e1e;
    }

    &:hover {
      background: #f5f5f5;
      transform: translateX(-3px);
    }
  }

  .page-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  .spacer {
    width: 40px;
  }
}

// Tabs
.tabs-section {
  background: white;
  border-radius: 12px;
  padding: 0;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.tabs-container {
  display: flex;
  gap: 0;
  min-width: fit-content;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  i {
    font-size: 18px;
  }

  .tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    background: #e0e0e0;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #666;
  }

  &:hover {
    color: $primary;
    background: #f9f9f9;
  }

  &.active {
    color: $primary;
    border-bottom-color: $primary;

    .tab-count {
      background: $primary;
      color: white;
    }
  }
}

// Transactions Section
.transactions-section {
  min-height: 400px;
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f0f0f0;
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #999;
    margin: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transaction-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.transaction-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;

  i {
    font-size: 16px;
  }

  &.purchase {
    color: #2196f3;

    i {
      color: #2196f3;
    }
  }

  &.sale {
    color: #4caf50;

    i {
      color: #4caf50;
    }
  }

  &.giver {
    color: #4caf50;

    i {
      color: #4caf50;
    }
  }

  &.receiver {
    color: #2196f3;

    i {
      color: #2196f3;
    }
  }
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  font-weight: 500;

  &.completed {
    background: #e8f5e9;
    color: #4caf50;
  }

  &.pending {
    background: #fff3e0;
    color: #ff9800;
  }

  &.confirming {
    background: #e3f2fd;
    color: #2196f3;
  }

  &.cancelled {
    background: #ffebee;
    color: #f44336;
  }

  &.failed {
    background: #fafafa;
    color: #9e9e9e;
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
  min-width: 0;

  .item-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 6px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-meta {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    margin: 0;
  }
}

.transaction-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .meta-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
  }

  .meta-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    font-weight: 500;

    &.price {
      color: $primary;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .code-view-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.2s;

    .meta-value {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #2196f3;
    }

    i {
      font-size: 14px;
      color: #2196f3;
      transition: color 0.2s;
    }

    &:hover {
      background: #2196f3;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);

      .meta-value,
      i {
        color: white;
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  i {
    font-size: 80px;
    color: #e0e0e0;
    margin-bottom: 20px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    color: #999;
    margin: 0;
  }
}

// Transaction Actions
.transaction-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;

  .btn-action {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 16px;
    }

    &.btn-reject {
      background: #ffebee;
      color: #d32f2f;
      border: 1px solid #d32f2f;

      &:hover {
        background: #d32f2f;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }

    &.btn-confirm {
      background: $primary;
      color: white;

      &:hover {
        background: #5fa795;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(111, 184, 165, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }

    &.btn-primary {
      background: #2196f3;
      color: white;

      &:hover {
        background: #1976d2;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }

    &.btn-waiting {
      background: #f5f5f5;
      color: #999;
      cursor: not-allowed;
      opacity: 0.7;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    }
  }
}

// Responsive
@media (max-width: 767.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .records-container {
    padding: 0 15px;
  }

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
    }
  }

  .tab-btn {
    padding: 16px 20px;
    font-size: 14px;

    i {
      font-size: 16px;
    }

    span:not(.tab-count) {
      display: none;
    }
  }

  .transaction-card {
    padding: 16px;
  }

  .item-info {
    gap: 12px;
  }

  .item-image {
    width: 60px;
    height: 60px;
  }

  .item-details {
    .item-title {
      font-size: 15px;
    }

    .item-meta {
      font-size: 13px;
    }
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .records-container {
    padding: 0 10px;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .page-header {
    .page-title {
      font-size: 20px;
    }

    .back-btn {
      width: 36px;
      height: 36px;

      i {
        font-size: 18px;
      }
    }

    .spacer {
      width: 36px;
    }
  }

  .empty-state {
    padding: 80px 20px;

    i {
      font-size: 60px;
    }

    p {
      font-size: 16px;
    }
  }
}
</style>
