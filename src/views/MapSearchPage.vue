<template>
  <div class="map-search-page">
    <!-- Loading overlay -->
    <div v-if="initialLoading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <p class="mt-3">正在初始化地圖搜尋...</p>
    </div>

    <!-- No location prompt -->
    <div v-else-if="!state.userLocation" class="no-location-prompt">
      <div class="alert alert-warning">
        <i class="bi bi-geo-alt me-2"></i>
        <h5>尚未設定主要地點</h5>
        <p>請先設定您的主要地點以使用地圖搜尋功能</p>
        <button class="btn btn-primary" @click="goToLocationSetup">
          前往設定地點
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="map-content-wrapper">
      <!-- Map container -->
      <div class="map-content">
        <!-- Floating Search and Filter Container -->
        <div class="floating-search-container" :class="{ 'sidebar-open': state.showSellerList }">
          <div class="search-filter-wrapper">
            <!-- Search Bar -->
            <div class="search-bar-section">
              <SearchBar @search="handleSearch" @menu-click="toggleSellerList" />
            </div>

            <!-- Filter Tabs -->
            <div class="filter-tabs-section">
              <FilterTabs
                :items="state.items"
                :filters="categoryFilters"
                @update:filteredItems="handleCategoryFilter"
              />
            </div>
          </div>

          <!-- Search Results Section -->
          <div class="search-results-section">
            <!-- Search Results List -->
            <SearchResultsList
              ref="searchResultsListRef"
              :show="state.showSearchResults"
              :items="state.items"
              :sub-category-filters="subCategoryFilters"
              @close="closeSearchResults"
              @item-click="handleSellerItemClick"
              @toggle-view="toggleSearchResults"
              @sub-category-filter="handleSubCategoryFilter"
            />
          </div>
        </div>

        <MapContainer
          ref="mapRef"
          :center="state.userLocation"
          :zoom="13"
          :items="state.items"
          :user-location="state.userLocation"
          :search-radius="state.filters.distance_range_km"
          @map-ready="handleMapReady"
          @marker-click="handleMarkerClick"
          @map-bounds-changed="handleMapBoundsChanged"
        />
      </div>

      <!-- Seller List Sidebar -->
      <SellerListSidebar
        :show="state.showSellerList"
        :items="state.items"
        @close="closeSellerListSidebar"
        @seller-click="handleSellerClick"
      />

      <!-- Seller Items Sidebar -->
      <SellerItemsSidebar
        :show="state.showSellerItems"
        :items="state.sellerItems"
        @close="closeSellerSidebar"
        @item-click="handleSellerItemClick"
      />

      <!-- Item Detail Modal -->
      <ItemDetailModal
        v-model="state.showItemDetail"
        :item-id="state.selectedItemId"
        @contact-seller="handleContactSeller"
      />

      <!-- List View Toggle Button -->
      <button
        class="view-toggle-btn"
        @click="toggleToListView"
      >
        <i class="bi bi-list-ul"></i>
        <span class="toggle-text">顯示列表</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'
import FilterTabs from '@/components/FilterTabs.vue'
import MapContainer from '@/components/map/MapContainer.vue'
import SearchResultsList from '@/components/map/SearchResultsList.vue'
import SellerListSidebar from '@/components/map/SellerListSidebar.vue'
import SellerItemsSidebar from '@/components/map/SellerItemsSidebar.vue'
import ItemDetailModal from '@/components/map/ItemDetailModal.vue'
import { getUserPrimaryLocation } from '@/api/get_userLocationAPI'
import { searchItems } from '@/api/get_searchItemsAPI'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { supabase } from '@/lib/supabase'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

// Refs
const mapRef = ref(null)
const searchResultsListRef = ref(null)

// State
const initialLoading = ref(true)
const state = reactive({
  userLocation: null,
  items: [],
  showSearchResults: false,
  showSellerList: false,
  showSellerItems: false,
  sellerItems: [],
  showItemDetail: false,
  selectedItemId: null,
  filters: {
    keyword: '',
    distance_range_km: null,
    main_category_id: null,
    sub_category_id: null,
    sort_by: 'created_at',
    sort_direction: 'desc'
  },
  loading: false,
  error: null
})

