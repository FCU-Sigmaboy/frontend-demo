<template>
  <div class="category-tabs">
    <!-- Loading State -->
    <template v-if="loading">
      <div v-for="i in 5" :key="`skeleton-${i}`" class="skeleton-tab"></div>
    </template>

    <!-- Category Tabs -->
    <button
      v-else
      v-for="category in categories"
      :key="category.id"
      class="category-tab"
      :class="{ active: modelValue === category.id }"
      @click="handleCategoryClick(category.id)"
    >
      {{ category.name }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCategoriesStore } from '@/stores/categories.js';

defineProps({
  categories: {
    type: Array
  },
  modelValue: {
    type: Number,
    default: 0
  }
});

const categoriesStore = useCategoriesStore();

const categories = computed(() => [{ id: 0, name: '全部' }, ...categoriesStore.categories]);
const loading = computed(() => categoriesStore.isLoading);

const emit = defineEmits(['update:modelValue', 'change']);

const handleCategoryClick = (categoryId) => {
  emit('update:modelValue', categoryId);
  emit('change', categoryId);
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.category-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.skeleton-tab {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  min-width: 80px;
  height: 32px;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.category-tab {
  background-color: white;
  border: 1px solid #d0d0d0;
  border-radius: 16px;
  padding: 6px 16px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background-color: #f5f5f5;
    border-color: $primary;
  }

  &.active {
    background-color: $primary;
    border-color: $primary;
    color: white;
    font-weight: 500;
  }
}

// Responsive Design
@media (max-width: 991.98px) {
  .category-tabs {
    gap: 10px;
  }

  .skeleton-tab {
    padding: 5px 14px;
    min-width: 70px;
    height: 28px;
  }

  .category-tab {
    font-size: 13px;
    padding: 5px 14px;
  }
}

@media (max-width: 575.98px) {
  .category-tabs {
    gap: 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 5px;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #d0d0d0;
      border-radius: 2px;
    }
  }

  .skeleton-tab {
    padding: 4px 12px;
    min-width: 60px;
    height: 26px;
  }

  .category-tab {
    font-size: 12px;
    padding: 4px 12px;
  }
}
</style>
