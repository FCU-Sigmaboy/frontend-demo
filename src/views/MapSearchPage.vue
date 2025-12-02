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
        <h5>無法取得位置資訊</h5>
        <p v-if="state.error">{{ state.error }}</p>
        <p v-else>請允許瀏覽器存取您的位置以使用地圖搜尋功能</p>
        <button class="btn btn-primary" @click="initialize">
          重新嘗試
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="map-content-wrapper">
      <!-- Map container -->
      <div class="map-content">
        <!-- Floating Search and Filter Container -->
        <div class="floating-search-container">
          <div class="search-filter-wrapper">
            <!-- Search Bar -->
            <div class="search-bar-section">
              <SearchBar @search="handleSearch" />
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

      <!-- Item Detail Modal -->
      <ItemDetailModal
        v-model="state.showItemDetail"
        :item-id="state.selectedItemId"
        :user-location="state.userLocation"
        @contact-seller="handleContactSeller"
      />

      <!-- Location Switcher -->
      <div class="location-switcher">
        <button class="location-btn" @click="toggleLocationMenu">
          <i class="bi bi-geo-alt-fill"></i>
          <span class="location-text">
            {{ state.currentLocationType === 'current' ? '目前位置' :
               state.currentLocationType === 'home' ? '家' : '公司' }}
          </span>
          <i class="bi bi-chevron-down"></i>
        </button>

        <!-- Location Menu -->
        <div v-if="state.showLocationMenu" class="location-menu">
          <button
            class="location-option"
            :class="{ active: state.currentLocationType === 'current' }"
            @click="switchLocation('current')"
          >
            <i class="bi bi-geo-alt-fill"></i>
            <span>目前位置</span>
          </button>
          <button
            class="location-option"
            :class="{ active: state.currentLocationType === 'home', disabled: !state.savedLocations.home }"
            :disabled="!state.savedLocations.home"
            @click="switchLocation('home')"
          >
            <i class="bi bi-house-fill"></i>
            <span>家</span>
            <span v-if="!state.savedLocations.home" class="not-set">(未設定)</span>
          </button>
          <button
            class="location-option"
            :class="{ active: state.currentLocationType === 'work', disabled: !state.savedLocations.work }"
            :disabled="!state.savedLocations.work"
            @click="switchLocation('work')"
          >
            <i class="bi bi-briefcase-fill"></i>
            <span>公司</span>
            <span v-if="!state.savedLocations.work" class="not-set">(未設定)</span>
          </button>
        </div>
      </div>

      <!-- Back Button -->
      <button
        class="view-toggle-btn"
        @click="toggleToListView"
      >
        <i class="bi bi-arrow-left"></i>
        <span class="toggle-text">返回</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'
import FilterTabs from '@/components/FilterTabs.vue'
import MapContainer from '@/components/map/MapContainer.vue'
import SearchResultsList from '@/components/map/SearchResultsList.vue'
import ItemDetailModal from '@/components/map/ItemDetailModal.vue'
import { searchItems } from '@/api/get_searchItemsAPI'
import { getMyLocations } from '@/api/get_userLocationAPI'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { supabase } from '@/lib/supabase'

// Composables
const router = useRouter()
const route = useRoute()
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
  showItemDetail: false,
  selectedItemId: null,
  filters: {
    keyword: '',
    distance_range_km: 5,
    main_category_id: null,
    sub_category_id: null,
    sort_by: 'created_at',
    sort_direction: 'desc'
  },
  loading: false,
  error: null,
  // Location switching
  currentLocationType: 'current', // 'current', 'home', 'work'
  savedLocations: {
    home: null,
    work: null
  },
  showLocationMenu: false
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

