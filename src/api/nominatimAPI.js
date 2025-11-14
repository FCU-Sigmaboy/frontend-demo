/**
 * Nominatim API Service
 *
 * 提供地理編碼和地點搜索功能
 */

import { nominatimSearch, nominatimReverse } from '@/utils/openStreetMapLoader'

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
      countrycodes: 'tw', // 限制台灣地區
      'accept-language': 'zh-TW'
    })

    return results.map(result => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name,
      place_id: result.place_id,
      type: result.type,
      address_components: result.address
    }))
  } catch (error) {
    console.error('[NominatimAPI] Geocoding failed:', error)
    throw new Error('地址搜索失敗')
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
    const result = await nominatimReverse(latitude, longitude)

    return {
      latitude,
      longitude,
      formatted_address: result.display_name,
      place_id: result.place_id,
      address_components: result.address
    }
  } catch (error) {
    console.error('[NominatimAPI] Reverse geocoding failed:', error)
    throw new Error('位置查詢失敗')
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
    return []
  }

  try {
    const results = await nominatimSearch(query, {
      limit: 5,
      countrycodes: 'tw',
      'accept-language': 'zh-TW'
    })

    return results.map(result => ({
      label: result.display_name,
      value: result.place_id,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    }))
  } catch (error) {
    console.error('[NominatimAPI] Autocomplete failed:', error)
    return []
  }
}