<template>
  <header class="app-header">
    <BNavbar class="header-navbar">
      <BContainer fluid class="px-0">
        <div class="header-content">
          <!-- Left Side: Logo & Navigation -->
          <div class="header-left">
            <div class="logo-link" @click="router.push({ name: 'Home' })" style="cursor: pointer;">
              <img :src="logoImage" alt="台中易起來" class="header-logo desktop-logo" />
              <img :src="iconImage" alt="台中易起來" class="header-logo mobile-logo" />
            </div>

            <BNav class="category-nav d-none d-md-flex">
              <BNavItem
                v-for="category in categories.slice(0, 4)"
                :key="category.id"
                @click="router.push({ name: 'ItemList', query: { category: category.id } })"
                class="category-link"
                style="cursor: pointer;"
              >
                {{ category.name }}
              </BNavItem>

            </BNav>
            <!-- All Categories Button (Desktop Only) -->
            <BButton
              id="all-categories-btn"
              variant="link"
              class="all-categories-btn d-none d-md-flex"
              @click="toggleAllCategories"
            >
              <i class="bi bi-grid-3x3-gap"></i>
              <span>所有分類</span>
            </BButton>
            <BTooltip target="all-categories-btn" placement="bottom">瀏覽所有商品分類</BTooltip>
          </div>

          <!-- Right Side Actions -->
          <div class="header-right">


            <!-- 已登入：顯示使用者資訊 -->
            <template v-if="authStore.isLoggedIn">

              <!-- Favorites/Liked Icon (Desktop) -->
              <BButton
                id="favorites-btn"
                variant="link"
                class="icon-button d-none d-md-flex"
                @click="router.push({ name: 'Favorites' })"
              >
                <i class="bi bi-heart"></i>
              </BButton>
              <BTooltip target="favorites-btn" placement="bottom">我的收藏</BTooltip>
              <!-- Transactions Icon (Desktop) -->
              <BButton
                id="transactions-btn"
                variant="link"
                class="icon-button transaction-button d-none d-md-flex"
                @click="router.push({ name: 'TransactionRecords' })"
              >
                <i class="bi bi-receipt"></i>
                <div class="transaction-badges" aria-hidden="true">
                  <span
                    v-if="pendingConfirmationCount > 0"
                    class="transaction-badge badge-pending"
                  >
                    {{ pendingConfirmationCount > 99 ? '99+' : pendingConfirmationCount }}
                  </span>
                  <span
                    v-if="inTransactionCount > 0"
                    class="transaction-badge badge-active"
                  >
                    {{ inTransactionCount > 99 ? '99+' : inTransactionCount }}
                  </span>
                </div>
              </BButton>
                <BTooltip target="transactions-btn" placement="bottom">
                  <div class="transactions-tooltip">
                    <strong>我的交易</strong>
                    <div>待確認 ({{ pendingConfirmationCount }})</div>
                    <div>交易中 ({{ inTransactionCount }})</div>
                  </div>
                </BTooltip>

              <!-- Message/Chat Icon (Desktop) -->
              <BButton
                id="messages-btn"
                variant="link"
                class="icon-button message-button d-none d-md-flex"
                @click="router.push({ name: 'Messages' })"
              >
                <i class="bi bi-chat-left"></i>
                <span v-if="unreadMessageCount > 0" class="message-badge">
                  {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}
                </span>
              </BButton>
              <BTooltip target="messages-btn" placement="bottom">聊天訊息</BTooltip>

              <!-- User Profile (Desktop) -->
              <div
                id="user-profile-info"
                class="user-info d-none d-md-flex"
                @click="router.push({ name: 'UserProfile' })"
                style="cursor: pointer;"
              >
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
              <BTooltip target="user-profile-info" placement="bottom">個人檔案</BTooltip>

              <!-- Points Display (Desktop) -->
              <div
                id="points-display"
                class="points-display d-none d-md-flex"
                @click="router.push({ name: 'Dashboard' })"
                style="cursor: pointer;"
              >
                <i class="bi bi-leaf points-icon" style="font-size: 1.2rem;"></i>
                <span class="points-value">{{ userBalance }}</span>
                <span v-if="hasNewAchievements" class="notification-dot"></span>
              </div>
              <BTooltip target="points-display" placement="bottom">點擊查看點數儀表板</BTooltip>

              <!-- Post Button (Desktop Only) -->
             <BButton
               id="post-btn"
               class="post-button d-none d-md-flex"
               @click="router.push({ name: 'CreateListing' })"
             >
               刊登
             </BButton>
             <BTooltip target="post-btn" placement="bottom">刊登新物品</BTooltip>

              <!-- Logout Button -->
              <BButton
                id="logout-btn"
                variant="outline"
                class="logout-button d-none d-md-flex"
                @click="handleLogout"
              >
                登出
              </BButton>
              <BTooltip target="logout-btn" placement="bottom">登出帳號</BTooltip>

              <!-- Mobile: Post Button + Points + Avatar (Always Visible) -->
              <div class="mobile-user-section d-md-none">
                <BButton
                  class="post-button mobile-post-button"
                  @click="router.push({ name: 'CreateListing' })"
                >
                  刊登
                </BButton>
                <div class="mobile-points" @click="router.push({ name: 'Dashboard' })" style="cursor: pointer;">
                  <i class="bi bi-leaf"></i>
                  <span>{{ userBalance }}</span>
                  <span v-if="hasNewAchievements" class="notification-dot-mobile"></span>
                </div>
                <img
                  v-if="authStore.userAvatar"
                  :src="authStore.userAvatar"
                  alt="User Avatar"
                  class="mobile-avatar"
                  @click="router.push({ name: 'UserProfile' })"
                  referrerpolicy="no-referrer"
                />
                <i v-else class="bi bi-person-circle mobile-avatar-icon" @click="router.push({ name: 'UserProfile' })"></i>
              </div>

            </template>

            <!-- 未登入：顯示 Google 登入按鈕 -->
            <template v-else>
              <BButton class="google-login-button d-none d-md-flex" @click="handleGoogleLogin">
                <i class="bi bi-google"></i>
                <span>使用 Google 登入</span>
              </BButton>

              <!-- Mobile: Login Button -->
              <BButton class="mobile-login-btn d-md-none" @click="handleGoogleLogin">
                登入
              </BButton>
            </template>

            <!-- Hamburger Menu (Mobile) -->
            <BButton
              variant="link"
              class="hamburger-button d-md-none"
              @click="toggleUnifiedMenu"
            >
              <i class="bi bi-list"></i>
            </BButton>
          </div>
        </div>
      </BContainer>
    </BNavbar>

    <!-- Unified Mobile Menu (Categories + User Menu) -->
    <Transition name="menu">
      <div v-if="showUnifiedMenu" class="unified-menu-overlay d-lg-none" @click="closeUnifiedMenu">
        <div class="unified-menu-content" @click.stop>
          <!-- Header -->
          <div class="unified-menu-header">
            <h3 class="menu-title">所有分類</h3>
            <BButton variant="link" class="close-button" @click="closeUnifiedMenu">
              <i class="bi bi-x-lg"></i>
            </BButton>
          </div>

          <div class="unified-menu-body">
            <!-- Category Search -->
            <div class="category-search">
              <i class="bi bi-search"></i>
              <input type="text" placeholder="搜尋分類..." v-model="categorySearch" />
            </div>

            <!-- Categories Section -->
            <div class="categories-section">
              <div v-for="cat in filteredCategories" :key="cat.id" class="category-section">
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
                    <div
                      v-for="sub in cat.sub_categories"
                      :key="sub.id"
                      class="subcategory-item"
                      @click="navigateToCategory(cat.id, sub.id)"
                    >
                      {{ sub.name }}
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Divider -->
            <div class="menu-divider"></div>

            <!-- User Menu Items -->
            <template v-if="authStore.isLoggedIn">
              <ul class="user-menu-list">
                <li @click="handleMenuAction('UserProfile')">
                  <i class="bi bi-person"></i>
                  <span>個人檔案</span>
                </li>
                <li @click="handleMenuAction('Favorites')">
                  <i class="bi bi-heart"></i>
                  <span>我的收藏</span>
                </li>
                <li @click="handleMenuAction('TransactionRecords')" class="menu-item-with-badge">
                  <i class="bi bi-receipt"></i>
                  <span>我的交易</span>
                  <span
                    v-if="pendingConfirmationCount > 0 || inTransactionCount > 0"
                    class="menu-transaction-badges"
                  >
                    <span
                      v-if="pendingConfirmationCount > 0"
                      class="menu-transaction-badge badge-pending"
                    >
                      {{ pendingConfirmationCount > 99 ? '99+' : pendingConfirmationCount }}
                    </span>
                    <span
                      v-if="inTransactionCount > 0"
                      class="menu-transaction-badge badge-active"
                    >
                      {{ inTransactionCount > 99 ? '99+' : inTransactionCount }}
                    </span>
                  </span>
                </li>
                <li @click="handleMenuAction('Messages')" class="menu-item-with-badge">
                  <i class="bi bi-chat-left"></i>
                  <span>聊天訊息</span>
                  <span v-if="unreadMessageCount > 0" class="menu-message-badge">
                    {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}
                  </span>
                </li>
                <li @click="handleLogout" class="logout-item">
                  <i class="bi bi-box-arrow-right"></i>
                  <span>登出</span>
                </li>
              </ul>
            </template>

            <!-- Not logged in prompt -->
            <template v-else>
              <div class="menu-login-prompt">
                <p>登入以使用完整功能</p>
                <BButton class="login-prompt-btn" @click="handleGoogleLogin">
                  <i class="bi bi-google"></i>
                  <span>使用 Google 登入</span>
                </BButton>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- All Categories Offcanvas (Desktop Only) -->
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
              <!-- <div class="category-item">
                <div class="category-icon-wrapper following">
                  <i class="bi bi-eye"></i>
                </div>
                <span class="category-name">追蹤中</span>
              </div> -->

              <!-- Free Items Section -->
              <!-- <div class="category-item">
                <div class="category-icon-wrapper free">
                  <i class="bi bi-gift"></i>
                  <span class="badge-new">NEW</span>
                </div>
                <span class="category-name">免費贈送</span>
              </div> -->

              <!-- Main Categories with Expandable Subcategories -->
              <div v-for="cat in filteredCategories" :key="cat.id" class="category-section">
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
                    <div
                      v-for="sub in cat.sub_categories"
                      :key="sub.id"
                      class="subcategory-item"
                      @click="navigateToCategory(cat.id, sub.id)"
                      style="cursor: pointer;"
                    >
                      {{ sub.name }}
                    </div>
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
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { BNavbar, BContainer, BNav, BNavItem, BButton, BTooltip } from 'bootstrap-vue-next';
import _ from 'lodash-es';
import { useAuthStore } from '../stores/auth';

