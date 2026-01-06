# 階段二 Sprint 2：核心工具函數測試 - 實作指引

> **Sprint**：Sprint 2 - 核心工具函數  
> **預估時間**：1 週（約 6-8 小時實作時間）  
> **前置需求**：Sprint 1 已完成（測試基礎建設）  
> **文檔版本**：1.0.0

---

## 目錄

- [概述](#概述)
- [優先測試清單](#優先測試清單)
- [實作步驟](#實作步驟)
  - [Step 1：擴展 formatPoints 測試](#step-1擴展-formatpoints-測試)
  - [Step 2：撰寫 timeFormat 測試](#step-2撰寫-timeformat-測試)
  - [Step 3：撰寫 sortFunctions 測試](#step-3撰寫-sortfunctions-測試)
  - [Step 4：撰寫 filterFunctions 測試](#step-4撰寫-filterfunctions-測試)
  - [Step 5：執行測試並檢視覆蓋率](#step-5執行測試並檢視覆蓋率)
- [測試範例詳解](#測試範例詳解)
- [驗證清單](#驗證清單)
- [常見問題排解](#常見問題排解)
- [Sprint 2 完成標準](#sprint-2-完成標準)
- [下一步](#下一步)

---

## 概述

Sprint 2 的目標是為 `utils/` 目錄下的核心工具函數撰寫測試。這些函數是純函數（pure functions），沒有副作用，是最適合開始撰寫單元測試的模組。

### Sprint 2 目標

1. **完成工具函數測試**：為所有核心工具函數撰寫完整測試
2. **達成覆蓋率目標**：utils/ 目錄覆蓋率達 70%+
3. **建立測試模式**：為後續測試建立可參考的模板
4. **提升總體覆蓋率**：預期總覆蓋率達 10-15%

### Sprint 2 原則

- ✅ **優先測試核心邏輯**：先覆蓋最常使用的函數
- ✅ **測試邊界情況**：包含 null、undefined、無效輸入等
- ✅ **使用假時間**：時間相關測試使用 `vi.useFakeTimers()`
- ✅ **遵循 AAA 模式**：Arrange-Act-Assert 結構化測試

### 工作項目總覽

| 任務 | 說明 | 預估時間 | 測試案例數 |
|------|------|----------|------------|
| formatPoints.test.js | 點數格式化（已完成基礎） | 30 分鐘 | 5-8 個 |
| timeFormat.test.js | 相對時間格式化 | 1.5 小時 | 8-12 個 |
| sortFunctions.test.js | 排序函數集 | 2 小時 | 10-15 個 |
| filterFunctions.test.js | 篩選函數集 | 2 小時 | 10-15 個 |
| 覆蓋率檢視與優化 | 確保達標 | 1 小時 | - |

---

## 優先測試清單

### 📁 src/utils/ 目錄結構

```
src/utils/
├── formatPoints.js        ✅ Sprint 1 已有基礎測試
├── formatPoints.test.js   ✅ 已存在
├── timeFormat.js          🔴 高優先級 - Sprint 2
├── sortFunctions.js       🟡 中優先級 - Sprint 2
├── filterFunctions.js     🟡 中優先級 - Sprint 2
├── googleMapsLoader.js    🟢 低優先級 - 外部依賴
└── openStreetMapLoader.js 🟢 低優先級 - 外部依賴
```

### 優先級說明

| 檔案 | 優先級 | 原因 | 預估測試案例 |
|------|--------|------|--------------|
| formatPoints.js | 🔴 高 | 簡單純函數，已有測試 | 5-8 個 |
| timeFormat.js | 🔴 高 | 核心 UI 顯示邏輯 | 8-12 個 |
| sortFunctions.js | 🟡 中 | 列表排序核心邏輯 | 10-15 個 |
| filterFunctions.js | 🟡 中 | 列表篩選核心邏輯 | 10-15 個 |
| googleMapsLoader.js | 🟢 低 | 外部 API 依賴，複雜 Mock | 跳過 |
| openStreetMapLoader.js | 🟢 低 | 外部 API 依賴，複雜 Mock | 跳過 |

---

## 實作步驟

### Step 1：擴展 formatPoints 測試

Sprint 1 已建立 `formatPoints.test.js`，確認其完整性。如需擴展，可添加更多邊界情況。

#### 檢視現有測試

```bash
npm run test -- src/utils/formatPoints.test.js
```

#### 現有測試涵蓋

- ✅ 正常數值（1000, 1000000, 0, 100）
- ✅ null / undefined
- ✅ 非數字字串
- ✅ 數字字串
- ✅ 負數

#### 可選：補充測試案例

如需更完整覆蓋，可添加：

```javascript
// 補充測試案例（可選）
describe('進階情況', () => {
  it('應處理小數', () => {
    expect(formatPoints(1000.5)).toBe('1,000.5 點')
  })

  it('應處理極大數字', () => {
    expect(formatPoints(999999999)).toBe('999,999,999 點')
  })

  it('應處理 NaN', () => {
    expect(formatPoints(NaN)).toBe('0 點')
  })
})
```

---

### Step 2：撰寫 timeFormat 測試

建立 `src/utils/timeFormat.test.js`：

```javascript
// src/utils/timeFormat.test.js
// Sprint 2: 時間格式化測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime } from './timeFormat'

describe('formatRelativeTime', () => {
  // =========================================================================
  // 測試環境設置
  // =========================================================================
  beforeEach(() => {
    // 固定當前時間為 2026-01-06 12:00:00 UTC
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-06T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // 無效輸入測試
  // =========================================================================
  describe('無效輸入', () => {
    it('應處理 null 值，返回「未知時間」', () => {
      expect(formatRelativeTime(null)).toBe('未知時間')
    })

    it('應處理 undefined，返回「未知時間」', () => {
      expect(formatRelativeTime(undefined)).toBe('未知時間')
    })

    it('應處理空字串，返回「未知時間」', () => {
      expect(formatRelativeTime('')).toBe('未知時間')
    })
  })

  // =========================================================================
  // 秒級時間測試
  // =========================================================================
  describe('秒級時間', () => {
    it('應顯示「剛剛」於 30 秒內', () => {
      const thirtySecondsAgo = new Date('2026-01-06T11:59:30Z')
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('剛剛')
    })

    it('應顯示「剛剛」於 59 秒內', () => {
      const fiftyNineSecondsAgo = new Date('2026-01-06T11:59:01Z')
      expect(formatRelativeTime(fiftyNineSecondsAgo)).toBe('剛剛')
    })
  })

  // =========================================================================
  // 分鐘級時間測試
  // =========================================================================
  describe('分鐘級時間', () => {
    it('應顯示「1分鐘前」', () => {
      const oneMinuteAgo = new Date('2026-01-06T11:59:00Z')
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1分鐘前')
    })

    it('應顯示「5分鐘前」', () => {
      const fiveMinutesAgo = new Date('2026-01-06T11:55:00Z')
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分鐘前')
    })

    it('應顯示「59分鐘前」', () => {
      const fiftyNineMinutesAgo = new Date('2026-01-06T11:01:00Z')
      expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59分鐘前')
    })
  })

  // =========================================================================
  // 小時級時間測試
  // =========================================================================
  describe('小時級時間', () => {
    it('應顯示「1小時前」', () => {
      const oneHourAgo = new Date('2026-01-06T11:00:00Z')
      expect(formatRelativeTime(oneHourAgo)).toBe('1小時前')
    })

    it('應顯示「3小時前」', () => {
      const threeHoursAgo = new Date('2026-01-06T09:00:00Z')
      expect(formatRelativeTime(threeHoursAgo)).toBe('3小時前')
    })

    it('應顯示「23小時前」', () => {
      const twentyThreeHoursAgo = new Date('2026-01-05T13:00:00Z')
      expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23小時前')
    })
  })

  // =========================================================================
  // 天級時間測試
  // =========================================================================
  describe('天級時間', () => {
    it('應顯示「1天前」', () => {
      const oneDayAgo = new Date('2026-01-05T12:00:00Z')
      expect(formatRelativeTime(oneDayAgo)).toBe('1天前')
    })

    it('應顯示「2天前」', () => {
      const twoDaysAgo = new Date('2026-01-04T12:00:00Z')
      expect(formatRelativeTime(twoDaysAgo)).toBe('2天前')
    })

    it('應顯示「29天前」', () => {
      const twentyNineDaysAgo = new Date('2025-12-08T12:00:00Z')
      expect(formatRelativeTime(twentyNineDaysAgo)).toBe('29天前')
    })
  })

  // =========================================================================
  // 月級時間測試
  // =========================================================================
  describe('月級時間', () => {
    it('應顯示「1個月前」', () => {
      const oneMonthAgo = new Date('2025-12-06T12:00:00Z')
      expect(formatRelativeTime(oneMonthAgo)).toBe('1個月前')
    })

    it('應顯示「6個月前」', () => {
      const sixMonthsAgo = new Date('2025-07-06T12:00:00Z')
      expect(formatRelativeTime(sixMonthsAgo)).toBe('6個月前')
    })

    it('應顯示「11個月前」', () => {
      const elevenMonthsAgo = new Date('2025-02-06T12:00:00Z')
      expect(formatRelativeTime(elevenMonthsAgo)).toBe('11個月前')
    })
  })

  // =========================================================================
  // 年級時間測試
  // =========================================================================
  describe('年級時間', () => {
    it('應顯示「1年前」', () => {
      const oneYearAgo = new Date('2025-01-06T12:00:00Z')
      expect(formatRelativeTime(oneYearAgo)).toBe('1年前')
    })

    it('應顯示「2年前」', () => {
      const twoYearsAgo = new Date('2024-01-06T12:00:00Z')
      expect(formatRelativeTime(twoYearsAgo)).toBe('2年前')
    })

    it('應顯示「5年前」', () => {
      const fiveYearsAgo = new Date('2021-01-06T12:00:00Z')
      expect(formatRelativeTime(fiveYearsAgo)).toBe('5年前')
    })
  })

  // =========================================================================
  // 未來時間測試
  // =========================================================================
  describe('未來時間', () => {
    it('應顯示「剛剛」於未來時間', () => {
      const futureTime = new Date('2026-01-06T13:00:00Z')
      expect(formatRelativeTime(futureTime)).toBe('剛剛')
    })

    it('應顯示「剛剛」於明天的時間', () => {
      const tomorrowTime = new Date('2026-01-07T12:00:00Z')
      expect(formatRelativeTime(tomorrowTime)).toBe('剛剛')
    })
  })

  // =========================================================================
  // 輸入格式測試
  // =========================================================================
  describe('輸入格式', () => {
    it('應正確處理 ISO 8601 字串', () => {
      expect(formatRelativeTime('2026-01-06T11:55:00Z')).toBe('5分鐘前')
    })

    it('應正確處理 Date 物件', () => {
      const date = new Date('2026-01-06T11:55:00Z')
      expect(formatRelativeTime(date)).toBe('5分鐘前')
    })

    it('應正確處理時間戳數字', () => {
      // 2026-01-06T11:55:00Z 的時間戳
      const timestamp = new Date('2026-01-06T11:55:00Z').getTime()
      expect(formatRelativeTime(new Date(timestamp))).toBe('5分鐘前')
    })
  })
})
```

#### 執行測試

```bash
npm run test -- src/utils/timeFormat.test.js
```

---

### Step 3：撰寫 sortFunctions 測試

建立 `src/utils/sortFunctions.test.js`：

```javascript
// src/utils/sortFunctions.test.js
// Sprint 2: 排序函數測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  sortByDate,
  sortByNumber,
  sortByDistance,
  sortByFavoritedTime,
  sortByPopularity,
  sortByRecommendation,
} from './sortFunctions'

describe('sortFunctions', () => {
  // =========================================================================
  // sortByDate 測試
  // =========================================================================
  describe('sortByDate', () => {
    it('應按日期升序排列', () => {
      const dateA = '2026-01-01'
      const dateB = '2026-01-05'
      expect(sortByDate(dateA, dateB)).toBeLessThan(0)
    })

    it('應按日期降序排列（反向）', () => {
      const dateA = '2026-01-05'
      const dateB = '2026-01-01'
      expect(sortByDate(dateA, dateB)).toBeGreaterThan(0)
    })

    it('相同日期應返回 0', () => {
      const dateA = '2026-01-01'
      const dateB = '2026-01-01'
      expect(sortByDate(dateA, dateB)).toBe(0)
    })

    it('應正確處理 Date 物件', () => {
      const dateA = new Date('2026-01-01')
      const dateB = new Date('2026-01-05')
      expect(sortByDate(dateA, dateB)).toBeLessThan(0)
    })

    it('應正確排序陣列', () => {
      const dates = ['2026-01-05', '2026-01-01', '2026-01-03']
      const sorted = [...dates].sort(sortByDate)
      expect(sorted).toEqual(['2026-01-01', '2026-01-03', '2026-01-05'])
    })
  })

  // =========================================================================
  // sortByNumber 測試
  // =========================================================================
  describe('sortByNumber', () => {
    it('應按數字升序排列', () => {
      expect(sortByNumber(10, 20)).toBeLessThan(0)
    })

    it('應按數字降序排列（反向）', () => {
      expect(sortByNumber(20, 10)).toBeGreaterThan(0)
    })

    it('相同數字應返回 0', () => {
      expect(sortByNumber(10, 10)).toBe(0)
    })

    it('應正確處理字串數字', () => {
      expect(sortByNumber('10', '20')).toBeLessThan(0)
    })

    it('應處理無效值為 0', () => {
      expect(sortByNumber('abc', 10)).toBeLessThan(0)
      expect(sortByNumber(null, 10)).toBeLessThan(0)
      expect(sortByNumber(undefined, 10)).toBeLessThan(0)
    })

    it('應正確排序陣列', () => {
      const numbers = [30, 10, 20]
      const sorted = [...numbers].sort(sortByNumber)
      expect(sorted).toEqual([10, 20, 30])
    })
  })

  // =========================================================================
  // sortByDistance 測試
  // =========================================================================
  describe('sortByDistance', () => {
    it('應按距離升序排列', () => {
      const itemA = { distance_km: 5 }
      const itemB = { distance_km: 10 }
      expect(sortByDistance(itemA, itemB)).toBeLessThan(0)
    })

    it('應按距離降序排列（反向）', () => {
      const itemA = { distance_km: 10 }
      const itemB = { distance_km: 5 }
      expect(sortByDistance(itemA, itemB)).toBeGreaterThan(0)
    })

    it('相同距離應返回 0', () => {
      const itemA = { distance_km: 5 }
      const itemB = { distance_km: 5 }
      expect(sortByDistance(itemA, itemB)).toBe(0)
    })

    it('應處理字串距離', () => {
      const itemA = { distance_km: '5.5' }
      const itemB = { distance_km: '10.2' }
      expect(sortByDistance(itemA, itemB)).toBeLessThan(0)
    })

    it('應處理缺少距離欄位的項目', () => {
      const itemA = {}
      const itemB = { distance_km: 5 }
      expect(sortByDistance(itemA, itemB)).toBeLessThan(0) // 0 < 5
    })

    it('應正確排序陣列', () => {
      const items = [{ distance_km: 10 }, { distance_km: 5 }, { distance_km: 8 }]
      const sorted = [...items].sort(sortByDistance)
      expect(sorted.map((i) => i.distance_km)).toEqual([5, 8, 10])
    })
  })

  // =========================================================================
  // sortByFavoritedTime 測試
  // =========================================================================
  describe('sortByFavoritedTime', () => {
    it('應按收藏時間升序排列', () => {
      const itemA = { favorited_at: '2026-01-01' }
      const itemB = { favorited_at: '2026-01-05' }
      expect(sortByFavoritedTime(itemA, itemB)).toBeLessThan(0)
    })

    it('應使用 created_at 作為 fallback', () => {
      const itemA = { created_at: '2026-01-01' }
      const itemB = { created_at: '2026-01-05' }
      expect(sortByFavoritedTime(itemA, itemB)).toBeLessThan(0)
    })

    it('應優先使用 favorited_at', () => {
      const itemA = { favorited_at: '2026-01-05', created_at: '2026-01-01' }
      const itemB = { favorited_at: '2026-01-01', created_at: '2026-01-10' }
      // itemA favorited_at 較晚，應排在後面
      expect(sortByFavoritedTime(itemA, itemB)).toBeGreaterThan(0)
    })

    it('應正確排序混合資料', () => {
      const items = [
        { favorited_at: '2026-01-10' },
        { created_at: '2026-01-01' },
        { favorited_at: '2026-01-05' },
      ]
      const sorted = [...items].sort(sortByFavoritedTime)
      expect(sorted[0].created_at || sorted[0].favorited_at).toBe('2026-01-01')
    })
  })

  // =========================================================================
  // sortByPopularity 測試
  // =========================================================================
  describe('sortByPopularity', () => {
    it('應按收藏數升序排列', () => {
      const itemA = { favorites_count: 10 }
      const itemB = { favorites_count: 50 }
      expect(sortByPopularity(itemA, itemB)).toBeLessThan(0)
    })

    it('應按收藏數降序排列（反向）', () => {
      const itemA = { favorites_count: 50 }
      const itemB = { favorites_count: 10 }
      expect(sortByPopularity(itemA, itemB)).toBeGreaterThan(0)
    })

    it('應處理缺少 favorites_count 的項目', () => {
      const itemA = {}
      const itemB = { favorites_count: 10 }
      expect(sortByPopularity(itemA, itemB)).toBeLessThan(0) // 0 < 10
    })

    it('應正確排序陣列（升序）', () => {
      const items = [{ favorites_count: 50 }, { favorites_count: 10 }, { favorites_count: 30 }]
      const sorted = [...items].sort(sortByPopularity)
      expect(sorted.map((i) => i.favorites_count)).toEqual([10, 30, 50])
    })

    it('應正確排序陣列（降序）', () => {
      const items = [{ favorites_count: 50 }, { favorites_count: 10 }, { favorites_count: 30 }]
      const sorted = [...items].sort((a, b) => -sortByPopularity(a, b))
      expect(sorted.map((i) => i.favorites_count)).toEqual([50, 30, 10])
    })
  })

  // =========================================================================
  // sortByRecommendation 測試
  // =========================================================================
  describe('sortByRecommendation', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-06T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('應返回數字類型', () => {
      const itemA = { distance_km: 5, favorites_count: 50, created_at: '2026-01-01' }
      const itemB = { distance_km: 10, favorites_count: 20, created_at: '2025-12-01' }
      const result = sortByRecommendation(itemA, itemB)
      expect(typeof result).toBe('number')
    })

    it('近距離高收藏應排在前面', () => {
      const itemA = { distance_km: 2, favorites_count: 100, created_at: '2026-01-01' }
      const itemB = { distance_km: 50, favorites_count: 10, created_at: '2026-01-01' }
      // sortByRecommendation 返回 scoreB - scoreA
      // 如果 itemA 評分更高（scoreA > scoreB），則結果 < 0，itemA 會排在前面
      // Array.sort() 中：負值表示第一個參數應排在前面
      expect(sortByRecommendation(itemA, itemB)).toBeLessThan(0)
    })

    it('應處理缺少欄位的項目', () => {
      const itemA = {}
      const itemB = { distance_km: 5, favorites_count: 10, created_at: '2026-01-01' }
      const result = sortByRecommendation(itemA, itemB)
      expect(typeof result).toBe('number')
      expect(isNaN(result)).toBe(false)
    })

    it('應用於陣列排序不報錯', () => {
      const items = [
        { distance_km: 10, favorites_count: 20, created_at: '2026-01-01' },
        { distance_km: 5, favorites_count: 100, created_at: '2025-12-01' },
        { distance_km: 2, favorites_count: 50, created_at: '2026-01-05' },
      ]
      expect(() => items.sort(sortByRecommendation)).not.toThrow()
    })
  })
})
```

#### 執行測試

```bash
npm run test -- src/utils/sortFunctions.test.js
```

---

### Step 4：撰寫 filterFunctions 測試

建立 `src/utils/filterFunctions.test.js`：

```javascript
// src/utils/filterFunctions.test.js
// Sprint 2: 篩選函數測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  filterByPopularity,
  filterByDistance,
  filterByRecentlyCreated,
  filterByPriceRange,
  filterByDiscount,
  filterByStatus,
  combineFilters,
  combineFiltersOr,
} from './filterFunctions'

describe('filterFunctions', () => {
  // =========================================================================
  // filterByPopularity 測試
  // =========================================================================
  describe('filterByPopularity', () => {
    it('應篩選出收藏數達到門檻的項目', () => {
      const filter = filterByPopularity(50)
      expect(filter({ favorites_count: 100 })).toBe(true)
      expect(filter({ favorites_count: 50 })).toBe(true)
      expect(filter({ favorites_count: 49 })).toBe(false)
    })

    it('應使用預設門檻 50', () => {
      const filter = filterByPopularity()
      expect(filter({ favorites_count: 50 })).toBe(true)
      expect(filter({ favorites_count: 49 })).toBe(false)
    })

    it('應處理缺少 favorites_count 的項目', () => {
      const filter = filterByPopularity(50)
      expect(filter({})).toBe(false)
      expect(filter({ favorites_count: null })).toBe(false)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, favorites_count: 100 },
        { id: 2, favorites_count: 30 },
        { id: 3, favorites_count: 60 },
      ]
      const filtered = items.filter(filterByPopularity(50))
      expect(filtered.map((i) => i.id)).toEqual([1, 3])
    })
  })

  // =========================================================================
  // filterByDistance 測試
  // =========================================================================
  describe('filterByDistance', () => {
    it('應篩選出距離小於等於門檻的項目', () => {
      const filter = filterByDistance(5)
      expect(filter({ distance_km: 3 })).toBe(true)
      expect(filter({ distance_km: 5 })).toBe(true)
      expect(filter({ distance_km: 6 })).toBe(false)
    })

    it('應使用預設門檻 5 公里', () => {
      const filter = filterByDistance()
      expect(filter({ distance_km: 5 })).toBe(true)
      expect(filter({ distance_km: 5.1 })).toBe(false)
    })

    it('應處理字串距離', () => {
      const filter = filterByDistance(5)
      expect(filter({ distance_km: '3.5' })).toBe(true)
      expect(filter({ distance_km: '6.0' })).toBe(false)
    })

    it('應處理缺少 distance_km 的項目（預設為 999）', () => {
      const filter = filterByDistance(5)
      expect(filter({})).toBe(false)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, distance_km: 2 },
        { id: 2, distance_km: 10 },
        { id: 3, distance_km: 4 },
      ]
      const filtered = items.filter(filterByDistance(5))
      expect(filtered.map((i) => i.id)).toEqual([1, 3])
    })
  })

  // =========================================================================
  // filterByRecentlyCreated 測試
  // =========================================================================
  describe('filterByRecentlyCreated', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-06T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('應篩選出指定天數內建立的項目', () => {
      const filter = filterByRecentlyCreated(7)
      expect(filter({ created_at: '2026-01-05T12:00:00Z' })).toBe(true) // 1天前
      expect(filter({ created_at: '2026-01-01T12:00:00Z' })).toBe(true) // 5天前
      expect(filter({ created_at: '2025-12-25T12:00:00Z' })).toBe(false) // 12天前
    })

    it('應使用預設天數 7', () => {
      const filter = filterByRecentlyCreated()
      expect(filter({ created_at: '2026-01-01T12:00:00Z' })).toBe(true)
    })

    it('應處理剛好達到天數的邊界情況', () => {
      const filter = filterByRecentlyCreated(7)
      // 剛好 7 天
      expect(filter({ created_at: '2025-12-30T12:00:00Z' })).toBe(true)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, created_at: '2026-01-05T12:00:00Z' }, // 1天前
        { id: 2, created_at: '2025-12-20T12:00:00Z' }, // 17天前
        { id: 3, created_at: '2026-01-03T12:00:00Z' }, // 3天前
      ]
      const filtered = items.filter(filterByRecentlyCreated(7))
      expect(filtered.map((i) => i.id)).toEqual([1, 3])
    })
  })

  // =========================================================================
  // filterByPriceRange 測試
  // =========================================================================
  describe('filterByPriceRange', () => {
    it('應篩選出價格在範圍內的項目', () => {
      const filter = filterByPriceRange(100, 500)
      expect(filter({ price: 100 })).toBe(true)
      expect(filter({ price: 300 })).toBe(true)
      expect(filter({ price: 500 })).toBe(true)
      expect(filter({ price: 99 })).toBe(false)
      expect(filter({ price: 501 })).toBe(false)
    })

    it('應使用預設範圍 0 到 Infinity', () => {
      const filter = filterByPriceRange()
      expect(filter({ price: 0 })).toBe(true)
      expect(filter({ price: 999999 })).toBe(true)
    })

    it('應處理缺少 price 的項目', () => {
      const filter = filterByPriceRange(100, 500)
      // price 缺失時預設為 0，0 不在 100-500 範圍內
      expect(filter({})).toBe(false) // 0 < 100，不在範圍內
      expect(filter({ price: undefined })).toBe(false) // 0 < 100
    })

    it('應只設定最低價格', () => {
      const filter = filterByPriceRange(100)
      expect(filter({ price: 100 })).toBe(true)
      expect(filter({ price: 99 })).toBe(false)
      expect(filter({ price: 10000 })).toBe(true)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, price: 50 },
        { id: 2, price: 200 },
        { id: 3, price: 600 },
        { id: 4, price: 300 },
      ]
      const filtered = items.filter(filterByPriceRange(100, 500))
      expect(filtered.map((i) => i.id)).toEqual([2, 4])
    })
  })

  // =========================================================================
  // filterByDiscount 測試
  // =========================================================================
  describe('filterByDiscount', () => {
    it('應篩選出有折扣的項目', () => {
      const filter = filterByDiscount()
      expect(filter({ discount: 10 })).toBe(true)
      expect(filter({ discount: 0.5 })).toBe(true)
      expect(filter({ discount: 0 })).toBe(false)
      expect(filter({ discount: null })).toBe(false)
      expect(filter({})).toBe(false)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, discount: 10 },
        { id: 2, discount: 0 },
        { id: 3, discount: 5 },
        { id: 4 },
      ]
      const filtered = items.filter(filterByDiscount())
      expect(filtered.map((i) => i.id)).toEqual([1, 3])
    })
  })

  // =========================================================================
  // filterByStatus 測試
  // =========================================================================
  describe('filterByStatus', () => {
    it('應篩選出指定狀態的項目', () => {
      const filter = filterByStatus('active')
      expect(filter({ status: 'active' })).toBe(true)
      expect(filter({ status: 'inactive' })).toBe(false)
      expect(filter({ status: 'sold' })).toBe(false)
    })

    it('應處理缺少 status 的項目', () => {
      const filter = filterByStatus('active')
      expect(filter({})).toBe(false)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' },
        { id: 4, status: 'sold' },
      ]
      const filtered = items.filter(filterByStatus('active'))
      expect(filtered.map((i) => i.id)).toEqual([1, 3])
    })
  })

  // =========================================================================
  // combineFilters 測試 (AND 邏輯)
  // =========================================================================
  describe('combineFilters (AND)', () => {
    it('應組合多個篩選條件（全部滿足）', () => {
      const combined = combineFilters(
        filterByPopularity(50),
        filterByDistance(10)
      )
      expect(combined({ favorites_count: 100, distance_km: 5 })).toBe(true)
      expect(combined({ favorites_count: 100, distance_km: 15 })).toBe(false)
      expect(combined({ favorites_count: 30, distance_km: 5 })).toBe(false)
    })

    it('應處理單一篩選條件', () => {
      const combined = combineFilters(filterByPopularity(50))
      expect(combined({ favorites_count: 100 })).toBe(true)
      expect(combined({ favorites_count: 30 })).toBe(false)
    })

    it('應處理空篩選條件', () => {
      const combined = combineFilters()
      expect(combined({ favorites_count: 100 })).toBe(true)
      expect(combined({})).toBe(true)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, favorites_count: 100, distance_km: 5 },
        { id: 2, favorites_count: 30, distance_km: 3 },
        { id: 3, favorites_count: 60, distance_km: 15 },
        { id: 4, favorites_count: 80, distance_km: 8 },
      ]
      const filtered = items.filter(
        combineFilters(filterByPopularity(50), filterByDistance(10))
      )
      expect(filtered.map((i) => i.id)).toEqual([1, 4])
    })
  })

  // =========================================================================
  // combineFiltersOr 測試 (OR 邏輯)
  // =========================================================================
  describe('combineFiltersOr (OR)', () => {
    it('應組合多個篩選條件（滿足任一）', () => {
      const combined = combineFiltersOr(
        filterByPopularity(100),
        filterByDistance(3)
      )
      expect(combined({ favorites_count: 150, distance_km: 10 })).toBe(true) // 滿足第一個
      expect(combined({ favorites_count: 30, distance_km: 2 })).toBe(true) // 滿足第二個
      expect(combined({ favorites_count: 150, distance_km: 2 })).toBe(true) // 滿足兩個
      expect(combined({ favorites_count: 30, distance_km: 10 })).toBe(false) // 都不滿足
    })

    it('應處理單一篩選條件', () => {
      const combined = combineFiltersOr(filterByPopularity(50))
      expect(combined({ favorites_count: 100 })).toBe(true)
      expect(combined({ favorites_count: 30 })).toBe(false)
    })

    it('應處理空篩選條件', () => {
      const combined = combineFiltersOr()
      // 空陣列的 some() 返回 false
      expect(combined({ favorites_count: 100 })).toBe(false)
    })

    it('應正確篩選陣列', () => {
      const items = [
        { id: 1, favorites_count: 150, distance_km: 10 }, // 滿足熱門
        { id: 2, favorites_count: 30, distance_km: 2 }, // 滿足距離
        { id: 3, favorites_count: 30, distance_km: 10 }, // 都不滿足
        { id: 4, favorites_count: 120, distance_km: 1 }, // 滿足兩個
      ]
      const filtered = items.filter(
        combineFiltersOr(filterByPopularity(100), filterByDistance(3))
      )
      expect(filtered.map((i) => i.id)).toEqual([1, 2, 4])
    })
  })
})
```

#### 執行測試

```bash
npm run test -- src/utils/filterFunctions.test.js
```

---

### Step 5：執行測試並檢視覆蓋率

#### 執行所有工具函數測試

```bash
npm run test -- src/utils/
```

#### 產生覆蓋率報告

```bash
npm run test:coverage
```

#### 檢視覆蓋率報告

覆蓋率報告將輸出到 `coverage/` 目錄：

```bash
# 開啟 HTML 報告（需要瀏覽器）
open coverage/index.html

# 或直接查看終端機輸出的文字報告
```

#### 預期覆蓋率

Sprint 2 完成後，預期覆蓋率：

| 模組 | 預期覆蓋率 |
|------|------------|
| src/utils/formatPoints.js | 100% |
| src/utils/timeFormat.js | 90%+ |
| src/utils/sortFunctions.js | 80%+ |
| src/utils/filterFunctions.js | 80%+ |
| **utils/ 目錄整體** | **70%+** |
| **專案整體** | **10-15%** |

---

## 測試範例詳解

### AAA 模式

所有測試遵循 Arrange-Act-Assert 模式：

```javascript
it('應篩選出收藏數達到門檻的項目', () => {
  // Arrange（準備）
  const filter = filterByPopularity(50)
  const item = { favorites_count: 100 }
  
  // Act（執行）
  const result = filter(item)
  
  // Assert（斷言）
  expect(result).toBe(true)
})
```

### 使用假時間

時間相關測試必須使用假時間，確保測試結果可預測：

```javascript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-06T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})
```

### 邊界情況測試

每個函數都應測試邊界情況：

```javascript
describe('邊界情況', () => {
  it('應處理 null 值', () => { /* ... */ })
  it('應處理 undefined', () => { /* ... */ })
  it('應處理空物件', () => { /* ... */ })
  it('應處理邊界數值', () => { /* ... */ })
})
```

### 陣列排序/篩選測試

驗證函數在實際使用場景中的行為：

```javascript
it('應正確篩選陣列', () => {
  const items = [
    { id: 1, favorites_count: 100 },
    { id: 2, favorites_count: 30 },
    { id: 3, favorites_count: 60 },
  ]
  const filtered = items.filter(filterByPopularity(50))
  expect(filtered.map((i) => i.id)).toEqual([1, 3])
})
```

---

## 驗證清單

完成所有步驟後，請逐項驗證：

### ✅ 測試檔案驗證

確認以下測試檔案已建立：

- [ ] `src/utils/formatPoints.test.js` - 已存在（Sprint 1）
- [ ] `src/utils/timeFormat.test.js` - 新建立
- [ ] `src/utils/sortFunctions.test.js` - 新建立
- [ ] `src/utils/filterFunctions.test.js` - 新建立

### ✅ 測試執行驗證

```bash
# 執行所有工具函數測試
npm run test -- src/utils/

# 預期：所有測試通過
```

### ✅ 覆蓋率驗證

```bash
# 執行覆蓋率
npm run test:coverage

# 預期：
# - utils/ 目錄覆蓋率 >= 70%
# - 專案整體覆蓋率 >= 10%
```

### ✅ 個別檔案驗證

```bash
# formatPoints
npm run test -- src/utils/formatPoints.test.js

# timeFormat
npm run test -- src/utils/timeFormat.test.js

# sortFunctions
npm run test -- src/utils/sortFunctions.test.js

# filterFunctions
npm run test -- src/utils/filterFunctions.test.js
```

### ✅ CI 驗證

1. 提交變更到分支
2. 確認 GitHub Actions 正確觸發
3. 確認 `test` job 成功執行
4. 確認覆蓋率報告已上傳

---

## 常見問題排解

### Q1：時間相關測試結果不穩定

**原因**：測試依賴真實系統時間

**解決方案**：確保使用 `vi.useFakeTimers()` 和 `vi.setSystemTime()`

```javascript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-06T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})
```

---

### Q2：排序函數測試結果與預期相反

**原因**：排序方向（升序/降序）理解錯誤

**解決方案**：

- `sortFn(a, b) < 0` → a 排在 b 前面
- `sortFn(a, b) > 0` → b 排在 a 前面
- 降序排列時使用 `items.sort((a, b) => -sortFn(a, b))`

---

### Q3：篩選函數測試中 undefined 處理不一致

**原因**：不同函數對缺失值的處理方式不同

**解決方案**：明確了解每個函數的預設行為

| 函數 | 缺失值處理 |
|------|-----------|
| `filterByPopularity` | `favorites_count` 缺失視為 0 |
| `filterByDistance` | `distance_km` 缺失視為 999 |
| `filterByPriceRange` | `price` 缺失視為 0 |

---

### Q4：測試覆蓋率未達標

**原因**：未測試所有分支或邊界情況

**解決方案**：

1. 檢視覆蓋率報告中的未覆蓋行
2. 補充相應的測試案例
3. 特別注意 if-else 分支和邊界條件

```bash
# 開啟詳細覆蓋率報告
open coverage/index.html
```

---

### Q5：測試執行時間過長

**原因**：測試案例過多或存在效能問題

**解決方案**：

```bash
# 只執行特定檔案
npm run test -- src/utils/timeFormat.test.js

# 使用 watch 模式只執行變更相關測試
npm run test:watch
```

---

## Sprint 2 完成標準

Sprint 2 完成時，應達成以下標準：

| 標準 | 驗證方式 |
|------|----------|
| 四個測試檔案已建立 | 檢視 src/utils/*.test.js |
| 所有測試通過 | `npm run test -- src/utils/` |
| utils/ 覆蓋率 >= 70% | `npm run test:coverage` |
| 專案整體覆蓋率 >= 10% | 覆蓋率報告 |
| CI 測試通過 | GitHub Actions |

### 測試案例數量

| 檔案 | 預期測試案例數 |
|------|----------------|
| formatPoints.test.js | 9+ 個 |
| timeFormat.test.js | 15+ 個 |
| sortFunctions.test.js | 20+ 個 |
| filterFunctions.test.js | 25+ 個 |
| **總計** | **69+ 個** |

### 預期覆蓋率

| 模組 | 行覆蓋率 | 函數覆蓋率 | 分支覆蓋率 |
|------|----------|------------|------------|
| formatPoints.js | 100% | 100% | 100% |
| timeFormat.js | 90%+ | 100% | 85%+ |
| sortFunctions.js | 80%+ | 100% | 75%+ |
| filterFunctions.js | 80%+ | 100% | 75%+ |

---

## 下一步

Sprint 2 完成後，請繼續：

- **Sprint 3：狀態管理測試**（文檔待建立：`ci-cd-plan-2-3.md`）
  - 為 `stores/` 目錄撰寫測試
  - 優先測試 auth.js、points.js
  - 目標：stores/ 覆蓋率達 50%+
  - 啟用覆蓋率門檻（20%）

---

## 附錄：測試檔案結構

完成 Sprint 2 後，測試檔案結構如下：

```
src/
├── test/
│   ├── setup.js        # 測試設置（Sprint 1）
│   └── helpers.js      # 測試輔助函數（Sprint 1）
└── utils/
    ├── formatPoints.js
    ├── formatPoints.test.js     ✅ Sprint 1
    ├── timeFormat.js
    ├── timeFormat.test.js       ✅ Sprint 2
    ├── sortFunctions.js
    ├── sortFunctions.test.js    ✅ Sprint 2
    ├── filterFunctions.js
    ├── filterFunctions.test.js  ✅ Sprint 2
    ├── googleMapsLoader.js      (暫不測試)
    └── openStreetMapLoader.js   (暫不測試)
```

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月  
> **參考**：[ci-cd-plan-2.md](./ci-cd-plan-2.md) | [ci-cd-plan-2-1.md](./ci-cd-plan-2-1.md)
