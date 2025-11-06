import { supabase } from '@/lib/supabase';

// ===================================================================
// ### 追蹤 API (Following APIs)
// ===================================================================

/**
 * 【功能】追蹤指定的使用者 (RPC)
 * @param {string} followingUserId - 您要追蹤的使用者的 UUID
 * @returns {Promise<object>} - 回傳操作結果 (e.g., { success: true, message: '...' })
 */
export async function followUser(followingUserId) {
  // 1. 準備 RPC 參數
  const rpcParams = {
    p_following_id: followingUserId
  };

  // 2. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('follow_user', rpcParams);

  // 3. 錯誤處理
  if (error) {
    // 這裡會捕捉到 RPC 內部的 RAISE EXCEPTION (例如未登入、追蹤自己)
    console.error(`Supabase 追蹤使用者 #${followingUserId} 失敗:`, error);
    throw new Error(error.message); // 將錯誤往上拋
  }

  // 4. 回傳 RPC 回傳的 JSON 結果
  return data;
}

/**
 * 【功能】取消追蹤指定的使用者 (前端 delete)
 * @param {string} followingUserId - 您要取消追蹤的使用者的 UUID
 * @returns {Promise<boolean>} - 回傳 true 表示成功
 */
export async function unfollowUser(followingUserId) {
  // 1. 獲取當前登入者 ID (追蹤者 ID)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('使用者未登入，無法取消追蹤');
  }
  const followerId = user.id;

  // 2. 執行刪除操作
  //    RLS 策略會自動確保 follower_id === auth.uid()
  const { error } = await supabase
    .from('following')
    .delete()
    .match({
      follower_id: followerId, // 要刪除的記錄的 follower_id
      following_id: followingUserId // 要刪除的記錄的 following_id
    });

  // 3. 錯誤處理
  // 如果失敗（例如未登入、網路錯誤、或 RLS 阻止），則會拋出錯誤。它不會回傳 JSON 資料。
  if (error) {
    console.error(`Supabase 取消追蹤使用者 #${followingUserId} 失敗:`, error);
    throw new Error(error.message); // 將錯誤往上拋
  }

  // 4. 回傳成功
  console.log(`Successfully unfollowed user #${followingUserId}`);
  return true;
}

/**
 * 【功能】檢查是否已追蹤指定使用者
 * @param {string} followingUserId - 要檢查的使用者的 UUID
 * @returns {Promise<boolean>} - 回傳 true 表示已追蹤，false 表示未追蹤
 */
export async function checkIfFollowing(followingUserId) {
  // 1. 獲取當前登入者 ID
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return false; // 未登入則視為未追蹤
  }

  // 2. 查詢是否存在追蹤記錄
  const { data, error } = await supabase
    .from('following')
    .select('user_id')
    .match({
      follower_id: user.id,
      following_id: followingUserId
    })
    .single();

  if (error) {
    // 如果是找不到記錄的錯誤，表示未追蹤
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('檢查追蹤狀態失敗:', error);
    return false;
  }

  return !!data; // 有資料表示已追蹤
}
