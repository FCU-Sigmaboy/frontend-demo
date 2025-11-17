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

  // Helper to merge giver/receiver transactions with role labels
  const mergeWithRoles = (bucket) => [
    ...bucket.giver.map(t => ({ ...t, role: 'giver' })),
    ...bucket.receiver.map(t => ({ ...t, role: 'receiver' }))
  ]

  const STATUS_BUCKETS = { confirming, pending, completed }

  const allConfirmingTransactions = computed(() => mergeWithRoles(confirming))
  const allPendingTransactions = computed(() => mergeWithRoles(pending))
  const allCompletedTransactions = computed(() => mergeWithRoles(completed))

  const itemToTransactionMap = computed(() => {
    const map = new Map()

    const addTransactions = (transactions, status, role) => {
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

    // Iterate through all status/role combinations
    Object.entries(STATUS_BUCKETS).forEach(([statusKey, bucket]) => {
      const dbStatus = STATUS_MAP[statusKey]
      Object.entries(bucket).forEach(([role, transactions]) => {
        addTransactions(transactions, dbStatus, role)
      })
    })

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

    const statuses = ['confirming', 'pending', 'completed']
    const roles = ['giver', 'receiver']
    const buckets = { confirming, pending, completed }

    // Generate all combinations of status x role
    const fetchPromises = statuses.flatMap(status =>
      roles.map(role => getMyTransactionsByStatus(status, role).catch(() => []))
    )

    activeRequest = Promise.all(fetchPromises)
      .then((results) => {
        const logData = {}
        let index = 0

        // Assign results to buckets
        statuses.forEach(status => {
          roles.forEach(role => {
            const data = results[index++]
            buckets[status][role] = normalizeBucketPayload(data)
            logData[`${status}${role.charAt(0).toUpperCase() + role.slice(1)}`] = data?.length
          })
        })

        console.log('[TransactionStore] Transactions fetched', logData)
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

  function queueRealtimeRefresh(reason, status = null, role = null) {
    lastRealtimeRefreshReason = reason
    if (realtimeRefreshTimeout) {
      return
    }

    realtimeRefreshTimeout = setTimeout(() => {
      realtimeRefreshTimeout = null
      const context = lastRealtimeRefreshReason

      // If specific status/role provided, only fetch that combination
      if (status && role) {
        console.log('[TransactionStore] Fetching specific transaction bucket after realtime event', {
          context, status, role
        })
        fetchTransactionBucket(status, role).catch((err) => {
          console.error('[TransactionStore] Failed to refresh transaction bucket after realtime event', err)
        })
      } else {
        console.log('[TransactionStore] Forcing full transaction refetch after realtime event', { context })
        fetchAllTransactions(true).catch((err) => {
          console.error('[TransactionStore] Failed to refresh transactions after realtime event', err)
        })
      }
    }, 200)
  }

  async function fetchTransactionBucket(status, role) {
    if (!STATUS_MAP[status] || !['giver', 'receiver'].includes(role)) {
      console.warn('[TransactionStore] Invalid status or role for bucket fetch', { status, role })
      return
    }

    try {
      const data = await getMyTransactionsByStatus(status, role)
      const bucket = STATUS_BUCKETS[status]
      if (bucket) {
        bucket[role] = normalizeBucketPayload(data)
        console.log(`[TransactionStore] Updated ${status}.${role}`, { count: data?.length })
      }
    } catch (err) {
      console.error(`[TransactionStore] Failed to fetch ${status}.${role}:`, err)
      throw err
    }
  }

  function findIndex(bucket, role, transactionId) {
    const list = bucket[role]
    if (!Array.isArray(list)) return -1
    return list.findIndex(t => t.transaction_id === transactionId)
  }

  function removeTransactionFromBuckets(transactionId, role, buckets) {
    for (const bucket of buckets) {
      const index = findIndex(bucket, role, transactionId)
      if (index !== -1) {
        bucket[role].splice(index, 1)
        return true
      }
    }
    return false
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

    const targetBucket = STATUS_BUCKETS[status]
    const list = targetBucket?.[role]
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

        // Fetch fresh data and trigger callback with complete transaction info
        if (role === 'receiver') {
          fetchTransactionBucket('confirming', role)
            .then(() => {
              // Find the transaction in the refreshed bucket
              const fullTransaction = confirming[role].find(t => t.transaction_id === transaction.transaction_id)
              if (fullTransaction) {
                realtimeCallbacks.onTransactionReceived?.(fullTransaction)
              }
            })
            .catch(err => {
              console.error('[TransactionStore] Failed to fetch full transaction after insert', err)
              // Fallback: use basic transaction data
              realtimeCallbacks.onTransactionReceived?.(transaction)
            })
        } else {
          // Only refresh the confirming bucket for giver role
          queueRealtimeRefresh('realtime-insert', 'confirming', role)
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

          if (role === 'receiver') {
            // Fetch fresh data and trigger callback with complete info
            fetchTransactionBucket('confirming', role)
              .then(() => {
                const fullTransaction = confirming[role].find(t => t.transaction_id === transactionId)
                if (fullTransaction) {
                  realtimeCallbacks.onTransactionReceived?.(fullTransaction)
                }
              })
              .catch(err => {
                console.error('[TransactionStore] Failed to fetch full transaction', err)
                realtimeCallbacks.onTransactionReceived?.(transaction)
              })
          } else {
            queueRealtimeRefresh('realtime-update-confirming', 'confirming', role)
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
          console.log('[TransactionStore] Transaction accepted (confirming → pending)', {
            moved,
            role,
            willShowToast: moved && role === 'giver'
          })
          if (moved && role === 'giver') {
            // Fetch fresh data to get complete transaction info
            fetchTransactionBucket('pending', role)
              .then(() => {
                const fullTransaction = pending[role].find(t => t.transaction_id === transactionId)
                console.log('[TransactionStore] Triggering onTransactionAccepted callback', { fullTransaction })
                if (fullTransaction) {
                  realtimeCallbacks.onTransactionAccepted?.(fullTransaction)
                }
              })
              .catch(err => {
                console.error('[TransactionStore] Failed to fetch full transaction', err)
                realtimeCallbacks.onTransactionAccepted?.(transaction)
              })
          } else if (moved) {
            queueRealtimeRefresh('realtime-update-pending', 'pending', role)
          }
        }
        // Handle case where realtime event arrives after DB update (old and new both 'pending')
        else if (oldStatus === 'pending' && newStatus === 'pending' && role === 'giver') {
          // Check if transaction was in confirming bucket (just moved)
          const wasInConfirming = findIndex(confirming, role, transactionId) !== -1
          const isInPending = findIndex(pending, role, transactionId) !== -1

          console.log('[TransactionStore] Received pending→pending update', {
            transactionId,
            wasInConfirming,
            isInPending,
            role
          })

          // If not in pending bucket yet, this is a new acceptance
          if (!isInPending) {
            // Remove from confirming if exists
            if (wasInConfirming) {
              const index = findIndex(confirming, role, transactionId)
              confirming[role].splice(index, 1)
            }

            // Fetch fresh data and show toast
            fetchTransactionBucket('pending', role)
              .then(() => {
                const fullTransaction = pending[role].find(t => t.transaction_id === transactionId)
                console.log('[TransactionStore] Triggering onTransactionAccepted callback (late arrival)', { fullTransaction })
                if (fullTransaction) {
                  realtimeCallbacks.onTransactionAccepted?.(fullTransaction)
                }
              })
              .catch(err => {
                console.error('[TransactionStore] Failed to fetch full transaction', err)
              })
          } else {
            // Just a regular update, refresh the bucket
            queueRealtimeRefresh('realtime-update-pending', 'pending', role)
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
            // Fetch fresh data to get complete transaction info
            fetchTransactionBucket('completed', role)
              .then(() => {
                const fullTransaction = completed[role].find(t => t.transaction_id === transactionId)
                if (fullTransaction) {
                  realtimeCallbacks.onTransactionCompleted?.(fullTransaction)
                }
              })
              .catch(err => {
                console.error('[TransactionStore] Failed to fetch full transaction', err)
                realtimeCallbacks.onTransactionCompleted?.(transaction)
              })
          }
        }
        else if (newStatus === 'rejected') {
          // Remove from confirming
          const list = confirming[role]
          const index = findIndex(confirming, role, transaction.transaction_id)
          if (index !== -1 && Array.isArray(list)) {
            const [removedTransaction] = list.splice(index, 1)
            if (role === 'giver') {
              // Use the transaction we just removed (which has full info)
              realtimeCallbacks.onTransactionRejected?.(removedTransaction || transaction)
            }
            // Refresh confirming bucket for this role (transaction removed)
            queueRealtimeRefresh('realtime-update-rejected', 'confirming', role)
          }
        }
        else if (newStatus === 'cancelled') {
          // Find and remove transaction, keeping the full data
          let removedTransaction = null
          for (const bucket of [confirming, pending]) {
            const index = findIndex(bucket, role, transactionId)
            if (index !== -1) {
              [removedTransaction] = bucket[role].splice(index, 1)
              break
            }
          }
          if (removedTransaction) {
            realtimeCallbacks.onTransactionCancelled?.(removedTransaction)
            // Could be in either confirming or pending, do full refresh for safety
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
          const removed = removeTransactionFromBuckets(transactionId, role, [confirming, pending, completed])
          if (removed) {
            // Could be in any bucket, do full refresh for safety
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
