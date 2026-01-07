// src/test/helpers.js
// Sprint 3: 擴充 Store 測試輔助函數
import { createPinia, setActivePinia } from 'pinia'

/**
 * 為測試設置新的 Pinia 實例
 * @returns {Pinia} Pinia 實例
 */
export function setupTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 等待所有 Promise 完成
 * @returns {Promise<void>}
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * 建立模擬的 API 回應
 * @param {any} data - 回應資料
 * @param {Error|null} error - 錯誤物件
 * @returns {{ data: any, error: Error|null }}
 */
export function createMockResponse(data, error = null) {
  return { data, error }
}

/**
 * 建立模擬的成功 API 回應
 * @param {any} data - 回應資料
 * @returns {{ success: true, data: any }}
 */
export function createSuccessResponse(data) {
  return { success: true, data }
}

/**
 * 建立模擬的失敗 API 回應
 * @param {string} message - 錯誤訊息
 * @returns {{ success: false, error: string }}
 */
export function createErrorResponse(message) {
  return { success: false, error: message }
}

/**
 * 延遲指定毫秒數
 * @param {number} ms - 毫秒數
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 建立模擬的交易資料
 * @param {Object} overrides - 覆寫的屬性
 * @returns {Object} 模擬的交易物件
 */
export function createMockTransaction(overrides = {}) {
  return {
    transaction_id: 'txn-123',
    item_id: 1,
    status: 'pending',
    giver_id: 'user-giver',
    receiver_id: 'user-receiver',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}
