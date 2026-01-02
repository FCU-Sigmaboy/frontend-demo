# 軟體測試專題報告 - 測試規劃與設計

## 一、專題描述

### 1.1 專題題目
**FCU Sigmaboy 物品交換平台 - 前端應用程式**

### 1.2 功能概述

本專案是一個基於 Vue.js 3 開發的物品交換平台前端應用，主要功能包括：

| # | 功能模組 | 說明 |
|---|---------|------|
| 1 | **用戶認證系統** | 使用者登入、登出、個人資料管理 |
| 2 | **物品刊登管理** | 物品建立、編輯、刪除、搜尋 |
| 3 | **交易管理系統** | 發起交易、確認交易、取消交易、交易狀態追蹤 |
| 4 | **即時訊息系統** | 對話管理、即時訊息傳送、訊息通知 |
| 5 | **點數與獎勵系統** | 每日簽到、等級系統、徽章獎勵 |
| 6 | **評價系統** | 交易評價、評分、評論 |
| 7 | **地圖搜尋功能** | 地圖定位、附近物品搜尋 |
| 8 | **追蹤與收藏** | 追蹤用戶、收藏物品 |

## 二、測試規劃

### 2.1 測試策略

本專案採用**單元測試**為主要測試策略，搭配整合測試確保各模組間的協作正確性。

```
┌─────────────────────────────────────────┐
│           測試金字塔架構                │
├─────────────────────────────────────────┤
│                                         │
│           ┌─────────────┐               │
│           │   E2E 測試  │  (未來規劃)   │
│           └─────────────┘               │
│        ┌───────────────────┐            │
│        │    整合測試       │            │
│        └───────────────────┘            │
│     ┌───────────────────────────┐       │
│     │        單元測試           │ ◄────── 主要測試層級
│     └───────────────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

### 2.2 測試框架與工具

| 工具 | 用途 | Java 對應工具 |
|------|------|--------------|
| **Vitest** | 單元測試框架 | JUnit |
| **@vue/test-utils** | Vue 組件測試 | - |
| **@vitest/coverage-v8** | 程式碼覆蓋率 | JaCoCo |
| **ESLint** | 程式碼審查 | PMD |
| **code-metrics.js** | 程式碼度量 | MetricsReloaded |

### 2.3 測試重點：src/api 層

**本專案以 `src/api` 為測試重點**，針對網站重要功能進行完整測試。API 層包含所有與後端 Supabase 服務互動的核心業務邏輯。

#### API 測試涵蓋的功能模組

| API 檔案 | 功能說明 | 覆蓋率 |
|----------|----------|--------|
| `pointsAPI.js` | 點數系統 API | 78.82% |
| `transactionsAPI.js` | 交易管理 API | 100% |
| `transaction_before_meetAPI.js` | 交易前置流程 | 95% |
| `transaction_meetAPI.js` | 交易碰面確認 | 100% |
| `create_review.js` | 評價系統 | 82.85% |
| `create_myItemAPI.js` | 物品刊登 | 100% |
| `get_searchItemsAPI.js` | 物品搜尋 | 100% |
| `get_ItemDetailAPI.js` | 物品詳情 | 94.82% |
| `conversation.js` | 即時訊息 | 71.42% |
| `followAPI.js` | 追蹤功能 | 92.5% |
| `favorite.js` | 收藏功能 | 100% |
| `badgesAPI.js` | 徽章系統 | 100% |
| `image.js` | 圖片處理 | 100% |
| `location.js` | 地點服務 | 91.89% |

### 2.4 覆蓋率目標

| 測試層級 | 覆蓋率目標 | 實際達成 | 說明 |
|----------|-----------|---------|------|
| **API 層** | ≥ 90% | 85.57% (Branch) | 核心業務邏輯 - **測試重點** |
| Store (狀態管理) | ≥ 85% | 進行中 | 應用程式狀態 |
| Composables | ≥ 85% | 進行中 | 可重用邏輯 |
| 工具函數 | 100% | 100% ✅ | 純函數，易測試 |
| Vue 組件 | ≥ 80% | 進行中 | UI 組件 |

## 三、測試設計

### 3.1 測試設計方法

#### 3.1.1 等價類別劃分 (Equivalence Partitioning)

**範例：評分驗證測試**

```javascript
// 有效等價類別
describe('評分有效範圍測試', () => {
  it('應該接受評分 1', () => { /* ... */ })
  it('應該接受評分 3', () => { /* ... */ })
  it('應該接受評分 5', () => { /* ... */ })
})

