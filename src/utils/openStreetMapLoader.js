/**
 * OpenStreetMap & Leaflet Loader Utility
 *
 * 提供 Leaflet 動態載入和 Nominatim API 調用
 */

let leafletLoadedPromise = null
let isInitialized = false

/**
 * 動態載入 Leaflet（如果使用 CDN）
 * 如果使用 npm install，直接返回 true
 */
export async function loadLeaflet() {
  // 使用 npm install leaflet，這個函數直接返回成功
  if (leafletLoadedPromise) {
    return leafletLoadedPromise
  }

  leafletLoadedPromise = Promise.resolve()
  isInitialized = true

  return leafletLoadedPromise
}

/**
 * 檢查 Leaflet 是否已載入
 */
export function isLeafletLoaded() {
  return typeof L !== 'undefined' || isInitialized
}

/**
 * Nominatim API 基礎 URL
 */
const NOMINATIM_BASE_URL =
  import.meta.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org'

/**
 * 延遲函數（用於遵守 Nominatim 請求限制）
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let lastRequestTime = 0

/**
 * Nominatim 搜索（地理編碼）
 *
 * @param {string} query - 搜索查詢字串
 * @param {Object} options - 額外選項
 * @returns {Promise<Array>} 搜索結果
 */
export async function nominatimSearch(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: options.limit || '5',
    ...options,
  })

  try {
    // Nominatim 要求每秒最多 1 次請求
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < 1000) {
      await delay(1000 - timeSinceLastRequest)
    }
    lastRequestTime = Date.now()

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': 'MapSearchApp/1.0 (https://github.com/yourusername/map-search)', // Nominatim 要求設置 User-Agent
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim search failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Nominatim] Search error:', error)
    throw error
  }
}

/**
 * Nominatim 反向地理編碼
 *
 * @param {number} lat - 緯度
 * @param {number} lon - 經度
 * @returns {Promise<Object>} 位置資訊
 */
export async function nominatimReverse(lat, lon) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: 'json',
    addressdetails: '1',
  })

  try {
    // Nominatim 要求每秒最多 1 次請求
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < 1000) {
      await delay(1000 - timeSinceLastRequest)
    }
    lastRequestTime = Date.now()

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': 'MapSearchApp/1.0 (https://github.com/yourusername/map-search)',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim reverse geocoding failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Nominatim] Reverse geocoding error:', error)
    throw error
  }
}
