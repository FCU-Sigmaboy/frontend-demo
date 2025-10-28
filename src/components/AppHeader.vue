<template>
  <header class="app-header">
    <BNavbar class="header-navbar">
      <BContainer fluid class="px-4">
        <div class="header-content">
          <!-- Left Side: Logo & Navigation -->
          <div class="header-left">
            <a href="/" class="logo-link">
              <img :src="logoImage" alt="台中易起來" class="header-logo" />
            </a>

            <BNav class="category-nav d-none d-lg-flex">
              <BNavItem
                v-for="category in categories"
                :key="category.id"
                :href="`/items?category=${category.category_id}`"
                class="category-link"
              >
                {{ category.name }}
              </BNavItem>

            </BNav>
            <!-- All Categories Button -->
            <BButton
              variant="link"
              class="all-categories-btn"
              @click="toggleAllCategories"
            >
              <i class="bi bi-grid-3x3-gap"></i>
              <span>所有分類</span>
            </BButton>
          </div>

          <!-- Right Side Actions -->
          <div class="header-right">

            
            <!-- 已登入：顯示使用者資訊 -->
            <template v-if="authStore.isLoggedIn">

              <!-- Favorites/Liked Icon (Desktop) -->
              <BButton variant="link" class="icon-button d-none d-lg-flex" @click="router.push({ name: 'Favorites' })">
                <i class="bi bi-heart"></i>
              </BButton>

              <!-- Message/Chat Icon (Desktop) -->
              <BButton variant="link" class="icon-button d-none d-lg-flex" @click="router.push({ name: 'Messages' })">
                <i class="bi bi-chat-left"></i>
              </BButton>

              <!-- User Profile (Desktop) -->
              <div class="user-info d-none d-lg-flex" @click="router.push({ name: 'UserProfile' })" style="cursor: pointer;">
                <img
                  v-if="authStore.userAvatar"
                  :src="authStore.userAvatar"
                  alt="User Avatar"
                  class="user-avatar-img"
                  referrerpolicy="no-referrer"
                />
                <i v-else class="bi bi-person-circle user-avatar-icon"></i>
                <span class="user-name">Hi, {{ authStore.userName }}</span>
              </div>

              <!-- Points Display (Desktop) -->
              <div class="points-display d-none d-lg-flex">
                <i class="bi bi-leaf points-icon" style="font-size: 1.2rem;"></i>
                <span class="points-value">{{ userPoints }}</span>
              </div>
              
              <!-- Post Button (Desktop) -->
             <BButton class="post-button d-none d-lg-flex" @click="router.push({ name: 'CreateListing' })">
               刊登
             </BButton>

              <!-- Logout Button -->
              <BButton variant="outline" class="logout-button d-none d-lg-flex" @click="handleLogout">
                登出
              </BButton>

            </template>

            <!-- 未登入：顯示 Google 登入按鈕 -->
            <template v-else>
              <BButton class="google-login-button d-none d-lg-flex" @click="handleGoogleLogin">
                <i class="bi bi-google"></i>
                <span>使用 Google 登入</span>
              </BButton>
            </template>

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
            <div class="menu-user-section">
              <img
                v-if="authStore.userAvatar"
                :src="authStore.userAvatar"
                alt="User Avatar"
                class="user-icon-img"
                referrerpolicy="no-referrer"
              />
              <i v-else class="bi bi-person-circle user-icon"></i>
              <span class="user-greeting">Hi, {{ authStore.userName }}</span>
            </div>
            <BButton variant="link" class="close-button" @click="closeMobileMenu">
              <i class="bi bi-x-lg"></i>
            </BButton>
          </div>

          <div class="mobile-menu-body">
            <!-- 已登入狀態 -->
            <template v-if="authStore.isLoggedIn">
              <div class="menu-user-section">
                <span class="user-greeting">我的點數</span>
                <span class="menu-points"><i class="bi bi-leaf"></i> {{ userPoints }}</span>
              </div>
              
              <ul class="menu-list">
                <li v-for="item in mobileMenuItems" :key="item.id" @click="handleMobileMenuClick(item)">
                  <i :class="['bi', item.icon]"></i>
                  <span>{{ item.name }}</span>
                </li>
                <li @click="handleLogout" class="logout-item">
                  <i class="bi bi-box-arrow-right"></i>
                  <span>登出</span>
                </li>
              </ul>
            </template>

            <!-- 未登入狀態 -->
            <template v-else>
              <div class="menu-login-section">
                <p class="login-prompt">請先登入以使用完整功能</p>
                <BButton class="google-login-button-mobile" @click="handleGoogleLogin">
                  <i class="bi bi-google"></i>
                  <span>使用 Google 登入</span>
                </BButton>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- All Categories Offcanvas -->
    <Transition name="offcanvas">
      <div v-if="showAllCategories" class="all-categories-offcanvas" @click="closeAllCategories">
        <div class="offcanvas-content" @click.stop>
          <div class="offcanvas-header">
            <h3 class="offcanvas-title">所有分類</h3>
            <BButton variant="link" class="close-button" @click="closeAllCategories">
              <i class="bi bi-x-lg"></i>
            </BButton>
          </div>

          <div class="offcanvas-body">
            <!-- Search Categories -->
            <div class="category-search">
              <i class="bi bi-search"></i>
              <input type="text" placeholder="搜尋分類..." v-model="categorySearch" />
            </div>

            <!-- Category List -->
            <div class="category-list">
              <!-- Following Section -->
              <div class="category-item">
                <div class="category-icon-wrapper following">
                  <i class="bi bi-eye"></i>
                </div>
                <span class="category-name">追蹤中</span>
              </div>

              <!-- Free Items Section -->
              <div class="category-item">
                <div class="category-icon-wrapper free">
                  <i class="bi bi-gift"></i>
                  <span class="badge-new">NEW</span>
                </div>
                <span class="category-name">免費贈送</span>
              </div>

              <!-- Main Categories with Expandable Subcategories -->
              <div v-for="cat in allCategoriesList" :key="cat.id" class="category-section">
                <div class="category-item expandable" @click="toggleCategory(cat.id)">
                  <div class="category-icon-wrapper" :style="{ backgroundColor: cat.color }">
                    <i :class="['bi', cat.icon]"></i>
                  </div>
                  <span class="category-name">{{ cat.name }}</span>
                  <i
                    :class="['bi', expandedCategories.includes(cat.id) ? 'bi-chevron-up' : 'bi-chevron-down']"
                    class="expand-icon"
                  ></i>
                </div>

                <!-- Subcategories -->
                <Transition name="subcategory">
                  <div v-if="expandedCategories.includes(cat.id)" class="subcategory-list">
                    <a
                      v-for="sub in cat.subcategories"
                      :key="sub.id"
                      :href="`/items?category=${sub.category_id}`"
                      class="subcategory-item"
                      @click="closeAllCategories"
                    >
                      {{ sub.name }}
                    </a>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { BNavbar, BContainer, BNav, BNavItem, BButton } from 'bootstrap-vue-next';
