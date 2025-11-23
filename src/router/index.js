import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import ItemListPage from '../views/ItemListPage.vue';
import ItemDetailPage from '../views/ItemDetailPage.vue';
import AboutPage from '../views/AboutPage.vue';
import TermsPage from '../views/TermsPage.vue';
import FAQPage from '../views/FAQPage.vue';
import HowToTradePage from '../views/HowToTradePage.vue';
// User-related pages
import UserProfilePage from '../views/UserProfilePage.vue';
import EditProfilePage from '../views/EditProfilePage.vue';
import FavoritesPage from '../views/FavoritesPage.vue';
import MessagesPage from '../views/MessagesPage.vue';
import CreateListingPage from '../views/CreateListingPage.vue';
import AccountSettingsPage from '../views/AccountSettingsPage.vue';
import ManageListingsPage from '../views/ManageListingsPage.vue';
import MyReviewsPage from '../views/MyReviewsPage.vue';
import MyFollowersPage from '../views/MyFollowersPage.vue';
import PublicUserProfilePage from '../views/PublicUserProfilePage.vue';
import MyTransactionsPage from '../views/MyTransactionsPage.vue';
import MapSearchPage from '../views/MapSearchPage.vue';
import UserDashboardPage from '../views/UserDashboardPage.vue';
// Admin pages
import AdminDashboardPage from '../views/AdminDashboardPage.vue';

import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/items',
    name: 'ItemList',
    component: ItemListPage
  },
  {
    path: '/map-search',
    name: 'MapSearch',
    component: MapSearchPage
  },
  {
    path: '/items/:id',
    name: 'ItemDetail',
    component: ItemDetailPage
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsPage
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQPage
  },
  {
    path: '/how-to-trade',
    name: 'HowToTrade',
    component: HowToTradePage
  },
  // User routes
  {
    path: '/profile',
    name: 'UserProfile',
    meta: { requiresAuth: true },
    component: UserProfilePage
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    meta: { requiresAuth: true },
    component: EditProfilePage
  },
  {
    path: '/favorites',
    name: 'Favorites',
    meta: { requiresAuth: true },
    component: FavoritesPage
  },
  {
    path: '/messages',
    name: 'Messages',
    meta: { requiresAuth: true },
    component: MessagesPage
  },
  {
    path: '/create-listing',
    name: 'CreateListing',
    meta: { requiresAuth: true },
    component: CreateListingPage
  },
  {
    path: '/listing/:id/edit',
    name: 'EditListing',
    meta: { requiresAuth: true },
    component: CreateListingPage
  },
  {
    path: '/settings',
    name: 'AccountSettings',
    meta: { requiresAuth: true },
    component: AccountSettingsPage
  },
  {
    path: '/manage-listings',
    name: 'ManageListings',
    meta: { requiresAuth: true },
    component: ManageListingsPage
  },
  {
    path: '/my-reviews',
    name: 'MyReviews',
    meta: { requiresAuth: true },
    component: MyReviewsPage
  },
  {
    path: '/my-followers',
    name: 'MyFollowers',
    meta: { requiresAuth: true },
    component: MyFollowersPage
  },
  {
    path: '/user/:id',
    name: 'PublicUserProfile',
    meta: { requiresAuth: true },
    component: PublicUserProfilePage
  },
  {
    path: '/transactions',
    name: 'TransactionRecords',
    meta: { requiresAuth: true },
    component: MyTransactionsPage
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: { requiresAuth: true },
    component: UserDashboardPage
  },
  // Admin routes
  {
    path: '/admin',
    name: 'AdminDashboard',
    meta: { requiresAuth: true, requiresAdmin: true },
    component: AdminDashboardPage
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 如果頁面需要認證，先等待 auth 初始化完成
  if (to.meta.requiresAuth) {
    // 確保 auth 已經初始化（檢查 session）
    if (!authStore.session && !authStore.isLoggedIn) {
      try {
        // 嘗試從 Supabase 恢復 session
        await authStore.initAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    }

    // 初始化後仍未登入，才觸發 Google 登入
    if (!authStore.isLoggedIn) {
      try {
        await authStore.signInWithGoogle();
        if (authStore.isLoggedIn) {
          next();
        } else {
          next({ path: '/' });
        }
      } catch (error) {
        console.error('Sign in failed:', error);
        next({ path: '/' });
      }
    } else {
      next();
    }
  } else {
    next();
  }
})

export default router;
