/**
 * Google Analytics 4 追蹤功能
 * 提供電商平台所需的各種事件追蹤方法
 */

/**
 * 檢查 GA4 是否已初始化
 */
const isGAInitialized = () => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         import.meta.env.VITE_GA_MEASUREMENT_ID
}

/**
 * 安全地發送 GA4 事件
 */
const sendEvent = (eventName, eventParams = {}) => {
  if (!isGAInitialized()) {
    console.warn('[Analytics] GA4 not initialized or VITE_GA_MEASUREMENT_ID not set')
    return
  }
  
  try {
    window.gtag('event', eventName, eventParams)
    console.log(`[Analytics] Event sent: ${eventName}`, eventParams)
  } catch (error) {
    console.error('[Analytics] Error sending event:', error)
  }
}

/**
 * 設定用戶 ID（用於登入用戶追蹤）
 */
export const setUserId = (userId) => {
  if (!isGAInitialized()) return
  
  try {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      'user_id': userId
    })
    console.log('[Analytics] User ID set:', userId)
  } catch (error) {
    console.error('[Analytics] Error setting user ID:', error)
  }
}

/**
 * 設定用戶屬性
 */
export const setUserProperties = (properties) => {
  if (!isGAInitialized()) return
  
  try {
    window.gtag('set', 'user_properties', properties)
    console.log('[Analytics] User properties set:', properties)
  } catch (error) {
    console.error('[Analytics] Error setting user properties:', error)
  }
}

/**
 * 追蹤頁面瀏覽
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (!isGAInitialized()) return
  
  try {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle
    })
    console.log(`[Analytics] Page view: ${pagePath}`)
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error)
  }
}

// ==================== 電商事件追蹤 ====================

/**
 * 追蹤商品列表瀏覽
 * @param {Array} items - 商品列表
 * @param {string} listName - 列表名稱（如 "首頁推薦"、"搜尋結果"）
 */
export const trackViewItemList = (items, listName = '商品列表') => {
  if (!items || items.length === 0) return
  
  const formattedItems = items.slice(0, 20).map((item, index) => ({
    item_id: item.item_id?.toString() || '',
    item_name: item.title || item.name || '',
    item_category: item.category_name || item.category || '',
    item_list_name: listName,
    item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
    index: index,
    price: item.price || 0,
    item_brand: '台中易起來',
    quantity: 1
  }))
  
  sendEvent('view_item_list', {
    item_list_name: listName,
    item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
    items: formattedItems
  })
}

/**
 * 追蹤商品詳情瀏覽
 * @param {Object} item - 商品資訊
 */
export const trackViewItem = (item) => {
  if (!item) return
  
  const formattedItem = {
    item_id: item.item_id?.toString() || item.id?.toString() || '',
    item_name: item.title || item.name || '',
    item_category: item.category_name || item.category || '',
    price: item.price || 0,
    item_brand: '台中易起來',
    quantity: 1,
    item_variant: item.condition || '', // 商品狀態（全新/二手）
    location_id: item.location || ''
  }
  
  sendEvent('view_item', {
    currency: 'TWD',
    value: item.price || 0,
    items: [formattedItem]
  })
}

/**
 * 追蹤搜尋事件
 * @param {string} searchTerm - 搜尋關鍵字
 */
export const trackSearch = (searchTerm) => {
  if (!searchTerm) return
  
  sendEvent('search', {
    search_term: searchTerm
  })
}

/**
 * 追蹤商品收藏（加入願望清單）
 * @param {Object} item - 商品資訊
 */
export const trackAddToWishlist = (item) => {
  if (!item) return
  
  const formattedItem = {
    item_id: item.item_id?.toString() || item.id?.toString() || '',
    item_name: item.title || item.name || '',
    item_category: item.category_name || item.category || '',
    price: item.price || 0,
    item_brand: '台中易起來',
    quantity: 1
  }
  
  sendEvent('add_to_wishlist', {
    currency: 'TWD',
    value: item.price || 0,
    items: [formattedItem]
  })
}

/**
 * 追蹤商品移除收藏
 * @param {Object} item - 商品資訊
 */
