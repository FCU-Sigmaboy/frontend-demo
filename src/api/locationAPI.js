import { supabase } from '@/lib/supabase';
import { nominatimSearch, nominatimReverse } from '@/utils/openStreetMapLoader';

// ===================================================================
// ### 地點 API (Location APIs) - 整合版
// ###
// ### 包含以下功能：
// ###   - 瀏覽器定位
// ###   - 地點儲存、更新、刪除
// ###   - 我的地點列表
// ###   - 地理編碼 (Nominatim)
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-04): 整合 4 個 API 檔案
// ===================================================================

// ===========================================
// ## 瀏覽器定位
// ===========================================

/**
 * 使用瀏覽器 Geolocation API 取得用戶當前位置
 *
 * @param {Object} [options] - Geolocation API 選項
 * @param {boolean} [options.enableHighAccuracy=true] - 是否要求高精度定位
 * @param {number} [options.timeout=10000] - 超時時間（毫秒）
 * @param {number} [options.maximumAge=0] - 快取位置的最長時間（毫秒）
 *
 * @returns {Promise<Object>} 位置資訊
 * @returns {number} returns.latitude - 緯度
 * @returns {number} returns.longitude - 經度
 * @returns {number} returns.accuracy - 精度（公尺）
 *
 * @throws {Error} 瀏覽器不支援地理定位
 * @throws {Error} 用戶拒絕提供位置權限
 * @throws {Error} 無法取得位置資訊
 * @throws {Error} 取得位置逾時
 *
 * @example
 * // 取得用戶當前位置
 * getCurrentPosition()
 *   .then(pos => console.log('當前位置:', pos.latitude, pos.longitude))
 *   .catch(err => console.error('定位失敗:', err.message));
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    // 檢查瀏覽器是否支援 Geolocation API
    if (!navigator.geolocation) {
      reject(new Error('瀏覽器不支援地理定位功能'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,  // 使用 GPS 等高精度定位
      timeout: 10000,            // 10 秒超時
      maximumAge: 0              // 不使用快取位置
    };

    const geolocationOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      // 成功回調
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      // 錯誤回調
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('用戶拒絕提供位置權限'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('無法取得位置資訊'));
            break;
          case error.TIMEOUT:
            reject(new Error('取得位置逾時，請稍後再試'));
            break;
          default:
            reject(new Error('取得位置時發生未知錯誤'));
        }
      },
      geolocationOptions
    );
  });
}

// ===========================================
// ## 地點儲存與管理
// ===========================================

/**
 * save-location edge function API contract
 * 依據 LOCATION_API_FRONTEND_GUIDE.md v2.0
 *
 * @param {Object} params - 地點資訊
 * @param {number} params.latitude - 緯度（必須為有效的數字）
 * @param {number} params.longitude - 經度（必須為有效的數字）
 * @param {'家'|'公司'} params.type - 地點類型（僅支援「家」和「公司」）
 * @param {boolean} [params.is_primary] - 是否設為主要地點（可選，省略時由後端自動判斷）
 * @param {string} userToken - JWT Token（必須為有效的授權 token）
 *
 * @returns {Promise<Object>} API 回應
 */
export async function saveLocation({ latitude, longitude, type, is_primary }, userToken) {
  // 參數基本驗證
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('緯度與經度必須為數字');
  }
  if (type !== '家' && type !== '公司') {
    throw new Error('地點類型僅支援「家」和「公司」');
  }
  if (!userToken || typeof userToken !== 'string') {
    throw new Error('缺少使用者授權 Token');
  }

  const body = { latitude, longitude, type };
  if (typeof is_primary === 'boolean') body.is_primary = is_primary;

  try {
    const { data, error } = await supabase.functions.invoke('save-location', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (error) {
      switch (error) {
        case 400:
          throw new Error(error || '請求錯誤');
        case 401:
          throw new Error(error || '未授權，請重新登入');
        case 500:
          throw new Error(error || '伺服器錯誤，請稍後再試');
        default:
          throw new Error(error || '未知錯誤');
      }
    }

    return data;
  } catch (error) {
    if (error.message && (
      error.message.includes('請求錯誤') ||
      error.message.includes('未授權') ||
      error.message.includes('伺服器錯誤') ||
      error.message.includes('緯度') ||
      error.message.includes('地點類型') ||
      error.message.includes('授權 Token')
    )) {
      throw error;
    }
    throw new Error('網路連線失敗，請檢查您的網路');
  }
}

/**
 * Save user location using Edge Function
 * 使用 Edge Function 儲存使用者地點
 *
 * @param {Object} params - Location parameters
 * @param {number} params.latitude - Latitude (-90 to 90)
 * @param {number} params.longitude - Longitude (-180 to 180)
 * @param {string} [params.type='家'] - Location type: '家' or '公司'
 * @param {boolean} [params.is_primary=false] - Set as primary location
 * @param {string} [params.formatted_address] - Formatted address (optional)
 * @returns {Promise<Object>} Saved location data
 */
