# 測試快速入門指南

## 新開發者必讀

這是一個快速入門指南，幫助新加入的開發者快速上手專案的測試框架。

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 執行測試

```bash
# 執行所有測試
npm run test

# 監視模式（推薦開發時使用）
npm run test:watch

# 開發模式（詳細輸出）
npm run test:watch:dev

# 覆蓋率報告
npm run test:coverage
```

### 3. 創建你的第一個測試

```javascript
// tests/unit/utils/my-function.test.js
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/utils/myFunction.js'

describe('myFunction', () => {
  it('should return expected result', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = myFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

## 📁 測試檔案放置位置

| 測試類型 | 檔案位置 | 範例 |
|---------|---------|------|
| API 測試 | `tests/unit/api/` | `pointsAPI.test.js` |
| Store 測試 | `tests/unit/stores/` | `auth.test.js` |
| 組件測試 | `tests/unit/components/` | `PointsCard.test.js` |
| 工具函數測試 | `tests/unit/utils/` | `formatPoints.test.js` |
| Composables 測試 | `tests/unit/composables/` | `usePoints.test.js` |

## 🧪 常用測試模式

### Vue 組件測試

```javascript
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  const createWrapper = (props = {}) => {
    return mount(MyComponent, {
      props,
      global: {
        plugins: [createPinia()]
      }
    })
  }

  it('should render correctly', () => {
    const wrapper = createWrapper({ title: 'Test' })
    
    expect(wrapper.find('h1').text()).toBe('Test')
  })
})
```

### API 測試

```javascript
import { vi } from 'vitest'
import { pointsAPI } from '@/api/pointsAPI.js'

// 模擬 Supabase
vi.mock('@/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { points: 100 } })
    }))
  }
}))

describe('pointsAPI', () => {
  it('should fetch user points', async () => {
    const result = await pointsAPI.getUserPoints('user123')
    
    expect(result).toEqual({ points: 100 })
  })
})
```

### Store 測試

```javascript
import { setActivePinia, createPinia } from 'pinia'
import { usePointsStore } from '@/stores/points.js'

describe('PointsStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePointsStore()
  })

  it('should update balance', () => {
    store.updateBalance(150)
    
    expect(store.balance).toBe(150)
  })
})
```

## 🛠️ 常用工具和輔助函數

### 全域測試輔助工具

```javascript
// 在測試中可以使用的全域工具
global.testHelpers = {
  timeController,      // 時間控制
  randomController,    // 隨機數控制
  mockCleanupSystem   // 模擬清理系統
}

// 使用範例
testHelpers.timeController.useFakeTimers('2024-01-01')
testHelpers.randomController.useMockRandom(12345)
```

### 時間控制

```javascript
describe('time-dependent test', () => {
  beforeEach(() => {
    testHelpers.timeController.useFakeTimers('2024-01-01T00:00:00Z')
  })

  afterEach(() => {
    testHelpers.timeController.useRealTimers()
  })

  it('should handle time progression', () => {
    const start = new Date()
    
    // 前進 1 小時
    testHelpers.timeController.advanceTime(60 * 60 * 1000)
    
    const end = new Date()
    expect(end - start).toBe(60 * 60 * 1000)
  })
})
```

## 📊 測試覆蓋率目標

| 模組類型 | 覆蓋率目標 | 優先級 |
|---------|-----------|--------|
| API 層 | 90% | 最高 |
| Store | 85% | 高 |
| Composables | 85% | 高 |
| 工具函數 | 100% | 中 |
| Vue 組件 | 80% | 中 |

## 🔧 開發工具

### 監視模式快捷鍵

在 `npm run test:watch` 模式下：

- `a` - 執行所有測試
- `f` - 只執行失敗的測試
- `t` - 按測試名稱過濾
- `p` - 按檔案名稱過濾
- `q` - 退出監視模式

### 除錯模式

```bash
# 啟用除錯模式
npm run test:watch:debug
```

在測試中使用除錯工具：

```javascript
it('should debug complex logic', () => {
  testHelpers.testDebugger.enable()
  testHelpers.testDebugger.breakpoint('checkpoint 1')
  
  // 你的測試邏輯
  
  testHelpers.testDebugger.inspect('variable', someVariable)
})
```

## ❌ 常見錯誤和解決方案

### 1. 模擬不生效

```javascript
// ❌ 錯誤：模擬在 import 之後
import { myAPI } from '@/api/myAPI.js'
vi.mock('@/api/myAPI.js')

// ✅ 正確：模擬在 import 之前
vi.mock('@/api/myAPI.js', () => ({
  myAPI: { getData: vi.fn() }
}))
import { myAPI } from '@/api/myAPI.js'
```

### 2. 非同步測試失敗

```javascript
// ❌ 錯誤：沒有等待非同步操作
it('should fetch data', () => {
  store.fetchData()
  expect(store.data).toBeDefined() // 可能還沒完成
})

// ✅ 正確：等待非同步操作
it('should fetch data', async () => {
  await store.fetchData()
  expect(store.data).toBeDefined()
})
```

### 3. 組件測試找不到元素

```javascript
// ❌ 錯誤：沒有提供必要的 props
const wrapper = mount(MyComponent)
expect(wrapper.find('.title').text()).toBe('Hello')

// ✅ 正確：提供必要的 props
const wrapper = mount(MyComponent, {
  props: { title: 'Hello' }
})
expect(wrapper.find('.title').text()).toBe('Hello')
```

## 📚 進階學習

1. **詳細指南**: 閱讀 `docs/testing-guide.md`
2. **覆蓋率分析**: 查看 `coverage/index.html`
3. **效能監控**: 使用 `npm run test:perf:analyze`
4. **屬性測試**: 學習 fast-check 的使用

## 🆘 需要幫助？

1. 查看現有測試範例：`tests/unit/` 目錄
2. 閱讀完整測試指南：`docs/testing-guide.md`
3. 檢查測試覆蓋率報告：`coverage/index.html`
4. 使用除錯模式：`npm run test:watch:debug`

## ✅ 檢查清單

在提交程式碼前，確保：

- [ ] 所有測試通過：`npm run test`
- [ ] 覆蓋率達標：`npm run test:coverage:check`
- [ ] 新功能有對應測試
- [ ] 測試命名清晰描述行為
- [ ] 沒有跳過的測試（除非有充分理由）
- [ ] 清理了 console.log 和除錯程式碼

---

**記住**：好的測試是最好的文件，也是重構的安全網。投資時間寫好測試，會讓你的開發更有信心！