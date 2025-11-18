/**
 * 篩選工具函數集
 * 提供可重用的篩選邏輯
 */

/**
 * 篩選熱門商品（收藏數超過指定門檻）
 * @param {number} threshold - 收藏數門檻，預設為 50
 * @returns {Function} 篩選函數
 */
export function filterByPopularity(threshold = 50) {
  return (item) => (item.favorites_count || 0) >= threshold;
}

/**
 * 篩選附近商品（距離小於指定範圍）
 * @param {number} maxDistance - 最大距離（公里），預設為 5
 * @returns {Function} 篩選函數
 */
export function filterByDistance(maxDistance = 5) {
  return (item) => parseFloat(item.distance_km || 999) <= maxDistance;
}

/**
 * 篩選最近上架商品（天數內上架）
 * @param {number} days - 天數，預設為 7
 * @returns {Function} 篩選函數
 */
export function filterByRecentlyCreated(days = 7) {
  return (item) => {
    const daysSinceCreated = (Date.now() - new Date(item.created_at)) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= days;
  };
}

/**
 * 篩選價格範圍內的商品
 * @param {number} min - 最低價格
 * @param {number} max - 最高價格
 * @returns {Function} 篩選函數
 */
export function filterByPriceRange(min = 0, max = Infinity) {
  return (item) => {
    const price = item.price || 0;
    return price >= min && price <= max;
  };
}

/**
 * 篩選促銷中的商品（有折扣）
 * @returns {Function} 篩選函數
 */
export function filterByDiscount() {
  return (item) => item.discount && item.discount > 0;
}

/**
 * 篩選特定狀態的商品
 * @param {string} status - 狀態值
 * @returns {Function} 篩選函數
 */
export function filterByStatus(status) {
  return (item) => item.status === status;
}

/**
 * 組合多個篩選條件（AND 邏輯）
 * @param {...Function} filters - 多個篩選函數
 * @returns {Function} 組合後的篩選函數
 */
export function combineFilters(...filters) {
  return (item) => filters.every(filter => filter(item));
}

/**
 * 組合多個篩選條件（OR 邏輯）
 * @param {...Function} filters - 多個篩選函數
 * @returns {Function} 組合後的篩選函數
 */
export function combineFiltersOr(...filters) {
  return (item) => filters.some(filter => filter(item));
}

