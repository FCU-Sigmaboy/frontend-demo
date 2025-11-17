import { supabase } from '@/lib/supabase'

// ===================================================================
// ### 聊天室 API (Conversation APIs)
// 完全使用 RPC 函式，與後端 Migration 保持一致
//
// 版本: 1.2
// 更新日期: 2025-11-08
// 前端實作版本
// ===================================================================

/**
 * 【功能】發起聊天 (查找或建立聊天室) (RPC)
 * @param {number} itemId - 您要針對哪個物品發起聊天
 * @returns {Promise<Object>} - 回傳聊天室完整資訊
 */
export async function startChat(itemId) {
  // 1. 獲取當前登入者 (RPC 內部也會檢查，前端檢查可先擋掉未登入)
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('使用者未登入，無法發起聊天')
  }

  // 2. 驗證 itemId
  if (!itemId || itemId <= 0) {
    throw new Error('無效的物品 ID')
  }

  // 3. 準備 RPC 參數
  const rpcParams = {
    p_item_id: itemId
  }

  // 4. 呼叫 RPC 函式 (已優化支援 ON CONFLICT，併發安全)
  const { data, error } = await supabase.rpc(
    'create_or_get_conversation',
    rpcParams
  )

  // 5. 錯誤處理 (加強: 針對 42702 提供暫時性 fallback 與診斷資訊)
  if (error) {
    console.error(`Supabase 發起聊天失敗 (Item #${itemId}):`, error)

    // Ambiguous column 專用診斷與暫時性 fallback（僅在後端尚未部署修正時使用）
    if (error.code === '42702' || error.message.includes('column reference') && error.message.includes('ambiguous')) {
      console.warn('[診斷] create_or_get_conversation RPC 仍回報 column reference ambiguous，啟動前端暫時性 fallback。')
      try {
        // 1. 取得物品資訊 (只取 seller / owner)
        const { data: itemRows, error: itemErr } = await supabase
          .from('items')
          .select('id,user_id,listing_status')
          .eq('id', itemId)
          .limit(1)

        if (itemErr) {
          console.error('[fallback] 讀取 items 失敗:', itemErr)
          throw new Error('暫時性 fallback 失敗: 讀取物品資料錯誤')
        }
        const item = itemRows?.[0]
        if (!item || !item.listing_status) {
          throw new Error('物品不存在或已下架')
        }
        if (item.user_id === user.id) {
          throw new Error('無法與自己的物品發起聊天')
        }

        // 2. 嘗試尋找既有對話
        const { data: existingConvos, error: selectConvoErr } = await supabase
          .from('conversations')
          .select('id,item_id,buyer_id,seller_id,created_at,updated_at')
          .eq('item_id', itemId)
          .eq('buyer_id', user.id)
          .eq('seller_id', item.user_id)
          .limit(1)

        if (selectConvoErr) {
          console.error('[fallback] 查詢既有對話失敗:', selectConvoErr)
          throw new Error('暫時性 fallback 失敗: 查詢既有對話錯誤')
        }

        let conversation = existingConvos?.[0]

        // 3. 若不存在則建立對話
        if (!conversation) {
          const { data: insertRows, error: insertErr } = await supabase
            .from('conversations')
            .insert({ item_id: itemId, buyer_id: user.id, seller_id: item.user_id })
            .select('id,item_id,buyer_id,seller_id,created_at,updated_at')
            .limit(1)
          if (insertErr) {
            console.error('[fallback] 建立對話失敗:', insertErr)
            throw new Error('暫時性 fallback 失敗: 建立對話錯誤')
          }
          conversation = insertRows?.[0]
        }

        if (!conversation) {
          throw new Error('暫時性 fallback 失敗: 無法取得或建立對話')
        }

        console.info('[fallback] 已使用前端直接表操作建立/取得對話 (臨時方案)，請盡速部署修正後的 RPC。')
        // 與 RPC 一致的回傳形狀
        return {
          conversation_id: conversation.id,
          item_id: conversation.item_id,
          buyer_id: conversation.buyer_id,
          seller_id: conversation.seller_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        }
      } catch (fbErr) {
        console.error('[fallback] 發起聊天臨時方案最終失敗:', fbErr)
        throw fbErr
      }
    }

    // 友善錯誤訊息 (原有分支)
    if (error.message.includes('物品不存在或已下架')) {
      throw new Error('此物品不存在或已下架')
    } else if (error.message.includes('無法與自己的物品建立對話')) {
      throw new Error('無法與自己的物品發起聊天')
    } else if (error.message.includes('使用者未登入')) {
      throw new Error('請先登入')
    } else {
      throw new Error(`發起聊天失敗: ${error.message}`)
    }
  }

  // 6. 驗證回傳資料
  if (!data || data.length === 0) {
    throw new Error('無法建立聊天室，請稍後再試')
  }

  // 7. RPC 回傳的是陣列，取第一筆
  return data[0]
}