// 無效等價類別
describe('評分無效範圍測試', () => {
  it('應該拒絕評分 0', () => { /* ... */ })
  it('應該拒絕評分 6', () => { /* ... */ })
  it('應該拒絕評分 -1', () => { /* ... */ })
})
```

#### 3.1.2 邊界值分析 (Boundary Value Analysis)

**範例：點數計算邊界測試**

| 邊界 | 測試值 | 預期結果 |
|------|--------|----------|
| 最小評分 | 1 | 接受 |
| 最小評分-1 | 0 | 拒絕 |
| 最大評分 | 5 | 接受 |
| 最大評分+1 | 6 | 拒絕 |

```javascript
describe('邊界值測試', () => {
  // 最小邊界
  it('評分 1 應該被接受 (最小有效值)', () => {
    expect(validateRating(1)).toBe(true)
  })
  
  it('評分 0 應該被拒絕 (低於最小值)', () => {
    expect(validateRating(0)).toBe(false)
  })
  
  // 最大邊界
  it('評分 5 應該被接受 (最大有效值)', () => {
    expect(validateRating(5)).toBe(true)
  })
  
  it('評分 6 應該被拒絕 (超過最大值)', () => {
    expect(validateRating(6)).toBe(false)
  })
})
```

#### 3.1.3 狀態轉換測試 (State Transition Testing)

**交易狀態流程圖：**

```
┌─────────┐    發起    ┌──────────┐   確認    ┌──────────┐
│ pending │ ─────────► │confirming│ ────────► │ completed│
└─────────┘            └──────────┘           └──────────┘
     │                      │                       
     │ 取消                 │ 取消                  
     ▼                      ▼                       
