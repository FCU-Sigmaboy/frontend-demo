import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { finalizeTransactionWithCode } from '@/api/transaction_meetAPI'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}))

describe('transaction_meetAPI', () => {
  let consoleErrorSpy

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('finalizeTransactionWithCode', () => {
    it('should finalize transaction with correct code', async () => {
      const mockUser = { id: 'user-123' }
      const mockResponse = {
        success: true,
        message: '交易完成',
        transaction_id: 456,
        new_status: 'completed'
      }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await finalizeTransactionWithCode(456, 'ABC123')

      expect(supabase.auth.getUser).toHaveBeenCalled()
      expect(supabase.rpc).toHaveBeenCalledWith('finalize_transaction_with_code', {
        p_transaction_id: 456,
        p_confirmation_code: 'ABC123'
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

      await expect(finalizeTransactionWithCode(456, 'ABC123'))
        .rejects.toThrow('使用者未登入')
    })

    it('should throw error when RPC fails', async () => {
      const mockUser = { id: 'user-123' }
      const mockError = { message: '確認碼錯誤' }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      await expect(finalizeTransactionWithCode(456, 'WRONG'))
        .rejects.toThrow('確認碼錯誤')

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