// Parse PostGIS WKB format to lat/lng
function parseWKBPoint(wkbHex) {
  try {
    // PostGIS EWKB format (Extended Well-Known Binary):
    // For SRID 4326 (WGS84), the format is:
    // 01 (byte order) + 01000020 (geometry type with SRID) + E6100000 (SRID 4326) + coordinates

    console.log('[MapSearchPage] DEBUG - WKB hex length:', wkbHex.length, 'hex:', wkbHex.substring(0, 40))

    // EWKB with SRID: byte order (2) + type (8) + SRID (8) + X (16) + Y (16) = 50 chars
    // Coordinates start at character position 18 (after 9 bytes: 1 byte order + 4 type + 4 SRID)
    const coordsStartChar = 18 // Character position, not byte position!

    const lonHex = wkbHex.substring(coordsStartChar, coordsStartChar + 16) // 16 chars = 8 bytes
    const latHex = wkbHex.substring(coordsStartChar + 16, coordsStartChar + 32) // Next 16 chars

    console.log('[MapSearchPage] DEBUG - Extracted hex:', { lonHex, latHex })

    if (!lonHex || !latHex || lonHex.length !== 16 || latHex.length !== 16) {
      console.error('[MapSearchPage] Invalid hex string lengths:', { lonHex: lonHex?.length, latHex: latHex?.length })
      return { latitude: null, longitude: null }
    }

    // Convert hex to bytes
    const lonMatch = lonHex.match(/.{2}/g)
    const latMatch = latHex.match(/.{2}/g)

    if (!lonMatch || !latMatch) {
      console.error('[MapSearchPage] Failed to match hex patterns')
      return { latitude: null, longitude: null }
    }

    const lonBytes = new Uint8Array(lonMatch.map(byte => parseInt(byte, 16)))
    const latBytes = new Uint8Array(latMatch.map(byte => parseInt(byte, 16)))

    // Read as little-endian float64
    const longitude = new DataView(lonBytes.buffer).getFloat64(0, true)
    const latitude = new DataView(latBytes.buffer).getFloat64(0, true)

    console.log('[MapSearchPage] DEBUG - Parsed coords:', { latitude, longitude })

    return { latitude, longitude }
  } catch (error) {
    console.error('[MapSearchPage] Failed to parse WKB:', error)
    return { latitude: null, longitude: null }
  }
}

// Fetch saved locations (home and work)
async function fetchSavedLocations() {
  try {
    const locations = await getMyLocations()
    console.log('[MapSearchPage] DEBUG - Raw locations from API:', JSON.stringify(locations, null, 2))

    if (locations && locations.length > 0) {
      locations.forEach(location => {
        // Parse PostGIS WKB coordinates
        let latitude = null
        let longitude = null

        if (location.coordinates) {
          const coords = parseWKBPoint(location.coordinates)
          latitude = coords.latitude
          longitude = coords.longitude

          console.log('[MapSearchPage] DEBUG - Parsed coordinates:', {
            type: location.type,
            raw: location.coordinates.substring(0, 20) + '...',
            latitude,
            longitude
          })
        }

        // Only save locations with valid coordinates
        if (latitude !== null && longitude !== null) {
          const locationData = {
            ...location,
            latitude,
            longitude
          }

          if (location.type === '家') {
            state.savedLocations.home = locationData
            console.log('[MapSearchPage] DEBUG - Saved home location')
          } else if (location.type === '公司') {
            state.savedLocations.work = locationData
            console.log('[MapSearchPage] DEBUG - Saved work location')
          }
        } else {
          console.warn('[MapSearchPage] Skipping location with invalid coordinates:', location)
        }
      })

      console.log('[MapSearchPage] Saved locations loaded:', state.savedLocations)
    } else {
      console.log('[MapSearchPage] DEBUG - No locations returned from API')
    }
  } catch (error) {
    console.error('[MapSearchPage] Failed to fetch saved locations:', error)
  }
}

// Fetch current location using browser geolocation API
async function fetchCurrentLocation() {
  try {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error('[MapSearchPage] Geolocation is not supported by this browser')
      state.error = '您的瀏覽器不支援地理定位功能'
      return false
    }

    // Get current position
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            type: 'current',
            is_primary: false,
            formatted_address: '目前位置'
          }

          console.log('[MapSearchPage] Current location loaded:', state.userLocation)
          resolve(true)
        },
        (error) => {
          console.error('[MapSearchPage] Failed to get current location:', error)

          // Handle different error types
          switch (error.code) {
            case error.PERMISSION_DENIED:
              state.error = '您拒絕了位置存取權限，請在瀏覽器設定中允許位置存取'
              break
            case error.POSITION_UNAVAILABLE:
              state.error = '無法取得您的位置資訊'
              break
            case error.TIMEOUT:
              state.error = '取得位置資訊逾時，請稍後再試'
              break
            default:
              state.error = '無法載入使用者位置'
          }

          state.userLocation = null
          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })

  } catch (error) {
    console.error('[MapSearchPage] Failed to fetch current location:', error)
    state.error = '無法載入使用者位置'
    return false
  }
}

