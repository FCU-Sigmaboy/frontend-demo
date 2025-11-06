import { supabase } from '@/lib/supabase'

/**
 * Get conversations for current logged-in user with enhanced data
 * @param {'buyer' | 'seller' | 'all'} role - Filter by role
 * @param {object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.size=20] - Items per page
 * @returns {Promise<Array | null>} - List of conversations or null if not logged in
 */
export async function getMyConversations(role = 'all', options = {}) {
  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.warn('getMyConversations: User not logged in.')
    return null
  }
  const myUserId = user.id

  // 2. Define select query with joins
  const selectQuery = `
    id,
    item_id,
    buyer_id,
    seller_id,
    updated_at,
    items ( id, title, image_urls, listing_status ),
    buyer:users!conversations_buyer_id_fkey ( id, nickname, profile_picture_url ),
    seller:users!conversations_seller_id_fkey ( id, nickname, profile_picture_url )
  `

  // 3. Handle pagination
  const page = options.page || 1
  const size = options.size || 20
  const offset = (page - 1) * size

  // 4. Build base query
  let query = supabase
    .from('conversations')
    .select(selectQuery)
    .order('updated_at', { ascending: false })
    .range(offset, offset + size - 1)

  // 5. Filter by role
  if (role === 'buyer') {
    query = query.eq('buyer_id', myUserId)
  } else if (role === 'seller') {
    query = query.eq('seller_id', myUserId)
  } else {
    // role === 'all' - get all conversations (RLS handles permissions)
    query = query.or(`buyer_id.eq.${myUserId},seller_id.eq.${myUserId}`)
  }

  // 6. Execute query
  const { data, error } = await query

  // 7. Error handling
  if (error) {
    console.error('Supabase getMyConversations failed:', error)
    throw new Error(error.message)
  }

  // 8. Get last messages and unread counts for all conversations
  const conversationIds = data.map(c => c.id)

  // Fetch last messages
  const lastMessagesPromises = conversationIds.map(async (convId) => {
    const { data: lastMsg } = await supabase
      .from('conversation_messages')
      .select('content, sent_at, sender_id')
      .eq('conversation_id', convId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return { convId, lastMsg }
  })

  // Fetch unread counts
  const unreadCountsPromises = conversationIds.map(async (convId) => {
    const { count } = await supabase
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .neq('sender_id', myUserId)
      .eq('is_read', false)

    return { convId, count: count || 0 }
  })

  const lastMessagesResults = await Promise.all(lastMessagesPromises)
  const unreadCountsResults = await Promise.all(unreadCountsPromises)

  // Create lookup maps
  const lastMessageMap = Object.fromEntries(
    lastMessagesResults.map(r => [r.convId, r.lastMsg])
  )
  const unreadCountMap = Object.fromEntries(
    unreadCountsResults.map(r => [r.convId, r.count])
  )

  // 9. Transform data for frontend
  return data.map(convo => {
    // Determine who is the other user
    const otherUser = convo.buyer_id === myUserId ? convo.seller : convo.buyer
    const lastMessage = lastMessageMap[convo.id]

    return {
      id: convo.id,
      item: {
        id: convo.item_id,
        title: convo.items?.title || '物品已刪除',
        cover_image_url: convo.items?.image_urls?.[0] || null,
        listing_status: convo.items?.listing_status || 'deleted'
      },
      other_user: {
        id: otherUser?.id || null,
        nickname: otherUser?.nickname || '未知使用者',
        profile_picture_url: otherUser?.profile_picture_url
      },
      last_updated_at: convo.updated_at,
      last_message_preview: lastMessage?.content || '',
      last_message_time: lastMessage?.sent_at || convo.updated_at,
      unread_count: unreadCountMap[convo.id] || 0,
      role: convo.buyer_id === myUserId ? 'buyer' : 'seller'
    }
  })
}

/**
 * Get messages for a specific conversation
 * @param {number} conversationId - Conversation ID
 * @param {object} options - Pagination options
 * @param {number} [options.limit=50] - Number of messages to load
 * @param {string} [options.before_message_id] - Load messages before this ID (for scrolling up)
 * @returns {Promise<Array | null>} - List of messages or null if not logged in
 */