/**
 * 【功能】批次查詢對話資訊 (使用新的 RPC 函數，避免 N+1 問題)
 * @param {number[]} conversationIds - 對話 ID 陣列
 * @returns {Promise<Array>} - 回傳對話資訊陣列
 */
export async function getConversationsByIds(conversationIds) {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.warn('getConversationsByIds: User not logged in.')
    return null
  }

  // 2. 驗證參數
  if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
    return []
  }

  // 3. 準備 RPC 參數
  const rpcParams = {
    p_conversation_ids: conversationIds
  }

  // 4. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc(
    'get_conversations_by_ids',
    rpcParams
  )

  // 5. 錯誤處理
  if (error) {
    console.error('Supabase 批次獲取對話失敗:', error)
    throw new Error(error.message)
  }

  // 6. 資料轉換
  return data.map((convo) => ({
    id: convo.conversation_id,
    item: {
      id: convo.item_id,
      title: convo.item_title || '物品已刪除',
      cover_image_url: convo.item_image_url
    },
    buyer_id: convo.buyer_id,
    seller_id: convo.seller_id,
    created_at: convo.created_at,
    updated_at: convo.updated_at
  }))
}

/**
 * 【功能】獲取 "當前登入者" 的聊天室列表 (RPC)
 * @param {object} options - (可選) 分頁選項
 * @param {number} [options.page=1] - 頁碼
 * @param {number} [options.size=20] - 每頁筆數 (最大 100)
 * @param {string} [options.role='all'] - 角色過濾 (buyer, seller, all)
 * @param {boolean} [options.includeDeleted=false] - 是否包含已刪除的對話
 * @returns {Promise<Array | null>} - 回傳聊天室列表 (包含最新訊息、未讀數), 未登入回傳 null
 */
