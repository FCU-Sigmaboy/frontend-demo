// Points API 模擬
import { vi } from 'vitest'
import { mockPointsProfiles, mockTransactions } from '../../fixtures/points-data.js'
import { createMockSuccessResponse, createMockErrorResponse } from '../../fixtures/api-responses.js'

// 模擬 Points API 函數
export const getPointsProfile = vi.fn().mockImplementation(async (userId) => {
  if (!userId) {
    return createMockErrorResponse('用戶 ID 是必需的', 400)
  }
  
  // 模擬根據用戶 ID 返回不同的積分資料
  const profile = userId === 'test-user-id-001' 
    ? mockPointsProfiles.newUser 
    : mockPointsProfiles.activeUser
    
  return createMockSuccessResponse(profile)
})

export const updatePointsBalance = vi.fn().mockImplementation(async (userId, amount, description) => {
  if (!userId || amount === undefined) {
    return createMockErrorResponse('用戶 ID 和金額是必需的', 400)
  }
  
  const updatedProfile = {
    ...mockPointsProfiles.activeUser,
    current_balance: mockPointsProfiles.activeUser.current_balance + amount,
    updated_at: new Date().toISOString()
  }
  
  return createMockSuccessResponse(updatedProfile)
})

export const getPointsHistory = vi.fn().mockImplementation(async (userId, limit = 10, offset = 0) => {
  if (!userId) {
    return createMockErrorResponse('用戶 ID 是必需的', 400)
  }
  
  // 模擬分頁的交易歷史
  const allTransactions = [
    mockTransactions.earnTransaction,
    mockTransactions.spendTransaction,
    mockTransactions.bonusTransaction
  ]
  
  const paginatedTransactions = allTransactions.slice(offset, offset + limit)
  
  return createMockSuccessResponse(paginatedTransactions)
})

export const addPointsTransaction = vi.fn().mockImplementation(async (transactionData) => {
  if (!transactionData.user_id || !transactionData.amount) {
    return createMockErrorResponse('用戶 ID 和金額是必需的', 400)
  }
  
  const newTransaction = {
    id: `txn-${Date.now()}`,
    ...transactionData,
    created_at: new Date().toISOString()
  }
  
  return createMockSuccessResponse(newTransaction, 201)
})

export const getDailyStreak = vi.fn().mockImplementation(async (userId) => {
  if (!userId) {
    return createMockErrorResponse('用戶 ID 是必需的', 400)
  }
  
  const streakData = {
    user_id: userId,
    current_streak: 15,
    longest_streak: 30,
    last_signin_date: new Date().toISOString().split('T')[0]
  }
  
  return createMockSuccessResponse(streakData)
})

export const updateDailyStreak = vi.fn().mockImplementation(async (userId) => {
  if (!userId) {
    return createMockErrorResponse('用戶 ID 是必需的', 400)
  }
  
  const updatedStreak = {
    user_id: userId,
    current_streak: 16,
    longest_streak: 30,
    last_signin_date: new Date().toISOString().split('T')[0],
    bonus_points: 50
  }
  
  return createMockSuccessResponse(updatedStreak)
})

// 預設匯出
export default {
  getPointsProfile,
  updatePointsBalance,
  getPointsHistory,
  addPointsTransaction,
  getDailyStreak,
  updateDailyStreak
}