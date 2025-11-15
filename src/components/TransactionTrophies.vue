<template>
  <div class="transaction-trophies-section">
    <div class="trophies-header">
      <h3 class="trophies-title">交易成就</h3>
      <button class="view-all-btn" @click="showModal = true">
        <i class="bi bi-grid-3x3-gap"></i>
        查看全部
      </button>
    </div>
    
    <!-- Horizontal Trophy Row -->
    <div class="trophies-row-container">
      <div class="trophies-row" :class="{ 'expanded': isExpanded }">
        <div
          v-for="(trophy, index) in displayedTrophies"
          :key="trophy.id"
          :class="['trophy-item', { 'unlocked': trophy.unlocked, 'current': index === currentTrophyIndex }]"
          @click="onTrophyClick(trophy, index)"
        >
          <div class="trophy-icon-wrapper">
            <span class="trophy-icon">{{ trophy.icon }}</span>
            <div v-if="!trophy.unlocked && showProgress" class="progress-badge">
              {{ trophy.progress }}%
            </div>
          </div>
          <span class="trophy-label">{{ trophy.label }}</span>
        </div>
        
        <!-- Expand Indicator -->
        <div 
          v-if="!isExpanded && trophies.length > 1" 
          class="expand-indicator"
          @click="expandRow"
        >
          <span class="trophy-count">+{{ trophies.length - 1 }}</span>
          <i class="bi bi-chevron-right"></i>
        </div>
      </div>
    </div>

    <!-- Trophy Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>交易成就</h4>
          <button class="modal-close" @click="showModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="trophies-grid">
            <div
              v-for="trophy in trophies"
              :key="trophy.id"
              :class="['trophy-grid-item', { 'unlocked': trophy.unlocked, 'selected': selectedTrophies.includes(trophy.id) }]"
              @click="toggleTrophySelection(trophy.id)"
            >
              <div class="trophy-icon-wrapper">
                <span class="trophy-icon">{{ trophy.icon }}</span>
                <div v-if="trophy.unlocked" class="check-mark">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
                <div v-if="!trophy.unlocked && showProgress" class="progress-badge">
                  {{ trophy.progress }}%
                </div>
              </div>
              <span class="trophy-label">{{ trophy.label }}</span>
              <span v-if="!trophy.unlocked && showThreshold" class="trophy-requirement">{{ trophy.threshold }}</span>
              <span v-if="trophy.unlocked" class="trophy-points">+{{ trophy.points }}P</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="saveTrophySelection">儲存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';

const props = defineProps({
  totalSales: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  showThreshold: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['trophy-click']);

// State
const isExpanded = ref(false);
const showModal = ref(false);
const selectedTrophies = ref([]);
const currentTrophyIndex = ref(0);

// Calculate trophies based on transactions
const trophies = computed(() => {
  const sales = props.totalSales;
  const purchases = props.totalPurchases;
  const total = sales + purchases;

  return [
    {
      id: 'first_sale',
      label: '首次出售',
      icon: '🎉',
      description: '完成第一筆交易',
      threshold: '1筆',
      points: 10,
      unlocked: sales >= 1,
      progress: Math.min((sales / 1) * 100, 100),
      category: 'sales'
    },
    {
      id: 'seller_5',
      label: '新手賣家',
      icon: '📦',
      description: '完成5筆銷售',
      threshold: '5筆',
      points: 20,
      unlocked: sales >= 5,
      progress: Math.min((sales / 5) * 100, 100),
      category: 'sales'
    },
    {
      id: 'seller_10',
      label: '活躍賣家',
      icon: '💼',
      description: '完成10筆銷售',
      threshold: '10筆',
      points: 30,
      unlocked: sales >= 10,
      progress: Math.min((sales / 10) * 100, 100),
      category: 'sales'
    },
    {
      id: 'seller_50',
      label: '專業賣家',
      icon: '🏆',
      description: '完成50筆銷售',
      threshold: '50筆',
      points: 100,
      unlocked: sales >= 50,
      progress: Math.min((sales / 50) * 100, 100),
      category: 'sales'
    },
    {
      id: 'buyer_10',
      label: '購物達人',
      icon: '🛍️',
      description: '完成10筆購買',
      threshold: '10筆',
      points: 30,
      unlocked: purchases >= 10,
      progress: Math.min((purchases / 10) * 100, 100),
      category: 'purchases'
    },
    {
      id: 'transaction_100',
      label: '百筆交易',
      icon: '⚡',
      description: '累積完成100筆交易',
      threshold: '100筆',
      points: 150,
      unlocked: total >= 100,
      progress: Math.min((total / 100) * 100, 100),
      category: 'total'
    }
  ];
});

// Load saved trophy selections
onMounted(() => {
  const saved = localStorage.getItem('selectedTransactionTrophies');
  if (saved) {
    selectedTrophies.value = JSON.parse(saved);
  } else {
    const firstUnlocked = trophies.value.findIndex(t => t.unlocked);
    if (firstUnlocked >= 0) {
      selectedTrophies.value = [trophies.value[firstUnlocked].id];
      currentTrophyIndex.value = firstUnlocked;
    } else {
      selectedTrophies.value = [trophies.value[0].id];
    }
  }
});

// Displayed trophies
const displayedTrophies = computed(() => {
  if (isExpanded.value) {
    return trophies.value;
  }
  if (selectedTrophies.value.length > 0) {
    return trophies.value.filter(t => selectedTrophies.value.includes(t.id));
  }
  return [trophies.value[0]];
});

function expandRow() {
  isExpanded.value = true;
}

function onTrophyClick(trophy, index) {
  if (!isExpanded.value) {
    expandRow();
  } else {
    emit('trophy-click', trophy);
  }
  currentTrophyIndex.value = index;
}

function toggleTrophySelection(trophyId) {
  const index = selectedTrophies.value.indexOf(trophyId);
  if (index > -1) {
    selectedTrophies.value.splice(index, 1);
  } else {
    selectedTrophies.value.push(trophyId);
  }
}

function saveTrophySelection() {
  localStorage.setItem('selectedTransactionTrophies', JSON.stringify(selectedTrophies.value));
  isExpanded.value = false;
  showModal.value = false;
  if (selectedTrophies.value.length > 0) {
    const firstSelected = trophies.value.findIndex(t => selectedTrophies.value.includes(t.id));
    if (firstSelected >= 0) {
      currentTrophyIndex.value = firstSelected;
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.transaction-trophies-section {
  position: relative;
  margin-top: 20px;

  .trophies-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    flex-wrap: wrap;
    gap: 10px;

    .trophies-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
    }

    .view-all-btn {
      background: none;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 6px 12px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #555;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s;

      &:hover {
        border-color: $primary;
        color: $primary;
        background: #f0f7f5;
      }
    }
  }
}

// Horizontal Trophy Row
.trophies-row-container {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }
}

.trophies-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  transition: all 0.3s ease;
  min-width: fit-content;
}

