import { supabase } from '@/lib/supabase.js'; // 假設您已在 src/supabaseClient.js 初始化

// ===================================================================
// ### 單一物品詳情 API - 完整版（2025-10-31）
// ### 特性：
// ###   - 買家位置三級優先級：瀏覽器 > 主要地點 > 任意地點
// ###   - 賣家位置：自動查詢主要地點（is_primary=true）
// ###   - 支援未登入用戶（Demo 環境）
// ###   - PostGIS 精確距離計算
// ===================================================================

/**
 * 【主要函數】獲取單一物品的完整詳情
 *
 * 買家位置優先級：
 *   1. 瀏覽器提供的即時座標（最優先）
 *   2. 已登入用戶的資料庫主要地點
 *   3. 已登入用戶的任意地點
 *   4. 無位置資訊（distance_km 為 null）
 *
 * 賣家位置：自動查詢該賣家的主要地點（is_primary=true）
 *
 * @param {number} itemId - 要查詢的物品 ID
 * @param {object} options - 可選參數
 * @param {boolean} options.tryBrowserLocation - 是否嘗試獲取瀏覽器位置 (預設: true)
 * @param {object} options.geolocationOptions - 瀏覽器定位選項
 * @returns {Promise<object>} - 回傳統一格式的回應物件
 */
export async function getItemDetails(itemId, options = {}) {
  try {
    // 1. 參數驗證
    if (!itemId || typeof itemId !== "number") {
      try {
        itemId = Number.parseInt(itemId);
      } catch {
        throw new Error("itemId 必須是有效的數字");
      }
    }

    if (itemId <= 0) {
      throw new Error("itemId 必須是正整數");
    }

    const { tryBrowserLocation = true, geolocationOptions = {} } = options;

    console.log(`正在獲取物品 #${itemId} 的詳情 (智能位置模式)...`);

    let userLatitude = null;
    let userLongitude = null;

    // 2. 嘗試獲取瀏覽器位置 (如果啟用)
    if (tryBrowserLocation) {
      try {
        console.log("嘗試獲取瀏覽器位置...");
        const position = await getCurrentLocation(geolocationOptions);
        userLatitude = position.latitude;
        userLongitude = position.longitude;
        console.log(`成功獲取瀏覽器位置: ${userLatitude}, ${userLongitude}`);
      } catch (locationError) {
        console.log(
          `瀏覽器定位失敗，將使用資料庫位置: ${locationError.message}`,
        );
        // 繼續執行，使用資料庫位置
      }
    }

    // 3. 呼叫混合位置 RPC 函式
    console.log(options);
    
    const { data, error } = await supabase
      .rpc("get_item_details_with_location", {
        p_item_id: Number.parseInt(itemId),
        // p_user_latitude: userLatitude,
        // p_user_longitude: userLongitude,
      }, options)
      .maybeSingle();

    // 4. 錯誤處理
    if (error) {
      console.error(`Supabase RPC 錯誤:`, error);

      // 特定錯誤處理
      // 注意：Demo 環境下已移除登入驗證，但保留此處理以備未來需要
      if (error.message.includes("使用者未登入")) {
        return {
          success: false,
          error: true,
          message: "請先登入以查看物品詳情（Production 環境限定）",
          itemId: itemId,
          data: null,
        };
      }

      throw new Error(`資料庫查詢失敗: ${error.message}`);
    }

    // 5. 檢查是否有錯誤回應
    if (data && data.error) {
      console.log(`物品查詢回應: ${data.message}`);
      return {
        success: false,
        error: true,
        message: data.message,
        itemId: itemId,
        data: null,
      };
    }

    // 6. 資料後處理
    if (data) {
      // 確保陣列欄位的完整性
      data.image_urls = data.image_urls || [];
      data.tags = data.tags || [];

      // 處理地理座標 JSON 字串
      if (data.location && data.location.coordinates) {
        try {
          if (typeof data.location.coordinates === "string") {
            data.location.coordinates = JSON.parse(data.location.coordinates);
          }
        } catch (e) {
          console.warn("無法解析物品位置座標:", e);
          data.location.coordinates = null;
        }
      }

      // 處理用戶位置座標
      if (data.user_location && data.user_location.coordinates) {
        try {
          if (typeof data.user_location.coordinates === "string") {
            data.user_location.coordinates = JSON.parse(
              data.user_location.coordinates,
            );
          }
        } catch (e) {
          console.warn("無法解析用戶位置座標:", e);
          data.user_location.coordinates = null;
        }
      }

      // 記錄位置來源資訊
      const locationSource = data.user_location?.source || "unknown";
      console.log(`成功獲取物品 #${itemId} 詳情，位置來源: ${locationSource}`);

      return {
        success: true,
        error: false,
        message: "物品詳情獲取成功",
        itemId: itemId,
        locationSource: locationSource,
        data: data,
      };
    }

    // 7. 沒有資料的情況
    return {
      success: false,
      error: true,
      message: "物品不存在或已下架",
      itemId: itemId,
      data: null,
    };
  } catch (error) {
    console.error(`獲取物品詳情失敗 (itemId: ${itemId}):`, error.message);

    return {
      success: false,
      error: true,
      message: error.message,
      itemId: itemId,
      data: null,
    };
  }
}

