<template>
  <div class="transaction-records-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="records-container">
        <!-- Breadcrumb -->
        <Breadcrumb :items="[
          { label: '個人檔案', to: { name: 'UserProfile' } },
          { label: '交易紀錄' }
        ]" />

        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="page-title">交易紀錄</h1>
          <div class="spacer"></div>
        </div>

        <!-- Tabs -->
        <div class="tabs-section">
          <div class="tabs-container">
            <button
              :class="['tab-btn', { active: activeTab === 'all' }]"
              @click="activeTab = 'all'"
            >
              <span>全部</span>
              <span class="tab-count">{{ allTransactions.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'purchases' }]"
              @click="activeTab = 'purchases'"
            >
              <i class="bi bi-bag"></i>
              <span>購買紀錄</span>
              <span class="tab-count">{{ purchases.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'sales' }]"
              @click="activeTab = 'sales'"
            >
              <i class="bi bi-cash-stack"></i>
              <span>銷售紀錄</span>
              <span class="tab-count">{{ sales.length }}</span>
            </button>
          </div>
        </div>

        <!-- Transaction List -->
        <div class="transactions-section">
          <!-- All Transactions Tab -->
          <div v-show="activeTab === 'all'">
            <div v-if="allTransactions.length > 0" class="transactions-list">
              <div
                v-for="transaction in allTransactions"
                :key="transaction.id"
                class="transaction-card"
                @click="goToTransactionDetail(transaction.id)"
              >
                <div class="card-header">
                  <div class="transaction-type">
                    <i :class="['bi', transaction.type === 'purchase' ? 'bi-bag-fill' : 'bi-cash-stack']"></i>
                    <span>{{ transaction.type === 'purchase' ? '購買' : '銷售' }}</span>
                  </div>
                  <span :class="['status-badge', transaction.status]">
                    {{ getStatusText(transaction.status) }}
                  </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="transaction.item.image"
                      :alt="transaction.item.title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item.title }}</h3>
                      <p class="item-meta">
                        {{ transaction.type === 'purchase' ? '賣家' : '買家' }}: {{ transaction.otherParty.name }}
                      </p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row">
                      <span class="meta-label">交易日期</span>
                      <span class="meta-value">{{ formatDate(transaction.date) }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">NT$ {{ transaction.amount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-receipt"></i>
              <p>尚無交易紀錄</p>
            </div>
          </div>

          <!-- Purchases Tab -->
          <div v-show="activeTab === 'purchases'">
            <div v-if="purchases.length > 0" class="transactions-list">
              <div
                v-for="transaction in purchases"
                :key="transaction.id"
                class="transaction-card"
                @click="goToTransactionDetail(transaction.id)"
              >
                <div class="card-header">
                  <div class="transaction-type purchase">
                    <i class="bi bi-bag-fill"></i>
                    <span>購買</span>
                  </div>
                  <span :class="['status-badge', transaction.status]">
                    {{ getStatusText(transaction.status) }}
                  </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="transaction.item.image"
                      :alt="transaction.item.title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item.title }}</h3>
                      <p class="item-meta">賣家: {{ transaction.otherParty.name }}</p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row">
                      <span class="meta-label">交易日期</span>
                      <span class="meta-value">{{ formatDate(transaction.date) }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">NT$ {{ transaction.amount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-bag"></i>
              <p>尚無購買紀錄</p>
            </div>
          </div>

          <!-- Sales Tab -->
          <div v-show="activeTab === 'sales'">
            <div v-if="sales.length > 0" class="transactions-list">
              <div
                v-for="transaction in sales"
                :key="transaction.id"
                class="transaction-card"
                @click="goToTransactionDetail(transaction.id)"
              >
                <div class="card-header">
                  <div class="transaction-type sale">
                    <i class="bi bi-cash-stack"></i>
                    <span>銷售</span>
                  </div>
                  <span :class="['status-badge', transaction.status]">
                    {{ getStatusText(transaction.status) }}
                  </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="transaction.item.image"
                      :alt="transaction.item.title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item.title }}</h3>
                      <p class="item-meta">買家: {{ transaction.otherParty.name }}</p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row">
                      <span class="meta-label">交易日期</span>
                      <span class="meta-value">{{ formatDate(transaction.date) }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">NT$ {{ transaction.amount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-cash-stack"></i>
              <p>尚無銷售紀錄</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';

const router = useRouter();

// State
const userPoints = ref(500);
const activeTab = ref('all');

// Mock transaction data
const mockTransactions = ref([
  {
    id: 1,
    type: 'purchase',
    status: 'completed',
    date: '2025-01-15T10:30:00',
    amount: 500,
    item: {
      title: 'IKEA 檯燈',
      image: 'https://placehold.co/80x80/6fb8a5/ffffff?text=Lamp'
    },
    otherParty: {
      name: 'Joseph'
    }
  },
  {
    id: 2,
    type: 'sale',
    status: 'completed',
    date: '2025-01-10T14:20:00',
    amount: 800,
    item: {
      title: '登山背包',
      image: 'https://placehold.co/80x80/5a9d8c/ffffff?text=Bag'
    },
    otherParty: {
      name: 'Amber'
    }
  },
  {
    id: 3,
    type: 'purchase',
    status: 'pending',
    date: '2025-01-20T09:15:00',
    amount: 1200,
    item: {
      title: '復古沙發',
      image: 'https://placehold.co/80x80/4a8b7c/ffffff?text=Sofa'
    },
    otherParty: {
      name: 'Michael'
    }
  },
  {
    id: 4,
    type: 'sale',
    status: 'pending',
    date: '2025-01-18T16:45:00',
    amount: 300,
    item: {
      title: 'iPhone 充電線',
      image: 'https://placehold.co/80x80/3a7b6c/ffffff?text=Cable'
    },
    otherParty: {
      name: 'Sarah'
    }
  }
]);

// Computed
const allTransactions = computed(() => mockTransactions.value);
const purchases = computed(() => mockTransactions.value.filter(t => t.type === 'purchase'));
const sales = computed(() => mockTransactions.value.filter(t => t.type === 'sale'));

// Methods
const goBack = () => {
  router.back();
};

const goToTransactionDetail = (id) => {
  router.push({ name: 'TransactionDetails', params: { id } });
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
    cancelled: '已取消',
    failed: '失敗'
  };
  return statusMap[status] || status;
};
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
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
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
