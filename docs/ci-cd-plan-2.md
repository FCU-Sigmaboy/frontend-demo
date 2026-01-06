# 階段二：單元測試整合 - 實作指引

> **階段**：Phase 2 - Unit Testing  
> **預估時間**：4-6 週（漸進式實作）  
> **前置需求**：階段一已完成（ESLint + Prettier）  
> **文檔版本**：1.1.0

---

## 目錄

- [概述](#概述)
- [漸進式實作策略](#漸進式實作策略)
  - [Sprint 1：基礎建設](#sprint-1基礎建設)
  - [Sprint 2：核心工具函數](#sprint-2核心工具函數)
  - [Sprint 3：狀態管理測試](#sprint-3狀態管理測試)
  - [Sprint 4：組件測試](#sprint-4組件測試)
  - [Sprint 5：提升覆蓋率](#sprint-5提升覆蓋率)
- [實作步驟](#實作步驟)
  - [Step 1：安裝測試依賴套件](#step-1安裝測試依賴套件)
  - [Step 2：建立 Vitest 配置檔](#step-2建立-vitest-配置檔)
  - [Step 3：更新 package.json 腳本](#step-3更新-packagejson-腳本)
  - [Step 4：撰寫工具函數測試](#step-4撰寫工具函數測試)
  - [Step 5：撰寫 Pinia Store 測試](#step-5撰寫-pinia-store-測試)
  - [Step 6：撰寫 Vue 組件測試](#step-6撰寫-vue-組件測試)
  - [Step 7：設定程式碼覆蓋率](#step-7設定程式碼覆蓋率)
  - [Step 8：更新 CI Workflow](#step-8更新-ci-workflow)
- [測試策略與優先級](#測試策略與優先級)
- [覆蓋率提升路線圖](#覆蓋率提升路線圖)
- [驗證清單](#驗證清單)
- [常見問題排解](#常見問題排解)
- [測試撰寫最佳實踐](#測試撰寫最佳實踐)

---

## 概述

本文檔為 CI/CD 五階段計劃中「階段二：單元測試整合」的詳細實作指引。透過整合 Vitest 測試框架，建立完整的單元測試機制，確保核心功能邏輯正確性。

### 目標

1. **建立測試基礎架構**：配置 Vitest 測試框架與相關工具
2. **測試工具函數**：為 `utils/` 目錄下的純函數撰寫測試
3. **測試 Pinia Store**：為狀態管理邏輯撰寫測試
4. **測試 Vue 組件**：為可重用組件撰寫渲染與互動測試
5. **CI 自動化測試**：在每次提交時自動執行測試

### 工具版本

| 工具 | 版本 | 說明 |
|------|------|------|
| vitest | ^2.x | Vite 原生測試框架 |
| @vue/test-utils | ^2.x | Vue 3 官方測試工具庫 |
| happy-dom | ^15.x | 輕量級 DOM 模擬環境 |
| @vitest/coverage-v8 | ^2.x | 程式碼覆蓋率報告 |

### 為什麼選擇 Vitest？

- ⚡ **極速**：使用 Vite 的轉換管道，無需額外配置
- 🔧 **零配置**：開箱即用，自動識別 Vite 配置
- 🎯 **相容性**：與 Jest API 相容，遷移成本低
- 📊 **覆蓋率**：內建覆蓋率支援
- 🔄 **HMR**：支援熱更新，開發體驗佳

---

## 漸進式實作策略

> ⚠️ **重要提示**：單元測試整合是一項龐大的工作，不建議一次性完成所有測試。採用漸進式策略，從基礎建設開始，逐步提高覆蓋率，確保每個階段都穩定可用。

### 實作原則

1. **從零開始，穩步成長**：先建立可運作的測試基礎架構，再逐步增加測試
2. **優先測試核心邏輯**：先覆蓋最重要的業務邏輯，再擴展到 UI 組件
3. **CI 先行，門檻漸進**：一開始不設覆蓋率門檻，待測試穩定後再逐步提高
4. **新功能必須有測試**：建立「測試驅動」的開發文化

### 總體時程規劃

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    階段二：單元測試整合 - 漸進式實作                      │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│   Sprint 1  │   Sprint 2  │   Sprint 3  │   Sprint 4  │    Sprint 5     │
│   (1 週)    │   (1 週)    │   (1 週)    │  (1-2 週)   │   (持續進行)    │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────┤
│  基礎建設   │ 工具函數    │ 狀態管理    │  組件測試   │   提升覆蓋率    │
│             │   測試      │   測試      │             │                 │
│ • Vitest    │ • utils/    │ • stores/   │ • 簡單組件  │ • 複雜組件      │
│ • 配置檔    │ • 2-3 個    │ • auth      │ • 5-10 個   │ • API 模組      │
│ • CI 整合   │   核心函數  │ • points    │   基礎組件  │ • 持續優化      │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────┤
│  覆蓋率     │  覆蓋率     │  覆蓋率     │  覆蓋率     │   覆蓋率        │
│   0%→5%    │   5%→15%   │  15%→30%   │  30%→50%   │   50%→60%+     │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┘
```

---

### Sprint 1：基礎建設

> **預估時間**：1 週

#### 目標

建立可運作的測試基礎架構，確保 CI 可以執行測試（即使測試數量很少）。

#### 工作項目

| 任務 | 說明 | 預估時間 |
|------|------|----------|
| 安裝依賴套件 | vitest, @vue/test-utils, happy-dom | 30 分鐘 |
| 建立 vitest.config.js | 基礎配置（暫不設覆蓋率門檻） | 1 小時 |
| 建立 setup.js | 瀏覽器 API Mock | 1 小時 |
| 建立 helpers.js | 測試輔助函數 | 1 小時 |
| 更新 package.json | 新增測試腳本 | 30 分鐘 |
| 更新 CI Workflow | 加入 test job（允許失敗） | 1 小時 |
| 撰寫第一個測試 | 一個簡單的工具函數測試 | 1 小時 |

#### Sprint 1 配置特點

**vitest.config.js（初始版本 - 無覆蓋率門檻）**

```javascript
// vitest.config.js - Sprint 1 初始版本
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // 初始階段：僅啟用覆蓋率報告，不設門檻
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      // Sprint 3+ 再啟用門檻設定：
      // thresholds: {
      //   lines: 20,
      //   functions: 20,
      //   branches: 15,
      //   statements: 20
      // }
    },
    setupFiles: ['./src/test/setup.js']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

**CI Workflow（初始版本 - 允許測試失敗）**

> 📝 **說明**：使用 `continue-on-error: true` 於 job 層級，這樣測試失敗時 CI 仍會繼續執行，但失敗會被正確標記，便於追蹤。

```yaml
# Sprint 1: 測試允許失敗，僅做監控用途
test:
  name: Unit Tests
  runs-on: ubuntu-latest
  needs: lint
  continue-on-error: true  # Job 層級設定：允許失敗但仍會標記
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test

    - name: Upload coverage report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: coverage-report
        path: coverage/
```

#### Sprint 1 交付成果

- ✅ 測試基礎架構可運作
- ✅ CI 可執行測試（允許失敗）
- ✅ 至少 1 個通過的測試案例
- ✅ 覆蓋率報告可產生

---

### Sprint 2：核心工具函數

> **預估時間**：1 週

#### 目標

為 `utils/` 目錄下的核心工具函數撰寫測試，這些是最容易測試的純函數。

#### 優先測試清單

| 檔案 | 優先級 | 預估測試案例 |
|------|--------|--------------|
| formatPoints.js | 🔴 高 | 5-8 個 |
| timeFormat.js | 🔴 高 | 8-12 個 |
| sortFunctions.js | 🟡 中 | 5-10 個 |
| filterFunctions.js | 🟡 中 | 5-10 個 |

#### Sprint 2 里程碑

- ✅ utils/ 目錄覆蓋率達 70%+
- ✅ 所有測試通過
- ✅ 總覆蓋率約 10-15%

---

### Sprint 3：狀態管理測試

> **預估時間**：1 週

#### 目標

為核心 Pinia Store 撰寫測試，確保狀態管理邏輯正確。

#### 優先測試清單

| Store | 優先級 | 說明 |
|-------|--------|------|
| auth.js | 🔴 高 | 登入/登出邏輯 |
| points.js | 🔴 高 | 點數系統核心邏輯 |
| favorites.js | 🟡 中 | 收藏功能 |
| transaction.js | 🟡 中 | 交易狀態管理 |

#### Sprint 3 配置更新

開始引入覆蓋率門檻（低門檻起步）：

```javascript
// vitest.config.js - Sprint 3 更新
coverage: {
  thresholds: {
    lines: 20,      // 從 20% 開始
    functions: 20,
    branches: 15,
    statements: 20
  }
}
```

#### Sprint 3 里程碑

- ✅ stores/ 目錄覆蓋率達 50%+
- ✅ 覆蓋率門檻設為 20%
- ✅ 總覆蓋率約 20-30%

---

### Sprint 4：組件測試

> **預估時間**：1-2 週

#### 目標

為可重用的 Vue 組件撰寫渲染和互動測試。

#### 分階段測試

**Phase 4a：簡單展示組件（第 1 週）**

| 組件 | 優先級 | 測試重點 |
|------|--------|----------|
| ProductCard.vue | 🔴 高 | Props 渲染 |
| SearchBar.vue | 🔴 高 | 事件發送 |
| CategoryCard.vue | 🟡 中 | Props 渲染 |
| Breadcrumb.vue | 🟡 中 | 導航路徑 |

**Phase 4b：互動組件（第 2 週）**

| 組件 | 優先級 | 測試重點 |
|------|--------|----------|
| FilterTabs.vue | 🟡 中 | 點擊切換 |
| ImageCropper.vue | 🟢 低 | 複雜互動（可跳過） |

#### Sprint 4 配置更新

提高覆蓋率門檻：

```javascript
// vitest.config.js - Sprint 4 更新
coverage: {
  thresholds: {
    lines: 40,
    functions: 40,
    branches: 30,
    statements: 40
  }
}
```

#### Sprint 4 里程碑

- ✅ 核心組件有基本測試
- ✅ 覆蓋率門檻提高到 40%
- ✅ 總覆蓋率約 40-50%

---

### Sprint 5：提升覆蓋率

> **預估時間**：持續進行

#### 目標

持續提升覆蓋率，達到最終目標 60%+。

#### 持續改進策略

1. **新功能必須有測試**：所有新增的功能都需要附帶測試
2. **Bug 修復要補測試**：修復 Bug 時，先撰寫重現 Bug 的測試
3. **每月檢視覆蓋率報告**：找出未覆蓋的關鍵路徑

#### 最終配置

```javascript
// vitest.config.js - 最終版本
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 50,
    statements: 60
  }
}
```

#### CI Workflow 最終版本

```yaml
# 最終版本：測試必須通過
test:
  name: Unit Tests
  runs-on: ubuntu-latest
  needs: lint
  # 移除 continue-on-error，測試失敗將阻擋 CI
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests with coverage
      run: npm run test:coverage

    - name: Upload coverage report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: coverage-report
        path: coverage/
```

---

## 覆蓋率提升路線圖

### 階段性目標

```
覆蓋率 %
100 ┤
 90 ┤                                              ┌─────────────────
 80 ┤                                         ┌────┘ 長期目標 (80%+)
 70 ┤                                    ┌────┘
 60 ┤                               ┌────┘ ← Sprint 5 目標
 50 ┤                          ┌────┘
 40 ┤                     ┌────┘ ← Sprint 4 目標
 30 ┤                ┌────┘ ← Sprint 3 目標
 20 ┤           ┌────┘
 10 ┤      ┌────┘ ← Sprint 2 目標
  0 ┼──────┴─────────────────────────────────────────────────────────
    Sprint1  Sprint2  Sprint3  Sprint4  Sprint5  維護期
```

### 模組覆蓋率目標

| 模組 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5+ |
|------|----------|----------|----------|-----------|
| utils/ | 70% | 80% | 90% | 95%+ |
| stores/ | 0% | 50% | 70% | 80%+ |
| api/ | 0% | 0% | 30% | 70%+ |
| components/ | 0% | 0% | 40% | 60%+ |
| views/ | 0% | 0% | 0% | 40%+ |

### 每日/每週實踐建議

| 頻率 | 活動 | 說明 |
|------|------|------|
| 每日 | 執行 `npm run test:watch` | 開發時即時驗證 |
| 每次 PR | 執行 CI 測試 | 自動化檢查 |
| 每週 | 檢視覆蓋率報告 | 找出薄弱區域 |
| 每月 | 調整覆蓋率門檻 | 逐步提高標準 |

---

## 實作步驟

### Step 1：安裝測試依賴套件

在專案根目錄執行以下指令安裝所需套件：

```bash
# 安裝 Vitest 測試框架
npm install -D vitest

# 安裝 Vue 測試工具
npm install -D @vue/test-utils

# 安裝 DOM 模擬環境
npm install -D happy-dom

# 安裝覆蓋率報告工具
npm install -D @vitest/coverage-v8
```

或一次安裝所有套件：

```bash
npm install -D vitest @vue/test-utils happy-dom @vitest/coverage-v8
```

#### 驗證安裝

```bash
# 確認套件已安裝
npm ls vitest @vue/test-utils happy-dom @vitest/coverage-v8

# 預期輸出類似：
# ├── @vitest/coverage-v8@2.x.x
# ├── @vue/test-utils@2.x.x
# ├── happy-dom@15.x.x
# └── vitest@2.x.x
```

---

### Step 2：建立 Vitest 配置檔

在專案根目錄建立 `vitest.config.js` 檔案：

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 測試環境設定
    environment: 'happy-dom',
    
    // 全域 API（describe, it, expect 等）
    globals: true,
    
    // 測試檔案匹配模式
    include: ['src/**/*.{test,spec}.{js,ts}'],
    
    // 排除目錄
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    
    // 設置超時時間（毫秒）
    testTimeout: 10000,
    
    // 根目錄別名
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    
    // 覆蓋率設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/*.config.mjs',
        'src/main.js',
        'src/router/**',
        'src/lib/**',
        '**/*.d.ts',
        'src/**/*.test.js',
        'src/**/*.spec.js'
      ],
      // 覆蓋率門檻
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60
      }
    },
    
    // 設置檔案（在每個測試檔案前執行）
    setupFiles: ['./src/test/setup.js']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

#### 建立測試設置檔案

建立 `src/test/setup.js`：

```javascript
// src/test/setup.js
import { vi } from 'vitest'

// 模擬 window.matchMedia（某些組件可能需要）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模擬 IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver

// 模擬 ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver

// 模擬 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// 模擬 scrollTo
window.scrollTo = vi.fn()

// 清理函數（在每個測試後執行）
afterEach(() => {
  vi.clearAllMocks()
})
```

建立測試目錄結構：

```bash
mkdir -p src/test
```

---

### Step 3：更新 package.json 腳本

將以下腳本加入 `package.json` 的 `scripts` 區塊：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{js,vue,css,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{js,vue,css,scss,json}\"",
    "code-quality": "npm run lint && npm run format:check",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:related": "vitest related"
  }
}
```

#### 腳本說明

| 腳本 | 說明 |
|------|------|
| `npm run test` | 執行所有測試一次 |
| `npm run test:watch` | 監聽模式，檔案變更時自動重跑測試 |
| `npm run test:ui` | 開啟視覺化測試介面 |
| `npm run test:coverage` | 執行測試並產生覆蓋率報告 |
| `npm run test:related` | 只執行與變更檔案相關的測試 |

---

### Step 4：撰寫工具函數測試

工具函數是最適合開始撰寫測試的地方，因為它們通常是純函數，沒有副作用。

#### 4.1 測試 formatPoints.js

建立 `src/utils/formatPoints.test.js`：

```javascript
// src/utils/formatPoints.test.js
import { describe, it, expect } from 'vitest'
import { formatPoints } from './formatPoints'

describe('formatPoints', () => {
  describe('正常數值', () => {
    it('應將數字格式化為千分逗號並加上單位', () => {
      expect(formatPoints(1000)).toBe('1,000 點')
      expect(formatPoints(1000000)).toBe('1,000,000 點')
    })

    it('應正確處理零', () => {
      expect(formatPoints(0)).toBe('0 點')
    })

    it('應正確處理小數值', () => {
      expect(formatPoints(100)).toBe('100 點')
      expect(formatPoints(50)).toBe('50 點')
    })
  })

  describe('邊界情況', () => {
    it('應處理 null 值', () => {
      expect(formatPoints(null)).toBe('0 點')
    })

    it('應處理 undefined', () => {
      expect(formatPoints(undefined)).toBe('0 點')
    })

    it('應處理非數字字串', () => {
      expect(formatPoints('abc')).toBe('0 點')
    })

    it('應處理數字字串', () => {
      expect(formatPoints('1500')).toBe('1,500 點')
    })

    it('應處理負數', () => {
      expect(formatPoints(-500)).toBe('-500 點')
    })
  })
})
```

#### 4.2 測試 timeFormat.js

建立 `src/utils/timeFormat.test.js`：

```javascript
// src/utils/timeFormat.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime } from './timeFormat'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // 固定當前時間為 2026-01-06 12:00:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-06T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('無效輸入', () => {
    it('應處理 null 值', () => {
      expect(formatRelativeTime(null)).toBe('未知時間')
    })

    it('應處理 undefined', () => {
      expect(formatRelativeTime(undefined)).toBe('未知時間')
    })

    it('應處理空字串', () => {
      expect(formatRelativeTime('')).toBe('未知時間')
    })
  })

  describe('時間格式化', () => {
    it('應顯示「剛剛」於 1 分鐘內', () => {
      const thirtySecondsAgo = new Date('2026-01-06T11:59:30')
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('剛剛')
    })

    it('應顯示分鐘數', () => {
      const fiveMinutesAgo = new Date('2026-01-06T11:55:00')
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分鐘前')
    })

    it('應顯示小時數', () => {
      const threeHoursAgo = new Date('2026-01-06T09:00:00')
      expect(formatRelativeTime(threeHoursAgo)).toBe('3小時前')
    })

    it('應顯示天數', () => {
      const twoDaysAgo = new Date('2026-01-04T12:00:00')
      expect(formatRelativeTime(twoDaysAgo)).toBe('2天前')
    })

    it('應顯示月份數', () => {
      const twoMonthsAgo = new Date('2025-11-06T12:00:00')
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2個月前')
    })

    it('應顯示年數', () => {
      const twoYearsAgo = new Date('2024-01-06T12:00:00')
      expect(formatRelativeTime(twoYearsAgo)).toBe('2年前')
    })
  })

  describe('未來時間', () => {
    it('應顯示「剛剛」於未來時間', () => {
      const futureTime = new Date('2026-01-06T13:00:00')
      expect(formatRelativeTime(futureTime)).toBe('剛剛')
    })
  })
})
```

#### 4.3 測試 filterFunctions.js

建立 `src/utils/filterFunctions.test.js`：

> 📝 **注意**：以下為測試模板範例。實際撰寫測試時，請根據 `filterFunctions.js` 中實際存在的函數進行調整。

```javascript
// src/utils/filterFunctions.test.js
import { describe, it, expect } from 'vitest'

// 根據實際函數進行導入，例如：
// import { filterByCategory, filterByPriceRange, filterByKeyword } from './filterFunctions'

describe('filterFunctions（測試模板）', () => {
  const mockItems = [
    { id: 1, title: '二手 iPhone', category: '電子產品', price: 5000 },
    { id: 2, title: '木製書桌', category: '傢俱', price: 2000 },
    { id: 3, title: '運動腳踏車', category: '運動用品', price: 3500 },
    { id: 4, title: 'iPad Pro', category: '電子產品', price: 15000 },
  ]

  describe('filterByCategory（範例）', () => {
    it.skip('應依分類篩選商品', () => {
      // const result = filterByCategory(mockItems, '電子產品')
      // expect(result).toHaveLength(2)
      // expect(result.every(item => item.category === '電子產品')).toBe(true)
    })

    it.skip('應返回所有商品當分類為空', () => {
      // const result = filterByCategory(mockItems, '')
      // expect(result).toHaveLength(4)
    })
  })

  describe('filterByPriceRange（範例）', () => {
    it.skip('應依價格區間篩選商品', () => {
      // const result = filterByPriceRange(mockItems, 2000, 5000)
      // expect(result).toHaveLength(3)
    })
  })

  describe('filterByKeyword（範例）', () => {
    it.skip('應依關鍵字篩選商品', () => {
      // const result = filterByKeyword(mockItems, 'iPhone')
      // expect(result).toHaveLength(1)
      // expect(result[0].id).toBe(1)
    })
  })
})
```

---

### Step 5：撰寫 Pinia Store 測試

Pinia Store 測試需要設置測試環境以支援 Vue 3 的響應式系統。

#### 5.1 建立 Store 測試輔助函數

建立 `src/test/helpers.js`：

```javascript
// src/test/helpers.js
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'

/**
 * 為測試設置新的 Pinia 實例
 */
export function setupTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 建立帶有 Pinia 的 Vue 應用（用於組件測試）
 */
export function createTestApp() {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  return { app, pinia }
}

/**
 * 建立模擬的 Supabase 回應
 */
export function createMockSupabaseResponse(data, error = null) {
  return { data, error }
}

/**
 * 等待所有 Promise 完成
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
```

#### 5.2 測試 Auth Store（範例）

建立 `src/stores/auth.test.js`：

```javascript
// src/stores/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './auth'
import { setupTestPinia } from '@/test/helpers'

// 模擬 Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}))

// 模擬 API
vi.mock('@/api/profileAPI', () => ({
  getMyProfileForEdit: vi.fn()
}))

vi.mock('@/api/locationAPI', () => ({
  getCurrentPosition: vi.fn(),
  saveLocation: vi.fn()
}))

describe('Auth Store', () => {
  let authStore

  beforeEach(() => {
    setupTestPinia()
    authStore = useAuthStore()
  })

  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(authStore.isLoggedIn).toBe(false)
      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
    })
  })

  describe('計算屬性', () => {
    it('未登入時應顯示訪客', () => {
      expect(authStore.userName).toBe('訪客')
    })

    it('未載入 profile 時應顯示使用者', () => {
      authStore.user = { id: '123' }
      authStore.isLoggedIn = true
      expect(authStore.userName).toBe('使用者')
    })

    it('有 profile 時應顯示暱稱', () => {
      authStore.user = { id: '123' }
      authStore.isLoggedIn = true
      authStore.profileData = { nickname: '測試用戶' }
      expect(authStore.userName).toBe('測試用戶')
    })
  })

  describe('signOut', () => {
    it('登出後應重置狀態', async () => {
      const { supabase } = await import('@/lib/supabase')
      supabase.auth.signOut.mockResolvedValue({ error: null })

      authStore.isLoggedIn = true
      authStore.user = { id: '123' }
      authStore.session = { access_token: 'token' }

      await authStore.signOut()

      expect(authStore.isLoggedIn).toBe(false)
      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
    })
  })
})
```

#### 5.3 測試 Points Store（範例）

建立 `src/stores/points.test.js`：

```javascript
// src/stores/points.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePointsStore } from './points'
import { setupTestPinia } from '@/test/helpers'

// 模擬 Points API
vi.mock('@/api/pointsAPI', () => ({
  getPointsBalance: vi.fn(),
  getPointsHistory: vi.fn(),
  checkDailySignIn: vi.fn(),
  performDailySignIn: vi.fn()
}))

describe('Points Store', () => {
  let pointsStore

  beforeEach(() => {
    setupTestPinia()
    pointsStore = usePointsStore()
    vi.clearAllMocks()
  })

  describe('初始狀態', () => {
    it('應有正確的初始狀態', () => {
      expect(pointsStore.balance).toBe(0)
      expect(pointsStore.history).toEqual([])
      expect(pointsStore.isLoading).toBe(false)
    })
  })

  describe('fetchBalance', () => {
    it('應正確取得點數餘額', async () => {
      const { getPointsBalance } = await import('@/api/pointsAPI')
      getPointsBalance.mockResolvedValue({
        success: true,
        data: { balance: 1500 }
      })

      await pointsStore.fetchBalance()

      expect(pointsStore.balance).toBe(1500)
      expect(pointsStore.isLoading).toBe(false)
    })

    it('API 失敗時應處理錯誤', async () => {
      const { getPointsBalance } = await import('@/api/pointsAPI')
      getPointsBalance.mockResolvedValue({
        success: false,
        error: '取得餘額失敗'
      })

      await pointsStore.fetchBalance()

      expect(pointsStore.balance).toBe(0)
      expect(pointsStore.error).toBeTruthy()
    })
  })
})
```

---

### Step 6：撰寫 Vue 組件測試

Vue 組件測試需要使用 `@vue/test-utils` 來掛載和操作組件。

#### 6.1 建立組件測試輔助函數

更新 `src/test/helpers.js`：

```javascript
// src/test/helpers.js（新增以下內容）
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

/**
 * 掛載組件並提供常用的插件
 */
export function mountWithPlugins(component, options = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div>Home</div>' } }]
  })

  return mount(component, {
    global: {
      plugins: [pinia, router],
      stubs: {
        // 常見的全域組件 stubs
        RouterLink: true,
        RouterView: true,
        Teleport: true,
        ...options.stubs
      },
      mocks: {
        $t: (msg) => msg, // i18n mock
        ...options.mocks
      }
    },
    ...options
  })
}
```

#### 6.2 測試簡單組件

建立 `src/components/SearchBar.test.js`：

```javascript
// src/components/SearchBar.test.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from './SearchBar.vue'

describe('SearchBar', () => {
  it('應正確渲染輸入框', () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
  })

  it('應在輸入時更新 v-model', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    
    await input.setValue('測試關鍵字')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['測試關鍵字'])
  })

  it('應在按下 Enter 時觸發搜尋', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    
    await input.setValue('iPhone')
    await input.trigger('keyup.enter')
    
    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')[0]).toEqual(['iPhone'])
  })

  it('應在點擊搜尋按鈕時觸發搜尋', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    const button = wrapper.find('button')
    
    await input.setValue('書桌')
    await button.trigger('click')
    
    expect(wrapper.emitted('search')).toBeTruthy()
  })
})
```

#### 6.3 測試帶有 Props 的組件

建立 `src/components/ProductCard.test.js`：

```javascript
// src/components/ProductCard.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from './ProductCard.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    title: '二手 iPhone 13',
    price: 15000,
    description: '9成新，功能正常',
    images: [{ url: '/images/iphone.jpg' }],
    seller: {
      id: 'user-123',
      nickname: '賣家小明'
    },
    created_at: '2026-01-01T10:00:00'
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('應正確渲染商品標題', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: {
        stubs: ['RouterLink']
      }
    })
    
    expect(wrapper.text()).toContain('二手 iPhone 13')
  })

  it('應正確格式化顯示價格', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: {
        stubs: ['RouterLink']
      }
    })
    
    expect(wrapper.text()).toContain('15,000')
  })

  it('應渲染商品圖片', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: {
        stubs: ['RouterLink']
      }
    })
    
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
  })

  it('應在點擊時導航到商品詳情頁', async () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: {
        stubs: {
          RouterLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to']
          }
        }
      }
    })
    
    const link = wrapper.find('a')
    expect(link.attributes('href')).toContain('/item/1')
  })
})
```

#### 6.4 測試帶有事件的組件

建立 `src/components/transaction/CancelTransactionModal.test.js`：

```javascript
// src/components/transaction/CancelTransactionModal.test.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CancelTransactionModal from './CancelTransactionModal.vue'

