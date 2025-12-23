// Transaction API 模擬
import { vi } from 'vitest'
import { mockTransactionStates, mockItems } from '../../fixtures/transaction-data.js'
import { createMockSuccessResponse, createMockErrorResponse } from '../../fixtures/api-responses.js'

// 模擬 Transaction API 函數
export const createTransaction = vi.fn().mockImplementation(async (transactionData) => {
  if (!transactionData.buyer_id || !transactionData.seller_id || !transactionData.item_id) {
    return createMockErrorResponse('買家 ID、賣家 ID 和商品 ID 是必需的', 400)
  }
  
  const newTransaction = {
    id: `txn-${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    confirmation_code: null,
    ...transactionData
  }
  
  return createMockSuccessResponse(newTransaction, 201)
})

export const getTransaction = vi.fn().mockImplementation(async (transactionId) => {
  if (!transactionId) {
    return createMockErrorResponse('交易 ID 是必需的', 400)
  }
  
  // 模擬根據 ID 返回不同狀態的交易
  const transaction = transactionId.includes('pending') 
    ? mockTransactionStates.pending
    : mockTransactionStates.confirmed
    
  return createMockSuccessResponse(transaction)
})

export const updateTransactionStatus = vi.fn().mockImplementation(async (transactionId, status, notes = '') => {
  if (!transactionId || !status) {
    return createMockErrorResponse('交易 ID 和狀態是必需的', 400)
  }
  
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return createMockErrorResponse('無效的交易狀態', 400)
  }
  
  const updatedTransaction = {
    ...mockTransactionStates.pending,
    id: transactionId,
    status,
    notes,
    updated_at: new Date().toISOString(),
    confirmation_code: status === 'confirmed' || status === 'completed' 
      ? Math.random().toString(36).substr(2, 6).toUpperCase() 
      : null
  }
  
  return createMockSuccessResponse(updatedTransaction)
})

export const getUserTransactions = vi.fn().mockImplementation(async (userId, type = 'all', limit = 10, offset = 0) => {
  if (!userId) {
    return createMockErrorResponse('用戶 ID 是必需的', 400)
  }
  
  // 模擬用戶交易列表
  let transactions = [
    mockTransactionStates.pending,
    mockTransactionStates.confirmed,
    mockTransactionStates.completed
  ]
  
  // 根據類型過濾
  if (type === 'buyer') {
    transactions = transactions.filter(t => t.buyer_id === userId)
  } else if (type === 'seller') {
    transactions = transactions.filter(t => t.seller_id === userId)
  }
  
  // 分頁
  const paginatedTransactions = transactions.slice(offset, offset + limit)
  
  return createMockSuccessResponse(paginatedTransactions)
})

export const generateConfirmationCode = vi.fn().mockImplementation(async (transactionId) => {
  if (!transactionId) {
    return createMockErrorResponse('交易 ID 是必需的', 400)
  }
  
  const confirmationCode = Math.random().toString(36).substr(2, 6).toUpperCase()
  
  const updatedTransaction = {
    ...mockTransactionStates.pending,
    id: transactionId,
    status: 'confirmed',
    confirmation_code: confirmationCode,
    updated_at: new Date().toISOString()
  }
  
  return createMockSuccessResponse(updatedTransaction)
})

export const verifyConfirmationCode = vi.fn().mockImplementation(async (transactionId, code) => {
  if (!transactionId || !code) {
    return createMockErrorResponse('交易 ID 和確認碼是必需的', 400)
  }
  
  // 模擬確認碼驗證
  const isValid = code === 'ABC123' // 模擬正確的確認碼
  
  if (!isValid) {
    return createMockErrorResponse('確認碼錯誤', 400)
  }
  
  const completedTransaction = {
    ...mockTransactionStates.confirmed,
    id: transactionId,
    status: 'completed',
    updated_at: new Date().toISOString()
  }
  
  return createMockSuccessResponse(completedTransaction)
})

export const cancelTransaction = vi.fn().mockImplementation(async (transactionId, reason = '') => {
  if (!transactionId) {
    return createMockErrorResponse('交易 ID 是必需的', 400)
  }
  
  const cancelledTransaction = {
    ...mockTransactionStates.pending,
    id: transactionId,
    status: 'cancelled',
    notes: reason,
    updated_at: new Date().toISOString()
  }
  
  return createMockSuccessResponse(cancelledTransaction)
})

export const getTransactionStatistics = vi.fn().mockImplementation(async (userId) => {
  if (!userId) {
    return createMockErrorResponse('用戶 ID 是必需的', 400)
  }
  
  const statistics = {
    total_transactions: 25,
    completed_transactions: 20,
    cancelled_transactions: 3,
    pending_transactions: 2,
    total_amount: 125000,
    success_rate: 0.8,
    average_transaction_time: 1.5 // 小時
  }
  
  return createMockSuccessResponse(statistics)
})

// 預設匯出
export default {
  createTransaction,
  getTransaction,
  updateTransactionStatus,
  getUserTransactions,
  generateConfirmationCode,
  verifyConfirmationCode,
  cancelTransaction,
  getTransactionStatistics
}