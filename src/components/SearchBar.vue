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
      <input
        v-model="distance"
        placeholder="距離 +K M"
        class="distance-input"
        type="text"
      />

      <!-- Search Button -->
      <button class="search-btn" @click="handleSearch">
        搜 尋
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['search']);

const searchQuery = ref('');
const distance = ref('');

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
  padding: 0 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: white;
  backdrop-filter: blur(10px);
  border: 0.5px solid black;
  border-radius: 5px;
  overflow: hidden;
  height: 50px;
  position: relative;

  .search-input,
  .distance-input {
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

  .search-input {
    flex: 1;
    min-width: 0;
  }

  .distance-input {
    width: 246px;
    text-align: left;
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
    .distance-input {
      font-size: 14px;
      padding: 0 15px;
    }

    .distance-input {
      width: 150px;
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

    .distance-input {
      width: 100px;
      font-size: 12px;
      padding: 0 10px;
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