describe('CancelTransactionModal', () => {
  const defaultProps = {
    show: true,
    transactionId: 'txn-123'
  }

  it('當 show 為 true 時應顯示 Modal', () => {
    const wrapper = mount(CancelTransactionModal, {
      props: defaultProps
    })
    
    expect(wrapper.find('.modal').exists()).toBe(true)
  })

  it('當 show 為 false 時不應顯示 Modal', () => {
    const wrapper = mount(CancelTransactionModal, {
      props: { ...defaultProps, show: false }
    })
    
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('點擊取消按鈕應觸發 close 事件', async () => {
    const wrapper = mount(CancelTransactionModal, {
      props: defaultProps
    })
    
    await wrapper.find('[data-testid="cancel-btn"]').trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('點擊確認按鈕應觸發 confirm 事件並傳遞交易 ID', async () => {
    const wrapper = mount(CancelTransactionModal, {
      props: defaultProps
    })
    
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')[0]).toEqual(['txn-123'])
  })
})
```

---

### Step 7：設定程式碼覆蓋率

#### 7.1 覆蓋率門檻設定

在 `vitest.config.js` 中已設定覆蓋率門檻：

```javascript
coverage: {
  thresholds: {
    lines: 60,      // 行覆蓋率最低 60%
    functions: 60,  // 函數覆蓋率最低 60%
    branches: 50,   // 分支覆蓋率最低 50%
    statements: 60  // 語句覆蓋率最低 60%
  }
}
```

#### 7.2 執行覆蓋率報告

```bash
# 產生覆蓋率報告
npm run test:coverage

# 報告將輸出到 coverage/ 目錄
# - coverage/index.html  可視化報告
# - coverage/lcov.info   用於 CI 上傳
```

#### 7.3 更新 .gitignore

將覆蓋率報告加入 `.gitignore`：

```
# 測試覆蓋率
coverage/
```

---

### Step 8：更新 CI Workflow

更新 `.github/workflows/ci.yml` 加入單元測試：

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - main
      - master
      - vibe
  pull_request:
    branches:
      - main
      - master
      - vibe

permissions:
  contents: read

jobs:
  # 程式碼品質檢查
  lint:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier formatting
        run: npm run format:check

  # 單元測試
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  # 建置驗證
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build
```

---

## 測試策略與優先級

### 測試金字塔

```
        /\
       /  \     E2E 測試（少量）
      /----\    
     /      \   整合測試（中等）
    /--------\  
   /          \ 單元測試（大量）
  /____________\
```

### 優先級排序

| 優先級 | 模組 | 目標覆蓋率 | 說明 |
|--------|------|------------|------|
| 🔴 高 | `utils/` | 90%+ | 純函數，易於測試 |
| 🔴 高 | `stores/` | 80%+ | 核心業務邏輯 |
| 🟡 中 | `api/` | 70%+ | 需要 Mock 外部服務 |
| 🟡 中 | `components/` | 60%+ | 可重用 UI 組件 |
| 🟢 低 | `views/` | 40%+ | 頁面級整合測試 |

### 測試檔案命名規範

```
src/
├── utils/
│   ├── formatPoints.js
│   └── formatPoints.test.js     # 同目錄，.test.js 後綴
├── stores/
│   ├── auth.js
│   └── auth.test.js
├── components/
│   ├── ProductCard.vue
│   └── ProductCard.test.js
└── test/
    ├── setup.js                 # 測試設置
    └── helpers.js               # 測試輔助函數
```

---

## 驗證清單

完成上述步驟後，請依序驗證：

### ✅ 安裝驗證

```bash
# 確認所有套件已安裝
npm ls vitest @vue/test-utils happy-dom @vitest/coverage-v8
```

### ✅ 配置檔案驗證

確認以下檔案已建立：

- [ ] `vitest.config.js`
- [ ] `src/test/setup.js`
- [ ] `src/test/helpers.js`

### ✅ 測試執行驗證

```bash
# 執行所有測試
npm run test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 開啟監聽模式
npm run test:watch
```

### ✅ CI 驗證

1. 提交變更到分支
2. 確認 GitHub Actions 正確觸發
3. 確認 `test` job 成功執行
4. 確認覆蓋率報告已上傳

---

## 常見問題排解

### Q1：測試執行時出現 "Cannot find module '@/...'" 錯誤

**原因**：路徑別名未正確設定

**解決方案**：確認 `vitest.config.js` 中的 `alias` 設定：

```javascript
alias: {
  '@': fileURLToPath(new URL('./src', import.meta.url))
}
```

### Q2：Vue 組件測試失敗 "Failed to mount component"

**原因**：缺少必要的插件或全域組件

**解決方案**：使用 `mountWithPlugins` 輔助函數或手動提供必要的插件：

```javascript
mount(Component, {
  global: {
    plugins: [pinia, router],
    stubs: ['RouterLink', 'RouterView']
  }
})
```

### Q3：測試中 API 呼叫導致錯誤

**原因**：測試環境中不應呼叫真實 API

**解決方案**：使用 `vi.mock()` 模擬 API：

```javascript
vi.mock('@/api/profileAPI', () => ({
  getProfile: vi.fn().mockResolvedValue({ success: true, data: {} })
}))
```

### Q4：覆蓋率報告顯示 0%

**原因**：測試檔案未被正確識別

**解決方案**：確認測試檔案符合 `include` 模式：

```javascript
include: ['src/**/*.{test,spec}.{js,ts}']
```

### Q5：測試因非同步操作超時

**原因**：非同步操作未正確處理

**解決方案**：

```javascript
import { flushPromises } from '@vue/test-utils'

it('應正確處理非同步操作', async () => {
  // 觸發非同步操作
  await wrapper.find('button').trigger('click')
  
  // 等待所有 Promise 完成
  await flushPromises()
  
  // 驗證結果
  expect(wrapper.text()).toContain('完成')
})
```

---

## 測試撰寫最佳實踐

### 1. 測試命名規範

使用描述性的測試名稱：

```javascript
// ✅ 好的命名
describe('formatPoints', () => {
  it('應將數字格式化為千分逗號並加上單位', () => {})
  it('應處理 null 值並返回 0 點', () => {})
})

// ❌ 不好的命名
describe('formatPoints', () => {
  it('test1', () => {})
  it('works', () => {})
})
```

### 2. AAA 模式

遵循 Arrange-Act-Assert 模式：

```javascript
it('應在輸入時更新值', async () => {
  // Arrange（準備）
  const wrapper = mount(SearchBar)
  const input = wrapper.find('input')
  
  // Act（執行）
  await input.setValue('測試')
  
  // Assert（斷言）
  expect(wrapper.emitted('update:modelValue')).toBeTruthy()
})
```

### 3. 單一職責

每個測試只驗證一件事：

```javascript
// ✅ 好的做法
it('應顯示商品標題', () => {})
it('應顯示格式化的價格', () => {})
it('應顯示商品圖片', () => {})

// ❌ 不好的做法
it('應正確渲染所有內容', () => {
  // 驗證標題、價格、圖片、描述...
})
```

### 4. 避免測試實作細節

測試行為，而非實作：

```javascript
// ✅ 好的做法：測試行為
it('點擊按鈕後應顯示訊息', async () => {
  await wrapper.find('button').trigger('click')
  expect(wrapper.text()).toContain('成功')
})

// ❌ 不好的做法：測試實作細節
it('點擊按鈕後 showMessage 應為 true', async () => {
  await wrapper.find('button').trigger('click')
  expect(wrapper.vm.showMessage).toBe(true)
})
```

### 5. 使用 Data Attributes

為測試目標元素添加 `data-testid`：

```vue
<template>
  <button data-testid="submit-btn">提交</button>
</template>
```

```javascript
await wrapper.find('[data-testid="submit-btn"]').trigger('click')
```

---

## 下一步

完成階段二後，請繼續進行：

- **[階段三：端對端測試](./ci-cd-plan-3.md)**：Playwright 整合

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月  
> **參考**：[ci-cd-plan.md](./ci-cd-plan.md) | [ci-cd-plan-1.md](./ci-cd-plan-1.md)
