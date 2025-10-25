import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import ItemListPage from '../views/ItemListPage.vue';
import ItemDetailPage from '../views/ItemDetailPage.vue';
import TransactionDetailsPage from '../views/TransactionDetailsPage.vue';
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
    path: '/items/:id',
    name: 'ItemDetail',
    component: ItemDetailPage
  },
  {
    path: '/items/:id/transaction',
    name: 'TransactionDetails',
    component: TransactionDetailsPage
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
    component: UserProfilePage
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: EditProfilePage
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: FavoritesPage
  },
  {
    path: '/messages',
    name: 'Messages',
    component: MessagesPage
  },
  {
    path: '/create-listing',
    name: 'CreateListing',
    component: CreateListingPage
  },
  {
    path: '/listing/:id/edit',
    name: 'EditListing',
    component: CreateListingPage
  },
  {
    path: '/settings',
    name: 'AccountSettings',
    component: AccountSettingsPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

export default router;
