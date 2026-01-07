import { supabase } from '@/lib/supabase'

// ===================================================================
// ### 交易 API (Transaction APIs) - 整合版
// ###
// ### 包含以下功能：
// ###   - 交易流程 (發起、確認、完成、取消)
// ###   - 交易查詢 (列表、詳情)
// ###   - 報價相關 (建立、回應)
// ###   - 交易評價 (已由 reviewAPI.js 獨立處理)
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-04): 整合 3 個 API 檔案
// ===================================================================

// ===========================================
// ## 交易流程 API (正式使用的 RPC 函式)
// ===========================================

/**
 * (API 1 - 賣家) 發起一個交易要約 (RPC)
 * @param {number} itemId - 您要出售的物品 ID
 * @param {string} receiverId - 您要出售給的買家 UUID
 * @returns {Promise<object>} - 回傳 { transaction_id, status, code }
 */
export async function initiateTransaction(itemId, receiverId) {
  const { data, error } = await supabase.rpc('initiate_transaction', {
    p_item_id: itemId,
    p_receiver_id: receiverId,
  })
  if (error) throw new Error(`發起交易失敗: ${error.message}`)
  return data
}

/**
 * (API 2 - 共用) 查詢 "我的" 交易列表 (依狀態和角色)
 * @param {'confirming' | 'pending'} status - 您要查詢的狀態
 * @param {'giver' | 'receiver'} role - 您在此交易中的角色
 * @returns {Promise<Array>} - 回傳交易明細列表
 */
export async function getMyTransactionsByStatus(status, role) {
  const { data, error } = await supabase.rpc('get_my_transactions_by_status', {
    p_status: status,
    p_role: role,
  })
  if (error) throw new Error(`查詢交易列表失敗: ${error.message}`)
  return data
}

/**
 * (API 3 - 賣家) 更新 Giver 備註
 * @param {number} transactionId - 交易 ID
 * @param {string} note - 備註內容
 * @returns {Promise<object>} - 回傳 { success: true, giver_note: '...' }
 */
export async function updateGiverNote(transactionId, note) {
  const { data, error } = await supabase.rpc('update_giver_note', {
    p_transaction_id: transactionId,
    p_note: note,
  })
  if (error) throw new Error(`更新備註失敗: ${error.message}`)
  return data
}

/**
 * (API 4 - 買家) 確認交易並更新 Receiver 備註
 * (這會將狀態從 'confirming' 推進到 'pending')
 * @param {number} transactionId - 交易 ID
 * @param {string} note - 備註內容
 * @returns {Promise<object>} - 回傳 { success: true, new_status: 'pending', ... }
 */
export async function buyerConfirmTransaction(transactionId, note) {
  const { data, error } = await supabase.rpc('buyer_confirm_transaction', {
    p_transaction_id: transactionId,
    p_note: note,
  })
  if (error) throw new Error(`買家確認失敗: ${error.message}`)
  return data
}

/**
 * (API 5 - 共用) 取消交易
 * (這會將狀態從 'confirming' 或 'pending' 推進到 'cancelled')
 * (並將物品重新上架)
 * @param {number} transactionId - 交易 ID
 * @returns {Promise<object>} - 回傳 { success: true, new_status: 'cancelled' }
 */
export async function cancelTransaction(transactionId) {
  const { data, error } = await supabase.rpc('cancel_transaction', {
    p_transaction_id: transactionId,
  })
  if (error) throw new Error(`取消交易失敗: ${error.message}`)
  return data
}

/**
 * (API 6 - 買家) 輸入代碼以完成交易 (RPC)
 * @param {number} transactionId - 交易 ID
 * @param {string} code - 賣家提供的 6 位數代碼
 * @returns {Promise<object>} - 回傳 { success: true, message: '交易完成', ... }
 */