import { useAuthStore } from '../stores/auth';

// Router & Auth Store
const router = useRouter();
const authStore = useAuthStore();

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
const showAllCategories = ref(false);
const categorySearch = ref('');
const expandedCategories = ref([]);

const categories = [
  { id: 1, name: '流行服飾', category_id: 1 },
  { id: 2, name: '家電用品', category_id: 5 },
  { id: 3, name: '電子 3C', category_id: 4 },
  { id: 4, name: '圖書影音', category_id: 9 }
];

// All Categories List with Subcategories
const allCategoriesList = [
  {
    id: 1,
    name: '流行服飾',
    icon: 'bi-bag',
    color: '#4a90e2',
    category_id: 1,
    subcategories: [
      { id: 11, name: '女裝', category_id: 11 },
      { id: 12, name: '男裝', category_id: 12 },
      { id: 13, name: '童裝', category_id: 13 }
    ]
  },
  {
    id: 2,
    name: '鞋包配件',
    icon: 'bi-handbag',
    color: '#e76f51',
    category_id: 2,
    subcategories: [
      { id: 21, name: '女鞋', category_id: 21 },
      { id: 22, name: '男鞋', category_id: 22 },
      { id: 23, name: '包包', category_id: 23 }
    ]
  },
  {
    id: 3,
    name: '美妝保養',
    icon: 'bi-flower1',
    color: '#f4c2c2',
    category_id: 3,
    subcategories: [
      { id: 31, name: '化妝品', category_id: 31 },
      { id: 32, name: '保養品', category_id: 32 },
      { id: 33, name: '香水', category_id: 33 }
    ]
  },
  {
    id: 4,
    name: '電子 3C',
    icon: 'bi-laptop',
    color: '#457b9d',
    category_id: 4,
    subcategories: [
      { id: 41, name: '手機', category_id: 41 },
      { id: 42, name: '平板電腦', category_id: 42 },
      { id: 43, name: '筆記型電腦', category_id: 43 }
    ]
  },
  {
    id: 5,
    name: '家電用品',
    icon: 'bi-tv',
    color: '#a8dadc',
    category_id: 5,
    subcategories: [
      { id: 51, name: '廚房家電', category_id: 51 },
      { id: 52, name: '生活家電', category_id: 52 }
    ]
  },
  {
    id: 6,
    name: '家具家飾',
    icon: 'bi-house',
    color: '#8d99ae',
    category_id: 6,
    subcategories: [
      { id: 61, name: '家具', category_id: 61 },
      { id: 62, name: '居家裝飾', category_id: 62 }
    ]
  },
  {
    id: 7,
    name: '親子婦幼',
    icon: 'bi-heart',
    color: '#ffc8dd',
    category_id: 7,
    subcategories: [
      { id: 71, name: '嬰幼兒用品', category_id: 71 },
      { id: 72, name: '玩具', category_id: 72 }
    ]
  },
  {
    id: 8,
    name: '生活娛樂',
    icon: 'bi-controller',
    color: '#cdb4db',
    category_id: 8,
    subcategories: [
      { id: 81, name: '運動健身', category_id: 81 },
      { id: 82, name: '戶外休閒', category_id: 82 }
    ]
  },
  {
    id: 9,
    name: '圖書影音',
    icon: 'bi-book',
    color: '#ffafcc',
    category_id: 9,
    subcategories: [
      { id: 91, name: '書籍', category_id: 91 },
      { id: 92, name: 'CD/DVD', category_id: 92 }
    ]
  }
];

