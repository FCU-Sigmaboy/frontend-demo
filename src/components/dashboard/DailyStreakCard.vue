<template>
  <div class="daily-streak-card card">
    <div class="card-body">
      <div class="card-header-section">
        <h3 class="card-title">
          <i class="bi bi-fire"></i>
          每日簽到
        </h3>
      </div>

      <!-- Streak Display -->
      <div class="streak-display">
        <div class="streak-icon">
          🔥
        </div>
        <div class="streak-count">
          <span class="count-value">{{ streakDays }}</span>
          <span class="count-unit">天</span>
        </div>
        <p class="streak-label">連續簽到</p>
      </div>

      <!-- Next Milestone -->
      <div class="milestone-section">
        <div class="milestone-info">
          <span class="milestone-label">下個里程碑</span>
          <span class="milestone-value">{{ nextMilestone }}天</span>
        </div>
        <div class="milestone-progress">
          <div class="progress-bar" :style="{ width: `${milestoneProgress}%` }"></div>
        </div>
        <p class="milestone-reward">獎勵: {{ nextReward }}P</p>
      </div>

      <!-- Sign-in Button -->
      <button
        v-if="!hasSignedInToday"
        class="signin-btn"
        @click="handleSignIn"
        :disabled="isSigningIn"
      >
        <i class="bi bi-check-circle"></i>
        <span v-if="!isSigningIn">立即簽到</span>
        <span v-else>簽到中...</span>
      </button>

      <div v-else class="signed-in-badge">
        <i class="bi bi-check-circle-fill"></i>
        今日已簽到
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { calculateStreakReward } from '@/api/pointsAPI';

const props = defineProps({
  streakDays: {
    type: Number,
    default: 0
  },
  hasSignedInToday: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['sign-in']);

// State
const isSigningIn = ref(false);

// Milestone definitions
const MILESTONES = [1, 3, 7, 14, 30, 100];

// Computed
const nextMilestone = computed(() => {
  const current = props.streakDays;
  const next = MILESTONES.find(m => m > current);
  return next || 100;
});

const milestoneProgress = computed(() => {
  const current = props.streakDays;
  const next = nextMilestone.value;

  // Find previous milestone
  const prevMilestoneIndex = MILESTONES.findIndex(m => m > current) - 1;
  const prev = prevMilestoneIndex >= 0 ? MILESTONES[prevMilestoneIndex] : 0;

  const range = next - prev;
  const progress = current - prev;

  return Math.min(100, Math.round((progress / range) * 100));
});

const nextReward = computed(() => {
  return calculateStreakReward(nextMilestone.value);
});

// Methods
async function handleSignIn() {
  if (isSigningIn.value) return;

  try {
    isSigningIn.value = true;
    emit('sign-in');
  } finally {
    // Reset after a delay
    setTimeout(() => {
      isSigningIn.value = false;
    }, 2000);
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.daily-streak-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: white;
  transition: all 0.3s;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.card-body {
  padding: 30px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header-section {
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
    color: #ff6b6b;
  }
}

// Streak Display
.streak-display {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.streak-icon {
  font-size: 60px;
  margin-bottom: 10px;
  animation: flameFlicker 1.5s ease-in-out infinite;
}

@keyframes flameFlicker {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
}

.streak-count {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
  margin-bottom: 8px;
}

.count-value {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #ff6b6b;
  line-height: 1;
}

.count-unit {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #ff6b6b;
}

.streak-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;
  margin: 0;
}

// Milestone Section
.milestone-section {
  margin-bottom: 20px;
}

.milestone-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.milestone-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #555;
}

.milestone-value {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #ff6b6b;
}

.milestone-progress {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b 0%, #ff8787 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.milestone-reward {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  color: #777;
  text-align: center;
  margin: 0;
}

// Sign-in Button
.signin-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: auto;

  i {
    font-size: 18px;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff5252 0%, #ff6b6b 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.signed-in-badge {
  width: 100%;
  padding: 14px 20px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 2px solid #4caf50;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: auto;

  i {
    font-size: 18px;
  }
}

// Responsive Design
@media (max-width: 991.98px) {
  .card-body {
    padding: 25px;
  }

  .streak-icon {
    font-size: 50px;
  }

  .count-value {
    font-size: 36px;
  }

  .count-unit {
    font-size: 18px;
  }
}

@media (max-width: 575.98px) {
  .card-body {
    padding: 20px;
  }

  .streak-icon {
    font-size: 45px;
  }

  .count-value {
    font-size: 32px;
  }

  .count-unit {
    font-size: 16px;
  }
}
</style>
