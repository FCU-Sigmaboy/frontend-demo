<template>
  <div class="combined-achievements-section">
    <div class="achievements-header">
      <h3 class="achievements-title">
        成就與徽章
        <span v-if="showCarbonTotal" class="carbon-total">總碳足跡節省: {{ totalCarbon.toFixed(1) }} kg</span>
      </h3>
      <button class="view-all-btn" @click="showModal = true">
        <i class="bi bi-grid-3x3-gap"></i>
        查看全部
      </button>
    </div>

    <!-- Horizontal Achievement Row -->
    <div class="achievements-row-container">
      <div class="achievements-row" :class="{ 'expanded': isExpanded }">
        <div
          v-for="(achievement, index) in displayedAchievements"
          :key="achievement.id"
          :class="['achievement-item', {
            'unlocked': achievement.unlocked,
            'current': index === currentAchievementIndex
          }]"
          @click="onAchievementClick(achievement, index)"
        >
          <div class="achievement-icon-wrapper">
            <!-- Badge type (with image) -->
            <img
              v-if="achievement.type === 'badge'"
              :src="achievement.image"
              :alt="achievement.label"
              class="achievement-image"
            />
            <!-- Trophy type (with emoji icon) -->
            <span v-else class="achievement-icon">{{ achievement.icon }}</span>

            <!-- Lock icon for locked achievements -->
            <div v-if="!achievement.unlocked" class="lock-overlay">
              <i class="bi bi-lock-fill"></i>
            </div>

            <!-- Progress badge -->
            <div v-if="!achievement.unlocked && showProgress" class="progress-badge">
              {{ achievement.progress }}%
            </div>

          </div>
          <span class="achievement-label">{{ achievement.label }}</span>
        </div>

        <!-- Expand Indicator -->
        <div
          v-if="!isExpanded && allAchievements.length > 1"
          class="expand-indicator"
          @click="expandRow"
        >
          <span class="achievement-count">+{{ allAchievements.length - 1 }}</span>
          <i class="bi bi-chevron-right"></i>
        </div>
      </div>
    </div>

    <!-- Achievement Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>成就與徽章</h4>
          <button class="modal-close" @click="showModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Category Tabs -->
          <div class="category-tabs">
            <button
              :class="['category-tab', { active: activeCategory === 'all' }]"
              @click="activeCategory = 'all'"
            >
              全部 ({{ allAchievements.length }})
            </button>
            <button
              :class="['category-tab', { active: activeCategory === 'eco' }]"
              @click="activeCategory = 'eco'"
            >
              環保徽章 ({{ ecoBadges.length }})
            </button>
            <button
              :class="['category-tab', { active: activeCategory === 'transaction' }]"
              @click="activeCategory = 'transaction'"
            >
              交易成就 ({{ transactionTrophies.length }})
            </button>
          </div>

          <div class="achievements-grid">
            <div
              v-for="achievement in filteredAchievements"
              :key="achievement.id"
              :class="['achievement-grid-item', {
                'unlocked': achievement.unlocked,
                'selected': selectedAchievements.includes(achievement.id)
              }]"
              @click="toggleAchievementSelection(achievement.id)"
            >
              <div class="achievement-icon-wrapper">
                <!-- Badge type -->
                <img
                  v-if="achievement.type === 'badge'"
                  :src="achievement.image"
                  :alt="achievement.label"
                  class="achievement-image"
                />
                <!-- Trophy type -->
                <span v-else class="achievement-icon">{{ achievement.icon }}</span>

                <!-- Lock icon for locked -->
                <div v-if="!achievement.unlocked" class="lock-overlay">
                  <i class="bi bi-lock-fill"></i>
                </div>

                <!-- Progress badge -->
                <div v-if="!achievement.unlocked && showProgress" class="progress-badge">
                  {{ achievement.progress }}%
                </div>
              </div>
              <span class="achievement-label">{{ achievement.label }}</span>
              <span v-if="!achievement.unlocked && showThreshold" class="achievement-requirement">
                {{ achievement.threshold }}
              </span>
              <span v-if="achievement.points" class="achievement-points">+{{ achievement.points }}P</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="saveAchievementSelection">儲存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';

