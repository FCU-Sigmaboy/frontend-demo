<template>
  <button
    class="report-btn report-btn--message"
    :class="{ 'report-btn--loading': isLoading }"
    :disabled="isLoading"
    @click="handleReport"
  >
    <i v-if="isLoading" class="bi bi-arrow-repeat spin"></i>
    <i v-else class="bi bi-flag"></i>
    <span>{{ isLoading ? '提交中...' : '檢舉訊息' }}</span>
  </button>
</template>

<script setup>
/**
 * 檢舉訊息按鈕元件
 *
 * @description 提供檢舉對話中的不當訊息功能
 *
 * @example
 * <ReportMessageButton
 *   :message-id="messageId"
 *   :sender-id="senderId"
 *   reason-code="HARASSMENT"
 *   @success="handleSuccess"
 * />
 */
import { useSubmitReport } from '@/composables/useSubmitReport'
import { REPORT_TYPES } from '@/api/reportAPI'

// Props 定義
const props = defineProps({
  /**
   * 被檢舉訊息的 ID（必填）
   */
  messageId: {
    type: Number,
    required: true
  },
  /**
   * 訊息發送者的 UUID（必填）
   */
  senderId: {
    type: String,
    required: true
  },
  /**
   * 檢舉原因代碼，預設為 HARASSMENT
   */
  reasonCode: {
    type: String,
    default: 'HARASSMENT'
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
    const confirmed = window.confirm('確定要檢舉此訊息嗎？')
    if (!confirmed) return
  }

  // 提交檢舉
  const result = await submitReport({
    report_type: REPORT_TYPES.MESSAGE,
    target_id: props.messageId,
    target_user_id: props.senderId,
    reason_code: props.reasonCode,
    reason_id: props.reasonId,
    description: props.description || undefined
  })

  // 處理結果
  if (result.success) {
    emit('success', result.data)
    alert('檢舉已提交')
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
  border: 1px solid $danger;
  border-radius: 6px;
  background-color: transparent;
  color: $danger;
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: $danger;
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
