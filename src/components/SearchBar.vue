<template>
  <div class="search-bar-wrapper">
    <div class="search-bar">
      <!-- Search Input -->
      <input
        v-model="searchQuery"
        placeholder="搜尋物品"
        class="search-input"
        @keyup.enter="handleSearch"
      />

      <!-- Divider -->
      <div class="search-divider"></div>

      <!-- Distance Filter -->
      <BDropdown
        :text="selectedDistanceLabel"
        variant="link"
        class="distance-dropdown"
        no-caret
        strategy="fixed"
        :teleport="true"
      >
        <BDropdownItem
          v-for="option in distance_options"
          :key="option.value"
          @click="selectDistance(option.value)"
        >
          {{ option.label }}
        </BDropdownItem>
      </BDropdown>

      <!-- Search Button -->
      <button class="search-btn" @click="handleSearch">
        搜 尋
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next';

const emit = defineEmits(['search']);

const searchQuery = ref('');
const distance = ref('');

const selectedDistanceLabel = computed(() => {
  const selected = distance_options.find(opt => opt.value === distance.value);
  return selected ? selected.label : '距離 km';
});

const distance_options = [
  { label: '不限', value: '' },
  { label: '5 km 以內', value: '5' },
  { label: '10 km 以內', value: '10' },
  { label: '20 km 以內', value: '20' },
  { label: '50 km 以內', value: '50' }
];

const selectDistance = (value) => {
  distance.value = value;
};

const handleSearch = () => {
  emit('search', {
    query: searchQuery.value,
    distance: distance.value
  });
};
</script>

<style scoped lang="scss">
.search-bar-wrapper {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: white;
  backdrop-filter: blur(10px);
  border: 0.5px solid black;
  border-radius: 5px;
  overflow: visible;
  height: 50px;
  position: relative;

  .search-input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    padding: 0 25px;
    outline: none;
    height: 100%;

    &::placeholder {
      color: #1e1e1e;
      opacity: 1;
    }

    &:focus {
      background: transparent;
      outline: none;
    }
  }

  .distance-dropdown {
    width: 246px;
    height: 100%;
    position: relative;
    z-index: 1000;

    :deep(.btn) {
      border: none;
      background: transparent;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #1e1e1e;
      padding: 0 25px;
      height: 100%;
      width: 100%;
      text-align: left;
      box-shadow: none !important;
      border-radius: 0;
      text-decoration: none;

      &:hover, &:focus, &:active {
        background: transparent;
        color: #1e1e1e;
      }
    }

    :deep(.dropdown-menu) {
      margin-top: 0;
      border-radius: 5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1050;
    }
  }

  .search-divider {
    width: 1px;
    height: 50px;
    background-color: #6fb8a5;
    flex-shrink: 0;
  }

  .search-btn {
    background-color: #6fb8a5;
    border: none;
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: white;
    padding: 0 30px;
    height: 100%;
    min-width: 115px;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;

    &:hover {
      background-color: #5fa795;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

@media (max-width: 991.98px) {
  .search-bar-wrapper {
    padding: 0 15px;
  }

  .search-bar {
    height: 45px;

    .search-input,
    .distance-dropdown {
      font-size: 14px;
    }

    .distance-dropdown {
      width: 150px;

      :deep(.btn) {
        padding: 0 15px;
      }
    }

    .search-divider {
      height: 45px;
    }

    .search-btn {
      font-size: 14px;
      padding: 0 20px;
      min-width: 80px;
    }
  }
}

@media (max-width: 575.98px) {
  .search-bar-wrapper {
    padding: 0 10px;
  }

  .search-bar {
    height: 40px;

    .search-input {
      font-size: 12px;
      padding: 0 10px;
    }

    .distance-dropdown {
      width: 100px;
      font-size: 12px;

      :deep(.btn) {
        padding: 0 10px;
      }
    }

    .search-divider {
      height: 40px;
    }

    .search-btn {
      font-size: 12px;
      padding: 0 15px;
      min-width: 60px;
    }
  }
}
</style>
