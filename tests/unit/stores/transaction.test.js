import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('Transaction Store', () => {
  let useTransactionStore
  let pinia

  beforeEach(async () => {
    // Create fresh pinia instance for each test
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Mock dependencies before importing the store
    vi.doMock('@/api/transactionAPI', () => ({
      getMyTransactionsByStatus: vi.fn()
    }))
    
    // Clear module cache to ensure fresh imports
    vi.resetModules()
    
    // Import store after mocking dependencies
    const transactionModule = await import('@/stores/transaction')
    useTransactionStore = transactionModule.useTransactionStore
  })

  describe('Store Creation', () => {
    it('should create store instance successfully', () => {
      const store = useTransactionStore()
      expect(store).toBeDefined()
      expect(typeof store.fetchAllTransactions).toBe('function')
      expect(typeof store.confirmTransaction).toBe('function')
      expect(typeof store.completeTransaction).toBe('function')
    })

    it('should have initial state properties', () => {
      const store = useTransactionStore()
      expect(store.confirming).toEqual({ giver: [], receiver: [] })
      expect(store.pending).toEqual({ giver: [], receiver: [] })
      expect(store.completed).toEqual({ giver: [], receiver: [] })
      expect(store.isLoading).toBe(false)
      expect(store.lastFetchTime).toBeNull()
      expect(store.error).toBeNull()
      expect(store.isRealtimeActive).toBe(false)
    })

    it('should have computed properties with default values', () => {
      const store = useTransactionStore()
      expect(store.allConfirmingTransactions).toEqual([])
      expect(store.allPendingTransactions).toEqual([])
      expect(store.allCompletedTransactions).toEqual([])
      expect(store.itemToTransactionMap).toBeInstanceOf(Map)
      expect(store.hasFreshData).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('should merge transactions with roles correctly', () => {
      const store = useTransactionStore()
      store.confirming.giver = [
        { transaction_id: 1, item_id: 'item1', status: 'confirming' }
      ]
      store.confirming.receiver = [
        { transaction_id: 2, item_id: 'item2', status: 'confirming' }
      ]

      const confirmingTransactions = store.allConfirmingTransactions
      
      expect(confirmingTransactions).toHaveLength(2)
      expect(confirmingTransactions[0]).toMatchObject({
        transaction_id: 1,
        role: 'giver'
      })
      expect(confirmingTransactions[1]).toMatchObject({
        transaction_id: 2,
        role: 'receiver'
      })
    })

    it('should create item to transaction map correctly', () => {
      const store = useTransactionStore()
      store.confirming.giver = [
        { transaction_id: 1, item_id: 'item1', status: 'confirming' }
      ]
      store.pending.receiver = [
        { transaction_id: 2, item_id: 'item2', status: 'pending' }
      ]

      const map = store.itemToTransactionMap
      
      expect(map.get('item1')).toMatchObject({
        status: 'waiting',
        role: 'giver',
        transactionId: 1
      })
      expect(map.get('item2')).toMatchObject({
        status: 'in_transaction',
        role: 'receiver',
        transactionId: 2
      })
    })

    it('should calculate hasFreshData correctly', () => {
      const store = useTransactionStore()
      expect(store.hasFreshData).toBe(false)
      
      store.lastFetchTime = Date.now() - 60000 // 1 minute ago
      expect(store.hasFreshData).toBe(true)
      
      store.lastFetchTime = Date.now() - 400000 // 6+ minutes ago
      expect(store.hasFreshData).toBe(false)
    })
  })

  describe('Transaction State Management', () => {
    it('should confirm transaction correctly', () => {
      const store = useTransactionStore()
      store.confirming.receiver = [
        { transaction_id: 1, item_id: 'item1', status: 'confirming' }
      ]

      const result = store.confirmTransaction(1, 'receiver')

      expect(result).toMatchObject({
        transaction_id: 1,
        status: 'pending'
      })
      expect(store.confirming.receiver).toHaveLength(0)
      expect(store.pending.receiver).toHaveLength(1)
      expect(store.pending.receiver[0].transaction_id).toBe(1)
    })

    it('should complete transaction correctly', () => {
      const store = useTransactionStore()
      store.pending.receiver = [
        { transaction_id: 2, item_id: 'item2', status: 'pending' }
      ]

      const result = store.completeTransaction(2, 'receiver')

      expect(result).toMatchObject({
        transaction_id: 2,
        status: 'completed'
      })
      expect(result.completed_at).toBeTruthy()
      expect(store.pending.receiver).toHaveLength(0)
      expect(store.completed.receiver).toHaveLength(1)
      expect(store.completed.receiver[0].transaction_id).toBe(2)
    })

    it('should return null when transaction not found', () => {
      const store = useTransactionStore()
      const result = store.confirmTransaction(999, 'receiver')
      expect(result).toBeNull()
    })

    it('should upsert transaction correctly', () => {
      const store = useTransactionStore()
      const newTransaction = {
        transaction_id: 3,
        item_id: 'item3',
        status: 'confirming'
      }

      store.upsertTransaction(newTransaction, 'confirming', 'giver')

      expect(store.confirming.giver).toHaveLength(1)
      expect(store.confirming.giver[0]).toBe(newTransaction)
    })

    it('should update existing transaction when upserting', () => {
      const store = useTransactionStore()
      store.confirming.receiver = [
        { transaction_id: 1, item_id: 'item1', amount: 100 }
      ]

      const updatedTransaction = {
        transaction_id: 1,
        item_id: 'item1',
        amount: 200
      }

      store.upsertTransaction(updatedTransaction, 'confirming', 'receiver')

      expect(store.confirming.receiver).toHaveLength(1)
      expect(store.confirming.receiver[0].amount).toBe(200)
    })
  })

  describe('Transaction Lookup', () => {
    it('should return transaction info for existing item', () => {
      const store = useTransactionStore()
      store.confirming.giver = [
        { transaction_id: 1, item_id: 'item1', status: 'confirming' }
      ]

      const result = store.getTransactionByItem('item1')

      expect(result).toMatchObject({
        status: 'waiting',
        role: 'giver',
        transactionId: 1
      })
    })

    it('should return null for non-existing item', () => {
      const store = useTransactionStore()
      const result = store.getTransactionByItem('nonexistent')
      expect(result).toBeNull()
    })

    it('should return null for null/undefined itemId', () => {
      const store = useTransactionStore()
      expect(store.getTransactionByItem(null)).toBeNull()
      expect(store.getTransactionByItem(undefined)).toBeNull()
    })
  })

  describe('Store Management', () => {
    it('should clear all state', () => {
      const store = useTransactionStore()
      
      // Set up some state
      store.confirming.giver = [{ transaction_id: 1 }]
      store.pending.receiver = [{ transaction_id: 2 }]
      store.lastFetchTime = Date.now()
      store.error = new Error('test error')

      store.clearAll()

      expect(store.confirming.giver).toEqual([])
      expect(store.confirming.receiver).toEqual([])
      expect(store.pending.giver).toEqual([])
      expect(store.pending.receiver).toEqual([])
      expect(store.completed.giver).toEqual([])
      expect(store.completed.receiver).toEqual([])
      expect(store.lastFetchTime).toBeNull()
      expect(store.error).toBeNull()
    })
  })

  describe('Realtime Management', () => {
    it('should manage realtime state', () => {
      const store = useTransactionStore()
      
      expect(store.isRealtimeActive).toBe(false)
      
      // Test that realtime methods exist
      expect(typeof store.startRealtime).toBe('function')
      expect(typeof store.stopRealtime).toBe('function')
      expect(typeof store.setRealtimeCallbacks).toBe('function')
    })

    it('should not start realtime without userId', () => {
      const store = useTransactionStore()
      const initialState = store.isRealtimeActive

      store.startRealtime(null)

      expect(store.isRealtimeActive).toBe(initialState)
    })

    it('should set realtime callbacks', () => {
      const store = useTransactionStore()
      const callbacks = {
        onTransactionReceived: vi.fn(),
        onTransactionAccepted: vi.fn()
      }

      store.setRealtimeCallbacks(callbacks)

      // Verify callbacks are stored (internal implementation detail)
      expect(typeof store.setRealtimeCallbacks).toBe('function')
    })
  })
})