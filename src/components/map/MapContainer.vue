<template>
  <div class="map-container-wrapper">
    <div v-if="loading" class="map-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <p class="mt-2">載入地圖中...</p>
    </div>

    <div v-if="error" class="map-error alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
      <button @click="retry" class="btn btn-sm btn-outline-danger ms-3">
        <i class="bi bi-arrow-clockwise me-1"></i>
        重試
      </button>
    </div>

    <div ref="mapElement" class="map-container" :class="{ 'map-hidden': loading || error }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { loadLeaflet } from '@/utils/openStreetMapLoader'
import { useCategoriesStore } from '@/stores/categories'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

// Get categories store
const categoriesStore = useCategoriesStore()

// Props
const props = defineProps({
  center: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && typeof value.latitude === 'number' && typeof value.longitude === 'number'
    }
  },
  zoom: {
    type: Number,
    default: 13
  },
  items: {
    type: Array,
    default: () => []
  },
  userLocation: {
    type: Object,
    default: null
  },
  searchRadius: {
    type: Number,
    default: 5
  }
})

// Emits
const emit = defineEmits(['map-ready', 'marker-click', 'map-bounds-changed'])

// State
const mapElement = ref(null)
const map = ref(null)
const loading = ref(true)
const error = ref(null)
const markers = ref([])
const userMarker = ref(null)
const radiusCircle = ref(null)
const tileLayer = ref(null)
const currentZoom = ref(13)

// Initialize map
async function initializeMap() {
  loading.value = true
  error.value = null

  try {
    // Load categories if not already loaded
    if (!categoriesStore.isLoaded) {
      await categoriesStore.fetchCategories()
    }

    // Load Leaflet library
    await loadLeaflet()

    // Wait for next tick to ensure DOM is ready
    await nextTick()

    if (!mapElement.value) {
      throw new Error('Map element not found')
    }

    // Define Taichung City bounds
    const taichungBounds = L.latLngBounds(
      [24.0, 120.5],  // Southwest corner
      [24.5, 121.2]   // Northeast corner
    )

    // Create map instance
    map.value = L.map(mapElement.value, {
      center: [props.center.latitude, props.center.longitude],
      zoom: props.zoom,
      zoomControl: false,
      attributionControl: true,
      minZoom: 11,        // 最小縮放級別（不能拉太遠）
      maxZoom: 19,        // 最大縮放級別（可以拉很近）
      maxBounds: taichungBounds,           // 限制地圖範圍在台中市
      maxBoundsViscosity: 1.0              // 完全限制，不能拖出邊界
    })

    // Add OpenStreetMap tile layer
    tileLayer.value = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map.value)

    // Initialize current zoom
    currentZoom.value = map.value.getZoom()

    // Add event listeners
    map.value.on('moveend', handleBoundsChanged)
    map.value.on('zoomend', () => {
      currentZoom.value = map.value.getZoom()
      handleBoundsChanged()
      renderItemMarkers() // Re-render markers on zoom change
    })

    // Render initial markers and overlays
    await renderUserMarker()
    await renderSearchRadius()
    await renderItemMarkers()

    // Fix map size issue - invalidate size after a short delay
    setTimeout(() => {
      if (map.value) {
        map.value.invalidateSize()
      }
    }, 100)

    loading.value = false
    emit('map-ready', map.value)

  } catch (err) {
    console.error('[MapContainer] Failed to initialize map:', err)
    error.value = err.message || '地圖載入失敗，請檢查網路連線'
    loading.value = false
  }
}

// Render user location marker
async function renderUserMarker() {
  if (!map.value || !props.userLocation) return

  // Remove existing marker
  if (userMarker.value) {
    userMarker.value.remove()
  }

  // Create custom user marker icon (blue pulsing circle)
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  userMarker.value = L.marker(
    [props.userLocation.latitude, props.userLocation.longitude],
    {
      icon: userIcon,
      title: '您的位置',
      zIndexOffset: 1000
    }
  ).addTo(map.value)
}

