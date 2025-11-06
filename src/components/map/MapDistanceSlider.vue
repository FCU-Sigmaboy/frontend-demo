<template>
  <div class="map-distance-slider">
    <label class="form-label d-flex justify-content-between align-items-center mb-2">
      <span>搜尋半徑</span>
      <strong class="text-primary">{{ displayValue }} 公里</strong>
    </label>

    <input
      v-model.number="sliderValue"
      type="range"
      class="form-range"
      :min="min"
      :max="max"
      :step="step"
      @input="handleChange"
      aria-label="搜尋半徑"
    >

    <div class="d-flex justify-content-between text-muted small mt-1">
      <span>{{ min }}km</span>
      <span>{{ max }}km</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Number,
    default: 5
  },
  min: {
    type: Number,
    default: 1
  },
  max: {
    type: Number,
    default: 50
  },
  step: {
    type: Number,
    default: 1
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// State
const sliderValue = ref(props.modelValue)

// Computed
const displayValue = computed(() => {
  return sliderValue.value.toFixed(0)
})

// Handle change
function handleChange() {
  emit('update:modelValue', sliderValue.value)
  emit('change', sliderValue.value)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  sliderValue.value = newValue
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.map-distance-slider {
  margin-bottom: 1.5rem;

  .form-label {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .form-range {
    &::-webkit-slider-thumb {
      background-color: $primary;
    }

    &::-moz-range-thumb {
      background-color: $primary;
    }

    &::-webkit-slider-runnable-track {
      background-color: rgba($primary, 0.2);
    }

    &::-moz-range-track {
      background-color: rgba($primary, 0.2);
    }
  }
}
</style>