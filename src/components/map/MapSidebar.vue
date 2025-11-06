<template>
  <div class="map-sidebar" :class="{ 'sidebar-open': isOpen }">
    <!-- Mobile toggle button -->
    <button
      class="sidebar-toggle-btn d-md-none"
      @click="toggleSidebar"
      aria-label="開關篩選"
    >
      <i class="bi" :class="isOpen ? 'bi-x-lg' : 'bi-funnel'"></i>
      <span class="ms-2">{{ isOpen ? '關閉' : '篩選' }}</span>
    </button>

    <!-- Sidebar content -->
    <div class="sidebar-content">
      <!-- Header -->
      <div class="sidebar-header">
        <h5 class="mb-0">
          <i class="bi bi-funnel me-2"></i>
          搜尋篩選
        </h5>
        <button
          v-if="hasActiveFilters"
          class="btn btn-sm btn-link text-danger"
          @click="clearAllFilters"
        >
          清除所有
        </button>
      </div>

      <!-- Results count -->
      <div class="results-count">
        <i class="bi bi-pin-map me-2"></i>
        找到 <strong>{{ resultsCount }}</strong> 個物品
      </div>

      <!-- Search bar -->
      <MapSearchBar
        v-model="filters.keyword"
        @search="handleSearchChange"
        @clear="handleSearchClear"
      />

      <!-- Distance slider -->
      <MapDistanceSlider
        v-model="filters.distance_range_km"
        :min="1"
        :max="50"
        @change="handleDistanceChange"
      />

      <!-- Category filter -->
      <MapCategoryFilter
        v-model:main-category-id="filters.main_category_id"
        v-model:sub-category-id="filters.sub_category_id"
        @change="handleCategoryChange"
      />

      <!-- Sort controls -->
      <MapSortControls
        v-model:sort-by="filters.sort_by"
        v-model:sort-direction="filters.sort_direction"
        @change="handleSortChange"
      />

      <!-- Recenter button -->
      <button
        class="btn btn-outline-primary w-100"
        @click="$emit('recenter')"
      >
        <i class="bi bi-crosshair me-2"></i>
        回到我的位置
      </button>
    </div>

    <!-- Backdrop for mobile -->
    <div
      v-if="isOpen"
      class="sidebar-backdrop d-md-none"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import MapSearchBar from './MapSearchBar.vue'
import MapDistanceSlider from './MapDistanceSlider.vue'
import MapCategoryFilter from './MapCategoryFilter.vue'
import MapSortControls from './MapSortControls.vue'

// Props
const props = defineProps({
  resultsCount: {
    type: Number,
    default: 0
  },
  initialFilters: {
    type: Object,
    default: () => ({
      keyword: '',
      distance_range_km: 5,
      main_category_id: null,
      sub_category_id: null,
      sort_by: 'created_at',
      sort_direction: 'desc'
    })
  }
})

// Emits
const emit = defineEmits([
  'filter-change',
  'recenter',
  'search-change',
  'distance-change',
  'category-change',
  'sort-change'
])

// State
const isOpen = ref(false)
const filters = reactive({ ...props.initialFilters })

// Computed
const hasActiveFilters = computed(() => {
  return filters.keyword ||
         filters.main_category_id ||
         filters.sub_category_id ||
         filters.distance_range_km !== 5
})

// Methods
function toggleSidebar() {
  isOpen.value = !isOpen.value
}

function closeSidebar() {
  isOpen.value = false
}

function handleSearchChange(value) {
  emit('search-change', value)
  emit('filter-change', filters)
}

function handleSearchClear() {
  emit('search-change', '')
  emit('filter-change', filters)
}

function handleDistanceChange(value) {
  emit('distance-change', value)
  emit('filter-change', filters)
}

function handleCategoryChange(value) {
  emit('category-change', value)
  emit('filter-change', filters)
}

function handleSortChange(value) {
  emit('sort-change', value)
  emit('filter-change', filters)
}

function clearAllFilters() {
  filters.keyword = ''
  filters.distance_range_km = 5
  filters.main_category_id = null
  filters.sub_category_id = null
  filters.sort_by = 'created_at'
  filters.sort_direction = 'desc'
  emit('filter-change', filters)
}

// Expose methods
defineExpose({
  openSidebar: () => { isOpen.value = true },
  closeSidebar,
  toggleSidebar
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.map-sidebar {
  position: relative;
  background: white;
  border-right: 1px solid #dee2e6;

  // Desktop
  @media (min-width: 768px) {
    width: 280px;
    height: 100%;
    overflow-y: auto;
  }

  @media (min-width: 1024px) {
    width: 320px;
  }

  // Mobile
  @media (max-width: 767.98px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70vh;
    max-height: 600px;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1040;

    &.sidebar-open {
      transform: translateY(0);
    }
  }
}

.sidebar-toggle-btn {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: $primary;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1030;
  display: flex;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
}

.sidebar-content {
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;

  @media (max-width: 767.98px) {
    padding: 1.5rem 1rem;
  }
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;

  h5 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;

    i {
      color: $primary;
    }
  }

  .btn-link {
    text-decoration: none;
    font-size: 0.85rem;
    padding: 0;

    &:hover {
      text-decoration: underline;
    }
  }
}

.results-count {
  background: rgba($primary, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #333;

  i {
    color: $primary;
  }

  strong {
    color: $primary;
    font-size: 1.1rem;
  }
}

.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1039;
}

// Scrollbar styling
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: $primary;
  border-radius: 3px;

  &:hover {
    background: darken($primary, 10%);
  }
}
</style>