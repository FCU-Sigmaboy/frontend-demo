import { ref, onMounted } from 'vue'
import { getMyReports as getMyReportsAPI } from '@/api/reportAPI'

// ===================================================================
// ### 查詢我的檢舉記錄 Composable
// ###
// ### 功能說明：
// ###   - 封裝檢舉記錄查詢邏輯
// ###   - 自動載入與手動重新整理
// ###   - 支援分頁與篩選
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-16): 初版建立
// ===================================================================

/**
 * 查詢我的檢舉記錄 Composable
 *
 * @param {Object} [options] - 選項
 * @param {boolean} [options.autoFetch=true] - 是否在 mounted 時自動載入
 * @param {number} [options.pageSize=20] - 每頁數量
 * @returns {Object} - 回傳 Composable 物件
 *
 * @example
 * // 基本使用
 * import { useMyReports } from '@/composables/useMyReports'
 *
 * const { reports, isLoading, error, refetch } = useMyReports()
 *
 * @example
 * // 不自動載入
 * const { reports, fetchReports } = useMyReports({ autoFetch: false })
 * // 手動載入
 * await fetchReports()
 */
export function useMyReports(options = {}) {
  const {
    autoFetch = true,
    pageSize = 20
  } = options

  // 狀態管理
  const reports = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const hasMore = ref(true)

  // 篩選條件
  const filters = ref({
    reportType: null,
    status: null
  })

  /**
   * 載入檢舉記錄
   *
   * @param {Object} [params] - 查詢參數
   * @param {number} [params.page] - 頁碼
   * @param {boolean} [params.append=false] - 是否附加到現有資料（用於無限滾動）
   * @returns {Promise<Array>} - 檢舉記錄列表
   */
  const fetchReports = async (params = {}) => {
    const {
      page = 1,
      append = false
    } = params

    isLoading.value = true
    error.value = null

    try {
      const data = await getMyReportsAPI({
        page,
        pageSize,
        reportType: filters.value.reportType,
        status: filters.value.status
      })

      // 判斷是否還有更多資料
      hasMore.value = data.length === pageSize

      // 更新資料
      if (append) {
        reports.value = [...reports.value, ...data]
      } else {
        reports.value = data
      }

      currentPage.value = page

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入失敗'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 重新載入（從第一頁開始）
   */
  const refetch = () => {
    return fetchReports({ page: 1 })
  }

  /**
   * 載入更多（下一頁）
   */
  const loadMore = () => {
    if (!hasMore.value || isLoading.value) return

    return fetchReports({
      page: currentPage.value + 1,
      append: true
    })
  }

  /**
   * 設定篩選條件
   *
   * @param {Object} newFilters - 新的篩選條件
   * @param {'user' | 'item' | 'message' | 'transaction' | null} [newFilters.reportType] - 檢舉類型
   * @param {'pending' | 'reviewing' | 'resolved' | 'dismissed' | null} [newFilters.status] - 狀態
   */
  const setFilters = (newFilters) => {
    filters.value = {
      ...filters.value,
      ...newFilters
    }
    // 重新載入
    return refetch()
  }

  /**
   * 清除篩選條件
   */
  const clearFilters = () => {
    filters.value = {
      reportType: null,
      status: null
    }
    return refetch()
  }

  // 自動載入
  if (autoFetch) {
    onMounted(() => {
      fetchReports({ page: 1 })
    })
  }

  return {
    // 資料
    reports,
    isLoading,
    error,
    currentPage,
    hasMore,
    filters,
    // 方法
    fetchReports,
    refetch,
    loadMore,
    setFilters,
    clearFilters
  }
}
