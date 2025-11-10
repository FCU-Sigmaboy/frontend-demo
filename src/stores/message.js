import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageAPI,
  markAsRead,
  subscribeToAllMessages,
  subscribeToMessageUpdates
} from '@/api/conversationAPI_v2'

export const useMessageStore = defineStore('message', () => {
  // ===== 狀態 =====
  const conversations = ref([])
  const currentMessages = ref([])
  const selectedConversationId = ref(null)
  const isLoadingConversations = ref(false)
  const isLoadingMessages = ref(false)
  const error = ref(null)
  const globalMessageSubscription = ref(null)
  const messageUpdateSubscription = ref(null) // 訊息更新訂閱（已讀狀態）
  const itemReferenceCache = ref(new Map()) // 物品引用緩存 Map<itemId, itemTitle>
  const onlineUsers = ref(new Set()) // 線上使用者集合
  const isInMessagesPage = ref(false) // 是否在訊息頁面
  const isAtMessagesBottom = ref(true) // 是否在訊息底部（預設為 true）

  // ===== Getters =====

  // 總未讀訊息數
  const totalUnreadCount = computed(() => {
    return conversations.value.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
  })

  // 當前選中的對話
  const selectedConversation = computed(() => {
    if (!selectedConversationId.value) return null
    return conversations.value.find(c => c.id === selectedConversationId.value)
  })

  // 按角色分類的未讀數
  const unreadByRole = computed(() => {
    const counts = { buyer: 0, seller: 0 }
    conversations.value.forEach(conv => {
      if (conv.unread_count > 0) {
        counts[conv.role] = (counts[conv.role] || 0) + conv.unread_count
      }
    })
    return counts
  })

  // 最近更新的對話（用於通知）
  const recentConversations = computed(() => {
    return conversations.value
      .slice()
      .sort((a, b) => {
        const timeA = new Date(a.last_message_time || a.created_at)
        const timeB = new Date(b.last_message_time || b.created_at)
        return timeB - timeA
      })
      .slice(0, 5)
  })

  // ===== Actions =====

  // 載入所有對話
  async function loadConversations() {
    if (isLoadingConversations.value) {
      console.log('⏳ Conversations load already in progress, skipping...')
      return
    }

    isLoadingConversations.value = true
    error.value = null

    try {
      const data = await getConversations(1, 50, false)

      if (data) {
        // 獲取當前用戶資訊以判斷角色
        const { data: { user } } = await supabase.auth.getUser()

        conversations.value = data.map(conv => ({
          id: conv.conversation_id,
          item: {
            id: conv.initial_item_id,
            title: conv.initial_item_title || '未知商品',
            cover_image_url: conv.initial_item_image || null
          },
          other_user: {
            id: conv.other_user_id,
            nickname: conv.other_user_name || '未知使用者',
            profile_picture_url: conv.other_user_avatar || null
          },
          last_message: conv.last_message_content || '開始對話...',
          last_message_time: conv.last_message_at || conv.created_at,
          unread_count: conv.unread_count || 0,
          is_archived: conv.is_archived || false,
          created_at: conv.created_at,
          role: user ? (conv.other_user_id === user.id ? 'seller' : 'buyer') : 'buyer'
        }))

        console.log(`✅ Loaded ${conversations.value.length} conversations, total unread: ${totalUnreadCount.value}`)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
      error.value = '載入對話失敗'
      throw err
    } finally {
      isLoadingConversations.value = false
    }
  }

  // 載入指定對話的訊息
  async function loadMessages(conversationId) {
    if (isLoadingMessages.value) {
      console.log('⏳ Messages load already in progress, skipping...')
      return
    }

    isLoadingMessages.value = true

    try {
      let data = await getMessages(conversationId, 1, 50)

      if (data) {
        // 確保訊息是升序排列（舊到新）
        if (data.length > 1) {
          const firstTime = new Date(data[0].created_at).getTime()
          const lastTime = new Date(data[data.length - 1].created_at).getTime()
          if (firstTime > lastTime) {
            data = data.reverse()
          }
        }

        currentMessages.value = data.map(msg => {
          // 如果有物品引用信息，加入緩存
          if (msg.related_item_id && msg.related_item_title) {
            itemReferenceCache.value.set(msg.related_item_id, msg.related_item_title)
          }

          return {
            id: msg.message_id,
            content: msg.content,
            created_at: msg.created_at,
            is_mine: msg.is_mine,
            is_read: msg.is_read || false, // 對方是否已讀
            message_type: msg.message_type || 'text',
            related_item_id: msg.related_item_id,
            related_item_title: msg.related_item_title,
            sender: {
              id: msg.sender_id,
              name: msg.sender_name,
              avatar: msg.sender_avatar
            },
            metadata: msg.metadata,
            _clientId: msg.message_id // 使用真實 ID 作為 clientId
          }
        })

        selectedConversationId.value = conversationId

        // 標記為已讀
        await markAsRead(conversationId)

        // 更新本地對話的未讀數
        const conversation = conversations.value.find(c => c.id === conversationId)
        if (conversation) {
          conversation.unread_count = 0
        }

        console.log(`✅ Loaded ${currentMessages.value.length} messages for conversation ${conversationId}`)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
      throw err
    } finally {
      isLoadingMessages.value = false
    }
  }

  // 載入更多訊息（分頁）
  async function loadMoreMessages(conversationId, page = 2, pageSize = 50) {
    if (isLoadingMessages.value) {
      console.log('⏳ Messages load already in progress, skipping...')
      return []
    }

    isLoadingMessages.value = true

    try {
      let data = await getMessages(conversationId, page, pageSize)

      if (data && data.length > 0) {
        // 確保訊息是升序排列（舊到新）
        if (data.length > 1) {
          const firstTime = new Date(data[0].created_at).getTime()
          const lastTime = new Date(data[data.length - 1].created_at).getTime()
          if (firstTime > lastTime) {
            data = data.reverse()
          }
        }

        const olderMessages = data.map(msg => {
          // 如果有物品引用信息，加入緩存
          if (msg.related_item_id && msg.related_item_title) {
            itemReferenceCache.value.set(msg.related_item_id, msg.related_item_title)
          }

          return {
            id: msg.message_id,
            content: msg.content,
            created_at: msg.created_at,
            is_mine: msg.is_mine,
            is_read: msg.is_read || false, // 對方是否已讀
            message_type: msg.message_type || 'text',
            related_item_id: msg.related_item_id,
            related_item_title: msg.related_item_title,
            sender: {
              id: msg.sender_id,
              name: msg.sender_name,
              avatar: msg.sender_avatar
            },
            metadata: msg.metadata,
            _clientId: msg.message_id
          }
        })

        // 將舊訊息添加到當前訊息列表的開頭
        currentMessages.value = [...olderMessages, ...currentMessages.value]

        console.log(`✅ Loaded ${olderMessages.length} more messages (page ${page}) for conversation ${conversationId}`)
        return olderMessages
      }

      return []
    } catch (err) {
      console.error('Failed to load more messages:', err)
      return []
    } finally {
      isLoadingMessages.value = false
    }
  }

  // 發送訊息
  async function sendMessage(content, messageType = 'text', relatedItemId = null, relatedItemTitle = null) {
    if (!selectedConversationId.value) {
      throw new Error('No conversation selected')
    }

    // 如果有物品引用，加入緩存
    if (relatedItemId && relatedItemTitle) {
      itemReferenceCache.value.set(relatedItemId, relatedItemTitle)
      console.log(`[MessageStore] 已緩存物品: ${relatedItemId} -> ${relatedItemTitle}`)
    }

    try {
      const newMessage = await sendMessageAPI(
        selectedConversationId.value,
        content,
        messageType,
        relatedItemId
      )

      console.log('✅ Message sent:', newMessage)

      // 更新對話的最後訊息
      const conversation = conversations.value.find(c => c.id === selectedConversationId.value)
      if (conversation) {
        conversation.last_message = content
        conversation.last_message_time = newMessage.created_at
      }

      return newMessage
    } catch (err) {
      console.error('Failed to send message:', err)
      throw err
    }
  }

  // 處理訊息更新（已讀狀態變化）
  async function handleMessageUpdate(updatedMessage) {
    console.log('[Message] 收到訊息更新事件:', updatedMessage)

    const messageId = updatedMessage.message_id || updatedMessage.id
    const conversationId = updatedMessage.conversation_id

    // 後端使用去角色化設計: read_by_participant_1 / read_by_participant_2
    // 我們需要判斷當前用戶是發送者還是接收者，然後檢查對方是否已讀
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id
    const senderId = updatedMessage.sender_id

    // 判斷已讀狀態
    let isRead = false

    // 如果當前用戶是發送者，檢查接收者（對方）是否已讀
    if (currentUserId === senderId) {
      // 我是發送者，需要知道對方是否已讀
      // 兩個參與者都已讀，就表示對方已讀
      isRead = updatedMessage.read_by_participant_1 && updatedMessage.read_by_participant_2
      console.log(`[Message] 我是發送者，對方已讀: ${isRead}`)
      console.log(`[Message] read_by_participant_1: ${updatedMessage.read_by_participant_1}, read_by_participant_2: ${updatedMessage.read_by_participant_2}`)
    }

    console.log(`[Message] 訊息 ID: ${messageId}, 對話 ID: ${conversationId}, 已讀: ${isRead}`)
    console.log(`[Message] 目前對話 ID: ${selectedConversationId.value}`)

    // 無論是否為當前對話，都嘗試更新
    const message = currentMessages.value.find(m => m.id === messageId)
    if (message) {
      console.log(`[Message] 找到訊息，更新前 is_read: ${message.is_read}`)
      message.is_read = isRead
      console.log(`[Message] 已更新訊息 ${messageId} 的已讀狀態: ${isRead}`)
    } else {
      console.log(`[Message] 未找到訊息 ${messageId}，可能不在目前對話中`)
    }
  }

  // 處理即時收到的新訊息（全域監聽）
  async function handleRealtimeMessage(newMessage) {
    console.log('[Message] 收到新訊息:', newMessage)

    const messageId = newMessage.message_id || newMessage.id
    const createdAt = newMessage.created_at || newMessage.sent_at
    const senderId = newMessage.sender_id
    const content = newMessage.content
    const conversationId = newMessage.conversation_id

    // 獲取當前用戶ID（用於判斷是否為自己發送的訊息）
    const { data: { user } } = await supabase.auth.getUser()
    const isMine = senderId === user?.id

    // 處理物品引用：優先使用後端返回的標題，否則從緩存中讀取
    const relatedItemId = newMessage.related_item_id || null
    let relatedItemTitle = newMessage.related_item_title || null

    if (relatedItemId && !relatedItemTitle) {
      // 如果有 ID 但沒有標題，嘗試從緩存中獲取
      relatedItemTitle = itemReferenceCache.value.get(relatedItemId) || null
      if (relatedItemTitle) {
        console.log(`[Message] 從緩存獲取物品標題: ${relatedItemId} -> ${relatedItemTitle}`)
      }
    } else if (relatedItemId && relatedItemTitle) {
      // 如果有標題，更新緩存
      itemReferenceCache.value.set(relatedItemId, relatedItemTitle)
    }

    // 1. 更新對話列表
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      conversation.last_message = content
      conversation.last_message_time = createdAt

      // 如果不是自己發的，增加未讀數
      if (!isMine) {
        conversation.unread_count = (conversation.unread_count || 0) + 1
      }
    }

    // 2. 如果是當前對話，更新訊息列表
    if (selectedConversationId.value === conversationId) {
      // 檢查是否已存在（檢查真實 ID 或臨時 ID）
      const exists = currentMessages.value.some(m => m.id === messageId)

      // 如果是自己發送的訊息，還需要檢查是否有內容和時間相近的樂觀訊息
      let hasOptimisticVersion = false
      if (isMine) {
        const messageTime = new Date(createdAt).getTime()
        hasOptimisticVersion = currentMessages.value.some(m =>
          m.content === content &&
          Math.abs(new Date(m.created_at).getTime() - messageTime) < 2000 && // 2秒內
          m.id.toString().startsWith('temp-') // 是臨時訊息
        )
      }

      if (!exists && !hasOptimisticVersion) {
        console.log('[Message] 添加新的 realtime 訊息:', messageId)
        currentMessages.value.push({
          id: messageId,
          content: content,
          created_at: createdAt,
          is_mine: isMine, // 正確判斷是否為自己發送的訊息
          is_read: newMessage.is_read || false, // 對方是否已讀
          message_type: newMessage.message_type || 'text',
          related_item_id: relatedItemId,
          related_item_title: relatedItemTitle, // 使用處理後的標題
          sender: {
            id: senderId,
            name: newMessage.sender_name || '未知使用者',
            avatar: newMessage.sender_avatar || null
          },
          metadata: newMessage.metadata,
          _clientId: messageId // 使用真實 ID 作為 clientId
        })

        // 只有在訊息頁面、在底部且不是自己發的，才自動標記為已讀
        if (!isMine && isInMessagesPage.value && isAtMessagesBottom.value) {
          try {
            const updatedCount = await markAsRead(conversationId)
            console.log(`[Message] 已標記對話 ${conversationId} 為已讀，更新了 ${updatedCount} 則訊息`)

            // 手動更新當前對話中所有對方發送的訊息為已讀
            // 這樣可以立即反映在發送者的界面上，不需要等待 Realtime 事件
            currentMessages.value.forEach(msg => {
              if (!msg.is_mine && msg.id <= messageId) {
                msg.is_read = true
              }
            })

            if (conversation) {
              conversation.unread_count = 0
            }
          } catch (err) {
            console.error(`[Message] 標記已讀失敗:`, err)
          }
        }
      } else if (hasOptimisticVersion) {
        console.log('[Message] 跳過 realtime 訊息（已有樂觀版本）:', messageId)
      }
    }
  }

  // 啟動全域訊息監聽
  function startGlobalMessageListener() {
    if (globalMessageSubscription.value) {
      console.log('⚠️ Global message listener already active')
      return
    }

    // 訂閱新訊息
    globalMessageSubscription.value = subscribeToAllMessages(handleRealtimeMessage)
    console.log(' Global message listener started')

    // 訂閱訊息更新（已讀狀態）
    if (!messageUpdateSubscription.value) {
      messageUpdateSubscription.value = subscribeToMessageUpdates(handleMessageUpdate)
      console.log(' Message update listener started')
    }
  }

  // 停止全域訊息監聽
  function stopGlobalMessageListener() {
    if (globalMessageSubscription.value) {
      globalMessageSubscription.value.unsubscribe()
      globalMessageSubscription.value = null
      console.log(' Global message listener stopped')
    }

    if (messageUpdateSubscription.value) {
      messageUpdateSubscription.value.unsubscribe()
      messageUpdateSubscription.value = null
      console.log(' Message update listener stopped')
    }
  }

  // 清除當前選中的對話
  function clearSelectedConversation() {
    selectedConversationId.value = null
    currentMessages.value = []
  }

  // 設置是否在訊息頁面
  function setIsInMessagesPage(value) {
    isInMessagesPage.value = value
  }

  // 設置是否在訊息底部
  function setIsAtMessagesBottom(value) {
    isAtMessagesBottom.value = value
  }

  function updateOnlineUsers(presenceState) {
    const newOnlineUsers = new Set()

    Object.keys(presenceState).forEach(key => {
      const presences = presenceState[key]
      if (presences && Array.isArray(presences)) {
        presences.forEach(presence => {
          if (presence.user_id) {
            newOnlineUsers.add(presence.user_id)
          }
        })
      }
    })

    onlineUsers.value = newOnlineUsers
  }

  // 重置 store（用於登出）
  function reset() {
    conversations.value = []
    currentMessages.value = []
    selectedConversationId.value = null
    error.value = null
    onlineUsers.value = new Set()
    stopGlobalMessageListener()
    console.log(' Message store reset')
  }

  return {
    // 狀態
    conversations,
    currentMessages,
    selectedConversationId,
    isLoadingConversations,
    isLoadingMessages,
    error,
    onlineUsers,
    isAtMessagesBottom,
    // Getters
    totalUnreadCount,
    selectedConversation,
    unreadByRole,
    recentConversations,
    // Actions
    loadConversations,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    handleRealtimeMessage,
    updateOnlineUsers,
    startGlobalMessageListener,
    stopGlobalMessageListener,
    clearSelectedConversation,
    setIsInMessagesPage,
    setIsAtMessagesBottom,
    reset
  }
})