export async function getMyConversations(options = {}) {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.warn('getMyConversations: User not logged in.')
    return null
  }

  // 2. 準備 RPC 參數（同時支援 getMyConversations(role, opts) 與 getMyConversations(opts)）
  let page, size, role, includeDeleted
  if (typeof options === 'string') {
    // 兼容舊用法：getMyConversations('buyer', { page, size })
    role = options || 'all'
    page = arguments[1]?.page || 1
    size = arguments[1]?.size || 20
    includeDeleted = arguments[1]?.includeDeleted || false
  } else {
    page = options.page || 1
    size = options.size || 20
    role = options.role || 'all'
    includeDeleted = options.includeDeleted || false
  }

  const rpcParams = {
    p_page: page,
    p_size: size,
    p_role: role,
    p_include_deleted: includeDeleted
  }

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc(
    'get_user_conversations',
    rpcParams
  )

  // 4. 錯誤處理
  if (error) {
    console.error('Supabase 獲取聊天室列表失敗:', error)

    // 針對 42702 模糊欄位錯誤提供暫時性 fallback
    if (error.code === '42702' || (error.message || '').includes('ambiguous')) {
      console.warn('[診斷] get_user_conversations RPC 仍回報 ambiguous，啟動前端暫時性 fallback。')
      try {
        const from = (page - 1) * size
        const to = from + size - 1

        let query = supabase
          .from('conversations')
          .select('id,item_id,buyer_id,seller_id,created_at,updated_at,deleted_by_buyer_at,deleted_by_seller_at')
          .order('updated_at', { ascending: false })

        if (role === 'buyer') {
          query = query.eq('buyer_id', user.id)
          if (!includeDeleted) query = query.is('deleted_by_buyer_at', null)
        } else if (role === 'seller') {
          query = query.eq('seller_id', user.id)
          if (!includeDeleted) query = query.is('deleted_by_seller_at', null)
        } else {
          // all
          if (includeDeleted) {
            query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          } else {
            query = query.or(
              `and(buyer_id.eq.${user.id},deleted_by_buyer_at.is.null),and(seller_id.eq.${user.id},deleted_by_seller_at.is.null)`
            )
          }
        }

        query = query.range(from, to)

        const { data: convs, error: convErr } = await query
        if (convErr) {
          console.error('[fallback] 查詢 conversations 失敗:', convErr)
          throw convErr
        }

        const convIds = (convs || []).map(c => c.id)
        const itemIds = Array.from(new Set((convs || []).map(c => c.item_id).filter(Boolean)))
        const otherUserIds = Array.from(new Set((convs || []).map(c => (c.buyer_id === user.id ? c.seller_id : c.buyer_id)).filter(Boolean)))

        // 批次查詢 items 與 users
        const [{ data: items, error: itemsErr }, { data: users, error: usersErr }] = await Promise.all([
          itemIds.length > 0
            ? supabase.from('items').select('id,title,image_urls').in('id', itemIds)
            : Promise.resolve({ data: [], error: null }),
          otherUserIds.length > 0
            ? supabase.from('users').select('id,nickname,profile_picture_url').in('id', otherUserIds)
            : Promise.resolve({ data: [], error: null })
        ])

        if (itemsErr) {
          console.warn('[fallback] 讀取 items 失敗，將以預設文字顯示', itemsErr)
        }
        if (usersErr) {
          console.warn('[fallback] 讀取 users 失敗，將以預設文字顯示', usersErr)
        }

        const itemMap = new Map((items || []).map(i => [i.id, i]))
        const userMap = new Map((users || []).map(u => [u.id, u]))

        // 讀取訊息以取得最後一則與未讀數
        let lastByConv = new Map()
        let unreadByConv = new Map()
        if (convIds.length > 0) {
          const { data: msgs, error: msgsErr } = await supabase
            .from('conversation_messages')
            .select('conversation_id,content,sent_at,sender_id,is_read,deleted_at')
            .in('conversation_id', convIds)
          if (msgsErr) {
            console.warn('[fallback] 讀取訊息失敗，將省略最後訊息/未讀數', msgsErr)
          } else {
            for (const m of msgs) {
              // 忽略已刪除訊息
              if (m.deleted_at != null) continue
              const prev = lastByConv.get(m.conversation_id)
              if (!prev || (m.sent_at && prev.sent_at && new Date(m.sent_at) > new Date(prev.sent_at))) {
                lastByConv.set(m.conversation_id, m)
              }
              if (m.sender_id !== user.id && m.is_read === false) {
                unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) || 0) + 1)
              }
            }
          }
        }

        return (convs || []).map((c) => {
          const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id
          const iu = userMap.get(otherId)
          const it = itemMap.get(c.item_id)
          const last = lastByConv.get(c.id)
          return {
            id: c.id,
            item: {
              id: c.item_id,
              title: it?.title || '物品已刪除',
              cover_image_url: (it?.image_urls || [])[0] || null
            },
            other_user: {
              id: otherId,
              nickname: iu?.nickname || '未知使用者',
              profile_picture_url: iu?.profile_picture_url || null
            },
            last_message: last?.content || null,
            last_message_time: last?.sent_at || null,
            unread_count: unreadByConv.get(c.id) || 0,
            created_at: c.created_at,
            updated_at: c.updated_at,
            is_deleted: c.buyer_id === user.id ? !!c.deleted_by_buyer_at : !!c.deleted_by_seller_at,
            buyer_id: c.buyer_id,
            seller_id: c.seller_id,
            role: c.buyer_id === user.id ? 'buyer' : 'seller'
          }
        })
      } catch (fbErr) {
        console.error('[fallback] 獲取聊天室列表臨時方案失敗:', fbErr)
        throw new Error((fbErr && fbErr.message) || '獲取聊天室列表失敗')
      }
    }

    // 原本錯誤處理
    throw new Error(error.message)
  }

  // 5. 資料轉換，統一前端使用的格式
  return data.map((convo) => ({
    id: convo.conversation_id,
    item: {
      id: convo.item_id,
      title: convo.item_title || '物品已刪除',
      cover_image_url: convo.item_image_url
    },
    other_user: {
      id: convo.other_user_id,
      nickname: convo.other_user_nickname || '未知使用者',
      profile_picture_url: convo.other_user_profile_picture
    },
    last_message: convo.last_message,
    last_message_time: convo.last_message_time,
    unread_count: parseInt(convo.unread_count) || 0,
    created_at: convo.created_at,
    updated_at: convo.updated_at,
    is_deleted: convo.is_deleted,
    role: convo.buyer_id === user.id ? 'buyer' : 'seller'
  }))
}

