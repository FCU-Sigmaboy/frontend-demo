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

// Initialize map
async function initializeMap() {
  loading.value = true
  error.value = null

  try {
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

    // Add event listeners
    map.value.on('moveend', handleBoundsChanged)
    map.value.on('zoomend', handleBoundsChanged)

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
  }

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

// Group items by location (within ~10 meters)
function groupItemsByLocation(items) {
  const groups = []
  const threshold = 0.0001 // Approximately 10 meters

  items.forEach(item => {
    console.log('[MapContainer] Processing item:', {
      title: item.title,
      latitude: item.latitude,
      longitude: item.longitude,
      debug_location: item.debug_item_location_wkb
    })

    if (!item.latitude || !item.longitude) {
      console.log('[MapContainer] Skipping item - no coordinates:', item.title)
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

// Render item markers
async function renderItemMarkers() {
  if (!map.value) return

  console.log('[MapContainer] renderItemMarkers called with items:', props.items)
  console.log('[MapContainer] Items count:', props.items?.length)

  // Remove existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []

  // Group items by location
  const locationGroups = groupItemsByLocation(props.items)
  console.log('[MapContainer] Location groups:', locationGroups)

  locationGroups.forEach(group => {
    const itemCount = group.items.length
    const firstItem = group.items[0]

    console.log('[MapContainer] Creating marker for group:', {
      latitude: group.latitude,
      longitude: group.longitude,
      itemCount,
      firstItem: firstItem.title
    })

    // Check if any item in the group is favorited
    const hasFavorited = group.items.some(item => item.favorited_at)
    const color = hasFavorited ? '#FF6B6B' : '#6FB8A5'

    let markerHtml = ''

    if (itemCount === 1) {
      // Single item - show price
      const priceText = `NT$${Math.floor(firstItem.price)}`
      markerHtml = `
        <div class="marker-pin" style="color: ${color}">
          <svg width="50" height="60" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 0 C15 0 7 8 7 18 C7 28 25 50 25 50 S43 28 43 18 C43 8 35 0 25 0 Z"
                  fill="${color}" stroke="white" stroke-width="2"/>
            <rect x="5" y="10" width="40" height="16" rx="3" fill="white" opacity="0.95"/>
            <text x="25" y="21" font-family="Arial, sans-serif" font-size="10"
                  font-weight="bold" text-anchor="middle" fill="${color}">
              ${priceText}
            </text>
            ${firstItem.favorited_at ? '<circle cx="25" cy="5" r="4" fill="white"/><text x="25" y="7.5" font-size="6" text-anchor="middle">❤️</text>' : ''}
          </svg>
        </div>
      `
    } else {
      // Multiple items - show count
      markerHtml = `
        <div class="marker-pin marker-cluster" style="color: ${color}">
          <svg width="50" height="60" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 0 C15 0 7 8 7 18 C7 28 25 50 25 50 S43 28 43 18 C43 8 35 0 25 0 Z"
                  fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="25" cy="16" r="12" fill="white" opacity="0.95"/>
            <text x="25" y="22" font-family="Arial, sans-serif" font-size="14"
                  font-weight="bold" text-anchor="middle" fill="${color}">
              ${itemCount}
            </text>
            ${hasFavorited ? '<circle cx="25" cy="5" r="4" fill="white"/><text x="25" y="7.5" font-size="6" text-anchor="middle">❤️</text>' : ''}
          </svg>
        </div>
      `
    }

    // Create custom marker icon
    const markerIcon = L.divIcon({
      className: 'item-marker',
      html: markerHtml,
      iconSize: [50, 60],
      iconAnchor: [25, 60],
      popupAnchor: [0, -60]
    })

    const marker = L.marker(
      [parseFloat(group.latitude), parseFloat(group.longitude)],
      {
        icon: markerIcon,
        title: itemCount === 1 ? firstItem.title : `${itemCount} 個物品`,
        zIndexOffset: 500
      }
    ).addTo(map.value)

    // Add click listener
    marker.on('click', () => {
      if (itemCount === 1) {
        // Single item - emit as before
        emit('marker-click', firstItem)
      } else {
        // Multiple items - emit first item (or could emit array)
        // You might want to handle this differently in parent component
        emit('marker-click', firstItem, group.items)
      }

      // Add bounce effect
      const element = marker.getElement()
      if (element) {
        element.classList.add('marker-bounce')
        setTimeout(() => {
          element.classList.remove('marker-bounce')
        }, 700)
      }
    })

    // Add hover effect
    marker.on('mouseover', () => {
      const element = marker.getElement()
      if (element && !element.classList.contains('marker-bounce')) {
        element.classList.add('marker-bounce')
        setTimeout(() => {
          element.classList.remove('marker-bounce')
        }, 700)
      }
    })

    markers.value.push(marker)
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

// Watch for center changes
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    map.value.panTo([newCenter.latitude, newCenter.longitude])
  }
}, { deep: true })

// Watch for zoom changes
watch(() => props.zoom, (newZoom) => {
  if (map.value) {
    map.value.setZoom(newZoom)
  }
})

// Watch for items changes
watch(() => props.items, () => {
  renderItemMarkers()
}, { deep: true })

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

  // Cluster marker (multiple items)
  .marker-cluster {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

// Marker bounce animation
:deep(.marker-bounce) {
  animation: marker-bounce 0.6s ease-in-out;
}

@keyframes marker-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
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