import { useCategoriesStore } from '@/stores/categories.js';
import { useMessageStore } from '@/stores/message';
import { useTransactionStore } from '@/stores/transaction';

// Router & Auth Store
const router = useRouter();
const authStore = useAuthStore();
const messageStore = useMessageStore();
const transactionStore = useTransactionStore();

// Logo Images
import logoImage from '../assets/Logo.png';
import iconImage from '../assets/icon.png';

// Props
const props = defineProps({
  userPoints: {
    type: Number,
    default: 0
  }
});

window.addEventListener('scroll', _.debounce(() => {
  const header = document.querySelector('.header-navbar');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}, 50));

// Computed: 從 auth store 獲取使用者的點數
const userBalance = computed(() => {
  // Priority: Auth store profile data > Props default
  const balance = authStore.profileData?.profile_details?.balance || props.userPoints;
  // 超過一百萬顯示 999,999+，否則加上千分位格式
  if (balance > 1000000) {
    return '999,999+';
  }
  return balance.toLocaleString('zh-TW');
});

// Has new badges or achievements
const hasNewAchievements = computed(() => {
  // You can add logic here to track new achievements
  return false;
});

const pendingConfirmationCount = computed(() => transactionStore.confirming.receiver?.length ?? 0);
const inTransactionCount = computed(() => (transactionStore.pending.giver?.length ?? 0) + (transactionStore.pending.receiver?.length ?? 0));

