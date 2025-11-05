import { supabase } from '@/lib/supabase';
import { uploadItemImages } from './upload_imageAPI';

// ===================================================================
// ### 刊登物品 API (Item APIs)
// ===================================================================

/**
 * 【功能】刊登一個新物品 (RPC)
 * @param {object} itemData - 來自前端表單的完整物件
 * - itemData.sub_category_id (Number) - 必填
 * - itemData.user_location_id (Number) - 必填
 * - itemData.title (String) - 必填
 * - itemData.description (String) - 必填
 * - itemData.condition (String) - 必填 ('全新', '近全新'...)
 * - itemData.price (Number) - 必填
 * - itemData.carbon_value (Number) - 可選
 * - itemData.image_urls (Array<String>) - 可選 (已上傳到 Storage 的 URL)
 * - itemData.tags (Array<String>) - 可選
 * @returns {Promise<object>} - 回傳新建的 item
 */
export async function createItem(itemData) {
    const rpcParams = {
        p_sub_category_id: itemData.sub_category_id,
        p_user_location_id: itemData.user_location_id,
        p_title: itemData.title,
        p_description: itemData.description,
        p_condition: itemData.condition,
        p_price: itemData.price,
        p_carbon_value: itemData.carbon_value,
        p_image_urls: itemData.image_urls,
        p_tags: itemData.tags
    };

    console.log("Item data", itemData);
    

    const { data, error } = await supabase.rpc('create_item', rpcParams);

    if (error) {
        console.error('Supabase 刊登物品失敗:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * 【功能】完整刊登流程 (上傳圖片 + 建立物品)
 * @param {object} itemData - 物品資料
 * @param {File[]} imageFiles - 圖片檔案陣列（可以是原始檔案或已壓縮檔案）
 * @param {boolean} filesAlreadyCompressed - 檔案是否已經壓縮過（預設 false）
 * @returns {Promise<object>} - 回傳新建的 item
 */
export async function createItemWithImages(itemData, imageFiles = [], filesAlreadyCompressed = false) {
    try {
        // 1. 獲取當前使用者 ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('使用者未登入');
        }

        // 2. 產生臨時 ID 用於圖片路徑
        const tempItemId = `temp-${Date.now()}`;

        // 3. 上傳圖片 (若有提供)
        // 如果檔案已經壓縮過，告訴 upload API 跳過壓縮
        let imageUrls = [];
        if (imageFiles && imageFiles.length > 0) {
            imageUrls = await uploadItemImages(imageFiles, user.id, tempItemId, !filesAlreadyCompressed);
        }

        // 4. 建立物品 (傳入圖片 URL)
        const result = await createItem({
            ...itemData,
            image_urls: imageUrls
        });

        return result;
    } catch (error) {
        console.error('刊登物品流程失敗:', error);
        throw error;
    }
}