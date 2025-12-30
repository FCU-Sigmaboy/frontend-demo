import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getUserPrimaryLocation, getMyLocations } from '@/api/get_userLocationAPI';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn()
  }
}));

describe('get_userLocationAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('getUserPrimaryLocation', () => {
    it('應該成功獲取使用者的主要地點', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const mockLocation = {
        id: 1,
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家',
        is_primary: true,
        formatted_address: '台中市南屯區...',
        created_at: '2025-11-06T12:00:00Z',
        updated_at: '2025-11-06T12:00:00Z'
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });
      supabase.rpc.mockResolvedValueOnce({
        data: [mockLocation],
        error: null
      });

      // Act
      const result = await getUserPrimaryLocation();

      // Assert
      expect(result).toEqual(mockLocation);
      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_primary_location', {
        p_user_id: mockUser.id
      });
    });

    it('應該在使用者未登入時回傳 null', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act
      const result = await getUserPrimaryLocation();

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
      const result = await getUserPrimaryLocation();

      // Assert
      expect(result).toBeNull();
    });

    it('應該在 RPC 回傳空陣列時回傳 null', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });
      supabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Act
      const result = await getUserPrimaryLocation();

      // Assert
      expect(result).toBeNull();
    });

    it('應該在 RPC 失敗時回傳 null', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC error' }
      });

      // Act
      const result = await getUserPrimaryLocation();

      // Assert
      expect(result).toBeNull();
    });

    it('應該在發生意外錯誤時回傳 null', async () => {
      // Arrange
      supabase.auth.getUser.mockRejectedValueOnce(new Error('Unexpected error'));

      // Act
      const result = await getUserPrimaryLocation();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getMyLocations', () => {
    it('應該成功獲取使用者的所有地點', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const mockLocations = [
        {
          id: 1,
          coordinates: { type: 'Point', coordinates: [120.7344, 24.1817] },
          type: '家',
          is_primary: true
        },
        {
          id: 2,
          coordinates: { type: 'Point', coordinates: [121.5654, 25.0330] },
          type: '公司',
          is_primary: false
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation((field, options) => {
          if (field === 'is_primary') {
            return mockQuery;
          } else {
            return Promise.resolve({ data: mockLocations, error: null });
          }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });
      supabase.from.mockReturnValueOnce(mockQuery);

      // Act
      const result = await getMyLocations();

      // Assert
      expect(result).toEqual(mockLocations);
      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('locations');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.order).toHaveBeenCalledWith('is_primary', { ascending: false });
    });

    it('應該在使用者未登入時回傳 null', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act
      const result = await getMyLocations();

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
      const result = await getMyLocations();

      // Assert
      expect(result).toBeNull();
    });

    it('應該在資料庫查詢失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Database error';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation((field, options) => {
          if (field === 'is_primary') {
            return mockQuery;
          } else {
            return Promise.resolve({ data: null, error: { message: errorMessage } });
          }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });
      supabase.from.mockReturnValueOnce(mockQuery);

      // Act & Assert
      await expect(getMyLocations()).rejects.toThrow(errorMessage);
    });

    it('應該按照 is_primary 和 id 排序', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const mockLocations = [];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation((field, options) => {
          if (field === 'is_primary') {
            return mockQuery;
          } else {
            return Promise.resolve({ data: mockLocations, error: null });
          }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });
      supabase.from.mockReturnValueOnce(mockQuery);

      // Act
      await getMyLocations();

      // Assert
      expect(mockQuery.order).toHaveBeenCalledTimes(2);
      expect(mockQuery.order).toHaveBeenNthCalledWith(1, 'is_primary', { ascending: false });
      expect(mockQuery.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
    });
  });
});