export const trackRemoveFromWishlist = (item) => {
  if (!item) return
  
  sendEvent('remove_from_wishlist', {
    item_id: item.item_id?.toString() || item.id?.toString() || '',
    item_name: item.title || item.name || ''
  })
}

/**
 * 追蹤開始刊登流程
 */
export const trackBeginListing = () => {
  sendEvent('begin_listing', {
    event_category: 'engagement',
    event_label: '開始刊登商品'
  })
}

/**
 * 追蹤完成刊登
 * @param {Object} item - 已刊登的商品資訊
 */
export const trackCompleteListing = (item) => {
  if (!item) return
  
  const formattedItem = {
    item_id: item.item_id?.toString() || item.id?.toString() || '',
    item_name: item.title || item.name || '',
    item_category: item.category_name || item.category || '',
    price: item.price || 0,
    item_brand: '台中易起來',
    quantity: 1
  }
  
  sendEvent('complete_listing', {
    currency: 'TWD',
    value: item.price || 0,
    items: [formattedItem],
    event_category: 'conversion',
    event_label: '完成刊登商品'
  })
}

/**
 * 追蹤交易發起
 * @param {Object} transaction - 交易資訊
 */
export const trackTransactionInitiated = (transaction) => {
  if (!transaction) return
  
  sendEvent('transaction_initiated', {
    transaction_id: transaction.transaction_id?.toString() || '',
    value: transaction.amount || 0,
    currency: 'TWD',
    item_id: transaction.item_id?.toString() || '',
    item_name: transaction.item_name || '',
    transaction_type: transaction.transaction_type || '',
    event_category: 'engagement',
    event_label: '發起交易請求'
  })
}

/**
 * 追蹤交易接受
 * @param {Object} transaction - 交易資訊
 */
export const trackTransactionAccepted = (transaction) => {
  if (!transaction) return
  
  sendEvent('transaction_accepted', {
    transaction_id: transaction.transaction_id?.toString() || '',
    value: transaction.amount || 0,
    currency: 'TWD',
    event_category: 'engagement',
    event_label: '接受交易請求'
  })
}

/**
 * 追蹤交易完成
 * @param {Object} transaction - 交易資訊
 */
export const trackTransactionCompleted = (transaction) => {
  if (!transaction) return
  
  const formattedItem = {
    item_id: transaction.item_id?.toString() || '',
    item_name: transaction.item_name || '',
    item_category: transaction.category || '',
    price: transaction.amount || 0,
    quantity: 1
  }
  
  sendEvent('purchase', {
    transaction_id: transaction.transaction_id?.toString() || '',
    value: transaction.amount || 0,
    currency: 'TWD',
    items: [formattedItem],
    event_category: 'conversion',
    event_label: '完成交易'
  })
}

/**
 * 追蹤交易取消
 * @param {Object} transaction - 交易資訊
 */
export const trackTransactionCancelled = (transaction) => {
  if (!transaction) return
  
  sendEvent('transaction_cancelled', {
    transaction_id: transaction.transaction_id?.toString() || '',
    event_category: 'engagement',
    event_label: '取消交易'
  })
}

// ==================== 用戶互動事件 ====================

/**
 * 追蹤聯繫賣家
 * @param {Object} item - 商品資訊
 * @param {string} sellerId - 賣家 ID
 */
export const trackContactSeller = (item, sellerId) => {
  sendEvent('contact_seller', {
    item_id: item?.item_id?.toString() || '',
    item_name: item?.title || item?.name || '',
    seller_id: sellerId?.toString() || '',
    event_category: 'engagement',
    event_label: '聯繫賣家'
  })
}

/**
 * 追蹤分類選擇
 * @param {string} categoryName - 分類名稱
 * @param {string} categoryId - 分類 ID
 */
export const trackSelectCategory = (categoryName, categoryId) => {
  sendEvent('select_content', {
    content_type: 'category',
    content_id: categoryId?.toString() || '',
    item_name: categoryName || '',
    event_category: 'engagement',
    event_label: '選擇分類'
  })
}

