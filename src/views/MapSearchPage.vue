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
      <!-- Sidebar -->
      <MapSidebar
        ref="sidebarRef"
        :results-count="state.items.length"
        :initial-filters="state.filters"
        @filter-change="handleFilterChange"
        @recenter="handleRecenter"
      />

      <!-- Map container -->
      <div class="map-content">
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

      <!-- Item info card -->
      <MapItemInfoCard
        :item="state.selectedItem"
        :show="!!state.selectedItem"
        @close="closeItemCard"
        @favorite-toggle="handleFavoriteToggle"
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import MapContainer from '@/components/MapContainer.vue'
import MapSidebar from '@/components/MapSidebar.vue'
import MapItemInfoCard from '@/components/MapItemInfoCard.vue'
import { getUserPrimaryLocation } from '@/api/get_userLocationAPI'
import { searchItems } from '@/api/get_searchItemsAPI'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Refs
const mapRef = ref(null)
const sidebarRef = ref(null)

// State
const initialLoading = ref(true)
const state = reactive({
  userLocation: null,
  items: [],
  selectedItem: null,
  filters: {
    keyword: '',
    distance_range_km: 5,
    main_category_id: null,
    sub_category_id: null,
    sort_by: 'created_at',
    sort_direction: 'desc'
  },
  loading: false,
  error: null
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

// Debounced fetch items (for search and filters)
const debouncedFetchItems = debounce(fetchItems, 500)

// Handle filter change
function handleFilterChange(filters) {
  console.log('[MapSearchPage] Filters changed:', filters)
  state.filters = { ...state.filters, ...filters }
  debouncedFetchItems()
}

// Handle recenter
function handleRecenter() {
  mapRef.value?.recenterMap()
}

// Handle marker click
function handleMarkerClick(item) {
  console.log('[MapSearchPage] Marker clicked:', item)
  state.selectedItem = item
}

// Close item card
function closeItemCard() {
  state.selectedItem = null
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
  height: calc(100vh - 60px); // Subtract header height
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

// Responsive
@media (max-width: 767.98px) {
  .map-search-page {
    height: calc(100vh - 56px); // Adjusted for mobile header
  }

  .map-content {
    height: 100%;
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
