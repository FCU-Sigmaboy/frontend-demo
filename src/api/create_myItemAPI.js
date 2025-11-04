import { supabase } from '@/lib/supabase';

// ===================================================================
// ### 刊登物品 API (Item APIs)
// ===================================================================

/**
 * 【功能】刊登一個新物品 (RPC)
 * @param {object} itemData - 來自前端表單的完整物件
 * - itemData.sub_category_id (Number)
 * - itemData.user_location_id (Number)
 * - itemData.title (String)
 * - itemData.description (String)
 * - itemData.condition (String) - '全新', '近全新'...
 * - itemData.price (Number)
 * - itemData.carbon_value (Number)
 * - itemData.image_urls (Array<String>) - ['url1', 'url2'] (已上傳到 Storage)
 * - itemData.tags (Array<String>) - ['#Tag1', '#Tag2']
 * @returns {Promise<object>} - 回傳新建的 item (e.g., { id: 123, title: '...' })
 */
export async function createItem(itemData) {

    // 1. Get user's location ID from their profile
    let userLocationId = itemData.user_location_id;

    if (!userLocationId) {
        // Fetch user's primary location
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: locations } = await supabase
                .from('locations')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_primary', true)
                .single();

            if (locations) {
                userLocationId = locations.id;
                console.log('📍 Found user primary location ID:', userLocationId);
            } else {
                throw new Error('請先在個人資料中設定您的所在地區');
            }
        } else {
            throw new Error('請先登入');
        }
    }

    // 2. 準備 RPC 參數 (欄位名需與 SQL 函式參數完全對應)
    const rpcParams = {
        p_sub_category_id: itemData.sub_category_id || parseInt(itemData.category),
        p_user_location_id: userLocationId,
        p_title: itemData.title,
        p_description: itemData.description,
        p_condition: itemData.condition || '全新', // Default to '全新'
        p_price: parseInt(itemData.price) || 0,
        p_carbon_value: itemData.carbon_value || 0,
        p_image_urls: itemData.images || itemData.image_urls || [],
        p_tags: itemData.tags || []
    };

    console.log('📤 Creating item with params:', rpcParams);

    // 3. 呼叫 RPC 函式
    const { data, error } = await supabase.rpc('create_item', rpcParams);

    // 4. 錯誤處理
    if (error) {
        console.error('Supabase 刊登物品失敗:', error);
        throw new Error(error.message); // 將錯誤往上拋，讓呼叫者知道
    }

    console.log('✅ Item created successfully:', data);

    // 4. 回傳 RPC 回傳的 JSON 結果
    return data;
}

/* ===== 範例資料 (Example Data) =====
Response data:
{
  "id": 124,
  "title": "（全新）IKEA 檯燈"
}
*/