// Unread message count
const unreadMessageCount = computed(() => {
  return messageStore.totalUnreadCount;
});

// State
const showUnifiedMenu = ref(false);
const showAllCategories = ref(false);
const categorySearch = ref('');
const expandedCategories = ref([]);

// Initialize profile when user logs in
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    // Profile data is already loaded by authStore
    console.log('User logged in, balance:', authStore.profileData?.profile_details?.balance);
  }
}, { immediate: true });

// 交易資料的初始化已在 App.vue 中統一處理，不需要在此重複呼叫
// watch(() => authStore.isLoggedIn, (isLoggedIn) => {
//   if (isLoggedIn) {
//     transactionStore.fetchAllTransactions().catch((error) => {
//       console.error('[AppHeader] 無法初始化交易資料', error);
//     });
//   }
// }, { immediate: true });

const categoriesStore = useCategoriesStore()

if (!categoriesStore.isLoaded) {
  categoriesStore.fetchCategories().catch((error) => {
    console.error('Failed to fetch categories in ExploreSection:', error);
  });
}

const categories = computed(() => categoriesStore.categories);

// Filtered categories based on search
const filteredCategories = computed(() => {
  if (!categorySearch.value) {
    return categories.value;
  }

  const searchLower = categorySearch.value.toLowerCase();

  return categories.value.map(cat => {
    // Check if category name matches
    const categoryMatches = cat.name.toLowerCase().includes(searchLower);

    // Filter subcategories that match
    const matchedSubcategories = cat.sub_categories?.filter(sub =>
      sub.name.toLowerCase().includes(searchLower)
    ) || [];

    // Return category if it matches or has matching subcategories
    if (categoryMatches || matchedSubcategories.length > 0) {
      return {
        ...cat,
        sub_categories: categoryMatches ? cat.sub_categories : matchedSubcategories
      };
    }

    return null;
  }).filter(cat => cat !== null);
});

