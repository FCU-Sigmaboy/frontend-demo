import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for handling real-time transaction updates
 * Listens to changes in the transactions table and triggers callbacks
 */
export function useTransactionRealtime() {
  const authStore = useAuthStore()
  const channel = ref(null)
  const isListening = ref(false)

  // Event callbacks
  const callbacks = {
    onTransactionReceived: null,    // 收到新交易請求
    onTransactionAccepted: null,    // 交易被接受
    onTransactionCompleted: null,   // 交易完成
    onTransactionRejected: null,    // 交易被拒絕
    onTransactionCancelled: null,   // 交易被取消
    onError: null                   // 錯誤處理
  }

  /**
   * Start listening to transaction changes
   */
  const startListening = () => {
    if (!authStore.isLoggedIn || isListening.value) {
      console.log('[TransactionRealtime] Not starting - logged in:', authStore.isLoggedIn, 'already listening:', isListening.value)
      return
    }

    const userId = authStore.userId

    console.log('[TransactionRealtime] Starting to listen for user:', userId)

    // Create a channel for transaction updates
    channel.value = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'transactions',
          // Filter for transactions where user is buyer or seller
          filter: `buyer_id=eq.${userId},seller_id=eq.${userId}`
        },
        async (payload) => {
          console.log('[TransactionRealtime] Received payload:', payload)
          handleTransactionChange(payload, userId)
        }
      )
      .subscribe((status) => {
        console.log('[TransactionRealtime] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          isListening.value = true
        }
      })
  }

  /**
   * Handle transaction change events
   */
  const handleTransactionChange = (payload, userId) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    try {
      // INSERT event - new transaction created
      if (eventType === 'INSERT') {
        const transaction = newRecord

        // Check if current user is the seller (receiving transaction request)
        if (transaction.seller_id === userId) {
          console.log('[TransactionRealtime] 收到新交易請求:', transaction)
          callbacks.onTransactionReceived?.(transaction)
        }
      }

      // UPDATE event - transaction status changed
      else if (eventType === 'UPDATE') {
        const transaction = newRecord
        const oldStatus = oldRecord?.status
        const newStatus = transaction.status

        console.log('[TransactionRealtime] 交易狀態變更:', {
          transactionId: transaction.transaction_id,
          oldStatus,
          newStatus
        })

        // Transaction accepted
        if (oldStatus === 'waiting' && newStatus === 'in_transaction') {
          // If current user is buyer, seller accepted the transaction
          if (transaction.buyer_id === userId) {
            console.log('[TransactionRealtime] 賣家接受了您的交易請求')
            callbacks.onTransactionAccepted?.(transaction)
          }
        }

        // Transaction completed
        else if (newStatus === 'completed') {
          console.log('[TransactionRealtime] 交易完成')
          callbacks.onTransactionCompleted?.(transaction)
        }

        // Transaction rejected
        else if (newStatus === 'rejected') {
          // If current user is buyer, seller rejected the transaction
          if (transaction.buyer_id === userId) {
            console.log('[TransactionRealtime] 賣家拒絕了您的交易請求')
            callbacks.onTransactionRejected?.(transaction)
          }
        }

        // Transaction cancelled
        else if (newStatus === 'cancelled') {
          console.log('[TransactionRealtime] 交易已取消')
          callbacks.onTransactionCancelled?.(transaction)
        }
      }
    } catch (error) {
      console.error('[TransactionRealtime] Error handling transaction change:', error)
      callbacks.onError?.(error)
    }
  }

  /**
   * Stop listening to transaction changes
   */
  const stopListening = async () => {
    if (channel.value) {
      console.log('[TransactionRealtime] Stopping listener')
      await supabase.removeChannel(channel.value)
      channel.value = null
      isListening.value = false
    }
  }

  /**
   * Set callback for when a new transaction is received
   */
  const onTransactionReceived = (callback) => {
    callbacks.onTransactionReceived = callback
  }

  /**
   * Set callback for when a transaction is accepted
   */
  const onTransactionAccepted = (callback) => {
    callbacks.onTransactionAccepted = callback
  }

  /**
   * Set callback for when a transaction is completed
   */
  const onTransactionCompleted = (callback) => {
    callbacks.onTransactionCompleted = callback
  }

  /**
   * Set callback for when a transaction is rejected
   */
  const onTransactionRejected = (callback) => {
    callbacks.onTransactionRejected = callback
  }

  /**
   * Set callback for when a transaction is cancelled
   */
  const onTransactionCancelled = (callback) => {
    callbacks.onTransactionCancelled = callback
  }

  /**
   * Set callback for error handling
   */
  const onError = (callback) => {
    callbacks.onError = callback
  }

  // Auto-start listening on mount
  onMounted(() => {
    startListening()
  })

  // Auto-stop listening on unmount
  onUnmounted(() => {
    stopListening()
  })

  return {
    isListening,
    startListening,
    stopListening,
    onTransactionReceived,
    onTransactionAccepted,
    onTransactionCompleted,
    onTransactionRejected,
    onTransactionCancelled,
    onError
  }
}