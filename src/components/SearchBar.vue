<template>
  <div class="search-bar-wrapper">
    <div class="search-bar">
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

const emit = defineEmits(['search']);
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
  return selected ? selected.label : '選擇距離';
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
  { label: '不限距離', value: '-1' },
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

// Watch for URL changes and update search bar values
watch(() => route.query.search, (newSearch) => {
  searchQuery.value = newSearch || '';
}, { immediate: true });

watch(() => route.query.distance, (newDistance) => {
  distance.value = newDistance || '';
}, { immediate: true });
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
  border: 1px solid #d5d5d5;
  border-radius: 8px;
  overflow: visible;
  height: 56px;
  position: relative;
  gap: 2px;

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
  //     color: #6fb8a5;
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
  }

  .distance-dropdown {
    height: 100%;
    position: relative;
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
    background-color: #009688;
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
    padding: 0 12px;
  }

  .search-bar {
    height: 44px;
    gap: 0;

    .search-input-section {
      padding: 0 12px;
      gap: 6px;

      .search-icon {
        font-size: 16px;
      }

      .search-input {
        font-size: 13px;
      }
    }

    .location-section {
      padding: 0 8px;

      .location-icon {
        display: none;
      }
    }

    .location-dropdown,
    .distance-dropdown {
      padding: 0 8px;

      :deep(.btn) {
        font-size: 13px;

        &::after {
          font-size: 10px;
        }
      }
    }

    .search-divider {
      height: 20px;
    }

    .search-btn {
      font-size: 14px;
      padding: 0 16px;
      min-width: 70px;
    }
  }
}
</style>
