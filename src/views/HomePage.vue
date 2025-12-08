<template>
  <div class="home-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Search Bar Section -->
      <section class="search-section">
        <div class="search-section-container">
          <!-- Map View Toggle Button -->
          <button class="map-toggle-btn" title="map toggle button" @click="toggleToMapView">
            <i class="bi bi-map"></i>
          </button>

          <SearchBar @search="handleSearch" />
        </div>
      </section>

      <!-- Hero Banner Section -->
      <section class="hero-section">
        <HeroBanner />
      </section>

      <!-- Explore Categories Section -->
      <ExploreSection @category-click="handleCategoryClick" />

      <!-- Filter Tabs Section -->
      <section class="filter-section">
        <div class="filter-section-container">
          <!-- Location Switcher -->
          <div class="location-switcher">
            <button class="location-btn" @click="toggleLocationMenu">
              <i class="bi bi-geo-alt-fill"></i>
              <span class="location-text">
                {{ currentLocationType === 'current' ? '目前位置' :
                   currentLocationType === 'home' ? '家' : '公司' }}
              </span>
              <i class="bi bi-chevron-down"></i>
            </button>

            <!-- Location Menu -->
            <div v-if="showLocationMenu" class="location-menu">
              <button
                class="location-option"
                :class="{ active: currentLocationType === 'current' }"
                @click="switchLocation('current')"
              >
                <i class="bi bi-geo-alt-fill"></i>
                <span>目前位置</span>
              </button>
              <button
                class="location-option"
                :class="{ active: currentLocationType === 'home', disabled: !savedLocations.home }"
                :disabled="!savedLocations.home"
                @click="switchLocation('home')"
              >
                <i class="bi bi-house-fill"></i>
                <span>家</span>
                <span v-if="!savedLocations.home" class="not-set">(未設定)</span>
              </button>
              <button
                class="location-option"
                :class="{ active: currentLocationType === 'work', disabled: !savedLocations.work }"
                :disabled="!savedLocations.work"
                @click="switchLocation('work')"
              >
                <i class="bi bi-briefcase-fill"></i>
                <span>公司</span>
                <span v-if="!savedLocations.work" class="not-set">(未設定)</span>
              </button>
            </div>
          </div>

          <FilterTabs :items="products" :filters="filters" v-model:sortedItems="displayedProducts" />
        </div>
      </section>

      <!-- Product Grid Section -->
      <section class="products-section">
        <div class="products-container">
          <!-- Loading Skeleton -->
          <div v-if="loading" class="products-grid">
            <div v-for="i in 8" :key="`skeleton-${i}`" class="skeleton-product-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
              </div>
            </div>
          </div>

          <!-- Actual Product Cards -->
          <TransitionGroup
            v-else
            name="product-list"
            tag="div"
            class="products-grid"
          >
            <ProductCard
              v-for="product in displayedProducts"
              :key="product.item_id"
              :product="product"
              @click="goToProductDetail(product.item_id)"
              @favorite-toggle="handleFavoriteToggle"
              @contact-seller="handleContactSeller"
            />
          </TransitionGroup>

          <!-- Load More Button -->
          <div v-if="!loading && hasMore && displayedProducts && displayedProducts.length > 0" class="load-more-section">
            <button class="load-more-btn" @click="loadMore">
              載入更多
            </button>
          </div>
        </div>
      </section>

      <!-- Scroll to Top Button -->
      <button
        v-show="showScrollTop"
        class="scroll-top-btn"
        @click="scrollToTop"
      >
        <i class="bi bi-arrow-up"></i>
      </button>

    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import SearchBar from '../components/SearchBar.vue';
import HeroBanner from '../components/HeroBanner.vue';
import ExploreSection from '../components/ExploreSection.vue';
import FilterTabs from '../components/FilterTabs.vue';
import ProductCard from '../components/ProductCard.vue';

