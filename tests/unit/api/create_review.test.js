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

describe.sequential('create_review', () => {
  let consoleErrorSpy

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe.sequential('createReview', () => {
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

      // Explicitly pass undefined as score might be missing
      await expect(createReview({ ...reviewData, score: undefined }))
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

    it('should throw error when RPC returns empty data', async () => {
      const reviewData = {
        transaction_id: 123,
        score: 5
      }

      supabase.rpc.mockResolvedValueOnce({ data: [], error: null })

      await expect(createReview(reviewData))
        .rejects.toThrow('評價建立失敗：未回傳資料')
    })

    it('should throw error when RPC returns null data', async () => {
      const reviewData = {
        transaction_id: 123,
        score: 5
      }

      supabase.rpc.mockResolvedValueOnce({ data: null, error: null })

      await expect(createReview(reviewData))
        .rejects.toThrow('評價建立失敗：未回傳資料')
    })
  })

  describe.sequential('canCreateReview', () => {
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

    it('should return false when transaction is not completed', async () => {
      const mockUser = { id: 'user-123' }
      const mockTransaction = {
        id: 1,
        giver_id: 'user-123',
        receiver_id: 'user-456',
        transaction_status: 'pending' // Not completed
      }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockTransaction, error: null })
      }
      supabase.from.mockReturnValue(mockFrom)

      const result = await canCreateReview(1)

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('只有已完成的交易才能建立評價')
    })

    it('should return false when user is not a participant', async () => {
      const mockUser = { id: 'user-789' } // Not a participant
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
        single: vi.fn().mockResolvedValueOnce({ data: mockTransaction, error: null })
      }
      supabase.from.mockReturnValue(mockFrom)

      const result = await canCreateReview(1)

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('您不是此交易的參與者')
    })

    it('should return false when error checking existing review', async () => {
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
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } })
      }
      supabase.from.mockReturnValue(mockFrom)

      const result = await canCreateReview(1)

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('檢查評價狀態失敗')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should return false when review already exists', async () => {
      const mockUser = { id: 'user-123' }
      const mockTransaction = {
        id: 1,
        giver_id: 'user-123',
        receiver_id: 'user-456',
        transaction_status: 'completed'
      }
      const mockExistingReview = { id: 100 }

      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })
      
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockTransaction, error: null }),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockExistingReview, error: null })
      }
      supabase.from.mockReturnValue(mockFrom)

      const result = await canCreateReview(1)

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('您已經對此交易建立過評價')
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
