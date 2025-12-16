import { ref } from 'vue'
import { submitReport as submitReportAPI } from '@/api/reportAPI'

// ===================================================================
// ### 提交檢舉 Composable
// ###
// ### 功能說明：
// ###   - 封裝檢舉提交邏輯
// ###   - 提供載入狀態與錯誤處理
// ###   - 可在任何元件中重複使用
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-16): 初版建立
// ===================================================================

/**
 * 提交檢舉的 Composable
 *
 * @returns {Object} - 回傳 Composable 物件
 * @returns {Function} submitReport - 提交檢舉函式
 * @returns {import('vue').Ref<boolean>} isLoading - 載入狀態
 * @returns {import('vue').Ref<string|null>} error - 錯誤訊息
 * @returns {Function} clearError - 清除錯誤訊息
 *
 * @example
 * // 在元件中使用
 * import { useSubmitReport } from '@/composables/useSubmitReport'
 *
 * const { submitReport, isLoading, error } = useSubmitReport()
 *
 * const handleReport = async () => {
 *   const result = await submitReport({
 *     report_type: 'item',
 *     target_id: 123,
 *     reason_code: 'FAKE_PRODUCT',
 *     description: '此商品為仿冒品'
 *   })
 *
 *   if (result.success) {
 *     console.log('檢舉已提交', result.data)
 *   } else {
 *     console.error('提交失敗', result.error)
 *   }
 * }
 */
export function useSubmitReport() {
  // 狀態管理
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * 提交檢舉
   *
   * @param {Object} params - 檢舉參數
   * @param {'user' | 'item' | 'message' | 'transaction'} params.report_type - 檢舉類型
   * @param {number} params.target_id - 被檢舉對象的 ID
   * @param {string} [params.target_user_id] - 被檢舉用戶的 UUID（用戶檢舉必填）
   * @param {string} params.reason_code - 檢舉原因代碼
   * @param {number} [params.reason_id] - 檢舉原因 ID
   * @param {string} [params.description] - 詳細說明（最多 1000 字）
   * @param {string[]} [params.evidence_urls] - 證據圖片網址陣列
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} - 提交結果
   */
  const submitReport = async (params) => {
    // 1. 重置狀態
    isLoading.value = true
    error.value = null

    try {
      // 2. 呼叫 API
      const data = await submitReportAPI(params)

      // 3. 成功回傳
      return {
        success: true,
        data
      }
    } catch (err) {
      // 4. 錯誤處理
      const message = err instanceof Error ? err.message : '提交檢舉時發生錯誤'
      error.value = message

      return {
        success: false,
        error: message
      }
    } finally {
      // 5. 結束載入
      isLoading.value = false
    }
  }

  /**
   * 清除錯誤訊息
   */
  const clearError = () => {
    error.value = null
  }

  return {
    submitReport,
    isLoading,
    error,
    clearError
  }
}
