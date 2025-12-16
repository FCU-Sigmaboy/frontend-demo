<template>
  <div class="report-form-container">
    <form class="report-form" @submit.prevent="handleSubmit">
      <!-- Header -->
      <div class="report-form__header">
        <h3 class="report-form__title">
          <i class="bi bi-flag"></i>
          提交檢舉
        </h3>
        <button 
          type="button" 
          class="report-form__close" 
          @click="emit('cancel')"
          :disabled="isLoading"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loadingReasons" class="report-form__loading">
        <i class="bi bi-arrow-repeat spin"></i>
        <span>載入中...</span>
      </div>

      <template v-else>
        <!-- Report Type Badge -->
        <div class="report-form__type-badge">
          <span :class="`type-badge type-badge--${reportType}`">
            {{ typeLabels[reportType] }}檢舉
          </span>
        </div>

        <!-- 檢舉原因選擇 -->
        <div class="report-form__group">
          <label for="reason-select" class="report-form__label">
            檢舉原因 <span class="required">*</span>
          </label>
          <select
            id="reason-select"
            v-model="selectedReasonId"
            class="report-form__select"
            required
          >
            <option value="">請選擇原因</option>
            <option
              v-for="reason in reasons"
              :key="reason.id"
              :value="reason.id"
            >
              {{ reason.reason_label }}
            </option>
          </select>
          <p v-if="selectedReason?.description" class="report-form__hint">
            <i class="bi bi-info-circle"></i>
            {{ selectedReason.description }}
          </p>
        </div>

        <!-- 詳細說明 -->
        <div class="report-form__group">
          <label for="description" class="report-form__label">
            詳細說明
            <span class="optional">（選填）</span>
          </label>
          <textarea
            id="description"
            v-model="description"
            class="report-form__textarea"
            placeholder="請描述您遇到的問題，提供越多細節有助於我們更快處理..."
            maxlength="1000"
            rows="4"
          ></textarea>
          <div class="report-form__char-count">
            <span :class="{ 'warning': description.length > 900 }">
              {{ description.length }}
            </span>
            <span>/ 1000</span>
          </div>
        </div>

        <!-- 證據上傳提示 -->
        <div class="report-form__evidence-hint">
          <i class="bi bi-camera"></i>
          <span>如需提供證據圖片，請先上傳至雲端空間後將連結貼在說明欄位</span>
        </div>

        <!-- 錯誤訊息 -->
        <div v-if="error" class="report-form__error">
          <i class="bi bi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>

        <!-- 提交按鈕 -->
        <div class="report-form__actions">
          <button
            type="button"
            class="report-form__btn report-form__btn--cancel"
            @click="emit('cancel')"
            :disabled="isLoading"
          >
            取消
          </button>
          <button
            type="submit"
            class="report-form__btn report-form__btn--submit"
            :disabled="isLoading || !selectedReasonId"
          >
            <i v-if="isLoading" class="bi bi-arrow-repeat spin"></i>
            <span>{{ isLoading ? '提交中...' : '提交檢舉' }}</span>
          </button>
        </div>
      </template>
    </form>
  </div>
</template>

<script setup>
/**
 * 完整的檢舉表單元件
 *
 * @description 提供完整的檢舉流程，包含原因選擇、詳細說明等功能
 *
 * @example
 * <ReportForm
 *   report-type="item"
 *   :target-id="productId"
 *   @success="handleSuccess"
 *   @cancel="closeModal"
 * />
 *
 * @example
 * // 用戶檢舉需提供 target-user-id
 * <ReportForm
 *   report-type="user"
 *   :target-id="0"
 *   :target-user-id="userId"
 *   @success="handleSuccess"
 *   @cancel="closeModal"
 * />
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getReportReasons } from '@/api/reportAPI'
import { useSubmitReport } from '@/composables/useSubmitReport'

// Props 定義
const props = defineProps({
  /**
   * 檢舉類型（必填）
   */
  reportType: {
    type: String,
    required: true,
    validator: (value) => ['user', 'item', 'message', 'transaction'].includes(value)
  },
  /**
   * 被檢舉對象的 ID（必填）
   */
  targetId: {
    type: Number,
    required: true
  },
  /**
   * 被檢舉用戶的 UUID（用戶檢舉時必填）
   */
  targetUserId: {
    type: String,
    default: undefined
  }
})

