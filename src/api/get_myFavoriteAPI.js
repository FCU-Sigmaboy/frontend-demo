import { supabase } from '@/lib/supabase'; // 假設您已在 src/supabaseClient.js 初始化

// ===================================================================
// ### 我的收藏 API (Favorite APIs)
// ===================================================================

/**
 * 【更新版】獲取 "當前登入者" 收藏的所有物品
 * (使用 RPC 實現，回傳結構與 searchItems 相同，並額外包含 favorited_at)
 * @param {object} options - (可選) 排序與分頁
 * @param {number} [options.latitude] - (必填) 當前使用者緯度
 * @param {number} [options.longitude] - (必填) 當前使用者經度
 * @param {number} [options.page=1] - 頁碼
 * @param {number} [options.size=20] - 每頁筆數
 * @param {string} [options.sort_by='favorited_at'] - 排序 ('favorited_at', 'created_at', 'distance', 'price')
 * @param {string} [options.sort_direction='desc'] - 排序方向
 * @returns {Promise<Array | null>} - 回傳收藏物品陣列, 未登入回傳 null
 */
export async function getMyFavoriteItems(options = {}) {
    // 1. 檢查是否已登入 (RPC 內部也會檢查，但前端先檢查可提升體驗)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.warn('getMyFavoriteItems: User not logged in.');
        return null;
    }

    return example;

    // 2. 處理必要的位置資訊
    let latitude = options.latitude;
    let longitude = options.longitude;
    if (latitude == null || longitude == null) {
        // 在真實應用中，您應該在這裡呼叫瀏覽器 API 獲取位置，或使用預設位置
        // 為簡化範例，先拋出錯誤
        throw new Error("獲取收藏列表時必須提供使用者經緯度以計算距離。");
    }


    // 3. 準備 RPC 參數
    const rpcParams = {
        p_user_latitude: latitude,
        p_user_longitude: longitude,
        p_page: options.page || 1,
        p_size: options.size || 20,
        p_sort_by: options.sort_by || 'favorited_at',
        p_sort_direction: options.sort_direction || 'desc'
    };

    // 4. 呼叫 RPC 函式
    const { data, error } = await supabase.rpc('get_my_favorite_items', rpcParams);

    // 5. 錯誤處理
    if (error) {
        console.error('Supabase 獲取 "我的收藏" 失敗:', error);
        throw new Error(error.message);
    }

    // 6. RPC 回傳的 data 就是完美的 DTO，直接回傳
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
    "created_at": "2025-10-18T10:30:00.123+00:00", // 物品建立時間
    "updated_at": "2025-10-18T10:30:00.123+00:00", // 物品更新時間
    "favorites_count": 15,
    "favorited_at": "2025-10-19T08:00:00+00:00", // *** 收藏時間 ***
    "user": {
      "id": "a1b2c3d4-e5f6-4a5b-8c9d-123456789abc", // 物品刊登者
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
    "favorites_count": 5,
    "favorited_at": "2025-10-18T15:30:00+00:00", // *** 收藏時間 ***
    "user": {
      "id": "b2c3d4e5-xxxx-xxxx-xxxx-user002", // 物品刊登者
      "nickname": "Amber",
      "profile_picture_url": null
    }
  }
]