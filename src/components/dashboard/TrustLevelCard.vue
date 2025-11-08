<template>
  <div class="trust-level-card card">
    <div class="card-body">
      <div class="card-header-section">
        <h3 class="card-title">
          <i class="bi bi-shield-check"></i>
          信任等級
        </h3>
        <button class="info-btn" @click="showInfo = !showInfo">
          <i class="bi bi-info-circle"></i>
        </button>
      </div>

      <!-- Info Tooltip -->
      <div v-if="showInfo" class="info-tooltip">
        <p>信任等級基於您的交易記錄，等級越高可刊登的物品價值越高。完成更多交易來提升您的信任等級！</p>
      </div>

      <!-- Current Trust Level -->
      <div class="current-trust">
        <div class="trust-icon">
          <i class="bi bi-shield-fill-check"></i>
        </div>
        <div class="trust-info">
          <h4 class="trust-name">{{ currentTier.name }}</h4>
          <p class="trust-tier">等級 {{ currentTier.tier }}</p>
        </div>
      </div>

      <!-- Listing Limit -->
      <div class="listing-limit-section">
        <div class="limit-label">
          <i class="bi bi-tag"></i>
          物品刊登上限
        </div>
        <div class="limit-value">
          {{ formatListingLimit(currentTier.maxListingValue) }}
        </div>
      </div>

      <!-- Next Trust Level -->
      <div v-if="nextTier" class="next-trust-section">
        <div class="progress-info">
          <span class="progress-label">升級進度</span>
          <span class="progress-percentage">{{ trustProgress }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${trustProgress}%` }"></div>
        </div>
        <div class="next-trust-info">
          <p class="next-trust-name">下個等級: {{ nextTier.name }}</p>
          <p class="sales-needed">
            還需 <span class="sales-value">{{ salesToNext }}</span> 銷售點數
          </p>
        </div>
      </div>

      <!-- Max Trust Level -->
      <div v-else class="max-trust-badge">
        <i class="bi bi-award-fill"></i>
        已達最高信任等級！
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  currentTier: {
    type: Object,
    required: true
  },
  nextTier: {
    type: Object,
    default: null
  },
  salesToNext: {
    type: Number,
    default: 0
  }
});

// State
const showInfo = ref(false);

// Computed
const trustProgress = computed(() => {
  if (!props.nextTier) return 100;

  const current = props.currentTier.requiredSales;
  const next = props.nextTier.requiredSales;
  const needed = props.salesToNext;

  const earned = next - needed;
  const range = next - current;

  return Math.min(100, Math.round((earned / range) * 100));
});

// Methods
function formatListingLimit(limit) {
  if (limit === Infinity) {
    return '無限制';
  }
  return `${limit.toLocaleString('zh-TW')}P`;
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.trust-level-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: white;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.card-body {
  padding: 30px;
}

.card-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    color: #3498db;
  }
}

.info-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 5px;

  &:hover {
    color: #2980b9;
    transform: scale(1.1);
  }
}

// Info Tooltip
.info-tooltip {
  background-color: #e3f2fd;
  border-left: 4px solid #3498db;
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 20px;

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #1e1e1e;
    line-height: 1.5;
    margin: 0;
  }
}

// Current Trust Level
.current-trust {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 10px;
}

.trust-icon {
  font-size: 50px;
  color: #3498db;
  line-height: 1;
}

.trust-info {
  flex: 1;
}

.trust-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1e1e1e;
  margin: 0 0 5px 0;
}

.trust-tier {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #3498db;
  font-weight: 500;
  margin: 0;
}

// Listing Limit Section
.listing-limit-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 25px;
}

.limit-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 16px;
    color: #3498db;
  }
}

.limit-value {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #3498db;
}

// Next Trust Section
.next-trust-section {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #555;
}

.progress-percentage {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #3498db;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #5dade2 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.next-trust-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.next-trust-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #555;
  margin: 0;
}

.sales-needed {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  color: #777;
  margin: 0;

  .sales-value {
    font-weight: 600;
    color: #3498db;
  }
}

// Max Trust Badge
.max-trust-badge {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #3498db 0%, #5dade2 100%);
  color: white;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  i {
    font-size: 20px;
  }
}

// Responsive Design
@media (max-width: 991.98px) {
  .card-body {
    padding: 25px;
  }

  .trust-icon {
    font-size: 45px;
  }

  .trust-name {
    font-size: 20px;
  }
}

@media (max-width: 575.98px) {
  .card-body {
    padding: 20px;
  }

  .current-trust {
    padding: 15px;
    gap: 15px;
  }

  .trust-icon {
    font-size: 40px;
  }

  .trust-name {
    font-size: 18px;
  }

  .listing-limit-section {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .limit-value {
    font-size: 16px;
  }
}
</style>
