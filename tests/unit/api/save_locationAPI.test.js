import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  saveUserLocation,
  setPrimaryLocation,
  deleteUserLocation
} from '@/api/save_locationAPI';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn()
  }
}));

describe('save_locationAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('saveUserLocation', () => {
    it('應該成功儲存地點', async () => {
      // Arrange
      const params = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家',
        is_primary: true,
        formatted_address: '台中市'
      };

      const mockLocationData = {
        id: 1,
        user_id: 'user-123',
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家',
        is_primary: true,
        formatted_address: '台中市'
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: { success: true, data: mockLocationData },
        error: null
      });

      // Act
      const result = await saveUserLocation(params);

      // Assert
      expect(result).toEqual(mockLocationData);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('save-location', {
        body: params
      });
    });

    it('應該使用預設參數', async () => {
      // Arrange
      const params = {
        latitude: 24.1817,
        longitude: 120.7344
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: { success: true, data: {} },
        error: null
      });

      // Act
      await saveUserLocation(params);

      // Assert
      expect(supabase.functions.invoke).toHaveBeenCalledWith('save-location', {
        body: {
          latitude: 24.1817,
          longitude: 120.7344,
          type: '家',
          is_primary: false,
          formatted_address: null
        }
      });
    });

    it('應該在緯度無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(
        saveUserLocation({ latitude: -91, longitude: 120.7344 })
      ).rejects.toThrow('Invalid latitude: must be between -90 and 90');

      await expect(
        saveUserLocation({ latitude: 91, longitude: 120.7344 })
      ).rejects.toThrow('Invalid latitude: must be between -90 and 90');

      await expect(
        saveUserLocation({ latitude: 'abc', longitude: 120.7344 })
      ).rejects.toThrow('Invalid latitude: must be between -90 and 90');
    });

    it('應該在經度無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(
        saveUserLocation({ latitude: 24.1817, longitude: -181 })
      ).rejects.toThrow('Invalid longitude: must be between -180 and 180');

      await expect(
        saveUserLocation({ latitude: 24.1817, longitude: 181 })
      ).rejects.toThrow('Invalid longitude: must be between -180 and 180');

      await expect(
        saveUserLocation({ latitude: 24.1817, longitude: 'xyz' })
      ).rejects.toThrow('Invalid longitude: must be between -180 and 180');
    });

    it('應該在類型無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(
        saveUserLocation({ latitude: 24.1817, longitude: 120.7344, type: '學校' })
      ).rejects.toThrow('Invalid type: must be "家" or "公司"');
    });

    it('應該在 Edge Function 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Edge function failed';
      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      // Act & Assert
      await expect(
        saveUserLocation({ latitude: 24.1817, longitude: 120.7344 })
      ).rejects.toThrow(errorMessage);
    });

    it('應該在回傳失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Save failed';
      supabase.functions.invoke.mockResolvedValueOnce({
        data: { success: false, error: errorMessage },
        error: null
      });

      // Act & Assert
      await expect(
        saveUserLocation({ latitude: 24.1817, longitude: 120.7344 })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('setPrimaryLocation', () => {
    it('應該成功設定主要地點', async () => {
      // Arrange
      const locationId = 123;
      const mockUser = { id: 'user-123' };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      // 第一次 eq() 返回 this，第二次 eq() 返回結果
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ error: null });

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await setPrimaryLocation(locationId);

      // Assert
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('locations');
    });

    it('應該在使用者未登入時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act & Assert
      await expect(setPrimaryLocation(123)).rejects.toThrow('User not authenticated');
    });

    it('應該在更新失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Update failed';

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ error: { message: errorMessage } });

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(setPrimaryLocation(123)).rejects.toThrow('Failed to set primary location');
    });
  });

  describe('deleteUserLocation', () => {
    it('應該成功刪除地點', async () => {
      // Arrange
      const locationId = 123;
      const mockUser = { id: 'user-123' };

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ error: null });

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act
      const result = await deleteUserLocation(locationId);

      // Assert
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('locations');
    });

    it('應該在使用者未登入時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act & Assert
      await expect(deleteUserLocation(123)).rejects.toThrow('User not authenticated');
    });

    it('應該在刪除失敗時拋出錯誤', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const errorMessage = 'Delete failed';

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ error: { message: errorMessage } });

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      supabase.from.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(deleteUserLocation(123)).rejects.toThrow('Failed to delete location');
    });
  });
});
