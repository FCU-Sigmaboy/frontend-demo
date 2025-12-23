// 積分系統測試資料夾具
export const mockPointsProfiles = {
  // 新用戶積分資料
  newUser: {
    user_id: 'test-user-id-001',
    current_balance: 100,
    total_earned: 100,
    total_spent: 0,
    daily_streak: 1,
    last_signin_date: '2024-12-11',
    level: 1,
    created_at: '2024-12-11T00:00:00.000Z',
    updated_at: '2024-12-11T00:00:00.000Z'
  },

  // 活躍用戶積分資料
  activeUser: {
    user_id: 'active-user-id-001',
    current_balance: 2500,
    total_earned: 5000,
    total_spent: 2500,
    daily_streak: 15,
    last_signin_date: '2024-12-11',
    level: 5,
    created_at: '2024-11-01T00:00:00.000Z',
    updated_at: '2024-12-11T00:00:00.000Z'
  },

  // 高級用戶積分資料
  premiumUser: {
    user_id: 'premium-user-id-001',
    current_balance: 10000,
    total_earned: 25000,
    total_spent: 15000,
    daily_streak: 50,
    last_signin_date: '2024-12-11',
    level: 10,
    created_at: '2024-06-01T00:00:00.000Z',
    updated_at: '2024-12-11T00:00:00.000Z'
  }
}

// 交易記錄夾具
export const mockTransactions = {
  // 獲得積分交易
  earnTransaction: {
    id: 'txn-earn-001',
    user_id: 'test-user-id-001',
    type: 'earn',
    amount: 50,
    description: '完成每日任務',
    balance_after: 150,
    created_at: '2024-12-11T10:00:00.000Z',
    metadata: {
      task_id: 'daily-task-001',
      task_type: 'daily_signin'
    }
  },

  // 消費積分交易
  spendTransaction: {
    id: 'txn-spend-001',
    user_id: 'test-user-id-001',
    type: 'spend',
    amount: -25,
    description: '購買虛擬商品',
    balance_after: 125,
    created_at: '2024-12-11T11:00:00.000Z',
    metadata: {
      item_id: 'virtual-item-001',
      item_name: '特殊徽章'
    }
  },

  // 獎勵積分交易
  bonusTransaction: {
    id: 'txn-bonus-001',
    user_id: 'test-user-id-001',
    type: 'bonus',
    amount: 100,
    description: '連續登入獎勵',
    balance_after: 225,
    created_at: '2024-12-11T12:00:00.000Z',
    metadata: {
      streak_days: 7,
      bonus_type: 'weekly_streak'
    }
  }
}

// 徽章資料夾具
export const mockBadges = {
  // 新手徽章
  beginnerBadge: {
    id: 'badge-beginner-001',
    name: '新手上路',
    description: '完成第一次登入',
    icon_url: '/src/assets/badges/1badge.png',
    points_required: 0,
    level: 1,
    category: 'achievement',
    is_active: true
  },

  // 活躍徽章
  activeBadge: {
    id: 'badge-active-001',
    name: '活躍用戶',
    description: '連續登入7天',
    icon_url: '/src/assets/badges/2badge.png',
    points_required: 500,
    level: 2,
    category: 'streak',
    is_active: true
  },

  // 高級徽章
  premiumBadge: {
    id: 'badge-premium-001',
    name: '積分大師',
    description: '累積獲得10000積分',
    icon_url: '/src/assets/badges/3badge.png',
    points_required: 10000,
    level: 5,
    category: 'milestone',
    is_active: true
  }
}

// 用戶徽章關聯夾具
export const mockUserBadges = {
  beginnerUserBadge: {
    user_id: 'test-user-id-001',
    badge_id: 'badge-beginner-001',
    earned_at: '2024-12-11T00:00:00.000Z',
    is_displayed: true
  },

  activeUserBadge: {
    user_id: 'active-user-id-001',
    badge_id: 'badge-active-001',
    earned_at: '2024-12-05T00:00:00.000Z',
    is_displayed: true
  }
}

// 積分資料工廠函數
export function createMockPointsProfile(overrides = {}) {
  const baseBalance = Math.floor(Math.random() * 5000)
  const totalEarned = baseBalance + Math.floor(Math.random() * 10000)
  
  return {
    user_id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    current_balance: baseBalance,
    total_earned: totalEarned,
    total_spent: totalEarned - baseBalance,
    daily_streak: Math.floor(Math.random() * 30),
    last_signin_date: new Date().toISOString().split('T')[0],
    level: Math.floor(baseBalance / 500) + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

// 交易記錄工廠函數
export function createMockTransaction(overrides = {}) {
  const types = ['earn', 'spend', 'bonus']
  const type = types[Math.floor(Math.random() * types.length)]
  const amount = type === 'spend' ? -Math.floor(Math.random() * 100) : Math.floor(Math.random() * 200)
  
  return {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
    type,
    amount,
    description: `測試交易 - ${type}`,
    balance_after: Math.floor(Math.random() * 5000),
    created_at: new Date().toISOString(),
    metadata: {},
    ...overrides
  }
}