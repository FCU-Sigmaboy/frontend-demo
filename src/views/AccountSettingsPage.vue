<template>
  <div class="account-settings-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="settings-container">
        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="page-title">帳號設定</h1>
          <div class="spacer"></div>
        </div>

        <!-- Settings Sections -->
        <div class="settings-content">
          <!-- Account Section -->
          <section class="settings-section">
            <h2 class="section-title">帳號資訊</h2>

            <div class="settings-list">
              <button class="setting-item" @click="goToEditProfile">
                <div class="item-left">
                  <i class="bi bi-person-circle"></i>
                  <div class="item-info">
                    <span class="item-label">個人資料</span>
                    <span class="item-desc">編輯姓名、聯絡資訊等</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>

              <div class="setting-item disabled">
                <div class="item-left">
                  <i class="bi bi-envelope"></i>
                  <div class="item-info">
                    <span class="item-label">電子信箱</span>
                    <span class="item-desc">{{ authStore.userEmail }}</span>
                  </div>
                </div>
                <span class="badge-verified">
                  <i class="bi bi-check-circle-fill"></i>
                  已驗證
                </span>
              </div>

              <button class="setting-item">
                <div class="item-left">
                  <i class="bi bi-shield-lock"></i>
                  <div class="item-info">
                    <span class="item-label">密碼與安全性</span>
                    <span class="item-desc">變更密碼、兩步驟驗證</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </section>

          <!-- Privacy Section -->
          <section class="settings-section">
            <h2 class="section-title">隱私設定</h2>

            <div class="settings-list">
              <div class="setting-item">
                <div class="item-left">
                  <i class="bi bi-eye"></i>
                  <div class="item-info">
                    <span class="item-label">個人資料公開</span>
                    <span class="item-desc">讓其他人看到你的個人資料</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input v-model="settings.profilePublic" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-left">
                  <i class="bi bi-geo-alt"></i>
                  <div class="item-info">
                    <span class="item-label">顯示位置資訊</span>
                    <span class="item-desc">在刊登物品時顯示所在地區</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input v-model="settings.showLocation" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-left">
                  <i class="bi bi-incognito"></i>
                  <div class="item-info">
                    <span class="item-label">上線狀態</span>
                    <span class="item-desc">顯示你的上線/離線狀態</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input v-model="settings.showOnlineStatus" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </section>

          <!-- Notifications Section -->
          <section class="settings-section">
            <h2 class="section-title">通知設定</h2>

            <div class="settings-list">
              <div class="setting-item">
                <div class="item-left">
                  <i class="bi bi-bell"></i>
                  <div class="item-info">
                    <span class="item-label">推播通知</span>
                    <span class="item-desc">接收即時推播訊息</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input v-model="settings.pushNotifications" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-left">
                  <i class="bi bi-envelope-open"></i>
                  <div class="item-info">
                    <span class="item-label">電子郵件通知</span>
                    <span class="item-desc">接收重要訊息及更新</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input v-model="settings.emailNotifications" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-left">
                  <i class="bi bi-chat-dots"></i>
                  <div class="item-info">
                    <span class="item-label">訊息通知</span>
                    <span class="item-desc">接收新訊息提醒</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input v-model="settings.messageNotifications" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="item-left">
                  <i class="bi bi-megaphone"></i>
                  <div class="item-info">
                    <span class="item-label">優惠活動通知</span>
                    <span class="item-desc">接收促銷及活動資訊</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input v-model="settings.promotionNotifications" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </section>

          <!-- Preferences Section -->
          <section class="settings-section">
            <h2 class="section-title">偏好設定</h2>

            <div class="settings-list">
              <button class="setting-item">
                <div class="item-left">
                  <i class="bi bi-translate"></i>
                  <div class="item-info">
                    <span class="item-label">語言</span>
                    <span class="item-desc">繁體中文</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>

              <button class="setting-item">
                <div class="item-left">
                  <i class="bi bi-palette"></i>
                  <div class="item-info">
                    <span class="item-label">外觀主題</span>
                    <span class="item-desc">淺色</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>

              <button class="setting-item">
                <div class="item-left">
                  <i class="bi bi-currency-dollar"></i>
                  <div class="item-info">
                    <span class="item-label">貨幣</span>
                    <span class="item-desc">新台幣 (NT$)</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </section>

          <!-- Support Section -->
          <section class="settings-section">
            <h2 class="section-title">支援與幫助</h2>

            <div class="settings-list">
              <button class="setting-item" @click="goToHelp">
                <div class="item-left">
                  <i class="bi bi-question-circle"></i>
                  <div class="item-info">
                    <span class="item-label">幫助中心</span>
                    <span class="item-desc">常見問題及使用指南</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>

              <button class="setting-item" @click="goToAbout">
                <div class="item-left">
                  <i class="bi bi-info-circle"></i>
                  <div class="item-info">
                    <span class="item-label">關於我們</span>
                    <span class="item-desc">了解台中易起來</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>

              <button class="setting-item" @click="goToTerms">
                <div class="item-left">
                  <i class="bi bi-file-text"></i>
                  <div class="item-info">
                    <span class="item-label">服務條款</span>
                    <span class="item-desc">使用條款及隱私政策</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </section>

          <!-- Danger Zone -->
          <section class="settings-section danger-section">
            <h2 class="section-title">帳號管理</h2>

            <div class="settings-list">
              <button class="setting-item danger-item" @click="handleLogout">
                <div class="item-left">
                  <i class="bi bi-box-arrow-right"></i>
                  <div class="item-info">
                    <span class="item-label">登出</span>
                    <span class="item-desc">登出目前帳號</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>

              <button class="setting-item danger-item" @click="handleDeleteAccount">
                <div class="item-left">
                  <i class="bi bi-trash"></i>
                  <div class="item-info">
                    <span class="item-label">刪除帳號</span>
                    <span class="item-desc">永久刪除你的帳號及資料</span>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </section>

          <!-- App Version -->
          <div class="app-version">
            <p>版本 1.0.0</p>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const router = useRouter();
