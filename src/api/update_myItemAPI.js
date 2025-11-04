import { supabase } from '@/lib/supabase';

// ===================================================================
// ### 更新物品 API (Item APIs)
// ===================================================================

/**
 * 【功能】更新 "當前登入者" 的指定物品
 * @param {number} itemId - 要更新的物品 ID
 * @param {object} updateData - 包含 "有變動" 欄位的物件
 * e.g., { title: '新標題', price: 600, listing_status: false }
 * @returns {Promise<object>} - 回傳更新後的完整物品物件
 */
export async function updateMyItem(itemId, updateData) {
    // 1. 檢查使用者是否登入
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('使用者未登入，無法更新物品');
    }

    console.log(`📝 Updating item #${itemId}:`, updateData);

    try {
        // 2. 如果要更新 location_id，先驗證該地點屬於當前使用者
        if (updateData.location_id) {
            const { data: locationCheck, error: locationError } = await supabase
                .from('locations')
                .select('id')
                .eq('id', updateData.location_id)
                .eq('user_id', user.id)
                .single();

            if (locationError || !locationCheck) {
                throw new Error('無效的地點 ID，或該地點不屬於當前使用者。請先在個人資料中新增此地區。');
            }
        }

        // 3. 更新物品 (使用 direct query - RPC may not exist)
        const { data, error } = await supabase
            .from('items')
            .update(updateData)
            .eq('id', itemId)
            .eq('user_id', user.id) // Ensure user owns this item
            .select()
            .single();

        if (error) {
            console.error(`Failed to update item #${itemId}:`, error);
            throw new Error(error.message);
        }

        console.log(`✅ Item #${itemId} updated:`, data);
        return data;
    } catch (error) {
        console.error('Error updating item:', error);
        throw error;
    }
}

/**
 * 【功能】切換物品上架/下架狀態
 * @param {number} itemId - 物品 ID
 * @param {boolean} listingStatus - true = 上架, false = 下架
 * @returns {Promise<object>} - 回傳更新後的物品
 */
export async function toggleItemStatus(itemId, listingStatus) {
    return updateMyItem(itemId, { listing_status: listingStatus });
}

/**
 * 【功能】刪除物品 (Hard delete - 直接從資料庫移除)
 * NOTE: 資料庫目前沒有 deleted_at 欄位，所以使用硬刪除
 * 如需軟刪除，請通知後端團隊新增 deleted_at TIMESTAMPTZ 欄位
 * @param {number} itemId - 物品 ID
 * @returns {Promise<object>} - 回傳刪除結果
 */
export async function deleteMyItem(itemId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('使用者未登入，無法刪除物品');
    }

    console.log(`🗑️ Deleting item #${itemId}`);

    try {
        // Hard delete: permanently remove the row
        const { data, error } = await supabase
            .from('items')
            .delete()
            .eq('id', itemId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error(`Failed to delete item #${itemId}:`, error);
            throw new Error(error.message);
        }

        console.log(`✅ Item #${itemId} permanently deleted`);
        return data;
    } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
}
