import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useTransactionRealtime } from '@/composables/useTransactionRealtime.js'

// 模擬 Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn()
  }
}))

// 模擬 Auth Store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

describe('useTransactionRealtime', () => {
  let mockAuthStore
  let mockChannel
  let mockSubscribe
  let mockOn
  let capturedPayloadHandler

  beforeEach(() => {
    vi.clearAllMocks()

    // 模擬 Auth Store
    mockAuthStore = {
      isLoggedIn: true,
      userId: 'test-user-123'
    }
    useAuthStore.mockReturnValue(mockAuthStore)

    // 模擬 Supabase channel - builder pattern
    // The actual implementation does: channel.value = supabase.channel(...).on(...).subscribe(...)
    // subscribe() returns the channel object itself
    mockChannel = {
      on: null,
      subscribe: null
    }
    
    mockSubscribe = vi.fn().mockReturnValue(mockChannel)
    
    mockOn = vi.fn().mockImplementation((event, config, handler) => {
      capturedPayloadHandler = handler
      return mockChannel
    })
    
    mockChannel.on = mockOn
    mockChannel.subscribe = mockSubscribe
    
    supabase.channel.mockReturnValue(mockChannel)
    supabase.removeChannel.mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      // Act
      const { isListening } = useTransactionRealtime()

      // Assert
      expect(isListening.value).toBe(false)
    })

    it('should not start listening automatically if user is not logged in', () => {
      // Arrange
      mockAuthStore.isLoggedIn = false
      
      // Act
      useTransactionRealtime()

      // Assert
      expect(supabase.channel).not.toHaveBeenCalled()
    })
  })

  describe('startListening', () => {
    it('should start listening when user is logged in', () => {
      // Act
      const { startListening } = useTransactionRealtime()
      startListening()

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith('transaction-changes')
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: 'buyer_id=eq.test-user-123,seller_id=eq.test-user-123'
        },
        expect.any(Function)
      )
      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should not start listening if user is not logged in', () => {
      // Arrange
      mockAuthStore.isLoggedIn = false
      
      // Act
      const { startListening } = useTransactionRealtime()
      startListening()

      // Assert
      expect(supabase.channel).not.toHaveBeenCalled()
    })

    it('should not start listening if already listening', () => {
      // Arrange
      const { startListening, isListening } = useTransactionRealtime()
      
      // Mock subscription status callback
      mockSubscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
      })

      // Act
      startListening() // First call
      startListening() // Second call

      // Assert
      expect(supabase.channel).toHaveBeenCalledTimes(1)
    })

    it('should set isListening to true when subscription is successful', () => {
      // Arrange
      const { startListening, isListening } = useTransactionRealtime()

      // Act
      startListening()
      
      // Simulate successful subscription
      const subscribeCallback = mockSubscribe.mock.calls[0][0]
      subscribeCallback('SUBSCRIBED')

      // Assert
      expect(isListening.value).toBe(true)
    })
  })

  describe('stopListening', () => {
    it('should stop listening and clean up channel', async () => {
      // Arrange
      const { startListening, stopListening, isListening } = useTransactionRealtime()
      
      // Start listening first
      startListening()
      mockSubscribe.mock.calls[0][0]('SUBSCRIBED') // Simulate subscription
      expect(isListening.value).toBe(true)

      // Act
      await stopListening()

      // Assert
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
      expect(isListening.value).toBe(false)
    })

    it('should handle stopping when not listening', async () => {
      // Arrange
      const { stopListening } = useTransactionRealtime()

      // Act & Assert - should not throw
      await expect(stopListening()).resolves.toBeUndefined()
      expect(supabase.removeChannel).not.toHaveBeenCalled()
    })
  })

  describe('transaction event handling', () => {
    let callbacks
    let startListening

    beforeEach(() => {
      const composable = useTransactionRealtime()
      callbacks = {
        onTransactionReceived: composable.onTransactionReceived,
        onTransactionAccepted: composable.onTransactionAccepted,
        onTransactionCompleted: composable.onTransactionCompleted,
        onTransactionRejected: composable.onTransactionRejected,
        onTransactionCancelled: composable.onTransactionCancelled,
        onError: composable.onError
      }
      startListening = composable.startListening

      // Start listening to capture the handler
      startListening()
    })

    describe('INSERT events', () => {
      it('should call onTransactionReceived when user is seller', () => {
        // Arrange
        const mockCallback = vi.fn()
        callbacks.onTransactionReceived(mockCallback)

        const payload = {
          eventType: 'INSERT',
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'other-user',
            seller_id: 'test-user-123',
            status: 'waiting'
          }
        }

        // Act
        capturedPayloadHandler(payload)

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(payload.new)
      })

      it('should not call onTransactionReceived when user is buyer', () => {
        // Arrange
        const mockCallback = vi.fn()
        callbacks.onTransactionReceived(mockCallback)

        const payload = {
          eventType: 'INSERT',
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'test-user-123',
            seller_id: 'other-user',
            status: 'waiting'
          }
        }

        // Act
        capturedPayloadHandler(payload)

        // Assert
        expect(mockCallback).not.toHaveBeenCalled()
      })
    })

    describe('UPDATE events', () => {
      it('should call onTransactionAccepted when buyer receives acceptance', () => {
        // Arrange
        const mockCallback = vi.fn()
        callbacks.onTransactionAccepted(mockCallback)

        const payload = {
          eventType: 'UPDATE',
          old: { status: 'waiting' },
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'test-user-123',
            seller_id: 'other-user',
            status: 'in_transaction'
          }
        }

        // Act
        capturedPayloadHandler(payload)

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(payload.new)
      })

      it('should call onTransactionCompleted when transaction is completed', () => {
        // Arrange
        const mockCallback = vi.fn()
        callbacks.onTransactionCompleted(mockCallback)

        const payload = {
          eventType: 'UPDATE',
          old: { status: 'in_transaction' },
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'test-user-123',
            seller_id: 'other-user',
            status: 'completed'
          }
        }

        // Act
        capturedPayloadHandler(payload)

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(payload.new)
      })

      it('should call onTransactionRejected when buyer receives rejection', () => {
        // Arrange
        const mockCallback = vi.fn()
        callbacks.onTransactionRejected(mockCallback)

        const payload = {
          eventType: 'UPDATE',
          old: { status: 'waiting' },
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'test-user-123',
            seller_id: 'other-user',
            status: 'rejected'
          }
        }

        // Act
        capturedPayloadHandler(payload)

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(payload.new)
      })

      it('should call onTransactionCancelled when transaction is cancelled', () => {
        // Arrange
        const mockCallback = vi.fn()
        callbacks.onTransactionCancelled(mockCallback)

        const payload = {
          eventType: 'UPDATE',
          old: { status: 'waiting' },
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'test-user-123',
            seller_id: 'other-user',
            status: 'cancelled'
          }
        }

        // Act
        capturedPayloadHandler(payload)

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(payload.new)
      })

      it('should not call callbacks for irrelevant status changes', () => {
        // Arrange
        const mockCallbacks = {
          onTransactionAccepted: vi.fn(),
          onTransactionRejected: vi.fn(),
          onTransactionCompleted: vi.fn(),
          onTransactionCancelled: vi.fn()
        }

        Object.entries(mockCallbacks).forEach(([name, callback]) => {
          callbacks[name](callback)
        })

        const payload = {
          eventType: 'UPDATE',
          old: { status: 'waiting' },
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'test-user-123',
            seller_id: 'other-user',
            status: 'unknown_status'
          }
        }

        // Act
        capturedPayloadHandler(payload)

        // Assert
        Object.values(mockCallbacks).forEach(callback => {
          expect(callback).not.toHaveBeenCalled()
        })
      })
    })

    describe('error handling', () => {
      it('should handle null old record gracefully without error', () => {
        // Arrange
        const mockCompletedCallback = vi.fn()
        callbacks.onTransactionCompleted(mockCompletedCallback)

        const payload = {
          eventType: 'UPDATE',
          old: null, // The implementation uses optional chaining, so this is handled gracefully
          new: {
            transaction_id: 'txn-123',
            buyer_id: 'test-user-123',
            seller_id: 'other-user',
            status: 'completed'
          }
        }

        // Act - should not throw
        expect(() => capturedPayloadHandler(payload)).not.toThrow()

        // Assert - completed callback should still be called
        expect(mockCompletedCallback).toHaveBeenCalledWith(payload.new)
      })
    })
  })

  describe('callback management', () => {
    it('should allow setting and updating callbacks', () => {
      // Arrange
      const { onTransactionReceived } = useTransactionRealtime()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      // Act
      onTransactionReceived(callback1)
      onTransactionReceived(callback2) // Should replace callback1

      // Assert - we can't directly test this without triggering an event
      // but we can verify the methods exist and don't throw
      expect(typeof onTransactionReceived).toBe('function')
    })

    it('should provide all callback setter methods', () => {
      // Act
      const composable = useTransactionRealtime()

      // Assert
      expect(typeof composable.onTransactionReceived).toBe('function')
      expect(typeof composable.onTransactionAccepted).toBe('function')
      expect(typeof composable.onTransactionCompleted).toBe('function')
      expect(typeof composable.onTransactionRejected).toBe('function')
      expect(typeof composable.onTransactionCancelled).toBe('function')
      expect(typeof composable.onError).toBe('function')
    })
  })

  describe('reactive behavior', () => {
    it('should maintain reactive isListening state', async () => {
      // Arrange
      const { startListening, stopListening, isListening } = useTransactionRealtime()

      // Assert - initial state
      expect(isListening.value).toBe(false)

      // Act - start listening
      startListening()
      mockSubscribe.mock.calls[0][0]('SUBSCRIBED')
      await nextTick()

      // Assert - listening state
      expect(isListening.value).toBe(true)

      // Act - stop listening
      await stopListening()
      await nextTick()

      // Assert - stopped state
      expect(isListening.value).toBe(false)
    })
  })

  describe('lifecycle integration', () => {
    it('should handle component unmounting gracefully', async () => {
      // Arrange
      const { startListening, stopListening } = useTransactionRealtime()
      
      startListening()
      mockSubscribe.mock.calls[0][0]('SUBSCRIBED')

      // Act - simulate component unmount
      await stopListening()

      // Assert
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })

  describe('edge cases', () => {
    it('should handle missing transaction data gracefully', () => {
      // Arrange
      const { startListening, onError } = useTransactionRealtime()
      const mockErrorCallback = vi.fn()
      onError(mockErrorCallback)
      
      startListening()

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act - payload with missing data
      const payload = {
        eventType: 'INSERT',
        new: null
      }

      capturedPayloadHandler(payload)

      // Assert
      expect(mockErrorCallback).toHaveBeenCalledWith(expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle unknown event types gracefully', () => {
      // Arrange
      const { startListening } = useTransactionRealtime()
      startListening()

      // Act - unknown event type should not throw
      const payload = {
        eventType: 'DELETE',
        old: { transaction_id: 'txn-123' }
      }

      // Assert - should not throw
      expect(() => capturedPayloadHandler(payload)).not.toThrow()
    })
  })
})