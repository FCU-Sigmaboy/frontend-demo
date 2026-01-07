<template>
  <div class="level-progress-card card">
    <div class="card-body">
      <div class="card-header-section">
        <h3 class="card-title">
          <i class="bi bi-trophy"></i>
          等級進度
        </h3>
      </div>

      <!-- Current Level Display -->
      <div class="current-level">
        <div class="level-icon">{{ currentTier.icon }}</div>
        <div class="level-info">
          <h4 class="level-name">{{ currentTier.name }}</h4>
          <p class="level-tier">等級 {{ currentTier.tier }}</p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">升級進度</span>
          <span class="progress-percentage">{{ progressPercentage }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${progressPercentage}%` }">
            <div class="progress-shine"></div>
          </div>
        </div>
      </div>

      <!-- Points to Next Level -->
      <div v-if="nextTier" class="next-level-section">
        <div class="next-level-icon">{{ nextTier.icon }}</div>
        <div class="next-level-info">
          <p class="next-level-name">下個等級: {{ nextTier.name }}</p>
          <p class="points-needed">
            還需 <span class="points-value">{{ pointsToNext }}</span> 點數
          </p>
        </div>
      </div>

      <!-- Max Level Reached -->
      <div v-else class="max-level-badge">
        <i class="bi bi-award-fill"></i>
        已達最高等級！
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    currentTier: {
      type: Object,
      required: true,
    },
    nextTier: {
      type: Object,
      default: null,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    pointsToNext: {
      type: Number,
      default: 0,
    },
  })

  // Computed
  const formattedPointsToNext = computed(() => {
    return props.pointsToNext.toLocaleString('zh-TW')
  })
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .level-progress-card {
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
      color: #f39c12;
    }
  }

  // Current Level Display
  .current-level {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 25px;
    padding: 20px;
    background: linear-gradient(135deg, #fff9e6 0%, #fff3d1 100%);
    border-radius: 10px;
  }

  .level-icon {
    font-size: 60px;
    line-height: 1;
  }

  .level-info {
    flex: 1;
  }

  .level-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0 0 5px 0;
  }

  .level-tier {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #f39c12;
    font-weight: 500;
    margin: 0;
  }

  // Progress Section
  .progress-section {
    margin-bottom: 25px;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .progress-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #555;
  }

  .progress-percentage {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #f39c12;
  }

  .progress-bar-container {
    width: 100%;
    height: 12px;
    background-color: #f0f0f0;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #f39c12 0%, #f5b041 100%);
    border-radius: 6px;
    transition: width 0.5s ease;
    position: relative;
    overflow: hidden;
  }

  .progress-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.5) 50%,
      transparent 100%
    );
    animation: shine 2s infinite;
  }

  @keyframes shine {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  // Next Level Section
  .next-level-section {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 8px;
  }

  .next-level-icon {
    font-size: 40px;
    line-height: 1;
  }

  .next-level-info {
    flex: 1;
  }

  .next-level-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #555;
    margin: 0 0 5px 0;
  }

  .points-needed {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #777;
    margin: 0;

    .points-value {
      font-weight: 600;
      color: #f39c12;
    }
  }

  // Max Level Badge
  .max-level-badge {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #f39c12 0%, #f5b041 100%);
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

    .level-icon {
      font-size: 50px;
    }

    .level-name {
      font-size: 20px;
    }

    .next-level-icon {
      font-size: 35px;
    }
  }

  @media (max-width: 575.98px) {
    .card-body {
      padding: 20px;
    }

    .current-level {
      padding: 15px;
      gap: 15px;
    }

    .level-icon {
      font-size: 45px;
    }

    .level-name {
      font-size: 18px;
    }

    .next-level-section {
      padding: 12px;
      gap: 12px;
    }

    .next-level-icon {
      font-size: 30px;
    }
  }
</style>