export async function getConversationMessages(conversationId, options = {}) {
  // 1. Get current user (RLS requires this)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.warn('getConversationMessages: User not logged in.')
    return null
  }

  // 2. Define select query
  const selectQuery = `
    id,
    sender_id,
    content,
    is_read,
    sent_at
  `

  // 3. Handle pagination (load from newest to oldest)
  const limit = options.limit || 50

  // 4. Build query
  let query = supabase
    .from('conversation_messages')
    .select(selectQuery)
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .limit(limit)

  // 5. If loading earlier messages (scroll up)
  if (options.before_message_id) {
    // Get timestamp of before_message_id
    const { data: beforeMessage, error: beforeError } = await supabase
      .from('conversation_messages')
      .select('sent_at')
      .eq('id', options.before_message_id)
      .single()

    if (beforeError || !beforeMessage) {
      console.error("Cannot find 'before_message_id' timestamp")
    } else {
      query = query.lt('sent_at', beforeMessage.sent_at)
    }
  }

  // 6. Execute query
  const { data, error } = await query

  // 7. Error handling
  if (error) {
    console.error(`Supabase getConversationMessages #${conversationId} failed:`, error)
    throw new Error(error.message)
  }

  // 8. Reverse to show oldest to newest (for UI rendering)
  return data.reverse()
}

/**
 * Start chat (find or create conversation) - Using SDK V2 direct queries
 * @param {number} itemId - Item ID to chat about
 * @returns {Promise<{conversation_id: number}>} - Object with conversation_id
 */
export async function startChat(itemId) {
  // 1. Get current user (buyer)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('使用者未登入，無法發起聊天')
  }

  const buyerId = user.id

  // 2. Get seller from item
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('user_id')
    .eq('id', itemId)
    .single()

  if (itemError || !item) {
    console.error(`Failed to get item #${itemId}:`, itemError)
    throw new Error('找不到該物品')
  }

  const sellerId = item.user_id

  // 3. Check if user is trying to message themselves
  if (buyerId === sellerId) {
    throw new Error('無法向自己發送訊息')
  }

  // 4. Check if conversation already exists
  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('id')
    .eq('item_id', itemId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle()

  // If conversation exists, return it
  if (existingConvo) {
    console.log('Found existing conversation:', existingConvo.id)
    return { conversation_id: existingConvo.id }
  }

  // 5. Create new conversation
  const { data: newConvo, error: createError } = await supabase
    .from('conversations')
    .insert({
      item_id: itemId,
      buyer_id: buyerId,
      seller_id: sellerId
    })
    .select('id')
    .single()

  if (createError || !newConvo) {
    console.error(`Failed to create conversation for item #${itemId}:`, createError)
    throw new Error(createError?.message || '無法建立對話')
  }

  console.log('Created new conversation:', newConvo.id)
  return { conversation_id: newConvo.id }
}

/**
 * Send message to conversation
 * @param {number} conversationId - Conversation ID
 * @param {string} content - Message content
 * @returns {Promise<object>} - Created message object
 */
export async function sendMessage(conversationId, content) {
  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('使用者未登入，無法發送訊息')
  }

  // 2. Insert message
  const { data, error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim()
    })
    .select()
    .single()

  // 3. Error handling
  if (error) {
    console.error(`Supabase sendMessage failed (Conversation #${conversationId}):`, error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Mark messages as read in a conversation
 * @param {number} conversationId - Conversation ID
 * @returns {Promise<void>}
 */
export async function markMessagesAsRead(conversationId) {
  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.warn('markMessagesAsRead: User not logged in.')
    return
  }

  // 2. Update all messages in this conversation that the current user received
  const { error } = await supabase
    .from('conversation_messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id) // Only mark messages NOT sent by current user
    .eq('is_read', false) // Only unread messages

  // 3. Error handling
  if (error) {
    console.error(`Supabase markMessagesAsRead failed (Conversation #${conversationId}):`, error)
  }
}

/**
 * Subscribe to new messages in a conversation (real-time)
 * @param {number} conversationId - Conversation ID
 * @param {Function} onNewMessage - Callback when new message arrives
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToMessages(conversationId, onNewMessage) {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onNewMessage(payload.new)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

/**
 * Subscribe to conversation updates (real-time)
 * @param {Function} onConversationUpdate - Callback when conversation updates
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToConversations(onConversationUpdate) {
  const channel = supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      (payload) => {
        onConversationUpdate(payload)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

