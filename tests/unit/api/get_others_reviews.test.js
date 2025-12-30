import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOthersReviews } from '@/api/get_others_reviews'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe('get_others_reviews', () => {
  const mockReviews = [
    {
      review_id: 1,
      reviewer_id: 'reviewer-1',
      reviewer_nickname: '評價者1',
      reviewer_avatar: 'avatar1.jpg',
      score: 5,
      comment: '很棒的交易',
      created_at: '2025-01-15T10:00:00'
    },
    {
      review_id: 2,
      reviewer_id: 'reviewer-2',
      reviewer_nickname: '評價者2',
      reviewer_avatar: 'avatar2.jpg',
      score: 4,
      comment: '不錯',
      created_at: '2025-01-14T09:00:00'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOthersReviews', () => {
    it('should fetch other user reviews with default parameters', async () => {
      supabase.rpc.mockResolvedValueOnce({ 
        data: mockReviews, 
        error: null 
      })

      const result = await getOthersReviews({ userId: 'user-123' })

      expect(result).toEqual(mockReviews)
      expect(supabase.rpc).toHaveBeenCalledWith('get_others_reviews', {
        p_user_id: 'user-123',
        p_page: 1,
        p_page_size: 20,
        p_sort_by: 'created_at',
        p_sort_direction: 'desc'
      })
    })

    it('should fetch other user reviews with custom parameters', async () => {
      supabase.rpc.mockResolvedValueOnce({ 
        data: mockReviews, 
        error: null 
      })

      const result = await getOthersReviews({
        userId: 'user-456',
        page: 2,
        pageSize: 10,
        sortBy: 'score',
        sortDirection: 'asc'
      })

      expect(result).toEqual(mockReviews)
      expect(supabase.rpc).toHaveBeenCalledWith('get_others_reviews', {
        p_user_id: 'user-456',
        p_page: 2,
        p_page_size: 10,
        p_sort_by: 'score',
        p_sort_direction: 'asc'
      })
    })

    it('should throw error when userId is not provided', async () => {
      await expect(getOthersReviews({})).rejects.toThrow('必須提供目標用戶 ID (userId)')
    })

    it('should throw error when userId is undefined', async () => {
      await expect(getOthersReviews({ userId: undefined })).rejects.toThrow('必須提供目標用戶 ID (userId)')
    })

    it('should return empty array when no reviews exist', async () => {
      supabase.rpc.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      })

      const result = await getOthersReviews({ userId: 'user-123' })

      expect(result).toEqual([])
    })

    it('should return empty array when data is null', async () => {
      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      })

      const result = await getOthersReviews({ userId: 'user-123' })

      expect(result).toEqual([])
    })

    it('should throw error when RPC call fails', async () => {
      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'RPC 呼叫失敗' } 
      })

      await expect(getOthersReviews({ userId: 'user-123' })).rejects.toThrow('RPC 呼叫失敗')
    })
  })
})
