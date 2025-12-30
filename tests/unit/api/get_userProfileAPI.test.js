import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPublicUserProfile } from '@/api/get_userProfileAPI'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe('get_userProfileAPI', () => {
  const mockUserProfile = {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-123456789abc',
    nickname: 'Joseph',
    profile_picture_url: 'https://example.com/joseph.jpg',
    avg_rating: 4.80,
    created_at: '2025-01-15T08:00:00.123+00:00',
    formatted_address: '台中市西屯區福星路123號',
    following_count: 100,
    followers_count: 80,
    carbon_saved_kg: 75.5
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPublicUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: mockUserProfile, 
        error: null 
      })

      supabase.rpc.mockReturnValue({ single: mockSingle })

      const result = await getPublicUserProfile('a1b2c3d4-e5f6-4a5b-8c9d-123456789abc')

      expect(result).toEqual(mockUserProfile)
      expect(supabase.rpc).toHaveBeenCalledWith('get_public_user_profile', {
        p_user_id: 'a1b2c3d4-e5f6-4a5b-8c9d-123456789abc'
      })
    })

    it('should return null when user profile not found (PGRST200)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST200', message: 'No rows found' }
      })

      supabase.rpc.mockReturnValue({ single: mockSingle })

      const result = await getPublicUserProfile('non-existent-user-id')

      expect(result).toBeNull()
    })

    it('should throw error when RPC call fails', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST000', message: 'RPC 呼叫失敗' }
      })

      supabase.rpc.mockReturnValue({ single: mockSingle })

      await expect(getPublicUserProfile('test-user-id'))
        .rejects.toThrow('RPC 呼叫失敗')
    })

    it('should handle user with zero followers and following', async () => {
      const newUserProfile = {
        ...mockUserProfile,
        following_count: 0,
        followers_count: 0,
        carbon_saved_kg: 0
      }

      const mockSingle = vi.fn().mockResolvedValue({ 
        data: newUserProfile, 
        error: null 
      })

      supabase.rpc.mockReturnValue({ single: mockSingle })

      const result = await getPublicUserProfile('new-user-id')

      expect(result.following_count).toBe(0)
      expect(result.followers_count).toBe(0)
      expect(result.carbon_saved_kg).toBe(0)
    })

    it('should handle user with null profile picture', async () => {
      const profileWithoutPicture = {
        ...mockUserProfile,
        profile_picture_url: null
      }

      const mockSingle = vi.fn().mockResolvedValue({ 
        data: profileWithoutPicture, 
        error: null 
      })

      supabase.rpc.mockReturnValue({ single: mockSingle })

      const result = await getPublicUserProfile('test-user-id')

      expect(result.profile_picture_url).toBeNull()
    })
  })
})
