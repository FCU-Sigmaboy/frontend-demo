<template>
  <div class="filter-tabs-wrapper">
    <div class="filter-tabs">
      <button
        v-for="filter in filters"
        :key="filter.id"
        class="filter-tab"
        :class="{ active: activeFilter === filter.id }"
        @click="handleClick(filter.id)"
      >
        <span>{{ getFilterLabel(filter) }}</span>
        <i
          v-if="filter.id !== 3 && activeFilter === filter.id"
          :class="getSortIcon(filter.id)"
          class="sort-icon"
        ></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
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

const emit = defineEmits(['update:sortedItems']);

// 內部狀態
const activeFilter = ref(1);
const sortOrder = ref({
  1: 'desc', // 上架時間：desc = 晚到早，asc = 早到晚
  2: 'asc'   // 距離：asc = 近到遠，desc = 遠到近
});

// 排序後的項目
const sortedItems = computed(() => {
  if (!props.items || props.items.length === 0) return [];

  const items = [...props.items];

  if (activeFilter.value === 1) {
    // 上架時間排序
    items.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder.value[1] === 'desc'
        ? dateB - dateA  // 晚到早
        : dateA - dateB; // 早到晚
    });
  } else if (activeFilter.value === 2) {
    // 距離排序
    items.sort((a, b) => {
      const distA = parseFloat(a.distance_km) || 0;
      const distB = parseFloat(b.distance_km) || 0;
      return sortOrder.value[2] === 'asc'
        ? distA - distB  // 近到遠
        : distB - distA; // 遠到近
    });
  }
  // activeFilter === 3 (為你推薦) 不排序，保持原順序

  return items;
});

// 當排序結果改變時，發送事件
const handleClick = (id) => {
  if (activeFilter.value === id && id !== 3) {
    // 如果點擊的是已選中的可排序標籤，切換排序方向
    const currentOrder = sortOrder.value[id];
    sortOrder.value[id] = currentOrder === 'asc' ? 'desc' : 'asc';
  } else {
    // 否則只是切換標籤
    activeFilter.value = id;
  }

  // 發送排序後的結果
  emit('update:sortedItems', sortedItems.value);
};

const getFilterLabel = (filter) => {
  if (filter.id === 1) return '上架時間';
  if (filter.id === 2) return '距離';
  return filter.label;
};

const getSortIcon = (filterId) => {
  const order = sortOrder.value[filterId];
  if (filterId === 1) {
    // 上架時間：desc = 晚到早（箭頭向下），asc = 早到晚（箭頭向上）
    return order === 'desc' ? 'bi bi-arrow-down' : 'bi bi-arrow-up';
  } else if (filterId === 2) {
    // 距離：asc = 近到遠（箭頭向上），desc = 遠到近（箭頭向下）
    return order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
  }
  return '';
};

// 暴露 sortedItems 給父組件使用
defineExpose({
  sortedItems
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

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
  gap: 6px;
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
    background-color: $primary;
    color: white;

    .sort-icon {
      animation: bounce 0.3s ease;
    }
  }

  .sort-icon {
    font-size: 14px;
    transition: transform 0.3s;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@media (max-width: 991.98px) {
  .filter-tabs-wrapper {
    padding: 0 15px;
  }

  .filter-tabs {
    gap: 15px;
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
