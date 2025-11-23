<template>
  <div class="demo-page">
    <AppHeader :user-points="500" />

    <main class="main-content">
      <div class="demo-container">
        <h1>活動贈點系統 - 功能演示</h1>
        <p class="subtitle">這個頁面展示如何測試贈點通知系統</p>

        <div class="demo-section">
          <h2>📢 測試通知系統</h2>
          <p>點擊下方按鈕來模擬接收活動贈點通知：</p>
          
          <div class="test-buttons">
            <button class="demo-btn primary" @click="testBasicNotification">
              <i class="bi bi-gift-fill"></i>
              基本贈點通知
            </button>
            <button class="demo-btn success" @click="testWelcomeBonus">
              <i class="bi bi-hand-thumbs-up-fill"></i>
              新用戶歡迎禮
            </button>
            <button class="demo-btn warning" @click="testEventReward">
              <i class="bi bi-calendar-event-fill"></i>
              節日活動贈點
            </button>
            <button class="demo-btn info" @click="testLevelUpBonus">
              <i class="bi bi-star-fill"></i>
              升級獎勵
            </button>
          </div>
        </div>

        <div class="demo-section">
          <h2>🔔 通知狀態</h2>
          <div class="status-card">
            <div class="status-item">
              <span class="status-label">未讀通知數：</span>
              <span class="status-value">{{ notificationStore.unreadCount }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">總通知數：</span>
              <span class="status-value">{{ notificationStore.notifications.length }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">彈窗狀態：</span>
              <span class="status-value">{{ notificationStore.showNotificationModal ? '顯示中' : '關閉' }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="demo-btn secondary" @click="notificationStore.markAllAsRead()">
              <i class="bi bi-check-all"></i>
              全部標記為已讀
            </button>
            <button class="demo-btn danger" @click="notificationStore.clearAllNotifications()">
              <i class="bi bi-trash-fill"></i>
              清除所有通知
            </button>
          </div>
        </div>

        <div class="demo-section">
          <h2>📋 通知列表</h2>
          <div v-if="notificationStore.notifications.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>目前沒有通知</p>
          </div>
          <div v-else class="notifications-list">
            <div
              v-for="notification in notificationStore.notifications"
              :key="notification.id"
              :class="['notification-item', { unread: !notification.read }]"
              @click="notificationStore.showNotification(notification)"
            >
              <div class="notification-icon">
                <i class="bi bi-gift-fill"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-meta">
                  <span class="notification-points">+{{ formatPoints(notification.points) }}</span>
                  <span class="notification-time">{{ formatRelativeTime(notification.createdAt) }}</span>
                </div>
              </div>
              <div v-if="!notification.read" class="unread-indicator"></div>
            </div>
          </div>
        </div>

        <div class="demo-section">
          <h2>🎯 使用說明</h2>
          <div class="instructions">
            <ol>
              <li>點擊上方測試按鈕會新增一個通知</li>
              <li>通知會自動彈出顯示詳情</li>
              <li>查看右上角的鈴鐺圖示，會顯示未讀通知數量</li>
              <li>點擊鈴鐺圖示可以查看最新通知</li>
              <li>點擊通知列表中的項目可以再次查看</li>
              <li>標記為已讀後，未讀計數會更新</li>
            </ol>
          </div>
        </div>

        <div class="demo-section">
          <h2>🔗 快速連結</h2>
          <div class="quick-links">
            <router-link to="/admin" class="link-btn">
              <i class="bi bi-shield-check"></i>
              管理員控制台
            </router-link>
            <router-link to="/transactions" class="link-btn">
              <i class="bi bi-receipt"></i>
              交易記錄
            </router-link>
            <router-link to="/dashboard" class="link-btn">
              <i class="bi bi-speedometer2"></i>
              用戶儀表板
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import { formatPoints } from '@/utils/formatPoints';

const notificationStore = useNotificationStore();

const testBasicNotification = () => {
  notificationStore.receivePointsReward({
    title: '測試贈點',
    message: '這是一個基本的贈點通知測試',
    points: 100
  });
};

const testWelcomeBonus = () => {
  notificationStore.receivePointsReward({
    title: '新用戶歡迎禮',
    message: '歡迎加入台中易起來！我們送您新手禮包，開始您的交易之旅吧！',
    points: 500
  });
};

const testEventReward = () => {
  notificationStore.receivePointsReward({
    title: '新年紅包',
    message: '恭喜發財！紅包拿來！慶祝農曆新年，全站用戶都有紅包～',
    points: 888
  });
};

const testLevelUpBonus = () => {
  notificationStore.receivePointsReward({
    title: '升級獎勵',
    message: '恭喜您升級至白銀交易者！獲得升級獎勵點數！',
    points: 200
  });
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-TW');
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.demo-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.demo-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;

  h1 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0 0 10px 0;
    text-align: center;
  }

  .subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 40px;
  }
}

.demo-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  h2 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0 0 20px 0;
  }

  p {
    color: #666;
    margin-bottom: 20px;
  }
}

.test-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.demo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 18px;
  }

  &.primary {
    background: $primary;
    color: white;

    &:hover {
      background: #5fa795;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }
  }

  &.success {
    background: #4caf50;
    color: white;

    &:hover {
      background: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }
  }

  &.warning {
    background: #ff9800;
    color: white;

    &:hover {
      background: #fb8c00;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }
  }

  &.info {
    background: #2196f3;
    color: white;

    &:hover {
      background: #1e88e5;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    }
  }

  &.secondary {
    background: #e0e0e0;
    color: #1e1e1e;

    &:hover {
      background: #d0d0d0;
    }
  }

  &.danger {
    background: #f44336;
    color: white;

    &:hover {
      background: #e53935;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
    }
  }
}

.status-card {
  background: #f9f9f9;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e0e0e0;

    &:last-child {
      border-bottom: none;
    }

    .status-label {
      font-weight: 600;
      color: #666;
    }

    .status-value {
      font-weight: 700;
      color: $primary;
      font-size: 18px;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;

  &.unread {
    background: #e8f5f3;
    border-left: 4px solid $primary;
  }

  &:hover {
    background: #e0e0e0;
    transform: translateX(4px);
  }

  .notification-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, $primary, #5fa795);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 24px;
      color: white;
    }
  }

  .notification-content {
    flex: 1;

    .notification-title {
      font-weight: 600;
      color: #1e1e1e;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .notification-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;

      .notification-points {
        color: $primary;
        font-weight: 700;
      }

      .notification-time {
        color: #999;
      }
    }
  }

  .unread-indicator {
    width: 10px;
    height: 10px;
    background: #e91e63;
    border-radius: 50%;
    flex-shrink: 0;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  i {
    font-size: 64px;
    margin-bottom: 16px;
    display: block;
  }
}

.instructions {
  background: #f9f9f9;
  border-radius: 10px;
  padding: 20px;

  ol {
    margin: 0;
    padding-left: 24px;

    li {
      color: #666;
      margin-bottom: 8px;
      line-height: 1.6;
    }
  }
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: white;
  border: 2px solid $primary;
  color: $primary;
  border-radius: 10px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;

  i {
    font-size: 18px;
  }

  &:hover {
    background: $primary;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
  }
}

@media (max-width: 767.98px) {
  .test-buttons,
  .quick-links {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .demo-section {
    padding: 20px;
  }
}
</style>
