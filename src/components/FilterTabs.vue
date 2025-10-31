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
        <span class="filter-label">{{ getFilterLabel(filter) }}</span>
        <span
          v-if="activeFilter === filter.id && filter.sortable !== false"
          class="sort-direction"
        >{{ getSortDirectionText(filter) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Array,
    default: () => [],
    // 每個 filter 的格式：
    // {
    //   id: number,
    //   label: string,
    //   sortKey?: string | string[],  // 排序欄位名稱，可以是陣列（fallback）
    //   sortFn?: Function,              // 自訂排序函數
    //   defaultOrder?: 'asc' | 'desc',  // 預設排序方向
    //   ascText?: string,                // 升序時顯示的文字
    //   descText?: string,               // 降序時顯示的文字
    //   sortable?: boolean                // 是否可切換排序方向，預設 true
    // }
  }
});

const emit = defineEmits(['update:sortedItems']);

// 初始化排序方向
const initSortOrder = () => {
  const order = {};
  props.filters.forEach(filter => {
    order[filter.id] = filter.defaultOrder || 'asc';
  });
  return order;
};

// 內部狀態
const activeFilter = ref(props.filters[0]?.id || 1);
const sortOrder = ref(initSortOrder());

// 排序後的項目
const sortedItems = computed(() => {
  if (!props.items || props.items.length === 0) return [];

  const items = [...props.items];
  const currentFilter = props.filters.find(f => f.id === activeFilter.value);

  if (!currentFilter) return items;

  // 如果提供了自訂排序函數，使用它
  if (currentFilter.sortFn) {
    items.sort((a, b) => {
      const result = currentFilter.sortFn(a, b);
      return sortOrder.value[currentFilter.id] === 'asc' ? result : -result;
    });
    return items;
  }

  // 否則使用 sortKey 進行排序
  if (currentFilter.sortKey) {
    const keys = Array.isArray(currentFilter.sortKey)
      ? currentFilter.sortKey
      : [currentFilter.sortKey];

    items.sort((a, b) => {
      // 嘗試從 keys 中找到第一個有值的欄位
      let valueA, valueB;
      for (const key of keys) {
        valueA = a[key];
        valueB = b[key];
        if (valueA != null && valueB != null) break;
      }

      // 處理不同類型的值
      if (valueA instanceof Date || valueB instanceof Date ||
          (typeof valueA === 'string' && !isNaN(Date.parse(valueA)))) {
        // 日期類型
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return sortOrder.value[currentFilter.id] === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      } else if (typeof valueA === 'number' || !isNaN(parseFloat(valueA))) {
        // 數字類型
        const numA = parseFloat(valueA) || 0;
        const numB = parseFloat(valueB) || 0;
        return sortOrder.value[currentFilter.id] === 'asc'
          ? numA - numB
          : numB - numA;
      } else {
        // 字串類型
        const strA = String(valueA || '');
        const strB = String(valueB || '');
        return sortOrder.value[currentFilter.id] === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      }
    });
  }

  return items;
});

// 當排序結果改變時，發送事件
const handleClick = (id) => {
  const filter = props.filters.find(f => f.id === id);
  const isSortable = filter?.sortable !== false; // 預設為 true

  if (activeFilter.value === id && isSortable) {
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
  // 如果 filter 有自訂 label，直接使用
  return filter.label;
};

const getSortDirectionText = (filter) => {
  const order = sortOrder.value[filter.id];

  // 優先使用傳入的自訂文字
  if (filter.ascText && filter.descText) {
    return order === 'asc' ? filter.ascText : filter.descText;
  }

  // 否則根據 label 自動判斷
  const label = filter.label;
  if (label.includes('時間') || label.includes('日期')) {
    return order === 'asc' ? '早到晚' : '晚到早';
  } else if (label.includes('距離')) {
    return order === 'asc' ? '近到遠' : '遠到近';
  } else if (label.includes('價格')) {
    return order === 'asc' ? '低到高' : '高到低';
  } else if (label.includes('熱門') || label.includes('收藏')) {
    return order === 'asc' ? '少到多' : '多到少';
  } else {
    // 預設通用文字
    return order === 'asc' ? '升序' : '降序';
  }
};

// 監聽 sortedItems 的變化，自動 emit 給父組件
watch(
  sortedItems,
  (newValue) => {
    emit('update:sortedItems', newValue);
  },
  { immediate: true } // 立即執行一次，確保初始化時也會 emit
);

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
    background-color: $primary;
    color: white;
  }

  .filter-label {
    font-weight: 500;
  }

  .sort-direction {
    font-size: 13px;
    opacity: 0.9;
    font-weight: 400;
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
