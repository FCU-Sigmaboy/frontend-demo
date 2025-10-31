/**
 * 排序工具函數集
 * 提供可重用的排序邏輯
 */

/**
 * 日期排序函數
 * @param {string|Date} dateA - 第一個日期
 * @param {string|Date} dateB - 第二個日期
 * @returns {number} 排序結果
 */
export function sortByDate(dateA, dateB) {
  return new Date(dateA) - new Date(dateB);
}

/**
 * 數字排序函數
 * @param {number|string} numA - 第一個數字
 * @param {number|string} numB - 第二個數字
 * @returns {number} 排序結果
 */
export function sortByNumber(numA, numB) {
  return (parseFloat(numA) || 0) - (parseFloat(numB) || 0);
}

/**
 * 距離排序函數（考慮單位）
 * @param {object} itemA - 第一個項目
 * @param {object} itemB - 第二個項目
 * @returns {number} 排序結果
 */
export function sortByDistance(itemA, itemB) {
  const distA = parseFloat(itemA.distance_km) || 0;
  const distB = parseFloat(itemB.distance_km) || 0;
  return distA - distB;
}

/**
 * 收藏時間排序（fallback 到建立時間）
 * @param {object} itemA - 第一個項目
 * @param {object} itemB - 第二個項目
 * @returns {number} 排序結果
 */
export function sortByFavoritedTime(itemA, itemB) {
  const dateA = new Date(itemA.favorited_at || itemA.created_at);
  const dateB = new Date(itemB.favorited_at || itemB.created_at);
  return dateA - dateB;
}

/**
 * 熱門度排序（根據收藏數）
 * @param {object} itemA - 第一個項目
 * @param {object} itemB - 第二個項目
 * @returns {number} 排序結果
 */
export function sortByPopularity(itemA, itemB) {
  const countA = itemA.favorites_count || 0;
  const countB = itemB.favorites_count || 0;
  return countA - countB;
}

/**
 * 綜合排序（考慮多個因素）
 * @param {object} itemA - 第一個項目
 * @param {object} itemB - 第二個項目
 * @returns {number} 排序結果
 */
export function sortByRecommendation(itemA, itemB) {
  // 綜合考慮：距離、收藏數、新鮮度
  const distanceScore = (100 - parseFloat(itemA.distance_km || 100)) / 100;
  const popularityScore = (itemA.favorites_count || 0) / 100;
  const freshnessScore = (Date.now() - new Date(itemA.created_at)) / (1000 * 60 * 60 * 24 * 30);

  const scoreA = distanceScore * 0.4 + popularityScore * 0.4 + freshnessScore * 0.2;

  const distanceScoreB = (100 - parseFloat(itemB.distance_km || 100)) / 100;
  const popularityScoreB = (itemB.favorites_count || 0) / 100;
  const freshnessScoreB = (Date.now() - new Date(itemB.created_at)) / (1000 * 60 * 60 * 24 * 30);

  const scoreB = distanceScoreB * 0.4 + popularityScoreB * 0.4 + freshnessScoreB * 0.2;

  return scoreB - scoreA;
}

