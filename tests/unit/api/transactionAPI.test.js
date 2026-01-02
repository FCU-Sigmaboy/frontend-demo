import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  createOffer,
  respondToOffer,
  createOrderRequest,
  respondToOrderRequest,
  getTransactionConfirmation,
  confirmTransaction,
  completeTransaction,
  getMyTransactions,
  getTransactionById,
  getReviewByTransaction
} from '@/api/transactionsAPI.js'

import {
  initiateTransaction,
  getMyTransactionsByStatus,
  updateGiverNote,
  buyerConfirmTransaction,
  cancelTransaction
} from '@/api/transaction_before_meetAPI.js'

import {
  finalizeTransactionWithCode
} from '@/api/transaction_meetAPI.js'

// 模擬 Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe.sequential('transactionAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initiateTransaction', () => {
    it('should initiate transaction successfully', async () => {
      // Arrange
      const itemId = 123
      const receiverId = 'buyer-456'
      const mockResult = {
        transaction_id: 'txn-789',
        status: 'confirming',
        code: 'ABC123'
      }

      supabase.rpc.mockResolvedValue({ data: mockResult, error: null })

      // Act
      const result = await initiateTransaction(itemId, receiverId)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('initiate_transaction', {
        p_item_id: itemId,
        p_receiver_id: receiverId
      })
      expect(result).toEqual(mockResult)
    })

    it('should throw error when RPC fails', async () => {
      // Arrange
      const mockError = { message: 'Transaction initiation failed' }
      supabase.rpc.mockResolvedValue({ data: null, error: mockError })

      // Act & Assert
      await expect(initiateTransaction(123, 'buyer-456')).rejects.toThrow('發起交易失敗: Transaction initiation failed')
    })
  })

  describe('getMyTransactionsByStatus', () => {
    it('should return transactions by status and role', async () => {
      // Arrange
      const status = 'pending'
      const role = 'giver'
      const mockTransactions = [
        {
          transaction_id: 'txn-1',
          item_title: 'Test Item',
          amount: 500,
          status: 'pending',
          created_at: '2024-12-11T10:00:00Z'
        }
      ]

      supabase.rpc.mockResolvedValue({ data: mockTransactions, error: null })

      // Act
      const result = await getMyTransactionsByStatus(status, role)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_my_transactions_by_status', {
        p_status: status,
        p_role: role
      })
      expect(result).toEqual(mockTransactions)
    })

    it('should throw error when query fails', async () => {
      // Arrange
      const mockError = { message: 'Query failed' }
      supabase.rpc.mockResolvedValue({ data: null, error: mockError })

      // Act & Assert
      await expect(getMyTransactionsByStatus('pending', 'giver')).rejects.toThrow('查詢交易列表失敗: Query failed')
    })
  })

  describe('updateGiverNote', () => {
    it('should update giver note successfully', async () => {
      // Arrange
      const transactionId = 123
      const note = 'Updated note'
      const mockResult = { success: true, giver_note: note }

      supabase.rpc.mockResolvedValue({ data: mockResult, error: null })

      // Act
      const result = await updateGiverNote(transactionId, note)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('update_giver_note', {
        p_transaction_id: transactionId,
        p_note: note
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('buyerConfirmTransaction', () => {
    it('should confirm transaction as buyer', async () => {
      // Arrange
      const transactionId = 123
      const note = 'Buyer confirmation note'
      const mockResult = {
        success: true,
        new_status: 'pending',
        receiver_note: note
      }

      supabase.rpc.mockResolvedValue({ data: mockResult, error: null })

      // Act
      const result = await buyerConfirmTransaction(transactionId, note)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('buyer_confirm_transaction', {
        p_transaction_id: transactionId,
        p_note: note
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('cancelTransaction', () => {
    it('should cancel transaction successfully', async () => {
      // Arrange
      const transactionId = 123
      const mockResult = {
        success: true,
        new_status: 'cancelled'
      }

      supabase.rpc.mockResolvedValue({ data: mockResult, error: null })

      // Act
      const result = await cancelTransaction(transactionId)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('cancel_transaction', {
        p_transaction_id: transactionId
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('finalizeTransactionWithCode', () => {
    it('should finalize transaction with correct code', async () => {
      // Arrange
      const mockUser = { id: 'buyer-123' }
      const transactionId = 456
      const code = 'ABC123'
      const mockResult = {
        success: true,
        message: '交易完成',
        new_balance: 1500
      }

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValue({ data: mockResult, error: null })

      // Act
      const result = await finalizeTransactionWithCode(transactionId, code)

      // Assert
      expect(supabase.auth.getUser).toHaveBeenCalledOnce()
      expect(supabase.rpc).toHaveBeenCalledWith('finalize_transaction_with_code', {
        p_transaction_id: transactionId,
        p_confirmation_code: code
      })
      expect(result).toEqual(mockResult)
    })

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act & Assert
      await expect(finalizeTransactionWithCode(123, 'ABC123')).rejects.toThrow('使用者未登入')
    })

    it('should throw error when confirmation code is wrong', async () => {
      // Arrange
      const mockUser = { id: 'buyer-123' }
      const mockError = { message: '確認碼錯誤' }

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      supabase.rpc.mockResolvedValue({ data: null, error: mockError })

      // Act & Assert
      await expect(finalizeTransactionWithCode(123, 'WRONG')).rejects.toThrow('確認碼錯誤')
    })
  })

  describe('createOffer', () => {
    it('should create offer with example data', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const offerData = {
        conversation_id: 'conv-456',
        amount: 500,
        offered_by: 'buyer'
      }

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act
      const result = await createOffer(offerData)

      // Assert
      expect(result).toMatchObject({
        conversation_id: 'conv-456',
        amount: 500,
        offered_by: 'buyer',
        status: 'pending'
      })
      expect(result.id).toMatch(/^offer_\d+$/)
    })

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act & Assert
      await expect(createOffer({})).rejects.toThrow('使用者未登入')
    })
  })

  describe('respondToOffer', () => {
    it('should respond to offer with accept action', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const offerId = 'offer-456'
      const action = 'accept'

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act
      const result = await respondToOffer(offerId, action)

      // Assert
      expect(result).toMatchObject({
        id: offerId,
        status: 'accepted',
        counter_offer: null
      })
      expect(result.responded_at).toBeDefined()
    })

    it('should respond to offer with counter action', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const offerId = 'offer-456'
      const action = 'counter'
      const counterAmount = 600

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act
      const result = await respondToOffer(offerId, action, counterAmount)

      // Assert
      expect(result).toMatchObject({
        id: offerId,
        status: 'countered'
      })
      expect(result.counter_offer).toMatchObject({
        amount: counterAmount,
        offered_by: 'seller',
        status: 'pending'
      })
    })
  })

  describe('getTransactionConfirmation', () => {
    it('should return transaction confirmation details', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const conversationId = 'conv-456'

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act
      const result = await getTransactionConfirmation(conversationId)

      // Assert
      expect(result).toMatchObject({
        transaction: expect.objectContaining({
          conversation_id: conversationId,
          status: 'buyer_confirmed'
        }),
        item: expect.objectContaining({
          title: 'IKEA 檯燈'
        }),
        user: expect.objectContaining({
          id: mockUser.id,
          balance: 500
        })
      })
    })
  })

  describe('getMyTransactions', () => {
    it('should return user transaction history', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const filters = { role: 'buyer', status: 'completed' }

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act
      const result = await getMyTransactions(filters)

      // Assert
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toMatchObject({
        type: expect.any(String),
        status: expect.any(String),
        amount: expect.any(Number)
      })
    })
  })

  describe('getTransactionById', () => {
    it('should return transaction details by ID', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const transactionId = 'txn-456'

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act
      const result = await getTransactionById(transactionId)

      // Assert
      expect(result).toMatchObject({
        id: transactionId,
        type: 'purchase',
        status: 'completed',
        item: expect.objectContaining({
          title: 'IKEA 檯燈'
        })
      })
    })
  })

  describe('getReviewByTransaction', () => {
    it('should return null for transaction without review', async () => {
      // Arrange
      const mockUser = { id: 'user-123' }
      const transactionId = 'txn-456'

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act
      const result = await getReviewByTransaction(transactionId)

      // Assert
      expect(result).toBeNull()
    })

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act & Assert
      await expect(getReviewByTransaction('txn-456')).rejects.toThrow('使用者未登入')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      supabase.rpc.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(initiateTransaction(123, 'buyer-456')).rejects.toThrow('Network error')
    })

    it('should handle malformed responses', async () => {
      // Arrange
      supabase.rpc.mockResolvedValue({ data: undefined, error: null })

      // Act
      const result = await initiateTransaction(123, 'buyer-456')

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty transaction lists', async () => {
      // Arrange
      supabase.rpc.mockResolvedValue({ data: [], error: null })

      // Act
      const result = await getMyTransactionsByStatus('pending', 'giver')

      // Assert
      expect(result).toEqual([])
    })

    it('should handle null parameters gracefully', async () => {
      // Arrange
      const mockError = { message: 'Invalid parameters' }
      supabase.rpc.mockResolvedValue({ data: null, error: mockError })

      // Act & Assert
      await expect(updateGiverNote(null, null)).rejects.toThrow('更新備註失敗: Invalid parameters')
    })
  })
})