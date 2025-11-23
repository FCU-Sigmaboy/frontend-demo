<template>
  <div v-if="show" class="notification-modal-overlay" @click.self="close">
    <div class="notification-modal">
      <div class="modal-header">
        <div class="header-icon">
          <i class="bi bi-gift-fill"></i>
        </div>
        <button class="close-btn" @click="close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="modal-body">
        <h2 class="modal-title">恭喜獲得贈點！</h2>
        <p class="modal-subtitle">{{ notification.title }}</p>
        
        <div class="points-display">
          <div class="points-icon">
            <i class="bi bi-coin"></i>
          </div>
          <div class="points-amount">
            +{{ formatPoints(notification.points) }}
          </div>
        </div>

        <div class="notification-message">
          {{ notification.message }}
        </div>

        <div class="notification-details">
          <div class="detail-item">
            <i class="bi bi-calendar-event"></i>
            <span>{{ formatDateTime(notification.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <i class="bi bi-wallet2"></i>
            <span>當前餘額：{{ formatPoints(currentBalance) }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-close" @click="close">
          <i class="bi bi-check-circle-fill"></i>
          知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { usePointsStore } from '@/stores/points';
import { formatPoints } from '@/utils/formatPoints';

const props = defineProps({
  notification: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      title: '',
      message: '',
      points: 0,
      createdAt: new Date().toISOString()
    })
  },
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'update:show']);

const pointsStore = usePointsStore();

const currentBalance = computed(() => pointsStore.currentBalance);

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const close = () => {
  emit('close');
  emit('update:show', false);
};

onMounted(async () => {
  // Refresh points balance when notification is shown
  if (props.show) {
    await pointsStore.fetchProfile(true);
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.notification-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.notification-modal {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  position: relative;
  background: linear-gradient(135deg, $primary, #5fa795);
  padding: 40px 24px 24px;
  text-align: center;

  .header-icon {
    margin: 0 auto 16px;
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: bounce 0.6s ease infinite alternate;

    i {
      font-size: 40px;
      color: white;
    }
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    font-size: 18px;
    color: white;
    cursor: pointer;
    padding: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
  }
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-8px);
  }
}

.modal-body {
  padding: 32px 24px;
  text-align: center;

  .modal-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0 0 8px 0;
  }

  .modal-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0 0 24px 0;
  }
}

.points-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f0f9f7, #e8f5f3);
  border-radius: 16px;

  .points-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, $primary, #5fa795);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 28px;
      color: white;
    }
  }

  .points-amount {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 36px;
    font-weight: 700;
    color: $primary;
    animation: scaleIn 0.5s ease;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.notification-message {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  border-left: 4px solid $primary;
}

.notification-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;

  .detail-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #666;

    i {
      font-size: 16px;
      color: $primary;
    }
  }
}

.modal-footer {
  padding: 0 24px 24px;

  .btn-close {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: $primary;
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 20px;
    }

    &:hover {
      background: #5fa795;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(111, 184, 165, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@media (max-width: 575.98px) {
  .notification-modal {
    margin: 20px;
  }

  .modal-body {
    padding: 24px 20px;

    .modal-title {
      font-size: 20px;
    }

    .modal-subtitle {
      font-size: 14px;
    }
  }

  .points-display {
    padding: 20px;

    .points-amount {
      font-size: 28px;
    }
  }
}
</style>
