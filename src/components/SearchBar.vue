<template>
  <div class="search-bar-wrapper">
    <div class="search-bar">
      <!-- Menu Icon (Hamburger) -->
      <button class="menu-btn" @click="handleMenuClick">
        <i class="bi bi-list"></i>
      </button>

      <!-- Divider -->
      <div class="search-divider"></div>

      <!-- Search Icon and Input -->
      <div class="search-input-section">
        <i class="bi bi-search search-icon"></i>
        <input
          v-model="searchQuery"
          placeholder="搜尋物品"
          class="search-input"
          @keyup.enter="handleSearch"
        />
      </div>

      <!-- Divider -->
      <div class="search-divider"></div>

      <!-- Location Filter with Icon -->
      <!-- <div class="location-section">
        <i class="bi bi-geo-alt location-icon"></i>
        <BDropdown
          :text="selectedLocation"
          variant="link"
          class="location-dropdown"
          strategy="fixed"
          :teleport="true"
        >
          <BDropdownItem
            v-for="option in location_options"
            :key="option.value"
            @click="selectLocation(option.value)"
          >
            {{ option.label }}
          </BDropdownItem>
        </BDropdown>
      </div> -->

      <!-- Distance Filter -->
      <div class="distance-section">
        <i class="bi bi-geo-alt location-icon"></i>
        <BDropdown
          :text="selectedDistanceLabel"
          variant="link"
          class="distance-dropdown"
          strategy="absolute"
        >
          <BDropdownItem
            v-for="option in distance_options"
            :key="option.value"
            @click="selectDistance(option.value)"
          >
            {{ option.label }}
          </BDropdownItem>
        </BDropdown>
      </div>

      <!-- Search Button -->
      <button class="search-btn" @click="handleSearch">
        搜尋
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next';

const emit = defineEmits(['search', 'menu-click']);
const route = useRoute();

const searchQuery = ref('');
const distance = ref('');
// const location = ref('taichung');

// const selectedLocation = computed(() => {
//   const selected = location_options.find(opt => opt.value === location.value);
//   return selected ? selected.label : '台中';
// });

const selectedDistanceLabel = computed(() => {
  const selected = distance_options.find(opt => opt.value === distance.value);
  return selected ? selected.label : '不限距離';
});

// const location_options = [
//   { label: '台中', value: 'taichung' },
//   { label: '台北', value: 'taipei' },
//   { label: '新北', value: 'new-taipei' },
//   { label: '桃園', value: 'taoyuan' },
//   { label: '台南', value: 'tainan' },
//   { label: '高雄', value: 'kaohsiung' }
// ];

const distance_options = [
  { label: '不限距離', value: '' },
  { label: '5 km 以內', value: '5' },
  { label: '10 km 以內', value: '10' },
  { label: '20 km 以內', value: '20' },
  { label: '50 km 以內', value: '50' }
];

// const selectLocation = (value) => {
//   location.value = value;
// };

const selectDistance = (value) => {
  distance.value = value;
};

const handleSearch = () => {
  emit('search', {
    query: searchQuery.value,
    distance: distance.value
  });
};

const handleMenuClick = () => {
  emit('menu-click');
};

// Watch for URL changes and update search bar values
watch(() => route.query.search, (newSearch) => {
  searchQuery.value = newSearch || '';
}, { immediate: true });

watch(() => route.query.distance, (newDistance) => {
  distance.value = newDistance || '';
}, { immediate: true });
</script>

