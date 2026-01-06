import { supabase } from '@/lib/supabase'
import { uploadItemImages } from '@/api/imageAPI'

// ===================================================================
// ### 物品 API (Items API) - 整合版
// ###
// ### 包含以下功能：
// ###   - 物品查詢（單一物品、物品詳情、我的物品、搜尋）
// ###   - 物品建立（含圖片上傳）
// ###   - 物品更新（編輯、上架/下架、刪除）
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-04): 整合 6 個 API 檔案
// ===================================================================

// ===========================================
// ## 查詢類 API
// ===========================================

/**
 * 【功能】獲取指定物品的基本資訊
 * @param {number} itemId - 物品 ID
 * @returns {Promise<object|null>} - 回傳物品物件或 null
 */
export async function getItemById(itemId) {
  try {
    console.log(`🔍 Fetching item #${itemId}...`)

    const { data, error } = await supabase
      .from('items')
      .select(
        `
        id,
        user_id,
        sub_category_id,
        title,
        description,
        condition,
        listing_status,
        price,
        use_primary_location,
        image_urls,
        tags,
        created_at,
        updated_at
      `
      )
      .eq('id', itemId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`Item #${itemId} not found`)
        return null
      }
      console.error('Failed to fetch item:', error)
      throw new Error(error.message)
    }

    console.log('✅ Item loaded:', data)
    return data
  } catch (error) {
    console.error('Error fetching item:', error)
    throw error
  }
}

/**
 * 【功能】獲取單一物品的完整詳情（含位置資訊）
 *
 * 買家位置優先級：
 *   1. 當前位置（前端傳入的 userLat, userLng）
 *   2. 次要地點（如 useSecondaryLocation = true）
 *   3. 主要地點（預設）
 *   4. 無位置
 *
 * @param {number} itemId - 要查詢的物品 ID
 * @param {object} options - 可選參數
 * @param {number} options.userLat - 用戶當前緯度（-90 ~ 90）
 * @param {number} options.userLng - 用戶當前經度（-180 ~ 180）
 * @param {boolean} options.useSecondaryLocation - 是否使用次要地點（預設 false）
 * @returns {Promise<object>} - 回傳統一格式的回應物件
 */