export async function saveUserLocation({
  latitude,
  longitude,
  type = '家',
  is_primary = false,
  formatted_address = null
}) {
  try {
    // Validate coordinates
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    // Validate type
    if (!['家', '公司'].includes(type)) {
      throw new Error('Invalid type: must be "家" or "公司"');
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('save-location', {
      body: {
        latitude,
        longitude,
        type,
        is_primary,
        formatted_address
      }
    });

    if (error) {
      console.error('[saveUserLocation] Edge Function error:', error);
      throw new Error(error.message || 'Failed to save location');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to save location');
    }

    console.log('[saveUserLocation] Location saved successfully:', data.data);
    return data.data;

  } catch (error) {
    console.error('[saveUserLocation] Error:', error);
    throw error;
  }
}

/**
 * Save current browser location
 * 儲存瀏覽器當前位置
 *
 * @param {string} [type='家'] - Location type
 * @param {boolean} [isPrimary=false] - Set as primary location
 * @returns {Promise<Object>} Saved location data
 */
export async function saveCurrentLocation(type = '家', isPrimary = false) {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    throw new Error('您的瀏覽器不支援定位功能');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const location = await saveUserLocation({
            latitude,
            longitude,
            type,
            is_primary: isPrimary
          });

          resolve(location);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('使用者拒絕提供位置'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('無法取得位置資訊'));
            break;
          case error.TIMEOUT:
            reject(new Error('取得位置逾時'));
            break;
          default:
            reject(new Error('發生未知錯誤'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Update location to be primary
 * 設定地點為主要地點
 *
 * @param {number} locationId - Location ID
 * @returns {Promise<boolean>} Success status
 */
export async function setPrimaryLocation(locationId) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('locations')
      .update({ is_primary: true })
      .eq('id', locationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[setPrimaryLocation] Update failed:', error);
      throw new Error('Failed to set primary location');
    }

    return true;

  } catch (error) {
    console.error('[setPrimaryLocation] Error:', error);
    throw error;
  }
}

/**
 * Delete user location
 * 刪除使用者地點
 *
 * @param {number} locationId - Location ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUserLocation(locationId) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[deleteUserLocation] Delete failed:', error);
      throw new Error('Failed to delete location');
    }

    return true;

  } catch (error) {
    console.error('[deleteUserLocation] Error:', error);
    throw error;
  }
}

// ===========================================
// ## 我的地點查詢
// ===========================================

/**
 * Get user's primary location
 * 獲取使用者的主要地點（is_primary = true）
 *
 * @returns {Promise<Object|null>} Location data or null if not found
 */
export async function getUserPrimaryLocation() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[getUserPrimaryLocation] User not authenticated:', authError);
      return null;
    }

    const { data, error } = await supabase.rpc('get_user_primary_location', {
      p_user_id: user.id
    });

    if (error) {
      console.error('[getUserPrimaryLocation] RPC call failed:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;

  } catch (error) {
    console.error('[getUserPrimaryLocation] Unexpected error:', error);
    return null;
  }
}

/**
 * 【功能】獲取 "當前登入者" 儲存的所有 location
 * (用於刊登物品時的 "選擇地點" 下拉選單或列表)
 * @returns {Promise<Array|null>} 回傳 location 陣列，未登入回傳 null
 */
export async function getMyLocations() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.warn('getMyLocations: User not logged in.');
    return null;
  }

  const selectQuery = `
    id,
    coordinates,
    type,
    is_primary
  `;

  const { data, error } = await supabase
    .from('locations')
    .select(selectQuery)
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase 獲取 "我的地點" 失敗:', error);
    throw new Error(error.message);
  }

  return data;
}

// ===========================================
// ## 地理編碼 (Nominatim)
// ===========================================

/**
 * 搜索地址（地理編碼）
 *
 * @param {string} address - 地址字串
 * @returns {Promise<Array>} 搜索結果
 */
export async function geocodeAddress(address) {
  try {
    const results = await nominatimSearch(address, {
      limit: 10,
      countrycodes: 'tw',
      'accept-language': 'zh-TW'
    });

    return results.map(result => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name,
      place_id: result.place_id,
      type: result.type,
      address_components: result.address
    }));
  } catch (error) {
    console.error('[NominatimAPI] Geocoding failed:', error);
    throw new Error('地址搜索失敗');
  }
}

/**
 * 反向地理編碼（坐標轉地址）
 *
 * @param {number} latitude - 緯度
 * @param {number} longitude - 經度
 * @returns {Promise<Object>} 位置資訊
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const result = await nominatimReverse(latitude, longitude);

    return {
      latitude,
      longitude,
      formatted_address: result.display_name,
      place_id: result.place_id,
      address_components: result.address
    };
  } catch (error) {
    console.error('[NominatimAPI] Reverse geocoding failed:', error);
    throw new Error('位置查詢失敗');
  }
}

/**
 * 自動完成搜索
 *
 * @param {string} query - 搜索關鍵字
 * @returns {Promise<Array>} 建議列表
 */
export async function autocomplete(query) {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const results = await nominatimSearch(query, {
      limit: 5,
      countrycodes: 'tw',
      'accept-language': 'zh-TW'
    });

    return results.map(result => ({
      label: result.display_name,
      value: result.place_id,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    }));
  } catch (error) {
    console.error('[NominatimAPI] Autocomplete failed:', error);
    return [];
  }
}