const mobileMenuItems = [
  { id: 1, name: '個人檔案', icon: 'bi-person', route: 'UserProfile' },
  { id: 2, name: '刊登物品', icon: 'bi-plus-circle', route: 'CreateListing' },
  { id: 3, name: '我的收藏', icon: 'bi-heart', route: 'Favorites' },
  { id: 4, name: '聊天訊息', icon: 'bi-chat-left', route: 'Messages' },
  { id: 5, name: '帳號設定', icon: 'bi-gear', route: 'AccountSettings' }
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
  if (item.route) {
    router.push({ name: item.route });
  }
};

// 使用 Supabase Google Login
const handleGoogleLogin = async () => {
  try {
    const { error } = await authStore.signInWithGoogle();
    if (error) {
      console.error('Google 登入失敗:', error);
    }
  } catch (error) {
    console.error('Google 登入錯誤:', error);
  }
};

// 登出
const handleLogout = async () => {
  await authStore.signOut();
  console.log('已登出');
  closeMobileMenu();
};

// All Categories Toggle
const toggleAllCategories = () => {
  showAllCategories.value = !showAllCategories.value;
  if (showAllCategories.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeAllCategories = () => {
  showAllCategories.value = false;
  document.body.style.overflow = '';
};

// Toggle Category Expansion
const toggleCategory = (categoryId) => {
  const index = expandedCategories.value.indexOf(categoryId);
  if (index > -1) {
    expandedCategories.value.splice(index, 1);
  } else {
    expandedCategories.value.push(categoryId);
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

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
        color: $primary;
      }
    }
  }
}

// Right Side
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
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
    color: $primary;
  }
}

.points-display {
  display: flex;
  align-items: center;
  gap: 5px;

  .points-icon {
    background: #f2efeb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Sans TC', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: $primary;
  }

  .points-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: $primary;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .user-avatar-img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

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

.google-login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: white;
  border: 1px solid #dadce0;
  border-radius: 5px;
  font-family: 'Noto Sans TC', 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  padding: 0 12px;
  height: 36px;
  transition: all 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  i {
    font-size: 18px;
    color: #4285f4;
  }

  &:hover {
    background-color: #f8f9fa;
    border-color: #d2d4d7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid #1e1e1e;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #1e1e1e;
  min-width: 58px;
  height: 32px;
  padding: 0 12px;
  transition: all 0.3s;

  &:hover {
    background-color: #f5f5f5;
    border-color: #1e1e1e;
  }
}

.post-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $primary;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: white;
  min-width: 58px;
  height: 32px;
  transition: all 0.3s;

  &:hover {
    background-color: #5fa795;
  }
}