/**
 * 【向後相容函數】獲取物品詳情 - 僅使用資料庫位置
 * @param {number} itemId - 要查詢的物品 ID
 * @returns {Promise<object>} - 回傳統一格式的回應物件
 */
export async function getItemDetailsWithDatabaseLocation(itemId) {
  return getItemDetails(itemId, { tryBrowserLocation: false });
}

/**
 * 【強制位置函數】獲取物品詳情 - 使用指定座標
 * @param {number} itemId - 要查詢的物品 ID
 * @param {number} latitude - 緯度
 * @param {number} longitude - 經度
 * @returns {Promise<object>} - 回傳統一格式的回應物件
 */
export async function getItemDetailsWithCoordinates(
  itemId,
  latitude,
  longitude,
) {
  try {
    // 1. 參數驗證
    if (!itemId || typeof itemId !== "number") {
      try {
        itemId = Number(itemId);
      } catch (Error) {
        throw new Error("itemId 必須是有效的數字");
      }
    }

    if (itemId <= 0) {
      throw new Error("itemId 必須是正整數");
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      throw new Error("緯度和經度必須是有效的數字");
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error("緯度必須在 -90 到 90 之間");
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error("經度必須在 -180 到 180 之間");
    }

    console.log(
      `正在獲取物品 #${itemId} 的詳情 (指定座標: ${latitude}, ${longitude})...`,
    );

    // 2. 呼叫純座標 RPC 函式
    const { data, error } = await supabase
      .rpc("get_item_details_with_coordinates", {
        p_item_id: itemId,
        p_latitude: latitude,
        p_longitude: longitude,
      })
      .maybeSingle();

    // 3. 錯誤處理
    if (error) {
      console.error(`Supabase RPC 錯誤:`, error);
      throw new Error(`資料庫查詢失敗: ${error.message}`);
    }

    // 4. 檢查是否有錯誤回應
    if (data && data.error) {
      return {
        success: false,
        error: true,
        message: data.message,
        itemId: itemId,
        data: null,
      };
    }

    // 5. 資料後處理
    if (data) {
      // 確保陣列欄位的完整性
      data.image_urls = data.image_urls || [];
      data.tags = data.tags || [];

      // 處理地理座標
      if (data.location && data.location.coordinates) {
        try {
          if (typeof data.location.coordinates === "string") {
            data.location.coordinates = JSON.parse(data.location.coordinates);
          }
        } catch (e) {
          console.warn("無法解析物品位置座標:", e);
          data.location.coordinates = null;
        }
      }

      if (data.user_location && data.user_location.coordinates) {
        try {
          if (typeof data.user_location.coordinates === "string") {
            data.user_location.coordinates = JSON.parse(
              data.user_location.coordinates,
            );
          }
        } catch (e) {
          console.warn("無法解析用戶位置座標:", e);
          data.user_location.coordinates = null;
        }
      }

      console.log(`成功獲取物品 #${itemId} 詳情 (使用指定座標)`);

      return {
        success: true,
        error: false,
        message: "物品詳情獲取成功",
        itemId: itemId,
        locationSource: "coordinates",
        data: data,
      };
    }

    return {
      success: false,
      error: true,
      message: "物品不存在或已下架",
      itemId: itemId,
      data: null,
    };
  } catch (error) {
    console.error(`獲取物品詳情失敗 (itemId: ${itemId}):`, error.message);

    return {
      success: false,
      error: true,
      message: error.message,
      itemId: itemId,
      data: null,
    };
  }
}

