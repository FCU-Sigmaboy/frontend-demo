import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  initiateTransaction,
  getMyTransactionsByStatus,
  updateGiverNote,
  buyerConfirmTransaction,
  cancelTransaction
} from '@/api/transaction_before_meetAPI'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

describe.sequential('transaction_before_meetAPI', () => {
  let consoleErrorSpy

  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 mock
    supabase.rpc.mockReset()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('initiateTransaction', () => {
    it('should initiate a transaction successfully', async () => {
      const mockResponse = {
        transaction_id: 123,
        status: 'confirming',
        code: 'ABC123'
      }
      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await initiateTransaction(456, 'buyer-uuid-123')

      expect(supabase.rpc).toHaveBeenCalledWith('initiate_transaction', {
        p_item_id: 456,
        p_receiver_id: 'buyer-uuid-123'
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when initiation fails', async () => {
      const mockError = { message: 'Database error' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      await expect(initiateTransaction(456, 'buyer-uuid-123'))
        .rejects.toThrow('Database error')
    })
  })

  describe('getMyTransactionsByStatus', () => {
    it('should get transactions successfully', async () => {
      const mockTransactions = [
        { transaction_id: 1, status: 'confirming' },
        { transaction_id: 2, status: 'confirming' }
      ]
      supabase.rpc.mockResolvedValueOnce({ data: mockTransactions, error: null })

      const result = await getMyTransactionsByStatus('confirming', 'giver')

      expect(supabase.rpc).toHaveBeenCalledWith('get_my_transactions_by_status', {
        p_status: 'confirming',
        p_role: 'giver'
      })
      expect(result).toEqual(mockTransactions)
    })

    it('should return empty array when no transactions', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: [], error: null })

      const result = await getMyTransactionsByStatus('completed', 'giver')

      expect(result).toEqual([])
    })
  })

  describe('updateGiverNote', () => {
    it('should update giver note successfully', async () => {
      const mockResponse = { success: true, message: 'Note updated' }
      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await updateGiverNote(123, 'Test note')

      expect(supabase.rpc).toHaveBeenCalledWith('update_giver_note', {
        p_transaction_id: 123,
        p_note: 'Test note'
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when update fails', async () => {
      const mockError = { message: 'Update failed' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      await expect(updateGiverNote(123, 'Test note'))
        .rejects.toThrow('Update failed')
    })
  })

  describe('buyerConfirmTransaction', () => {
    it('should confirm transaction successfully', async () => {
      const mockResponse = { success: true, new_status: 'pending' }
      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await buyerConfirmTransaction(123, 'I will be there')

      expect(result).toEqual(mockResponse)
      expect(supabase.rpc).toHaveBeenCalledWith('buyer_confirm_transaction', {
        p_transaction_id: 123,
        p_note: 'I will be there'
      })
    })

    it('should throw error when confirmation fails', async () => {
      const mockError = { message: 'Not authorized' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      await expect(buyerConfirmTransaction(123, 'Note'))
        .rejects.toThrow('Not authorized')
    })
  })

  describe('cancelTransaction', () => {
    it('should cancel transaction successfully', async () => {
      const mockResponse = { success: true, message: 'Transaction cancelled' }
      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await cancelTransaction(123)

      expect(supabase.rpc).toHaveBeenCalledWith('cancel_transaction', {
        p_transaction_id: 123
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when cancellation fails', async () => {
      const mockError = { message: 'Cannot cancel' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      await expect(cancelTransaction(123))
        .rejects.toThrow('Cannot cancel')
    })
  })
})