// Category filters for FilterTabs
const categoryFilters = computed(() => {
  const filters = [
    {
      id: 0, // Using 0 for "all categories"
      label: '全部',
      type: 'filter',
      filterFn: () => true, // Don't filter on client side
      sortable: false
    }
  ]

  // Add main categories - use category id as filter id
  categoriesStore.mainCategories.forEach(cat => {
    filters.push({
      id: cat.id, // Use category id directly as filter id
      label: cat.name,
      type: 'filter',
      filterFn: () => true, // Don't filter on client side
      sortable: false
    })
  })

  return filters
})

// Sub-category filters for FilterTabs
const subCategoryFilters = computed(() => {
  // Only show sub-categories if a main category is selected
  if (!state.filters.main_category_id) {
    return []
  }

  const filters = [
    {
      id: 0, // Using 0 for "all sub-categories"
      label: '全部',
      type: 'filter',
      filterFn: () => true,
      sortable: false
    }
  ]

  // Get sub-categories for the selected main category
  const subCategories = categoriesStore.getSubCategoriesByMainId(state.filters.main_category_id)

  subCategories.forEach(subCat => {
    filters.push({
      id: subCat.id,
      label: subCat.name,
      type: 'filter',
      filterFn: () => true,
      sortable: false
    })
  })

  return filters
})

// Check authentication
async function checkAuth() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('[MapSearchPage] User not authenticated')
      router.push('/login')
      return false
    }

    return true
  } catch (error) {
    console.error('[MapSearchPage] Auth check failed:', error)
    router.push('/login')
    return false
  }
}

// Fetch user location
async function fetchUserLocation() {
  try {
    const location = await getUserPrimaryLocation()

    if (!location) {
      console.warn('[MapSearchPage] No primary location found')
      state.userLocation = null
      return false
    }

    state.userLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      type: location.type,
      is_primary: location.is_primary,
      formatted_address: location.formatted_address
    }

    console.log('[MapSearchPage] User location loaded:', state.userLocation)
    return true

  } catch (error) {
    console.error('[MapSearchPage] Failed to fetch user location:', error)
    state.error = '無法載入使用者位置'
    return false
  }
}

// Fetch items
async function fetchItems() {
  if (!state.userLocation) return

  state.loading = true
  state.error = null

  try {
    console.log('[MapSearchPage] Fetching items with filters:', state.filters)

    const data = await searchItems({
      distance_range_km: state.filters.distance_range_km,
      main_category_id: state.filters.main_category_id,
      sub_category_id: state.filters.sub_category_id,
      keyword: state.filters.keyword,
      page: 1,
      size: 100, // Fetch more items for map view
      sort_by: state.filters.sort_by,
      sort_direction: state.filters.sort_direction
    })

    state.items = data || []
    console.log(`[MapSearchPage] Loaded ${state.items.length} items`)

  } catch (error) {
    console.error('[MapSearchPage] Failed to fetch items:', error)
    state.error = '搜尋失敗，請稍後再試'
    state.items = []
  } finally {
    state.loading = false
  }
}

// Handle marker click
function handleMarkerClick(item, allItems) {
  console.log('[MapSearchPage] Marker clicked:', item, 'All items:', allItems)

  // Get the user ID from the clicked item
  const userId = item.user?.user_id || item.user?.id

  if (!userId) {
    console.warn('[MapSearchPage] No user ID found for clicked item')
    return
  }

  // Show search results if not already visible
  if (!state.showSearchResults) {
    state.showSearchResults = true
  }

  // Wait for next tick to ensure search results are rendered
  nextTick(() => {
    // Scroll to the seller in the search results list
    if (searchResultsListRef.value && searchResultsListRef.value.scrollToSeller) {
      searchResultsListRef.value.scrollToSeller(userId)
    }
  })
}

// Close seller list sidebar
function closeSellerListSidebar() {
  state.showSellerList = false
}

// Handle seller click from seller list
function handleSellerClick(seller) {
  console.log('[MapSearchPage] Seller clicked:', seller)
  // Keep seller list open and show seller items
  state.sellerItems = seller.items
  state.showSellerItems = true
}

// Close seller sidebar
function closeSellerSidebar() {
  state.showSellerItems = false
  state.sellerItems = []
}

// Handle item click from seller sidebar
function handleSellerItemClick(item) {
  console.log('[MapSearchPage] Seller item clicked:', item)
  // Open item detail modal
  state.selectedItemId = item.item_id
  state.showItemDetail = true
}