import { supabase } from '@/lib/supabase';
import { searchItems } from '@/api/itemsAPI';
import { sortByRecommendation } from '@/utils/sortFunctions.js';
import { createOrGetConversation } from '@/api/conversationAPI.js';
import { useAuthStore } from '@/stores/auth';
import { getMyLocations } from '@/api/locationAPI';

const router = useRouter();
const authStore = useAuthStore();

// State
const userPoints = ref(500);
const showScrollTop = ref(false);

const authenticatedUser = ref(null);

// Location switching
const currentLocationType = ref('current'); // 'current', 'home', 'work'
const savedLocations = ref({
  home: null,
  work: null
});
const showLocationMenu = ref(false);
const userLocation = ref(null);

// Filters
const filters = ref([
  {
    id: 1,
    label: '上架時間',
    sortKey: 'created_at',
    defaultOrder: 'desc',  // 預設：晚到早
    ascText: '晚到早',
    descText: '早到晚'
  },
  {
    id: 2,
    label: '距離',
    sortKey: 'distance_km',
    defaultOrder: 'asc',   // 預設：近到遠
    ascText: '近到遠',
    descText: '遠到近'
  },
  {
    id: 3,
    label: '價格',
    sortKey: 'price',
    defaultOrder: 'asc',   // 預設：低到高
    ascText: '低到高',
    descText: '高到低'
  }
]);

// Products data
const products = ref([]);
const displayedProducts = ref([]);
const loading = ref(false);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);

// Methods
const handleSearch = (searchData) => {
  console.log('Search:', searchData);
  // Navigate to item list page with search query
  router.push({
    name: 'ItemList',
    query: { search: searchData.query, distance: searchData.distance }
  });
};

const handleCategoryClick = (category) => {
  console.log('Category clicked:', category);
  // Navigate to item list page with category filter
  router.push({
    name: 'ItemList',
    query: { category: category.id }
  });
};

const handleFavoriteToggle = (data) => {
  console.log('Favorite toggled:', data);
  // Implement favorite logic
};

const handleContactSeller = async (productId) => {
  // Check if user is logged in
  if (!authStore.user) {
    alert('請先登入才能發送訊息');
    router.push('/login');
    return;
  }

  try {
    console.log('Starting chat for item:', productId);

    // Find the product in products list to get seller ID
    const targetProduct = products.value.find(p => (p.item_id || p.id) === productId);
    if (!targetProduct || !targetProduct.user?.id) {
      throw new Error('無法找到商品資訊');
    }

    // Don't allow messaging yourself
    if (targetProduct.user.id === authStore.user.id) {
      alert('無法向自己發送訊息');
      return;
    }

    // Start or find conversation using V2 API
    const result = await createOrGetConversation(targetProduct.user.id, productId);
    console.log('Chat started, conversation ID:', result.conversation_id);

    // Navigate to messages page
    router.push('/messages');
  } catch (error) {
    console.error('Failed to start chat:', error);
    alert('無法開始聊天，請稍後再試');
  }
};

const goToProductDetail = (productId) => {
  router.push({ name: 'ItemDetail', params: { id: productId } });
};

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 500;
  
  const searchSection = document.querySelector('.search-section-container');
  const mapToggleBtn = document.querySelector('.map-toggle-btn');

  if (searchSection) {
    if (window.scrollY > 300) {
      searchSection.classList.add('scrolled');
      mapToggleBtn.classList.add('scrolled');
    } else {
      searchSection.classList.remove('scrolled');
      mapToggleBtn.classList.remove('scrolled');
    }
  }
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleToMapView = () => {
  router.push({ name: 'MapSearch' });
};

