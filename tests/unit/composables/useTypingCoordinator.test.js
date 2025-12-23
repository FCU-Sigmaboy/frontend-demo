import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTypingCoordinator } from '@/composables/useTypingCoordinator.js'

// 模擬事件總線
vi.mock('@/events/typingBus', () => ({
  TypingEvents: {
    ConversationChanged: 'typing:conversation-changed',
    InputChanged: 'typing:input-changed',
    SendMessage: 'typing:send-message',
    Reset: 'typing:reset'
  },
  onTypingEvent: vi.fn(),
  offTypingEvent: vi.fn(),
  emitTypingEvent: vi.fn()
}))

import { TypingEvents, onTypingEvent, offTypingEvent, emitTypingEvent } from '@/events/typingBus'

describe('useTypingCoordinator', () => {
  let mockDependencies
  let eventHandlers
  let originalSetTimeout
  let originalClearTimeout

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 模擬定時器
    originalSetTimeout = global.setTimeout
    originalClearTimeout = global.clearTimeout
    global.setTimeout = vi.fn().mockReturnValue('timer-id')
    global.clearTimeout = vi.fn()

    // 捕獲事件處理器
    eventHandlers = new Map()
    onTypingEvent.mockImplementation((event, handler) => {
      eventHandlers.set(event, handler)
    })

    // 模擬依賴
    mockDependencies = {
      messageStore: {
        broadcastTypingStatus: vi.fn().mockResolvedValue(),
        joinTypingChannel: vi.fn().mockResolvedValue(),
        leaveTypingChannel: vi.fn().mockResolvedValue()
      },
      getIdentity: vi.fn().mockReturnValue({
        id: 'user-123',
        nickname: 'Test User'
      }),
      getSelectedConversationId: vi.fn().mockReturnValue('conv-123'),
      typingStopDelay: 3500,
      typingBroadcastInterval: 1200
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    global.setTimeout = originalSetTimeout
    global.clearTimeout = originalClearTimeout
  })

  describe('initialization', () => {
    it('should register event handlers on initialization', () => {
      // Act
      useTypingCoordinator(mockDependencies)

      // Assert
      expect(onTypingEvent).toHaveBeenCalledTimes(4)
      expect(onTypingEvent).toHaveBeenCalledWith(TypingEvents.ConversationChanged, expect.any(Function))
      expect(onTypingEvent).toHaveBeenCalledWith(TypingEvents.InputChanged, expect.any(Function))
      expect(onTypingEvent).toHaveBeenCalledWith(TypingEvents.SendMessage, expect.any(Function))
      expect(onTypingEvent).toHaveBeenCalledWith(TypingEvents.Reset, expect.any(Function))
    })

    it('should return emit functions and utility methods', () => {
      // Act
      const coordinator = useTypingCoordinator(mockDependencies)

      // Assert
      expect(typeof coordinator.emitConversationChanged).toBe('function')
      expect(typeof coordinator.emitInputChanged).toBe('function')
      expect(typeof coordinator.emitSendMessage).toBe('function')
      expect(typeof coordinator.emitReset).toBe('function')
      expect(typeof coordinator.clearTypingTimer).toBe('function')
      expect(typeof coordinator.resetTypingFlags).toBe('function')
    })
  })

  describe('handleConversationChanged', () => {
    let handleConversationChanged

    beforeEach(() => {
      useTypingCoordinator(mockDependencies)
      handleConversationChanged = eventHandlers.get(TypingEvents.ConversationChanged)
    })

    it('should handle conversation change with previous conversation', async () => {
      // Arrange
      const payload = {
        prevConversationId: 'conv-old',
        nextConversationId: 'conv-new',
        identity: { id: 'user-123', nickname: 'Test User' }
      }

      // Act
      await handleConversationChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-old',
        false,
        payload.identity
      )
      expect(mockDependencies.messageStore.leaveTypingChannel).toHaveBeenCalledWith('conv-old')
      expect(mockDependencies.messageStore.joinTypingChannel).toHaveBeenCalledWith(
        'conv-new',
        payload.identity
      )
    })

    it('should not broadcast when same conversation', async () => {
      // Arrange
      const payload = {
        prevConversationId: 'conv-123',
        nextConversationId: 'conv-123'
      }

      // Act
      await handleConversationChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).not.toHaveBeenCalled()
      expect(mockDependencies.messageStore.leaveTypingChannel).not.toHaveBeenCalled()
      expect(mockDependencies.messageStore.joinTypingChannel).not.toHaveBeenCalled()
    })

    it('should handle leaving conversation without joining new one', async () => {
      // Arrange
      const payload = {
        prevConversationId: 'conv-old',
        nextConversationId: null,
        identity: { id: 'user-123', nickname: 'Test User' }
      }

      // Act
      await handleConversationChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-old',
        false,
        payload.identity
      )
      expect(mockDependencies.messageStore.leaveTypingChannel).toHaveBeenCalledWith('conv-old')
      expect(mockDependencies.messageStore.joinTypingChannel).not.toHaveBeenCalled()
    })

    it('should handle joining conversation without previous one', async () => {
      // Arrange
      const payload = {
        prevConversationId: null,
        nextConversationId: 'conv-new',
        identity: { id: 'user-123', nickname: 'Test User' }
      }

      // Act
      await handleConversationChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).not.toHaveBeenCalled()
      expect(mockDependencies.messageStore.leaveTypingChannel).not.toHaveBeenCalled()
      expect(mockDependencies.messageStore.joinTypingChannel).toHaveBeenCalledWith(
        'conv-new',
        payload.identity
      )
    })

    it('should use getIdentity when identity not provided', async () => {
      // Arrange
      const payload = {
        prevConversationId: 'conv-old',
        nextConversationId: 'conv-new'
      }

      // Act
      await handleConversationChanged(payload)

      // Assert
      expect(mockDependencies.getIdentity).toHaveBeenCalled()
      expect(mockDependencies.messageStore.joinTypingChannel).toHaveBeenCalledWith(
        'conv-new',
        { id: 'user-123', nickname: 'Test User' }
      )
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      mockDependencies.messageStore.leaveTypingChannel.mockRejectedValue(new Error('Leave failed'))
      mockDependencies.messageStore.joinTypingChannel.mockRejectedValue(new Error('Join failed'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const payload = {
        prevConversationId: 'conv-old',
        nextConversationId: 'conv-new',
        identity: { id: 'user-123', nickname: 'Test User' }
      }

      // Act & Assert - should not throw
      await expect(handleConversationChanged(payload)).resolves.toBeUndefined()
      expect(consoleSpy).toHaveBeenCalledTimes(2)
      
      consoleSpy.mockRestore()
    })
  })

  describe('handleInputChanged', () => {
    let handleInputChanged

    beforeEach(() => {
      useTypingCoordinator(mockDependencies)
      handleInputChanged = eventHandlers.get(TypingEvents.InputChanged)
    })

    it('should broadcast typing when content is not empty', () => {
      // Arrange
      const payload = {
        conversationId: 'conv-123',
        content: 'Hello world'
      }

      // Act
      handleInputChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-123',
        true,
        { id: 'user-123', nickname: 'Test User' }
      )
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 3500)
    })

    it('should stop typing when content is empty', () => {
      // Arrange - first start typing to set localTypingActive
      handleInputChanged({
        conversationId: 'conv-123',
        content: 'Hello'
      })
      vi.clearAllMocks()

      // Act - now send empty content
      const payload = {
        conversationId: 'conv-123',
        content: ''
      }
      handleInputChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-123',
        false,
        { id: 'user-123', nickname: 'Test User' }
      )
      expect(global.clearTimeout).toHaveBeenCalled()
    })

    it('should stop typing when content is only whitespace', () => {
      // Arrange - first start typing to set localTypingActive
      handleInputChanged({
        conversationId: 'conv-123',
        content: 'Hello'
      })
      vi.clearAllMocks()

      // Act - now send whitespace content
      const payload = {
        conversationId: 'conv-123',
        content: '   \n\t  '
      }
      handleInputChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-123',
        false,
        { id: 'user-123', nickname: 'Test User' }
      )
    })

    it('should use current conversation when conversationId not provided', () => {
      // Arrange
      const payload = {
        content: 'Hello'
      }

      // Act
      handleInputChanged(payload)

      // Assert
      expect(mockDependencies.getSelectedConversationId).toHaveBeenCalled()
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-123',
        true,
        { id: 'user-123', nickname: 'Test User' }
      )
    })

    it('should not broadcast when no conversation or identity', () => {
      // Arrange
      mockDependencies.getSelectedConversationId.mockReturnValue(null)
      const payload = {
        content: 'Hello'
      }

      // Act
      handleInputChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).not.toHaveBeenCalled()
    })

    it('should not broadcast when identity has no id', () => {
      // Arrange
      mockDependencies.getIdentity.mockReturnValue({ nickname: 'Test User' })
      const payload = {
        conversationId: 'conv-123',
        content: 'Hello'
      }

      // Act
      handleInputChanged(payload)

      // Assert
      expect(mockDependencies.messageStore.broadcastTypingStatus).not.toHaveBeenCalled()
    })

    it('should handle typing interval correctly', () => {
      // Arrange
      const realDateNow = Date.now
      Date.now = vi.fn()
        .mockReturnValueOnce(1000) // First call
        .mockReturnValueOnce(1500) // Second call (500ms later, < 1200ms interval)
        .mockReturnValueOnce(2500) // Third call (1500ms later, > 1200ms interval)

      useTypingCoordinator(mockDependencies)
      handleInputChanged = eventHandlers.get(TypingEvents.InputChanged)

      const payload = {
        conversationId: 'conv-123',
        content: 'Hello'
      }

      // Act - first input
      handleInputChanged(payload)
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledTimes(1)

      // Act - second input within interval
      handleInputChanged(payload)
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledTimes(1) // Still 1

      // Act - third input after interval
      handleInputChanged(payload)
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledTimes(2) // Now 2

      Date.now = realDateNow
    })
  })

  describe('handleSendMessage', () => {
    let handleSendMessage

    beforeEach(() => {
      useTypingCoordinator(mockDependencies)
      handleSendMessage = eventHandlers.get(TypingEvents.SendMessage)
    })

    it('should stop typing when message is sent', () => {
      // Arrange
      const payload = {
        conversationId: 'conv-123'
      }

      // Act
      handleSendMessage(payload)

      // Assert - clearTypingTimer is called internally, but global.clearTimeout
      // is only called if there's an active timer. The broadcast is called.
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-123',
        false,
        { id: 'user-123', nickname: 'Test User' }
      )
    })

    it('should use current conversation when conversationId not provided', () => {
      // Arrange
      const payload = {}

      // Act
      handleSendMessage(payload)

      // Assert
      expect(mockDependencies.getSelectedConversationId).toHaveBeenCalled()
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-123',
        false,
        { id: 'user-123', nickname: 'Test User' }
      )
    })

    it('should handle missing conversation gracefully', () => {
      // Arrange
      mockDependencies.getSelectedConversationId.mockReturnValue(null)
      const payload = {}

      // Act & Assert - should not throw
      expect(() => handleSendMessage(payload)).not.toThrow()
      expect(mockDependencies.messageStore.broadcastTypingStatus).not.toHaveBeenCalled()
    })
  })

  describe('handleReset', () => {
    let handleReset

    beforeEach(() => {
      useTypingCoordinator(mockDependencies)
      handleReset = eventHandlers.get(TypingEvents.Reset)
    })

    it('should reset typing state and leave channel', async () => {
      // Arrange
      const payload = {
        conversationId: 'conv-123'
      }

      // Act
      await handleReset(payload)

      // Assert - broadcastTyping is called without identity (uses null)
      expect(mockDependencies.messageStore.broadcastTypingStatus).toHaveBeenCalledWith(
        'conv-123',
        false,
        { id: 'user-123', nickname: 'Test User' }
      )
      expect(mockDependencies.messageStore.leaveTypingChannel).toHaveBeenCalledWith('conv-123')
    })

    it('should use current conversation when conversationId not provided', async () => {
      // Arrange
      const payload = {}

      // Act
      await handleReset(payload)

      // Assert
      expect(mockDependencies.getSelectedConversationId).toHaveBeenCalled()
      expect(mockDependencies.messageStore.leaveTypingChannel).toHaveBeenCalledWith('conv-123')
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      mockDependencies.messageStore.leaveTypingChannel.mockRejectedValue(new Error('Leave failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const payload = {
        conversationId: 'conv-123'
      }

      // Act & Assert - should not throw
      await expect(handleReset(payload)).resolves.toBeUndefined()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('emit functions', () => {
    it('should emit conversation changed', () => {
      // Arrange
      const coordinator = useTypingCoordinator(mockDependencies)
      const payload = { prevConversationId: 'old', nextConversationId: 'new' }

      // Act
      coordinator.emitConversationChanged(payload)

      // Assert
      expect(emitTypingEvent).toHaveBeenCalledWith(TypingEvents.ConversationChanged, payload)
    })

    it('should emit input changed', () => {
      // Arrange
      const coordinator = useTypingCoordinator(mockDependencies)
      const payload = { conversationId: 'conv-123', content: 'Hello' }

      // Act
      coordinator.emitInputChanged(payload)

      // Assert
      expect(emitTypingEvent).toHaveBeenCalledWith(TypingEvents.InputChanged, payload)
    })

    it('should emit send message', () => {
      // Arrange
      const coordinator = useTypingCoordinator(mockDependencies)
      const payload = { conversationId: 'conv-123' }

      // Act
      coordinator.emitSendMessage(payload)

      // Assert
      expect(emitTypingEvent).toHaveBeenCalledWith(TypingEvents.SendMessage, payload)
    })

    it('should emit reset', () => {
      // Arrange
      const coordinator = useTypingCoordinator(mockDependencies)
      const payload = { conversationId: 'conv-123' }

      // Act
      coordinator.emitReset(payload)

      // Assert
      expect(emitTypingEvent).toHaveBeenCalledWith(TypingEvents.Reset, payload)
    })
  })

  describe('utility methods', () => {
    it('should provide clearTypingTimer method', () => {
      // Arrange
      const coordinator = useTypingCoordinator(mockDependencies)

      // Act & Assert - clearTypingTimer should be callable without error
      // It only calls clearTimeout if there's an active timer
      expect(() => coordinator.clearTypingTimer()).not.toThrow()
    })

    it('should provide resetTypingFlags method', () => {
      // Arrange
      const coordinator = useTypingCoordinator(mockDependencies)

      // Act & Assert - should not throw
      expect(() => coordinator.resetTypingFlags()).not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle getIdentity errors gracefully', () => {
      // Arrange
      mockDependencies.getIdentity.mockImplementation(() => {
        throw new Error('Identity error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      useTypingCoordinator(mockDependencies)
      const handleInputChanged = eventHandlers.get(TypingEvents.InputChanged)

      // Act & Assert - should not throw
      expect(() => handleInputChanged({ content: 'Hello' })).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle getSelectedConversationId errors gracefully', () => {
      // Arrange
      mockDependencies.getSelectedConversationId.mockImplementation(() => {
        throw new Error('Conversation error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      useTypingCoordinator(mockDependencies)
      const handleInputChanged = eventHandlers.get(TypingEvents.InputChanged)

      // Act & Assert - should not throw
      expect(() => handleInputChanged({ content: 'Hello' })).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('timer management', () => {
    it('should clear existing timer before setting new one', () => {
      // Arrange
      useTypingCoordinator(mockDependencies)
      const handleInputChanged = eventHandlers.get(TypingEvents.InputChanged)

      // Act - first input
      handleInputChanged({ conversationId: 'conv-123', content: 'Hello' })
      expect(global.setTimeout).toHaveBeenCalledTimes(1)

      // Act - second input (should clear previous timer)
      handleInputChanged({ conversationId: 'conv-123', content: 'Hello world' })
      
      // Assert
      expect(global.clearTimeout).toHaveBeenCalled()
      expect(global.setTimeout).toHaveBeenCalledTimes(2)
    })
  })
})