export async function getItemDetails(itemId, options = {}) {
  try {
    // 1. 參數驗證
    if (!itemId || typeof itemId !== 'number') {
      throw new Error('itemId 必須是有效的數字')
    }

    if (itemId <= 0) {
      throw new Error('itemId 必須是正整數')
    }

    // 解構可選參數
    const { userLat = null, userLng = null, useSecondaryLocation = false } = options

    // 驗證經緯度參數
    if ((userLat !== null && userLng === null) || (userLat === null && userLng !== null)) {
      throw new Error('經緯度參數必須同時提供或同時為空')
    }

    if (userLat !== null) {
      if (userLat < -90 || userLat > 90) {
        throw new Error('緯度必須在 -90 到 90 之間')
      }
      if (userLng < -180 || userLng > 180) {
        throw new Error('經度必須在 -180 到 180 之間')
      }
    }

    console.log(`正在獲取物品 #${itemId} 的詳情...`)
    if (userLat !== null && userLng !== null) {
      console.log(`使用當前位置: (${userLat}, ${userLng})`)
    } else if (useSecondaryLocation) {
      console.log(`使用次要地點`)
    }

    // 2. 檢查登入狀態
    const isLoggedIn = await checkUserAuthentication()

    if (!isLoggedIn) {
      console.log('提示：未登入用戶僅能查看物品基本資訊')
    }

    // 3. 呼叫 RPC 函式
    const { data, error } = await supabase
      .rpc('get_item_details_with_location_v2', {
        p_item_id: itemId,
        p_user_lat: userLat,
        p_user_lng: userLng,
        p_use_secondary_location: useSecondaryLocation,
      })
      .maybeSingle()

    // 4. 錯誤處理
    if (error) {
      console.error(`Supabase RPC 錯誤:`, error)
      throw new Error(`資料庫查詢失敗: ${error.message}`)
    }

    // 5. 檢查是否有錯誤回應（RPC 內部錯誤）
    if (data && data.error) {
      console.log(`物品查詢回應: ${data.message} (code: ${data.code})`)
      return {
        success: false,
        error: true,
        code: data.code,
        message: data.message,
        itemId: itemId,
        data: null,
      }
    }

    // 6. 資料後處理
    if (data) {
      // 確保陣列欄位的完整性
      data.image_urls = data.image_urls || []
      data.tags = data.tags || []

      // 處理地理座標（JSONB 格式）
      if (data.location && data.location.coordinates) {
        try {
          if (typeof data.location.coordinates === 'string') {
            data.location.coordinates = JSON.parse(data.location.coordinates)
          }
        } catch (e) {
          console.warn('無法解析物品位置座標:', e)
          data.location.coordinates = null
        }
      }

      // 處理用戶位置座標
      if (data.user_location && data.user_location.coordinates) {
        try {
          if (typeof data.user_location.coordinates === 'string') {
            data.user_location.coordinates = JSON.parse(data.user_location.coordinates)
          }
        } catch (e) {
          console.warn('無法解析用戶位置座標:', e)
          data.user_location.coordinates = null
        }
      }

      // 記錄位置來源資訊
      const locationSource = data.user_location?.source || 'none'
      const distanceInfo = data.distance_km ? `距離: ${data.distance_km} km` : '距離: 未提供'
      console.log(`成功獲取物品 #${itemId} 詳情，位置來源: ${locationSource}，${distanceInfo}`)

      return {
        success: true,
        error: false,
        message: '物品詳情獲取成功',
        itemId: itemId,
        locationSource: locationSource,
        isAuthenticated: isLoggedIn,
        hasDistance: data.distance_km !== null,
        isOwner: data.is_owner || false,
        data: data,
      }
    }

    // 7. 沒有資料的情況
    return {
      success: false,
      error: true,
      code: 'ITEM_NOT_FOUND',
      message: '物品不存在或已下架',
      itemId: itemId,
      data: null,
    }
  } catch (error) {
    console.error(`獲取物品詳情失敗 (itemId: ${itemId}):`, error.message)

    return {
      success: false,
      error: true,
      code: 'INTERNAL_ERROR',
      message: error.message,
      itemId: itemId,
      data: null,
    }
  }
}

/**
 * 【功能】獲取 "當前登入者" 刊登的所有物品
 * @param {object} options - (可選) 排序與分頁
 * @param {number} [options.page=1] - 頁碼
 * @param {number} [options.size=20] - 每頁筆數
 * @param {string} [options.sort_by='created_at'] - 排序欄位
 * @param {string} [options.sort_direction='desc'] - 排序方向
 * @returns {Promise<Array | null>} - 回傳物品陣列, 未登入回傳 null
 */
