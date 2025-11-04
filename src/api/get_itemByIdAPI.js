import { supabase } from '@/lib/supabase';

// ===================================================================
// ### 獲取單一物品 API (Item APIs)
// ===================================================================

/**
 * 【功能】獲取指定物品的完整資訊
 * @param {number} itemId - 物品 ID
 * @returns {Promise<object|null>} - 回傳物品物件或 null
 */
export async function getItemById(itemId) {
    try {
        console.log(`🔍 Fetching item #${itemId}...`);

        const { data, error } = await supabase
            .from('items')
            .select(`
                id,
                user_id,
                sub_category_id,
                title,
                description,
                condition,
                listing_status,
                price,
                image_urls,
                tags,
                created_at,
                updated_at
            `)
            .eq('id', itemId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn(`Item #${itemId} not found`);
                return null;
            }
            console.error('Failed to fetch item:', error);
            throw new Error(error.message);
        }

        console.log('✅ Item loaded:', data);
        return data;
    } catch (error) {
        console.error('Error fetching item:', error);
        throw error;
    }
}
