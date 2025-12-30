import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createReview, canCreateReview } from '@/api/create_review'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn()
  }
}))

describe('create_review', () => {
  let consoleErrorSpy

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('createReview', () => {
    it('should create review with valid data', async () => {
      const reviewData = {
        transaction_id: 123,
        score: 5,
        comment: '非常好的賣家！'
      }

      const mockResponse = [{
        id: 1,
        transaction_id: 123,
        score: 5,
        comment: '非常好的賣家！'
      }]

      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await createReview(reviewData)

      expect(supabase.rpc).toHaveBeenCalledWith('create_review', {
        p_transaction_id: 123,
        p_score: 5,
        p_comment: '非常好的賣家！'
      })
      expect(result).toEqual(mockResponse[0])
    })

    it('should create review without comment', async () => {
      const reviewData = {
        transaction_id: 123,
        score: 4
      }

      const mockResponse = [{
        id: 2,
        transaction_id: 123,
        score: 4,
        comment: null
      }]

      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await createReview(reviewData)

      expect(result.score).toBe(4)
      expect(result.comment).toBeNull()
    })

    it('should throw error when transaction_id is missing', async () => {
      const reviewData = {
        score: 5,
        comment: '很好'
      }

      await expect(createReview(reviewData))
        .rejects.toThrow('缺少必填欄位：transaction_id')
    })

    it('should throw error when score is missing', async () => {
      const reviewData = {
        transaction_id: 123,
        comment: '很好'
      }

      await expect(createReview(reviewData))
        .rejects.toThrow('缺少必填欄位：score')
    })

    it('should throw error when score is below 1', async () => {
      const reviewData = {
        transaction_id: 123,
        score: 0,
        comment: '很差'
      }

      await expect(createReview(reviewData))
        .rejects.toThrow('評分必須在 1-5 之間')
    })

    it('should throw error when score is above 5', async () => {
      const reviewData = {
        transaction_id: 123,
        score: 6,
        comment: '超好'
      }

      await expect(createReview(reviewData))
        .rejects.toThrow('評分必須在 1-5 之間')
    })

    it('should throw error when RPC fails', async () => {
      const reviewData = {
        transaction_id: 123,
        score: 5
      }

      const mockError = { message: 'Database error' }
      supabase.rpc.mockResolvedValueOnce({ data: null, error: mockError })

      await expect(createReview(reviewData))
        .rejects.toThrow('Database error')
    })

    it('should handle long comments', async () => {
      const longComment = 'A'.repeat(1000)
      const reviewData = {
        transaction_id: 123,
        score: 5,
        comment: longComment
      }

      const mockResponse = [{
        id: 3,
        transaction_id: 123,
        score: 5,
        comment: longComment
      }]

      supabase.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await createReview(reviewData)

      expect(result.comment).toHaveLength(1000)
    })
  })

  describe('canCreateReview', () => {
    it('should return true when all conditions are met', async () => {
      const mockUser = { id: 'user-123' }
      const mockTransaction = {
        id: 1,
        giver_id: 'user-123',
        receiver_id: 'user-456',
        transaction_status: 'completed'
      }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockTransaction, error: null }),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null })
      }
      supabase.from.mockReturnValue(mockFrom)

      const result = await canCreateReview(1)

      expect(result.canReview).toBe(true)
    })

    it('should return false when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

      const result = await canCreateReview(1)

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('使用者未登入')
    })

    it('should return false when transaction does not exist', async () => {
      const mockUser = { id: 'user-123' }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
      }
      supabase.from.mockReturnValue(mockFrom)

      const result = await canCreateReview(999)

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('交易不存在')
    })

    it('should handle exception and return system error', async () => {
      supabase.auth.getUser.mockRejectedValueOnce(new Error('Network error'))

      const result = await canCreateReview(1)

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('系統錯誤')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