// Parse PostGIS WKB format to lat/lng
function parseWKBPoint(wkbHex) {
  try {
    const coordsStartChar = 18;
    const lonHex = wkbHex.substring(coordsStartChar, coordsStartChar + 16);
    const latHex = wkbHex.substring(coordsStartChar + 16, coordsStartChar + 32);

    if (!lonHex || !latHex || lonHex.length !== 16 || latHex.length !== 16) {
      return { latitude: null, longitude: null };
    }

    const lonMatch = lonHex.match(/.{2}/g);
    const latMatch = latHex.match(/.{2}/g);

    if (!lonMatch || !latMatch) {
      return { latitude: null, longitude: null };
    }

    const lonBytes = new Uint8Array(lonMatch.map(byte => parseInt(byte, 16)));
    const latBytes = new Uint8Array(latMatch.map(byte => parseInt(byte, 16)));

    const longitude = new DataView(lonBytes.buffer).getFloat64(0, true);
    const latitude = new DataView(latBytes.buffer).getFloat64(0, true);

    return { latitude, longitude };
  } catch (error) {
    console.error('[HomePage] Failed to parse WKB:', error);
    return { latitude: null, longitude: null };
  }
}

// Fetch saved locations (home and work)
async function fetchSavedLocations() {
  try {
    const locations = await getMyLocations();

    if (locations && locations.length > 0) {
      locations.forEach(location => {
        let latitude = null;
        let longitude = null;

        if (location.coordinates) {
          const coords = parseWKBPoint(location.coordinates);
          latitude = coords.latitude;
          longitude = coords.longitude;
        }

        if (latitude !== null && longitude !== null) {
          const locationData = {
            ...location,
            latitude,
            longitude
          };

          if (location.type === '家') {
            savedLocations.value.home = locationData;
          } else if (location.type === '公司') {
            savedLocations.value.work = locationData;
          }
        }
      });
    }
  } catch (error) {
    console.error('[HomePage] Failed to fetch saved locations:', error);
  }
}

// Fetch current location
async function fetchCurrentLocation() {
  try {
    if (!navigator.geolocation) {
      console.error('[HomePage] Geolocation is not supported');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            type: 'current'
          };
          resolve(true);
        },
        (error) => {
          console.error('[HomePage] Failed to get current location:', error);
          userLocation.value = null;
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  } catch (error) {
    console.error('[HomePage] Failed to fetch current location:', error);
    return false;
  }
}

// Switch location
async function switchLocation(locationType) {
  currentLocationType.value = locationType;
  showLocationMenu.value = false;

  switch (locationType) {
    case 'current':
      await fetchCurrentLocation();
      break;
    case 'home':
      if (savedLocations.value.home) {
        userLocation.value = savedLocations.value.home;
      }
      break;
    case 'work':
      if (savedLocations.value.work) {
        userLocation.value = savedLocations.value.work;
      }
      break;
  }

  // Reload products with new location
  if (userLocation.value) {
    await loadProductsWithLocation();
  }
}

// Toggle location menu
function toggleLocationMenu() {
  showLocationMenu.value = !showLocationMenu.value;
}

// Close location menu when clicking outside
function handleClickOutside(event) {
  const locationSwitcher = document.querySelector('.location-switcher');
  if (locationSwitcher && !locationSwitcher.contains(event.target)) {
    showLocationMenu.value = false;
  }
}

// Load products with location
async function loadProductsWithLocation() {
  loading.value = true;
  currentPage.value = 1;
  
  try {
    const params = {
      page: 1,
      size: pageSize.value
    };
    
    if (userLocation.value) {
      params.user_latitude = userLocation.value.latitude;
      params.user_longitude = userLocation.value.longitude;
    }
    
    const data = await searchItems(params);
    products.value = data || [];
    displayedProducts.value = data || [];
    
    if (!data || data.length < pageSize.value) {
      hasMore.value = false;
    } else {
      hasMore.value = true;
    }
  } catch (error) {
    console.error('Failed to load products:', error);
  } finally {
    loading.value = false;
  }
}

