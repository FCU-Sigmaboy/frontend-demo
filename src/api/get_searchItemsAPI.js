import { supabase } from '@/lib/supabase'; // 假設您已在 @/lib/supabase.js 初始化

// ===================================================================
// ### 物品搜尋 API (Item Search API)
// ===================================================================

// *** 移除 getCurrentLocation 輔助函式 (如果不再需要) ***
// *** 已更新為使用使用者主要地點計算距離 ***

/**
 * 統一的物品搜尋函式 (RPC)
 * (此函式已更新為使用使用者 "主要地點" 計算距離，不再需要傳入經緯度)
 * @param {object} filters - 篩選條件
 * @param {number} [filters.distance_range_km] - (可選) 搜尋半徑 (公里)
 * @param {number} [filters.main_category_id] - (可選) 主分類 ID
 * @param {number} [filters.sub_category_id] - (可選) 子分類 ID
 * @param {string} [filters.keyword] - (可選) 關鍵字或標籤
 * @param {string} [filters.user_id] - (可選) 特定使用者的 UUID
 * @param {number} [filters.page=1] - 頁碼
 * @param {number} [filters.size=20] - 每頁筆數
 * @param {string} [filters.sort_by='created_at'] - 排序 ('created_at', 'distance', 'price')
 * @param {string} [filters.sort_direction='desc'] - 排序方向 ('asc' 或 'desc')
 * @returns {Promise<Array | null>} - 回傳物品陣列, 未登入回傳 null
 */
export async function searchItems(filters = {}) {

    // 1. 檢查使用者是否登入 (RPC 也會檢查)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.warn('searchItems: User not logged in.');
    }

    // 2. 準備傳遞給 RPC 函式的參數
    // *** 不再需要 p_user_latitude, p_user_longitude ***
    const rpcParams = {
        p_distance_range_km: filters.distance_range_km || null,
        p_main_category_id: filters.main_category_id || null,
        p_sub_category_id: filters.sub_category_id || null,
        p_keyword: filters.keyword || null,
        p_user_id: filters.user_id || null,
        p_page: filters.page || 1,
        p_size: filters.size || 20,
        p_sort_by: filters.sort_by || 'created_at',
        p_sort_direction: filters.sort_direction || 'desc'
    };
    console.debug(rpcParams);
    
    // return example;

    // 3. 呼叫 RPC 函式
    const { data, error } = await supabase.rpc('search_items', rpcParams);

    if (error) {
        console.error('Supabase 搜尋物品失敗:', error);
        // 這裡可能會捕捉到 "請先設定您的主要地點" 的錯誤 (如果您選擇方案 A)
        throw new Error(error.message);
    }

    // RPC 回傳的 data 就是完美的 DTO，直接回傳
    return data;
}

