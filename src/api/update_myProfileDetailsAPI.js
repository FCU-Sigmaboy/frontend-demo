import { supabase } from '@/lib/supabase';

// ===================================================================
// ### 更新個人 Profile API (User Profile APIs)
// ===================================================================

/**
 * 【功能】更新 "當前登入者" 的 Profile 和 Locations (Direct queries)
 * @param {object} userData - 只包含 "有變動" 的 users 欄位 (e.g., { nickname: '...', profile_picture_url: '...' })
 * @param {object} profileData - 只包含 "有變動" 的 profiles 欄位 (e.g., { balance: ... })
 * @param {Array<object>} locationsArray - **所有** locations 物件的陣列 (包含 id 給現有的, 不含 id 給新增的)
 * 每個物件應包含: id (可選), coordinates ({latitude, longitude}), type, is_primary, formatted_address
 * @returns {Promise<object>} - 回傳更新後的 profile 物件 (包含巢狀 locations)
 */
export async function updateMyProfile(userData, profileData, locationsArray) {

    // 1. 獲取當前登入的使用者
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('請先登入');
    }

    console.log('🔄 Starting profile update for user:', user.id);

    try {
        // 2. 更新 users 表 (nickname, profile_picture_url)
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

        // 3. 更新 profiles 表 (if needed)
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

        // 4. 處理 locations (upsert or insert)
        if (locationsArray && locationsArray.length > 0) {
            console.log('📍 Processing locations:', locationsArray);

            for (const loc of locationsArray) {
                // 確保 coordinates 格式正確 (GeoJSON Point as string for PostGIS)
                const longitude = loc.coordinates?.longitude || loc.coordinates?.coordinates?.[0];
                const latitude = loc.coordinates?.latitude || loc.coordinates?.coordinates?.[1];

                if (!longitude || !latitude) {
                    console.error('Invalid coordinates:', loc.coordinates);
                    throw new Error('座標格式錯誤');
                }

                // PostGIS 接受 WKT 格式或 GeoJSON 字串
                // 使用 WKT 格式: POINT(longitude latitude)
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
                        .eq('user_id', user.id); // 確保只更新自己的

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

/* data 範例
{
  "id": "a1b2c3d4-e5f6-4a5b-8c9d-123456789abc",
  "nickname": "Joseph (已更新)",
  "profile_picture_url": "https://.../new_avatar.jpg",
  "avg_rating": "4.80",
  "profile_details": {
    "balance": 600,
    "carbon_saved_kg": "25.50",
    "updated_at": "2025-10-19T05:57:00.123+00:00"
  },
  "locations": [
    {
      "id": 12,
      "user_id": "a1b2c3d4-e5f6-4a5b-8c9d-123456789abc",
      "coordinates": { "type": "Point", "coordinates": [120.646, 24.180] },
      "type": "家",
      "is_primary": true,
      "formatted_address": "台中市西屯區福星路 (新)",
      "created_at": "2025-01-20T10:00:00.789+00:00",
      "updated_at": "2025-10-19T05:57:00.123+00:00"
    },
    {
      "id": 15,
      "user_id": "a1b2c3d4-e5f6-4a5b-8c9d-123456789abc",
      "coordinates": { "type": "Point", "coordinates": [120.671, 24.141] },
      "type": "公司 (新址)",
      "is_primary": false,
      "formatted_address": "台中市南屯區公益路 (新)",
      "created_at": "2025-03-10T09:00:00.000+00:00",
      "updated_at": "2025-10-19T05:57:00.123+00:00"
    },
    {
      "id": 55, // 這是新插入的 ID
      "user_id": "a1b2c3d4-e5f6-4a5b-8c9d-123456789abc",
      "coordinates": { "type": "Point", "coordinates": [121.500, 25.050] },
      "type": "次要地點",
      "is_primary": false,
      "formatted_address": "台北市中山區新地址",
      "created_at": "2025-10-19T05:57:00.123+00:00",
      "updated_at": "2025-10-19T05:57:00.123+00:00"
    }
  ]
}
 */
