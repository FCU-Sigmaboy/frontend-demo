import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  getMyProfileForEdit,
  updateMyProfile,
  getPublicUserProfile
} from '@/api/profileAPI.js'

// 模擬 Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn()
    })),
    rpc: vi.fn()
  }
}))

import { supabase } from '@/lib/supabase'

describe('profileAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getMyProfileForEdit', () => {
    it('should return user profile with locations when user is authenticated', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123', email: 'test@example.com' }
      const mockProfile = {
        id: 'test-user-123',
        nickname: 'Test User',
        profile_picture_url: 'https://example.com/avatar.jpg',
        avg_rating: 4.5,
        created_at: '2024-01-01T00:00:00Z',
        profiles: [{
          balance: 1500,
          carbon_saved_kg: 25.5,
          updated_at: '2024-12-11T00:00:00Z'
        }],
        locations: [{
          id: 1,
          coordinates: 'POINT(121.5654 25.0330)',
          type: 'home',
          is_primary: true,
          formatted_address: '台北市信義區',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }]
      }

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      }
      supabase.from.mockReturnValue(mockQueryBuilder)

      // Mock following counts
      supabase.from
        .mockReturnValueOnce(mockQueryBuilder) // Main profile query
        .mockReturnValueOnce({ // Following count query
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis()
        })
        .mockReturnValueOnce({ // Followers count query
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis()
        })

      // Act
      const result = await getMyProfileForEdit()

      // Assert
      expect(supabase.auth.getUser).toHaveBeenCalledOnce()
      expect(result).toMatchObject({
        id: 'test-user-123',
        nickname: 'Test User',
        profile_picture_url: 'https://example.com/avatar.jpg',
        profile_details: {
          balance: 1500,
          carbon_saved_kg: 25.5
        },
        locations: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            type: 'home',
            is_primary: true
          })
        ])
      })
    })

    it('should return null when user is not authenticated', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act
      const result = await getMyProfileForEdit()

      // Assert
      expect(result).toBeNull()
    })

    it('should return basic user info when profile data not found', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123', email: 'test@example.com' }
      const mockError = { code: 'PGRST200' }

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError })
      }
      supabase.from.mockReturnValue(mockQueryBuilder)

      // Act
      const result = await getMyProfileForEdit()

      // Assert
      expect(result).toEqual({
        id: 'test-user-123',
        nickname: 'test@example.com'
      })
    })

    it('should throw error when database query fails', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const mockError = { message: 'Database error' }

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError })
      }
      supabase.from.mockReturnValue(mockQueryBuilder)

      // Act & Assert
      await expect(getMyProfileForEdit()).rejects.toThrow('Database error')
    })
  })

  describe('updateMyProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const userData = { nickname: 'Updated User' }
      const profileData = { balance: 2000 }
      const locationsArray = [{
        id: 1,
        coordinates: { longitude: 121.5654, latitude: 25.0330 },
        type: 'home',
        is_primary: true,
        formatted_address: '台北市信義區'
      }]

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Mock update operations
      const mockUpdateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'test-user-123' }, error: null })
      }

      const mockInsertBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      const mockSelectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'test-user-123',
            nickname: 'Updated User',
            profiles: { balance: 2000 },
            locations: locationsArray
          },
          error: null
        })
      }

      supabase.from
        .mockReturnValueOnce(mockUpdateBuilder) // users update
        .mockReturnValueOnce(mockInsertBuilder) // profiles update
        .mockReturnValueOnce(mockInsertBuilder) // locations update
        .mockReturnValueOnce(mockSelectBuilder) // final select

      // Act
      const result = await updateMyProfile(userData, profileData, locationsArray)

      // Assert
      expect(result).toMatchObject({
        id: 'test-user-123',
        nickname: 'Updated User'
      })
    })

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act & Assert
      await expect(updateMyProfile({}, {}, [])).rejects.toThrow('請先登入')
    })

    it('should handle location coordinates in different formats', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const locationsArray = [{
        coordinates: { coordinates: [121.5654, 25.0330] }, // Alternative format
        type: 'home',
        is_primary: true,
        formatted_address: '台北市信義區'
      }]

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      const mockInsertBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      const mockSelectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'test-user-123' },
          error: null
        })
      }

      supabase.from
        .mockReturnValueOnce(mockInsertBuilder) // locations update
        .mockReturnValueOnce(mockSelectBuilder) // final select

      // Act
      await updateMyProfile({}, {}, locationsArray)

      // Assert
      expect(mockInsertBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinates: 'POINT(121.5654 25.033)'
        })
      )
    })

    it('should throw error for invalid coordinates', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' }
      const locationsArray = [{
        coordinates: { longitude: null, latitude: null },
        type: 'home'
      }]

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Act & Assert
      await expect(updateMyProfile({}, {}, locationsArray)).rejects.toThrow('座標格式錯誤')
    })
  })

  describe('getPublicUserProfile', () => {
    it('should return public user profile', async () => {
      // Arrange
      const userId = 'public-user-123'
      const mockProfile = {
        id: 'public-user-123',
        nickname: 'Public User',
        profile_picture_url: 'https://example.com/avatar.jpg',
        avg_rating: 4.2,
        total_listings: 15,
        total_transactions: 8
      }

      const mockRpcBuilder = {
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      }
      supabase.rpc.mockReturnValue(mockRpcBuilder)

      // Act
      const result = await getPublicUserProfile(userId)

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_public_user_profile', {
        p_user_id: userId
      })
      expect(mockRpcBuilder.single).toHaveBeenCalledOnce()
      expect(result).toEqual(mockProfile)
    })

    it('should return null when profile not found', async () => {
      // Arrange
      const userId = 'nonexistent-user'
      const mockError = { code: 'PGRST200' }

      const mockRpcBuilder = {
        single: vi.fn().mockResolvedValue({ data: null, error: mockError })
      }
      supabase.rpc.mockReturnValue(mockRpcBuilder)

      // Act
      const result = await getPublicUserProfile(userId)

      // Assert
      expect(result).toBeNull()
    })

    it('should throw error when RPC call fails', async () => {
      // Arrange
      const userId = 'test-user-123'
      const mockError = { message: 'RPC error' }

      const mockRpcBuilder = {
        single: vi.fn().mockResolvedValue({ data: null, error: mockError })
      }
      supabase.rpc.mockReturnValue(mockRpcBuilder)

      // Act & Assert
      await expect(getPublicUserProfile(userId)).rejects.toThrow('RPC error')
    })
  })
})