import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { updateMyProfile } from '@/api/update_myProfileDetailsAPI';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn()
  }
}));

describe('update_myProfileDetailsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('updateMyProfile', () => {
    it('應該成功更新個人資料', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const userData = {
        nickname: '新暱稱',
        profile_picture_url: 'https://example.com/new-avatar.jpg'
      };
      const profileData = {
        balance: 200
      };
      const locationsArray = [];

      const mockUpdatedProfile = {
        id: 'user-123',
        nickname: '新暱稱',
        profile_picture_url: 'https://example.com/new-avatar.jpg',
        avg_rating: 4.5,
        created_at: '2025-01-01T00:00:00Z',
        profiles: [{
          balance: 200,
          carbon_saved_kg: 25.5,
          updated_at: '2025-01-15T00:00:00Z'
        }],
        locations: []
      };

      const mockUsersQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null })
      };

      const mockProfilesQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: {}, error: null })
      };

      const mockFinalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'users') {
          if (supabase.from.mock.calls.filter(c => c[0] === 'users').length === 1) {
            return mockUsersQuery;
          } else {
            return mockFinalQuery;
          }
        }
        if (table === 'profiles') return mockProfilesQuery;
        return mockUsersQuery;
      });

      // Act
      const result = await updateMyProfile(userData, profileData, locationsArray);

      // Assert
      expect(result).toEqual(mockUpdatedProfile);
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('應該在使用者未登入時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act & Assert
      await expect(updateMyProfile({}, {}, [])).rejects.toThrow('請先登入');
    });

    it('應該在 auth error 時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Auth error' }
      });

      // Act & Assert
      await expect(updateMyProfile({}, {}, [])).rejects.toThrow('請先登入');
    });

    it('應該只更新 userData 當 profileData 為空時', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const userData = { nickname: '新暱稱' };
      const mockUpdatedProfile = {
        id: 'user-123',
        nickname: '新暱稱',
        profiles: [],
        locations: []
      };

      const mockUsersQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null })
      };

      const mockFinalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockUsersQuery : mockFinalQuery;
      });

      // Act
      const result = await updateMyProfile(userData, {}, []);

      // Assert
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('應該在更新 users 失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Update users failed';

      const mockUsersQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: errorMessage }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        return mockUsersQuery;
      });

      // Act & Assert
      await expect(updateMyProfile({ nickname: 'test' }, {}, [])).rejects.toThrow(
        `更新使用者資料失敗: ${errorMessage}`
      );
    });

    it('應該在更新 profiles 失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const userData = { nickname: '新暱稱' };
      const profileData = { balance: 200 };
      const errorMessage = 'Update profiles failed';

      const mockUsersQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null })
      };

      const mockProfilesQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: errorMessage } })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        callCount++;
        if (table === 'users') return mockUsersQuery;
        if (table === 'profiles') return mockProfilesQuery;
        return mockUsersQuery;
      });

      // Act & Assert
      await expect(updateMyProfile(userData, profileData, [])).rejects.toThrow(
        `更新 profile 失敗: ${errorMessage}`
      );
    });

    it('應該處理座標格式錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const locationsArray = [{
        coordinates: { invalid: 'format' },
        type: '家',
        is_primary: true,
        formatted_address: '台中市'
      }];

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockUsersQuery);

      // Act & Assert
      await expect(updateMyProfile({}, {}, locationsArray)).rejects.toThrow('座標格式錯誤');
    });

    it('應該成功更新現有地點', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const locationsArray = [{
        id: 12, // 現有地點 ID
        coordinates: { longitude: 120.646, latitude: 24.180 },
        type: '家',
        is_primary: true,
        formatted_address: '台中市西屯區福星路'
      }];

      const mockLocationsQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      };

      const mockFinalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            locations: [locationsArray[0]]
          },
          error: null
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'locations') return mockLocationsQuery;
        return mockFinalQuery;
      });

      // Act
      const result = await updateMyProfile({}, {}, locationsArray);

      // Assert
      expect(result).toBeDefined();
    });

    it('應該成功插入新地點', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const locationsArray = [{
        // 沒有 id，表示新地點
        coordinates: { longitude: 121.500, latitude: 25.050 },
        type: '次要地點',
        is_primary: false,
        formatted_address: '台北市中山區新地址'
      }];

      const mockLocationsQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      const mockFinalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            locations: [{ ...locationsArray[0], id: 55 }]
          },
          error: null
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'locations') return mockLocationsQuery;
        return mockFinalQuery;
      });

      // Act
      const result = await updateMyProfile({}, {}, locationsArray);

      // Assert
      expect(result).toBeDefined();
    });

    it('應該在更新地點失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Update location failed';
      const locationsArray = [{
        id: 12,
        coordinates: { longitude: 120.646, latitude: 24.180 },
        type: '家',
        is_primary: true,
        formatted_address: '台中市西屯區福星路'
      }];

      const mockLocationsQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockLocationsQuery.eq.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ error: { message: errorMessage } })
      });

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation(() => mockLocationsQuery);

      // Act & Assert
      await expect(updateMyProfile({}, {}, locationsArray)).rejects.toThrow(
        `更新地點失敗: ${errorMessage}`
      );
    });

    it('應該在插入地點失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Insert location failed';
      const locationsArray = [{
        coordinates: { longitude: 121.500, latitude: 25.050 },
        type: '次要地點',
        is_primary: false,
        formatted_address: '台北市中山區新地址'
      }];

      const mockLocationsQuery = {
        insert: vi.fn().mockResolvedValue({ error: { message: errorMessage } })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation(() => mockLocationsQuery);

      // Act & Assert
      await expect(updateMyProfile({}, {}, locationsArray)).rejects.toThrow(
        `新增地點失敗: ${errorMessage}`
      );
    });

    it('應該在獲取最終資料失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Fetch final data failed';
      const userData = { nickname: '新暱稱' };

      const mockUsersQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null })
      };

      const mockFinalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: errorMessage }
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        if (table === 'users') {
          callCount++;
          return callCount === 1 ? mockUsersQuery : mockFinalQuery;
        }
        return mockUsersQuery;
      });

      // Act & Assert
      await expect(updateMyProfile(userData, {}, [])).rejects.toThrow(
        `無法取得更新後的資料: ${errorMessage}`
      );
    });

    it('應該處理 coordinates 物件的不同格式 (nested coordinates)', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const locationsArray = [{
        coordinates: { 
          coordinates: [120.646, 24.180] // GeoJSON 格式
        },
        type: '家',
        is_primary: true,
        formatted_address: '台中市'
      }];

      const mockLocationsQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      const mockFinalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-123', locations: [] },
          error: null
        })
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'locations') return mockLocationsQuery;
        return mockFinalQuery;
      });

      // Act
      const result = await updateMyProfile({}, {}, locationsArray);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