const authStore = useAuthStore();

// State
const userPoints = ref(500);

const settings = ref({
  profilePublic: true,
  showLocation: true,
  showOnlineStatus: true,
  pushNotifications: true,
  emailNotifications: true,
  messageNotifications: true,
  promotionNotifications: false
});

// Methods
const goBack = () => {
  router.back();
};

const goToEditProfile = () => {
  router.push({ name: 'EditProfile' });
};

const goToHelp = () => {
  router.push({ name: 'FAQ' });
};

const goToAbout = () => {
  router.push({ name: 'About' });
};

const goToTerms = () => {
  router.push({ name: 'Terms' });
};

const handleLogout = async () => {
  if (confirm('確定要登出嗎？')) {
    await authStore.signOut();
    router.push({ name: 'Home' });
  }
};

const handleDeleteAccount = () => {
  if (confirm('警告：刪除帳號後將無法復原，確定要刪除嗎？')) {
    if (confirm('再次確認：這將永久刪除你的所有資料')) {
      // Implement account deletion
      console.log('Delete account');
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.account-settings-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

// Page Header
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    i {
      font-size: 20px;
      color: #1e1e1e;
    }

    &:hover {
      background: #f5f5f5;
      transform: translateX(-3px);
    }
  }

  .page-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  .spacer {
    width: 40px;
  }
}

// Settings Content
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Settings Section
.settings-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &.danger-section {
    border: 1px solid #ffebee;
  }

  .section-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 16px 0;
  }
}

// Settings List
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  width: 100%;

  &:last-child {
    border-bottom: none;
  }

  &:not(.disabled):hover {
    background: #f9f9f9;
    padding-left: 12px;
    padding-right: 12px;
    margin-left: -12px;
    margin-right: -12px;
    border-radius: 8px;
  }

  &.disabled {
    cursor: default;
    opacity: 0.8;
  }

  &.danger-item {
    .item-left {
      i,
      .item-label {
        color: #dc3545;
      }
    }

    &:hover {
      background: #fff5f5;
    }
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;

    i {
      font-size: 22px;
      color: $primary;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .item-label {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 15px;
        font-weight: 500;
        color: #1e1e1e;
      }

      .item-desc {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 13px;
        color: #999;
      }
    }
  }

  > i.bi-chevron-right {
    font-size: 16px;
    color: #d0d0d0;
    flex-shrink: 0;
  }
}

// Badge Verified
.badge-verified {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #e8f5f3;
  border-radius: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: $primary;

  i {
    font-size: 14px;
  }
}

// Toggle Switch
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: $primary;

      &:before {
        transform: translateX(22px);
      }
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #d0d0d0;
    transition: all 0.3s;
    border-radius: 13px;

    &:before {
      position: absolute;
      content: '';
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: all 0.3s;
      border-radius: 50%;
    }
  }
}

// App Version
.app-version {
  padding: 20px;
  text-align: center;

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #999;
    margin: 0;
  }
}

// Responsive
@media (max-width: 767.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .settings-container {
    padding: 0 15px;
  }

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
    }
  }

  .settings-section {
    padding: 20px;

    .section-title {
      font-size: 16px;
    }
  }

  .setting-item {
    .item-left {
      gap: 12px;

      i {
        font-size: 20px;
      }

      .item-info {
        .item-label {
          font-size: 14px;
        }

        .item-desc {
          font-size: 12px;
        }
      }
    }
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .settings-container {
    padding: 0 10px;
  }

  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
    }

    .back-btn {
      width: 36px;
      height: 36px;

      i {
        font-size: 18px;
      }
    }

    .spacer {
      width: 36px;
    }
  }

  .settings-content {
    gap: 16px;
  }

  .settings-section {
    padding: 16px;
  }
}
</style>