// Load more products
const loadMore = async () => {
  if (loading.value || !hasMore.value) return;
  
  // Save current scroll position
  const scrollPosition = window.scrollY;
  
  loading.value = true;
  currentPage.value += 1;
  
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    };
    
    if (userLocation.value) {
      params.user_latitude = userLocation.value.latitude;
      params.user_longitude = userLocation.value.longitude;
    }
    
    const data = await searchItems(params);
    
    if (data && data.length > 0) {
      products.value = [...products.value, ...data];
      displayedProducts.value = [...products.value];
      
      // Restore scroll position after DOM update
      await new Promise(resolve => setTimeout(resolve, 0));
      window.scrollTo(0, scrollPosition);
      
      // Check if there are more products to load
      if (data.length < pageSize.value) {
        hasMore.value = false;
      }
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('Failed to load more products:', error);
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  authenticatedUser.value = user;
  if (authenticatedUser.value) {
    filters.value.push({
      id: 4,
      label: '為你推薦',
      sortFn: sortByRecommendation,
      sortable: false  // 不可切換排序方向
    });
  }

  // Fetch saved locations
  await fetchSavedLocations();
  
  // Fetch current location
  await fetchCurrentLocation();

  // Load products (first page)
  loading.value = true;
  try {
    const params = {
      page: 1,
      size: pageSize.value
    };
    
    if (userLocation.value) {
      params.user_latitude = userLocation.value.latitude;
      params.user_longitude = userLocation.value.longitude;
    }
    
    const data = await searchItems(params);
    products.value = data || [];
    displayedProducts.value = data || [];
    
    // Check if there are more products
    if (!data || data.length < pageSize.value) {
      hasMore.value = false;
    }
    
    console.log('Products loaded:', data);
  } catch (error) {
    console.error('Failed to load products:', error);
  } finally {
    loading.value = false;
  }

  // Add scroll listener
  window.addEventListener('scroll', handleScroll);
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

// Search Section
.search-section {
  padding: 10px 0;
  margin-top: 10px;
  position: sticky;
  top: 60px;
  z-index: 100;
}

.search-section-container {
  display: flex;
  align-items: center;
  max-width: 1600px;
  gap: 10px;
  margin: 0 auto;
  padding: 0 20px;
  transition: all 0.3s ease-in-out;
}

.search-section-container.scrolled {
  background: transparent;
  max-width: 800px;

  .map-toggle-btn {
    background-color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
  }

  .search-bar-wrapper {
    background-color: rgba(255, 255, 255, 0);
    backdrop-filter: blur(10px);
  } 
}

// Map Toggle Button (Square style next to SearchBar)
.map-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  width: 128px;
  gap: 10px;
  padding: 0 15px;
  background: white;
  border: 1px solid #d5d5d5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  &::after {
    content: '顯示地圖';
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1e1e1e;
  }

  i {
    font-size: 22px;
    color: #6fb8a5;
  }

  &:hover {
    background: #f8f9fa;
    border-color: #6fb8a5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(-1px);
  }
}

// Hero Section
.hero-section {
  padding: 20px 0;
}

// Filter Section
.filter-section {
  padding: 30px 0 20px;
}

.filter-section-container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

// Products Section
.products-section {
  padding: 20px 0 40px;
}

.products-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 20px;
  justify-content: space-between;
}

