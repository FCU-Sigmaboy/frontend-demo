import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getMyProfileForEdit } from '@/api/get_myProfileDetailsAPI';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn()
  }
}));

describe('get_myProfileDetailsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('getMyProfileForEdit', () => {
    it('應該成功獲取個人資料', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfileData = {
        id: 'user-123',
        nickname: '測試用戶',
        profile_picture_url: 'https://example.com/avatar.jpg',
        avg_rating: 4.5,
        created_at: '2025-01-01T00:00:00Z',
        profiles: [{
          balance: 100,
          carbon_saved_kg: 25.5,
          updated_at: '2025-01-15T00:00:00Z'
        }],
        locations: [
          {
            id: 1,
            coordinates: { type: 'Point', coordinates: [120.7344, 24.1817] },
            type: '家',
            is_primary: true,
            formatted_address: '台中市南屯區...',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-15T00:00:00Z'
          }
        ]
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfileData, error: null })
      };

      const mockFollowingQuery = {
        select: vi.fn().mockResolvedValue({ count: 5, error: null })
      };

      const mockFollowersQuery = {
        select: vi.fn().mockResolvedValue({ count: 10, error: null })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'users') return mockQuery;
        if (table === 'following') {
          const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis()
          };
          
          // 第一次調用返回 following count
          if (supabase.from.mock.calls.filter(c => c[0] === 'following').length === 1) {
            query.eq.mockResolvedValueOnce({ count: 5, error: null });
          } else {
            // 第二次調用返回 followers count
            query.eq.mockResolvedValueOnce({ count: 10, error: null });
          }
          
          return query;
        }
        return mockQuery;
      });

      // Act
      const result = await getMyProfileForEdit();

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('user-123');
      expect(result.nickname).toBe('測試用戶');
      expect(result.profile_details).toEqual({
        balance: 100,
        carbon_saved_kg: 25.5,
        updated_at: '2025-01-15T00:00:00Z'
      });
      expect(result.following_count).toBe(5);
      expect(result.followers_count).toBe(10);
      expect(result.locations).toHaveLength(1);
    });

    it('應該在使用者未登入時回傳 null', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act
      const result = await getMyProfileForEdit();

      // Assert
      expect(result).toBeNull();
    });

    it('應該在 auth error 時回傳 null', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Auth error' }
      });

      // Act
      const result = await getMyProfileForEdit();

      // Assert
      expect(result).toBeNull();
    });

    it('應該在首次登入時回傳基礎資料', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST200', message: 'Not found' }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await getMyProfileForEdit();

      // Assert
      expect(result).toEqual({ id: 'user-123', nickname: 'test@example.com' });
    });

    it('應該在資料庫錯誤時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const errorMessage = 'Database error';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: errorMessage }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(getMyProfileForEdit()).rejects.toThrow(errorMessage);
    });

    it('應該處理 profiles 為物件的情況', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfileData = {
        id: 'user-123',
        nickname: '測試用戶',
        profiles: {
          balance: 100,
          carbon_saved_kg: 25.5
        },
        locations: []
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfileData, error: null })
      };

      const mockFollowingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'users') return mockQuery;
        if (table === 'following') {
          const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis()
          };
          query.eq.mockResolvedValue({ count: 0, error: null });
          return query;
        }
        return mockQuery;
      });

      // Act
      const result = await getMyProfileForEdit();

      // Assert
      expect(result.profile_details).toEqual({
        balance: 100,
        carbon_saved_kg: 25.5
      });
    });

    it('應該處理 following count 查詢失敗', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfileData = {
        id: 'user-123',
        nickname: '測試用戶',
        profiles: [],
        locations: []
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfileData, error: null })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'users') return mockQuery;
        if (table === 'following') {
          const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis()
          };
          
          if (supabase.from.mock.calls.filter(c => c[0] === 'following').length === 1) {
            query.eq.mockResolvedValueOnce({ count: null, error: { message: 'Error' } });
          } else {
            query.eq.mockResolvedValueOnce({ count: 5, error: null });
          }
          
          return query;
        }
        return mockQuery;
      });

      // Act
      const result = await getMyProfileForEdit();

      // Assert
      expect(result.following_count).toBe(0);
      expect(result.followers_count).toBe(5);
    });
  });
});
