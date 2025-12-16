<template>
  <button
    class="report-btn report-btn--transaction"
    :class="{ 'report-btn--loading': isLoading }"
    :disabled="isLoading"
    @click="handleReport"
  >
    <i v-if="isLoading" class="bi bi-arrow-repeat spin"></i>
    <i v-else class="bi bi-exclamation-triangle"></i>
    <span>{{ isLoading ? '提交中...' : '檢舉交易' }}</span>
  </button>
</template>

<script setup>
/**
 * 檢舉交易按鈕元件
 *
 * @description 提供檢舉交易過程中問題的功能
 *
 * @example
 * <ReportTransactionButton
 *   :transaction-id="transactionId"
 *   :other-user-id="sellerId"
 *   reason-code="NO_DELIVERY"
 *   description="賣家未依約交付商品"
 *   @success="handleSuccess"
 * />
 */
import { useSubmitReport } from '@/composables/useSubmitReport'
import { REPORT_TYPES } from '@/api/reportAPI'

// Props 定義
const props = defineProps({
  /**
   * 被檢舉交易的 ID（必填）
   */
  transactionId: {
    type: Number,
    required: true
  },
  /**
   * 交易對方的 UUID（必填）
   */
  otherUserId: {
    type: String,
    required: true
  },
  /**
   * 檢舉原因代碼，預設為 NO_DELIVERY
   */
  reasonCode: {
    type: String,
    default: 'NO_DELIVERY'
  },
  /**
   * 檢舉原因 ID
   */
  reasonId: {
    type: Number,
    default: undefined
  },
  /**
   * 詳細說明
   */
  description: {
    type: String,
    default: ''
  },
  /**
   * 是否顯示確認對話框
   */
  showConfirm: {
    type: Boolean,
    default: true
  }
})

// Emits 定義
const emit = defineEmits(['success', 'error'])

// 使用 Composable
const { submitReport, isLoading } = useSubmitReport()

/**
 * 處理檢舉動作
 */
const handleReport = async () => {
  // 確認對話框
  if (props.showConfirm) {
    const confirmed = window.confirm('確定要檢舉此交易嗎？這將會通知管理員審查。')
    if (!confirmed) return
  }

  // 提交檢舉
  const result = await submitReport({
    report_type: REPORT_TYPES.TRANSACTION,
    target_id: props.transactionId,
    target_user_id: props.otherUserId,
    reason_code: props.reasonCode,
    reason_id: props.reasonId,
    description: props.description || undefined
  })

  // 處理結果
  if (result.success) {
    emit('success', result.data)
    alert('檢舉已提交，我們會盡快處理')
  } else {
    emit('error', result.error)
    alert(`檢舉失敗：${result.error}`)
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.report-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid $warning;
  border-radius: 6px;
  background-color: transparent;
  color: $warning;
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: $warning;
    color: white;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--loading {
    pointer-events: none;
  }

  i {
    font-size: 16px;
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
</style>
