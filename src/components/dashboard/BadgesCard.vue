<template>
  <div class="badges-card card">
    <div class="card-body">
      <div class="card-header-section">
        <h3 class="card-title">
          <i class="bi bi-award"></i>
          成就徽章
        </h3>
        <div class="badge-count">
          <span class="count-value">{{ earnedCount }}</span>
          <span class="count-label">個徽章</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="badges.length === 0" class="empty-state">
        <i class="bi bi-award"></i>
        <p>尚未獲得任何徽章</p>
        <small>完成交易、連續簽到來獲得徽章！</small>
      </div>

      <!-- Badges Grid -->
      <div v-else class="badges-grid">
        <div
          v-for="badge in badges"
          :key="badge.badge_id || badge.id"
          class="badge-item"
          :class="`rarity-${badge.rarity}`"
          @click="selectBadge(badge)"
        >
          <div class="badge-icon-wrapper">
            <span class="badge-icon">{{ badge.icon }}</span>
            <div class="rarity-glow"></div>
          </div>
          <h5 class="badge-name">{{ badge.name }}</h5>
          <p class="badge-description">{{ badge.description }}</p>
          <div class="badge-footer">
            <span class="badge-rarity">{{ getRarityLabel(badge.rarity) }}</span>
            <span class="badge-points">+{{ badge.points_reward || badge.points_rewarded }}P</span>
          </div>
        </div>
      </div>

      <!-- Badge Detail Modal -->
      <div v-if="selectedBadge" class="modal-overlay" @click="selectedBadge = null">
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="selectedBadge = null">
            <i class="bi bi-x-lg"></i>
          </button>
          <div class="modal-badge-icon" :class="`rarity-${selectedBadge.rarity}`">
            {{ selectedBadge.icon }}
          </div>
          <h4 class="modal-badge-name">{{ selectedBadge.name }}</h4>
          <p class="modal-badge-description">{{ selectedBadge.description }}</p>
          <div class="modal-badge-details">
            <div class="detail-item">
              <span class="detail-label">稀有度</span>
              <span class="detail-value">{{ getRarityLabel(selectedBadge.rarity) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">獎勵點數</span>
              <span class="detail-value">{{ selectedBadge.points_rewarded }}P</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">獲得日期</span>
              <span class="detail-value">{{ formatDate(selectedBadge.earned_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  badges: {
    type: Array,
    default: () => []
  },
  earnedCount: {
    type: Number,
    default: 0
  }
});

// State
const selectedBadge = ref(null);

// Methods
function getRarityLabel(rarity) {
  const labels = {
    common: '普通',
    uncommon: '稀有',
    rare: '珍稀',
    epic: '史詩',
    legendary: '傳說'
  };
  return labels[rarity] || rarity;
}

function selectBadge(badge) {
  selectedBadge.value = badge;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.badges-card {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
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
    color: #e67e22;
  }
}

.badge-count {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.count-value {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #e67e22;
}

.count-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;
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

// Badges Grid
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.badge-item {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  // Rarity specific styles
  &.rarity-common {
    border-color: #95a5a6;

    .rarity-glow {
      background: radial-gradient(circle, rgba(149, 165, 166, 0.2) 0%, transparent 70%);
    }

    .badge-rarity {
      color: #95a5a6;
    }
  }

  &.rarity-uncommon {
    border-color: #27ae60;

    .rarity-glow {
      background: radial-gradient(circle, rgba(39, 174, 96, 0.2) 0%, transparent 70%);
    }

    .badge-rarity {
      color: #27ae60;
    }
  }

  &.rarity-rare {
    border-color: #3498db;

    .rarity-glow {
      background: radial-gradient(circle, rgba(52, 152, 219, 0.2) 0%, transparent 70%);
    }

    .badge-rarity {
      color: #3498db;
    }
  }

  &.rarity-epic {
    border-color: #9b59b6;

    .rarity-glow {
      background: radial-gradient(circle, rgba(155, 89, 182, 0.2) 0%, transparent 70%);
    }

    .badge-rarity {
      color: #9b59b6;
    }
  }

  &.rarity-legendary {
    border-color: #f39c12;

    .rarity-glow {
      background: radial-gradient(circle, rgba(243, 156, 18, 0.2) 0%, transparent 70%);
    }

    .badge-rarity {
      color: #f39c12;
    }
  }
}

.badge-icon-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.badge-icon {
  font-size: 50px;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.rarity-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

.badge-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0 0 8px 0;
}

.badge-description {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  color: #777;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.badge-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.badge-rarity {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-points {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: $primary;
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
  max-width: 400px;
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

.modal-badge-icon {
  font-size: 80px;
  margin-bottom: 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    z-index: 0;
  }

  &.rarity-legendary::before {
    background: radial-gradient(circle, rgba(243, 156, 18, 0.2) 0%, transparent 70%);
  }
}

.modal-badge-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1e1e1e;
  margin: 0 0 10px 0;
}

.modal-badge-description {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  color: #555;
  margin: 0 0 25px 0;
  line-height: 1.5;
}

.modal-badge-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
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
  .badges-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }

  .badge-icon {
    font-size: 45px;
  }
}

@media (max-width: 575.98px) {
  .card-body {
    padding: 20px;
  }

  .badges-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .badge-item {
    padding: 15px;
  }

  .badge-icon {
    font-size: 40px;
  }

  .badge-name {
    font-size: 14px;
  }

  .modal-content {
    padding: 30px 20px;
  }

  .modal-badge-icon {
    font-size: 60px;
  }
}
</style>
