import { ref, computed, onBeforeUnmount } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  getMyConversations,
  getConversationMessages,
  sendMessage as sendMessageAPI,
  markMessagesAsRead,
  getUnreadMessageCount,
  subscribeToMessages,
  subscribeToConversations,
  unsubscribe,
  deleteConversation as deleteConversationAPI,
  restoreConversation as restoreConversationAPI,
  deleteMessage as deleteMessageAPI
} from '@/api/conversationsAPI'

/**
 * Vue Composable for Conversations with Realtime Support
 *
 * Features:
 * - Load and manage conversations list
 * - Load and manage messages for selected conversation
 * - Real-time message updates (new, update, delete)
 * - Real-time conversation updates
 * - Unread message tracking
 * - Soft delete support
 *
 * @returns {object} Conversation state and methods
 */
export function useConversations() {
  // ===================================================================
  // State
  // ===================================================================
  const conversations = ref([])
  const selectedConversation = ref(null)
  const messages = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const currentUser = ref(null)

  // Realtime channels
  const messageChannel = ref(null)
  const conversationChannel = ref(null)

  // ===================================================================
  // Computed
  // ===================================================================
  const selectedConversationId = computed(() => selectedConversation.value?.id || null)

  const hasUnreadMessages = computed(() => unreadCount.value > 0)

  /**
   * Get conversations filtered by role
   */
  const conversationsByRole = computed(() => (role) => {
    if (role === 'all') return conversations.value
    return conversations.value.filter(c => c.role === role)
  })

  /**
   * Get unread conversations count
   */
  const unreadConversationsCount = computed(() => {
    return conversations.value.filter(c => c.unread_count > 0).length
  })

  // ===================================================================
  // Initialization
  // ===================================================================

  /**
   * Initialize composable with current user
   */
  async function initialize() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('使用者未登入')
      }
      currentUser.value = user

      // Load initial data
      await loadConversations()
      await loadUnreadCount()

      // Start listening to conversation updates
      startConversationSubscription()

      return true
    } catch (err) {
      error.value = err.message
      console.error('初始化失敗:', err)
      return false
    }
  }

  // ===================================================================
  // Conversations Management
  // ===================================================================

  /**
   * Load conversations list
   */
  async function loadConversations(options = {}) {
    loading.value = true
    error.value = null

    try {
      const data = await getMyConversations(options)
      if (data) {
        conversations.value = data
      }
    } catch (err) {
      error.value = err.message
      console.error('載入對話失敗:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh conversations list
   */
  async function refreshConversations() {
    await loadConversations()
  }

  /**
   * Load unread message count
   */
  async function loadUnreadCount() {
    try {
      const count = await getUnreadMessageCount()
      if (count !== null) {
        unreadCount.value = count
      }
    } catch (err) {
      console.error('載入未讀訊息數失敗:', err)
    }
  }

  /**
   * Find conversation by ID
   */
  function findConversation(conversationId) {
    return conversations.value.find(c => c.id === conversationId)
  }

  /**
   * Update conversation in list
   */
  function updateConversationInList(conversationId, updates) {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index >= 0) {
      conversations.value[index] = {
        ...conversations.value[index],
        ...updates
      }
    }
  }

  // ===================================================================
  // Messages Management
  // ===================================================================

  /**
   * Select a conversation and load its messages
   */
  async function selectConversation(conversation) {
    // Clean up previous subscription
    if (messageChannel.value) {
      unsubscribe(messageChannel.value)
      messageChannel.value = null
    }

    selectedConversation.value = conversation
    messages.value = []

    try {
      // Load messages
      await loadMessages(conversation.id)

      // Mark as read
      await markAsRead(conversation.id)

      // Subscribe to real-time updates
      startMessageSubscription(conversation.id)
    } catch (err) {
      error.value = err.message
      console.error('選擇對話失敗:', err)
    }
  }

  /**
   * Deselect current conversation
   */
  function deselectConversation() {
    if (messageChannel.value) {
      unsubscribe(messageChannel.value)
      messageChannel.value = null
    }

    selectedConversation.value = null
    messages.value = []
  }

  /**
   * Load messages for a conversation
   */
  async function loadMessages(conversationId, options = {}) {
    try {
      const data = await getConversationMessages(conversationId, options)
      if (data) {
        messages.value = data
      }
    } catch (err) {
      error.value = err.message
      console.error('載入訊息失敗:', err)
    }
  }

  /**
   * Send a message
   */
  async function sendMessage(content) {
    if (!selectedConversationId.value) {
      throw new Error('未選擇對話')
    }

    try {
      const newMessage = await sendMessageAPI(selectedConversationId.value, content)

      // Message will be added via realtime subscription
      // But add it optimistically for better UX
      addMessageToList({
        ...newMessage,
        sender: {
          id: currentUser.value.id,
          nickname: currentUser.value.user_metadata?.nickname || '我',
          profile_picture_url: currentUser.value.user_metadata?.profile_picture_url
        }
      })

      // Update conversation's last message
      updateConversationInList(selectedConversationId.value, {
        last_message: content,
        last_message_time: newMessage.sent_at
      })

      return newMessage
    } catch (err) {
      error.value = err.message
      console.error('發送訊息失敗:', err)
      throw err
    }
  }

  /**
   * Mark messages as read
   */
  async function markAsRead(conversationId) {
    try {
      await markMessagesAsRead(conversationId)

      // Update local state
      updateConversationInList(conversationId, { unread_count: 0 })

      // Reload unread count
      await loadUnreadCount()
    } catch (err) {
      console.error('標記已讀失敗:', err)
    }
  }

  /**
   * Add message to list
   */
  function addMessageToList(message) {
    // Check if message already exists
    const exists = messages.value.some(m => m.id === message.id)
    if (!exists) {
      messages.value.push(message)
    }
  }

  /**
   * Update message in list
   */
  function updateMessageInList(messageId, updates) {
    const index = messages.value.findIndex(m => m.id === messageId)
    if (index >= 0) {
      messages.value[index] = {
        ...messages.value[index],
        ...updates
      }
    }
  }

  /**
   * Remove message from list
   */
  function removeMessageFromList(messageId) {
    messages.value = messages.value.filter(m => m.id !== messageId)
  }

  // ===================================================================
  // Soft Delete Functions
  // ===================================================================

  /**
   * Delete a conversation
   */
  async function deleteConversation(conversationId) {
    try {
      await deleteConversationAPI(conversationId)

      // Remove from local list
      conversations.value = conversations.value.filter(c => c.id !== conversationId)

      // If it was selected, deselect it
      if (selectedConversationId.value === conversationId) {
        deselectConversation()
      }

      return true
    } catch (err) {
      error.value = err.message
      console.error('刪除對話失敗:', err)
      throw err
    }
  }

  /**
   * Restore a deleted conversation
   */
  async function restoreConversation(conversationId) {
    try {
      await restoreConversationAPI(conversationId)

      // Reload conversations to include restored one
      await loadConversations()

      return true
    } catch (err) {
      error.value = err.message
      console.error('恢復對話失敗:', err)
      throw err
    }
  }

  /**
   * Delete a message
   */
  async function deleteMessage(messageId) {
    try {
      await deleteMessageAPI(messageId)

      // Message will be removed via realtime subscription
      // But remove it optimistically for better UX
      removeMessageFromList(messageId)

      return true
    } catch (err) {
      error.value = err.message
      console.error('刪除訊息失敗:', err)
      throw err
    }
  }

  // ===================================================================
  // Realtime Subscriptions
  // ===================================================================

  /**
   * Start listening to message updates for current conversation
   */
  function startMessageSubscription(conversationId) {
    if (!conversationId) return

    messageChannel.value = subscribeToMessages(
      conversationId,
      handleNewMessage,
      handleMessageUpdate,
      handleMessageDelete
    )
  }

  /**
   * Start listening to conversation list updates
   */
  function startConversationSubscription() {
    if (!currentUser.value) return

    conversationChannel.value = subscribeToConversations(
      currentUser.value.id,
      handleConversationUpdate
    )
  }

  /**
   * Handle new message from realtime
   */
  function handleNewMessage(newMessage) {
    // Only add if it's for the selected conversation
    if (newMessage.conversation_id !== selectedConversationId.value) {
      // Update unread count for other conversations
      loadUnreadCount()
      return
    }

    // Check if it's from current user (already added optimistically)
    if (newMessage.sender_id === currentUser.value?.id) {
      return
    }

    // Add message to list
    addMessageToList({
      id: newMessage.id,
      sender_id: newMessage.sender_id,
      content: newMessage.content,
      is_read: newMessage.is_read,
      sent_at: newMessage.sent_at,
      sender: {
        id: newMessage.sender_id,
        // Sender info will be loaded when refreshing
        nickname: '對方',
        profile_picture_url: null
      }
    })

    // Auto mark as read if conversation is selected
    markAsRead(selectedConversationId.value)
  }

  /**
   * Handle message update from realtime (e.g., read status)
   */
  function handleMessageUpdate(updatedMessage) {
    updateMessageInList(updatedMessage.id, {
      is_read: updatedMessage.is_read
    })
  }

  /**
   * Handle message delete from realtime
   */
  function handleMessageDelete(deletedMessage) {
    removeMessageFromList(deletedMessage.id)
  }

  /**
   * Handle conversation update from realtime
   */
  function handleConversationUpdate(payload) {
    console.log('Conversation update:', payload)

    // Reload conversations to get fresh data
    loadConversations()
    loadUnreadCount()
  }

  // ===================================================================
  // Cleanup
  // ===================================================================

  /**
   * Cleanup subscriptions on unmount
   */
  function cleanup() {
    if (messageChannel.value) {
      unsubscribe(messageChannel.value)
      messageChannel.value = null
    }

    if (conversationChannel.value) {
      unsubscribe(conversationChannel.value)
      conversationChannel.value = null
    }
  }

  // Auto cleanup on component unmount
  onBeforeUnmount(cleanup)

  // ===================================================================
  // Return public API
  // ===================================================================

  return {
    // State
    conversations,
    selectedConversation,
    messages,
    unreadCount,
    loading,
    error,
    currentUser,

    // Computed
    selectedConversationId,
    hasUnreadMessages,
    conversationsByRole,
    unreadConversationsCount,

    // Methods - Initialization
    initialize,

    // Methods - Conversations
    loadConversations,
    refreshConversations,
    loadUnreadCount,
    findConversation,
    selectConversation,
    deselectConversation,

    // Methods - Messages
    loadMessages,
    sendMessage,
    markAsRead,

    // Methods - Soft Delete
    deleteConversation,
    restoreConversation,
    deleteMessage,

    // Methods - Cleanup
    cleanup
  }
}