/**
 * 【功能】獲取指定聊天室的所有訊息 (RPC)
 * @param {number} conversationId - 要讀取的聊天室 ID
 * @param {object} options - (可選) 分頁選項
 * @param {number} [options.page=1] - 頁碼
 * @param {number} [options.size=50] - 每頁筆數 (最大 100)
 * @returns {Promise<Array | null>} - 回傳訊息陣列 (包含發送者資訊), 未登入或無權限回傳 null
 */
export async function getConversationMessages(conversationId, options = {}) {
  // 1. 獲取當前登入者 (RLS 需要)
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.warn('getConversationMessages: User not logged in.')
    return null
  }

  // 2. 準備 RPC 參數
  const page = options.page || 1
  const size = options.size || 50

  const rpcParams = {
    p_conversation_id: conversationId,
    p_page: page,
    p_size: size
  }

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc(
    'get_conversation_messages',
    rpcParams
  )

  // 4. 錯誤處理
  if (error) {
    console.error(`Supabase 獲取訊息 #${conversationId} 失敗:`, error)
    // RLS 錯誤會在這裡被捕捉 (例如: 無權限查看此對話)
    throw new Error(error.message)
  }

  // 5. 資料轉換，統一前端使用的格式
  return data.map((msg) => ({
    id: msg.message_id,
    sender: {
      id: msg.sender_id,
      nickname: msg.sender_nickname || '未知使用者',
      profile_picture_url: msg.sender_profile_picture
    },
    content: msg.content,
    is_read: msg.is_read,
    sent_at: msg.sent_at,
    sender_id: msg.sender_id
  }))
}

/**
 * 【功能】發送訊息 (RPC)
 * @param {number} conversationId - 要發送訊息的聊天室 ID
 * @param {string} content - 訊息內容
 * @returns {Promise<Object>} - 回傳新建立的訊息
 */
export async function sendMessage(conversationId, content) {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('使用者未登入，無法發送訊息')
  }

  // 2. 驗證訊息內容
  if (!content || content.trim() === '') {
    throw new Error('訊息內容不能為空')
  }

  // 3. 準備 RPC 參數
  const rpcParams = {
    p_conversation_id: conversationId,
    p_content: content.trim()
  }

  // 4. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('send_message', rpcParams)

  // 5. 錯誤處理
  if (error) {
    console.error(
      `Supabase 發送訊息失敗 (Conversation #${conversationId}):`,
      error
    )
    throw new Error(error.message)
  }

  // 6. RPC 回傳的是陣列，取第一筆
  const message = data[0]
  return {
    id: message.message_id,
    sender_id: message.sender_id,
    content: message.content,
    is_read: message.is_read,
    sent_at: message.sent_at
  }
}

/**
 * 【功能】標記訊息為已讀 (RPC)
 * @param {number} conversationId - 要標記的聊天室 ID
 * @returns {Promise<number>} - 回傳更新的訊息數量
 */
export async function markMessagesAsRead(conversationId) {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('使用者未登入，無法標記訊息')
  }

  // 2. 準備 RPC 參數
  const rpcParams = {
    p_conversation_id: conversationId
  }

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc(
    'mark_messages_as_read',
    rpcParams
  )

  // 4. 錯誤處理
  if (error) {
    console.error(
      `Supabase 標記訊息已讀失敗 (Conversation #${conversationId}):`,
      error
    )
    throw new Error(error.message)
  }

  // 5. RPC 回傳的是陣列，取第一筆的 updated_count
  return parseInt(data[0]?.updated_count) || 0
}

/**
 * 【功能】獲取未讀訊息總數 (RPC)
 * @returns {Promise<number | null>} - 回傳未讀訊息總數, 未登入回傳 null
 */
export async function getUnreadMessageCount() {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.warn('getUnreadMessageCount: User not logged in.')
    return null
  }

  // 2. 呼叫 RPC 函式 (無需參數)
  const { data, error } = await supabase.rpc('get_unread_message_count')

  // 3. 錯誤處理
  if (error) {
    console.error('Supabase 獲取未讀訊息總數失敗:', error)
    throw new Error(error.message)
  }

  // 4. RPC 回傳的是陣列，取第一筆的 unread_count
  return parseInt(data[0]?.unread_count) || 0
}

// ===================================================================
// ### 軟刪除功能 (Soft Delete)
// ===================================================================

/**
 * 【功能】刪除對話（單方面）
 * @param {number} conversationId - 對話 ID
 * @returns {Promise<Object>} - 刪除結果
 */
