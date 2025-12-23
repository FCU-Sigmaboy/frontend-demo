# 單元測試規範化設計文件

## 概述

本設計文件詳細說明如何為 Vue.js 項目建立標準化的單元測試框架和測試覆蓋率報告系統。該系統將使用 Vitest 作為主要測試框架，Vue Test Utils 進行組件測試，並整合 GitHub Actions 進行自動化測試執行。

## 架構

### 測試框架架構

```
測試系統架構
├── 測試框架層 (Vitest)
│   ├── 測試執行引擎
│   ├── 覆蓋率收集器 (c8)
│   └── 報告生成器
├── Vue 測試層 (Vue Test Utils)
│   ├── 組件掛載工具
│   ├── DOM 查詢工具
│   └── 事件模擬工具
├── 模擬層 (Vitest Mocks)
│   ├── API 模擬
│   ├── 模組模擬
│   └── 時間模擬
└── CI/CD 層 (GitHub Actions)
    ├── 測試執行
    ├── 覆蓋率報告
    └── 結果通知
```

### 測試目錄結構

```
tests/
├── unit/                    # 單元測試
│   ├── components/          # Vue 組件測試
│   │   ├── dashboard/       # 儀表板組件測試
│   │   ├── map/            # 地圖組件測試
│   │   ├── messages/       # 訊息組件測試
│   │   └── transaction/    # 交易組件測試
│   ├── composables/        # Composables 測試
│   ├── stores/             # Pinia Store 測試
│   ├── utils/              # 工具函數測試
│   └── api/                # API 層測試
├── __mocks__/              # 模擬檔案
│   ├── api/                # API 模擬
│   ├── supabase.js         # Supabase 模擬
│   └── vue-router.js       # Vue Router 模擬
├── fixtures/               # 測試資料
├── helpers/                # 測試輔助函數
└── setup/                  # 測試環境設定
    ├── vitest.config.js    # Vitest 配置
    ├── test-setup.js       # 全域測試設定
    └── dom-setup.js        # DOM 環境設定
```

## 組件和介面

### 核心測試組件

#### 1. 測試框架配置 (Vitest Configuration)
- **職責**: 定義測試環境、覆蓋率設定、模擬配置
- **介面**: 
  - `vitest.config.js` - 主要配置檔案
  - `test-setup.js` - 全域測試設定
  - `dom-setup.js` - DOM 環境初始化

#### 2. Vue 組件測試工具 (Vue Testing Utilities)
- **職責**: 提供 Vue 組件測試的標準化方法
- **介面**:
  - `mountComponent(component, options)` - 組件掛載
  - `createTestingPinia()` - Pinia 測試實例
  - `mockRouter()` - Vue Router 模擬

#### 3. API 模擬系統 (API Mocking System)
- **職責**: 模擬外部 API 呼叫和 Supabase 操作
- **介面**:
  - `mockSupabaseClient()` - Supabase 客戶端模擬
  - `mockAPIResponse(endpoint, response)` - API 回應模擬
  - `createMockUser(userData)` - 使用者資料模擬

#### 4. 測試資料工廠 (Test Data Factory)
- **職責**: 生成一致的測試資料
- **介面**:
  - `createMockPointsProfile()` - 積分資料模擬
  - `createMockTransaction()` - 交易資料模擬
  - `createMockBadge()` - 徽章資料模擬

## 資料模型

### 測試配置模型

```javascript
// Vitest 配置模型
interface VitestConfig {
  test: {
    environment: 'jsdom' | 'node'
    setupFiles: string[]
    coverage: CoverageConfig
    globals: boolean
    mockReset: boolean
  }
}

// 覆蓋率配置模型
interface CoverageConfig {
  provider: 'c8'
  reporter: string[]
  reportsDirectory: string
  exclude: string[]
  thresholds: {
    global: ThresholdConfig
    perFile: ThresholdConfig
  }
}

// 閾值配置模型
interface ThresholdConfig {
  lines: number
  functions: number
  branches: number
  statements: number
}
```

