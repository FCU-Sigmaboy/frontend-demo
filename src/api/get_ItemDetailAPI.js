import { supabase } from '@/lib/supabase.js'; // 假設您已在 src/supabaseClient.js 初始化

// ===================================================================
// ### 單一物品詳情 API - v2.5（2025-11-01）
// ### 特性：
// ###   - 買家位置：自動使用資料庫位置（主要地點優先）
// ###   - 賣家位置：自動查詢主要地點（is_primary=true）
// ###   - 隱私保護：只有登入買家可查看距離資訊
// ###   - 支援未登入用戶瀏覽物品基本資訊
// ###   - PostGIS 精確距離計算
// ###   - 完整的錯誤處理和異常處理
// ###   - 使用 JSONB 優化效能
// ===================================================================

/**
 * 【主要函數】獲取單一物品的完整詳情（優化版）
 *
 * 買家位置策略：
 *   - 自動使用資料庫中的主要地點（is_primary=true）
 *   - 若無主要地點，則使用最早建立的地點
 *   - 若無任何地點，distance_km 為 null
 *
 * 賣家位置：自動查詢該賣家的主要地點（is_primary=true）
 *
 * 隱私保護：
 *   - 只有已登入用戶可以查看距離資訊
 *   - 未登入用戶僅能查看物品基本資訊、文字地址
 *   - 未登入用戶無法查看精確座標
 *   - 物品擁有者查看自己的物品時，不顯示距離資訊
 *
 * @param {number} itemId - 要查詢的物品 ID
 * @returns {Promise<object>} - 回傳統一格式的回應物件
 */
export async function getItemDetails(itemId) {
  try {
    // 1. 參數驗證
    if (!itemId || typeof itemId !== "number") {
      try {
        itemId = parseInt(itemId, 10);
      } catch (error) {
        throw new Error("itemId 必須是有效的數字");
      }
    }

    if (itemId <= 0) {
      throw new Error("itemId 必須是正整數");
    }

    console.log(`正在獲取物品 #${itemId} 的詳情...`);

    // 2. 檢查登入狀態
    const isLoggedIn = await checkUserAuthentication();

    if (!isLoggedIn) {
      console.log("提示：未登入用戶僅能查看物品基本資訊");
    }

    // 3. 呼叫優化版 RPC 函式（自動處理位置）
    const { data, error } = await supabase
      .rpc("get_item_details_with_location", {
        p_item_id: itemId,
      })
      .maybeSingle();

    // 4. 錯誤處理
    if (error) {
      console.error(`Supabase RPC 錯誤:`, error);
      throw new Error(`資料庫查詢失敗: ${error.message}`);
    }

    // 5. 檢查是否有錯誤回應（RPC 內部錯誤）
    if (data && data.error) {
      console.log(`物品查詢回應: ${data.message} (code: ${data.code})`);
      return {
        success: false,
        error: true,
        code: data.code,
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

      // 處理地理座標（JSONB 格式）
      if (data.location && data.location.coordinates) {
        try {
          // 檢查是否需要解析（可能已經是物件）
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
      const locationSource = data.user_location?.source || "none";
      const distanceInfo = data.distance_km
        ? `距離: ${data.distance_km} km`
        : "距離: 未提供";
      console.log(
        `成功獲取物品 #${itemId} 詳情，位置來源: ${locationSource}，${distanceInfo}`,
      );

      return {
        success: true,
        error: false,
        message: "物品詳情獲取成功",
        itemId: itemId,
        locationSource: locationSource,
        isAuthenticated: isLoggedIn,
        hasDistance: data.distance_km !== null,
        isOwner: data.is_owner || false,
        data: data,
      };
    }

    // 7. 沒有資料的情況
    return {
      success: false,
      error: true,
      code: "ITEM_NOT_FOUND",
      message: "物品不存在或已下架",
      itemId: itemId,
      data: null,
    };
  } catch (error) {
    console.error(`獲取物品詳情失敗 (itemId: ${itemId}):`, error.message);

    return {
      success: false,
      error: true,
      code: "INTERNAL_ERROR",
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
      console.warn("檢查登入狀態時發生錯誤:", error.message);
      return false;
    }

    return user !== null;
  } catch (error) {
    console.error("檢查登入狀態失敗:", error.message);
    return false;
  }
}