export async function getMyItems(options = {}) {
  // 1. 獲取當前登入的使用者
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    console.warn('getMyItems: User not logged in.')
    return null
  }

  // 2. 準備 RPC 參數
  const rpcParams = {
    p_page: options.page || 1,
    p_size: options.size || 20,
    p_sort_by: options.sort_by || 'created_at',
    p_sort_direction: options.sort_direction || 'desc',
  }

  console.log('Calling get_my_items RPC with params:', rpcParams)

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('get_my_items', rpcParams)

  // 4. 錯誤處理
  if (error) {
    console.error('Supabase 獲取 "我的物品" 失敗:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * 【功能】統一的物品搜尋函式 (RPC)
 * @param {object} filters - 篩選條件
 * @param {number} [filters.user_latitude] - (可選) 使用者當前緯度
 * @param {number} [filters.user_longitude] - (可選) 使用者當前經度
 * @param {number} [filters.distance_range_km] - (可選) 搜尋半徑 (公里)
 * @param {number} [filters.main_category_id] - (可選) 主分類 ID
 * @param {number} [filters.sub_category_id] - (可選) 子分類 ID
 * @param {string} [filters.keyword] - (可選) 關鍵字或標籤
 * @param {string} [filters.user_id] - (可選) 特定使用者的 UUID
 * @param {number} [filters.page=1] - 頁碼
 * @param {number} [filters.size=20] - 每頁筆數
 * @param {string} [filters.sort_by='created_at'] - 排序 ('created_at', 'distance', 'price')
 * @param {string} [filters.sort_direction='desc'] - 排序方向 ('asc' 或 'desc')
 * @returns {Promise<Array | null>} - 回傳物品陣列
 */
export async function searchItems(filters = {}) {
  // 1. 檢查使用者是否登入 (RPC 也會檢查)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    console.warn('searchItems: User not logged in.')
  }

  // 2. 準備傳遞給 RPC 函式的參數
  const rpcParams = {
    p_user_latitude: filters.user_latitude || null,
    p_user_longitude: filters.user_longitude || null,
    p_distance_range_km: filters.distance_range_km || null,
    p_main_category_id: filters.main_category_id || null,
    p_sub_category_id: filters.sub_category_id || null,
    p_keyword: filters.keyword || null,
    p_user_id: filters.user_id || null,
    p_page: filters.page || 1,
    p_size: filters.size || 20,
    p_sort_by: filters.sort_by || 'created_at',
    p_sort_direction: filters.sort_direction || 'desc',
  }
  console.log(rpcParams)

  // 3. 呼叫 RPC 函式
  const { data, error } = await supabase.rpc('search_items_tudever', rpcParams)

  if (error) {
    console.error('Supabase 搜尋物品失敗:', error)
    throw new Error(error.message)
  }

  // 4. Parse approximate_location to extract latitude and longitude
  const parsedData = data?.map((item) => {
    let latitude = null
    let longitude = null

    if (item.approximate_location) {
      latitude = item.approximate_location.latitude
      longitude = item.approximate_location.longitude
    }

    return {
      ...item,
      latitude,
      longitude,
    }
  })

  console.log(
    '[searchItems] Parsed items with coordinates:',
    parsedData?.filter((i) => i.latitude).length,
    '/',
    parsedData?.length
  )

  return parsedData || data
}

// ===========================================
// ## 建立類 API
// ===========================================

/**
 * 【功能】刊登一個新物品 (RPC)
 * @param {object} itemData - 來自前端表單的完整物件
 * @param {number} itemData.sub_category_id - 必填
 * @param {string} itemData.title - 必填
 * @param {string} itemData.description - 必填
 * @param {string} itemData.condition - 必填 ('全新', '近全新', '良好', '普通', '需修理')
 * @param {number} itemData.price - 必填
 * @param {boolean} [itemData.use_primary_location=true] - 可選，預設使用主要地點
 * @param {number} [itemData.carbon_value] - 可選
 * @param {Array<string>} [itemData.image_urls] - 可選 (已上傳到 Storage 的 URL)
 * @param {Array<string>} [itemData.tags] - 可選
 * @returns {Promise<object>} - 回傳新建的 item 及地點資訊
 */
export async function createItem(itemData) {
  const rpcParams = {
    p_sub_category_id: itemData.sub_category_id,
    p_title: itemData.title,
    p_description: itemData.description,
    p_condition: itemData.condition,
    p_price: itemData.price,
    p_use_primary_location:
      itemData.use_primary_location !== undefined ? itemData.use_primary_location : true,
    p_carbon_value: itemData.carbon_value,
    p_image_urls: itemData.image_urls,
    p_tags: itemData.tags,
  }

  const { data, error } = await supabase.rpc('create_item', rpcParams)

  if (error) {
    console.error('Supabase 刊登物品失敗:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * 【功能】完整刊登流程 (上傳圖片 + 建立物品)
 * @param {object} itemData - 物品資料
 * @param {File[]} imageFiles - 圖片檔案陣列（可以是原始檔案或已壓縮檔案）
 * @param {boolean} filesAlreadyCompressed - 檔案是否已經壓縮過（預設 false）
 * @returns {Promise<object>} - 回傳新建的 item
 */
export async function createItemWithImages(
  itemData,
  imageFiles = [],
  filesAlreadyCompressed = false
) {
  try {
    // 1. 獲取當前使用者 ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('使用者未登入')
    }

    // 2. 產生臨時 ID 用於圖片路徑
    const tempItemId = `temp-${Date.now()}`

    // 3. 上傳圖片 (若有提供)
    let imageUrls = []
    if (imageFiles && imageFiles.length > 0) {
      imageUrls = await uploadItemImages(imageFiles, user.id, tempItemId, !filesAlreadyCompressed)
    }

    // 4. 建立物品 (傳入圖片 URL)
    const result = await createItem({
      ...itemData,
      image_urls: imageUrls,
    })

    return result
  } catch (error) {
    console.error('刊登物品流程失敗:', error)
    throw error
  }
}

// ===========================================
// ## 更新類 API
// ===========================================

/**
 * 【功能】更新 "當前登入者" 的指定物品
 * @param {number} itemId - 要更新的物品 ID
 * @param {object} updateData - 包含 "有變動" 欄位的物件
 * @returns {Promise<object>} - 回傳更新後的完整物品物件
 */
export async function updateMyItem(itemId, updateData) {
  // 1. 檢查使用者是否登入
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('使用者未登入，無法更新物品')
  }

  console.log(`📝 Updating item #${itemId}:`, updateData)

  try {
    // 2. 如果要更新 location_id，先驗證該地點屬於當前使用者
    if (updateData.location_id) {
      const { data: locationCheck, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('id', updateData.location_id)
        .eq('user_id', user.id)
        .single()

      if (locationError || !locationCheck) {
        throw new Error('無效的地點 ID，或該地點不屬於當前使用者。請先在個人資料中新增此地區。')
      }
    }

    // 3. 更新物品
    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error(`Failed to update item #${itemId}:`, error)
      throw new Error(error.message)
    }

    console.log(`✅ Item #${itemId} updated:`, data)
    return data
  } catch (error) {
    console.error('Error updating item:', error)
    throw error
  }
}

/**
 * 【功能】切換物品上架/下架狀態（安全版）
 * @param {number} itemId - 物品 ID
 * @param {boolean} newStatus - 想要的新狀態 (true = 上架, false = 下架)
 * @returns {Promise<object>} - 回傳操作結果
 */
export async function toggleItemStatus(itemId, newStatus) {
  if (newStatus === true) {
    console.log(`正在嘗試重新上架物品 #${itemId}...`)
    return await relistMyItem(itemId)
  } else {
    console.log(`正在嘗試下架物品 #${itemId}...`)
    return await unlistItem(itemId)
  }
}

/**
 * 【功能】重新上架物品 (RPC)
 * @param {number} itemId - 要重新上架的物品 ID
 * @returns {Promise<object>} - 回傳操作結果
 */
export async function relistMyItem(itemId) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const { data, error } = await supabase.rpc('relist_item', {
    p_item_id: itemId,
  })

  if (error) {
    console.error(`Supabase 重新上架 #${itemId} 失敗:`, error)
    throw new Error(error.message)
  }
  return data
}

/**
 * 【功能】安全下架物品 (RPC)
 * @param {number} itemId - 要下架的物品 ID
 * @returns {Promise<object>} - 回傳操作結果
 */
export async function unlistItem(itemId) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const { data, error } = await supabase.rpc('unlist_item', {
    p_item_id: itemId,
  })

  if (error) {
    console.error(`Supabase 下架 #${itemId} 失敗:`, error)
    throw new Error(error.message)
  }
  return data
}

/**
 * 【功能】刪除物品 (Hard delete)
 * @param {number} itemId - 物品 ID
 * @returns {Promise<object>} - 回傳刪除結果
 */
export async function deleteMyItem(itemId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('使用者未登入，無法刪除物品')
  }

  console.log(`🗑️ Deleting item #${itemId}`)

  try {
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error(`Failed to delete item #${itemId}:`, error)
      throw new Error(error.message)
    }

    console.log(`Item #${itemId} permanently deleted`)
    return data
  } catch (error) {
    console.error('Error deleting item:', error)
    throw error
  }
}

// ===========================================
// ## 輔助函數
// ===========================================

/**
 * 【輔助函數】檢查當前用戶是否已登入
 * @returns {Promise<boolean>} - 是否已登入
 */
export async function checkUserAuthentication() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.warn('檢查登入狀態時發生錯誤:', error.message)
      return false
    }

    return user !== null
  } catch (error) {
    console.error('檢查登入狀態失敗:', error.message)
    return false
  }
}