.hamburger-button {
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;

  &:hover,
  &:focus {
    background: transparent;
    border: none;
  }

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
  padding: 0 15px;
  border-radius: 8px;

  .user-icon-img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

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
}

.menu-login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px 15px;
  text-align: center;

  .login-prompt {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #666;
    margin: 0;
  }
}

.google-login-button-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-family: 'Noto Sans TC', 'Roboto', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #3c4043;
  padding: 12px 24px;
  width: 100%;
  transition: all 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  i {
    font-size: 20px;
    color: #4285f4;
  }

  &:hover {
    background-color: #f8f9fa;
    border-color: #d2d4d7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

    &.logout-item {
      color: #dc3545;

      i {
        color: #dc3545;
      }

      &:hover {
        background-color: #fff5f5;
      }
    }
  }
}

.menu-points {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 400;
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: space-around;
  background: transparent;
  color: $primary;

  i {
    font-size: 24px;
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

// All Categories Button
.all-categories-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background-color: transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  color: $primary;
  text-decoration: none;
  transition: all 0.3s;
  margin-left: 10px;

  i {
    font-size: 18px;
  }

  &:hover {
    background-color: #f5f5f5;
    border-color: $primary;
    color: $primary;
  }
}

// All Categories Offcanvas
.all-categories-offcanvas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2500;
  display: flex;
  justify-content: flex-end;
}

.offcanvas-content {
  width: 100%;
  max-width: 480px;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.offcanvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;

  .offcanvas-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
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

.offcanvas-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.category-search {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 0 24px 20px;

  i {
    font-size: 18px;
    color: #666;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    color: #1e1e1e;
    outline: none;

    &::placeholder {
      color: #999;
    }
  }
}

.category-list {
  display: flex;
  flex-direction: column;
}

.category-section {
  border-bottom: 1px solid #f0f0f0;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9f9f9;
  }

  &.expandable {
    .category-name {
      flex: 1;
    }
  }
}

.category-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;

  i {
    font-size: 24px;
    color: white;
  }

  &.following {
    background-color: #6e3ba5;
  }

  &.free {
    background-color: #00b894;
  }

  .badge-new {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ff3b30;
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 8px;
  }
}

.category-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1e1e1e;
}

.expand-icon {
  font-size: 16px;
  color: #666;
  transition: transform 0.3s;
}

.subcategory-list {
  display: flex;
  flex-direction: column;
  background: #fafafa;
  overflow: hidden;
}

.subcategory-item {
  padding: 14px 24px 14px 88px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  color: #666;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background-color: #f0f0f0;
    color: $primary;
    padding-left: 92px;
  }
}

// Offcanvas Transitions
.offcanvas-enter-active,
.offcanvas-leave-active {
  transition: opacity 0.3s ease;

  .offcanvas-content {
    transition: transform 0.3s ease;
  }
}

.offcanvas-enter-from,
.offcanvas-leave-to {
  opacity: 0;

  .offcanvas-content {
    transform: translateX(100%);
  }
}

// Subcategory Transitions
.subcategory-enter-active,
.subcategory-leave-active {
  transition: all 0.3s ease;
}

.subcategory-enter-from,
.subcategory-leave-to {
  max-height: 0;
  opacity: 0;
}

.subcategory-enter-to,
.subcategory-leave-from {
  max-height: 500px;
  opacity: 1;
}

@media (max-width: 1300px) {
  .category-nav {
    visibility: hidden;
    width: 0;
  }
}

@media (max-width: 1000px) {
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

@media (max-width: 400px) {
  .header-navbar {
    height: 60px;
  }

  .header-content {
    height: 60px;
    padding: 0;
    max-width: 370px;
  }

  .header-logo {
    height: 40px;
  }

  .icon-button i {
    font-size: 28px;
  }
}
</style>