### 測試資料模型

```javascript
// 模擬使用者資料模型
interface MockUser {
  id: string
  email: string
  nickname: string
  profile_picture_url?: string
}

// 模擬積分資料模型
interface MockPointsProfile {
  current_balance: number
  total_earned: number
  total_spent: number
  daily_streak: number
  last_signin_date: string
}

// 模擬交易資料模型
interface MockTransaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
  balance_after: number
}
```

## 正確性屬性

*屬性是一個特徵或行為，應該在系統的所有有效執行中保持為真——本質上是關於系統應該做什麼的正式陳述。屬性作為人類可讀規範和機器可驗證正確性保證之間的橋樑。*

**屬性 1: 測試檔案命名一致性**
*對於任何* 新創建的測試檔案，檔案名稱應該遵循 `.test.js` 或 `.spec.js` 的命名慣例
**驗證需求: 3.1**

**屬性 2: 測試目錄結構鏡像**
*對於任何* 源代碼檔案，如果存在對應的測試檔案，則測試檔案的目錄結構應該鏡像源代碼的目錄結構
**驗證需求: 3.2**

**屬性 3: 測試描述命名一致性**
*對於任何* 測試案例，測試描述應該遵循一致的命名模式（如：should + 動作 + 預期結果）
**驗證需求: 3.3**

**屬性 4: 測試邏輯分組**
*對於任何* 包含多個測試的測試檔案，相關的測試應該使用 describe 區塊按功能邏輯分組
**驗證需求: 3.4**

**屬性 5: 測試設定標準化**
*對於任何* 需要共用設定的測試，應該使用標準化的設定檔案和輔助函數，而不是重複的設定代碼
**驗證需求: 3.5**

**屬性 6: 工具函數測試覆蓋**
*對於任何* 公用工具函數，都應該存在對應的測試檔案來驗證其功能
**驗證需求: 6.3**

## 錯誤處理

### 測試執行錯誤處理

1. **測試失敗處理**
   - 提供清楚的錯誤訊息和堆疊追蹤
   - 區分不同類型的測試失敗（斷言失敗、運行時錯誤、超時等）
   - 在 CI 環境中正確設定退出代碼

2. **覆蓋率收集錯誤**
   - 處理無法收集覆蓋率的檔案
   - 提供覆蓋率收集失敗的警告
   - 確保覆蓋率錯誤不會阻止測試執行

3. **模擬錯誤處理**
   - 自動清理失敗的模擬設定
   - 提供模擬設定錯誤的詳細訊息
   - 防止模擬洩漏到其他測試

### Vue 組件測試錯誤處理

1. **組件掛載錯誤**
   - 處理組件掛載失敗的情況
   - 提供組件依賴缺失的錯誤訊息
   - 自動清理掛載失敗的組件實例

2. **Store 狀態錯誤**
   - 處理 Pinia store 初始化失敗
   - 提供狀態管理錯誤的詳細訊息
   - 確保測試間的狀態隔離

## 測試策略

### 雙重測試方法要求

本設計採用單元測試和屬性基礎測試的雙重方法：

**單元測試要求**：
- 單元測試驗證特定範例、邊界情況和錯誤條件
- 單元測試涵蓋組件間的整合點
- 單元測試有助於發現具體錯誤，但避免撰寫過多。屬性基礎測試負責處理大量輸入的覆蓋

**屬性基礎測試要求**：
- 使用 **fast-check** 作為 JavaScript 的屬性基礎測試庫，不得從頭實作屬性基礎測試
- 每個屬性基礎測試必須配置為至少執行 100 次迭代，因為屬性測試過程是隨機的
- 每個屬性基礎測試必須使用註解明確引用設計文件中的正確性屬性，格式為：'**Feature: unit-testing-standardization, Property {number}: {property_text}**'
- 每個正確性屬性必須由單一屬性基礎測試實作
- 在測試策略部分必須明確說明這些要求