/**
 * 【輔助函數】檢查當前用戶是否已登入
 * @returns {Promise<boolean>} - 是否已登入
 */
export async function checkUserAuthentication() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("檢查認證狀態失敗:", error);
      return false;
    }

    return user !== null;
  } catch (error) {
    console.error("檢查認證狀態時發生錯誤:", error);
    return false;
  }
}

/**
 * 【輔助函數】獲取當前使用者位置（使用瀏覽器 Geolocation API）
 * @param {object} options - Geolocation API 選項
 * @returns {Promise<object>} - 回傳 { latitude, longitude }
 * @throws {Error} - 無法獲取位置時拋出錯誤
 */
export function getCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("此瀏覽器不支援地理位置功能"));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 分鐘快取
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "無法獲取位置";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "使用者拒絕了位置權限要求";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置資訊無法取得";
            break;
          case error.TIMEOUT:
            errorMessage = "獲取位置請求逾時";
            break;
        }
        reject(new Error(errorMessage));
      },
      defaultOptions,
    );
  });
}

/**
 * 【輔助函數】檢查瀏覽器是否支援地理位置
 * @returns {boolean} - 是否支援
 */
export function isGeolocationSupported() {
  return "geolocation" in navigator;
}

/**
 * 【輔助函數】檢查地理位置權限狀態
 * @returns {Promise<string>} - 權限狀態: 'granted', 'denied', 'prompt', 'unsupported'
 */
export async function checkGeolocationPermission() {
  try {
    if (!navigator.permissions) {
      return "unsupported";
    }

    const permission = await navigator.permissions.query({
      name: "geolocation",
    });
    return permission.state;
  } catch (error) {
    console.warn("無法檢查地理位置權限:", error);
    return "unsupported";
  }
}