<style scoped lang="scss">
@import '@/styles/variables';

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
  border: 1px solid #d5d5d5;
  border-radius: 8px;
  overflow: visible;
  height: 56px;
  position: relative;
  gap: 2px;

  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;

    i {
      font-size: 24px;
      color: #666;
      transition: color 0.2s;
    }

    &:hover {
      background: #f5f5f5;

      i {
        color: $primary;
      }
    }

    &:active {
      background: #e0e0e0;
    }
  }

  .search-input-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    height: 100%;

    .search-icon {
      font-size: 20px;
      color: #666;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      color: #1e1e1e;
      outline: none;
      height: 100%;

      &::placeholder {
        color: #999;
        opacity: 1;
      }

      &:focus {
        background: transparent;
        outline: none;
      }
    }
  }

  // .location-section {
  //   display: flex;
  //   align-items: center;
  //   gap: 8px;
  //   padding: 0 16px;
  //   height: 100%;

  //   .location-icon {
  //     font-size: 20px;
  //     color: $primary;
  //     flex-shrink: 0;
  //   }
  // }

  // .location-dropdown {
  //   height: 100%;
  //   position: relative;
  //   z-index: 1000;

  //   :deep(.btn) {
  //     border: none;
  //     background: transparent;
  //     font-family: 'Noto Sans TC', sans-serif;
  //     font-size: 15px;
  //     font-weight: 500;
  //     color: #1e1e1e;
  //     padding: 0;
  //     height: 100%;
  //     display: flex;
  //     align-items: center;
  //     gap: 4px;
  //     box-shadow: none !important;
  //     border-radius: 0;
  //     text-decoration: none;

  //     &:hover, &:focus, &:active {
  //       background: transparent;
  //       color: #1e1e1e;
  //     }

  //     &::after {
  //       content: '\F282';
  //       font-family: 'bootstrap-icons';
  //       border: none;
  //       vertical-align: 0;
  //       margin-left: 4px;
  //       font-size: 12px;
  //     }
  //   }

  //   :deep(.dropdown-menu) {
  //     margin-top: 8px;
  //     border-radius: 8px;
  //     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  //     border: 1px solid #e0e0e0;
  //     z-index: 1050;
  //     min-width: 140px;
  //   }

  //   :deep(.dropdown-item) {
  //     padding: 10px 16px;
  //     font-size: 14px;
  //     font-family: 'Noto Sans TC', sans-serif;

  //     &:hover {
  //       background-color: #f5f5f5;
  //     }
  //   }
  // }

  .distance-section {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    height: 100%;
    position: relative;
  }

  .distance-dropdown {
    height: 100%;
    position: static;
    z-index: 1000;
    padding-right: 16px;

    :deep(.btn) {
      border: none;
      background: transparent;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      color: #1e1e1e;
      padding: 0;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: none !important;
      border-radius: 0;
      text-decoration: none;
      white-space: nowrap;

      &:hover, &:focus, &:active {
        background: transparent;
        color: #1e1e1e;
      }

      &::after {
        content: '\F282';
        font-family: 'bootstrap-icons';
        border: none;
        vertical-align: 0;
        margin-left: 4px;
        font-size: 12px;
      }
    }

    :deep(.dropdown-menu) {
      margin-top: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #e0e0e0;
      z-index: 1050;
      min-width: 120px;
    }

    :deep(.dropdown-item) {
      padding: 10px 16px;
      font-size: 14px;
      font-family: 'Noto Sans TC', sans-serif;

      &:hover {
        background-color: #f5f5f5;
      }
    }
  }

  .search-divider {
    width: 1px;
    height: 32px;
    background-color: #e0e0e0;
    flex-shrink: 0;
  }

  .search-btn {
    background-color: $primary;
    border: none;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: white;
    padding: 0 32px;
    height: 100%;
    min-width: 100px;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;

    &:hover {
      background-color: #00796b;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

@media (max-width: 1600px) {
  .search-bar-wrapper {
    padding: 0 20px;
  }

  .search-bar {
    height: 52px;

    .menu-btn {
      width: 52px;

      i {
        font-size: 22px;
      }
    }

    .search-input-section {
      padding: 0 16px;

      .search-icon {
        font-size: 18px;
      }

      .search-input {
        font-size: 14px;
      }
    }

    .location-section {
      padding: 0 12px;

      .location-icon {
        font-size: 18px;
      }
    }

    .distance-dropdown {
      padding: 0 12px;

      :deep(.btn) {
        font-size: 14px;
      }
    }

    .search-divider {
      height: 28px;
    }

    .search-btn {
      font-size: 15px;
      padding: 0 24px;
      min-width: 90px;
    }
  }
}

@media (max-width: 1300px) {
  .category-nav {
    visibility: hidden;
  }

}

@media (max-width: 991.98px) {
  .search-bar-wrapper {
    padding: 0 15px;
  }

  .search-bar {
    height: 48px;

    .menu-btn {
      width: 48px;

      i {
        font-size: 20px;
      }
    }

    .search-input-section {
      padding: 0 12px;
      gap: 8px;

      .search-icon {
        font-size: 16px;
      }

      .search-input {
        font-size: 13px;
      }
    }

    .location-section {
      .location-icon {
        display: none;
      }
    }

    .location-dropdown,
    .distance-dropdown {
      :deep(.btn) {
        font-size: 13px;
      }
    }

    .search-divider {
      height: 24px;
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
    padding: 0 16px;
    max-width: 100%;
  }

  .search-bar {
    height: 44px;
    gap: 0;

    .menu-btn {
      width: 44px;

      i {
        font-size: 20px;
      }
    }

    .search-input-section {
      padding: 0 10px;
      gap: 6px;
      min-width: 0;
      flex: 1;

      .search-icon {
        font-size: 16px;
      }

      .search-input {
        font-size: 13px;
        min-width: 60px;
      }
    }

    .location-section {
      padding: 0 6px;

      .location-icon {
        display: none;
      }
    }

    .distance-section {
      padding: 0 6px;
      position: relative;

      .location-icon {
        font-size: 16px;
      }
    }

    .location-dropdown,
    .distance-dropdown {
      padding-right: 6px;
      position: static;

      :deep(.btn) {
        font-size: 12px;
        gap: 2px;

        &::after {
          font-size: 10px;
          margin-left: 2px;
        }
      }

      :deep(.dropdown-menu) {
        position: absolute !important;
        right: 0 !important;
        left: auto !important;
        transform: none !important;
        top: 100% !important;
        margin-top: 8px !important;
      }
    }

    .search-divider {
      height: 20px;
    }

    .search-btn {
      font-size: 13px;
      padding: 0 12px;
      min-width: 60px;
    }
  }
}
</style>
