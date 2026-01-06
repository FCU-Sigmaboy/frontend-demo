import { supabase } from '@/lib/supabase';

// ===================================================================
// ### 使用者 Profile API (User Profile APIs) - 整合版
// ###
// ### 包含以下功能：
// ###   - 我的 Profile（取得、更新）
// ###   - 公開 Profile（查看他人）
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-04): 整合 3 個 API 檔案
// ===================================================================

// ===========================================
// ## 我的 Profile API
// ===========================================

/**
 * 【功能】獲取 "當前登入者" 的完整 profile 和 "所有" 地址
 * (用於 "編輯個人檔案" 頁面)
 * @returns {Promise<object | null>} - 成功則回傳 profile 物件，未登入則回傳 null
 */
export async function getMyProfileForEdit() {
  // 1. 獲取當前登入的使用者
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log('getMyProfileForEdit: User not logged in.');
    return null;
  }

  // 2. 定義查詢 DTO (巢狀結構)
  const selectQuery = `
    id,
    nickname,
    profile_picture_url,
    avg_rating,
    created_at,
    profiles (
      balance,
      carbon_saved_kg,
      updated_at
    ),
    locations (
      id,
      coordinates,
      type,
      is_primary,
      formatted_address,
      created_at,
      updated_at
    )
  `;

  // 3. 建立查詢
  const { data, error } = await supabase
    .from('users')
    .select(selectQuery)
    .eq('id', user.id)
    .order('is_primary', { foreignTable: 'locations', ascending: false })
    .order('id', { foreignTable: 'locations', ascending: true })
    .single();

  // 4. 錯誤處理
  if (error) {
    if (error.code === 'PGRST200') {
      console.warn(`getMyProfileForEdit: Profile data not found for user ${user.id}. Need initial setup?`);
      return { id: user.id, nickname: user.email };
    }
    console.error('Supabase 獲取 MyProfile 失敗:', error);
    throw new Error(error.message);
  }

  // 5. 處理 profiles (1:1 關聯)
  if (data && data.profiles && Array.isArray(data.profiles)) {
    data.profile_details = data.profiles[0] || null;
    delete data.profiles;
  } else if (data && data.profiles && typeof data.profiles === 'object') {
    data.profile_details = data.profiles;
    delete data.profiles;
  } else if (data) {
    data.profile_details = null;
  }

  // 6. 查詢追蹤數量
  if (data) {
    // 追蹤中數量 (我追蹤了誰)
    const { count: followingCount, error: followingError } = await supabase
      .from('following')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    if (followingError) {
      console.error('查詢 following_count 失敗:', followingError);
      data.following_count = 0;
    } else {
      data.following_count = followingCount || 0;
    }

    // 追蹤者數量 (誰追蹤了我)
    const { count: followersCount, error: followersError } = await supabase
      .from('following')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    if (followersError) {
      console.error('查詢 followers_count 失敗:', followersError);
      data.followers_count = 0;
    } else {
      data.followers_count = followersCount || 0;
    }
  }

  return data;
}

/**
 * 【功能】更新 "當前登入者" 的 Profile 和 Locations
 * @param {object} userData - 只包含 "有變動" 的 users 欄位 (e.g., { nickname: '...', profile_picture_url: '...' })
 * @param {object} profileData - 只包含 "有變動" 的 profiles 欄位 (e.g., { balance: ... })
 * @param {Array<object>} locationsArray - **所有** locations 物件的陣列
 * @returns {Promise<object>} - 回傳更新後的 profile 物件
 */
export async function updateMyProfile(userData, profileData, locationsArray) {
  // 1. 獲取當前登入的使用者
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('請先登入');
  }

  console.log('🔄 Starting profile update for user:', user.id);

  try {
    // 2. 更新 users 表
    if (userData && Object.keys(userData).length > 0) {
      console.log('📝 Updating users table:', userData);
      const { data: updatedUser, error: userError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id)
        .select()
        .single();

      if (userError) {
        console.error('Failed to update users:', userError);
        throw new Error(`更新使用者資料失敗: ${userError.message}`);
      }
      console.log('✅ Users table updated:', updatedUser);
    }

    // 3. 更新 profiles 表
    if (profileData && Object.keys(profileData).length > 0) {
      console.log('📝 Updating profiles table:', profileData);
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Failed to update profiles:', profileError);
        throw new Error(`更新 profile 失敗: ${profileError.message}`);
      }
      console.log('✅ Profiles table updated');
    }

    // 4. 處理 locations
    if (locationsArray && locationsArray.length > 0) {
      console.log('📍 Processing locations:', locationsArray);

      for (const loc of locationsArray) {
        const longitude = loc.coordinates?.longitude || loc.coordinates?.coordinates?.[0];
        const latitude = loc.coordinates?.latitude || loc.coordinates?.coordinates?.[1];

        if (!longitude || !latitude) {
          console.error('Invalid coordinates:', loc.coordinates);
          throw new Error('座標格式錯誤');
        }

        const wktPoint = `POINT(${longitude} ${latitude})`;

        const locationData = {
          user_id: user.id,
          coordinates: wktPoint,
          type: loc.type,
          is_primary: loc.is_primary,
          formatted_address: loc.formatted_address
        };

        if (loc.id) {
          // 更新現有地點
          console.log('📝 Updating location:', loc.id);
          const { error: locError } = await supabase
            .from('locations')
            .update(locationData)
            .eq('id', loc.id)
            .eq('user_id', user.id);

          if (locError) {
            console.error('Failed to update location:', locError);
            throw new Error(`更新地點失敗: ${locError.message}`);
          }
        } else {
          // 插入新地點
          console.log('➕ Inserting new location');
          const { error: locError } = await supabase
            .from('locations')
            .insert(locationData);

          if (locError) {
            console.error('Failed to insert location:', locError);
            throw new Error(`新增地點失敗: ${locError.message}`);
          }
        }
      }
      console.log('✅ Locations processed');
    }

    // 5. 回傳更新後的完整資料
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('users')
      .select(`
        id,
        nickname,
        profile_picture_url,
        avg_rating,
        created_at,
        profiles (
          balance,
          carbon_saved_kg,
          updated_at
        ),
        locations (
          id,
          coordinates,
          type,
          is_primary,
          formatted_address,
          created_at,
          updated_at
        )
      `)
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch updated profile:', fetchError);
      throw new Error(`無法取得更新後的資料: ${fetchError.message}`);
    }

    console.log('✅ Profile update complete:', updatedProfile);
    return updatedProfile;

  } catch (error) {
    console.error('❌ Profile update failed:', error);
    throw error;
  }
}

// ===========================================
// ## 公開 Profile API
// ===========================================

/**
 * 【功能】獲取單一使用者的公開 profile 頁面資料 (RPC)
 * @param {string} userId - 要查看的使用者的 UUID
 * @returns {Promise<object | null>} - 成功則回傳 profile 物件，找不到則回傳 null
 */
export async function getPublicUserProfile(userId) {
  // 1. 準備 RPC 參數
  const rpcParams = {
    p_user_id: userId
  };

  // 2. 呼叫 RPC 函式
  const { data, error } = await supabase
    .rpc('get_public_user_profile', rpcParams)
    .single();

  // 3. 錯誤處理
  if (error) {
    if (error.code === 'PGRST200') {
      console.warn(`Profile for user #${userId} not found.`);
      return null;
    }
    console.error(`Supabase 獲取 Profile #${userId} 失敗:`, error);
    throw new Error(error.message);
  }

  return data;
}
