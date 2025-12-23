// 測試夾具統一匯出
// 用戶相關資料
export {
  mockUsers,
  mockAuthStates,
  createMockUser
} from './user-data.js'

// 積分相關資料
export {
  mockPointsProfiles,
  mockTransactions,
  mockBadges,
  mockUserBadges,
  createMockPointsProfile,
  createMockTransaction as createMockPointsTransaction
} from './points-data.js'

// 交易相關資料
export {
  mockTransactionStates,
  mockItems,
  mockReviews,
  createMockTransaction,
  createMockItem,
  createMockReview
} from './transaction-data.js'

// API 回應資料
export {
  mockApiResponses,
  mockPaginatedResponses,
  mockAuthResponses,
  createMockApiResponse,
  createMockErrorResponse,
  createMockSuccessResponse,
  createMockPaginatedResponse
} from './api-responses.js'

// 匯入所有資料以供組合使用
import { mockUsers, mockAuthStates } from './user-data.js'
import { mockPointsProfiles, mockTransactions, mockUserBadges } from './points-data.js'
import { mockTransactionStates, mockItems, mockReviews } from './transaction-data.js'

// 常用的測試資料組合
export const testFixtures = {
  // 完整的用戶資料包
  completeUserProfile: {
    user: mockUsers.testUser,
    auth: mockAuthStates.authenticated,
    points: mockPointsProfiles.activeUser,
    transactions: [
      mockTransactions.earnTransaction,
      mockTransactions.spendTransaction
    ],
    badges: [mockUserBadges.beginnerUserBadge]
  },

  // 新用戶資料包
  newUserProfile: {
    user: mockUsers.newUser,
    auth: mockAuthStates.authenticated,
    points: mockPointsProfiles.newUser,
    transactions: [],
    badges: []
  },

  // 交易測試資料包
  transactionTestData: {
    pendingTransaction: mockTransactionStates.pending,
    confirmedTransaction: mockTransactionStates.confirmed,
    completedTransaction: mockTransactionStates.completed,
    availableItem: mockItems.availableItem,
    positiveReview: mockReviews.positiveReview
  }
}

// 匯入工廠函數
import { createMockUser } from './user-data.js'
import { createMockPointsProfile } from './points-data.js'
import { createMockTransaction, createMockItem } from './transaction-data.js'

// 快速創建測試資料的工廠函數
export const createTestData = {
  /**
   * 創建完整的用戶測試資料
   * @param {Object} overrides - 覆寫選項
   * @returns {Object} 完整的用戶資料
   */
  fullUserProfile: (overrides = {}) => {
    const user = createMockUser(overrides.user)
    const points = createMockPointsProfile({ user_id: user.id, ...overrides.points })
    
    return {
      user,
      points,
      auth: {
        user,
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }
      },
      ...overrides
    }
  },

  /**
   * 創建交易測試場景
   * @param {Object} overrides - 覆寫選項
   * @returns {Object} 交易場景資料
   */
  transactionScenario: (overrides = {}) => {
    const buyer = createMockUser({ ...overrides.buyer })
    const seller = createMockUser({ ...overrides.seller })
    const item = createMockItem({ seller_id: seller.id, ...overrides.item })
    const transaction = createMockTransaction({
      buyer_id: buyer.id,
      seller_id: seller.id,
      item_id: item.id,
      ...overrides.transaction
    })

    return {
      buyer,
      seller,
      item,
      transaction,
      ...overrides
    }
  }
}