import { supabase } from '@/lib/supabase'

// ===================================================================
// ### 評價 API (Review APIs) - 整合版
// ###
// ### 包含以下功能：
// ###   - 建立評價
// ###   - 檢查評價權限
// ###   - 我的評價列表
// ###   - 他人評價列表
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-04): 整合 3 個 API 檔案
// ===================================================================

// ===========================================
// ## 建立評價
// ===========================================

/**
 * 建立評價
 *
 * @param {Object} reviewData - 評價資料
 * @param {number} reviewData.transaction_id - 交易 ID（必填）
 * @param {number} reviewData.score - 評分 1-5（必填）
 * @param {string} [reviewData.comment] - 評論內容（選填）
 * @returns {Promise<Object>} - 回傳建立的評價資訊
 * @throws {Error} - 當評價建立失敗時拋出錯誤
 *
 * @example
 * // 建立評價
 * const result = await createReview({
 *   transaction_id: 1,
 *   score: 5,
 *   comment: '非常好的賣家！商品狀況完美，溝通順暢！'
 * });
 *
 * @example
 * // 只給評分，不留評論
 * const result = await createReview({
 *   transaction_id: 2,
 *   score: 4
 * });
 */
export async function createReview(reviewData) {
  // 1. 驗證必填欄位
  if (!reviewData.transaction_id) {
    throw new Error('缺少必填欄位：transaction_id')
  }

  if (reviewData.score === null || reviewData.score === undefined) {
    throw new Error('缺少必填欄位：score')
  }

  // 2. 驗證評分範圍
  if (reviewData.score < 1 || reviewData.score > 5) {
    throw new Error('評分必須在 1-5 之間')
  }

  // 3. 準備 RPC 參數
  const rpcParams = {
    p_transaction_id: reviewData.transaction_id,
    p_score: reviewData.score,
    p_comment: reviewData.comment || null,
  }

  // 4. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('create_review', rpcParams)

  // 5. 錯誤處理
  if (error) {
    console.error('建立評價失敗:', error)
    throw new Error(error.message)
  }

  // 6. 回傳資料
  if (!data || data.length === 0) {
    throw new Error('評價建立失敗：未回傳資料')
  }

  return data[0] // 回傳第一筆（唯一）評價記錄
}

/**
 * 檢查是否可以評價某筆交易
 *
 * @param {number} transactionId - 交易 ID
 * @returns {Promise<Object>} - 回傳檢查結果
 * @returns {boolean} canReview - 是否可以評價
 * @returns {string} reason - 無法評價的原因（如果有）
 *
 * @example
 * const check = await canCreateReview(1);
 * if (check.canReview) {
 *   // 顯示評價表單
 * } else {
 *   console.log(check.reason);
 * }
 */
export async function canCreateReview(transactionId) {
  try {
    // 獲取當前使用者
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        canReview: false,
        reason: '使用者未登入',
      }
    }

    // 查詢交易資訊
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('id, giver_id, receiver_id, transaction_status')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return {
        canReview: false,
        reason: '交易不存在',
      }
    }

    // 檢查交易狀態
    if (transaction.transaction_status !== 'completed') {
      return {
        canReview: false,
        reason: '只有已完成的交易才能建立評價',
      }
    }

    // 檢查是否為交易參與者
    const isParticipant = user.id === transaction.giver_id || user.id === transaction.receiver_id
    if (!isParticipant) {
      return {
        canReview: false,
        reason: '您不是此交易的參與者',
      }
    }

    // 檢查是否已經評價過
    const { data: existingReview, error: reviewError } = await supabase
      .from('ratings')
      .select('id')
      .eq('transaction_id', transactionId)
      .eq('reviewer_id', user.id)
      .maybeSingle()

    if (reviewError) {
      console.error('檢查評價失敗:', reviewError)
      return {
        canReview: false,
        reason: '檢查評價狀態失敗',
      }
    }

    if (existingReview) {
      return {
        canReview: false,
        reason: '您已經對此交易建立過評價',
      }
    }

    // 所有檢查通過
    return {
      canReview: true,
      reason: null,
    }
  } catch (error) {
    console.error('檢查評價權限失敗:', error)
    return {
      canReview: false,
      reason: '系統錯誤',
    }
  }
}

// ===========================================
// ## 取得評價列表
// ===========================================

/**
 * 【功能】獲取我收到的評價列表 (RPC)
 * @param {Object} params - 查詢參數
 * @param {number} [params.page=1] - 頁碼，預設為 1
 * @param {number} [params.pageSize=20] - 每頁數量，預設為 20
 * @param {string} [params.sortBy='created_at'] - 排序欄位 ('created_at', 'score')
 * @param {string} [params.sortDirection='desc'] - 排序方向 ('asc', 'desc')
 * @returns {Promise<Array>} - 回傳評價列表
 *
 * @example
 * const reviews = await getMyReviews({ page: 1, pageSize: 10 });
 */
export async function getMyReviews(params = {}) {
  // 1. 設定預設參數
  const { page = 1, pageSize = 20, sortBy = 'created_at', sortDirection = 'desc' } = params

  // 2. 準備 RPC 參數
  const rpcParams = {
    p_page: page,
    p_page_size: pageSize,
    p_sort_by: sortBy,
    p_sort_direction: sortDirection,
  }

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('get_my_reviews', rpcParams)

  // 4. 錯誤處理
  if (error) {
    console.error('獲取評價列表失敗:', error)
    throw new Error(error.message)
  }

  // 5. 回傳資料
  return data || []
}

/**
 * 【功能】獲取指定用戶收到的評價列表 (RPC)
 * @param {Object} params - 查詢參數
 * @param {string} params.userId - 目標用戶 ID（必填）
 * @param {number} [params.page=1] - 頁碼，預設為 1
 * @param {number} [params.pageSize=20] - 每頁數量，預設為 20
 * @param {string} [params.sortBy='created_at'] - 排序欄位 ('created_at', 'score')
 * @param {string} [params.sortDirection='desc'] - 排序方向 ('asc', 'desc')
 * @returns {Promise<Array>} - 回傳評價列表
 *
 * @example
 * const reviews = await getOthersReviews({ userId: 'uuid-xxx', page: 1 });
 */
export async function getOthersReviews(params = {}) {
  // 1. 參數驗證
  const { userId, page = 1, pageSize = 20, sortBy = 'created_at', sortDirection = 'desc' } = params

  // 2. 檢查必填參數
  if (!userId) {
    throw new Error('必須提供目標用戶 ID (userId)')
  }

  // 3. 準備 RPC 參數
  const rpcParams = {
    p_user_id: userId,
    p_page: page,
    p_page_size: pageSize,
    p_sort_by: sortBy,
    p_sort_direction: sortDirection,
  }

  // 4. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('get_others_reviews', rpcParams)

  // 5. 錯誤處理
  if (error) {
    console.error('獲取用戶評價列表失敗:', error)
    throw new Error(error.message)
  }

  // 6. 回傳資料
  return data || []
}

/* 回傳 data 範例 (getMyReviews & getOthersReviews)
[
  {
    "review_id": 1,
    "reviewer_id": "cdf0fa87-4c7f-4a89-8ae6-7d2b8caaa788",
    "reviewer_nickname": "Yo",
    "reviewer_avatar": "https://example.com/avatar.jpg",
    "score": 5,
    "comment": "很棒的交易體驗！",
    "created_at": "2024-10-15T10:20:00Z",
    "transaction_id": 1,
    "item_id": 5,
    "item_title": "咖啡機",
    "item_image": "https://example.com/item.jpg"
  }
]
*/