// Methods
const toggleUnifiedMenu = () => {
  showUnifiedMenu.value = !showUnifiedMenu.value;
  if (showUnifiedMenu.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeUnifiedMenu = () => {
  showUnifiedMenu.value = false;
  document.body.style.overflow = '';
};

const handleMenuAction = (routeName) => {
  closeUnifiedMenu();
  router.push({ name: routeName });
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
  router.push({ name: 'Home' });
  console.log('已登出');
  closeUnifiedMenu();
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

// Navigate to category with subcategory
const navigateToCategory = (categoryId, subCategoryId) => {
  router.push({
    name: 'ItemList',
    query: { category: categoryId, subCategory: subCategoryId }
  });
  closeAllCategories();
  closeUnifiedMenu();
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';


.app-header {
  position: sticky;
  top: 0;
  z-index: 9000; // High enough to be above search components
  transition: all 0.1s;
}

.header-navbar {
  height: 50px;
  background-color: white;
  padding: 0;
  
  :deep(.navbar) {
    padding: 0;
  }
}

.scrolled {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f2efeb;
  transition: box-shadow 0.1s, background-color 0.1s;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1600px;
  width: 100%;
  height: 50px;
  margin: auto;
  overflow: hidden; // Prevent content from breaking out
}

// Left Side
.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
  flex-shrink: 1; // Allow shrinking if needed
  min-width: 0; // Allow content to shrink below content size

  .logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0; // Logo should never shrink
  }

  .header-logo {
    height: 35px;
    width: auto;
    object-fit: contain;
  }

  .desktop-logo {
    display: none; // Hidden by default
  }

  .mobile-logo {
    display: block; // Show icon by default (mobile first)
    height: 40px;
  }

  // Width >= 450px: Switch to full logo
  @media (min-width: 450px) {
    .desktop-logo {
      display: block;
      height: 35px;
    }

    .mobile-logo {
      display: none;
    }
  }
}

.category-nav {
  display: flex;
  gap: 30px;
  margin: 0;
  flex-shrink: 1; // Allow shrinking at medium screens
  min-width: 0;

  // Adjust for medium screens to prevent breaking
  @media (min-width: 992px) and (max-width: 1250px) {
    gap: 15px;
  }

  .category-link {
    white-space: nowrap; // Prevent text wrapping

    :deep(a) {
      font-family: 'Noto Sans TC', 'Inter', sans-serif;
      font-size: 16px;
      color: #1e1e1e;
      text-decoration: none;
      transition: color 0.3s;

      // Adjust font size slightly if needed
      @media (min-width: 992px) and (max-width: 1250px) {
        font-size: 14px;
        padding: 0.5rem 0.5rem;
      }

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
  flex-shrink: 0; // Right side buttons should not shrink
  white-space: nowrap; // Prevent wrapping
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
  position: relative;

  i {
    font-size: 24px;
    color: #1e1e1e;
  }

  &:hover i {
    color: $primary;
  }

  &.message-button {
    .message-badge {
      position: absolute;
      top: -4px;
      right: -8px;
      background: #ff4757;
      color: white;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
      animation: badge-pulse 2s ease-in-out infinite;
    }
  }
}

.transaction-button {
  position: relative;

  .transaction-badges {
    position: absolute;
    top: -6px;
    right: -10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .transaction-badge {
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    border-radius: 999px;
    background: #f2efeb;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: #1e1e1e;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  .transaction-badge.badge-pending {
    background: #ffe8d0;
    color: #d45b00;
  }

  .transaction-badge.badge-active {
    background: #e0f4ff;
    color: #0072b1;
  }
}

.transactions-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
}

@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.points-display {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 80px;
  position: relative;
  padding: 8px 12px;
  border-radius: 6px;
  background: transparent;
  border: none;
  transition: all 0.3s;

  &:hover {
    background: rgba(111, 184, 165, 0.15);
  }

  .points-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: $primary;
  }

  .points-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: $primary;
    min-width: 30px;
  }

  .notification-dot {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 8px;
    height: 8px;
    background-color: #ff6b6b;
    border-radius: 50%;
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

// Mobile User Section (Post Button + Points + Avatar)
.mobile-user-section {
  display: flex;
  align-items: center;
  gap: 8px;

  .mobile-post-button {
    font-size: 14px;
    min-width: 50px;
    height: 30px;
    padding: 0 10px;
  }
}

.mobile-points {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(111, 184, 165, 0.15);
  border-radius: 6px;
  padding: 4px 12px;
  position: relative;
  transition: all 0.3s;
  border: none;

  i {
    font-size: 16px;
    color: $primary;
  }

  span {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: $primary;
  }

  .notification-dot-mobile {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background-color: #ff6b6b;
    border-radius: 50%;
  }
}

.mobile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.7;
  }
}

.mobile-avatar-icon {
  font-size: 32px;
  color: #1e1e1e;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.7;
  }
}

.mobile-login-btn {
  background-color: $primary;
  border: none;
  border-radius: 5px;
  padding: 6px 16px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: white;
  transition: all 0.3s;

  &:hover {
    background-color: #5fa795;
  }
}

// Unified Mobile Menu (Categories + User Menu)
.unified-menu-overlay {
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

.unified-menu-content {
  width: 85%;
  max-width: 380px;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
}

.unified-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;

  .menu-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 22px;
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

.unified-menu-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.category-search {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 20px 20px 15px;

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

.categories-section {
  display: flex;
  flex-direction: column;
}

.menu-divider {
  height: 8px;
  background-color: #f5f5f5;
  margin: 15px 0;
}

.user-menu-list {
  list-style: none;
  padding: 0;
  margin: 0 20px;

  li {
    display: flex;
    align-items: center;
    gap: 15px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #1e1e1e;
    padding: 14px 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    border-bottom: 1px solid #f0f0f0;
    position: relative;

    i {
      font-size: 20px;
      color: #1e1e1e;
      width: 22px;
      text-align: center;
    }

    span {
      flex: 1;
    }

    &:hover {
      background-color: #f9f9f9;
      border-radius: 8px;
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

    &.menu-item-with-badge {
      gap: 10px;

      .menu-transaction-badges {
        margin-left: auto;
        display: flex;
        gap: 6px;
        flex: 0 0 auto;
      }

      .menu-transaction-badge {
        min-width: 24px;
        text-align: center;
        padding: 2px 6px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        color: #1e1e1e;
      }

      .menu-transaction-badge.badge-pending {
        background: #ffe8d0;
        color: #d45b00;
      }

      .menu-transaction-badge.badge-active {
        background: #e0f4ff;
        color: #0072b1;
      }

      .menu-message-badge {
        background: #ff4757;
        color: white;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 7px;
        border-radius: 12px;
        min-width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
      }
    }
  }
}

.menu-login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 30px 20px;
  text-align: center;

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    color: #666;
    margin: 0;
  }

  .login-prompt-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background-color: white;
    border: 1px solid #dadce0;
    border-radius: 8px;
    font-family: 'Noto Sans TC', 'Roboto', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #3c4043;
    padding: 12px 24px;
    width: 100%;
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
}

// Menu Transition
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s ease;

  .unified-menu-content {
    transition: transform 0.3s ease;
  }
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;

  .unified-menu-content {
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
  margin: 24px 20px;

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



// Progressive responsive breakpoints
@media (max-width: 1400px) {
  .header-left {
    gap: 20px; // Reduce gap from 30px
  }

  .category-nav {
    gap: 20px; // Reduce gap from 30px
  }

  .header-right {
    gap: 15px; // Reduce gap from 20px
  }
}

@media (max-width: 1300px) {
  .header-left {
    gap: 15px;
  }

  .category-nav {
    gap: 15px;
  }

  .header-right {
    gap: 12px;
  }

  // Hide user name text to save space
  .user-name {
    display: none;
  }
}

@media (max-width: 1200px) {
  // Hide category nav but keep all categories button
  .category-nav {
    display: none !important;
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