// Render search radius circle
async function renderSearchRadius() {
  if (!map.value || !props.userLocation) return

  // Remove existing circle
  if (radiusCircle.value) {
    radiusCircle.value.remove()
    radiusCircle.value = null
  }

  // Only render circle if searchRadius is specified (not null or undefined)
  if (props.searchRadius !== null && props.searchRadius !== undefined) {
    radiusCircle.value = L.circle(
      [props.userLocation.latitude, props.userLocation.longitude],
      {
        radius: props.searchRadius * 1000, // Convert km to meters
        color: '#6FB8A5',
        fillColor: '#6FB8A5',
        fillOpacity: 0.15,
        weight: 2,
        interactive: false
      }
    ).addTo(map.value)
  }
}

// Get category icon from store
function getCategoryIcon(item) {
  if (!item.main_category_id) {
    return 'bi-box'
  }

  const mainCategory = categoriesStore.mainCategories.find(cat => cat.id === item.main_category_id)
  return mainCategory?.icon || 'bi-box'
}

// Get category color from store
function getCategoryColor(item) {
  if (!item.main_category_id) {
    return '#6FB8A5'
  }

  const mainCategory = categoriesStore.mainCategories.find(cat => cat.id === item.main_category_id)
  return mainCategory?.color || '#6FB8A5'
}

// Group items by location based on zoom level
function groupItemsByLocation(items, zoom) {
  const groups = []

  // Dynamic threshold based on zoom level
  // zoom 11-12: 0.01 (約 1km) - 很多物品會被分組
  // zoom 13-14: 0.001 (約 100m) - 中等分組
  // zoom 15+: 0.0001 (約 10m) - 只有非常近的才分組
  let threshold
  if (zoom < 13) {
    threshold = 0.01 // 約 1km
  } else if (zoom < 15) {
    threshold = 0.001 // 約 100m
  } else {
    threshold = 0.0001 // 約 10m
  }

  items.forEach(item => {
    if (!item.latitude || !item.longitude) {
      return
    }

    // Find existing group with same location
    const existingGroup = groups.find(group => {
      const latDiff = Math.abs(group.latitude - item.latitude)
      const lngDiff = Math.abs(group.longitude - item.longitude)
      return latDiff < threshold && lngDiff < threshold
    })

    if (existingGroup) {
      existingGroup.items.push(item)
    } else {
      groups.push({
        latitude: item.latitude,
        longitude: item.longitude,
        items: [item]
      })
    }
  })

  return groups
}

// Create markers - always keep items grouped (no jitter)
function createJitteredMarkers(group, zoom) {
  // Always keep as single cluster marker, regardless of zoom level
  // This ensures items at the same location stay grouped
  return [{
    latitude: group.latitude,
    longitude: group.longitude,
    items: group.items
  }]
}

