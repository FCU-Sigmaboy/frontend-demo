<template>
  <div class="points-balance-card card">
    <div class="card-body">
      <div class="card-header-section">
        <h3 class="card-title">
          <i class="bi bi-wallet2"></i>
          點數餘額
        </h3>
        <div v-if="syncStatusLabel" class="sync-status" role="status">
          <span
            v-if="isSyncing"
            class="spinner-border spinner-border-sm text-light"
            role="presentation"
            aria-hidden="true"
          ></span>
          <span>{{ syncStatusLabel }}</span>
        </div>
      </div>

      <!-- Current Balance Display -->
      <div class="balance-display">
        <div class="balance-amount">
          <span class="amount-value">{{ formattedBalance }}</span>
          <span class="amount-unit">P</span>
        </div>
        <p class="balance-label">當前可用點數</p>
      </div>

      <!-- Earnings & Spending Stats -->
      <div class="stats-row">
        <div class="stat-item earning">
          <div class="stat-icon">
            <i class="bi bi-arrow-up-circle"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">累計收入</p>
            <p class="stat-value">{{ formattedEarned }}P</p>
          </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item spending">
          <div class="stat-icon">
            <i class="bi bi-arrow-down-circle"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">累計支出</p>
            <p class="stat-value">{{ formattedSpent }}P</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-btn primary" @click="goToTransactions">
          <i class="bi bi-clock-history"></i>
          查看點數記錄
        </button>
        <button class="action-btn secondary" @click="goToEarnPoints">
          <i class="bi bi-plus-circle"></i>
          賺取點數
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePointsProfile } from '@/composables/usePointsProfile';

const props = defineProps({
  currentBalance: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  autoFetch: {
    type: Boolean,
    default: true
  }
});

const router = useRouter();
const { profile, isLoadingProfile, profileError, fetchPointsProfile } = usePointsProfile();

onMounted(() => {
  if (props.autoFetch) {
    fetchPointsProfile().catch((error) => {
      console.error('[PointsBalanceCard] 無法同步點數資料:', error);
    });
  }
});

const activeProfile = computed(() => {
  if (profile.value) {
    return {
      current_balance: normalizeNumber(profile.value.current_balance),
      total_earned: normalizeNumber(profile.value.total_earned),
      total_spent: normalizeNumber(profile.value.total_spent)
    };
  }

  return {
    current_balance: normalizeNumber(props.currentBalance),
    total_earned: normalizeNumber(props.totalEarned),
    total_spent: normalizeNumber(props.totalSpent)
  };
});

const formattedBalance = computed(() => formatNumber(activeProfile.value.current_balance));
const formattedEarned = computed(() => formatNumber(activeProfile.value.total_earned));
const formattedSpent = computed(() => formatNumber(activeProfile.value.total_spent));

const isSyncing = computed(() => props.autoFetch && isLoadingProfile.value && !profile.value);
const hasSyncError = computed(() => props.autoFetch && !!profileError.value);
const syncStatusLabel = computed(() => {
  if (isSyncing.value) return '同步最新點數中...';
  if (hasSyncError.value) return '暫時無法同步，顯示上次資料';
  return null;
});

function formatNumber(value) {
  return normalizeNumber(value).toLocaleString('zh-TW');
}

function normalizeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

// Methods
function goToTransactions() {
  const historySection = document.querySelector('.transaction-history-card');
  if (historySection) {
    historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function goToEarnPoints() {
  router.push({ name: 'ItemList' });
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.points-balance-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #6fb8a5 0%, #5fa795 100%);
  color: white;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 20px rgba(111, 184, 165, 0.3);
    transform: translateY(-2px);
  }
}

.card-body {
  padding: 30px;
}

.card-header-section {
  margin-bottom: 25px;
}

.card-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 22px;
  }
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8px;
}

// Balance Display
.balance-display {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.balance-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.amount-value {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.amount-unit {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.balance-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

// Stats Row
.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 25px;
  padding: 0 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.stat-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);

  i {
    display: block;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.stat-value {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  margin: 0 15px;
}

// Quick Actions
.quick-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid white;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  i {
    font-size: 16px;
  }

  &.primary {
    background-color: white;
    color: $primary;

    &:hover {
      background-color: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  &.secondary {
    background-color: transparent;
    color: white;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
  }
}

// Responsive Design
@media (max-width: 991.98px) {
  .card-body {
    padding: 25px;
  }

  .amount-value {
    font-size: 42px;
  }

  .amount-unit {
    font-size: 24px;
  }

  .stat-icon {
    font-size: 28px;
  }

  .stat-value {
    font-size: 18px;
  }
}

@media (max-width: 575.98px) {
  .card-body {
    padding: 20px;
  }

  .amount-value {
    font-size: 36px;
  }

  .amount-unit {
    font-size: 20px;
  }

  .stats-row {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }

  .stat-divider {
    display: none;
  }

  .stat-item {
    width: 100%;
  }

  .quick-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
