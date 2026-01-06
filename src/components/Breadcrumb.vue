<template>
  <div class="breadcrumb-section">
    <div class="breadcrumb-container">
      <nav class="breadcrumb">
        <router-link :to="{ name: 'Home' }" class="breadcrumb-link">首頁</router-link>
        <template v-for="(item, index) in items" :key="index">
          <span class="breadcrumb-separator">&gt;</span>
          <router-link
            v-if="item.to && index < items.length - 1"
            :to="item.to"
            class="breadcrumb-link"
          >
            {{ item.label }}
          </router-link>
          <span v-else class="breadcrumb-current">
            {{ item.label }}
          </span>
        </template>
      </nav>
    </div>
  </div>
</template>

<script setup>
  /**
   * Breadcrumb 組件
   *
   * @example
   * // 簡單用法
   * <Breadcrumb :items="[{ label: '個人資料' }]" />
   *
   * // 多層級用法
   * <Breadcrumb :items="[
   *   { label: '我的刊登', to: '/manage-listings' },
   *   { label: '編輯刊登' }
   * ]" />
   */

  defineProps({
    /**
     * 麵包屑項目列表
     * @type {Array<{label: string, to?: string}>}
     * 最後一個項目會自動顯示為當前頁面（不可點擊）
     */
    items: {
      type: Array,
      required: true,
      validator: (items) => {
        return items.every(
          (item) => item && typeof item === 'object' && typeof item.label === 'string'
        )
      },
    },
  })
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .breadcrumb-section {
    padding: 15px 0 10px;
    background-color: #f9f9f9;
  }

  .breadcrumb-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #555;
    flex-wrap: wrap;
  }

  .breadcrumb-link {
    color: $primary;
    text-decoration: none;
    transition: all 0.3s;

    &:hover {
      color: #5fa795;
      text-decoration: underline;
    }
  }

  .breadcrumb-separator {
    color: #999;
  }

  .breadcrumb-current {
    color: #1e1e1e;
    font-weight: 500;
  }

  // Responsive
  @media (max-width: 991.98px) {
    .breadcrumb-section {
      padding: 12px 0 8px;
    }

    .breadcrumb-container {
      padding: 0 15px;
    }

    .breadcrumb {
      font-size: 13px;
      gap: 6px;
    }
  }

  @media (max-width: 575.98px) {
    .breadcrumb-section {
      padding: 10px 0 6px;
    }

    .breadcrumb-container {
      padding: 0 10px;
    }

    .breadcrumb {
      font-size: 12px;
      gap: 5px;
    }
  }
</style>