// Emits 定義
const emit = defineEmits(['success', 'cancel'])

// 類型標籤
const typeLabels = {
  user: '用戶',
  item: '商品',
  message: '訊息',
  transaction: '交易'
}

// 狀態管理
const reasons = ref([])
const selectedReasonId = ref('')
const description = ref('')
const loadingReasons = ref(true)

// 使用 Composable
const { submitReport, isLoading, error } = useSubmitReport()

// 計算選中的原因物件
const selectedReason = computed(() => {
  if (!selectedReasonId.value) return null
  return reasons.value.find(r => r.id === Number(selectedReasonId.value))
})

/**
 * 載入檢舉原因
 */
const loadReasons = async () => {
  loadingReasons.value = true

  try {
    const data = await getReportReasons(props.reportType)
    reasons.value = data
  } catch (err) {
    console.error('載入檢舉原因失敗:', err)
  } finally {
    loadingReasons.value = false
  }
}

// 監聽 reportType 變化，重新載入原因列表
watch(() => props.reportType, () => {
  selectedReasonId.value = ''
  loadReasons()
})

// 初始載入
onMounted(() => {
  loadReasons()
})

/**
 * 處理表單提交
 */
const handleSubmit = async () => {
  if (!selectedReason.value) {
    alert('請選擇檢舉原因')
    return
  }

  const result = await submitReport({
    report_type: props.reportType,
    target_id: props.targetId,
    target_user_id: props.targetUserId,
    reason_code: selectedReason.value.reason_code,
    reason_id: selectedReason.value.id,
    description: description.value || undefined
  })

  if (result.success) {
    emit('success', result.data)
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.report-form-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;
}

.report-form {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #333;

    i {
      color: $danger;
    }
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: #f5f5f5;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #eee;
      color: #333;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 24px;
    color: #666;

    i {
      font-size: 24px;
    }
  }

  &__type-badge {
    padding: 16px 24px 0;
  }

  &__group {
    padding: 0 24px;
    margin-top: 20px;
  }

  &__label {
    display: block;
    margin-bottom: 8px;
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #333;

    .required {
      color: $danger;
    }

    .optional {
      font-weight: 400;
      color: #999;
    }
  }

  &__select,
  &__textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #333;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }

    &::placeholder {
      color: #999;
    }
  }

  &__select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 40px;
    cursor: pointer;
  }

  &__textarea {
    resize: vertical;
    min-height: 100px;
  }

  &__hint {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 8px;
    font-size: 13px;
    color: #666;

    i {
      margin-top: 2px;
      color: $primary;
    }
  }

  &__char-count {
    text-align: right;
    margin-top: 4px;
    font-size: 12px;
    color: #999;

    .warning {
      color: $warning;
      font-weight: 500;
    }
  }

  &__evidence-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 20px 24px;
    padding: 12px 14px;
    background: #f8f9fa;
    border-radius: 8px;
    font-size: 13px;
    color: #666;

    i {
      color: #999;
    }
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 24px;
    padding: 12px 14px;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    font-size: 14px;
    color: $danger;

    i {
      flex-shrink: 0;
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 24px;
    border-top: 1px solid #eee;
    margin-top: 20px;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &--cancel {
      background: #f5f5f5;
      color: #666;

      &:hover:not(:disabled) {
        background: #eee;
      }
    }

    &--submit {
      background: $danger;
      color: white;

      &:hover:not(:disabled) {
        background: darken($danger, 10%);
      }
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
  .report-form-container {
    padding: 0;
    align-items: flex-end;
  }

  .report-form {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }

  .report-form__actions {
    flex-direction: column-reverse;

    .report-form__btn {
      width: 100%;
    }
  }
}
</style>
