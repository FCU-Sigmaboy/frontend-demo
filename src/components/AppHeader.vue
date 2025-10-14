<template>
  <header class="app-header">
    <BNavbar class="header-navbar px-4">
      <BContainer fluid>
        <BRow class="w-100 align-items-center">
          <!-- Logo -->
          <BCol cols="auto">
            <div class="logo-wrapper">
              <img :src="logoImage" alt="Logo" class="header-logo" />
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
const logoImage = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="25" fill="%2364978a"/></svg>';
const chatIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><path d="M25 5C14.5 5 6 13.5 6 24c0 3.5 1 6.8 2.7 9.6L6 44l10.4-2.7C19.2 43 22 44 25 44c10.5 0 19-8.5 19-19S35.5 5 25 5z" fill="none" stroke="black" stroke-width="2"/></svg>';
const heartIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><path d="M25 42l-2.5-2.3C12.5 30.6 5 23.8 5 16c0-6.6 5.4-12 12-12 3.8 0 7.5 1.8 10 4.8C29.5 5.8 33.2 4 37 4c6.6 0 12 5.4 12 12 0 7.8-7.5 14.6-17.5 23.7L25 42z" fill="none" stroke="black" stroke-width="2"/></svg>';
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
  background-color: #90534d;
  height: 75px;
  padding: 0 20px;

  :deep(.navbar) {
    padding: 0;
  }
}

.logo-wrapper {
  .header-logo {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }
}

.category-nav {
  display: flex;

  .category-link {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 30px;
    color: #000;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    text-decoration: none;
    transition: all 0.3s;

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
    width: 50px;
    height: 50px;
    object-fit: contain;
  }

  i {
    font-size: 30px;
    color: #000;
  }
}

.user-info {
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  padding: 5px 10px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 30px;
    color: #000;
    white-space: nowrap;
  }
}

.points-display {
  .points-icon {
    width: 40px;
    height: 40px;
    background: #d6ac4b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Sans TC', sans-serif;
    font-weight: 600;
    font-size: 38px;
    color: #000;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  }

  .points-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 30px;
    font-weight: 500;
    color: #000;
  }
}

.post-button {
  background-color: #000;
  border: 1px solid #d6ac4b;
  border-radius: 50px;
  padding: 8px 20px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 30px;
  color: #fff;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  min-width: 101px;
  height: 56px;
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
