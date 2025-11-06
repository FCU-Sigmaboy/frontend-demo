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
import { loadGoogleMaps, isGoogleMapsLoaded } from '@/utils/googleMapsLoader'

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

// Initialize map
async function initializeMap() {
  loading.value = true
  error.value = null

  try {
    // Load Google Maps API
    await loadGoogleMaps()

    // Wait for next tick to ensure DOM is ready
    await nextTick()

    if (!mapElement.value) {
      throw new Error('Map element not found')
    }

    // Create map instance
    const google = window.google
    map.value = new google.maps.Map(mapElement.value, {
      center: {
        lat: props.center.latitude,
        lng: props.center.longitude
      },
      zoom: props.zoom,
      disableDefaultUI: true, // Disable all default controls
      zoomControl: false, // Users can pinch zoom on mobile
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false, // Remove fullscreen control
      gestureHandling: 'greedy', // Allow smooth gesture handling
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || null
    })

    // Add bounds changed listener
    map.value.addListener('bounds_changed', handleBoundsChanged)

    // Render initial markers and overlays
    await renderUserMarker()
    await renderSearchRadius()
    await renderItemMarkers()

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
  if (!map.value || !props.userLocation || !isGoogleMapsLoaded()) return

  // Remove existing marker
  if (userMarker.value) {
    userMarker.value.setMap(null)
  }

  const google = window.google

  // Create custom user marker icon (blue pulsing circle)
  const userIcon = {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#4285F4',
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 3,
    scale: 12
  }

  userMarker.value = new google.maps.Marker({
    position: {
      lat: props.userLocation.latitude,
      lng: props.userLocation.longitude
    },
    map: map.value,
    icon: userIcon,
    title: '您的位置',
    zIndex: 1000
  })
}

// Render search radius circle
async function renderSearchRadius() {
  if (!map.value || !props.userLocation || !isGoogleMapsLoaded()) return

  // Remove existing circle
  if (radiusCircle.value) {
    radiusCircle.value.setMap(null)
  }

  const google = window.google

  radiusCircle.value = new google.maps.Circle({
    strokeColor: '#6FB8A5',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#6FB8A5',
    fillOpacity: 0.15,
    map: map.value,
    center: {
      lat: props.userLocation.latitude,
      lng: props.userLocation.longitude
    },
    radius: props.searchRadius * 1000, // Convert km to meters
    zIndex: 100
  })
}

// Render item markers
async function renderItemMarkers() {
  if (!map.value || !isGoogleMapsLoaded()) return

  // Remove existing markers
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []

  const google = window.google

  props.items.forEach(item => {
    // Skip items without valid coordinates
    if (!item.latitude || !item.longitude) return

    // Create marker icon with price
    const markerIcon = {
      url: createMarkerIconWithPrice(item.price, item.favorited_at),
      scaledSize: new google.maps.Size(50, 60),
      anchor: new google.maps.Point(25, 60)
    }

    const marker = new google.maps.Marker({
      position: {
        lat: parseFloat(item.latitude),
        lng: parseFloat(item.longitude)
      },
      map: map.value,
      icon: markerIcon,
      title: item.title,
      zIndex: 500,
      animation: null
    })

    // Add click listener
    marker.addListener('click', () => {
      emit('marker-click', item)
      // Add bounce animation
      marker.setAnimation(google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 2000)
    })

    // Add hover effect
    marker.addListener('mouseover', () => {
      if (!marker.getAnimation()) {
        marker.setAnimation(google.maps.Animation.BOUNCE)
        setTimeout(() => marker.setAnimation(null), 700)
      }
    })

    markers.value.push(marker)
  })
}

// Create custom marker icon with price overlay
function createMarkerIconWithPrice(price, isFavorited) {
  const color = isFavorited ? '#FF6B6B' : '#6FB8A5'
  const priceText = `NT$${Math.floor(price)}`

  const svg = `
    <svg width="50" height="60" xmlns="http://www.w3.org/2000/svg">
      <!-- Marker pin -->
      <path d="M25 0 C15 0 7 8 7 18 C7 28 25 50 25 50 S43 28 43 18 C43 8 35 0 25 0 Z"
            fill="${color}" stroke="white" stroke-width="2"/>

      <!-- Price background -->
      <rect x="5" y="10" width="40" height="16" rx="3" fill="white" opacity="0.95"/>

      <!-- Price text -->
      <text x="25" y="21" font-family="Arial, sans-serif" font-size="10"
            font-weight="bold" text-anchor="middle" fill="${color}">
        ${priceText}
      </text>

      <!-- Favorite icon (if favorited) -->
      ${isFavorited ? '<circle cx="25" cy="5" r="4" fill="white"/><text x="25" y="7.5" font-size="6" text-anchor="middle">❤️</text>' : ''}
    </svg>
  `

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
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
    map.value.panTo({
      lat: newCenter.latitude,
      lng: newCenter.longitude
    })
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
    map.value.panTo({
      lat: props.userLocation.latitude,
      lng: props.userLocation.longitude
    })
    map.value.setZoom(props.zoom)
  }
}

// Expose public methods
defineExpose({
  recenterMap,
  getMap: () => map.value
})

// Lifecycle
onMounted(() => {
  initializeMap()
})

onBeforeUnmount(() => {
  // Clean up markers
  markers.value.forEach(marker => marker.setMap(null))
  if (userMarker.value) userMarker.value.setMap(null)
  if (radiusCircle.value) radiusCircle.value.setMap(null)

  // Clear timeout
  if (boundsChangeTimeout) clearTimeout(boundsChangeTimeout)
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