/**
 * 追蹤用戶登入
 * @param {string} method - 登入方式（如 'google', 'email'）
 */
export const trackLogin = (method = 'google') => {
  sendEvent('login', {
    method: method,
    event_category: 'engagement',
    event_label: '用戶登入'
  })
}

/**
 * 追蹤用戶註冊
 * @param {string} method - 註冊方式
 */
export const trackSignUp = (method = 'google') => {
  sendEvent('sign_up', {
    method: method,
    event_category: 'conversion',
    event_label: '用戶註冊'
  })
}

/**
 * 追蹤提交評價
 * @param {number} rating - 評分（1-5）
 * @param {string} itemId - 商品 ID
 */
export const trackSubmitReview = (rating, itemId) => {
  sendEvent('submit_review', {
    rating: rating,
    item_id: itemId?.toString() || '',
    event_category: 'engagement',
    event_label: '提交評價'
  })
}

/**
 * 追蹤分享商品
 * @param {Object} item - 商品資訊
 * @param {string} method - 分享方式（如 'facebook', 'line', 'copy_link'）
 */
export const trackShare = (item, method) => {
  sendEvent('share', {
    method: method,
    content_type: 'item',
    item_id: item?.item_id?.toString() || '',
    item_name: item?.title || item?.name || '',
    event_category: 'engagement',
    event_label: '分享商品'
  })
}

// ==================== 自訂事件 ====================

/**
 * 追蹤積分獲得
 * @param {number} points - 獲得的積分
 * @param {string} reason - 獲得原因
 */
export const trackEarnPoints = (points, reason) => {
  sendEvent('earn_points', {
    value: points,
    points_reason: reason,
    event_category: 'engagement',
    event_label: '獲得積分'
  })
}

/**
 * 追蹤地圖搜尋
 * @param {Object} location - 位置資訊
 */
export const trackMapSearch = (location) => {
  sendEvent('map_search', {
    latitude: location?.latitude || '',
    longitude: location?.longitude || '',
    location_name: location?.name || '',
    event_category: 'engagement',
    event_label: '地圖搜尋'
  })
}

/**
 * 追蹤篩選器使用
 * @param {Object} filters - 篩選條件
 */
export const trackFilterUsage = (filters) => {
  sendEvent('filter_usage', {
    filter_type: filters?.type || '',
    filter_value: filters?.value || '',
    event_category: 'engagement',
    event_label: '使用篩選'
  })
}

/**
 * 追蹤關注用戶
 * @param {string} followedUserId - 被關注的用戶 ID
 */
export const trackFollowUser = (followedUserId) => {
  sendEvent('follow_user', {
    followed_user_id: followedUserId?.toString() || '',
    event_category: 'engagement',
    event_label: '關注用戶'
  })
}

/**
 * 追蹤取消關注用戶
 * @param {string} unfollowedUserId - 被取消關注的用戶 ID
 */
export const trackUnfollowUser = (unfollowedUserId) => {
  sendEvent('unfollow_user', {
    unfollowed_user_id: unfollowedUserId?.toString() || '',
    event_category: 'engagement',
    event_label: '取消關注'
  })
}

/**
 * 通用自訂事件追蹤
 * @param {string} eventName - 事件名稱
 * @param {Object} eventParams - 事件參數
 */
export const trackCustomEvent = (eventName, eventParams = {}) => {
  sendEvent(eventName, eventParams)
}

// 導出所有功能
export default {
  setUserId,
  setUserProperties,
  trackPageView,
  trackViewItemList,
  trackViewItem,
  trackSearch,
  trackAddToWishlist,
  trackRemoveFromWishlist,
  trackBeginListing,
  trackCompleteListing,
  trackTransactionInitiated,
  trackTransactionAccepted,
  trackTransactionCompleted,
  trackTransactionCancelled,
  trackContactSeller,
  trackSelectCategory,
  trackLogin,
  trackSignUp,
  trackSubmitReview,
  trackShare,
  trackEarnPoints,
  trackMapSearch,
  trackFilterUsage,
  trackFollowUser,
  trackUnfollowUser,
  trackCustomEvent
}