// Handle contact seller
function handleContactSeller(item) {
  console.log('[MapSearchPage] Contact seller:', item)
  // TODO: Implement contact seller functionality
  // Could navigate to messages or open chat modal
}

// Handle favorite toggle
function handleFavoriteToggle(item) {
  console.log('[MapSearchPage] Favorite toggled:', item)
  // Update item in state
  const index = state.items.findIndex(i => i.item_id === item.item_id)
  if (index !== -1) {
    state.items[index] = { ...state.items[index], ...item }
  }
}

// Handle map ready
function handleMapReady(map) {
  console.log('[MapSearchPage] Map ready:', map)
}

// Handle map bounds changed
function handleMapBoundsChanged(bounds) {
  console.log('[MapSearchPage] Map bounds changed:', bounds)
  // Future: Could implement viewport-based loading
}

// Go to location setup
function goToLocationSetup() {
  // TODO: Navigate to location setup page
  router.push('/settings')
}

// Handle search from SearchBar
async function handleSearch(searchParams) {
  state.filters.keyword = searchParams.query || ''
  // If distance is empty string (不限距離), set to null, otherwise parse as integer
  state.filters.distance_range_km = searchParams.distance ? parseInt(searchParams.distance) : null

  // Fetch items
  await fetchItems()

  // Always show search results after search (even if empty, to show "no results" message)
  state.showSearchResults = true
}

// Handle category filter from FilterTabs
async function handleCategoryFilter() {
  console.log('[MapSearchPage] Category filter triggered')

  // Use nextTick to ensure the DOM is updated with the new active filter
  await nextTick()

  // Find which filter is currently active by checking the DOM
  const activeTab = document.querySelector('.filter-tabs-section:not(.sub-category-tabs) .filter-tab.active')

  if (activeTab) {
    // Get the filter label to match against our categoryFilters
    const activeLabel = activeTab.querySelector('.filter-label')?.textContent?.trim()
    const activeFilter = categoryFilters.value.find(f => f.label === activeLabel)

    if (activeFilter) {
      // Filter id is the category id (0 means all categories)
      state.filters.main_category_id = activeFilter.id === 0 ? null : activeFilter.id
      // Reset sub-category filter when main category changes
      state.filters.sub_category_id = null
      console.log('[MapSearchPage] Updated category filter to:', state.filters.main_category_id)

      // Re-fetch items with the new category filter
      await fetchItems()

      // Always show search results (even if empty, to show "no results" message)
      state.showSearchResults = true
    }
  }
}

// Handle sub-category filter from FilterTabs
async function handleSubCategoryFilter() {
  console.log('[MapSearchPage] Sub-category filter triggered')

  // Use nextTick to ensure the DOM is updated with the new active filter
  await nextTick()

  // Find which filter is currently active in the sub-category tabs
  const activeTab = document.querySelector('.sub-category-filters .filter-tab.active')

  if (activeTab) {
    // Get the filter label to match against our subCategoryFilters
    const activeLabel = activeTab.querySelector('.filter-label')?.textContent?.trim()
    const activeFilter = subCategoryFilters.value.find(f => f.label === activeLabel)

    if (activeFilter) {
      // Filter id is the sub-category id (0 means all sub-categories)
      state.filters.sub_category_id = activeFilter.id === 0 ? null : activeFilter.id
      console.log('[MapSearchPage] Updated sub-category filter to:', state.filters.sub_category_id)

      // Re-fetch items with the new sub-category filter
      await fetchItems()

      // Always show search results (even if empty, to show "no results" message)
      state.showSearchResults = true
    }
  }
}

// Close search results
function closeSearchResults() {
  state.showSearchResults = false
}

// Toggle search results
function toggleSearchResults() {
  state.showSearchResults = !state.showSearchResults
}

// Toggle seller list sidebar
function toggleSellerList() {
  state.showSellerList = !state.showSellerList
}

// Toggle to list view
function toggleToListView() {
  router.push({ name: 'Home' })
}

