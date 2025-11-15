import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { getMyTransactionsByStatus } from '@/api/transaction_before_meetAPI'
import { supabase } from '@/lib/supabase'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const STATUS_MAP = {
  confirming: 'waiting',
  pending: 'in_transaction',
  completed: 'sold'
}

function normalizeBucketPayload(payload) {
  return Array.isArray(payload) ? payload : []
}

function createEmptyBuckets() {
  return {
    giver: [],
    receiver: []
  }
}

function toTransactionId(record) {
  if (!record) return null
  return record.transaction_id ?? record.id ?? record.transactionId ?? null
}

function normalizeDbStatus(status) {
  switch (status) {
    case 'waiting':
      return 'confirming'
    case 'in_transaction':
      return 'pending'
    default:
      return status ?? null
  }
}

function normalizeRealtimeTransaction(record, fallbackStatus) {
  if (!record) return null

  const transactionId = toTransactionId(record)
  const dbStatus = record.transaction_status ?? record.status ?? fallbackStatus ?? null
  const normalizedStatus = normalizeDbStatus(dbStatus)

  return {
    ...record,
    transaction_id: transactionId,
    status: normalizedStatus
  }
}

export const useTransactionStore = defineStore('transaction', () => {
  const confirming = reactive(createEmptyBuckets())
  const pending = reactive(createEmptyBuckets())
  const completed = reactive(createEmptyBuckets())

  const isLoading = ref(false)
  const lastFetchTime = ref(null)
  const error = ref(null)

  // Realtime subscription
  const realtimeChannel = ref(null)
  const isRealtimeActive = ref(false)

  // Event callbacks for realtime updates
  const realtimeCallbacks = {
    onTransactionReceived: null,
    onTransactionAccepted: null,
    onTransactionCompleted: null,
    onTransactionRejected: null,
    onTransactionCancelled: null
  }

  const allConfirmingTransactions = computed(() => {
    return [
      ...confirming.giver.map(t => ({ ...t, role: 'giver' })),
      ...confirming.receiver.map(t => ({ ...t, role: 'receiver' }))
    ]
  })

  const allPendingTransactions = computed(() => {
    return [
      ...pending.giver.map(t => ({ ...t, role: 'giver' })),
      ...pending.receiver.map(t => ({ ...t, role: 'receiver' }))
    ]
  })

  const allCompletedTransactions = computed(() => {
    return [
      ...completed.giver.map(t => ({ ...t, role: 'giver' })),
      ...completed.receiver.map(t => ({ ...t, role: 'receiver' }))
    ]
  })

  const itemToTransactionMap = computed(() => {
    const map = new Map()

    function addTransactions(transactions, status, role) {
      transactions.forEach(transaction => {
        if (!transaction?.item_id) return
        map.set(transaction.item_id, {
          status,
          role,
          transactionId: transaction.transaction_id,
          transaction
        })
      })
    }

    addTransactions(confirming.giver, STATUS_MAP.confirming, 'giver')
    addTransactions(confirming.receiver, STATUS_MAP.confirming, 'receiver')
    addTransactions(pending.giver, STATUS_MAP.pending, 'giver')
    addTransactions(pending.receiver, STATUS_MAP.pending, 'receiver')
    addTransactions(completed.giver, STATUS_MAP.completed, 'giver')
    addTransactions(completed.receiver, STATUS_MAP.completed, 'receiver')
    
    return map
  })

  const hasFreshData = computed(() => {
    if (!lastFetchTime.value) return false
    return Date.now() - lastFetchTime.value < CACHE_TTL
  })

  let activeRequest = null
  let realtimeRefreshTimeout = null
  let lastRealtimeRefreshReason = null

  async function fetchAllTransactions(forceRefresh = false) {
    console.log('[TransactionStore] fetchAllTransactions called', {
      forceRefresh,
      hasFreshData: hasFreshData.value,
      lastFetch: lastFetchTime.value
    })

    if (!forceRefresh && hasFreshData.value && !error.value) {
      console.log('[TransactionStore] Using cached transactions')
      return
    }

    if (activeRequest) {
      console.log('[TransactionStore] Reusing active fetch request')
      return activeRequest
    }

    isLoading.value = true
    error.value = null

    activeRequest = Promise.all([
      getMyTransactionsByStatus('confirming', 'giver').catch(() => []),
      getMyTransactionsByStatus('confirming', 'receiver').catch(() => []),
      getMyTransactionsByStatus('pending', 'giver').catch(() => []),
      getMyTransactionsByStatus('pending', 'receiver').catch(() => []),
      getMyTransactionsByStatus('completed', 'giver').catch(() => []),
      getMyTransactionsByStatus('completed', 'receiver').catch(() => [])
    ])
      .then(([
        confirmingGiver,
        confirmingReceiver,
        pendingGiver,
        pendingReceiver,
        completedGiver,
        completedReceiver
      ]) => {
        console.log('[TransactionStore] Transactions fetched', {
          confirmingGiver: confirmingGiver?.length,
          confirmingReceiver: confirmingReceiver?.length,
          pendingGiver: pendingGiver?.length,
          pendingReceiver: pendingReceiver?.length,
          completedGiver: completedGiver?.length,
          completedReceiver: completedReceiver?.length
        })
        confirming.giver = normalizeBucketPayload(confirmingGiver)
        confirming.receiver = normalizeBucketPayload(confirmingReceiver)
        pending.giver = normalizeBucketPayload(pendingGiver)
        pending.receiver = normalizeBucketPayload(pendingReceiver)
        completed.giver = normalizeBucketPayload(completedGiver)
        completed.receiver = normalizeBucketPayload(completedReceiver)
        lastFetchTime.value = Date.now()
      })
      .catch(err => {
        console.error('[TransactionStore] Failed to fetch transactions:', err)
        error.value = err
        throw err
      })
      .finally(() => {
        isLoading.value = false
        activeRequest = null
      })

    return activeRequest
  }

  function queueRealtimeRefresh(reason) {
    lastRealtimeRefreshReason = reason
    if (realtimeRefreshTimeout) {
      return
    }

    realtimeRefreshTimeout = setTimeout(() => {
      realtimeRefreshTimeout = null
      const context = lastRealtimeRefreshReason
      console.log('[TransactionStore] Forcing transaction refetch after realtime event', { context })
      fetchAllTransactions(true).catch((err) => {
        console.error('[TransactionStore] Failed to refresh transactions after realtime event', err)
      })
    }, 200)
  }

  function findIndex(bucket, role, transactionId) {
    const list = bucket[role]
    if (!Array.isArray(list)) return -1
    return list.findIndex(t => t.transaction_id === transactionId)
  }

  function moveTransaction(transactionId, fromBucket, toBucket, role, nextStatus) {
    const sourceList = fromBucket[role]
    if (!Array.isArray(sourceList)) return null

    const index = findIndex(fromBucket, role, transactionId)
    if (index === -1) return null

    const [transaction] = sourceList.splice(index, 1)
    if (transaction) {
      transaction.status = nextStatus
      toBucket[role] = [transaction, ...toBucket[role]]
    }
    return transaction || null
  }

  function confirmTransaction(transactionId, role = 'receiver') {
    return moveTransaction(transactionId, confirming, pending, role, 'pending')
  }

  function completeTransaction(transactionId, role = 'receiver') {
    const transaction = moveTransaction(transactionId, pending, completed, role, 'completed')
    if (transaction) {
      transaction.completed_at = new Date().toISOString()
    }
    return transaction
  }

  function upsertTransaction(transaction, status, role) {
    if (!transaction || !role || !STATUS_MAP[status]) return

    const targetBucket = status === 'confirming' ? confirming
      : status === 'pending' ? pending
      : completed

    const list = targetBucket[role]
    if (!Array.isArray(list)) return

    const existingIndex = list.findIndex(t => t.transaction_id === transaction.transaction_id)
    if (existingIndex !== -1) {
      list.splice(existingIndex, 1, transaction)
    } else {
      list.unshift(transaction)
    }
  }

  function clearAll() {
    confirming.giver = []
    confirming.receiver = []
    pending.giver = []
    pending.receiver = []
    completed.giver = []
    completed.receiver = []
    lastFetchTime.value = null
    error.value = null
  }

  function getTransactionByItem(itemId) {
    if (!itemId) return null
    return itemToTransactionMap.value.get(itemId) || null
  }

  /**
   * Start listening to real-time transaction updates
   */
  function startRealtime(userId) {
    if (!userId) {
      console.warn('[TransactionStore] Cannot start realtime without userId')
      return
    }

    if (isRealtimeActive.value) {
      console.log('[TransactionStore] Realtime already active')
      return
    }

    console.log('[TransactionStore] Starting realtime for user:', userId)

    const channelName = `transaction-updates-${userId}`
    const channel = supabase.channel(channelName)

    const registerListener = (filter) => {
      console.log('[TransactionStore] Registering realtime listener with filter:', filter)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter
        },
        (payload) => {
          console.log('[TransactionStore] Realtime event:', payload)
          handleRealtimeUpdate(payload, userId)
        }
      )
    }

  // Listen separately for giver (seller) and receiver (buyer) roles
  registerListener(`giver_id=eq.${userId}`)
  registerListener(`receiver_id=eq.${userId}`)

    realtimeChannel.value = channel.subscribe((status) => {
      console.log('[TransactionStore] Realtime status:', status)
      if (status === 'SUBSCRIBED') {
        isRealtimeActive.value = true
      }
    })
  }

  /**
   * Handle real-time transaction updates
   */
  function handleRealtimeUpdate(payload, userId) {
    const { eventType, new: newRecord, old: oldRecord } = payload

    const newTransaction = normalizeRealtimeTransaction(newRecord)
    const oldTransaction = normalizeRealtimeTransaction(oldRecord, newTransaction?.status)

    console.log('[TransactionStore] Handling realtime payload', {
      eventType,
      transactionId: newTransaction?.transaction_id ?? oldTransaction?.transaction_id,
      oldStatus: oldTransaction?.status,
      newStatus: newTransaction?.status
    })

    try {
      // INSERT - New transaction created
      if (eventType === 'INSERT') {
        const transaction = normalizeRealtimeTransaction(newRecord, 'confirming')
        const role = transaction.giver_id === userId ? 'giver' : 'receiver'

        console.log('[TransactionStore] INSERT event processed', { transaction, role })

        // Add to confirming bucket
        upsertTransaction(transaction, 'confirming', role)
        queueRealtimeRefresh('realtime-insert')

        // Trigger callback if seller (receiving request)
        if (role === 'receiver') {
          realtimeCallbacks.onTransactionReceived?.(transaction)
        }
      }

      // UPDATE - Transaction status changed
      else if (eventType === 'UPDATE') {
        const transaction = newTransaction
        const oldStatus = oldTransaction?.status
        const newStatus = transaction?.status
        const role = transaction?.giver_id === userId ? 'giver' : 'receiver'

        const transactionId = transaction?.transaction_id ?? oldTransaction?.transaction_id

        console.log('[TransactionStore] UPDATE event processed', {
          transactionId,
          oldStatus,
          newStatus,
          role
        })

        if (!transactionId) {
          console.warn('[TransactionStore] Missing transaction ID in realtime update, skipping')
          return
        }

        if (newStatus === 'confirming') {
          upsertTransaction(transaction, 'confirming', role)
          queueRealtimeRefresh('realtime-update-confirming')
          if (role === 'receiver') {
            realtimeCallbacks.onTransactionReceived?.(transaction)
          }
          return
        }

        // Handle status transitions
        if (oldStatus === 'confirming' && newStatus === 'pending') {
          // Move from confirming to pending
          const moved = moveTransaction(
            transactionId,
            confirming,
            pending,
            role,
            'pending'
          )
          if (moved && role === 'giver') {
            realtimeCallbacks.onTransactionAccepted?.(transaction)
          }
          if (moved) {
            queueRealtimeRefresh('realtime-update-pending')
          }
        }
        else if (newStatus === 'completed') {
          // Move to completed
          const moved = moveTransaction(
            transactionId,
            pending,
            completed,
            role,
            'completed'
          )
          if (moved) {
            realtimeCallbacks.onTransactionCompleted?.(transaction)
          }
          if (moved) {
            queueRealtimeRefresh('realtime-update-completed')
          }
        }
        else if (newStatus === 'rejected') {
          // Remove from confirming
          const list = confirming[role]
          const index = findIndex(confirming, role, transaction.transaction_id)
          if (index !== -1 && Array.isArray(list)) {
            list.splice(index, 1)
            queueRealtimeRefresh('realtime-update-rejected')
          }
          if (role === 'giver') {
            realtimeCallbacks.onTransactionRejected?.(transaction)
          }
        }
        else if (newStatus === 'cancelled') {
          // Remove from appropriate bucket
          let removed = false
          for (const bucket of [confirming, pending]) {
            const list = bucket[role]
            const index = findIndex(bucket, role, transactionId)
            if (index !== -1) {
              list.splice(index, 1)
              removed = true
              break
            }
          }
          if (removed) {
            realtimeCallbacks.onTransactionCancelled?.(transaction)
            queueRealtimeRefresh('realtime-update-cancelled')
          }
        }
      }
      else if (eventType === 'DELETE') {
        const transactionId = oldTransaction?.transaction_id
        const role = oldTransaction?.giver_id === userId
          ? 'giver'
          : oldTransaction?.receiver_id === userId
            ? 'receiver'
            : null

        if (transactionId && role) {
          let removed = false
          for (const bucket of [confirming, pending, completed]) {
            const list = bucket[role]
            const index = findIndex(bucket, role, transactionId)
            if (index !== -1) {
              list.splice(index, 1)
              removed = true
            }
          }
          if (removed) {
            queueRealtimeRefresh('realtime-delete')
          }
        }
      }
    } catch (err) {
      console.error('[TransactionStore] Error handling realtime update:', err)
    }
  }

  /**
   * Stop listening to real-time updates
   */
  async function stopRealtime() {
    if (realtimeChannel.value) {
      console.log('[TransactionStore] Stopping realtime')
      await supabase.removeChannel(realtimeChannel.value)
      realtimeChannel.value = null
      isRealtimeActive.value = false
    }
    if (realtimeRefreshTimeout) {
      clearTimeout(realtimeRefreshTimeout)
      realtimeRefreshTimeout = null
    }
  }

  /**
   * Set callback handlers for realtime events
   */
  function setRealtimeCallbacks(callbacks) {
    Object.assign(realtimeCallbacks, callbacks)
  }

  return {
    confirming,
    pending,
    completed,
    isLoading,
    lastFetchTime,
    error,
    isRealtimeActive,
    allConfirmingTransactions,
    allPendingTransactions,
    allCompletedTransactions,
    itemToTransactionMap,
    hasFreshData,
    fetchAllTransactions,
    confirmTransaction,
    completeTransaction,
    upsertTransaction,
    clearAll,
    getTransactionByItem,
    startRealtime,
    stopRealtime,
    setRealtimeCallbacks
  }
})
