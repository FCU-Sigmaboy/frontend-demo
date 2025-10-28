<template>
  <div class="category-tabs">
    <button
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

<script>
const DEFAULT_CATEGORIES = [
  { id: 1, category_id: 1, name: '流行服飾', icon: 'bi bi-bag', image: 'https://placehold.co/150/f4a261/ffffff?text=流行服飾' },
  { id: 2, category_id: 2, name: '鞋包配件', icon: 'bi bi-handbag', image: 'https://placehold.co/150/e76f51/ffffff?text=鞋包配件' },
  { id: 3, category_id: 3, name: '美妝保養', icon: 'bi bi-flower1', image: 'https://placehold.co/150/f4c2c2/ffffff?text=美妝保養' },
  { id: 4, category_id: 4, name: '電子 3C', icon: 'bi bi-laptop', image: 'https://placehold.co/150/457b9d/ffffff?text=電子3C' },
  { id: 5, category_id: 5, name: '家電用品', icon: 'bi bi-tv', image: 'https://placehold.co/150/a8dadc/ffffff?text=家電用品' },
  { id: 6, category_id: 6, name: '家具家飾', icon: 'bi bi-house', image: 'https://placehold.co/150/8d99ae/ffffff?text=家具家飾' },
  { id: 7, category_id: 7, name: '親子婦幼', icon: 'bi bi-heart', image: 'https://placehold.co/150/ffc8dd/ffffff?text=親子婦幼' },
  { id: 8, category_id: 8, name: '生活娛樂', icon: 'bi bi-controller', image: 'https://placehold.co/150/cdb4db/ffffff?text=生活娛樂' },
  { id: 9, category_id: 9, name: '圖書影音', icon: 'bi bi-book', image: 'https://placehold.co/150/ffafcc/ffffff?text=圖書影音' }
];
</script>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => DEFAULT_CATEGORIES
  },
  modelValue: {
    type: Number,
    default: 0
  }
});

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

  .category-tab {
    font-size: 12px;
    padding: 4px 12px;
  }
}
</style>