/* ============================================================================
 * FilterTabs 使用說明
 * ============================================================================
 *
 * FilterTabs 組件支援兩種排序方式：
 *
 * 1. 使用 sortKey (推薦用於簡單欄位排序)
 * -----------------------------------------------
 * 直接指定要排序的欄位名稱，組件會自動偵測類型並排序。
 *
 * 範例：
 * const filters = [
 *   {
 *     id: 1,
 *     label: '上架時間',
 *     sortKey: 'created_at',      // 單一欄位
 *     defaultOrder: 'desc'         // 預設降序（晚到早）
 *   },
 *   {
 *     id: 2,
 *     label: '收藏時間',
 *     sortKey: ['favorited_at', 'created_at'],  // fallback 機制
 *     defaultOrder: 'desc'
 *   }
 * ];
 *
 *
 * 2. 使用 sortFn (用於複雜排序邏輯)
 * -----------------------------------------------
 * 提供自訂排序函數，適合需要多欄位計算或特殊邏輯的情況。
 *
 * 範例：
 * import { sortByRecommendation } from '@/utils/sortFunctions';
 *
 * const filters = [
 *   {
 *     id: 1,
 *     label: '為你推薦',
 *     sortFn: sortByRecommendation,  // 使用預定義函數
 *     defaultOrder: 'desc'
 *   },
 *   {
 *     id: 2,
 *     label: '熱門度',
 *     sortFn: (a, b) => (a.favorites_count || 0) - (b.favorites_count || 0),  // 內聯函數
 *     defaultOrder: 'desc'
 *   }
 * ];
 *
 *
 * Filter 配置選項
 * -----------------------------------------------
 * id             (required) 唯一識別碼
 * label          (required) 顯示的標籤文字
 * sortKey        (optional) 排序欄位名稱，可以是字串或陣列
 * sortFn         (optional) 自訂排序函數
 * defaultOrder   (optional) 預設排序方向 'asc' 或 'desc'，預設為 'asc'
 * ascText        (optional) 升序時顯示的文字，例如 '低到高'
 * descText       (optional) 降序時顯示的文字，例如 '高到低'
 * sortable       (optional) 是否可切換排序方向，預設為 true
 *
 * 注意：
 * - sortKey 和 sortFn 至少要提供一個，如果都提供則優先使用 sortFn
 * - 如果不提供 ascText 和 descText，組件會根據 label 自動判斷文字
 * - 設定 sortable: false 可建立不可切換排序方向的篩選器（例如固定演算法的推薦排序）
 *
 *
 * 排序方向說明
 * -----------------------------------------------
 * asc  (ascending)  : 升序 - 小到大、近到遠、早到晚
 * desc (descending) : 降序 - 大到小、遠到近、晚到早
 *
 *
 * 自訂排序函數規範
 * -----------------------------------------------
 * 函數接收兩個參數 (a, b)，返回數字：
 * - 返回負數：a 排在 b 前面
 * - 返回正數：b 排在 a 前面
 * - 返回 0：順序不變
 *
 * 範例：
 * function customSort(itemA, itemB) {
 *   return itemA.value - itemB.value;
 * }
 *
 * 注意：只需實作升序邏輯，組件會自動處理降序反轉
 *
 *
 * 完整使用範例
 * -----------------------------------------------
 *
 * // ItemListPage - 商品列表（使用自訂文字）
 * const filters = [
 *   {
 *     id: 1,
 *     label: '上架時間',
 *     sortKey: 'created_at',
 *     defaultOrder: 'desc',
 *     ascText: '早到晚',    // 自訂排序方向文字
 *     descText: '晚到早'
 *   },
 *   {
 *     id: 2,
 *     label: '距離',
 *     sortKey: 'distance_km',
 *     defaultOrder: 'asc',
 *     ascText: '近到遠',
 *     descText: '遠到近'
 *   },
 *   {
 *     id: 3,
 *     label: '價格',
 *     sortKey: 'price',
 *     defaultOrder: 'asc',
 *     ascText: '低到高',
 *     descText: '高到低'
 *   }
 * ];
 *
 * // FavoritesPage - 收藏頁面（使用自動判斷）
 * const filters = [
 *   {
 *     id: 1,
 *     label: '收藏時間',         // 包含「時間」，自動判斷為 早到晚/晚到早
 *     sortKey: ['favorited_at', 'created_at'],  // fallback
 *     defaultOrder: 'desc'
 *   },
 *   {
 *     id: 2,
 *     label: '距離',             // 包含「距離」，自動判斷為 近到遠/遠到近
 *     sortKey: 'distance_km',
 *     defaultOrder: 'asc'
 *   },
 *   {
 *     id: 3,
 *     label: '價格',             // 包含「價格」，自動判斷為 低到高/高到低
 *     sortKey: 'price',
 *     defaultOrder: 'asc'
 *   }
 * ];
 *
 * // 使用自訂函數的範例
 * import { sortByRecommendation } from '@/utils/sortFunctions';
 *
 * const filters = [
 *   {
 *     id: 1,
 *     label: '為你推薦',
 *     sortFn: sortByRecommendation,
 *     defaultOrder: 'desc'
 *   }
 * ];
 *
 * // 不可排序篩選器範例
 * const filters = [
 *   {
 *     id: 1,
 *     label: '為你推薦',
 *     sortFn: sortByRecommendation,
 *     defaultOrder: 'desc',
 *     sortable: false  // 不顯示排序方向文字，點擊不會切換排序
 *   },
 *   {
 *     id: 2,
 *     label: '熱門度',
 *     sortFn: sortByPopularity,
 *     defaultOrder: 'desc',
 *     sortable: false  // 固定演算法，不允許切換排序方向
 *   },
 *   {
 *     id: 3,
 *     label: '距離',
 *     sortKey: 'distance_km',
 *     defaultOrder: 'asc',
 *     ascText: '近到遠',
 *     descText: '遠到近'
 *     // sortable: true (預設值，可省略)
 *   }
 * ];
 */