export async function finalizeTransactionWithCode(transactionId, code) {
  // 1. 檢查使用者是否登入 (RPC 也會檢查)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  // 2. 準備 RPC 參數
  const rpcParams = {
    p_transaction_id: transactionId,
    p_confirmation_code: code,
  }

  // 3. 呼叫 RPC
  const { data, error } = await supabase.rpc('finalize_transaction_with_code', rpcParams)

  // 4. 錯誤處理 (會捕捉 RPC 的 RAISE EXCEPTION)
  if (error) {
    console.error(`Supabase 完成交易 #${transactionId} 失敗:`, error)
    throw new Error(error.message) // (例如 "確認碼錯誤")
  }
  return data
}

// ===========================================
// ## 交易流程 API (範例資料，待後端完成)
// ===========================================

/**
 * Create a new offer (buyer or seller)
 * @param {object} offerData - { conversation_id, amount, offered_by: 'buyer'|'seller' }
 * @returns {Promise<object>} - Created offer with example data
 */
export async function createOffer(offerData) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  // For now, return example data until backend is ready
  const exampleOffer = {
    id: `offer_${Date.now()}`,
    conversation_id: offerData.conversation_id,
    amount: offerData.amount,
    offered_by: offerData.offered_by,
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null,
  }

  console.log('createOffer called with:', offerData)
  console.log('Returning example offer:', exampleOffer)

  return exampleOffer
}

/**
 * Respond to an offer (accept, decline, counter)
 * @param {string} offerId - The offer ID
 * @param {string} action - 'accept', 'decline', or 'counter'
 * @param {number} counterAmount - Amount for counter offer (only if action is 'counter')
 * @returns {Promise<object>} - Updated offer
 */
export async function respondToOffer(offerId, action, counterAmount = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const exampleResponse = {
    id: offerId,
    status: action === 'counter' ? 'countered' : action + 'd',
    responded_at: new Date().toISOString(),
    counter_offer:
      action === 'counter'
        ? {
            id: `offer_${Date.now()}`,
            amount: counterAmount,
            offered_by: 'seller',
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        : null,
  }

  console.log('respondToOffer called with:', { offerId, action, counterAmount })
  console.log('Returning example response:', exampleResponse)

  return exampleResponse
}

/**
 * Create order request (buyer initiates)
 * @param {object} orderData - { conversation_id, item_id, agreed_price }
 * @returns {Promise<object>} - Created order request
 */
export async function createOrderRequest(orderData) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const exampleOrderRequest = {
    id: `order_${Date.now()}`,
    conversation_id: orderData.conversation_id,
    item_id: orderData.item_id,
    agreed_price: orderData.agreed_price,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  console.log('createOrderRequest called with:', orderData)
  console.log('Returning example order request:', exampleOrderRequest)

  return exampleOrderRequest
}

/**
 * Respond to order request (seller accepts/declines)
 * @param {string} orderId - The order request ID
 * @param {string} action - 'accept' or 'decline'
 * @returns {Promise<object>} - Updated order request
 */
export async function respondToOrderRequest(orderId, action) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const exampleResponse = {
    id: orderId,
    status: action === 'accept' ? 'accepted' : 'declined',
    responded_at: new Date().toISOString(),
  }

  console.log('respondToOrderRequest called with:', { orderId, action })
  console.log('Returning example response:', exampleResponse)

  return exampleResponse
}

/**
 * Get transaction confirmation details
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} - Transaction details with item and user balance
 */
export async function getTransactionConfirmation(conversationId) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  // Example data for testing
  const exampleData = {
    transaction: {
      id: `trans_${Date.now()}`,
      conversation_id: conversationId,
      item_id: 'item_123',
      agreed_price: 450,
      status: 'buyer_confirmed',
    },
    item: {
      id: 'item_123',
      title: 'IKEA 檯燈',
      cover_image_url: 'https://placehold.co/130x130/6fb8a5/ffffff?text=Lamp',
      location: '台北市北投區',
      price: 500,
    },
    user: {
      id: user.id,
      balance: 500,
    },
  }

  console.log('getTransactionConfirmation called with:', conversationId)
  console.log('Returning example data:', exampleData)

  return exampleData
}