export async function deleteConversation(conversationId) {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('使用者未登入，無法刪除對話')
  }

  // 2. 驗證 conversationId
  if (!conversationId || conversationId <= 0) {
    throw new Error('無效的對話 ID')
  }

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('delete_conversation', {
    p_conversation_id: conversationId
  })

  // 4. 錯誤處理
  if (error) {
    console.error(`刪除對話失敗 (ID: ${conversationId}):`, error)
    throw new Error(error.message)
  }

  return data
}

/**
 * 【功能】恢復已刪除的對話
 * @param {number} conversationId - 對話 ID
 * @returns {Promise<Object>} - 恢復結果
 */
export async function restoreConversation(conversationId) {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('使用者未登入，無法恢復對話')
  }

  // 2. 驗證 conversationId
  if (!conversationId || conversationId <= 0) {
    throw new Error('無效的對話 ID')
  }

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('restore_conversation', {
    p_conversation_id: conversationId
  })

  // 4. 錯誤處理
  if (error) {
    console.error(`恢復對話失敗 (ID: ${conversationId}):`, error)
    throw new Error(error.message)
  }

  return data
}

/**
 * 【功能】刪除訊息（僅發送者可刪除）
 * @param {number} messageId - 訊息 ID
 * @returns {Promise<Object>} - 刪除結果
 */
export async function deleteMessage(messageId) {
  // 1. 獲取當前登入者
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('使用者未登入，無法刪除訊息')
  }

  // 2. 驗證 messageId
  if (!messageId || messageId <= 0) {
    throw new Error('無效的訊息 ID')
  }

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('delete_message', {
    p_message_id: messageId
  })

  // 4. 錯誤處理
  if (error) {
    console.error(`刪除訊息失敗 (ID: ${messageId}):`, error)

    // 提供友善的錯誤訊息
    if (error.message.includes('只能刪除自己發送的訊息')) {
      throw new Error('您只能刪除自己發送的訊息')
    } else if (error.message.includes('訊息不存在或已被刪除')) {
      throw new Error('此訊息不存在或已被刪除')
    } else {
      throw new Error(error.message)
    }
  }

  return data
}

// ===================================================================
// ### Realtime 即時訊息訂閱
// ===================================================================

/**
 * 【功能】訂閱特定對話的新訊息 (Realtime)
 * @param {number} conversationId - 對話 ID
 * @param {Function} onNewMessage - 新訊息回調函數
 * @param {Function} onMessageUpdate - 訊息更新回調函數 (已讀狀態等)
 * @param {Function} onMessageDelete - 訊息刪除回調函數
 * @returns {object} - Channel 物件，可用於取消訂閱
 */
export function subscribeToMessages(
  conversationId,
  onNewMessage,
  onMessageUpdate = null,
  onMessageDelete = null
) {
  const channel = supabase.channel(`conversation-${conversationId}`)

  // 訂閱新訊息
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'conversation_messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      console.log('新訊息:', payload.new)
      if (onNewMessage) onNewMessage(payload.new)
    }
  )

  // 訂閱訊息更新 (已讀狀態)
  if (onMessageUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversation_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('訊息更新:', payload.new)
        onMessageUpdate(payload.new)
      }
    )
  }

  // 訂閱訊息刪除
  if (onMessageDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'conversation_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('訊息刪除:', payload.old)
        onMessageDelete(payload.old)
      }
    )
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`✅ 已訂閱對話 #${conversationId} 的即時訊息`)
    }
  })

  return channel
}

/**
 * 【功能】訂閱當前使用者的所有對話更新 (Realtime)
 * @param {string} userId - 當前使用者 ID
 * @param {Function} onConversationUpdate - 對話更新回調函數
 * @returns {object} - Channel 物件，可用於取消訂閱
 */
export function subscribeToConversations(userId, onConversationUpdate) {
  const channel = supabase.channel('user-conversations')

  // 訂閱買家對話
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `buyer_id=eq.${userId}`
    },
    (payload) => {
      console.log('買家對話更新:', payload)
      if (onConversationUpdate) onConversationUpdate(payload)
    }
  )

  // 訂閱賣家對話
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `seller_id=eq.${userId}`
    },
    (payload) => {
      console.log('賣家對話更新:', payload)
      if (onConversationUpdate) onConversationUpdate(payload)
    }
  )

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ 已訂閱使用者對話列表即時更新')
    }
  })

  return channel
}

/**
 * 【功能】取消訂閱
 * @param {object} channel - Supabase Channel 物件
 */
export function unsubscribe(channel) {
  if (channel) {
    supabase.removeChannel(channel)
    console.log('🔌 已取消訂閱')
  }
}