/*
===================================================================
API 使用指南（基於 2025-10-31 最新 RPC 設計）

【核心設計】
- 買家位置優先級：瀏覽器座標 > 主要地點 > 任意地點 > 無位置
- 賣家位置：自動查詢該賣家的主要地點（is_primary=true）
- 支援未登入用戶查詢（Demo 環境）
- 使用 PostGIS ST_Distance 進行精確距離計算

【API 函數】

1. 【主要 API】getItemDetails(itemId, options)
   - 自動智能選擇最佳位置來源
   - 優先使用瀏覽器位置，失敗時回退到資料庫位置
   - 支援未登入用戶（距離可能為 null）
   - 選項:
     * tryBrowserLocation: 是否嘗試瀏覽器定位 (預設 true)
     * geolocationOptions: 瀏覽器定位選項

2. 【向後相容】getItemDetailsWithDatabaseLocation(itemId)
   - 僅使用資料庫存儲的用戶位置
   - 適合不需要即時定位的場景
   - 需登入才能計算距離

3. 【強制位置】getItemDetailsWithCoordinates(itemId, lat, lng)
   - 使用指定的經緯度座標
   - 適合測試或特殊需求
   - 支援未登入用戶

===================================================================
使用範例:

// === 場景 1: 智能混合模式（推薦，適合大多數情況）===
const result = await getItemDetails(123);
// 自動嘗試瀏覽器定位 → 失敗時使用資料庫地點 → 無地點時 distance_km 為 null

// === 場景 2: 禁用瀏覽器定位（僅用資料庫地點）===
const result = await getItemDetails(123, { tryBrowserLocation: false });
// 只使用資料庫地點，不觸發瀏覽器定位權限請求

// === 場景 3: 自訂瀏覽器定位選項 ===
const result = await getItemDetails(123, {
  geolocationOptions: {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 60000  // 快取 1 分鐘
  }
});

// === 場景 4: 僅用資料庫位置（向後相容）===
const result = await getItemDetailsWithDatabaseLocation(123);
// 等同於 getItemDetails(123, { tryBrowserLocation: false })

// === 場景 5: 指定座標（適合測試或特殊需求）===
const result = await getItemDetailsWithCoordinates(123, 24.1800, 120.6400);
// 使用台中市西屯區座標計算距離

// === 輔助函數 ===
const isSupported = isGeolocationSupported();           // 檢查瀏覽器支援
const permission = await checkGeolocationPermission();  // 檢查權限狀態
const isLoggedIn = await checkUserAuthentication();     // 檢查登入狀態

===================================================================
回傳格式:

{
  success: boolean,           // 是否成功
  error: boolean,             // 是否有錯誤
  message: string,            // 狀態訊息
  itemId: number,             // 物品 ID
  locationSource?: string,    // 位置來源（見下方說明）
  data: object | null         // 物品詳情資料或 null
}

locationSource 可能值：
- 'browser': 使用瀏覽器即時定位
- 'database_primary': 使用資料庫主要地點
- 'database_fallback': 使用資料庫任意地點
- 'coordinates': 使用指定座標
- 'none': 無位置資訊（未登入且無瀏覽器座標）

===================================================================
data 結構 (當 success === true):

{
  // 物品基本資訊
  id: number,
  title: string,
  description: string,
  condition: string,              // '全新', '近全新', '良好', '普通', '需修理'
  listing_status: boolean,
  price: number,
  carbon_value: number,
  image_urls: string[],
  tags: string[],
  created_at: string,
  updated_at: string,

  // 距離計算（核心功能）
  distance_km: number | null,     // 買家與賣家主要地點的距離（公里）
                                  // null 表示無法計算（無買家位置或無賣家主要地點）

  // 互動狀態
  is_favorited: boolean,          // 當前用戶是否已收藏（未登入為 false）
  is_owner: boolean,              // 當前用戶是否為物品擁有者（未登入為 false）

  // 賣家地點資訊（自動查詢賣家的主要地點）
  location: {
    id: number,
    formatted_address: string,
    type: string,                 // '家', '公司', '其他'
    coordinates: {                // GeoJSON 格式
      type: "Point",
      coordinates: [number, number]  // [經度, 緯度]
    } | null
  },

  // 賣家資訊
  user: {
    id: string,                   // UUID
    nickname: string,
    profile_picture_url: string | null,
    avg_rating: number
  },

  // 分類資訊
  category: {
    sub_category_id: number,
    sub_category_name: string,
    main_category_id: number,
    main_category_name: string,
    main_category_icon: string,
    main_category_color: string
  },

  // 買家位置資訊（用於前端顯示位置來源）
  user_location: {
    has_location: boolean,        // 是否有位置資訊
    source: string,               // 'browser', 'database_primary', 'database_fallback', 'none'
    coordinates: {                // 買家的座標（如果有）
      type: "Point",
      coordinates: [number, number]
    } | null,
    message: string               // 位置來源說明
                                  // '使用瀏覽器即時定位'
                                  // '使用您的主要地點'
                                  // '使用您設定的地點'
                                  // '無法取得位置資訊'
  }
}

===================================================================
前端使用範例（Vue 3）:

// 1. 在組件 setup 中使用
import { getItemDetails } from '@/api/itemDetails';

const loadItemDetails = async (itemId) => {
  const result = await getItemDetails(itemId);

  if (result.success) {
    console.log('物品標題:', result.data.title);
    console.log('距離:', result.data.distance_km, '公里');
    console.log('位置來源:', result.data.user_location.message);

    // 根據距離顯示不同提示
    if (result.data.distance_km === null) {
      console.log('提示：允許位置存取以查看距離');
    } else if (result.data.distance_km < 1) {
      console.log('提示：非常近！');
    } else if (result.data.distance_km < 5) {
      console.log('提示：附近');
    }
  } else {
    console.error('錯誤:', result.message);
  }
};

// 2. 顯示距離的輔助函數
const formatDistance = (km) => {
  if (km === null) return '距離：未知';
  if (km < 0.1) return `${(km * 1000).toFixed(0)} 公尺`;
  if (km < 1) return `${km.toFixed(2)} 公里`;
  return `${km.toFixed(1)} 公里`;
};

// 3. 顯示位置來源圖標
const getLocationIcon = (source) => {
  const icons = {
    'browser': '📍',
    'database_primary': '🏠',
    'database_fallback': '📌',
    'none': '❓'
  };
  return icons[source] || '📍';
};

===================================================================
*/