// Render item markers
async function renderItemMarkers() {
  if (!map.value) return

  // Remove existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []

  const zoom = currentZoom.value

  // Group items by location (distance depends on zoom)
  const locationGroups = groupItemsByLocation(props.items, zoom)

  // Process each location group
  locationGroups.forEach(group => {
    // Create jittered positions for items at same location
    const markerPositions = createJitteredMarkers(group, zoom)

    // Create marker for each position
    markerPositions.forEach(position => {
      const itemCount = position.items.length
      const firstItem = position.items[0]

      // Determine pin color based on favorited status
      const hasFavorited = position.items.some(item => item.favorited_at)
      const color = hasFavorited ? '#FF6B6B' : getCategoryColor(firstItem)

      // Get seller info
      const profilePicture = firstItem.user?.profile_picture_url || 'https://placehold.co/40/1e1e1e/ffffff?text=' + (firstItem.user?.nickname?.charAt(0) || 'U')

      let markerHtml = ''
      let iconSize = [40, 50]
      let iconAnchor = [20, 50]

      if (itemCount > 1) {
        // Multiple items - show seller profile picture with count badge
        markerHtml = `
          <div class="marker-pin seller-marker">
            <svg width="40" height="50" xmlns="http://www.w3.org/2000/svg">
              <!-- Pin shape -->
              <path d="M20 0 C12 0 6 6 6 14 C6 22 20 40 20 40 S34 22 34 14 C34 6 28 0 20 0 Z"
                    fill="${color}" stroke="white" stroke-width="2"/>
            </svg>
            <!-- Profile picture -->
            <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 2px solid white; background: white;">
              <img src="${profilePicture}" alt="seller" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://placehold.co/24/1e1e1e/ffffff?text=${firstItem.user?.nickname?.charAt(0) || 'U'}'">
            </div>
            <!-- Item count badge -->
            <div style="position: absolute; top: -5px; right: 5px; background: ${color}; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white;">
              ${itemCount}
            </div>
          </div>
        `
      } else {
        // Single item - show seller profile picture without count
        markerHtml = `
          <div class="marker-pin seller-marker">
            <svg width="40" height="50" xmlns="http://www.w3.org/2000/svg">
              <!-- Pin shape -->
              <path d="M20 0 C12 0 6 6 6 14 C6 22 20 40 20 40 S34 22 34 14 C34 6 28 0 20 0 Z"
                    fill="${color}" stroke="white" stroke-width="2"/>
            </svg>
            <!-- Profile picture -->
            <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 2px solid white; background: white;">
              <img src="${profilePicture}" alt="seller" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://placehold.co/24/1e1e1e/ffffff?text=${firstItem.user?.nickname?.charAt(0) || 'U'}'">
            </div>
          </div>
        `
      }

      // Create custom marker icon
      const markerIcon = L.divIcon({
        className: 'item-marker',
        html: markerHtml,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
        popupAnchor: [0, -iconAnchor[1]]
      })

      const marker = L.marker(
        [parseFloat(position.latitude), parseFloat(position.longitude)],
        {
          icon: markerIcon,
          title: itemCount === 1 ? firstItem.title : `${itemCount} 個物品`,
          zIndexOffset: 500,
          autoPan: false, // Prevent auto-panning when marker is clicked
          keyboard: false // Disable keyboard interaction
        }
      ).addTo(map.value)

      // Add click listener
      marker.on('click', (e) => {
        // Prevent event from bubbling to map
        if (e.originalEvent) {
          e.originalEvent.stopPropagation()
        }
        L.DomEvent.stopPropagation(e)
        
        if (itemCount === 1) {
          // Single item - emit as before
          emit('marker-click', firstItem)
        } else {
          // Multiple items - emit first item (or could emit array)
          emit('marker-click', firstItem, position.items)
        }

        // Add subtle pulse effect
        const element = marker.getElement()
        if (element) {
          element.classList.add('marker-pulse')
          setTimeout(() => {
            element.classList.remove('marker-pulse')
          }, 300)
        }
      })

      markers.value.push(marker)
    })
  })
}

// Handle map bounds changed
let boundsChangeTimeout = null
function handleBoundsChanged() {
  if (!map.value) return

  // Debounce bounds changed event
  clearTimeout(boundsChangeTimeout)
  boundsChangeTimeout = setTimeout(() => {
    const bounds = map.value.getBounds()
    emit('map-bounds-changed', bounds)
  }, 500)
}

// Retry loading map
function retry() {
  initializeMap()
}