// Import badge images
import badge1 from '../assets/badges/1badge.png';
import badge2 from '../assets/badges/2badge.png';
import badge3 from '../assets/badges/3badge.png';
import badge4 from '../assets/badges/4badge.png';

const props = defineProps({
  totalCarbon: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  showCarbonTotal: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['achievement-click']);

// State
const isExpanded = ref(false);
const showModal = ref(false);
const selectedAchievements = ref([]);
const currentAchievementIndex = ref(0);
const activeCategory = ref('all');

// Eco badges based on carbon savings
const ecoBadges = computed(() => {
  const carbon = props.totalCarbon;

  return [
    {
      id: 'eco_1',
      type: 'badge',
      category: 'eco',
      label: '環保新手',
      image: badge1,
      description: '減少 10 公斤碳排放，開啟環保旅程',
      threshold: '10 kg',
      unlocked: carbon >= 10,
      progress: Math.min((carbon / 10) * 100, 100),
      remainingKg: Math.max(10 - carbon, 0)
    },
    {
      id: 'eco_2',
      type: 'badge',
      category: 'eco',
      label: '環保達人',
      image: badge2,
      description: '減少 50 公斤碳排放，感謝您的貢獻',
      threshold: '50 kg',
      unlocked: carbon >= 50,
      progress: Math.min((carbon / 50) * 100, 100),
      remainingKg: Math.max(50 - carbon, 0)
    },
    {
      id: 'eco_3',
      type: 'badge',
      category: 'eco',
      label: '環保高手',
      image: badge3,
      description: '減少 100 公斤碳排放，您是環保實踐家',
      threshold: '100 kg',
      unlocked: carbon >= 100,
      progress: Math.min((carbon / 100) * 100, 100),
      remainingKg: Math.max(100 - carbon, 0)
    },
    {
      id: 'eco_4',
      type: 'badge',
      category: 'eco',
      label: '環保大師',
      image: badge4,
      description: '減少 200 公斤碳排放，環保精神值得敬佩',
      threshold: '200 kg',
      unlocked: carbon >= 200,
      progress: Math.min((carbon / 200) * 100, 100),
      remainingKg: Math.max(200 - carbon, 0)
    }
  ];
});

// Transaction trophies based on sales and purchases
const transactionTrophies = computed(() => {
  const sales = props.totalSales;
  const purchases = props.totalPurchases;
  const total = sales + purchases;

  return [
    {
      id: 'first_sale',
      type: 'trophy',
      category: 'transaction',
      label: '首次出售',
      icon: '🎉',
      description: '完成第一筆交易',
      threshold: '1筆',
      points: 10,
      unlocked: sales >= 1,
      progress: Math.min((sales / 1) * 100, 100)
    },
    {
      id: 'seller_5',
      type: 'trophy',
      category: 'transaction',
      label: '新手賣家',
      icon: '📦',
      description: '完成5筆銷售',
      threshold: '5筆',
      points: 20,
      unlocked: sales >= 5,
      progress: Math.min((sales / 5) * 100, 100)
    },
    {
      id: 'seller_10',
      type: 'trophy',
      category: 'transaction',
      label: '活躍賣家',
      icon: '💼',
      description: '完成10筆銷售',
      threshold: '10筆',
      points: 30,
      unlocked: sales >= 10,
      progress: Math.min((sales / 10) * 100, 100)
    },
    {
      id: 'seller_50',
      type: 'trophy',
      category: 'transaction',
      label: '專業賣家',
      icon: '🏆',
      description: '完成50筆銷售',
      threshold: '50筆',
      points: 100,
      unlocked: sales >= 50,
      progress: Math.min((sales / 50) * 100, 100)
    },
    {
      id: 'buyer_10',
      type: 'trophy',
      category: 'transaction',
      label: '購物達人',
      icon: '🛍️',
      description: '完成10筆購買',
      threshold: '10筆',
      points: 30,
      unlocked: purchases >= 10,
      progress: Math.min((purchases / 10) * 100, 100)
    },
    {
      id: 'transaction_100',
      type: 'trophy',
      category: 'transaction',
      label: '百筆交易',
      icon: '⚡',
      description: '累積完成100筆交易',
      threshold: '100筆',
      points: 150,
      unlocked: total >= 100,
      progress: Math.min((total / 100) * 100, 100)
    }
  ];
});

// All achievements combined
const allAchievements = computed(() => {
  return [...ecoBadges.value, ...transactionTrophies.value];
});

// Filtered achievements based on active category
const filteredAchievements = computed(() => {
  if (activeCategory.value === 'eco') {
    return ecoBadges.value;
  } else if (activeCategory.value === 'transaction') {
    return transactionTrophies.value;
  }
  return allAchievements.value;
});

// Displayed achievements (selected ones or all if expanded)
const displayedAchievements = computed(() => {
  if (isExpanded.value) {
    return allAchievements.value;
  }
  // Show only selected achievements, or first achievement if none selected
  if (selectedAchievements.value.length > 0) {
    return allAchievements.value.filter(a => selectedAchievements.value.includes(a.id));
  }
  return [allAchievements.value[0]];
});

// Load saved achievement selections from localStorage
onMounted(() => {
  const saved = localStorage.getItem('selectedCombinedAchievements');
  if (saved) {
    selectedAchievements.value = JSON.parse(saved);
  } else {
    // Default: select first unlocked achievement or first achievement
    const firstUnlocked = allAchievements.value.findIndex(a => a.unlocked);
    if (firstUnlocked >= 0) {
      selectedAchievements.value = [allAchievements.value[firstUnlocked].id];
      currentAchievementIndex.value = firstUnlocked;
    } else {
      selectedAchievements.value = [allAchievements.value[0].id];
    }
  }
});

function expandRow() {
  isExpanded.value = true;
}

function onAchievementClick(achievement, index) {
  if (!isExpanded.value) {
    // If collapsed, expand on click
    expandRow();
  } else {
    // If expanded, emit click event
    emit('achievement-click', achievement);
  }
  currentAchievementIndex.value = index;
}

function toggleAchievementSelection(achievementId) {
  const index = selectedAchievements.value.indexOf(achievementId);
  if (index > -1) {
    selectedAchievements.value.splice(index, 1);
  } else {
    selectedAchievements.value.push(achievementId);
  }
}

function saveAchievementSelection() {
  localStorage.setItem('selectedCombinedAchievements', JSON.stringify(selectedAchievements.value));
  isExpanded.value = false;
  showModal.value = false;
  // Update current achievement index to first selected
  if (selectedAchievements.value.length > 0) {
    const firstSelected = allAchievements.value.findIndex(a => selectedAchievements.value.includes(a.id));
    if (firstSelected >= 0) {
      currentAchievementIndex.value = firstSelected;
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.combined-achievements-section {
  position: relative;

  .achievements-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    flex-wrap: wrap;
    gap: 10px;

    .achievements-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;

      .carbon-total {
        font-size: 14px;
        font-weight: 500;
        color: $primary;
        background: #e6f4f0;
        padding: 6px 12px;
        border-radius: 20px;
      }
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

// Horizontal Achievement Row
.achievements-row-container {
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

.achievements-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  transition: all 0.3s ease;
  min-width: fit-content;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  min-width: 70px;
  flex-shrink: 0;
  transition: all 0.3s;

  .achievement-icon-wrapper {
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
    overflow: hidden;
    transition: all 0.3s;

    .achievement-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: filter 0.3s, opacity 0.3s;
      filter: grayscale(100%) brightness(0.8);
      opacity: 0.5;
      padding: 8px;
    }

    .achievement-icon {
      font-size: 32px;
      line-height: 1;
      transition: filter 0.3s, opacity 0.3s;
      filter: grayscale(100%);
      opacity: 0.5;
    }

    .lock-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.4);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      i {
        font-size: 20px;
        color: white;
      }
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
      z-index: 2;
    }

    .check-mark {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary;
      background: white;
      border-radius: 50%;
      z-index: 2;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      i {
        font-size: 18px;
        line-height: 1;
      }
    }
  }

  .achievement-label {
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
    .achievement-icon-wrapper {
      border-color: $primary;
      background-color: #e6f4f0;

      .achievement-image,
      .achievement-icon {
        filter: grayscale(0%) brightness(1);
        opacity: 1;
      }

      .lock-overlay {
        display: none;
      }
    }

    .achievement-label {
      color: #1e1e1e;
    }
  }

  &.current {
    .achievement-icon-wrapper {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }
  }

  &:hover {
    .achievement-icon-wrapper {
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
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 0;

  .achievement-count {
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

    .achievement-count,
    i {
      color: $primary;
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
  max-width: 700px;
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

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .category-tab {
    padding: 8px 16px;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;

    &:hover {
      background: #e6f4f0;
      border-color: $primary;
      color: $primary;
    }

    &.active {
      background: $primary;
      border-color: $primary;
      color: white;
    }
  }
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.achievement-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s;

  .achievement-icon-wrapper {
    width: 80px;
    height: 80px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f0f7f5;

    .achievement-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: filter 0.3s, opacity 0.3s;
      filter: grayscale(100%) brightness(0.8);
      opacity: 0.5;
    }

    .achievement-icon {
      font-size: 48px;
      transition: filter 0.3s, opacity 0.3s;
      filter: grayscale(100%);
      opacity: 0.5;
    }

    .lock-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.4);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      i {
        font-size: 24px;
        color: white;
      }
    }

    .check-mark {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary;
      background: white;
      border-radius: 50%;
      z-index: 2;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      i {
        font-size: 20px;
        line-height: 1;
      }
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
      z-index: 2;
    }
  }

  .achievement-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #1e1e1e;
    text-align: center;
    margin-bottom: 4px;
  }

  .achievement-requirement {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    color: #999;
    text-align: center;
    margin-bottom: 4px;
  }

  .achievement-points {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: $primary;
    text-align: center;
  }

  &.unlocked {
    border-color: $primary;
    background: #f0f7f5;

    .achievement-icon-wrapper {
      .achievement-image,
      .achievement-icon {
        filter: grayscale(0%) brightness(1);
        opacity: 1;
      }

      .lock-overlay {
        display: none;
      }
    }
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
  .achievements-header {
    .achievements-title {
      font-size: 16px !important;
      flex-direction: column;
      align-items: flex-start !important;

      .carbon-total {
        font-size: 13px;
      }
    }

    .view-all-btn {
      font-size: 12px;
      padding: 5px 10px;
    }
  }

  .achievements-row {
    align-items: flex-start;
  }

  .achievement-item {
    min-width: 60px;

    .achievement-icon-wrapper {
      width: 50px;
      height: 50px;

      .achievement-icon {
        font-size: 28px;
      }

      .lock-overlay i {
        font-size: 16px;
      }
    }

    .achievement-label {
      font-size: 10px;
    }
  }

  .expand-indicator {
    width: 50px;
    height: 50px;
    min-width: 50px;
    margin-top: 0;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .achievements-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .achievement-grid-item {
    .achievement-icon-wrapper {
      width: 60px;
      height: 60px;

      .achievement-icon {
        font-size: 36px;
      }

      .lock-overlay i {
        font-size: 20px;
      }
    }

    .achievement-label {
      font-size: 12px;
    }
  }
}

@media (max-width: 575.98px) {
  .achievements-row {
    align-items: flex-start;
  }

  .achievement-item {
    min-width: 55px;

    .achievement-icon-wrapper {
      width: 45px;
      height: 45px;

      .achievement-icon {
        font-size: 24px;
      }

      .lock-overlay i {
        font-size: 14px;
      }
    }

    .achievement-label {
      font-size: 9px;
    }
  }

  .expand-indicator {
    width: 45px;
    height: 45px;
    min-width: 45px;
    margin-top: 0;

    .achievement-count {
      font-size: 10px;
    }

    i {
      font-size: 14px;
    }
  }

  .achievements-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
