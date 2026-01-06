# 階段二 Sprint 2：核心工具函數測試 - 實作指引

> **Sprint**：Sprint 2 - 核心工具函數測試  
> **預估時間**：1 週（約 6-8 小時實作時間）  
> **前置需求**：Sprint 1 已完成（測試基礎建設）  
> **文檔版本**：1.0.0

---

## 目錄

- [概述](#概述)
- [實作步驟](#實作步驟)
  - [Step 1：分析工具函數](#step-1分析工具函數)
  - [Step 2：撰寫 formatPoints 測試](#step-2撰寫-formatpoints-測試)
  - [Step 3：撰寫 sortFunctions 測試](#step-3撰寫-sortfunctions-測試)
  - [Step 4：撰寫 timeFormat 測試](#step-4撰寫-timeformat-測試)
  - [Step 5：撰寫 filterFunctions 測試](#step-5撰寫-filterfunctions-測試)
- [驗證清單](#驗證清單)
- [Sprint 2 完成標準](#sprint-2-完成標準)
- [進度追蹤](#進度追蹤)
- [下一步](#下一步)

---

## 概述

Sprint 2 的目標是為 `utils/` 目錄下的核心工具函數撰寫全面的單元測試。這些函數是純函數，沒有副作用，是最適合開始撰寫測試的對象。

### Sprint 2 原則

- ✅ **優先測試純函數**：utils/ 目錄下的函數通常是純函數，易於測試
- ✅ **覆蓋正常情況與邊界情況**：測試應涵蓋各種輸入類型
- ✅ **遵循 AAA 模式**：Arrange（準備）、Act（執行）、Assert（斷言）
- ✅ **測試命名要描述性**：使用中文描述測試目的

### 工作項目總覽

| 任務 | 說明 | 預估測試案例 | 狀態 |
|------|------|--------------|------|
| formatPoints.js | 點數格式化函數 | 9 個 | ✅ 已完成 |
| sortFunctions.js | 排序工具函數集 | 36 個 | ✅ 已完成 |
| timeFormat.js | 時間格式化函數 | 8-12 個 | ⏳ 待開始 |
| filterFunctions.js | 篩選工具函數 | 5-10 個 | ⏳ 待開始 |

---

## 實作步驟

### Step 1：分析工具函數

在撰寫測試前，先分析 `src/utils/` 目錄下的函數：

```bash
ls src/utils/
```

目前需要測試的工具函數：

| 檔案 | 導出函數 | 優先級 |
|------|----------|--------|
| `formatPoints.js` | `formatPoints` | 🔴 高 |
| `sortFunctions.js` | `sortByDate`, `sortByNumber`, `sortByDistance`, `sortByFavoritedTime`, `sortByPopularity`, `sortByRecommendation` | 🔴 高 |
| `timeFormat.js` | `formatRelativeTime` | 🟡 中 |
| `filterFunctions.js` | 依實際內容而定 | 🟡 中 |

---

### Step 2：撰寫 formatPoints 測試

> **狀態**：✅ 已於 Sprint 1 完成

`src/utils/formatPoints.test.js` 已在 Sprint 1 建立，包含 9 個測試案例：

- 正常數值測試（4 個）
- 邊界情況測試（5 個）

---

### Step 3：撰寫 sortFunctions 測試

> **狀態**：✅ 已完成

#### 實作日期：2026-01-06

#### 測試檔案

`src/utils/sortFunctions.test.js`

#### 測試函數清單

| 函數 | 測試案例數 | 說明 |
|------|-----------|------|
| `sortByDate` | 5 | 日期排序（ISO 格式、Date 物件、相同日期、含時間） |
| `sortByNumber` | 10 | 數字排序（整數、浮點數、字串數字、邊界情況） |
| `sortByDistance` | 6 | 距離排序（distance_km 欄位） |
| `sortByFavoritedTime` | 5 | 收藏時間排序（含 fallback 到 created_at） |
| `sortByPopularity` | 5 | 熱門度排序（favorites_count） |
| `sortByRecommendation` | 5 | 綜合推薦排序（多因素計算） |

#### 測試涵蓋範圍

**sortByDate**
- ✅ ISO 格式日期字串排序
- ✅ Date 物件排序
- ✅ 相同日期返回 0
- ✅ 包含時間的日期排序
- ✅ Array.sort 應用測試

**sortByNumber**
- ✅ 整數排序
- ✅ 浮點數排序
- ✅ 相同數字返回 0
- ✅ 負數排序
- ✅ 數字字串處理
- ✅ 混合類型處理
- ✅ 非數字字串視為 0
- ✅ null 值處理
- ✅ undefined 值處理
- ✅ Array.sort 應用測試

**sortByDistance**
- ✅ distance_km 欄位排序
- ✅ 相同距離返回 0
- ✅ 缺少 distance_km 視為 0
- ✅ 字串距離處理
- ✅ 無效值處理
- ✅ 物件陣列排序

**sortByFavoritedTime**
- ✅ favorited_at 排序
- ✅ 相同 favorited_at 返回 0
- ✅ fallback 到 created_at
- ✅ 混合 favorited_at 和 created_at
- ✅ 物件陣列排序

**sortByPopularity**
- ✅ favorites_count 排序
- ✅ 相同 favorites_count 返回 0
- ✅ 缺少 favorites_count 視為 0
- ✅ 兩個都缺少時返回 0
- ✅ 物件陣列排序

**sortByRecommendation**
- ✅ 距離因素測試
- ✅ 收藏數因素測試
- ✅ 缺少 distance_km 處理
- ✅ 缺少 favorites_count 處理
- ✅ 綜合排序驗證

#### 覆蓋率報告

```
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------------|---------|----------|---------|---------|-------------------
sortFunctions.js  |     100 |    87.5  |     100 |     100 | 34,76-77          
------------------|---------|----------|---------|---------|-------------------
```

---

### Step 4：撰寫 timeFormat 測試

> **狀態**：⏳ 待開始

#### 建議測試案例

```javascript
// src/utils/timeFormat.test.js
describe('formatRelativeTime', () => {
  describe('無效輸入', () => {
    it('應處理 null 值')
    it('應處理 undefined')
    it('應處理空字串')
  })

  describe('時間格式化', () => {
    it('應顯示「剛剛」於 1 分鐘內')
    it('應顯示分鐘數')
    it('應顯示小時數')
    it('應顯示天數')
    it('應顯示月份數')
    it('應顯示年數')
  })

  describe('未來時間', () => {
    it('應處理未來時間')
  })
})
```

---

### Step 5：撰寫 filterFunctions 測試

> **狀態**：⏳ 待開始

根據 `filterFunctions.js` 的實際內容撰寫測試。

---

## 驗證清單

完成所有步驟後，請逐項驗證：

### ✅ 測試檔案驗證

確認以下測試檔案已建立：

- [x] `src/utils/formatPoints.test.js` - 9 個測試
- [x] `src/utils/sortFunctions.test.js` - 36 個測試
- [ ] `src/utils/timeFormat.test.js` - 待建立
- [ ] `src/utils/filterFunctions.test.js` - 待建立

### ✅ 測試執行驗證

```bash
# 執行所有測試
npm run test

# 預期輸出：
# ✓ src/utils/formatPoints.test.js (9)
# ✓ src/utils/sortFunctions.test.js (36)
# Test Files  2 passed (2)
# Tests  45 passed (45)
```

### ✅ 覆蓋率驗證

```bash
# 執行覆蓋率報告
npm run test:coverage

# 預期：utils/ 目錄覆蓋率提升
```

---

## Sprint 2 完成標準

Sprint 2 完成時，應達成以下標準：

| 標準 | 驗證方式 | 狀態 |
|------|----------|------|
| formatPoints.js 測試完成 | 9 個測試通過 | ✅ |
| sortFunctions.js 測試完成 | 36 個測試通過 | ✅ |
| timeFormat.js 測試完成 | 8-12 個測試通過 | ⏳ |
| filterFunctions.js 測試完成 | 5-10 個測試通過 | ⏳ |
| utils/ 覆蓋率達 70%+ | `npm run test:coverage` | 🔄 進行中 |

### 目前覆蓋率

| 檔案 | Statements | Branch | Functions | Lines |
|------|------------|--------|-----------|-------|
| formatPoints.js | 100% | 100% | 100% | 100% |
| sortFunctions.js | 100% | 87.5% | 100% | 100% |
| **總計** | 100% | 88.46% | 100% | 100% |

---

## 進度追蹤

### 2026-01-06

- ✅ 完成 `sortFunctions.test.js`
  - 建立 36 個測試案例
  - 覆蓋所有 6 個排序函數
  - 覆蓋率：100% statements, 87.5% branch, 100% functions, 100% lines
  - 程式碼審查通過
  - 安全掃描通過

---

## 下一步

Sprint 2 完成後，請繼續：

- **Step 4：撰寫 timeFormat 測試**
- **Step 5：撰寫 filterFunctions 測試**
- **Sprint 3：狀態管理測試**（文檔待建立：`ci-cd-plan-2-3.md`）
  - 為 `stores/` 目錄撰寫測試
  - 目標：stores/ 覆蓋率達 50%+

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月 6 日  
> **參考**：[ci-cd-plan-2.md](./ci-cd-plan-2.md) | [ci-cd-plan-2-1.md](./ci-cd-plan-2-1.md)