// Watch for center changes (only pan if coordinates actually differ significantly)
watch(() => props.center, (newCenter, oldCenter) => {
  if (map.value && newCenter) {
    // Only pan if coordinates changed significantly (more than ~10 meters)
    // This prevents unnecessary panning from small floating point differences
    const threshold = 0.0001 // approximately 10 meters
    if (!oldCenter || 
        Math.abs(newCenter.latitude - oldCenter.latitude) > threshold || 
        Math.abs(newCenter.longitude - oldCenter.longitude) > threshold) {
      map.value.setView([newCenter.latitude, newCenter.longitude], map.value.getZoom(), {
        animate: false // Disable animation to prevent jumps
      })
    }
  }
}, { deep: false })

// Watch for zoom changes
watch(() => props.zoom, (newZoom) => {
  if (map.value) {
    map.value.setZoom(newZoom)
  }
})

// Watch for items changes (debounced to avoid excessive re-renders)
let itemsUpdateTimeout = null
watch(() => props.items, () => {
  // Debounce marker updates to prevent flickering
  clearTimeout(itemsUpdateTimeout)
  itemsUpdateTimeout = setTimeout(() => {
    renderItemMarkers()
  }, 50)
}, { deep: false })

// Watch for user location changes
watch(() => props.userLocation, () => {
  renderUserMarker()
  renderSearchRadius()
}, { deep: true })

// Watch for search radius changes
watch(() => props.searchRadius, () => {
  renderSearchRadius()
})

// Public method to recenter map
function recenterMap() {
  if (map.value && props.userLocation) {
    map.value.setView(
      [props.userLocation.latitude, props.userLocation.longitude],
      props.zoom
    )
  }
}

// Handle window resize
function handleResize() {
  if (map.value) {
    map.value.invalidateSize()
  }
}

// Expose public methods
defineExpose({
  recenterMap,
  getMap: () => map.value
})

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeMap()

  // Add resize listener
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // Clean up markers
  markers.value.forEach(marker => marker.remove())
  if (userMarker.value) userMarker.value.remove()
  if (radiusCircle.value) radiusCircle.value.remove()

  // Remove map
  if (map.value) {
    map.value.remove()
  }

  // Clear timeout
  if (boundsChangeTimeout) clearTimeout(boundsChangeTimeout)

  // Remove resize listener
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.map-container-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;

  &.map-hidden {
    visibility: hidden;
    height: 0;
  }

  // Ensure Leaflet map fills the container
  :deep(.leaflet-container) {
    width: 100%;
    height: 100%;
    min-height: 400px;
  }
}

.map-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;

  p {
    color: $primary;
    font-size: 0.9rem;
    margin: 0;
  }
}

.map-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2rem;
  padding: 1rem 1.5rem;

  i {
    font-size: 1.2rem;
  }
}

// User location marker styles
:deep(.user-location-marker) {
  position: relative;
  background: transparent;
  border: none;

  .user-marker-pulse {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: rgba(66, 133, 244, 0.3);
    animation: pulse 2s infinite;
  }

  .user-marker-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #4285F4;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
}

// Item marker styles
:deep(.item-marker) {
  background: transparent;
  border: none;

  // Circle marker (multiple items)
  .marker-circle {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.15);
    }

    svg {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }

  // Pin marker (single item)
  .marker-pin {
    position: relative;
    cursor: pointer;
    pointer-events: auto;

    svg {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      transition: filter 0.2s ease;
    }

    &:hover svg {
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
    }

    i {
      pointer-events: none;
    }

    // Ensure child elements don't block hover
    * {
      pointer-events: none;
    }

    // But keep the pin itself interactive
    & {
      pointer-events: auto;
    }
  }
}

// Marker pulse animation (only animate opacity and scale without affecting position)
:deep(.marker-pulse) {
  .marker-pin {
    animation: marker-pulse-effect 0.3s ease-out;
  }
}

@keyframes marker-pulse-effect {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

// Leaflet attribution control styling
:deep(.leaflet-control-attribution) {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 5px;
}

// Responsive
@media (max-width: 575.98px) {
  .map-container-wrapper {
    min-height: 300px;
  }

  .map-container,
  .map-loading {
    min-height: 300px;
  }
}
</style>