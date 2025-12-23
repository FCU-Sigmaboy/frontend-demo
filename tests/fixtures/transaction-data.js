// 交易系統測試資料夾具
export const mockTransactionStates = {
  // 待處理交易
  pending: {
    id: 'txn-pending-001',
    buyer_id: 'buyer-001',
    seller_id: 'seller-001',
    item_id: 'item-001',
    status: 'pending',
    amount: 150,
    created_at: '2024-12-11T10:00:00.000Z',
    updated_at: '2024-12-11T10:00:00.000Z',
    confirmation_code: null,
    notes: '希望盡快交易'
  },

  // 已確認交易
  confirmed: {
    id: 'txn-confirmed-001',
    buyer_id: 'buyer-001',
    seller_id: 'seller-001',
    item_id: 'item-001',
    status: 'confirmed',
    amount: 150,
    created_at: '2024-12-11T10:00:00.000Z',
    updated_at: '2024-12-11T10:30:00.000Z',
    confirmation_code: 'ABC123',
    notes: '交易已確認'
  },

  // 已完成交易
  completed: {
    id: 'txn-completed-001',
    buyer_id: 'buyer-001',
    seller_id: 'seller-001',
    item_id: 'item-001',
    status: 'completed',
    amount: 150,
    created_at: '2024-12-11T10:00:00.000Z',
    updated_at: '2024-12-11T11:00:00.000Z',
    confirmation_code: 'ABC123',
    notes: '交易成功完成'
  },

  // 已取消交易
  cancelled: {
    id: 'txn-cancelled-001',
    buyer_id: 'buyer-001',
    seller_id: 'seller-001',
    item_id: 'item-001',
    status: 'cancelled',
    amount: 150,
    created_at: '2024-12-11T10:00:00.000Z',
    updated_at: '2024-12-11T10:15:00.000Z',
    confirmation_code: null,
    notes: '買家取消交易'
  }
}

// 商品資料夾具
export const mockItems = {
  // 可用商品
  availableItem: {
    id: 'item-available-001',
    title: '二手筆記型電腦',
    description: '狀況良好的筆記型電腦，適合學生使用',
    price: 15000,
    category: 'electronics',
    condition: 'good',
    location: '台北市',
    seller_id: 'seller-001',
    status: 'available',
    images: ['image1.jpg', 'image2.jpg'],
    created_at: '2024-12-10T00:00:00.000Z',
    updated_at: '2024-12-10T00:00:00.000Z'
  },

  // 已售出商品
  soldItem: {
    id: 'item-sold-001',
    title: '二手手機',
    description: '功能正常的智慧型手機',
    price: 8000,
    category: 'electronics',
    condition: 'fair',
    location: '新北市',
    seller_id: 'seller-002',
    status: 'sold',
    images: ['phone1.jpg'],
    created_at: '2024-12-09T00:00:00.000Z',
    updated_at: '2024-12-11T00:00:00.000Z'
  },

  // 暫停販售商品
  pausedItem: {
    id: 'item-paused-001',
    title: '古董收藏品',
    description: '珍貴的古董收藏品',
    price: 50000,
    category: 'collectibles',
    condition: 'excellent',
    location: '台中市',
    seller_id: 'seller-003',
    status: 'paused',
    images: ['antique1.jpg', 'antique2.jpg', 'antique3.jpg'],
    created_at: '2024-12-08T00:00:00.000Z',
    updated_at: '2024-12-11T00:00:00.000Z'
  }
}

// 評價資料夾具
export const mockReviews = {
  // 正面評價
  positiveReview: {
    id: 'review-positive-001',
    transaction_id: 'txn-completed-001',
    reviewer_id: 'buyer-001',
    reviewee_id: 'seller-001',
    rating: 5,
    comment: '賣家很友善，商品狀況如描述，推薦！',
    created_at: '2024-12-11T12:00:00.000Z'
  },

  // 中性評價
  neutralReview: {
    id: 'review-neutral-001',
    transaction_id: 'txn-completed-002',
    reviewer_id: 'buyer-002',
    reviewee_id: 'seller-002',
    rating: 3,
    comment: '商品還可以，但交易過程有些延遲',
    created_at: '2024-12-11T12:30:00.000Z'
  },

  // 負面評價
  negativeReview: {
    id: 'review-negative-001',
    transaction_id: 'txn-completed-003',
    reviewer_id: 'buyer-003',
    reviewee_id: 'seller-003',
    rating: 2,
    comment: '商品狀況與描述不符，有些失望',
    created_at: '2024-12-11T13:00:00.000Z'
  }
}

// 交易資料工廠函數
export function createMockTransaction(overrides = {}) {
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled']
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  
  return {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    buyer_id: `buyer-${Math.random().toString(36).substr(2, 9)}`,
    seller_id: `seller-${Math.random().toString(36).substr(2, 9)}`,
    item_id: `item-${Math.random().toString(36).substr(2, 9)}`,
    status,
    amount: Math.floor(Math.random() * 10000) + 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    confirmation_code: status === 'confirmed' || status === 'completed' ? 
      Math.random().toString(36).substr(2, 6).toUpperCase() : null,
    notes: `測試交易 - ${status}`,
    ...overrides
  }
}

// 商品資料工廠函數
export function createMockItem(overrides = {}) {
  const categories = ['electronics', 'clothing', 'books', 'furniture', 'collectibles']
  const conditions = ['excellent', 'good', 'fair', 'poor']
  const statuses = ['available', 'sold', 'paused']
  
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `測試商品 ${Math.random().toString(36).substr(2, 5)}`,
    description: '這是一個測試商品的描述',
    price: Math.floor(Math.random() * 50000) + 100,
    category: categories[Math.floor(Math.random() * categories.length)],
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    location: '台北市',
    seller_id: `seller-${Math.random().toString(36).substr(2, 9)}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    images: [`image${Math.floor(Math.random() * 5) + 1}.jpg`],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

// 評價資料工廠函數
export function createMockReview(overrides = {}) {
  const ratings = [1, 2, 3, 4, 5]
  const comments = [
    '很好的交易體驗',
    '商品狀況不錯',
    '賣家很友善',
    '交易過程順利',
    '推薦這個賣家'
  ]
  
  return {
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transaction_id: `txn-${Math.random().toString(36).substr(2, 9)}`,
    reviewer_id: `user-${Math.random().toString(36).substr(2, 9)}`,
    reviewee_id: `user-${Math.random().toString(36).substr(2, 9)}`,
    rating: ratings[Math.floor(Math.random() * ratings.length)],
    comment: comments[Math.floor(Math.random() * comments.length)],
    created_at: new Date().toISOString(),
    ...overrides
  }
}