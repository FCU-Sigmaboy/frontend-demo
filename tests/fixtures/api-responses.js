// API 回應測試資料夾具
export const mockApiResponses = {
  // 成功回應
  success: {
    data: { message: '操作成功' },
    error: null,
    status: 200,
    statusText: 'OK'
  },

  // 創建成功回應
  created: {
    data: { id: 'new-id-001', message: '創建成功' },
    error: null,
    status: 201,
    statusText: 'Created'
  },

  // 無內容回應
  noContent: {
    data: null,
    error: null,
    status: 204,
    statusText: 'No Content'
  },

  // 未找到錯誤
  notFound: {
    data: null,
    error: {
      message: '找不到指定的資源',
      code: 'PGRST116',
      details: null,
      hint: null
    },
    status: 404,
    statusText: 'Not Found'
  },

  // 未授權錯誤
  unauthorized: {
    data: null,
    error: {
      message: '未授權的請求',
      code: 'PGRST301',
      details: null,
      hint: null
    },
    status: 401,
    statusText: 'Unauthorized'
  },

  // 禁止存取錯誤
  forbidden: {
    data: null,
    error: {
      message: '禁止存取此資源',
      code: 'PGRST302',
      details: null,
      hint: null
    },
    status: 403,
    statusText: 'Forbidden'
  },

  // 伺服器錯誤
  serverError: {
    data: null,
    error: {
      message: '內部伺服器錯誤',
      code: 'PGRST500',
      details: null,
      hint: null
    },
    status: 500,
    statusText: 'Internal Server Error'
  },

  // 網路錯誤
  networkError: {
    data: null,
    error: {
      message: '網路連線錯誤',
      code: 'NETWORK_ERROR',
      details: 'Failed to fetch',
      hint: null
    },
    status: 0,
    statusText: ''
  }
}

// 分頁回應夾具
export const mockPaginatedResponses = {
  // 第一頁
  firstPage: {
    data: [
      { id: 1, name: '項目 1' },
      { id: 2, name: '項目 2' },
      { id: 3, name: '項目 3' }
    ],
    error: null,
    status: 200,
    statusText: 'OK',
    count: 10
  },

  // 中間頁
  middlePage: {
    data: [
      { id: 4, name: '項目 4' },
      { id: 5, name: '項目 5' },
      { id: 6, name: '項目 6' }
    ],
    error: null,
    status: 200,
    statusText: 'OK',
    count: 10
  },

  // 最後一頁
  lastPage: {
    data: [
      { id: 10, name: '項目 10' }
    ],
    error: null,
    status: 200,
    statusText: 'OK',
    count: 10
  },

  // 空頁面
  emptyPage: {
    data: [],
    error: null,
    status: 200,
    statusText: 'OK',
    count: 0
  }
}

// 認證相關回應夾具
export const mockAuthResponses = {
  // 登入成功
  signInSuccess: {
    data: {
      user: {
        id: 'user-001',
        email: 'test@example.com',
        user_metadata: {
          nickname: 'Test User'
        }
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'bearer'
      }
    },
    error: null
  },

  // 登入失敗
  signInError: {
    data: {
      user: null,
      session: null
    },
    error: {
      message: '電子郵件或密碼錯誤',
      status: 400
    }
  },

  // 註冊成功
  signUpSuccess: {
    data: {
      user: {
        id: 'new-user-001',
        email: 'newuser@example.com',
        email_confirmed_at: null
      },
      session: null
    },
    error: null
  },

  // 註冊失敗
  signUpError: {
    data: {
      user: null,
      session: null
    },
    error: {
      message: '此電子郵件已被使用',
      status: 422
    }
  },

  // 登出成功
  signOutSuccess: {
    error: null
  },

  // 重設密碼成功
  resetPasswordSuccess: {
    data: {},
    error: null
  }
}

// API 回應工廠函數
export function createMockApiResponse(overrides = {}) {
  return {
    data: null,
    error: null,
    status: 200,
    statusText: 'OK',
    ...overrides
  }
}

// 錯誤回應工廠函數
export function createMockErrorResponse(message = '發生錯誤', status = 400) {
  return {
    data: null,
    error: {
      message,
      code: `ERROR_${status}`,
      details: null,
      hint: null
    },
    status,
    statusText: getStatusText(status)
  }
}

// 成功回應工廠函數
export function createMockSuccessResponse(data = {}, status = 200) {
  return {
    data,
    error: null,
    status,
    statusText: getStatusText(status)
  }
}

// 分頁回應工廠函數
export function createMockPaginatedResponse(items = [], totalCount = null, page = 1, pageSize = 10) {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = items.slice(startIndex, endIndex)
  
  return {
    data: paginatedItems,
    error: null,
    status: 200,
    statusText: 'OK',
    count: totalCount || items.length
  }
}

// 輔助函數：根據狀態碼取得狀態文字
function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error'
  }
  
  return statusTexts[status] || 'Unknown'
}