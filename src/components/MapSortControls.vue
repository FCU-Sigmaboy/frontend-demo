<template>
  <div class="map-sort-controls">
    <label class="form-label">排序方式</label>

    <div class="btn-group w-100 mb-2" role="group" aria-label="排序選項">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        type="button"
        class="btn btn-outline-primary"
        :class="{ active: selectedSort === option.value }"
        @click="selectSort(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <button
      v-if="selectedSort"
      type="button"
      class="btn btn-sm btn-outline-secondary w-100"
      @click="toggleDirection"
    >
      <i class="bi me-1" :class="directionIcon"></i>
      {{ directionLabel }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  sortBy: {
    type: String,
    default: 'created_at'
  },
  sortDirection: {
    type: String,
    default: 'desc',
    validator: (value) => ['asc', 'desc'].includes(value)
  }
})

// Emits
const emit = defineEmits(['update:sortBy', 'update:sortDirection', 'change'])

// State
const selectedSort = ref(props.sortBy)
const direction = ref(props.sortDirection)

const sortOptions = [
  { label: '距離', value: 'distance' },
  { label: '價格', value: 'price' },
  { label: '時間', value: 'created_at' }
]

// Computed
const directionIcon = computed(() => {
  return direction.value === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'
})

const directionLabel = computed(() => {
  if (selectedSort.value === 'distance') {
    return direction.value === 'asc' ? '由近到遠' : '由遠到近'
  } else if (selectedSort.value === 'price') {
    return direction.value === 'asc' ? '由低到高' : '由高到低'
  } else {
    return direction.value === 'asc' ? '由舊到新' : '由新到舊'
  }
})

// Methods
function selectSort(value) {
  selectedSort.value = value
  emitChange()
}

function toggleDirection() {
  direction.value = direction.value === 'asc' ? 'desc' : 'asc'
  emitChange()
}

function emitChange() {
  emit('update:sortBy', selectedSort.value)
  emit('update:sortDirection', direction.value)
  emit('change', {
    sortBy: selectedSort.value,
    sortDirection: direction.value
  })
}

// Watch for external changes
watch(() => props.sortBy, (newValue) => {
  selectedSort.value = newValue
})

watch(() => props.sortDirection, (newValue) => {
  direction.value = newValue
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.map-sort-controls {
  margin-bottom: 1.5rem;

  .form-label {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .btn-group {
    .btn {
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;

      &.active {
        background-color: $primary;
        border-color: $primary;
        color: white;
      }
    }
  }

  .btn-sm {
    font-size: 0.8rem;

    i {
      font-size: 0.9rem;
    }
  }
}
</style>