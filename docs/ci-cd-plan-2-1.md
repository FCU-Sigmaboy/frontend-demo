# 階段二 Sprint 1：基礎建設 - 實作指引

> **Sprint**：Sprint 1 - 測試基礎建設  
> **預估時間**：1 週（約 6-8 小時實作時間）  
> **前置需求**：階段一已完成（ESLint + Prettier）  
> **文檔版本**：1.0.0

---

## 目錄

- [概述](#概述)
- [實作步驟](#實作步驟)
  - [Step 1：安裝測試依賴套件](#step-1安裝測試依賴套件)
  - [Step 2：建立 Vitest 配置檔](#step-2建立-vitest-配置檔)
  - [Step 3：建立測試設置檔案](#step-3建立測試設置檔案)
  - [Step 4：建立測試輔助函數](#step-4建立測試輔助函數)
  - [Step 5：更新 package.json 腳本](#step-5更新-packagejson-腳本)
  - [Step 6：撰寫第一個測試](#step-6撰寫第一個測試)
  - [Step 7：更新 CI Workflow](#step-7更新-ci-workflow)
  - [Step 8：更新 .gitignore](#step-8更新-gitignore)
- [驗證清單](#驗證清單)
- [常見問題排解](#常見問題排解)
- [Sprint 1 完成標準](#sprint-1-完成標準)
- [下一步](#下一步)

---

## 概述

Sprint 1 的目標是建立可運作的測試基礎架構。這是整個單元測試整合的第一步，重點在於：

1. **配置測試框架**：安裝 Vitest 及相關工具
2. **建立基礎設施**：配置檔、設置檔、輔助函數
3. **驗證可運作**：至少一個測試通過
4. **CI 整合**：加入測試 job（允許失敗）

### Sprint 1 原則

- ⚠️ **不設覆蓋率門檻**：本 Sprint 目標是「能跑」，不是「跑得好」
- ⚠️ **CI 允許失敗**：使用 `continue-on-error: true`，監控用途
- ✅ **最小可行產品**：只要能執行一個測試即可
- ✅ **建立基礎**：為後續 Sprint 打下基礎

### 工作項目總覽

| 任務 | 說明 | 預估時間 |
|------|------|----------|
| 安裝依賴套件 | vitest, @vue/test-utils, happy-dom | 30 分鐘 |
| 建立 vitest.config.js | 基礎配置（暫不設覆蓋率門檻） | 1 小時 |
| 建立 setup.js | 瀏覽器 API Mock | 1 小時 |
| 建立 helpers.js | 測試輔助函數 | 1 小時 |
| 更新 package.json | 新增測試腳本 | 30 分鐘 |
| 撰寫第一個測試 | formatPoints.test.js | 1 小時 |
| 更新 CI Workflow | 加入 test job（允許失敗） | 1 小時 |
| 更新 .gitignore | 排除 coverage/ | 10 分鐘 |

---

## 實作步驟

### Step 1：安裝測試依賴套件

在專案根目錄執行以下指令：

```bash
npm install -D vitest @vue/test-utils happy-dom @vitest/coverage-v8
```

#### 套件說明

| 套件 | 說明 |
|------|------|
| `vitest` | Vite 原生測試框架，速度快、零配置 |
| `@vue/test-utils` | Vue 3 官方測試工具庫 |
| `happy-dom` | 輕量級 DOM 模擬環境（比 jsdom 更快） |
| `@vitest/coverage-v8` | 使用 V8 引擎的覆蓋率報告工具 |

#### 驗證安裝

```bash
npm ls vitest @vue/test-utils happy-dom @vitest/coverage-v8
```

預期輸出：

```
project_demo@0.0.0 /path/to/project
├── @vitest/coverage-v8@2.x.x
├── @vue/test-utils@2.x.x
├── happy-dom@15.x.x
└── vitest@2.x.x
```

---

### Step 2：建立 Vitest 配置檔

在專案根目錄建立 `vitest.config.js`：

```javascript
// vitest.config.js
// Sprint 1: 基礎配置 - 無覆蓋率門檻
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 測試環境：使用 happy-dom 模擬瀏覽器環境
    environment: 'happy-dom',
    
    // 全域 API：讓 describe, it, expect 等可直接使用
    globals: true,
    
    // 測試檔案匹配模式
    include: ['src/**/*.{test,spec}.{js,ts}'],
    
    // 排除目錄
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    
    // 根目錄別名（與 Vite 一致）
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    
    // 覆蓋率設定（Sprint 1: 僅啟用報告，不設門檻）
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/*.config.mjs',
        'src/main.js',
        'src/router/**',
        'src/lib/**',
        'src/**/*.test.js',
        'src/**/*.spec.js'
      ]
      // Sprint 3+ 再啟用門檻（從低門檻開始，逐步提高）：
      // 20% 門檻是保守起步值，目的是：
      // 1. 讓 CI 開始強制執行覆蓋率
      // 2. 避免一開始就設太高導致頻繁失敗
      // 3. 隨著測試增加，逐步調高至 40% → 60%
      // thresholds: {
      //   lines: 20,
      //   functions: 20,
      //   branches: 15,
      //   statements: 20
      // }
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

#### 配置說明

| 選項 | 說明 | Sprint 1 設定 |
|------|------|---------------|
| `environment` | DOM 模擬環境 | `happy-dom`（輕量快速） |
| `globals` | 全域 API | `true`（免 import describe/it/expect） |
| `include` | 測試檔案匹配 | `src/**/*.{test,spec}.{js,ts}` |
| `coverage.thresholds` | 覆蓋率門檻 | **註解掉**（Sprint 3 再啟用） |

---

### Step 3：建立測試設置檔案

建立目錄結構：

```bash
mkdir -p src/test
```

建立 `src/test/setup.js`：

```javascript
// src/test/setup.js
// Sprint 1: 基礎設置 - 模擬瀏覽器 API
import { vi } from 'vitest'

// ============================================================================
// 瀏覽器 API Mock
// ============================================================================

// 模擬 window.matchMedia
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
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value.toString()
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  }),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// 模擬 sessionStorage
const sessionStorageMock = {
  store: {},
  getItem: vi.fn((key) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    sessionStorageMock.store[key] = value.toString()
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {}
  }),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// 模擬 scrollTo
window.scrollTo = vi.fn()

// ============================================================================
// 測試生命週期
// ============================================================================

// 每個測試後清理 mock
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.store = {}
  sessionStorageMock.store = {}
})

// 所有測試完成後重置模組
afterAll(() => {
  vi.resetModules()
})
```

#### Mock 說明

| Mock | 用途 |
|------|------|
| `matchMedia` | 響應式設計、CSS media query |
| `IntersectionObserver` | 無限滾動、懶加載 |
| `ResizeObserver` | 元素尺寸變化監聽 |
| `localStorage` | 本地儲存 |
| `sessionStorage` | 會話儲存 |
| `scrollTo` | 頁面滾動 |

---

### Step 4：建立測試輔助函數

建立 `src/test/helpers.js`：

```javascript
// src/test/helpers.js
// Sprint 1: 基礎輔助函數
import { createPinia, setActivePinia } from 'pinia'

/**
 * 為測試設置新的 Pinia 實例
 * @returns {Pinia} Pinia 實例
 */
export function setupTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 等待所有 Promise 完成
 * @returns {Promise<void>}
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * 建立模擬的 API 回應
 * @param {any} data - 回應資料
 * @param {Error|null} error - 錯誤物件
 * @returns {{ data: any, error: Error|null }}
 */
export function createMockResponse(data, error = null) {
  return { data, error }
}

/**
 * 建立模擬的成功 API 回應
 * @param {any} data - 回應資料
 * @returns {{ success: true, data: any }}
 */
export function createSuccessResponse(data) {
  return { success: true, data }
}

/**
 * 建立模擬的失敗 API 回應
 * @param {string} message - 錯誤訊息
 * @returns {{ success: false, error: string }}
 */
export function createErrorResponse(message) {
  return { success: false, error: message }
}

/**
 * 延遲指定毫秒數
 * @param {number} ms - 毫秒數
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

---

### Step 5：更新 package.json 腳本

在 `package.json` 的 `scripts` 區塊加入以下腳本：

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
    "test:coverage": "vitest run --coverage"
  }
}
```

#### 腳本說明

| 腳本 | 說明 | 使用時機 |
|------|------|----------|
| `npm run test` | 執行所有測試一次 | CI、PR 驗證 |
| `npm run test:watch` | 監聽模式，檔案變更時自動重跑 | 開發時使用 |
| `npm run test:coverage` | 執行測試並產生覆蓋率報告 | 週期性檢查 |

---

### Step 6：撰寫第一個測試

為 `formatPoints.js` 撰寫測試。

#### 檢視現有函數

`src/utils/formatPoints.js`：

```javascript
// 格式化點數為千分逗號並加上單位「點」
export function formatPoints(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString()} 點`;
}

export default formatPoints;
```

#### 建立測試檔案

建立 `src/utils/formatPoints.test.js`：

```javascript
// src/utils/formatPoints.test.js
// Sprint 1: 第一個測試檔案
import { describe, it, expect } from 'vitest'
import { formatPoints } from './formatPoints'

describe('formatPoints', () => {
  // =========================================================================
  // 正常數值測試
  // =========================================================================
  describe('正常數值', () => {
    it('應將 1000 格式化為 "1,000 點"', () => {
      expect(formatPoints(1000)).toBe('1,000 點')
    })

    it('應將 1000000 格式化為 "1,000,000 點"', () => {
      expect(formatPoints(1000000)).toBe('1,000,000 點')
    })

    it('應將 0 格式化為 "0 點"', () => {
      expect(formatPoints(0)).toBe('0 點')
    })

    it('應將 100 格式化為 "100 點"', () => {
      expect(formatPoints(100)).toBe('100 點')
    })
  })

  // =========================================================================
  // 邊界情況測試
  // =========================================================================
  describe('邊界情況', () => {
    it('應處理 null 值，返回 "0 點"', () => {
      expect(formatPoints(null)).toBe('0 點')
    })

    it('應處理 undefined，返回 "0 點"', () => {
      expect(formatPoints(undefined)).toBe('0 點')
    })

    it('應處理非數字字串，返回 "0 點"', () => {
      expect(formatPoints('abc')).toBe('0 點')
    })

    it('應處理數字字串 "1500"，返回 "1,500 點"', () => {
      expect(formatPoints('1500')).toBe('1,500 點')
    })

    it('應處理負數 -500，返回 "-500 點"', () => {
      expect(formatPoints(-500)).toBe('-500 點')
    })
  })
})
```

#### 執行測試驗證

```bash
npm run test
```

預期輸出：

```
 ✓ src/utils/formatPoints.test.js (9)
   ✓ formatPoints (9)
     ✓ 正常數值 (4)
     ✓ 邊界情況 (5)

 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  ...
   Duration  ...
```

---

### Step 7：更新 CI Workflow

更新 `.github/workflows/ci.yml`，在 `lint` job 之後加入 `test` job：

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

  # 單元測試（Sprint 1: 允許失敗）
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    continue-on-error: true  # Sprint 1: 允許失敗，僅做監控
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

      - name: Run tests with coverage
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
    # Sprint 1 設計：build 依賴 lint 而非 test
    # 原因：測試尚在建置階段，允許失敗；但不應阻擋正常的建置流程
    # Sprint 5+ 可改為 needs: [lint, test]
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

      - name: Build project
        run: npm run build
```

#### CI 設計重點

| 設計 | 說明 |
|------|------|
| `continue-on-error: true` | 測試失敗不阻擋 CI |
| `needs: lint` | test job 需要 lint 通過 |
| `build.needs: lint` | build 依賴 lint 而非 test，避免被測試失敗阻擋 |
| `Upload coverage report` | 即使失敗也上傳覆蓋率報告 |

---

### Step 8：更新 .gitignore

在 `.gitignore` 加入覆蓋率報告目錄：

```
# 測試覆蓋率
coverage/
```

---

## 驗證清單

完成所有步驟後，請逐項驗證：

### ✅ 檔案驗證

確認以下檔案已建立/更新：

- [ ] `vitest.config.js` - 已建立
- [ ] `src/test/setup.js` - 已建立
- [ ] `src/test/helpers.js` - 已建立
- [ ] `src/utils/formatPoints.test.js` - 已建立
- [ ] `package.json` - 已更新腳本
- [ ] `.github/workflows/ci.yml` - 已更新
- [ ] `.gitignore` - 已更新

### ✅ 套件驗證

```bash
npm ls vitest @vue/test-utils happy-dom @vitest/coverage-v8
```

### ✅ 測試執行驗證

```bash
# 執行測試
npm run test

# 預期：所有測試通過
# ✓ src/utils/formatPoints.test.js (9)
```

### ✅ 覆蓋率驗證

```bash
# 執行覆蓋率
npm run test:coverage

# 預期：產生 coverage/ 目錄
ls coverage/
# 應包含：index.html, ...
```

### ✅ 監聽模式驗證

```bash
# 開啟監聽模式
npm run test:watch

# 預期：顯示測試結果，等待檔案變更
# 按 q 退出
```

---

## 常見問題排解

### Q1：執行測試時出現 "Cannot find module '@/...'" 錯誤

**原因**：路徑別名未正確設定

**解決方案**：確認 `vitest.config.js` 中有以下設定：

```javascript
alias: {
  '@': fileURLToPath(new URL('./src', import.meta.url))
}
```

同時確認 `resolve.alias` 也有相同設定。

---

### Q2：測試出現 "ReferenceError: describe is not defined"

**原因**：未啟用全域 API

**解決方案**：確認 `vitest.config.js` 中有：

```javascript
globals: true,
```

或在測試檔案中明確 import：

```javascript
import { describe, it, expect } from 'vitest'
```

---

### Q3：setup.js 中的 vi 未定義

**原因**：未從 vitest import

**解決方案**：在 `setup.js` 開頭加入：

```javascript
import { vi } from 'vitest'
```

---

### Q4：執行 test:coverage 時出錯

**原因**：@vitest/coverage-v8 未安裝

**解決方案**：

```bash
npm install -D @vitest/coverage-v8
```

---

### Q5：CI 中測試失敗但 build 未執行

**原因**：build job 可能依賴了 test job

**解決方案**：確認 `build.needs` 設定為 `lint` 而非 `test`：

```yaml
build:
  needs: lint  # 不是 needs: test
```

---

## Sprint 1 完成標準

Sprint 1 完成時，應達成以下標準：

| 標準 | 驗證方式 |
|------|----------|
| 測試框架可運作 | `npm run test` 執行成功 |
| 至少 1 個測試通過 | formatPoints.test.js 通過 |
| 覆蓋率報告可產生 | `npm run test:coverage` 產生 coverage/ |
| CI 包含測試 job | GitHub Actions 顯示 test job |
| 測試失敗不阻擋 build | build job 可獨立執行 |

### 預期覆蓋率

Sprint 1 結束時，預期整體覆蓋率約 0-5%（因為只有 1 個測試檔案）。

這是正常的，後續 Sprint 會逐步提升。

---

## 下一步

Sprint 1 完成後，請繼續：

- **Sprint 2：核心工具函數**（文檔待建立：`ci-cd-plan-2-2.md`）
  - 為 `utils/` 目錄撰寫更多測試
  - 目標：utils/ 覆蓋率達 70%+

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月  
> **參考**：[ci-cd-plan-2.md](./ci-cd-plan-2.md)
