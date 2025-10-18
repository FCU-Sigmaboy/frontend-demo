import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import ItemListPage from '../views/ItemListPage.vue';
import ItemDetailPage from '../views/ItemDetailPage.vue';
import TransactionDetailsPage from '../views/TransactionDetailsPage.vue';

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
