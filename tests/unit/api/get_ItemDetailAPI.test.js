import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getItemDetails, checkUserAuthentication } from '@/api/get_ItemDetailAPI';

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
      const result1 = await getItemDetails(null);
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('itemId');

      const result2 = await getItemDetails('abc');
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('itemId');

      const result3 = await getItemDetails(0);
      expect(result3.success).toBe(false);
      expect(result3.message).toContain('正整數');

      const result4 = await getItemDetails(-1);
      expect(result4.success).toBe(false);
      expect(result4.message).toContain('正整數');
    });

    it('應該在經緯度參數不完整時拋出錯誤', async () => {
      // Arrange
      const itemId = 1;

      // Act & Assert
      const result1 = await getItemDetails(itemId, { userLat: 25.03 });
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('經緯度參數必須同時提供或同時為空');

      const result2 = await getItemDetails(itemId, { userLng: 121.56 });
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('經緯度參數必須同時提供或同時為空');
    });

    it('應該在緯度超出範圍時拋出錯誤', async () => {
      // Arrange
      const itemId = 1;

      // Act & Assert
      const result1 = await getItemDetails(itemId, { userLat: -91, userLng: 121.56 });
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('緯度必須在 -90 到 90 之間');

      const result2 = await getItemDetails(itemId, { userLat: 91, userLng: 121.56 });
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('緯度必須在 -90 到 90 之間');
    });

    it('應該在經度超出範圍時拋出錯誤', async () => {
      // Arrange
      const itemId = 1;

      // Act & Assert
      const result1 = await getItemDetails(itemId, { userLat: 25.03, userLng: -181 });
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('經度必須在 -180 到 180 之間');

      const result2 = await getItemDetails(itemId, { userLat: 25.03, userLng: 181 });
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('經度必須在 -180 到 180 之間');
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

    it('應該處理 RPC 返回的錯誤物件', async () => {
      // Arrange
      const itemId = 1;

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.rpc.mockReturnThis();
      supabase.maybeSingle.mockResolvedValueOnce({
        data: {
          error: true,
          code: 'ITEM_NOT_AVAILABLE',
          message: '物品已下架'
        },
        error: null
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.code).toBe('ITEM_NOT_AVAILABLE');
      expect(result.message).toBe('物品已下架');
    });

    it('應該處理 RPC 查詢錯誤', async () => {
      // Arrange
      const itemId = 1;

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.rpc.mockReturnThis();
      supabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('資料庫');
    });

    it('應該處理未找到物品的情況', async () => {
      // Arrange
      const itemId = 999;

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.rpc.mockReturnThis();
      supabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.code).toBe('ITEM_NOT_FOUND');
      expect(result.message).toContain('物品');
    });

    it('應該正確解析字串格式的 location coordinates', async () => {
      // Arrange
      const itemId = 1;
      const mockItemDetail = {
        item_id: 1,
        title: 'Test Item',
        location: {
          coordinates: '{"type":"Point","coordinates":[120.646,24.180]}'
        },
        user_location: {
          coordinates: '{"type":"Point","coordinates":[121.5,25.0]}'
        }
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.rpc.mockReturnThis();
      supabase.maybeSingle.mockResolvedValueOnce({
        data: mockItemDetail,
        error: null
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.location.coordinates).toEqual({
        type: 'Point',
        coordinates: [120.646, 24.180]
      });
      expect(result.data.user_location.coordinates).toEqual({
        type: 'Point',
        coordinates: [121.5, 25.0]
      });
    });

    it('應該處理座標解析失敗', async () => {
      // Arrange
      const itemId = 1;
      const mockItemDetail = {
        item_id: 1,
        title: 'Test Item',
        location: {
          coordinates: 'invalid-json'
        }
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.rpc.mockReturnThis();
      supabase.maybeSingle.mockResolvedValueOnce({
        data: mockItemDetail,
        error: null
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.location.coordinates).toBeNull();
    });

    it('應該正確返回 locationSource 和 distance 資訊', async () => {
      // Arrange
      const itemId = 1;
      const mockItemDetail = {
        item_id: 1,
        title: 'Test Item',
        distance_km: 2.5,
        user_location: {
          source: 'current_position'
        },
        is_owner: false
      };

      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      supabase.rpc.mockReturnThis();
      supabase.maybeSingle.mockResolvedValueOnce({
        data: mockItemDetail,
        error: null
      });

      // Act
      const result = await getItemDetails(itemId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.locationSource).toBe('current_position');
      expect(result.hasDistance).toBe(true);
      expect(result.isOwner).toBe(false);
      expect(result.data.distance_km).toBe(2.5);
    });
  });

  describe('checkUserAuthentication', () => {
    it('應該在使用者已登入時返回 true', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null
      });

      // Act
      const result = await checkUserAuthentication();

      // Assert
      expect(result).toBe(true);
    });

    it('應該在使用者未登入時返回 false', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      // Act
      const result = await checkUserAuthentication();

      // Assert
      expect(result).toBe(false);
    });

    it('應該在發生錯誤時返回 false', async () => {
      // Arrange
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Auth error' }
      });

      // Act
      const result = await checkUserAuthentication();

      // Assert
      expect(result).toBe(false);
    });

    it('應該在拋出異常時返回 false', async () => {
      // Arrange
      supabase.auth.getUser.mockRejectedValueOnce(new Error('Unexpected error'));

      // Act
      const result = await checkUserAuthentication();

      // Assert
      expect(result).toBe(false);
    });
  });
});
