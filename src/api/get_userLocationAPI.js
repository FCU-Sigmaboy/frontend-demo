/**
 * API: Get User Primary Location
 * 獲取使用者的主要地點
 *
 * Uses RPC function: get_user_primary_location
 * Returns user's primary location with latitude/longitude coordinates
 */

import { supabase } from '@/lib/supabase'

/**
 * Get user's primary location
 * 獲取使用者的主要地點（is_primary = true）
 *
 * @returns {Promise<Object|null>} Location data or null if not found
 *
 * @example
 * const location = await getUserPrimaryLocation()
 * console.log(location)
 * // {
 * //   id: 123,
 * //   latitude: 24.1817,
 * //   longitude: 120.7344,
 * //   type: "家",
 * //   is_primary: true,
 * //   formatted_address: "台中市南屯區...",
 * //   created_at: "2025-11-06T...",
 * //   updated_at: "2025-11-06T..."
 * // }
 */
export async function getUserPrimaryLocation() {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[getUserPrimaryLocation] User not authenticated:', authError)
      return null
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('get_user_primary_location', {
      p_user_id: user.id
    })

    if (error) {
      console.error('[getUserPrimaryLocation] RPC call failed:', error)
      return null
    }

    // RPC returns array, get first result
    return data && data.length > 0 ? data[0] : null

  } catch (error) {
    console.error('[getUserPrimaryLocation] Unexpected error:', error)
    return null
  }
}

/**
 * Get all user locations
 * 獲取使用者的所有地點
 *
 * @returns {Promise<Array>} Array of location objects
 *
 * @example
 * const locations = await getUserLocations()
 * console.log(locations) // [{ id: 1, type: "家", ... }, { id: 2, type: "公司", ... }]
 */
export async function getUserLocations() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[getUserLocations] User not authenticated:', authError)
      return []
    }

    const { data, error } = await supabase
      .from('locations')
      .select('id, coordinates, type, is_primary, formatted_address, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getUserLocations] Query failed:', error)
      return []
    }

    // Parse PostGIS POINT format to latitude/longitude
    return data.map(location => {
      let latitude = null
      let longitude = null

      // Parse POINT(longitude latitude) format
      if (location.coordinates) {
        const match = location.coordinates.match(/POINT\(([^ ]+) ([^ ]+)\)/)
        if (match) {
          longitude = parseFloat(match[1])
          latitude = parseFloat(match[2])
        }
      }

      return {
        id: location.id,
        latitude,
        longitude,
        type: location.type,
        is_primary: location.is_primary,
        formatted_address: location.formatted_address,
        created_at: location.created_at,
        updated_at: location.updated_at
      }
    })

  } catch (error) {
    console.error('[getUserLocations] Unexpected error:', error)
    return []
  }
}

/**
 * Check if user has any locations
 * 檢查使用者是否已設定地點
 *
 * @returns {Promise<boolean>} True if user has at least one location
 */
export async function hasUserLocation() {
  try {
    const locations = await getUserLocations()
    return locations.length > 0
  } catch (error) {
    console.error('[hasUserLocation] Error:', error)
    return false
  }
}
