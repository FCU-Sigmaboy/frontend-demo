<template>
  <header class="app-header">
    <BNavbar class="header-navbar">
      <BContainer fluid class="px-4">
        <div class="header-content">
          <!-- Left Side: Logo & Navigation -->
          <div class="header-left">
            <a href="#" class="logo-link">
              <img :src="logoImage" alt="台中易起來" class="header-logo" />
            </a>

            <BNav class="category-nav d-none d-lg-flex">
              <BNavItem
                v-for="category in categories"
                :key="category.id"
                :href="category.link"
                class="category-link"
              >
                {{ category.name }}
              </BNavItem>
            </BNav>
          </div>

          <!-- Right Side Actions -->
          <div class="header-right">
            <!-- Search Icon (Desktop & Tablet) -->
            <BButton variant="link" class="icon-button d-none d-md-flex">
              <i class="bi bi-search"></i>
            </BButton>

            <!-- Favorites/Liked Icon (All Screens) -->
            <BButton variant="link" class="icon-button">
              <i class="bi bi-heart"></i>
            </BButton>

            <!-- Message/Chat Icon (All Screens) -->
            <BButton variant="link" class="icon-button">
              <i class="bi bi-chat-left"></i>
            </BButton>

            <!-- Points Display (Desktop) -->
            <div class="points-display d-none d-lg-flex">
              <div class="points-icon">P</div>
              <span class="points-value">{{ userPoints }}</span>
            </div>

            <!-- User Profile (Desktop) -->
            <div class="user-info d-none d-lg-flex">
              <i class="bi bi-person-circle user-avatar-icon"></i>
              <span class="user-name">Hi, 使用者</span>
            </div>

            <!-- Post Button (Desktop) -->
            <BButton class="post-button d-none d-lg-flex">
              刊登
            </BButton>

            <!-- Hamburger Menu (Mobile) -->
            <BButton
              variant="link"
              class="hamburger-button d-lg-none"
              @click="toggleMobileMenu"
            >
              <i class="bi bi-list"></i>
            </BButton>
          </div>
        </div>
      </BContainer>
    </BNavbar>

    <!-- Mobile Menu Overlay -->
    <Transition name="menu">
      <div v-if="showMobileMenu" class="mobile-menu-overlay d-lg-none" @click="closeMobileMenu">
        <div class="mobile-menu-content" @click.stop>
          <div class="mobile-menu-header">
            <img :src="logoImage" alt="台中易起來" class="menu-logo" />
            <BButton variant="link" class="close-button" @click="closeMobileMenu">
              <i class="bi bi-x-lg"></i>
            </BButton>
          </div>

          <div class="mobile-menu-body">
            <div class="menu-user-section">
              <i class="bi bi-person-circle user-icon"></i>
              <span class="user-greeting">Hi, 使用者</span>
              <div class="hamburger-menu-icon">
                <i class="bi bi-list"></i>
              </div>
            </div>

            <ul class="menu-list">
              <li v-for="item in mobileMenuItems" :key="item.id" @click="handleMobileMenuClick(item)">
                <i :class="['bi', item.icon]"></i>
                <span>{{ item.name }}</span>
              </li>
            </ul>

            <div class="menu-points">
              <i class="bi bi-coin"></i>
              <span>{{ userPoints }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { BNavbar, BContainer, BNav, BNavItem, BButton } from 'bootstrap-vue-next';

// Logo Image
import logoImage from '../assets/Logo.png';

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
  { id: 1, name: '個人檔案', icon: 'bi-person' },
  { id: 2, name: '刊登物品', icon: 'bi-plus-circle' },
  { id: 3, name: '我的收藏', icon: 'bi-heart' },
  { id: 4, name: '聊天訊息', icon: 'bi-chat-left' }
];

// Methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
  if (showMobileMenu.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
  document.body.style.overflow = '';
};

const handleMobileMenuClick = (item) => {
  console.log('Menu item clicked:', item.name);
  closeMobileMenu();
};
</script>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-navbar {
  background-color: #f2efeb;
  height: 50px;
  padding: 0;

  :deep(.navbar) {
    padding: 0;
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1600px;
  width: 100%;
  height: 50px;
  margin: auto;
}

// Left Side
.header-left {
  display: flex;
  align-items: center;
  gap: 30px;

  .logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
  }

  .header-logo {
    height: 35px;
    width: auto;
    object-fit: contain;
  }
}

.category-nav {
  display: flex;
  gap: 30px;
  margin: 0;

  .category-link {
    :deep(a) {
      font-family: 'Noto Sans TC', 'Inter', sans-serif;
      font-size: 16px;
      color: #1e1e1e;
      text-decoration: none;
      transition: color 0.3s;

      &:hover {
        color: #6fb8a5;
      }
    }
  }
}

// Right Side
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button {
  padding: 0;
  border: none;
  background: transparent;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 24px;
    color: #1e1e1e;
  }

  &:hover i {
    color: #6fb8a5;
  }
}

.points-display {
  display: flex;
  align-items: center;
  gap: 5px;

  .points-icon {
    width: 25px;
    height: 25px;
    background: #f2efeb;
    border: 2px solid #1e1e1e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Sans TC', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: #1e1e1e;
  }

  .points-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #1e1e1e;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .user-avatar-icon {
    font-size: 32px;
    color: #1e1e1e;
  }

  .user-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #1e1e1e;
    white-space: nowrap;
  }
}

.post-button {
  background-color: #6fb8a5;
  border: 1px solid #f2efeb;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: white;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  min-width: 58px;
  height: 32px;
  padding: 0 10px;
  transition: all 0.3s;

  &:hover {
    background-color: #5fa795;
    transform: translateY(-2px);
  }
}

.hamburger-button {
  padding: 0;
  border: none;
  background: transparent;

  i {
    font-size: 32px;
    color: #1e1e1e;
  }
}

// Mobile Menu Overlay
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.mobile-menu-content {
  width: 80%;
  max-width: 300px;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;

  .menu-logo {
    height: 30px;
    width: auto;
  }

  .close-button {
    padding: 0;
    border: none;
    background: transparent;

    i {
      font-size: 24px;
      color: #1e1e1e;
    }
  }
}

.mobile-menu-body {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.menu-user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;

  .user-icon {
    font-size: 32px;
    color: #1e1e1e;
  }

  .user-greeting {
    flex: 1;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    color: #1e1e1e;
  }

  .hamburger-menu-icon i {
    font-size: 28px;
    color: #1e1e1e;
  }
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    gap: 15px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    color: #1e1e1e;
    padding: 18px 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    border-bottom: 1px solid #e0e0e0;

    i {
      font-size: 22px;
      color: #1e1e1e;
      width: 24px;
      text-align: center;
    }

    span {
      flex: 1;
    }

    &:hover {
      background-color: #f5f5f5;
    }

    &:last-child {
      border-bottom: none;
    }
  }
}

.menu-points {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #6fb8a5;
  border-radius: 8px;
  color: white;

  i {
    font-size: 24px;
  }

  span {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 600;
  }
}

// Menu Transition
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s ease;

  .mobile-menu-content {
    transition: transform 0.3s ease;
  }
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;

  .mobile-menu-content {
    transform: translateX(100%);
  }
}

// Responsive
@media (max-width: 991.98px) {
  .header-navbar {
    height: 60px;
  }

  .header-content {
    height: 60px;
  }

  .header-logo {
    height: 40px;
  }

  .icon-button i {
    font-size: 28px;
  }
}
</style>