┌─────────┐            ┌──────────┐                 
│cancelled│            │cancelled │                 
└─────────┘            └──────────┘                 
```

```javascript
describe('交易狀態轉換測試', () => {
  it('pending 狀態可以轉換為 confirming', () => { /* ... */ })
  it('confirming 狀態可以轉換為 completed', () => { /* ... */ })
  it('pending 狀態可以轉換為 cancelled', () => { /* ... */ })
  it('completed 狀態不能轉換為 cancelled', () => { /* ... */ })
})
```

#### 3.1.4 錯誤處理測試

```javascript
describe('錯誤處理測試', () => {
  it('應該處理網路錯誤', async () => {
    vi.mocked(supabase.rpc).mockRejectedValue(new Error('Network error'))
    
    const result = await apiFunction()
    
    expect(result.error).toBeDefined()
    expect(result.error.message).toContain('Network error')
  })
  
  it('應該處理未授權錯誤', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null }
    })
    
    const result = await apiFunction()
    
    expect(result.error.code).toBe('UNAUTHORIZED')
  })
})
```

### 3.2 測試案例分類

| 類別 | 測試數量 | 說明 |
|------|----------|------|
| API 測試 | ~200 | API 函數的單元測試 |
| Store 測試 | ~100 | 狀態管理測試 |
| 組件測試 | ~150 | Vue 組件渲染和互動測試 |
| 工具函數測試 | ~100 | 純函數測試 |
| Composables 測試 | ~80 | 可重用邏輯測試 |
| 整合測試 | ~50 | 模組間協作測試 |

## 四、測試重點說明

### 4.1 核心業務邏輯測試

#### 4.1.1 交易 API 測試

**測試檔案**: `tests/unit/api/transaction_before_meetAPI.test.js`

| 測試案例 | 測試方法 | 說明 |
|----------|----------|------|
| 發起交易成功 | 正向測試 | 驗證正常流程 |
| 發起交易失敗 - 缺少參數 | 邊界值測試 | 驗證必填欄位 |
| 更新備註 - 特殊字元 | 錯誤注入 | XSS 防護測試 |
| 取消交易 - 權限檢查 | 安全測試 | 驗證用戶權限 |

#### 4.1.2 點數系統測試

**測試檔案**: `tests/unit/api/pointsAPI.test.js`

```javascript
describe('點數系統測試', () => {
  describe('每日簽到', () => {
    it('首次簽到應該獲得基礎點數')
    it('連續簽到應該獲得加成獎勵')
    it('中斷連續簽到應該重置加成')
  })
  
  describe('等級計算', () => {
    it('0-999 點應該是 Bronze 等級')
    it('1000-4999 點應該是 Silver 等級')
    it('5000-9999 點應該是 Gold 等級')
    it('10000+ 點應該是 Platinum 等級')
  })
})
```

### 4.2 組件測試重點

#### 4.2.1 Dashboard 組件

| 組件 | 測試重點 |
|------|----------|
| PointsBalanceCard | 點數顯示、格式化、載入狀態 |
| LevelProgressCard | 進度條計算、等級顯示 |
| DailyStreakCard | 連續天數、簽到按鈕狀態 |
| BadgesCard | 徽章列表、進度顯示 |

#### 4.2.2 交易組件

| 組件 | 測試重點 |
|------|----------|
| ConfirmTransactionModal | 確認流程、備註輸入 |
| CancelTransactionModal | 取消原因、確認對話框 |

### 4.3 工具函數測試

**100% 覆蓋率目標**

| 函數 | 測試案例數 | 覆蓋率 |
|------|-----------|--------|
| formatPoints.js | 15 | 100% |
| timeFormat.js | 20 | 100% |
| filterFunctions.js | 12 | 100% |
| sortFunctions.js | 18 | 100% |

## 五、Mock 策略

### 5.1 Supabase Mock

```javascript
// 統一的 Supabase mock 設置
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))
```

### 5.2 Vue Router Mock

```javascript
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {}
  })
}))
```

## 六、Bug 修復記錄

| # | Bug 描述 | 發現方法 | 修復狀態 |
|---|----------|----------|----------|
| 1 | 點數格式化負數顯示錯誤 | 邊界值測試 | ✅ 已修復 |
| 2 | 交易狀態更新競爭條件 | 並發測試 | ✅ 已修復 |
| 3 | 評分驗證範圍錯誤 | 等價類別測試 | ✅ 已修復 |
| 4 | 時間格式化時區問題 | 國際化測試 | ✅ 已修復 |
| 5 | 空字串備註處理異常 | 邊界值測試 | ✅ 已修復 |
| 6 | 未登入用戶權限檢查缺失 | 安全測試 | ✅ 已修復 |
| 7 | 交易取消重複呼叫問題 | 整合測試 | ✅ 已修復 |
| 8 | 點數計算浮點數精度 | 數值測試 | ✅ 已修復 |
| 9 | 組件 props 類型驗證 | 類型測試 | ✅ 已修復 |
| 10 | API 錯誤訊息未正確傳遞 | 錯誤處理測試 | ✅ 已修復 |
| 11 | 訊息已讀狀態同步延遲 | 即時測試 | ✅ 已修復 |
| 12 | 搜尋結果分頁錯誤 | 邊界測試 | ✅ 已修復 |

## 七、執行測試指令

```bash
# 執行所有測試
npm run test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 產生 HTML 覆蓋率報告
npm run test:coverage:html

# 執行 ESLint 程式碼審查
npm run lint

# 產生 ESLint 報告
npm run lint:report

# 產生程式碼度量報告
npm run metrics

# 產生所有報告
npm run report:all
```

## 八、報告產生

### 8.1 覆蓋率報告 (類似 JaCoCo)

- **HTML 報告**: `coverage/index.html`
- **JSON 報告**: `coverage/coverage-final.json`
- **LCOV 報告**: `coverage/lcov.info`
- **Cobertura 報告**: `coverage/cobertura-coverage.xml`

### 8.2 程式碼審查報告 (類似 PMD)

- **HTML 報告**: `reports/eslint-report.html`
- **JSON 報告**: `reports/eslint-report.json`

### 8.3 程式碼度量報告 (類似 MetricsReloaded)

- **HTML 報告**: `reports/code-metrics.html`
- **JSON 報告**: `reports/code-metrics.json`

## 九、系統要求驗證

| 要求 | 目標值 | 實際值 | 狀態 |
|------|--------|--------|------|
| 有意義的功能 | > 5 個 | 8 個 | ✅ 達標 |
| WMC (v(G) 總和) | > 200 | 2633 | ✅ 達標 |
| 單元測試數量 | ≥ 50 | 760 | ✅ 達標 |
| Branch Coverage | ≥ 90% | 進行中 | 🔄 |
| Bug & fix | ≥ 10 | 12 | ✅ 達標 |

---

*此文件由 FCU Sigmaboy 團隊編寫*
*最後更新：2026-01-01*
