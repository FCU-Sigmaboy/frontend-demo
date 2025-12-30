import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getItemDetails } from '@/api/get_ItemDetailAPI';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn()
  }
}));

describe('get_ItemDetailAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('getItemDetails', () => {
    it('應該成功獲取物品詳情', async () => {
      // Arrange
      const itemId = 1;
      const mockItemDetail = {
        item_id: 1,
        title: 'IKEA 檯燈',
        price: 500,
        description: '九成新',
        seller_id: 'seller-123',
        seller_nickname: '賣家A',
        distance: 2.5
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.maybeSingle.mockResolvedValueOnce({
        data: mockItemDetail,
        error: null
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result).toBeDefined();
      expect(supabase.rpc).toHaveBeenCalledWith('get_item_details_with_location_v2', {
        p_item_id: itemId,
        p_user_lat: null,
        p_user_lng: null,
        p_use_secondary_location: false
      });
    });

    it('應該支援傳入當前位置', async () => {
      // Arrange
      const itemId = 1;
      const options = {
        userLat: 25.03,
        userLng: 121.56
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.maybeSingle.mockResolvedValueOnce({
        data: { item_id: 1 },
        error: null
      });

      // Act
      await getItemDetails(itemId, options);

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_item_details_with_location_v2', {
        p_item_id: itemId,
        p_user_lat: 25.03,
        p_user_lng: 121.56,
        p_use_secondary_location: false
      });
    });

    it('應該支援使用次要地點', async () => {
      // Arrange
      const itemId = 1;
      const options = {
        useSecondaryLocation: true
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.maybeSingle.mockResolvedValueOnce({
        data: { item_id: 1 },
        error: null
      });

      // Act
      await getItemDetails(itemId, options);

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('get_item_details_with_location_v2', {
        p_item_id: itemId,
        p_user_lat: null,
        p_user_lng: null,
        p_use_secondary_location: true
      });
    });

    it('應該在 itemId 無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(getItemDetails(null)).rejects.toThrow('itemId 必須是有效的數字');
      await expect(getItemDetails('abc')).rejects.toThrow('itemId 必須是有效的數字');
      await expect(getItemDetails(0)).rejects.toThrow('itemId 必須是正整數');
      await expect(getItemDetails(-1)).rejects.toThrow('itemId 必須是正整數');
    });

    it('應該在經緯度參數不完整時拋出錯誤', async () => {
      // Arrange
      const itemId = 1;

      // Act & Assert
      await expect(
        getItemDetails(itemId, { userLat: 25.03 })
      ).rejects.toThrow('經緯度參數必須同時提供或同時為空');

      await expect(
        getItemDetails(itemId, { userLng: 121.56 })
      ).rejects.toThrow('經緯度參數必須同時提供或同時為空');
    });

    it('應該在緯度超出範圍時拋出錯誤', async () => {
      // Arrange
      const itemId = 1;

      // Act & Assert
      await expect(
        getItemDetails(itemId, { userLat: -91, userLng: 121.56 })
      ).rejects.toThrow('緯度必須在 -90 到 90 之間');

      await expect(
        getItemDetails(itemId, { userLat: 91, userLng: 121.56 })
      ).rejects.toThrow('緯度必須在 -90 到 90 之間');
    });

    it('應該在經度超出範圍時拋出錯誤', async () => {
      // Arrange
      const itemId = 1;

      // Act & Assert
      await expect(
        getItemDetails(itemId, { userLat: 25.03, userLng: -181 })
      ).rejects.toThrow('經度必須在 -180 到 180 之間');

      await expect(
        getItemDetails(itemId, { userLat: 25.03, userLng: 181 })
      ).rejects.toThrow('經度必須在 -180 到 180 之間');
    });

    it('應該在未登入時仍能查看物品', async () => {
      // Arrange
      const itemId = 1;

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      supabase.maybeSingle.mockResolvedValueOnce({
        data: { item_id: 1, title: 'Test Item' },
        error: null
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
