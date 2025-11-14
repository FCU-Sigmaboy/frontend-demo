import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { getMyTransactionsByStatus } from '@/api/transaction_before_meetAPI'

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

export const useTransactionStore = defineStore('transaction', () => {
  const confirming = reactive(createEmptyBuckets())
  const pending = reactive(createEmptyBuckets())
  const completed = reactive(createEmptyBuckets())

  const isLoading = ref(false)
  const lastFetchTime = ref(null)
  const error = ref(null)

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

  async function fetchAllTransactions(forceRefresh = false) {
    if (!forceRefresh && hasFreshData.value && !error.value) {
      return
    }

    if (activeRequest) {
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

  return {
    confirming,
    pending,
    completed,
    isLoading,
    lastFetchTime,
    error,
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
    getTransactionByItem
  }
})
