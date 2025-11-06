<template>
  <div class="map-search-bar">
    <div class="input-group">
      <span class="input-group-text bg-white">
        <i class="bi bi-search"></i>
      </span>
      <input
        v-model="searchQuery"
        type="text"
        class="form-control"
        placeholder="搜尋物品名稱或標籤..."
        @input="handleInput"
        aria-label="搜尋物品"
      >
      <button
        v-if="searchQuery"
        class="btn btn-outline-secondary"
        type="button"
        @click="clearSearch"
        aria-label="清除搜尋"
      >
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { debounce } from 'lodash-es'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  debounceDelay: {
    type: Number,
    default: 500
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'search', 'clear'])

// State
const searchQuery = ref(props.modelValue)

// Debounced search handler
const debouncedSearch = debounce((value) => {
  emit('update:modelValue', value)
  emit('search', value)
}, props.debounceDelay)

// Handle input
function handleInput() {
  debouncedSearch(searchQuery.value)
}

// Clear search
function clearSearch() {
  searchQuery.value = ''
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.map-search-bar {
  margin-bottom: 1rem;

  .input-group-text {
    border-right: 0;
    color: $primary;
  }

  .form-control {
    border-left: 0;
    border-right: 0;

    &:focus {
      border-color: #dee2e6;
      box-shadow: none;
    }
  }

  .btn-outline-secondary {
    border-left: 0;

    &:hover {
      background-color: transparent;
      border-color: #dee2e6;
    }
  }
}
</style>