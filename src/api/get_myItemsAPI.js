import { supabase } from '@/lib/supabase';

// ===================================================================
// ### 我的刊登物品 API (Item APIs)
// ===================================================================

/**
 * 【功能】獲取 "當前登入者" 刊登的所有物品
 * (使用 RPC 實現，包含 favorites_count)
 * @param {object} options - (可選) 排序與分頁
 * @param {number} [options.page=1] - 頁碼
 * @param {number} [options.size=20] - 每頁筆數
 * @param {string} [options.sort_by='created_at'] - 排序欄位
 * @param {string} [options.sort_direction='desc'] - 排序方向
 * @returns {Promise<Array | null>} - 回傳物品陣列, 未登入回傳 null
 */
export async function getMyItems(options = {}) {

    // 1. "前置作業": 獲取當前登入的使用者
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.warn('getMyItems: User not logged in.');
        return null;
    }

    // 2. 準備 RPC 參數
    const rpcParams = {
        p_page: options.page || 1,
        p_size: options.size || 20,
        p_sort_by: options.sort_by || 'created_at',
        p_sort_direction: options.sort_direction || 'desc'
    };

    console.log('Calling get_my_items RPC with params:', rpcParams);

    // 3. 呼叫 RPC 函式
    const { data, error } = await supabase.rpc('get_my_items', rpcParams);

    // 4. 錯誤處理
    if (error) {
        console.error('Supabase 獲取 "我的物品" 失敗:', error);
        throw new Error(error.message);
    }

    // 5. data 就是您要的 JSON 陣列，直接回傳
    return data;
}

/* ===== RPC 回傳範例 (Example Response) =====
[
  {
    "item_id": 101,
    "title": "IKEA 檯燈",
    "image_url": "https://...",
    "price": 500,
    "listing_status": true,
    "created_at": "2025-10-18T10:30:00.123+00:00",
    "updated_at": "2025-10-18T10:30:00.123+00:00",
    "favorites_count": 15
  },
  {
    "item_id": 133,
    "title": "二手漫畫",
    "image_url": "https://...",
    "price": 100,
    "listing_status": false,
    "created_at": "2025-10-16T09:15:00.789+00:00",
    "updated_at": "2025-10-17T11:20:00.000+00:00",
    "favorites_count": 2
  }
]
*/