/* ============================================================================
 * FilterTabs 篩選模式使用說明
 * ============================================================================
 *
 * FilterTabs 組件現在支援兩種模式：
 * 1. 排序模式 (type: 'sort' 或省略) - 參見 sortFunctions.js
 * 2. 篩選模式 (type: 'filter') - 本文件說明
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 一、基本篩選模式
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. 使用 filterKey + filterValue (簡單欄位篩選)
 * -----------------------------------------------
 * 根據指定欄位的值進行篩選，適合單一條件的精確匹配。
 *
 * 範例：
 * const filters = [
 *   {
 *     id: 1,
 *     label: '全部商品',
 *     type: 'filter',
 *     filterValue: null,          // null 表示顯示全部，不進行篩選
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '上架中',
 *     type: 'filter',
 *     filterKey: 'status',        // 篩選欄位名稱
 *     filterValue: 'active',      // 篩選值
 *     sortable: false
 *   },
 *   {
 *     id: 3,
 *     label: '已下架',
 *     type: 'filter',
 *     filterKey: 'status',
 *     filterValue: 'inactive',
 *     sortable: false
 *   },
 *   {
 *     id: 4,
 *     label: '已售出',
 *     type: 'filter',
 *     filterKey: 'status',
 *     filterValue: 'sold',
 *     sortable: false
 *   }
 * ];
 *
 *
 * 2. 使用 filterFn (複雜篩選邏輯)
 * -----------------------------------------------
 * 提供自訂篩選函數，適合需要多條件判斷或特殊邏輯的情況。
 *
 * 範例 - 內聯函數：
 * const filters = [
 *   {
 *     id: 1,
 *     label: '熱門商品',
 *     type: 'filter',
 *     filterFn: (item) => item.favorites_count > 100,
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '促銷中',
 *     type: 'filter',
 *     filterFn: (item) => item.discount && item.discount > 0,
 *     sortable: false
 *   }
 * ];
 *
 * 範例 - 使用預定義函數：
 * import { filterByPopularity, filterByDistance } from '@/utils/filterFunctions';
 *
 * const filters = [
 *   {
 *     id: 1,
 *     label: '熱門商品',
 *     type: 'filter',
 *     filterFn: filterByPopularity(100),  // 收藏數 >= 100
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '附近商品',
 *     type: 'filter',
 *     filterFn: filterByDistance(5),      // 5 公里內
 *     sortable: false
 *   }
 * ];
 *
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 二、進階篩選技巧
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. 多條件組合篩選 (AND)
 * -----------------------------------------------
 * 使用 combineFilters 組合多個條件，所有條件都必須滿足。
 *
 * import { combineFilters, filterByDistance, filterByPopularity } from '@/utils/filterFunctions';
 *
 * const filters = [
 *   {
 *     id: 1,
 *     label: '附近且熱門',
 *     type: 'filter',
 *     filterFn: combineFilters(
 *       filterByDistance(5),        // 5 公里內
 *       filterByPopularity(50)      // 且收藏數 >= 50
 *     ),
 *     sortable: false
 *   }
 * ];
 *
 *
 * 2. 多條件組合篩選 (OR)
 * -----------------------------------------------
 * 使用 combineFiltersOr 組合多個條件，滿足任一條件即可。
 *
 * import { combineFiltersOr, filterByPopularity, filterByRecentlyCreated } from '@/utils/filterFunctions';
 *
 * const filters = [
 *   {
 *     id: 1,
 *     label: '熱門或新品',
 *     type: 'filter',
 *     filterFn: combineFiltersOr(
 *       filterByPopularity(100),      // 收藏數 >= 100
 *       filterByRecentlyCreated(7)    // 或 7 天內上架
 *     ),
 *     sortable: false
 *   }
 * ];
 *
 *
 * 3. 複雜自訂邏輯
 * -----------------------------------------------
 * 直接撰寫內聯函數處理更複雜的需求。
 *
 * const filters = [
 *   {
 *     id: 1,
 *     label: '超值好物',
 *     type: 'filter',
 *     filterFn: (item) => {
 *       const isCheap = item.price < 500;
 *       const isPopular = item.favorites_count > 50;
 *       const isNearby = parseFloat(item.distance_km) < 10;
 *
 *       // 便宜且(熱門或附近)
 *       return isCheap && (isPopular || isNearby);
 *     },
 *     sortable: false
 *   }
 * ];
 *
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 三、篩選 + 排序混合模式
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 可以將篩選和排序功能組合在同一個 FilterTabs 中。
 * 組件會先進行篩選，再對篩選結果排序。
 *
 * import { filterByStatus } from '@/utils/filterFunctions';
 *
 * const filters = [
 *   // 篩選類型
 *   {
 *     id: 1,
 *     label: '全部',
 *     type: 'filter',
 *     filterValue: null,
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '上架中',
 *     type: 'filter',
 *     filterFn: filterByStatus('active'),
 *     sortable: false
 *   },
 *   // 排序類型
 *   {
 *     id: 3,
 *     label: '價格',
 *     type: 'sort',         // 排序模式
 *     sortKey: 'price',
 *     defaultOrder: 'asc',
 *     ascText: '低到高',
 *     descText: '高到低'
 *   },
 *   {
 *     id: 4,
 *     label: '時間',
 *     type: 'sort',
 *     sortKey: 'created_at',
 *     defaultOrder: 'desc',
 *     ascText: '早到晚',
 *     descText: '晚到早'
 *   }
 * ];
 *
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 四、完整使用範例
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * // 範例 1: ManageListingsPage - 商品狀態篩選
 * // -----------------------------------------------
 * const statusFilters = [
 *   {
 *     id: 1,
 *     label: '全部商品',
 *     type: 'filter',
 *     filterValue: null,
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '上架中',
 *     type: 'filter',
 *     filterKey: 'status',
 *     filterValue: 'active',
 *     sortable: false
 *   },
 *   {
 *     id: 3,
 *     label: '已下架',
 *     type: 'filter',
 *     filterKey: 'status',
 *     filterValue: 'inactive',
 *     sortable: false
 *   },
 *   {
 *     id: 4,
 *     label: '已售出',
 *     type: 'filter',
 *     filterKey: 'status',
 *     filterValue: 'sold',
 *     sortable: false
 *   }
 * ];
 *
 *
 * // 範例 2: ItemListPage - 價格區間篩選
 * // -----------------------------------------------
 * import { filterByPriceRange } from '@/utils/filterFunctions';
 *
 * const priceFilters = [
 *   {
 *     id: 1,
 *     label: '全部',
 *     type: 'filter',
 *     filterValue: null,
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '500 以下',
 *     type: 'filter',
 *     filterFn: filterByPriceRange(0, 500),
 *     sortable: false
 *   },
 *   {
 *     id: 3,
 *     label: '500-1000',
 *     type: 'filter',
 *     filterFn: filterByPriceRange(500, 1000),
 *     sortable: false
 *   },
 *   {
 *     id: 4,
 *     label: '1000 以上',
 *     type: 'filter',
 *     filterFn: filterByPriceRange(1000, Infinity),
 *     sortable: false
 *   }
 * ];
 *
 *
 * // 範例 3: ItemListPage - 綜合篩選（熱門、附近、新品）
 * // -----------------------------------------------
 * import {
 *   filterByPopularity,
 *   filterByDistance,
 *   filterByRecentlyCreated
 * } from '@/utils/filterFunctions';
 *
 * const mixedFilters = [
 *   {
 *     id: 1,
 *     label: '全部',
 *     type: 'filter',
 *     filterValue: null,
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '熱門商品',
 *     type: 'filter',
 *     filterFn: filterByPopularity(100),
 *     sortable: false
 *   },
 *   {
 *     id: 3,
 *     label: '附近商品',
 *     type: 'filter',
 *     filterFn: filterByDistance(5),
 *     sortable: false
 *   },
 *   {
 *     id: 4,
 *     label: '最新上架',
 *     type: 'filter',
 *     filterFn: filterByRecentlyCreated(7),
 *     sortable: false
 *   }
 * ];
 *
 *
 * // 範例 4: 組合條件篩選
 * // -----------------------------------------------
 * import {
 *   combineFilters,
 *   filterByDistance,
 *   filterByPopularity,
 *   filterByPriceRange
 * } from '@/utils/filterFunctions';
 *
 * const advancedFilters = [
 *   {
 *     id: 1,
 *     label: '全部',
 *     type: 'filter',
 *     filterValue: null,
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '附近且熱門',
 *     type: 'filter',
 *     filterFn: combineFilters(
 *       filterByDistance(5),
 *       filterByPopularity(50)
 *     ),
 *     sortable: false
 *   },
 *   {
 *     id: 3,
 *     label: '超值好物',
 *     type: 'filter',
 *     filterFn: combineFilters(
 *       filterByPriceRange(0, 500),
 *       filterByPopularity(30)
 *     ),
 *     sortable: false
 *   }
 * ];
 *
 *
 * // 範例 5: 完整混合模式（篩選 + 排序）
 * // -----------------------------------------------
 * import { filterByStatus } from '@/utils/filterFunctions';
 * import { sortByRecommendation } from '@/utils/sortFunctions';
 *
 * const fullFeaturedFilters = [
 *   // 篩選按鈕
 *   {
 *     id: 1,
 *     label: '全部',
 *     type: 'filter',
 *     filterValue: null,
 *     sortable: false
 *   },
 *   {
 *     id: 2,
 *     label: '上架中',
 *     type: 'filter',
 *     filterFn: filterByStatus('active'),
 *     sortable: false
 *   },
 *   {
 *     id: 3,
 *     label: '熱門商品',
 *     type: 'filter',
 *     filterFn: filterByPopularity(50),
 *     sortable: false
 *   },
 *   // 排序按鈕
 *   {
 *     id: 4,
 *     label: '為你推薦',
 *     type: 'sort',
 *     sortFn: sortByRecommendation,
 *     defaultOrder: 'desc',
 *     sortable: false
 *   },
 *   {
 *     id: 5,
 *     label: '價格',
 *     type: 'sort',
 *     sortKey: 'price',
 *     defaultOrder: 'asc',
 *     ascText: '低到高',
 *     descText: '高到低'
 *   },
 *   {
 *     id: 6,
 *     label: '時間',
 *     type: 'sort',
 *     sortKey: 'created_at',
 *     defaultOrder: 'desc',
 *     ascText: '早到晚',
 *     descText: '晚到早'
 *   }
 * ];
 *
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 五、配置選項說明
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 篩選模式專用屬性：
 * -----------------------------------------------
 * type           (required) 必須設為 'filter'
 * filterKey      (optional) 篩選欄位名稱
 * filterValue    (optional) 篩選值（null 表示顯示全部）
 * filterFn       (optional) 自訂篩選函數 (item) => boolean
 * sortable       (optional) 建議設為 false，避免誤操作
 *
 * 優先級：
 * -----------------------------------------------
 * filterFn > filterKey + filterValue
 * 如果同時提供 filterFn 和 filterKey，將優先使用 filterFn
 *
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 六、自訂篩選函數規範
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 函數接收一個參數 (item)，返回布林值：
 * - 返回 true：保留此項目
 * - 返回 false：過濾掉此項目
 *
 * 範例：
 * function customFilter(item) {
 *   return item.price < 1000 && item.status === 'active';
 * }
 *
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 七、工具函數快速參考
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * filterByPopularity(threshold)        - 篩選熱門商品（收藏數 >= threshold）
 * filterByDistance(maxDistance)        - 篩選附近商品（距離 <= maxDistance 公里）
 * filterByRecentlyCreated(days)        - 篩選最近上架商品（days 天內）
 * filterByPriceRange(min, max)         - 篩選價格區間內的商品
 * filterByDiscount()                   - 篩選促銷中的商品
 * filterByStatus(status)               - 篩選特定狀態的商品
 * combineFilters(...filters)           - 組合多個篩選條件（AND 邏輯）
 * combineFiltersOr(...filters)         - 組合多個篩選條件（OR 邏輯）
 *
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 八、注意事項
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. 篩選模式建議設定 sortable: false，避免使用者誤以為可以切換排序
 * 2. filterValue 為 null 時表示不進行篩選，會顯示所有數據
 * 3. 篩選優先於排序：如果同時配置篩選和排序，會先篩選再排序
 * 4. filterFn 優先於 filterKey + filterValue
 * 5. 組合條件時，combineFilters 為 AND 邏輯，combineFiltersOr 為 OR 邏輯
 */
