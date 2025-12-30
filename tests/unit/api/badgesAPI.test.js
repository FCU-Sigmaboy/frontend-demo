import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getUserBadgesWithProgress,
  manuallyCheckBadges,
  dailySignIn
} from '@/api/badgesAPI';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}));

describe('badgesAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('getUserBadgesWithProgress', () => {
    it('應該成功獲取當前用戶的徽章', async () => {
      // Arrange
      const mockBadgesData = {
        user_id: 'user-123',
        earned_badges: [
          { badge_id: 1, name: '新手徽章', earned_at: '2025-01-01' }
        ],
        in_progress_badges: [
          { badge_id: 2, name: '進階徽章', progress: 50 }
        ]
      };

      supabase.rpc.mockResolvedValueOnce({
        data: mockBadgesData,
        error: null
      });

      // Act
      const result = await getUserBadgesWithProgress();

      // Assert
      expect(result).toEqual(mockBadgesData);
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_badges_with_progress', {
        p_user_id: null
      });
    });

    it('應該成功獲取指定用戶的徽章', async () => {
      // Arrange
      const userId = 'user-456';
      const mockBadgesData = {
        user_id: userId,
        earned_badges: [],
        in_progress_badges: []
      };

      supabase.rpc.mockResolvedValueOnce({
        data: mockBadgesData,
        error: null
      });

      // Act
      const result = await getUserBadgesWithProgress(userId);

      // Assert
      expect(result).toEqual(mockBadgesData);
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_badges_with_progress', {
        p_user_id: userId
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
      await expect(getUserBadgesWithProgress()).rejects.toThrow(errorMessage);
    });
  });

  describe('manuallyCheckBadges', () => {
    it('應該成功手動檢查徽章', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const mockCheckResult = {
        newly_earned_count: 2,
        total_points_awarded: 50,
        badges: [
          { badge_id: 1, name: '新徽章1' },
          { badge_id: 2, name: '新徽章2' }
        ]
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.rpc.mockResolvedValueOnce({
        data: mockCheckResult,
        error: null
      });

      // Act
      const result = await manuallyCheckBadges();

      // Assert
      expect(result).toEqual(mockCheckResult);
      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.rpc).toHaveBeenCalledWith('manually_check_badges');
    });

    it('應該在使用者未登入時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act & Assert
      await expect(manuallyCheckBadges()).rejects.toThrow('使用者未登入');
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Check badges failed';

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      // Act & Assert
      await expect(manuallyCheckBadges()).rejects.toThrow(errorMessage);
    });
  });

  describe('dailySignIn', () => {
    it('應該成功簽到', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const mockSignInResult = {
        success: true,
        streak_days: 5,
        points_awarded: 10,
        new_badges: []
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.rpc.mockResolvedValueOnce({
        data: mockSignInResult,
        error: null
      });

      // Act
      const result = await dailySignIn();

      // Assert
      expect(result).toEqual(mockSignInResult);
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('應該在使用者未登入時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act & Assert
      await expect(dailySignIn()).rejects.toThrow('使用者未登入');
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Sign in failed';

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      // Act & Assert
      await expect(dailySignIn()).rejects.toThrow(errorMessage);
    });
  });
});
