import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getCurrentPosition, saveLocation } from '@/api/location';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn()
};

describe('location API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    
    // Setup navigator.geolocation mock
    global.navigator = {
      geolocation: mockGeolocation
    };
  });

  describe('getCurrentPosition', () => {
    it('應該成功獲取當前位置', async () => {
      // Arrange
      const mockPosition = {
        coords: {
          latitude: 25.03,
          longitude: 121.56,
          accuracy: 10
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // Act
      const result = await getCurrentPosition();

      // Assert
      expect(result).toEqual({
        latitude: 25.03,
        longitude: 121.56,
        accuracy: 10
      });
    });

    it('應該在瀏覽器不支援時拋出錯誤', async () => {
      // Arrange
      global.navigator = {};

      // Act & Assert
      await expect(getCurrentPosition()).rejects.toThrow('瀏覽器不支援地理定位功能');
    });

    it('應該在使用者拒絕時拋出錯誤', async () => {
      // Arrange
      global.navigator = { geolocation: mockGeolocation };
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, PERMISSION_DENIED: 1 });
      });

      // Act & Assert
      await expect(getCurrentPosition()).rejects.toThrow('用戶拒絕提供位置權限');
    });

    it('應該在無法取得位置時拋出錯誤', async () => {
      // Arrange
      global.navigator = { geolocation: mockGeolocation };
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 2, POSITION_UNAVAILABLE: 2 });
      });

      // Act & Assert
      await expect(getCurrentPosition()).rejects.toThrow('無法取得位置資訊');
    });

    it('應該在超時時拋出錯誤', async () => {
      // Arrange
      global.navigator = { geolocation: mockGeolocation };
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 3, TIMEOUT: 3 });
      });

      // Act & Assert
      await expect(getCurrentPosition()).rejects.toThrow('取得位置逾時，請稍後再試');
    });

    it('應該支援自訂選項', async () => {
      // Arrange
      const mockPosition = {
        coords: { latitude: 25.03, longitude: 121.56, accuracy: 10 }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const customOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      };

      // Act
      await getCurrentPosition(customOptions);

      // Assert
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        customOptions
      );
    });
  });

  describe('saveLocation', () => {
    const userToken = 'valid-token-123';

    it('應該成功儲存地點', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 123,
          latitude: 24.1817,
          longitude: 120.7344,
          district: '台中市南屯區',
          type: '家',
          is_primary: true
        }
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      // Act
      const result = await saveLocation(locationData, userToken);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('save-location', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: 24.1817,
          longitude: 120.7344,
          type: '家'
        })
      });
    });

    it('應該支援設定主要地點', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '公司',
        is_primary: true
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: { success: true, data: {} },
        error: null
      });

      // Act
      await saveLocation(locationData, userToken);

      // Assert
      expect(supabase.functions.invoke).toHaveBeenCalledWith('save-location', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: 24.1817,
          longitude: 120.7344,
          type: '公司',
          is_primary: true
        })
      });
    });

    it('應該在緯度無效時拋出錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 'invalid',
        longitude: 120.7344,
        type: '家'
      };

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow('緯度與經度必須為數字');
    });

    it('應該在經度無效時拋出錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 'invalid',
        type: '家'
      };

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow('緯度與經度必須為數字');
    });

    it('應該在類型無效時拋出錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '學校'
      };

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow('地點類型僅支援「家」和「公司」');
    });

    it('應該在缺少 token 時拋出錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家'
      };

      // Act & Assert
      await expect(saveLocation(locationData, null)).rejects.toThrow('缺少使用者授權 Token');
      await expect(saveLocation(locationData, '')).rejects.toThrow('缺少使用者授權 Token');
    });

    it('應該在 400 錯誤時拋出請求錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家'
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: 400
      });

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow('請求錯誤');
    });

    it('應該在 401 錯誤時拋出授權錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家'
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: 401
      });

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow('未授權，請重新登入');
    });

    it('應該在 500 錯誤時拋出伺服器錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家'
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: 500
      });

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow('伺服器錯誤，請稍後再試');
    });

    it('應該在未知錯誤時拋出預設錯誤', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家'
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: 999
      });

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow();
    });

    it('應該在網路錯誤時拋出網路連線失敗', async () => {
      // Arrange
      const locationData = {
        latitude: 24.1817,
        longitude: 120.7344,
        type: '家'
      };

      supabase.functions.invoke.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(saveLocation(locationData, userToken)).rejects.toThrow('網路連線失敗，請檢查您的網路');
    });
  });

  describe('getCurrentPosition', () => {
    it('應該在未知錯誤碼時拋出未知錯誤', async () => {
      // Arrange
      global.navigator = { geolocation: mockGeolocation };
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 999 });
      });

      // Act & Assert
      await expect(getCurrentPosition()).rejects.toThrow('取得位置時發生未知錯誤');
    });
  });
});