// Skeleton Product Card
.skeleton-product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-image {
  width: 100%;
  height: 330px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-title {
  width: 80%;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-text {
  width: 100%;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;

  &.short {
    width: 60%;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Product List Animations
.product-list-move,
.product-list-enter-active,
.product-list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.product-list-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.product-list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-30px);
}

.product-list-leave-active {
  position: absolute;
}

// Location Switcher (Inline style for filter section)
.location-switcher {
  position: relative;
  z-index: 99;

  .location-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 32px;
    padding: 0 16px;
    background: white;
    border: none;
    border-radius: 5px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;

    i {
      font-size: 16px;
      color: #6fb8a5;

      &.bi-chevron-down {
        display: inline-block;
        font-size: 12px;
        color: #666;
        margin-left: 2px;
        transition: transform 0.2s;
      }
    }

    .location-text {
      display: inline-block;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1e1e1e;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  .location-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    min-width: 180px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    animation: slideDown 0.2s ease-out;

    .location-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border: none;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;

      i {
        font-size: 16px;
        color: #666;
        width: 20px;
      }

      span {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #1e1e1e;

        &.not-set {
          font-size: 12px;
          color: #999;
          margin-left: auto;
        }
      }

      &:last-child {
        border-bottom: none;
      }

      &:hover:not(:disabled) {
        background: #f8f9fa;
      }

      &.active {
        background: rgba(111, 184, 165, 0.1);

        i {
          color: #6fb8a5;
        }

        span {
          color: #6fb8a5;
          font-weight: 600;
        }
      }

      &.disabled,
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;

        &:hover {
          background: white;
        }
      }
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

// Scroll to Top Button
.scroll-top-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(6px);

  i {
    font-size: 24px;
    color: #1e1e1e;
    text-shadow: 0 0 1px rgba(0, 0, 0, 0.45);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 28px rgba(66, 128, 112, 0.28);
    animation: gentle-shake 0.55s ease-in-out;
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 3px solid rgba(111, 184, 165, 0.3);
    outline-offset: 3px;
  }
}

@keyframes gentle-shake {
  0% { transform: translateY(-3px) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(-2deg); }
  50% { transform: translateY(-4px) rotate(2deg); }
  75% { transform: translateY(-5px) rotate(-1deg); }
  100% { transform: translateY(-3px) rotate(0deg); }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-top-btn {
    transition: none;
  }

  .scroll-top-btn:hover {
    animation: none;
    transform: translateY(-3px);
  }
}

// Load More Section
.load-more-section {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 40px 20px;

  .load-more-btn {
    padding: 12px 32px;
    background: white;
    border: 2px solid #6fb8a5;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #6fb8a5;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: #6fb8a5;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }

    &:active {
      transform: translateY(-1px);
    }
  }
}

// Responsive
@media (max-width: 1199.98px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
}

@media (max-width: 991.98px) {
  .search-section {
    padding: 15px 0;
    margin-top: 5px;
  }

  .search-section-container {
    padding: 0 15px;
    gap: 10px;
  }

  .map-toggle-btn {
    width: 128px;
    height: 52px;

    i {
      font-size: 20px;
    }
  }

  .hero-section {
    padding: 15px 0;
  }

  .filter-section {
    padding: 25px 0 18px;
  }

  .filter-section-container {
    padding: 0 15px;
    gap: 12px;
  }

  .products-section {
    padding: 18px 0 35px;
  }

  .products-container {
    padding: 0 15px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }

  .scroll-top-btn {
    i {
      font-size: 18px;
    }
  }
}

@media (max-width: 575.98px) {
  .search-section-container {
    flex-direction: column;
    padding: 0 10px;
    gap: 10px;
  }

  .map-toggle-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    gap: 8px;
    order: 1; // Place after SearchBar

    &::after {
      content: '顯示地圖';
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1e1e1e;
    }

    i {
      font-size: 18px;
    }
  }

  .map-toggle-btn.scrolled {
    width: 25%;
    min-width: 120px;
    background-color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
  }

  .filter-section-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 0 10px;
  }

  .location-switcher {
    .location-btn {
      width: 100%;
      justify-content: flex-start;
      height: 36px;
      padding: 0 14px;
    }

    .location-menu {
      width: 100%;
      min-width: unset;
    }
  }

  .search-section {
    padding: 12px 0;
    margin-top: 0;
  }

  .hero-section {
    padding: 12px 0;
  }

  .filter-section {
    padding: 20px 0 15px;
  }

  .products-section {
    padding: 15px 0 30px;
  }

  .products-container {
    padding: 0 10px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
    gap: 12px;
  }

  // Scroll to Top Button - Mobile: hidden to leave space for chat CTA
  .scroll-top-btn {
    display: none;
  }
}
</style>