.trophy-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  min-width: 70px;
  flex-shrink: 0;
  transition: all 0.3s;

  .trophy-icon-wrapper {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f7f5;
    border: 2px solid #e0e0e0;
    margin-bottom: 6px;
    transition: all 0.3s;

    .trophy-icon {
      font-size: 32px;
      line-height: 1;
      transition: filter 0.3s;
      filter: grayscale(100%) opacity(0.6);
    }

    .progress-badge {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(111, 184, 165, 0.9);
      color: white;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      padding: 2px 0;
    }

    .check-mark {
      position: absolute;
      top: -2px;
      right: -2px;
      color: $primary;
      font-size: 18px;
      background: white;
      border-radius: 50%;
    }
  }

  .trophy-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    color: #999;
    font-weight: 500;
    text-align: center;
    line-height: 1.3;
    transition: all 0.3s;
    word-break: break-word;
    min-height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.unlocked {
    .trophy-icon-wrapper {
      border-color: $primary;
      background-color: #e6f4f0;

      .trophy-icon {
        filter: grayscale(0%) opacity(1);
      }
    }
    .trophy-label {
      color: #1e1e1e;
    }
  }

  &.current {
    .trophy-icon-wrapper {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }
  }

  &:hover {
    .trophy-icon-wrapper {
      transform: scale(1.05);
    }
  }
}

.expand-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-width: 60px;
  height: 60px;
  border: 2px dashed #ccc;
  border-radius: 50%;
  background: #f9f9f9;
  transition: all 0.3s;
  gap: 4px;

  .trophy-count {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #999;
  }

  i {
    font-size: 16px;
    color: #999;
  }

  &:hover {
    border-color: $primary;
    background: #f0f7f5;
    color: $primary;

    .trophy-count,
    i {
      color: $primary;
    }
  }
}

// Modal Styles (same as AchievementBadges)
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
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s;
  overflow: hidden;
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;

  h4 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: #1e1e1e;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s;

    &:hover {
      background: #f0f0f0;
      color: #1e1e1e;
    }
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.trophies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.trophy-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s;

  .trophy-icon-wrapper {
    width: 80px;
    height: 80px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .trophy-icon {
      font-size: 48px;
    }
  }

  .trophy-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #1e1e1e;
    text-align: center;
    margin-bottom: 4px;
  }

  .trophy-requirement {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    color: #999;
    text-align: center;
    margin-bottom: 4px;
  }

  .trophy-points {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: $primary;
    text-align: center;
  }

  &.unlocked {
    border-color: $primary;
    background: #f0f7f5;
  }

  &.selected {
    border-color: $primary;
    background: #e6f4f0;
    box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.2);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;

  button {
    padding: 10px 20px;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    border: none;

    &.btn-secondary {
      background: #f0f0f0;
      color: #555;

      &:hover {
        background: #e0e0e0;
      }
    }

    &.btn-primary {
      background: $primary;
      color: white;

      &:hover {
        background: darken($primary, 10%);
      }
    }
  }
}

// Responsive Design
@media (max-width: 767.98px) {
  .trophies-header {
    .trophies-title {
      font-size: 16px !important;
    }

    .view-all-btn {
      font-size: 12px;
      padding: 5px 10px;
    }
  }

  .trophy-item {
    min-width: 60px;

    .trophy-icon-wrapper {
      width: 50px;
      height: 50px;

      .trophy-icon {
        font-size: 28px;
      }
    }

    .trophy-label {
      font-size: 10px;
    }
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .trophies-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .trophy-grid-item {
    .trophy-icon-wrapper {
      width: 60px;
      height: 60px;

      .trophy-icon {
        font-size: 36px;
      }
    }

    .trophy-label {
      font-size: 12px;
    }
  }
}

@media (max-width: 575.98px) {
  .trophy-item {
    min-width: 55px;

    .trophy-icon-wrapper {
      width: 45px;
      height: 45px;

      .trophy-icon {
        font-size: 24px;
      }
    }

    .trophy-label {
      font-size: 9px;
    }
  }

  .trophies-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
