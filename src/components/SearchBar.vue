<template>
  <div class="search-bar-wrapper">
    <BInputGroup class="search-bar">
      <!-- Search Input -->
      <BFormInput
        v-model="searchQuery"
        placeholder="搜尋物品"
        class="search-input"
        @keyup.enter="handleSearch"
      />

      <!-- Divider -->
      <div class="search-divider"></div>

      <!-- Distance Filter -->
      <BFormInput
        v-model="distance"
        placeholder="距離 +KM"
        class="distance-input"
        type="text"
      />

      <!-- Search Button -->
      <BButton variant="dark" class="search-btn" @click="handleSearch">
        搜尋
      </BButton>
    </BInputGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { BInputGroup, BFormInput, BButton } from 'bootstrap-vue-next';

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
  background-color: rgba(171, 186, 188, 0.6);
  backdrop-filter: blur(10px);
  border: 3px solid #000;
  border-radius: 50px;
  overflow: hidden;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  height: 50px;

  :deep(.input-group) {
    border-radius: 50px;
  }

  .search-input,
  .distance-input {
    border: none;
    background: transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #000;
    padding: 0 30px;

    &::placeholder {
      color: #000;
      opacity: 1;
    }

    &:focus {
      background: transparent;
      box-shadow: none;
      outline: none;
    }
  }

  .search-input {
    flex: 1;
  }

  .distance-input {
    max-width: 200px;
    text-align: left;
  }

  .search-divider {
    width: 1px;
    height: 44px;
    background-color: #000;
    margin: auto 0;
  }

  .search-btn {
    background-color: #000;
    border: none;
    border-radius: 50px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #fff;
    padding: 0 30px;
    margin: 3px;
    height: 44px;
    transition: all 0.3s;

    &:hover {
      background-color: #1a1a1a;
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@media (max-width: 991.98px) {
  .search-bar {
    height: 45px;

    .search-input,
    .distance-input {
      font-size: 18px;
      padding: 0 15px;
    }

    .distance-input {
      max-width: 150px;
    }

    .search-btn {
      font-size: 16px;
      padding: 0 20px;
      height: 39px;
    }

    .search-divider {
      height: 39px;
    }
  }
}

@media (max-width: 575.98px) {
  .search-bar-wrapper {
    padding: 0 10px;
  }

  .search-bar {
    height: 40px;
    flex-wrap: wrap;

    .search-input {
      font-size: 16px;
      padding: 0 12px;
    }

    .distance-input {
      max-width: 120px;
      font-size: 14px;
    }

    .search-btn {
      font-size: 14px;
      padding: 0 15px;
      height: 34px;
    }

    .search-divider {
      height: 34px;
    }
  }
}
</style>