/**
 * Confirm transaction (buyer confirms order)
 * @param {string} transactionId - The transaction ID
 * @param {object} deliveryData - { delivery_location, delivery_notes }
 * @returns {Promise<object>} - Updated transaction
 */
export async function confirmTransaction(transactionId, deliveryData) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const exampleResponse = {
    id: transactionId,
    status: 'buyer_confirmed',
    delivery_location: deliveryData.delivery_location,
    delivery_notes: deliveryData.delivery_notes,
    buyer_confirmed_at: new Date().toISOString(),
  }

  console.log('confirmTransaction called with:', { transactionId, deliveryData })
  console.log('Returning example response:', exampleResponse)

  return exampleResponse
}

/**
 * Complete transaction (seller final acceptance)
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<object>} - Completed transaction with new balances
 */
export async function completeTransaction(transactionId) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const exampleResponse = {
    success: true,
    message: '交易完成',
    transaction_id: transactionId,
    status: 'completed',
    completed_at: new Date().toISOString(),
    buyer_new_balance: 50,
    seller_new_balance: 1450,
  }

  console.log('completeTransaction called with:', transactionId)
  console.log('Returning example response:', exampleResponse)

  return exampleResponse
}

/**
 * Get user's transaction history
 * @param {object} filters - { role: 'buyer'|'seller'|'all', status, page, size }
 * @returns {Promise<Array>} - List of transactions
 */
export async function getMyTransactions(filters = {}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  // Example data
  const exampleTransactions = [
    {
      id: 'trans_1',
      type: 'purchase',
      status: 'completed',
      date: '2025-01-15T10:30:00',
      amount: 450,
      item: {
        id: 'item_1',
        title: 'IKEA 檯燈',
        image: 'https://placehold.co/80x80/6fb8a5/ffffff?text=Lamp',
      },
      otherParty: {
        id: 'user_2',
        name: 'Joseph',
      },
      review: null,
    },
    {
      id: 'trans_2',
      type: 'sale',
      status: 'completed',
      date: '2025-01-10T14:20:00',
      amount: 800,
      item: {
        id: 'item_2',
        title: '登山背包',
        image: 'https://placehold.co/80x80/5a9d8c/ffffff?text=Bag',
      },
      otherParty: {
        id: 'user_3',
        name: 'Amber',
      },
      review: {
        rating: 5,
        comment: '很棒的買家',
      },
    },
  ]

  console.log('getMyTransactions called with filters:', filters)
  console.log('Returning example transactions:', exampleTransactions)

  return exampleTransactions
}

/**
 * Get transaction details by ID
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<object>} - Transaction details
 */
export async function getTransactionById(transactionId) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const exampleTransaction = {
    id: transactionId,
    type: 'purchase',
    status: 'completed',
    date: '2025-01-15T10:30:00',
    amount: 450,
    delivery_method: '面交',
    delivery_location: '台北市北投區',
    delivery_notes: '捷運站出口見',
    item: {
      id: 'item_1',
      title: 'IKEA 檯燈',
      image: 'https://placehold.co/130x130/6fb8a5/ffffff?text=Lamp',
      price: 500,
    },
    buyer: {
      id: 'user_1',
      name: '您',
    },
    seller: {
      id: 'user_2',
      name: 'Joseph',
    },
    review: null,
  }

  console.log('getTransactionById called with:', transactionId)
  console.log('Returning example transaction:', exampleTransaction)

  return exampleTransaction
}

/**
 * Get review for a transaction
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<object|null>} - Review if exists
 * @deprecated 請使用 reviewAPI.js 的函式
 */
export async function getReviewByTransaction(transactionId) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  // Return null if no review exists
  console.log('getReviewByTransaction called with:', transactionId)
  console.log('Returning null (no review)')

  return null
}
