// 測試用戶資料夾具
export const mockUsers = {
  // 標準測試用戶
  testUser: {
    id: 'test-user-id-001',
    email: 'test@example.com',
    nickname: 'Test User',
    profile_picture_url: 'https://example.com/avatar.jpg',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  // 管理員用戶
  adminUser: {
    id: 'admin-user-id-001',
    email: 'admin@example.com',
    nickname: 'Admin User',
    profile_picture_url: 'https://example.com/admin-avatar.jpg',
    role: 'admin',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  // 新用戶（無頭像）
  newUser: {
    id: 'new-user-id-001',
    email: 'newuser@example.com',
    nickname: 'New User',
    profile_picture_url: null,
    created_at: '2024-12-01T00:00:00.000Z',
    updated_at: '2024-12-01T00:00:00.000Z'
  }
}

// 認證狀態夾具
export const mockAuthStates = {
  // 已登入狀態
  authenticated: {
    user: mockUsers.testUser,
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000, // 1小時後過期
      token_type: 'bearer'
    }
  },

  // 未登入狀態
  unauthenticated: {
    user: null,
    session: null
  },

  // 過期狀態
  expired: {
    user: mockUsers.testUser,
    session: {
      access_token: 'expired-access-token',
      refresh_token: 'expired-refresh-token',
      expires_at: Date.now() - 3600000, // 1小時前過期
      token_type: 'bearer'
    }
  }
}

// 用戶資料工廠函數
export function createMockUser(overrides = {}) {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `user${Math.random().toString(36).substr(2, 5)}@example.com`,
    nickname: `User ${Math.random().toString(36).substr(2, 5)}`,
    profile_picture_url: Math.random() > 0.5 ? 'https://example.com/avatar.jpg' : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}