# 階段二 Sprint 2：核心工具函數測試 - 實作指引

> **Sprint**：Sprint 2 - 核心工具函數測試  
> **預估時間**：1 週（約 6-8 小時實作時間）  
> **前置需求**：Sprint 1 已完成（測試基礎建設）  
> **文檔版本**：1.0.0

---

## 目錄

- [概述](#概述)
- [實作步驟](#實作步驟)
  - [Step 1：撰寫 formatPoints 測試](#step-1撰寫-formatpoints-測試)
  - [Step 2：撰寫 timeFormat 測試](#step-2撰寫-timeformat-測試)
  - [Step 3：撰寫 sortFunctions 測試](#step-3撰寫-sortfunctions-測試)
  - [Step 4：撰寫 filterFunctions 測試](#step-4撰寫-filterfunctions-測試)
- [進度追蹤](#進度追蹤)
- [驗證清單](#驗證清單)
- [Sprint 2 完成標準](#sprint-2-完成標準)
- [下一步](#下一步)

---

## 概述

Sprint 2 的目標是為 `utils/` 目錄下的核心工具函數撰寫完整的單元測試。這些純函數是最適合開始測試的對象，因為它們沒有副作用，輸入輸出關係明確。

### Sprint 2 原則

- ✅ **優先測試核心函數**：選擇最常使用的工具函數優先測試
- ✅ **覆蓋邊界情況**：每個函數都需測試正常情況與邊界情況
- ✅ **達成 70% 覆蓋率**：utils/ 目錄覆蓋率目標為 70%+
- ✅ **遵循測試命名規範**：使用描述性的中文測試名稱

### 工作項目總覽

| 任務 | 說明 | 預估時間 | 狀態 |
|------|------|----------|------|
| formatPoints.js 測試 | 格式化點數函數 | 1 小時 | ✅ 已完成 |
| timeFormat.js 測試 | 時間格式化函數 | 1.5 小時 | 🔲 待實作 |
| sortFunctions.js 測試 | 排序函數 | 1.5 小時 | 🔲 待實作 |
| filterFunctions.js 測試 | 篩選函數 | 2 小時 | ✅ 已完成 |

---

## 實作步驟

### Step 1：撰寫 formatPoints 測試

> **狀態**：✅ 已完成（Sprint 1 時完成）

已於 Sprint 1 完成，作為第一個測試範例。

**測試檔案**：`src/utils/formatPoints.test.js`

**測試案例數**：9 個

---

### Step 2：撰寫 timeFormat 測試

> **狀態**：🔲 待實作

為 `timeFormat.js` 撰寫測試，涵蓋相對時間格式化功能。

**測試檔案**：`src/utils/timeFormat.test.js`

**預估測試案例**：8-12 個

---

### Step 3：撰寫 sortFunctions 測試

> **狀態**：🔲 待實作

為 `sortFunctions.js` 撰寫測試，涵蓋各種排序功能。

**測試檔案**：`src/utils/sortFunctions.test.js`

**預估測試案例**：5-10 個

---

### Step 4：撰寫 filterFunctions 測試

> **狀態**：✅ 已完成

已為 `filterFunctions.js` 撰寫完整的單元測試，涵蓋所有 8 個導出函數。

**測試檔案**：`src/utils/filterFunctions.test.js`

**測試案例數**：54 個

#### 測試覆蓋率

| 指標 | 覆蓋率 |
|------|--------|
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

#### 測試函數清單

| 函數 | 測試案例數 | 說明 |
|------|------------|------|
| `filterByPopularity` | 8 | 按收藏數篩選，支援預設/自訂門檻 |
| `filterByDistance` | 9 | 按距離篩選，處理字串解析與邊界值 |
| `filterByRecentlyCreated` | 6 | 按上架時間篩選，使用 fake timers |
| `filterByPriceRange` | 8 | 按價格範圍篩選，支援開區間 |
| `filterByDiscount` | 4 | 篩選有折扣的商品 |
| `filterByStatus` | 5 | 按狀態精確匹配篩選 |
| `combineFilters` | 4 | AND 邏輯組合多個篩選條件 |
| `combineFiltersOr` | 4 | OR 邏輯組合多個篩選條件 |
| 整合測試 | 7 | 驗證與 Array.filter() 的整合使用 |

#### 測試案例詳情

**filterByPopularity 測試（8 個）**

```javascript
describe('filterByPopularity', () => {
  describe('使用預設門檻 (50)', () => {
    it('應篩選出收藏數達到門檻的商品')
    it('應過濾掉收藏數未達門檻的商品')
  })
  describe('使用自訂門檻', () => {
    it('應使用自訂門檻 100 進行篩選')
    it('應使用較低門檻 10 進行篩選')
  })
  describe('邊界情況', () => {
    it('應處理缺少 favorites_count 欄位的情況，視為 0')
    it('應處理 favorites_count 為 null 的情況，視為 0')
    it('應處理 favorites_count 為 undefined 的情況，視為 0')
    it('應處理門檻為 0 的情況')
  })
})
```

**filterByDistance 測試（9 個）**

```javascript
describe('filterByDistance', () => {
  describe('使用預設最大距離 (5 公里)', () => {
    it('應篩選出距離在範圍內的商品')
    it('應過濾掉距離超出範圍的商品')
  })
  describe('使用自訂最大距離', () => {
    it('應使用自訂最大距離 10 公里進行篩選')
    it('應使用較短距離 2 公里進行篩選')
  })
  describe('邊界情況', () => {
    it('應處理缺少 distance_km 欄位的情況，視為 999')
    it('應處理 distance_km 為字串的情況')
    it('應處理距離為 0 的情況（0 為 falsy 會被當作 999）')
    it('應正確處理距離為正數的邊界值')
  })
})
```

**filterByRecentlyCreated 測試（6 個）**

```javascript
describe('filterByRecentlyCreated', () => {
  // 使用 vi.useFakeTimers() 固定時間
  describe('使用預設天數 (7 天)', () => {
    it('應篩選出 7 天內上架的商品')
    it('應過濾掉超過 7 天的商品')
  })
  describe('使用自訂天數', () => {
    it('應使用自訂天數 3 天進行篩選')
    it('應使用較長天數 30 天進行篩選')
  })
  describe('邊界情況', () => {
    it('應處理今天上架的商品')
    it('應處理 ISO 日期格式')
  })
})
```

**combineFilters 測試（4 個）**

```javascript
describe('combineFilters (AND 邏輯)', () => {
  describe('正常情況', () => {
    it('應組合兩個篩選條件，所有條件都需滿足')
    it('應組合三個以上的篩選條件')
  })
  describe('邊界情況', () => {
    it('應處理只有一個篩選條件的情況')
    it('應處理沒有篩選條件的情況（空參數）')
  })
})
```

**整合測試（7 個）**

```javascript
describe('整合測試', () => {
  // 使用 mockItems 陣列模擬真實資料
  it('應正確使用 filter 方法與 filterByPopularity')
  it('應正確使用 filter 方法與 filterByDistance')
  it('應正確使用 filter 方法與 filterByStatus')
  it('應正確使用 filter 方法與 combineFilters')
  it('應正確使用 filter 方法與 combineFiltersOr')
  it('應正確使用 filter 方法與 filterByRecentlyCreated')
  it('應正確使用複雜的組合條件')
})
```

#### 執行測試

```bash
# 執行 filterFunctions 測試
npm run test -- src/utils/filterFunctions.test.js

# 預期輸出：
# ✓ src/utils/filterFunctions.test.js (54 tests) 21ms
# Test Files  1 passed (1)
# Tests  54 passed (54)
```

---

## 進度追蹤

### Sprint 2 進度

| 步驟 | 任務 | 測試數 | 覆蓋率 | 狀態 | 完成日期 |
|------|------|--------|--------|------|----------|
| Step 1 | formatPoints.js | 9 | 100% | ✅ | 2026-01-06 |
| Step 2 | timeFormat.js | - | - | 🔲 | - |
| Step 3 | sortFunctions.js | - | - | 🔲 | - |
| Step 4 | filterFunctions.js | 54 | 100% | ✅ | 2026-01-06 |

### 目前覆蓋率統計

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
filterFunctions.js |     100 |      100 |     100 |     100 |
formatPoints.js    |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|
```

---

## 驗證清單

完成 Step 4 後，請驗證以下項目：

### ✅ 檔案驗證

- [x] `src/utils/filterFunctions.test.js` - 已建立
- [x] 測試檔案符合命名規範（`.test.js` 後綴）
- [x] 測試檔案與源檔案在同一目錄

### ✅ 測試執行驗證

```bash
# 執行所有測試
npm run test

# 預期：所有測試通過
# ✓ src/utils/filterFunctions.test.js (54)
# ✓ src/utils/formatPoints.test.js (9)
```

### ✅ 覆蓋率驗證

```bash
# 執行覆蓋率
npm run test:coverage

# 預期：filterFunctions.js 達 100% 覆蓋率
```

---

## Sprint 2 完成標準

| 標準 | 目標 | 目前狀態 |
|------|------|----------|
| formatPoints.js 測試通過 | ✅ | ✅ 9 個測試通過 |
| filterFunctions.js 測試通過 | ✅ | ✅ 54 個測試通過 |
| timeFormat.js 測試通過 | ✅ | 🔲 待實作 |
| sortFunctions.js 測試通過 | ✅ | 🔲 待實作 |
| utils/ 覆蓋率達 70%+ | 70% | 🔄 進行中 |

---

## 下一步

Sprint 2 完成後，請繼續：

- **Sprint 3：狀態管理測試**（文檔待建立：`ci-cd-plan-2-3.md`）
  - 為 `stores/` 目錄撰寫測試
  - 優先測試：auth.js、points.js
  - 目標：stores/ 覆蓋率達 50%+

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月 6 日  
> **參考**：[ci-cd-plan-2.md](./ci-cd-plan-2.md) | [ci-cd-plan-2-1.md](./ci-cd-plan-2-1.md)
