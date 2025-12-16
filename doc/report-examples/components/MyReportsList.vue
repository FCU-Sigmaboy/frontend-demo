<template>
  <div class="my-reports">
    <!-- Header -->
    <div class="my-reports__header">
      <h2 class="my-reports__title">
        <i class="bi bi-flag"></i>
        我的檢舉記錄
      </h2>

      <!-- 篩選器 -->
      <div class="my-reports__filters">
        <select
          v-model="selectedType"
          class="my-reports__filter-select"
          @change="handleFilterChange"
        >
          <option value="">全部類型</option>
          <option value="user">用戶</option>
          <option value="item">商品</option>
          <option value="message">訊息</option>
          <option value="transaction">交易</option>
        </select>

        <select
          v-model="selectedStatus"
          class="my-reports__filter-select"
          @change="handleFilterChange"
        >
          <option value="">全部狀態</option>
          <option value="pending">待處理</option>
          <option value="reviewing">審查中</option>
          <option value="resolved">已處理</option>
          <option value="dismissed">已駁回</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && reports.length === 0" class="my-reports__loading">
      <i class="bi bi-arrow-repeat spin"></i>
      <span>載入中...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="my-reports__error">
      <i class="bi bi-exclamation-triangle"></i>
      <span>{{ error }}</span>
      <button class="my-reports__retry-btn" @click="refetch">重試</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="reports.length === 0" class="my-reports__empty">
      <i class="bi bi-inbox"></i>
      <span>尚無檢舉記錄</span>
    </div>

    <!-- Reports List -->
    <ul v-else class="my-reports__list">
      <li
        v-for="report in reports"
        :key="report.id"
        class="my-reports__item"
      >
        <div class="my-reports__item-header">
          <span :class="`type-badge type-badge--${report.report_type}`">
            {{ getTypeLabel(report.report_type) }}
          </span>
          <span :class="`status-badge status-badge--${report.status}`">
            {{ getStatusLabel(report.status) }}
          </span>
        </div>

        <div class="my-reports__item-reason">
          <strong>原因：</strong>
          {{ report.reason?.reason_label || report.reason_code }}
        </div>

        <p v-if="report.description" class="my-reports__item-description">
          {{ report.description }}
        </p>

        <div class="my-reports__item-meta">
          <span class="my-reports__item-date">
            <i class="bi bi-clock"></i>
            {{ formatDate(report.created_at) }}
          </span>
          <span class="my-reports__item-id">
            #{{ report.id }}
          </span>
        </div>
      </li>
    </ul>

    <!-- Load More -->
    <div v-if="hasMore && reports.length > 0" class="my-reports__load-more">
      <button
        class="my-reports__load-more-btn"
        :disabled="isLoading"
        @click="loadMore"
      >
        <i v-if="isLoading" class="bi bi-arrow-repeat spin"></i>
        <span>{{ isLoading ? '載入中...' : '載入更多' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * 我的檢舉記錄列表元件
 *
 * @description 顯示用戶提交的所有檢舉記錄，支援篩選和分頁
 *
 * @example
 * <MyReportsList />
 *
 * @example
 * // 自訂每頁數量
 * <MyReportsList :page-size="10" />
 */
import { ref, computed } from 'vue'
import { useMyReports } from '@/composables/useMyReports'

// Props 定義
const props = defineProps({
  /**
   * 每頁數量
   */
  pageSize: {
    type: Number,
    default: 20
  }
})

// 使用 Composable
const {
  reports,
  isLoading,
  error,
  hasMore,
  refetch,
  loadMore,
  setFilters
} = useMyReports({
  pageSize: props.pageSize
})

// 篩選狀態
const selectedType = ref('')
const selectedStatus = ref('')

// 類型標籤
const typeLabels = {
  user: '用戶',
  item: '商品',
  message: '訊息',
  transaction: '交易'
}

// 狀態標籤
const statusLabels = {
  pending: '待處理',
  reviewing: '審查中',
  resolved: '已處理',
  dismissed: '已駁回'
}

/**
 * 取得類型標籤
 */
const getTypeLabel = (type) => typeLabels[type] || type

/**
 * 取得狀態標籤
 */
const getStatusLabel = (status) => statusLabels[status] || status

/**
 * 格式化日期
 */
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 處理篩選變更
 */
const handleFilterChange = () => {
  setFilters({
    reportType: selectedType.value || null,
    status: selectedStatus.value || null
  })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.my-reports {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #333;

    i {
      color: $primary;
    }
  }

  &__filters {
    display: flex;
    gap: 12px;
  }

  &__filter-select {
    padding: 8px 32px 8px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #333;
    background-color: white;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    cursor: pointer;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: $primary;
    }
  }

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 24px;
    background: #f8f9fa;
    border-radius: 12px;
    color: #666;

    i {
      font-size: 48px;
      opacity: 0.5;
    }
  }

  &__error {
    color: $danger;

    i {
      color: $danger;
      opacity: 1;
    }
  }

  &__retry-btn {
    margin-top: 8px;
    padding: 8px 16px;
    border: 1px solid $primary;
    border-radius: 6px;
    background: transparent;
    color: $primary;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: $primary;
      color: white;
    }
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__item {
    padding: 20px;
    background: white;
    border: 1px solid #eee;
    border-radius: 12px;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  &__item-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  &__item-reason {
    font-size: 15px;
    color: #333;
    margin-bottom: 8px;
  }

  &__item-description {
    margin: 0 0 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    font-size: 14px;
    color: #555;
    line-height: 1.6;
  }

  &__item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    color: #999;
  }

  &__item-date {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__item-id {
    font-family: monospace;
  }

  &__load-more {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  &__load-more-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    color: #333;
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: $primary;
      color: $primary;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// Type Badge Styles
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &--user {
    background: #e3f2fd;
    color: #1565c0;
  }

  &--item {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  &--message {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--transaction {
    background: #fff3e0;
    color: #e65100;
  }
}

// Status Badge Styles
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &--pending {
    background: #fff3e0;
    color: #e65100;
  }

  &--reviewing {
    background: #e3f2fd;
    color: #1565c0;
  }

  &--resolved {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--dismissed {
    background: #f5f5f5;
    color: #757575;
  }
}

// 旋轉動畫
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// RWD 調整
@media (max-width: 576px) {
  .my-reports {
    padding: 16px;

    &__header {
      flex-direction: column;
      align-items: flex-start;
    }

    &__filters {
      width: 100%;
    }

    &__filter-select {
      flex: 1;
    }

    &__item {
      padding: 16px;
    }

    &__item-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
}
</style>
