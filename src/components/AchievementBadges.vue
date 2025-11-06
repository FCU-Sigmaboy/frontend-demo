<template>
  <div class="achievements-section">
    <h3 class="achievements-title">
      成就徽章
      <span v-if="showCarbonTotal" class="carbon-total">總碳足跡節省: {{ totalCarbon.toFixed(1) }} kg</span>
    </h3>
    <div class="achievements-stepper">
      <div class="unlocked-line" :style="{ width: unlockedLineWidth }"></div>
      <div
        v-for="badge in badges"
        :key="badge.id"
        :class="['step-item', { 'unlocked': badge.unlocked }]"
        @click="onBadgeClick(badge)"
      >
        <div class="step-circle">
          <img :src="badge.image" :alt="badge.label" class="step-image" />
          <div v-if="!badge.unlocked && showProgress" class="progress-overlay">
            <span class="progress-text">{{ badge.progress }}%</span>
          </div>
        </div>
        <span class="step-label">{{ badge.label }}</span>
        <span v-if="!badge.unlocked && showThreshold" class="step-requirement">{{ badge.threshold }} kg</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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

const emit = defineEmits(['badge-click']);

// Calculate badges based on totalCarbon
const badges = computed(() => {
  const carbon = props.totalCarbon;

  return [
    {
      id: 1,
      label: '環保新手',
      image: badge1,
      description: '減少 10 公斤碳排放，開啟環保旅程',
      threshold: 10,
      unlocked: carbon >= 10,
      progress: Math.min((carbon / 10) * 100, 100)
    },
    {
      id: 2,
      label: '環保達人',
      image: badge2,
      description: '減少 50 公斤碳排放，感謝您的貢獻',
      threshold: 50,
      unlocked: carbon >= 50,
      progress: Math.min((carbon / 50) * 100, 100)
    },
    {
      id: 3,
      label: '環保高手',
      image: badge3,
      description: '減少 100 公斤碳排放，您是環保實踐家',
      threshold: 100,
      unlocked: carbon >= 100,
      progress: Math.min((carbon / 100) * 100, 100)
    },
    {
      id: 4,
      label: '環保大師',
      image: badge4,
      description: '減少 200 公斤碳排放，環保精神值得敬佩',
      threshold: 200,
      unlocked: carbon >= 200,
      progress: Math.min((carbon / 200) * 100, 100)
    }
  ];
});

const unlockedSteps = computed(() => {
  return badges.value.filter(b => b.unlocked).length;
});

const unlockedLineWidth = computed(() => {
  const totalSteps = badges.value.length;
  if (unlockedSteps.value <= 1) {
    return '0%';
  }
  const percentage = (unlockedSteps.value - 1) / (totalSteps - 1);
  return `${percentage * 75}%`;
});

const onBadgeClick = (badge) => {
  emit('badge-click', badge);
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.achievements-section {
  .achievements-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
}

.achievements-stepper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50px;
    left: 12.5%;
    width: 75%;
    height: 4px;
    background: #e9ecef;
    z-index: 0;
    transform: translateY(-50%);
  }

  .unlocked-line {
    position: absolute;
    top: 50px;
    left: 12.5%;
    height: 4px;
    background: $primary;
    z-index: 1;
    transform: translateY(-50%);
    transition: width 0.5s ease;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
    text-align: center;
    cursor: pointer;

    .step-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      background-color: #f0f7f5;
      border: 2px solid #e0e0e0;
      transition: all 0.3s;
      padding: 10px;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;

      .step-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: filter 0.3s;
        filter: grayscale(100%) opacity(0.6);
      }

      .progress-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(111, 184, 165, 0.9);
        padding: 4px 0;
        display: flex;
        align-items: center;
        justify-content: center;

        .progress-text {
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }
      }
    }

    .step-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      font-weight: 500;
      transition: all 0.3s;
    }

    .step-requirement {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #999;
      margin-top: 2px;
    }

    &.unlocked {
      .step-circle {
        border-color: $primary;
        background-color: #e6f4f0;

        .step-image {
          filter: grayscale(0%) opacity(1);
        }
      }
      .step-label {
        color: #1e1e1e;
      }
    }

    &:hover {
      .step-circle {
        transform: scale(1.05);
      }
    }
  }
}

// Responsive Design
@media (max-width: 1199.98px) {
  .achievements-stepper {
    gap: 18px;

    .step-item {
      .step-circle {
        width: 90px;
        height: 90px;
        padding: 9px;
      }

      .step-label {
        font-size: 13px;
      }
    }

    &::before {
      top: 45px;
    }

    .unlocked-line {
      top: 45px;
    }
  }
}

@media (max-width: 991.98px) {
  .achievements-stepper {
    gap: 16px;

    .step-item {
      .step-circle {
        width: 85px;
        height: 85px;
        padding: 8px;
      }

      .step-label {
        font-size: 13px;
      }
    }

    &::before {
      top: 42px;
    }

    .unlocked-line {
      top: 42px;
    }
  }
}

@media (max-width: 767.98px) {
  .achievements-title {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 10px;
    font-size: 16px !important;

    .carbon-total {
      font-size: 13px;
    }
  }

  .achievements-stepper {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 16px;

    &::before {
      display: none;
    }

    .unlocked-line {
      display: none;
    }

    .step-item {
      .step-circle {
        width: 75px;
        height: 75px;
        padding: 8px;
      }

      .step-label {
        font-size: 12px;
      }

      .step-requirement {
        font-size: 10px;
      }
    }
  }
}

@media (max-width: 575.98px) {
  .achievements-title {
    font-size: 15px !important;

    .carbon-total {
      font-size: 12px;
      padding: 4px 10px;
    }
  }

  .achievements-stepper {
    gap: 16px 12px;

    .step-item {
      .step-circle {
        width: 65px;
        height: 65px;
        padding: 6px;
      }

      .step-label {
        font-size: 11px;
      }

      .step-requirement {
        font-size: 9px;
      }
    }
  }
}
</style>
