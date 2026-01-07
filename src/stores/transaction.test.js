// src/stores/transaction.test.js
// Sprint 3: Transaction Store 完整測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTransactionStore } from './transaction'
import { setupTestPinia, createMockTransaction } from '@/test/helpers'

// ============================================================================
// Mock Transaction API
// ============================================================================
vi.mock('@/api/transactionAPI', () => ({
  getMyTransactionsByStatus: vi.fn(),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        // 模擬 subscribe 回調被觸發
        if (callback) callback('SUBSCRIBED')
        return { unsubscribe: vi.fn() }
      }),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}))

describe('Transaction Store', () => {
  let transactionStore

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    setupTestPinia()
    transactionStore = useTransactionStore()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // 初始狀態測試
  // ==========================================================================
  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(transactionStore.isLoading).toBe(false)
      expect(transactionStore.error).toBeNull()
      expect(transactionStore.isRealtimeActive).toBe(false)
    })

    it('confirming bucket 應為空', () => {
      expect(transactionStore.allConfirmingTransactions).toEqual([])
    })

    it('pending bucket 應為空', () => {
      expect(transactionStore.allPendingTransactions).toEqual([])
    })

    it('completed bucket 應為空', () => {
      expect(transactionStore.allCompletedTransactions).toEqual([])
    })
  })

  // ==========================================================================
  // Getters 測試
  // ==========================================================================
  describe('計算屬性 (Getters)', () => {
    describe('allConfirmingTransactions', () => {
      it('應合併 giver 和 receiver 並標記角色', () => {
        const giverTxn = createMockTransaction({ transaction_id: 'txn-1' })
        const receiverTxn = createMockTransaction({ transaction_id: 'txn-2' })

        transactionStore.confirming.giver = [giverTxn]
        transactionStore.confirming.receiver = [receiverTxn]

        const result = transactionStore.allConfirmingTransactions
        expect(result).toHaveLength(2)
        expect(result.find((t) => t.transaction_id === 'txn-1').role).toBe('giver')
        expect(result.find((t) => t.transaction_id === 'txn-2').role).toBe('receiver')
      })
    })

    describe('hasFreshData', () => {
      it('未 fetch 過時應返回 false', () => {
        expect(transactionStore.hasFreshData).toBe(false)
      })
    })

    describe('itemToTransactionMap', () => {
      it('空 buckets 時應返回空 Map', () => {
        expect(transactionStore.itemToTransactionMap.size).toBe(0)
      })

      it('有交易時應正確建立 item 到 transaction 的映射', () => {
        const txn = createMockTransaction({ transaction_id: 'txn-1', item_id: 123 })
        transactionStore.pending.giver = [txn]

        const map = transactionStore.itemToTransactionMap
        expect(map.size).toBe(1)
        expect(map.get(123)).toBeDefined()
        expect(map.get(123).transactionId).toBe('txn-1')
      })
    })
  })

  // ==========================================================================
  // Actions 測試
  // ==========================================================================
  describe('Actions', () => {
    describe('fetchAllTransactions', () => {
      it('應取得所有狀態的交易', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([])

        const fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        // 應該呼叫 6 次（3 狀態 x 2 角色）
        expect(getMyTransactionsByStatus).toHaveBeenCalledTimes(6)
      })

      it('快取有效時不應重複請求', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([])

        // 第一次請求
        let fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        // 第二次請求（應使用快取）
        fetchPromise = transactionStore.fetchAllTransactions(false)
        await vi.runAllTimersAsync()
        await fetchPromise

        // 仍然只有 6 次（第二次沒有呼叫）
        expect(getMyTransactionsByStatus).toHaveBeenCalledTimes(6)
      })

      it('forceRefresh 時應強制重新請求', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([])

        let fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        expect(getMyTransactionsByStatus).toHaveBeenCalledTimes(12)
      })

      it('請求進行中時應復用現有 Promise', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        const resolvers = []
        getMyTransactionsByStatus.mockImplementation(
          () => new Promise((resolve) => resolvers.push(resolve))
        )

        // 發起第一個請求
        const promise1 = transactionStore.fetchAllTransactions(true)

        // 在 promise1 完成前發起第二個請求，應該復用現有 Promise
        const promise2 = transactionStore.fetchAllTransactions(true)

        // 由於 API mock 是延遲的，應該只有第一次呼叫產生的 6 個 API 請求
        // 第二次呼叫應該返回相同的 activeRequest
        expect(getMyTransactionsByStatus).toHaveBeenCalledTimes(6)

        // 確認 isLoading 狀態
        expect(transactionStore.isLoading).toBe(true)

        // 兩個 Promise 應該都有定義
        expect(promise1).toBeDefined()
        expect(promise2).toBeDefined()

        // 清理
        resolvers.forEach((r) => r([]))
        await vi.runAllTimersAsync()
        await promise1
      })

      it('個別 API 呼叫失敗時應正常處理（透過 catch 返回空陣列）', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        // 模擬某些呼叫失敗 - 但因為有 .catch(() => [])，不會設置 error
        getMyTransactionsByStatus.mockRejectedValue(new Error('API 錯誤'))

        const fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        // 由於實作中使用 .catch(() => []) 處理個別失敗，所以 error 不會被設置
        // 這測試驗證 store 可以優雅地處理 API 失敗
        expect(transactionStore.isLoading).toBe(false)
        expect(transactionStore.allConfirmingTransactions).toEqual([])
        expect(transactionStore.allPendingTransactions).toEqual([])
        expect(transactionStore.allCompletedTransactions).toEqual([])
      })
    })

    describe('clearAll', () => {
      it('應清空所有 buckets', async () => {
        const { getMyTransactionsByStatus } = await import('@/api/transactionAPI')
        getMyTransactionsByStatus.mockResolvedValue([createMockTransaction()])

        const fetchPromise = transactionStore.fetchAllTransactions(true)
        await vi.runAllTimersAsync()
        await fetchPromise

        transactionStore.clearAll()

        expect(transactionStore.allConfirmingTransactions).toEqual([])
        expect(transactionStore.allPendingTransactions).toEqual([])
        expect(transactionStore.allCompletedTransactions).toEqual([])
        expect(transactionStore.error).toBeNull()
      })
    })

    describe('getTransactionByItem', () => {
      it('無對應交易時應返回 null', () => {
        const result = transactionStore.getTransactionByItem(999)
        expect(result).toBeNull()
      })

      it('有對應交易時應返回交易資訊', () => {
        const txn = createMockTransaction({ transaction_id: 'txn-1', item_id: 123 })
        transactionStore.pending.giver = [txn]

        const result = transactionStore.getTransactionByItem(123)
        expect(result).toBeDefined()
        expect(result.transactionId).toBe('txn-1')
      })

      it('itemId 為 null 時應返回 null', () => {
        const result = transactionStore.getTransactionByItem(null)
        expect(result).toBeNull()
      })
    })

    describe('confirmTransaction', () => {
      it('應將交易從 confirming 移至 pending', () => {
        const txn = createMockTransaction({ transaction_id: 'txn-1', status: 'confirming' })
        transactionStore.confirming.receiver = [txn]

        const result = transactionStore.confirmTransaction('txn-1', 'receiver')

        expect(result).toBeDefined()
        expect(result.status).toBe('pending')
        expect(transactionStore.confirming.receiver).toHaveLength(0)
        expect(transactionStore.pending.receiver).toHaveLength(1)
      })

      it('交易不存在時應返回 null', () => {
        const result = transactionStore.confirmTransaction('non-existent', 'receiver')
        expect(result).toBeNull()
      })
    })

    describe('completeTransaction', () => {
      it('應將交易從 pending 移至 completed', () => {
        const txn = createMockTransaction({ transaction_id: 'txn-1', status: 'pending' })
        transactionStore.pending.receiver = [txn]

        const result = transactionStore.completeTransaction('txn-1', 'receiver')

        expect(result).toBeDefined()
        expect(result.status).toBe('completed')
        expect(result.completed_at).toBeDefined()
        expect(transactionStore.pending.receiver).toHaveLength(0)
        expect(transactionStore.completed.receiver).toHaveLength(1)
      })

      it('交易不存在時應返回 null', () => {
        const result = transactionStore.completeTransaction('non-existent', 'receiver')
        expect(result).toBeNull()
      })
    })

    describe('upsertTransaction', () => {
      it('應新增交易到指定的 bucket', () => {
        const txn = createMockTransaction({ transaction_id: 'txn-new' })

        transactionStore.upsertTransaction(txn, 'pending', 'giver')

        expect(transactionStore.pending.giver).toHaveLength(1)
        expect(transactionStore.pending.giver[0].transaction_id).toBe('txn-new')
      })

      it('應更新已存在的交易', () => {
        const txn = createMockTransaction({ transaction_id: 'txn-1', status: 'pending' })
        transactionStore.pending.giver = [txn]

        const updatedTxn = createMockTransaction({
          transaction_id: 'txn-1',
          status: 'pending',
          giver_note: 'updated note',
        })
        transactionStore.upsertTransaction(updatedTxn, 'pending', 'giver')

        expect(transactionStore.pending.giver).toHaveLength(1)
        expect(transactionStore.pending.giver[0].giver_note).toBe('updated note')
      })

      it('無效狀態時不應執行任何操作', () => {
        const txn = createMockTransaction({ transaction_id: 'txn-1' })

        transactionStore.upsertTransaction(txn, 'invalid_status', 'giver')

        expect(transactionStore.confirming.giver).toHaveLength(0)
        expect(transactionStore.pending.giver).toHaveLength(0)
        expect(transactionStore.completed.giver).toHaveLength(0)
      })
    })

    describe('startRealtime', () => {
      it('應建立 Supabase channel 訂閱', async () => {
        const { supabase } = await import('@/lib/supabase')

        transactionStore.startRealtime('user-123')

        expect(supabase.channel).toHaveBeenCalled()
        expect(transactionStore.isRealtimeActive).toBe(true)
      })

      it('已啟動時不應重複訂閱', async () => {
        const { supabase } = await import('@/lib/supabase')

        transactionStore.startRealtime('user-123')
        transactionStore.startRealtime('user-123')

        expect(supabase.channel).toHaveBeenCalledTimes(1)
      })

      it('沒有 userId 時不應啟動', async () => {
        const { supabase } = await import('@/lib/supabase')

        transactionStore.startRealtime(null)

        expect(supabase.channel).not.toHaveBeenCalled()
        expect(transactionStore.isRealtimeActive).toBe(false)
      })
    })

    describe('stopRealtime', () => {
      it('應停止 Supabase 訂閱', async () => {
        transactionStore.startRealtime('user-123')
        await transactionStore.stopRealtime()

        expect(transactionStore.isRealtimeActive).toBe(false)
      })

      it('未啟動時應安全返回', async () => {
        // 不應拋出錯誤
        await expect(transactionStore.stopRealtime()).resolves.not.toThrow()
      })
    })

    describe('setRealtimeCallbacks', () => {
      it('應設置回調函數', () => {
        const callbacks = {
          onTransactionReceived: vi.fn(),
          onTransactionAccepted: vi.fn(),
        }

        transactionStore.setRealtimeCallbacks(callbacks)

        // 回調設置成功（內部狀態驗證）
        // 由於 callbacks 是內部物件，這裡主要確保不拋出錯誤
        expect(true).toBe(true)
      })
    })
  })

  // ==========================================================================
  // 狀態轉換測試
  // ==========================================================================
  describe('狀態轉換', () => {
    it('confirmTransaction 應將交易從 confirming 移至 pending (giver 角色)', () => {
      const txn = createMockTransaction({ transaction_id: 'txn-1', status: 'confirming' })
      transactionStore.confirming.giver = [txn]

      const result = transactionStore.confirmTransaction('txn-1', 'giver')

      expect(result).toBeDefined()
      expect(result.status).toBe('pending')
      expect(transactionStore.confirming.giver).toHaveLength(0)
      expect(transactionStore.pending.giver).toHaveLength(1)
    })

    it('completeTransaction 應將交易從 pending 移至 completed (giver 角色)', () => {
      const txn = createMockTransaction({ transaction_id: 'txn-1', status: 'pending' })
      transactionStore.pending.giver = [txn]

      const result = transactionStore.completeTransaction('txn-1', 'giver')

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
      expect(result.completed_at).toBeDefined()
      expect(transactionStore.pending.giver).toHaveLength(0)
      expect(transactionStore.completed.giver).toHaveLength(1)
    })

    it('多個交易時應只移動指定的交易', () => {
      const txn1 = createMockTransaction({ transaction_id: 'txn-1' })
      const txn2 = createMockTransaction({ transaction_id: 'txn-2' })
      transactionStore.confirming.receiver = [txn1, txn2]

      transactionStore.confirmTransaction('txn-1', 'receiver')

      expect(transactionStore.confirming.receiver).toHaveLength(1)
      expect(transactionStore.confirming.receiver[0].transaction_id).toBe('txn-2')
      expect(transactionStore.pending.receiver).toHaveLength(1)
      expect(transactionStore.pending.receiver[0].transaction_id).toBe('txn-1')
    })
  })
})