// Switch to a different location type
async function switchLocation(locationType) {
  state.currentLocationType = locationType
  state.showLocationMenu = false
  state.error = null // Clear any previous errors

  switch (locationType) {
    case 'current':
      await fetchCurrentLocation()
      break
    case 'home':
      if (state.savedLocations.home) {
        // Validate coordinates before switching
        if (state.savedLocations.home.latitude !== null && state.savedLocations.home.longitude !== null) {
          state.userLocation = state.savedLocations.home
          console.log('[MapSearchPage] Switched to home location')
        } else {
          state.error = '家的位置資料不完整，請重新設定'
          return
        }
      } else {
        state.error = '尚未設定家的位置'
        return
      }
      break
    case 'work':
      if (state.savedLocations.work) {
        // Validate coordinates before switching
        if (state.savedLocations.work.latitude !== null && state.savedLocations.work.longitude !== null) {
          state.userLocation = state.savedLocations.work
          console.log('[MapSearchPage] Switched to work location')
        } else {
          state.error = '公司的位置資料不完整，請重新設定'
          return
        }
      } else {
        state.error = '尚未設定公司的位置'
        return
      }
      break
  }

  // Re-fetch items with new location
  if (state.userLocation) {
    await fetchItems()
  }
}

// Toggle location menu
function toggleLocationMenu() {
  state.showLocationMenu = !state.showLocationMenu
}

// Close location menu when clicking outside
function handleClickOutside(event) {
  const locationSwitcher = document.querySelector('.location-switcher')
  if (locationSwitcher && !locationSwitcher.contains(event.target)) {
    state.showLocationMenu = false
  }
}

// Fetch items
async function fetchItems() {
  if (!state.userLocation) return

  state.loading = true
  state.error = null

  try {
    console.log('[MapSearchPage] Fetching items with filters:', state.filters)
    console.log('[MapSearchPage] Using location:', state.userLocation)

    const data = await searchItems({
      user_latitude: state.userLocation.latitude,
      user_longitude: state.userLocation.longitude,
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

// Handle item click from search results
function handleSellerItemClick(item) {
  console.log('[MapSearchPage] Item clicked:', item)
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

// Toggle to list view (go back to previous page)
function toggleToListView() {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    router.back()
  } else {
    // Fallback to home if no history
    router.push({ name: 'Home' })
  }
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

    // Fetch saved locations (home and work)
    await fetchSavedLocations()

    // Fetch current location
    const hasLocation = await fetchCurrentLocation()
    if (!hasLocation) {
      initialLoading.value = false
      return
    }

    // Initialize filters from URL query params
    initializeFiltersFromUrl()

    // Fetch initial items
    await fetchItems()

    // Show search results if there are filters applied
    if (state.filters.keyword || state.filters.main_category_id || state.filters.sub_category_id) {
      state.showSearchResults = true
    }

  } catch (error) {
    console.error('[MapSearchPage] Initialization failed:', error)
    state.error = '初始化失敗，請重新載入頁面'
  } finally {
    initialLoading.value = false
  }
}

// Initialize filters from URL query parameters
function initializeFiltersFromUrl() {
  const { search, distance, category, subCategory } = route.query
  
  if (search) {
    state.filters.keyword = search
  }
  
  if (distance) {
    state.filters.distance_range_km = parseInt(distance)
  }
  
  if (category) {
    state.filters.main_category_id = parseInt(category)
  }
  
  if (subCategory) {
    state.filters.sub_category_id = parseInt(subCategory)
  }
  
  console.log('[MapSearchPage] Initialized filters from URL:', state.filters)
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
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
  pointer-events: none; // Allow map interaction through the container

  .search-filter-wrapper {
    z-index: 1002;
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

// Location Switcher
.location-switcher {
  position: fixed;
  top: 60px;
  right: 30px;
  z-index: 1002;

  .location-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    i {
      font-size: 16px;
      color: $primary;

      &.bi-chevron-down {
        font-size: 12px;
        color: #666;
      }
    }

    .location-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
    }

    &:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .location-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 200px;
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
        background: rgba($primary, 0.05);

        i {
          color: $primary;
        }

        span {
          color: $primary;
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

// Responsive: Location Switcher
@media (max-width: 767.98px) {
  .location-switcher {
    top: 110px;
    right: 12px;

    .location-btn {
      padding: 8px 14px;
      border-radius: 20px;

      i {
        font-size: 14px;
      }

      .location-text {
        font-size: 13px;
      }
    }

    .location-menu {
      min-width: 180px;
    }
  }
}
</style>
