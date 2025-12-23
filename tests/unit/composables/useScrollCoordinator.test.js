import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useScrollCoordinator } from '@/composables/useScrollCoordinator.js'

// 模擬事件總線
vi.mock('@/events/messageScrollBus', () => ({
  ScrollEvents: {
    Metrics: 'scroll:metrics',
    MessagesAppended: 'scroll:messages-appended',
    ConversationChanged: 'scroll:conversation-changed',
    Reset: 'scroll:reset'
  },
  onScrollEvent: vi.fn(),
  offScrollEvent: vi.fn(),
  emitScrollEvent: vi.fn()
}))

import { ScrollEvents, onScrollEvent, offScrollEvent, emitScrollEvent } from '@/events/messageScrollBus'

describe('useScrollCoordinator', () => {
  let mockDependencies
  let eventHandlers

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 捕獲事件處理器
    eventHandlers = new Map()
    onScrollEvent.mockImplementation((event, handler) => {
      eventHandlers.set(event, handler)
    })

    // 模擬依賴
    mockDependencies = {
      messagesArea: ref(null),
      messageStore: {
        isAtMessagesBottom: false,
        setIsAtMessagesBottom: vi.fn(),
        currentMessages: []
      },
      selectedConversation: ref({ id: 'conv-123' }),
      showScrollToBottomBtn: ref(false),
      newMessageCount: ref(0),
      isLoadingMoreMessages: ref(false),
      hasMoreMessages: ref(true),
      firstUnreadMessageId: ref(null),
      hasReachedBottomAfterUnread: ref(false),
      clearUnreadDivider: vi.fn(),
      allowUnreadDivider: vi.fn(),
      loadMoreMessages: vi.fn(),
      scrollToBottom: vi.fn(),
      unreadDividerClearThreshold: 200
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should register event handlers on initialization', () => {
      // Act
      useScrollCoordinator(mockDependencies)

      // Assert
      expect(onScrollEvent).toHaveBeenCalledTimes(4)
      expect(onScrollEvent).toHaveBeenCalledWith(ScrollEvents.Metrics, expect.any(Function))
      expect(onScrollEvent).toHaveBeenCalledWith(ScrollEvents.MessagesAppended, expect.any(Function))
      expect(onScrollEvent).toHaveBeenCalledWith(ScrollEvents.ConversationChanged, expect.any(Function))
      expect(onScrollEvent).toHaveBeenCalledWith(ScrollEvents.Reset, expect.any(Function))
    })

    it('should return emit functions', () => {
      // Act
      const coordinator = useScrollCoordinator(mockDependencies)

      // Assert
      expect(typeof coordinator.emitScrollMetrics).toBe('function')
      expect(typeof coordinator.emitMessagesAppended).toBe('function')
      expect(typeof coordinator.emitConversationChanged).toBe('function')
      expect(typeof coordinator.emitReset).toBe('function')
    })
  })

  describe('handleMetrics', () => {
    let handleMetrics

    beforeEach(() => {
      useScrollCoordinator(mockDependencies)
      handleMetrics = eventHandlers.get(ScrollEvents.Metrics)
    })

    it('should handle metrics when messagesArea is not available', async () => {
      // Arrange
      mockDependencies.messagesArea.value = null

      // Act & Assert - should not throw
      await expect(handleMetrics()).resolves.toBeUndefined()
    })

    it('should update scroll button visibility based on distance from bottom', async () => {
      // Arrange
      const mockArea = {
        scrollTop: 100,
        scrollHeight: 1000,
        clientHeight: 300
      }
      mockDependencies.messagesArea.value = mockArea

      // Act
      await handleMetrics()

      // Assert - distance from bottom = 1000 - 100 - 300 = 600 > 200
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(true)
    })

    it('should hide scroll button when near bottom', async () => {
      // Arrange
      const mockArea = {
        scrollTop: 850,
        scrollHeight: 1000,
        clientHeight: 300
      }
      mockDependencies.messagesArea.value = mockArea

      // Act
      await handleMetrics()

      // Assert - distance from bottom = 1000 - 850 - 300 = -150 < 200
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(false)
    })

    it('should set isAtMessagesBottom when at bottom', async () => {
      // Arrange
      const mockArea = {
        scrollTop: 950,
        scrollHeight: 1000,
        clientHeight: 100
      }
      mockDependencies.messagesArea.value = mockArea

      // Act
      await handleMetrics()

      // Assert - distance from bottom = 1000 - 950 - 100 = -50 < 100
      expect(mockDependencies.messageStore.setIsAtMessagesBottom).toHaveBeenCalledWith(true)
    })

    it('should clear unread divider when scrolling up from bottom', async () => {
      // Arrange
      mockDependencies.firstUnreadMessageId.value = 'msg-123'
      mockDependencies.hasReachedBottomAfterUnread.value = true
      
      const mockArea = {
        scrollTop: 100,
        scrollHeight: 1000,
        clientHeight: 300
      }
      mockDependencies.messagesArea.value = mockArea

      // Act
      await handleMetrics()

      // Assert - distance from bottom = 600 > 200 (threshold)
      expect(mockDependencies.clearUnreadDivider).toHaveBeenCalledWith({ suppress: true })
    })

    it('should trigger load more messages when near top', async () => {
      // Arrange
      const mockArea = {
        scrollTop: 50, // Near top
        scrollHeight: 1000,
        clientHeight: 300
      }
      mockDependencies.messagesArea.value = mockArea
      mockDependencies.isLoadingMoreMessages.value = false
      mockDependencies.hasMoreMessages.value = true

      // Act
      await handleMetrics()

      // Assert
      expect(mockDependencies.loadMoreMessages).toHaveBeenCalled()
    })

    it('should not trigger load more when already loading', async () => {
      // Arrange
      const mockArea = {
        scrollTop: 50,
        scrollHeight: 1000,
        clientHeight: 300
      }
      mockDependencies.messagesArea.value = mockArea
      mockDependencies.isLoadingMoreMessages.value = true

      // Act
      await handleMetrics()

      // Assert
      expect(mockDependencies.loadMoreMessages).not.toHaveBeenCalled()
    })

    it('should handle payload parameters correctly', async () => {
      // Arrange
      mockDependencies.messagesArea.value = {
        scrollTop: 200,
        scrollHeight: 800,
        clientHeight: 200
      }

      const payload = {
        scrollTop: 100,
        scrollHeight: 1000,
        clientHeight: 300
      }

      // Act
      await handleMetrics(payload)

      // Assert - should use payload values, not element values
      // distance from bottom = 1000 - 100 - 300 = 600 > 200
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(true)
    })
  })

  describe('handleMessagesAppended', () => {
    let handleMessagesAppended

    beforeEach(() => {
      useScrollCoordinator(mockDependencies)
      handleMessagesAppended = eventHandlers.get(ScrollEvents.MessagesAppended)
    })

    it('should handle empty or invalid appendedMessages', () => {
      // Act & Assert - should not throw
      expect(() => handleMessagesAppended({})).not.toThrow()
      expect(() => handleMessagesAppended({ appendedMessages: [] })).not.toThrow()
      expect(() => handleMessagesAppended({ appendedMessages: null })).not.toThrow()
    })

    it('should scroll to bottom when at bottom', () => {
      // Arrange
      mockDependencies.messageStore.isAtMessagesBottom = true
      const payload = {
        appendedMessages: [
          { id: 'msg-1', is_mine: false },
          { id: 'msg-2', is_mine: true }
        ]
      }

      // Act
      handleMessagesAppended(payload)

      // Assert
      expect(mockDependencies.scrollToBottom).toHaveBeenCalledWith(false)
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(false)
      expect(mockDependencies.newMessageCount.value).toBe(0)
      expect(mockDependencies.messageStore.setIsAtMessagesBottom).toHaveBeenCalledWith(true)
    })

    it('should increment new message count when not at bottom', () => {
      // Arrange
      mockDependencies.messageStore.isAtMessagesBottom = false
      const payload = {
        appendedMessages: [
          { id: 'msg-1', is_mine: false },
          { id: 'msg-2', is_mine: false },
          { id: 'msg-3', is_mine: true } // This shouldn't count
        ]
      }

      // Act
      handleMessagesAppended(payload)

      // Assert
      expect(mockDependencies.newMessageCount.value).toBe(2) // Only incoming messages
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(true)
      expect(mockDependencies.scrollToBottom).not.toHaveBeenCalled()
    })

    it('should not increment count when only outgoing messages', () => {
      // Arrange
      mockDependencies.messageStore.isAtMessagesBottom = false
      const payload = {
        appendedMessages: [
          { id: 'msg-1', is_mine: true },
          { id: 'msg-2', is_mine: true }
        ]
      }

      // Act
      handleMessagesAppended(payload)

      // Assert
      expect(mockDependencies.newMessageCount.value).toBe(0)
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(true)
    })
  })

  describe('handleConversationChanged', () => {
    let handleConversationChanged

    beforeEach(() => {
      useScrollCoordinator(mockDependencies)
      handleConversationChanged = eventHandlers.get(ScrollEvents.ConversationChanged)
    })

    it('should reset all states when conversation changes', () => {
      // Act
      handleConversationChanged()

      // Assert
      expect(mockDependencies.clearUnreadDivider).toHaveBeenCalled()
      expect(mockDependencies.newMessageCount.value).toBe(0)
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(false)
      expect(mockDependencies.messageStore.setIsAtMessagesBottom).toHaveBeenCalledWith(true)
      expect(mockDependencies.allowUnreadDivider).toHaveBeenCalled()
      expect(mockDependencies.hasReachedBottomAfterUnread.value).toBe(false)
    })
  })

  describe('handleReset', () => {
    let handleReset

    beforeEach(() => {
      useScrollCoordinator(mockDependencies)
      handleReset = eventHandlers.get(ScrollEvents.Reset)
    })

    it('should reset all states with suppress flag', () => {
      // Act
      handleReset()

      // Assert
      expect(mockDependencies.clearUnreadDivider).toHaveBeenCalledWith({ suppress: true })
      expect(mockDependencies.newMessageCount.value).toBe(0)
      expect(mockDependencies.showScrollToBottomBtn.value).toBe(false)
      expect(mockDependencies.messageStore.setIsAtMessagesBottom).toHaveBeenCalledWith(true)
      expect(mockDependencies.allowUnreadDivider).toHaveBeenCalled()
      expect(mockDependencies.hasReachedBottomAfterUnread.value).toBe(false)
    })
  })

  describe('emit functions', () => {
    it('should emit scroll metrics', () => {
      // Arrange
      const coordinator = useScrollCoordinator(mockDependencies)
      const payload = { scrollTop: 100, scrollHeight: 1000, clientHeight: 300 }

      // Act
      coordinator.emitScrollMetrics(payload)

      // Assert
      expect(emitScrollEvent).toHaveBeenCalledWith(ScrollEvents.Metrics, payload)
    })

    it('should emit messages appended', () => {
      // Arrange
      const coordinator = useScrollCoordinator(mockDependencies)
      const payload = { appendedMessages: [{ id: 'msg-1' }] }

      // Act
      coordinator.emitMessagesAppended(payload)

      // Assert
      expect(emitScrollEvent).toHaveBeenCalledWith(ScrollEvents.MessagesAppended, payload)
    })

    it('should emit conversation changed', () => {
      // Arrange
      const coordinator = useScrollCoordinator(mockDependencies)
      const payload = { conversationId: 'conv-123' }

      // Act
      coordinator.emitConversationChanged(payload)

      // Assert
      expect(emitScrollEvent).toHaveBeenCalledWith(ScrollEvents.ConversationChanged, payload)
    })

    it('should emit reset', () => {
      // Arrange
      const coordinator = useScrollCoordinator(mockDependencies)
      const payload = { conversationId: 'conv-123' }

      // Act
      coordinator.emitReset(payload)

      // Assert
      expect(emitScrollEvent).toHaveBeenCalledWith(ScrollEvents.Reset, payload)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid scroll values gracefully', async () => {
      // Arrange
      useScrollCoordinator(mockDependencies)
      const handleMetrics = eventHandlers.get(ScrollEvents.Metrics)
      
      const mockArea = {
        scrollTop: NaN,
        scrollHeight: Infinity,
        clientHeight: -100
      }
      mockDependencies.messagesArea.value = mockArea

      // Act & Assert - should not throw
      await expect(handleMetrics()).resolves.toBeUndefined()
    })

    it('should handle missing selectedConversation for loadMoreMessages', async () => {
      // Arrange
      useScrollCoordinator(mockDependencies)
      const handleMetrics = eventHandlers.get(ScrollEvents.Metrics)
      
      mockDependencies.selectedConversation.value = null
      const mockArea = {
        scrollTop: 50,
        scrollHeight: 1000,
        clientHeight: 300
      }
      mockDependencies.messagesArea.value = mockArea

      // Act
      await handleMetrics()

      // Assert - should not call loadMoreMessages
      expect(mockDependencies.loadMoreMessages).not.toHaveBeenCalled()
    })
  })

  describe('unread message handling', () => {
    it('should mark messages as read when at bottom', async () => {
      // Arrange
      useScrollCoordinator(mockDependencies)
      const handleMetrics = eventHandlers.get(ScrollEvents.Metrics)
      
      // Mock markAsRead API
      const mockMarkAsRead = vi.fn().mockResolvedValue()
      vi.doMock('@/api/conversationAPI', () => ({
        markAsRead: mockMarkAsRead
      }))

      mockDependencies.messageStore.isAtMessagesBottom = false // Was not at bottom
      mockDependencies.messageStore.currentMessages = [
        { id: 'msg-1', is_mine: false, is_read: false },
        { id: 'msg-2', is_mine: true, is_read: true },
        { id: 'msg-3', is_mine: false, is_read: false }
      ]
      mockDependencies.messageStore.conversations = [
        { id: 'conv-123', unread_count: 2 }
      ]

      const mockArea = {
        scrollTop: 950,
        scrollHeight: 1000,
        clientHeight: 100
      }
      mockDependencies.messagesArea.value = mockArea

      // Act
      await handleMetrics()

      // Assert
      expect(mockDependencies.messageStore.currentMessages[0].is_read).toBe(true)
      expect(mockDependencies.messageStore.currentMessages[2].is_read).toBe(true)
    })
  })
})