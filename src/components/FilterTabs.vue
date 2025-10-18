<template>
  <div class="filter-tabs-wrapper">
    <div class="filter-tabs">
      <button
        v-for="filter in filters"
        :key="filter.id"
        class="filter-tab"
        :class="{ active: modelValue === filter.id }"
        @click="handleClick(filter.id)"
      >
        {{ filter.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  filters: {
    type: Array,
    default: () => [
      { id: 1, label: '最新上架' },
      { id: 2, label: '離我最近' },
      { id: 3, label: '為你推薦' }
    ]
  }
});

const emit = defineEmits(['update:modelValue']);

const handleClick = (id) => {
  emit('update:modelValue', id);
};
</script>

<style scoped lang="scss">
.filter-tabs-wrapper {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.filter-tabs {
  display: flex;
  gap: 18px;
  align-items: center;
}

.filter-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 32px;
  padding: 0 20px;
  border-radius: 5px;
  background-color: white;
  border: none;
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.3);
  }

  &.active {
    background-color: #6fb8a5;
    color: white;
  }
}

@media (max-width: 991.98px) {
  .filter-tabs-wrapper {
    padding: 0 15px;
  }

  .filter-tabs {
    gap: 15px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .filter-tab {
    font-size: 15px;
    height: 30px;
    padding: 0 18px;
  }
}

@media (max-width: 575.98px) {
  .filter-tabs-wrapper {
    padding: 0 10px;
  }

  .filter-tabs {
    gap: 10px;
  }

  .filter-tab {
    font-size: 14px;
    height: 28px;
    padding: 0 15px;
  }
}
</style>
