<template>
  <header class="app-header">
    <BNavbar class="header-navbar px-4">
      <BContainer fluid>
        <BRow class="w-100 align-items-center">
          <!-- Logo -->
          <BCol cols="auto">
            <div class="logo-wrapper">
              <img src="../assets/Logo.png" alt="Logo" class="header-logo" />
            </div>
          </BCol>

          <!-- Navigation Categories (Desktop only) -->
          <BCol class="d-none d-lg-block">
            <BNav class="category-nav">
              <BNavItem
                v-for="category in categories"
                :key="category.id"
                :href="category.link"
                class="category-link"
              >
                {{ category.name }}
              </BNavItem>
            </BNav>
          </BCol>

          <!-- Right Side Actions -->
          <BCol cols="auto" class="ms-auto">
            <div class="d-flex align-items-center gap-3">
              <!-- Chat Icon -->
              <BButton variant="link" class="p-0 icon-button position-relative">
                <img :src="chatIcon" alt="Chat" class="header-icon" />
              </BButton>

              <!-- Favorites Icon -->
              <BButton variant="link" class="p-0 icon-button position-relative">
                <img :src="heartIcon" alt="Favorites" class="header-icon" />
              </BButton>

              <!-- User Profile (Desktop) -->
              <div class="d-none d-lg-flex align-items-center gap-2 user-info">
                <img :src="userAvatar" alt="User" class="user-avatar" />
                <span class="user-name">Hi, 使用者</span>
              </div>

              <!-- Points Display -->
              <div class="points-display d-none d-lg-flex align-items-center gap-2">
                <div class="points-icon">P</div>
                <span class="points-value">{{ userPoints }}</span>
              </div>

              <!-- Post Button -->
              <BButton variant="dark" class="post-button">
                刊登
              </BButton>

              <!-- Hamburger Menu (Mobile) -->
              <BButton
                variant="link"
                class="p-0 d-lg-none hamburger-button"
                @click="toggleMobileMenu"
              >
                <i class="bi bi-list fs-3"></i>
              </BButton>
            </div>
          </BCol>
        </BRow>
      </BContainer>
    </BNavbar>

    <!-- Mobile Menu Dropdown -->
    <BCollapse v-model="showMobileMenu" class="mobile-menu d-lg-none">
      <BContainer>
        <BListGroup class="mobile-menu-list">
          <BListGroupItem
            v-for="item in mobileMenuItems"
            :key="item.id"
            button
            @click="handleMobileMenuClick(item)"
          >
            {{ item.name }}
          </BListGroupItem>
        </BListGroup>
      </BContainer>
    </BCollapse>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { BNavbar, BContainer, BRow, BCol, BNav, BNavItem, BButton, BCollapse, BListGroup, BListGroupItem } from 'bootstrap-vue-next';

// Props
const props = defineProps({
  userPoints: {
    type: Number,
    default: 500
  }
});

// State
const showMobileMenu = ref(false);

const categories = [
  { id: 1, name: '服飾', link: '#' },
  { id: 2, name: '家電', link: '#' },
  { id: 3, name: '電子3C', link: '#' },
  { id: 4, name: '書籍', link: '#' }
];

const mobileMenuItems = [
  { id: 1, name: '個人檔案' },
  { id: 2, name: '刊登物品' },
  { id: 3, name: '我的收藏' },
  { id: 4, name: '聊天訊息' }
];

// Placeholder images
const chatIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-left" viewBox="0 0 16 16"> <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/> </svg>';
const heartIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16"> <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"/> </svg>';
const userAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="%23ddd"/><circle cx="20" cy="15" r="8" fill="%23999"/><path d="M5 35c0-8 7-12 15-12s15 4 15 12" fill="%23999"/></svg>';

// Methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const handleMobileMenuClick = (item) => {
  console.log('Menu item clicked:', item.name);
  showMobileMenu.value = false;
};
</script>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
}

.header-navbar {
  background-color: #d4a574;
  height: 50px;
  padding: 0 20px;

  :deep(.navbar) {
    padding: 0;
  }
}

.logo-wrapper {
  .header-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
}

.category-nav {
  display: flex;
  gap: 30px;

  .category-link {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    text-decoration: none;
    transition: all 0.3s;

    :deep(a) {
      color: #000;
    }

    &:hover {
      color: #333;
      transform: translateY(-2px);
    }
  }
}

.icon-button {
  border: none;
  background: transparent;
  padding: 0;

  .header-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  i {
    font-size: 32px;
    color: #000;
  }
}

.user-info {
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  padding: 5px 10px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #000;
    white-space: nowrap;
  }
}

.points-display {
  .points-icon {
    width: 32px;
    height: 32px;
    background: #d6ac4b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Sans TC', sans-serif;
    font-weight: 600;
    font-size: 16px;
    color: #000;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  }

  .points-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #000;
  }
}

.post-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  border: 1px solid #d6ac4b;
  border-radius: 50px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: #fff;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  min-width: 64px;
  height: 32px;
  padding: 0 16px;
  transition: all 0.3s;

  &:hover {
    background-color: #1a1a1a;
    border-color: #d6ac4b;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.hamburger-button {
  color: #000;
}

// Mobile Menu
.mobile-menu {
  background-color: #d4a760;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);

  .mobile-menu-list {
    margin: 10px 0;

    :deep(.list-group-item) {
      background-color: transparent;
      border: none;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      color: #000;
      padding: 15px 20px;
      transition: background-color 0.3s;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }
  }
}

// Responsive
@media (max-width: 991.98px) {
  .header-navbar {
    height: auto;
    min-height: 60px;
    padding: 10px 15px;
  }

  .logo-wrapper .header-logo {
    width: 40px;
    height: 40px;
  }

  .icon-button .header-icon {
    width: 35px;
    height: 35px;
  }

  .post-button {
    font-size: 16px;
    padding: 6px 15px;
    min-width: 70px;
    height: 40px;
  }
}
</style>