### 核心功能測試優先級

根據需求 6，測試策略應優先覆蓋以下核心功能：

1. **API 層測試** (最高優先級)
   - `src/api/pointsAPI.js` - 積分系統 API
   - `src/api/profileAPI.js` - 用戶資料 API
   - `src/api/transactionAPI.js` - 交易 API
   - 目標覆蓋率：90%

2. **Store 狀態管理測試** (高優先級)
   - `src/stores/auth.js` - 認證狀態管理
   - `src/stores/points.js` - 積分狀態管理
   - `src/stores/transaction.js` - 交易狀態管理
   - 目標覆蓋率：85%

3. **核心 Composables 測試** (高優先級)
   - `src/composables/usePointsProfile.js` - 積分資料管理
   - `src/composables/useTransactionRealtime.js` - 即時交易
   - 目標覆蓋率：85%

4. **工具函數測試** (中優先級)
   - `src/utils/formatPoints.js` - 積分格式化
   - `src/utils/timeFormat.js` - 時間格式化
   - `src/utils/filterFunctions.js` - 過濾函數
   - 目標覆蓋率：100%

5. **關鍵業務邏輯組件測試** (中優先級)
   - `src/components/dashboard/PointsBalanceCard.vue` - 積分餘額卡片
   - `src/components/transaction/` - 交易相關組件
   - 目標覆蓋率：80%

### 測試框架配置

#### Vitest 配置
- **測試環境**: jsdom (用於 DOM 測試)
- **覆蓋率提供者**: c8
- **覆蓋率閾值**:
  - 全域：行覆蓋率 80%，函數覆蓋率 80%，分支覆蓋率 75%
  - 核心模組：行覆蓋率 85%，函數覆蓋率 85%，分支覆蓋率 80%
- **並行執行**: 啟用，最大工作進程數為 CPU 核心數

#### Vue Test Utils 配置
- **全域組件**: 自動註冊常用組件
- **全域插件**: 自動配置 Vue Router、Pinia
- **模擬配置**: 自動模擬 Supabase 客戶端

#### GitHub Actions 配置
- **觸發條件**: push 到 main 分支、所有 Pull Request
- **Node.js 版本**: 18.x, 20.x (矩陣測試)
- **快取策略**: npm 依賴快取、測試結果快取
- **並行策略**: 按測試類型分組並行執行
- **報告整合**: 覆蓋率報告上傳到 Codecov，測試結果顯示在 PR 中

### 測試資料管理

#### 測試夾具 (Fixtures)
- **使用者資料**: 標準化的測試使用者資料
- **積分資料**: 各種積分狀態的測試資料
- **交易資料**: 不同類型交易的測試資料
- **徽章資料**: 各種徽章和進度的測試資料

#### 模擬策略
- **API 模擬**: 使用 MSW (Mock Service Worker) 進行 HTTP 請求模擬
- **Supabase 模擬**: 完整的 Supabase 客戶端模擬
- **時間模擬**: 使用 Vitest 的時間模擬功能
- **隨機數模擬**: 確保測試結果的可重現性

### 持續整合策略

#### 測試執行策略
1. **快速回饋循環**: 
   - 單元測試在每次 commit 時執行
   - 完整測試套件在 PR 時執行
   
2. **測試分層**:
   - 第一層：快速單元測試 (< 30 秒)
   - 第二層：組件整合測試 (< 2 分鐘)
   - 第三層：完整覆蓋率分析 (< 5 分鐘)

3. **失敗處理**:
   - 測試失敗時自動阻止合併
   - 覆蓋率下降超過 5% 時發出警告
   - 提供詳細的失敗報告和修復建議

#### 報告和監控
- **覆蓋率趨勢**: 追蹤覆蓋率變化趨勢
- **測試效能**: 監控測試執行時間
- **失敗分析**: 分析常見的測試失敗模式
- **品質指標**: 追蹤代碼品質指標的變化