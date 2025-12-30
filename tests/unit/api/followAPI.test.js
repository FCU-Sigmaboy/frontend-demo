import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getMyFollowers,
  getMyFollowing,
  followUser,
  unfollowUser,
  checkIsFollowing,
  getPublicFollowers,
  getPublicFollowing
} from '@/api/followAPI';

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

describe('followAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('getMyFollowers', () => {
    it('應該成功獲取追蹤者列表', async () => {
      // Arrange
      const mockFollowers = [
        { user_id: 'user-1', nickname: '用戶1', followed_at: '2025-01-01' },
        { user_id: 'user-2', nickname: '用戶2', followed_at: '2025-01-02' }
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockFollowers,
        error: null
      });

      // Act
      const result = await getMyFollowers();

      // Assert
      expect(result).toEqual(mockFollowers);
      expect(supabase.rpc).toHaveBeenCalledWith('get_my_followers', {
        p_page: 1,
        p_page_size: 20,
        p_sort_by: 'followed_at',
        p_sort_direction: 'desc',
        p_search: ''
      });
    });

    it('應該支援自訂參數', async () => {
      // Arrange
      const params = {
        page: 2,
        pageSize: 10,
        sortBy: 'nickname',
        sortDirection: 'asc',
        search: 'test'
      };

      supabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Act
      await getMyFollowers(params);

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_my_followers', {
        p_page: 2,
        p_page_size: 10,
        p_sort_by: 'nickname',
        p_sort_direction: 'asc',
        p_search: 'test'
      });
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'RPC failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      // Act & Assert
      await expect(getMyFollowers()).rejects.toThrow(errorMessage);
    });
  });

  describe('getMyFollowing', () => {
    it('應該成功獲取追蹤中列表', async () => {
      // Arrange
      const mockFollowing = [
        { user_id: 'user-3', nickname: '用戶3', followed_at: '2025-01-03' },
        { user_id: 'user-4', nickname: '用戶4', followed_at: '2025-01-04' }
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockFollowing,
        error: null
      });

      // Act
      const result = await getMyFollowing();

      // Assert
      expect(result).toEqual(mockFollowing);
      expect(supabase.rpc).toHaveBeenCalledWith('get_my_following', {
        p_page: 1,
        p_page_size: 20,
        p_sort_by: 'followed_at',
        p_sort_direction: 'desc',
        p_search: ''
      });
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'RPC failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      // Act & Assert
      await expect(getMyFollowing()).rejects.toThrow(errorMessage);
    });
  });

  describe('followUser', () => {
    it('應該成功追蹤使用者', async () => {
      // Arrange
      const targetUserId = 'user-123';
      const mockResult = { success: true, message: '成功追蹤' };

      supabase.rpc.mockResolvedValueOnce({
        data: mockResult,
        error: null
      });

      // Act
      const result = await followUser(targetUserId);

      // Assert
      expect(result).toEqual(mockResult);
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = '無法追蹤自己';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      // Act & Assert
      await expect(followUser('user-123')).rejects.toThrow(errorMessage);
    });
  });

  describe('unfollowUser', () => {
    it('應該成功取消追蹤', async () => {
      // Arrange
      const targetUserId = 'user-123';
      const mockUser = { id: 'user-456' };

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await unfollowUser(targetUserId);

      // Assert
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('following');
      expect(mockQuery.match).toHaveBeenCalledWith({
        follower_id: mockUser.id,
        following_id: targetUserId
      });
    });

    it('應該在使用者未登入時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act & Assert
      await expect(unfollowUser('user-123')).rejects.toThrow('使用者未登入');
    });

    it('應該在刪除失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-456' };
      const errorMessage = 'Delete failed';

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: { message: errorMessage } })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(unfollowUser('user-123')).rejects.toThrow(errorMessage);
    });
  });

  describe('checkIsFollowing', () => {
    it('應該回傳 true 當正在追蹤時', async () => {
      // Arrange
      const targetUserId = 'user-123';
      const mockUser = { id: 'user-456' };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { created_at: '2025-01-01' },
          error: null
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await checkIsFollowing(targetUserId);

      // Assert
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('following');
      expect(mockQuery.match).toHaveBeenCalledWith({
        follower_id: mockUser.id,
        following_id: targetUserId
      });
    });

    it('應該回傳 false 當未追蹤時', async () => {
      // Arrange
      const targetUserId = 'user-123';
      const mockUser = { id: 'user-456' };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await checkIsFollowing(targetUserId);

      // Assert
      expect(result).toBe(false);
    });

    it('應該在未登入時回傳 false', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act
      const result = await checkIsFollowing('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('應該在查詢失敗時回傳 false', async () => {
      // Arrange
      const mockUser = { id: 'user-456' };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await checkIsFollowing('user-123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getPublicFollowers', () => {
    it('應該成功獲取公開追蹤者列表', async () => {
      // Arrange
      const userId = 'target-user';
      const mockFollowingData = [
        { follower_id: 'user-1', created_at: '2025-01-01' },
        { follower_id: 'user-2', created_at: '2025-01-02' }
      ];
      const mockUsersData = [
        { id: 'user-1', nickname: '用戶1', profile_picture_url: 'url1' },
        { id: 'user-2', nickname: '用戶2', profile_picture_url: 'url2' }
      ];

      const mockFollowingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockFollowingData, error: null })
      };

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: mockUsersData, error: null })
      };

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        if (table === 'following') return mockFollowingQuery;
        if (table === 'users') return mockUsersQuery;
        return mockFollowingQuery;
      });

      // Act
      const result = await getPublicFollowers(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('user_id', 'user-1');
      expect(result[0]).toHaveProperty('nickname', '用戶1');
    });

    it('應該處理空列表', async () => {
      // Arrange
      const userId = 'target-user';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await getPublicFollowers(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('應該在查詢失敗時拋出錯誤', async () => {
      // Arrange
      const userId = 'target-user';
      const errorMessage = 'Query failed';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } })
      };

      supabase.from.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(getPublicFollowers(userId)).rejects.toThrow(errorMessage);
    });
  });

  describe('getPublicFollowing', () => {
    it('應該成功獲取公開追蹤中列表', async () => {
      // Arrange
      const userId = 'target-user';
      const mockFollowingData = [
        { following_id: 'user-1', created_at: '2025-01-01' },
        { following_id: 'user-2', created_at: '2025-01-02' }
      ];
      const mockUsersData = [
        { id: 'user-1', nickname: '用戶1', profile_picture_url: 'url1' },
        { id: 'user-2', nickname: '用戶2', profile_picture_url: 'url2' }
      ];

      const mockFollowingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockFollowingData, error: null })
      };

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: mockUsersData, error: null })
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'following') return mockFollowingQuery;
        if (table === 'users') return mockUsersQuery;
        return mockFollowingQuery;
      });

      // Act
      const result = await getPublicFollowing(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('user_id', 'user-1');
      expect(result[0]).toHaveProperty('nickname', '用戶1');
    });

    it('應該處理空列表', async () => {
      // Arrange
      const userId = 'target-user';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await getPublicFollowing(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
