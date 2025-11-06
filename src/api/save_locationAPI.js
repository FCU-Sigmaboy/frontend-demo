/**
 * API: Save User Location
 * 儲存使用者地點
 *
 * Uses Supabase Edge Function: save-location
 * Supports creating new locations with automatic geocoding
 */

import { supabase } from '@/lib/supabase'

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
 *
 * @example
 * const location = await saveUserLocation({
 *   latitude: 24.1817,
 *   longitude: 120.7344,
 *   type: '家',
 *   is_primary: true
 * })
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
      throw new Error('Invalid latitude: must be between -90 and 90')
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180')
    }

    // Validate type
    if (!['家', '公司'].includes(type)) {
      throw new Error('Invalid type: must be "家" or "公司"')
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
    })

    if (error) {
      console.error('[saveUserLocation] Edge Function error:', error)
      throw new Error(error.message || 'Failed to save location')
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to save location')
    }

    console.log('[saveUserLocation] Location saved successfully:', data.data)
    return data.data

  } catch (error) {
    console.error('[saveUserLocation] Error:', error)
    throw error
  }
}

/**
 * Save current browser location
 * 儲存瀏覽器當前位置
 *
 * @param {string} [type='家'] - Location type
 * @param {boolean} [isPrimary=false] - Set as primary location
 * @returns {Promise<Object>} Saved location data
 *
 * @example
 * try {
 *   const location = await saveCurrentLocation('家', true)
 *   console.log('Saved:', location)
 * } catch (error) {
 *   console.error('User denied location permission')
 * }
 */
export async function saveCurrentLocation(type = '家', isPrimary = false) {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    throw new Error('您的瀏覽器不支援定位功能')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const location = await saveUserLocation({
            latitude,
            longitude,
            type,
            is_primary: isPrimary
          })

          resolve(location)
        } catch (error) {
          reject(error)
        }
      },
      (error) => {
        // Handle geolocation errors
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('使用者拒絕提供位置'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('無法取得位置資訊'))
            break
          case error.TIMEOUT:
            reject(new Error('取得位置逾時'))
            break
          default:
            reject(new Error('發生未知錯誤'))
        }
      },
      {
        enableHighAccuracy: true, // High accuracy mode (uses GPS)
        timeout: 10000,           // 10 seconds timeout
        maximumAge: 0             // Don't use cached position
      }
    )
  })
}

/**
 * Update location to be primary
 * 設定地點為主要地點
 *
 * @param {number} locationId - Location ID
 * @returns {Promise<boolean>} Success status
 *
 * @example
 * await setPrimaryLocation(123)
 */
export async function setPrimaryLocation(locationId) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Update location to be primary
    const { error } = await supabase
      .from('locations')
      .update({ is_primary: true })
      .eq('id', locationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[setPrimaryLocation] Update failed:', error)
      throw new Error('Failed to set primary location')
    }

    // Note: Database trigger will automatically set other locations to is_primary=false
    return true

  } catch (error) {
    console.error('[setPrimaryLocation] Error:', error)
    throw error
  }
}

/**
 * Delete user location
 * 刪除使用者地點
 *
 * @param {number} locationId - Location ID
 * @returns {Promise<boolean>} Success status
 *
 * @example
 * await deleteUserLocation(123)
 */
export async function deleteUserLocation(locationId) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[deleteUserLocation] Delete failed:', error)
      throw new Error('Failed to delete location')
    }

    return true

  } catch (error) {
    console.error('[deleteUserLocation] Error:', error)
    throw error
  }
}
