import { supabase } from '@/lib/supabase'; // 假設您已在 @/lib/supabase.js 初始化

// ===================================================================
// ### 我的刊登物品 API (Item APIs)
// ===================================================================

/**
 * 【功能】獲取 "當前登入者" 刊登的所有物品
 * (用於 "我的刊登物品" 頁面，使用前端 select() 實現)
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
        return null; // 未登入則不執行查詢
    }

    // 2. 這是您要的 DTO (欄位同之前討論)
    const selectQuery = `
    id,
    title,
    cover_image_url:image_urls[1],
    condition,
    listing_status,
    price,
    created_at,
    updated_at
  `;

    // 3. 處理排序與分頁
    const page = options.page || 1;
    const size = options.size || 20;
    const offset = (page - 1) * size;
    const sort_by = options.sort_by || 'created_at';
    const sort_dir = options.sort_direction || 'desc';

    return example;

    // 4. 建立查詢
    const { data, error } = await supabase
        .from('items')
        .select(selectQuery)
        .eq('user_id', user.id) // <-- 關鍵篩選，只抓自己的
        // .is('deleted_at', null) // <-- 如果您移除了邏輯刪除，這行就不需要
        .order(sort_by, { ascending: sort_dir === 'asc' })
        .range(offset, offset + size - 1);

    // 5. 錯誤處理
    if (error) {
        console.error('Supabase 獲取 "我的物品" 失敗:', error);
        throw new Error(error.message);
    }

    // 6. data 就是您要的 JSON 陣列
    return data;
}

// data 範例
const example = [
  {
    "item_id": 101,
    "title": "（全新）IKEA 檯燈",
    "image_url": "https://<...>.co/storage/v1/object/public/item-images/user123/image_A.jpg",
    "listing_status": true,
    "price": 500,
    "favorites_count": 15,
    "created_at": "2025-10-18T10:30:00.123+00:00",
    "updated_at": "2025-10-18T10:30:00.123+00:00"
  },
  {
    "item_id": 133,
    "title": "（已下架）二手漫畫",
    "image_url": "https://<...>.co/storage/v1/object/public/item-images/user123/manga.jpg",
    "listing_status": false,
    "price": 100,
    "created_at": "2025-10-16T09:15:00.789+00:00",
    "updated_at": "2025-10-17T11:20:00.000+00:00"
  }
  // ... 其他屬於 user123 的物品
]