// data 範例
const example = [
  {
    "item_id": 101,
    "title": "（全新）IKEA 檯燈",
    "image_url": "https://.../item101_cover.jpg",
    "price": 500,
    "distance_km": "1.254",
    "formatted_address": "台中市西屯區福星路",
    "created_at": "2025-10-18T10:30:00.123+00:00",
    "updated_at": "2025-10-18T10:30:00.123+00:00",
    "favorited_at": "2025-10-20T09:00:00.000+00:00",
    "favorites_count": 15,
    "user": {
      "id": "a1b2c3d4-e5f6-4a5b-8c9d-123456789abc",
      "nickname": "Joseph",
      "profile_picture_url": "https://.../joseph.jpg"
    }
  },
  {
    "item_id": 205,
    "title": "二手登山背包",
    "image_url": "https://.../backpack.png",
    "price": 800,
    "distance_km": "4.881",
    "formatted_address": "台中市北屯區文心路",
    "created_at": "2025-10-17T15:00:00.456+00:00",
    "updated_at": "2025-10-17T15:00:00.456+00:00",
    // "favorited_at": "2025-10-18T15:30:00+00:00",
    "favorites_count": 5,
    "user": {
      "id": "b2c3d4e5-xxxx-xxxx-xxxx-user002",
      "nickname": "Amber",
      "profile_picture_url": null
    }
  },
  {
    "item_id": 1,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/6fb8a5/ffffff?text=Product+1",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T10:30:00.000+00:00",
    "updated_at": "2025-10-25T10:30:00.000+00:00",
    "favorited_at": "2025-10-28T09:00:00.000+00:00",
    "favorites_count": 12,
    "user": {
      "id": "a1b2c3d4-1111-4a5b-8c9d-000000000001",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=A"
    }
  },
  {
    "item_id": 2,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/5a9d8c/ffffff?text=Product+2",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T11:00:00.000+00:00",
    "updated_at": "2025-10-25T11:00:00.000+00:00",
    // "favorited_at": "2025-10-28T09:30:00.000+00:00",
    "favorites_count": 7,
    "user": {
      "id": "a1b2c3d4-2222-4a5b-8c9d-000000000002",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=B"
    }
  },
  {
    "item_id": 3,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/4a8b7d/ffffff?text=Product+3",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T11:30:00.000+00:00",
    "updated_at": "2025-10-25T11:30:00.000+00:00",
    // "favorited_at": "2025-10-28T10:00:00.000+00:00",
    "favorites_count": 9,
    "user": {
      "id": "a1b2c3d4-3333-4a5b-8c9d-000000000003",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=C"
    }
  },
  {
    "item_id": 4,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/3a7a6e/ffffff?text=Product+4",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T12:00:00.000+00:00",
    "updated_at": "2025-10-25T12:00:00.000+00:00",
    // "favorited_at": "2025-10-28T10:30:00.000+00:00",
    "favorites_count": 10,
    "user": {
      "id": "a1b2c3d4-4444-4a5b-8c9d-000000000004",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=D"
    }
  },
  {
    "item_id": 5,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/6fb8a5/ffffff?text=Product+5",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T12:30:00.000+00:00",
    "updated_at": "2025-10-25T12:30:00.000+00:00",
    "favorited_at": "2025-10-28T11:00:00.000+00:00",
    "favorites_count": 8,
    "user": {
      "id": "a1b2c3d4-5555-4a5b-8c9d-000000000005",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=E"
    }
  },
  {
    "item_id": 6,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/5a9d8c/ffffff?text=Product+6",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T13:00:00.000+00:00",
    "updated_at": "2025-10-25T13:00:00.000+00:00",
    "favorited_at": "2025-10-28T11:30:00.000+00:00",
    "favorites_count": 11,
    "user": {
      "id": "a1b2c3d4-6666-4a5b-8c9d-000000000006",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=F"
    }
  },
  {
    "item_id": 7,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/4a8b7d/ffffff?text=Product+7",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T13:30:00.000+00:00",
    "updated_at": "2025-10-25T13:30:00.000+00:00",
    "favorited_at": "2025-10-28T12:00:00.000+00:00",
    "favorites_count": 6,
    "user": {
      "id": "a1b2c3d4-7777-4a5b-8c9d-000000000007",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=G"
    }
  },
  {
    "item_id": 8,
    "title": "物品名稱",
    "image_url": "https://placehold.co/330x250/3a7a6e/ffffff?text=Product+8",
    "price": 700,
    "distance_km": "0.500",
    "formatted_address": "台中市西屯區",
    "created_at": "2025-10-25T14:00:00.000+00:00",
    "updated_at": "2025-10-25T14:00:00.000+00:00",
    "favorited_at": "2025-10-28T12:30:00.000+00:00",
    "favorites_count": 9,
    "user": {
      "id": "a1b2c3d4-8888-4a5b-8c9d-000000000008",
      "nickname": "提供者名稱",
      "profile_picture_url": "https://placehold.co/32/1e1e1e/ffffff?text=H"
    }
  }
];