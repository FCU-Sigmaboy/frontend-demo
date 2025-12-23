# 測試框架設定文件

## 概述

本項目使用 Vitest 作為主要測試框架，配合 Vue Test Utils 進行 Vue 組件測試，並整合 fast-check 進行屬性基礎測試。

## 測試框架配置

### 核心依賴

- **Vitest**: 快速的 Vite 原生測試框架
- **@vue/test-utils**: Vue 組件測試工具
- **jsdom**: DOM 環境模擬
- **@vitest/coverage-v8**: 代碼覆蓋率收集
- **fast-check**: 屬性基礎測試庫

### 配置檔案

- `vitest.config.js`: 主要測試配置
- `tests/setup/test-setup.js`: 全域測試設定
- `tests/setup/dom-setup.js`: DOM 環境初始化

## 目錄結構

```
tests/
├── unit/                    # 單元測試
│   ├── components/          # Vue 組件測試
│   ├── composables/        # Composables 測試
│   ├── stores/             # Pinia Store 測試
│   ├── utils/              # 工具函數測試
│   └── api/                # API 層測試
├── __mocks__/              # 模擬檔案
│   ├── supabase.js         # Supabase 模擬
│   └── vue-router.js       # Vue Router 模擬
├── fixtures/               # 測試資料
│   ├── user-data.js        # 用戶資料夾具
│   └── points-data.js      # 積分資料夾具
├── helpers/                # 測試輔助函數
│   └── test-utils.js       # 測試工具函數
└── setup/                  # 測試環境設定
    ├── test-setup.js       # 全域測試設定
    └── dom-setup.js        # DOM 環境設定
```

## 測試命令

```bash
# 執行所有測試
npm test

# 監視模式執行測試
npm run test:watch

# 執行測試並生成覆蓋率報告
npm run test:coverage

# 啟動測試 UI 介面
npm run test:ui
```

## 測試覆蓋率配置

### 覆蓋率閾值

- **全域閾值**:
  - 行覆蓋率: 80%
  - 函數覆蓋率: 80%
  - 分支覆蓋率: 75%
  - 語句覆蓋率: 80%

### 覆蓋率報告格式

- `text`: 終端文字報告
- `json`: JSON 格式報告
- `html`: HTML 視覺化報告
- `lcov`: LCOV 格式報告

## 模擬系統

### Supabase 模擬

- 完整的 Supabase 客戶端模擬
- 認證、資料庫、儲存功能模擬
- 即時訂閱功能模擬

### Vue Router 模擬

- 路由導航功能模擬
- 路由守衛模擬
- 路由參數和查詢模擬

### 全域模擬

- localStorage 和 sessionStorage
- ResizeObserver 和 IntersectionObserver
- 時間和隨機數控制

## 測試工具函數

### 組件測試工具

```javascript
import { mountComponent, shallowMountComponent } from '../helpers/test-utils.js'

// 標準組件掛載
const wrapper = mountComponent(MyComponent, {
  props: { title: 'Test' }
})

// 淺層掛載（不渲染子組件）
const wrapper = shallowMountComponent(MyComponent)
```

### 測試資料工廠

```javascript
import { createMockUser, createMockPointsProfile } from '../fixtures/user-data.js'

// 創建模擬用戶
const user = createMockUser({ email: 'test@example.com' })

// 創建模擬積分資料
const points = createMockPointsProfile({ current_balance: 1000 })
```

## 測試最佳實踐

### 測試命名規範

- 測試檔案使用 `.test.js` 或 `.spec.js` 後綴
- 測試描述使用清楚的動作和預期結果
- 使用 `describe` 區塊按功能分組測試

### 測試結構

```javascript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should do something', () => {
      // 測試實作
    })
  })
})
```

### 模擬使用

- 優先使用真實資料而非模擬
- 只在必要時使用模擬
- 確保模擬在測試間正確清理

## 屬性基礎測試

使用 fast-check 進行屬性基礎測試：

```javascript
import fc from 'fast-check'

it('should maintain property across all inputs', () => {
  fc.assert(fc.property(
    fc.integer(),
    (input) => {
      const result = myFunction(input)
      return result >= 0 // 屬性：結果總是非負數
    }
  ), { numRuns: 100 })
})
```

## 故障排除

### 常見問題

1. **DOM 相關錯誤**: 確保使用 jsdom 環境
2. **模擬未生效**: 檢查模擬檔案路徑和設定
3. **覆蓋率不準確**: 確認排除檔案設定正確
4. **測試間狀態洩漏**: 檢查清理機制是否正常運作

### 除錯技巧

- 使用 `console.log` 進行除錯（會在測試輸出中顯示）
- 使用 `wrapper.html()` 檢查組件渲染結果
- 使用 `vi.spyOn` 監視函數呼叫
- 使用 `await wrapper.vm.$nextTick()` 等待 Vue 更新

## 持續整合

測試框架已配置為支援 GitHub Actions 自動化執行：

- 每次 push 和 PR 時自動執行測試
- 生成覆蓋率報告並上傳
- 測試失敗時阻止合併

詳細的 CI/CD 配置將在後續任務中實作。