// Initialize page
async function initialize() {
  initialLoading.value = true

  try {
    // Check authentication
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) return

    // Fetch categories
    await categoriesStore.fetchCategories()

    // Fetch user location
    const hasLocation = await fetchUserLocation()
    if (!hasLocation) {
      initialLoading.value = false
      return
    }

    // Fetch initial items
    await fetchItems()

  } catch (error) {
    console.error('[MapSearchPage] Initialization failed:', error)
    state.error = '初始化失敗，請重新載入頁面'
  } finally {
    initialLoading.value = false
  }
}

// Watch for user location changes (in case user updates it)
watch(() => state.userLocation, (newLocation) => {
  if (newLocation) {
    fetchItems()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  initialize()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.map-search-page {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 500px;
  background: #f8f9fa;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: white;

  p {
    color: $primary;
    font-size: 0.95rem;
    margin: 0;
  }
}

.no-location-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;

  .alert {
    max-width: 500px;
    text-align: center;
    padding: 2rem;

    h5 {
      font-weight: 600;
      margin-bottom: 1rem;
    }

    p {
      margin-bottom: 1.5rem;
      color: #666;
    }

    i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  }
}

.map-content-wrapper {
  display: flex;
  height: 100%;
  position: relative;

  @media (max-width: 767.98px) {
    flex-direction: column;
  }
}

.map-content {
  flex: 1;
  height: 100%;
  position: relative;
}

// Floating Search and Filter Container
.floating-search-container {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.3s ease;
  pointer-events: none; // Allow map interaction through the container

  &.sidebar-open {
    transform: translateX(350px);
  }

  .search-filter-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    pointer-events: none; // Allow map interaction through wrapper

    > * {
      pointer-events: auto; // But enable interaction with child elements
    }
  }

  .search-bar-section {
    flex: 0 0 auto;
    max-width: 600px;
    width: 100%;

    :deep(.search-bar-wrapper) {
      padding: 0;
      max-width: 100%;
    }

    :deep(.search-bar) {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15),
                  0 2px 6px rgba(0, 0, 0, 0.10);
    }
  }

  .filter-tabs-section {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;

    // 隱藏滾動條
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }

    :deep(.filter-tabs-wrapper) {
      padding: 0;
      max-width: 100%;
    }

    :deep(.filter-tabs) {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 4px;

      // 隱藏滾動條
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    :deep(.filter-tab) {
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .search-results-section {
    max-width: 600px;
    width: 100%;
    pointer-events: none; // Allow map interaction through empty space

    // But enable interaction with the actual results list
    > * {
      pointer-events: auto;
    }
  }
}

// Responsive
@media (max-width: 767.98px) {
  .map-search-page {
    height: 100vh
  }

  .map-content {
    height: 100%;
  }

  .floating-search-container {
    top: 12px;
    left: 12px;
    right: 12px;

    // On mobile, don't move when sidebar is open (sidebar slides from bottom)
    &.sidebar-open {
      transform: none;
    }

    .search-filter-wrapper {
      flex-direction: column;
      gap: 8px;
    }

    .search-bar-section {
      max-width: none;
    }

    .filter-tabs-section {
      width: 100%;
    }

    .search-results-section {
      max-width: none;
    }
  }
}

@media (max-width: 575.98px) {
  .no-location-prompt {
    padding: 1rem;

    .alert {
      padding: 1.5rem;

      i {
        font-size: 1.5rem;
      }

      h5 {
        font-size: 1.1rem;
      }

      p {
        font-size: 0.9rem;
      }
    }
  }

  // Map/List Toggle Button - Mobile: same size as FAB
  .view-toggle-btn {
    bottom: 90px !important; // Above the floating action button
    right: 24px !important;
    left: auto !important;
    transform: none !important;
    padding: 0 !important;
    border-radius: 50% !important;
    width: 56px !important; // Match FAB size
    height: 56px !important; // Match FAB size
    justify-content: center;

    .toggle-text {
      display: none; // Hide text on mobile
    }

    i {
      font-size: 22px;
    }

    &:hover {
      transform: translateY(-3px) !important;
    }

    &:active {
      transform: translateY(-1px) !important;
    }
  }
}

// Map/List View Toggle Button
.view-toggle-btn {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 998;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  i {
    font-size: 18px;
    color: #1e1e1e;
  }

  .toggle-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #1e1e1e;
    letter-spacing: 0.3px;
  }

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateX(-50%) translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    border-color: rgba(0, 0, 0, 0.12);
  }

  &:active {
    transform: translateX(-50%) translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}
</style>
