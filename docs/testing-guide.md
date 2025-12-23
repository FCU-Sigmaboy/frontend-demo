# 測試撰寫指南與最佳實踐

## 概述

本指南提供了在此專案中撰寫和維護測試的標準化方法。我們使用 Vitest 作為測試框架，配合 Vue Test Utils 進行 Vue 組件測試。

## 目錄

1. [測試框架概述](#測試框架概述)
2. [測試檔案結構](#測試檔案結構)
3. [測試命名規範](#測試命名規範)
4. [測試撰寫最佳實踐](#測試撰寫最佳實踐)
5. [Vue 組件測試](#vue-組件測試)
6. [API 層測試](#api-層測試)
7. [Store 狀態管理測試](#store-狀態管理測試)
8. [Composables 測試](#composables-測試)
9. [工具函數測試](#工具函數測試)
10. [模擬和測試替身](#模擬和測試替身)
11. [測試覆蓋率](#測試覆蓋率)
12. [開發工具和除錯](#開發工具和除錯)
13. [常見問題和解決方案](#常見問題和解決方案)

## 測試框架概述

### 核心技術棧

- **Vitest**: 主要測試框架，提供快速執行和熱重載
- **Vue Test Utils**: Vue 組件測試工具
- **jsdom**: DOM 環境模擬
- **fast-check**: 屬性測試框架
- **Pinia**: 狀態管理測試支援

### 測試類型

1. **單元測試**: 測試個別函數、組件或模組
2. **整合測試**: 測試多個模組間的互動
3. **屬性測試**: 使用隨機輸入驗證函數屬性
4. **端到端測試**: 完整用戶流程測試（未來實作）

## 測試檔案結構

### 目錄結構

```
tests/
├── unit/                    # 單元測試
│   ├── api/                # API 層測試
│   ├── stores/             # Store 測試
│   ├── composables/        # Composables 測試
│   ├── components/         # Vue 組件測試
│   └── utils/              # 工具函數測試
├── integration/            # 整合測試
├── helpers/                # 測試輔助工具
│   ├── coverage-config.js  # 覆蓋率配置
│   ├── coverage-reporter.js # 覆蓋率報告
│   ├── dev-reporter.js     # 開發報告工具
│   ├── test-debugger.js    # 測試除錯工具
│   └── watch-mode.js       # 監視模式控制
├── setup/                  # 測試設定
│   ├── test-setup.js       # 全域測試設定
│   └── dom-setup.js        # DOM 環境設定
└── fixtures/               # 測試資料
    ├── api-responses.js    # API 回應模擬資料
    ├── store-states.js     # Store 狀態資料
    └── component-props.js  # 組件 props 資料
```

### 檔案命名規範

- 測試檔案: `*.test.js` 或 `*.spec.js`
- 輔助工具: `*-helper.js` 或 `*-utils.js`
- 模擬資料: `*-fixtures.js` 或 `*-mocks.js`
- 設定檔案: `*-setup.js` 或 `*-config.js`

## 測試命名規範

### describe 區塊命名

```javascript
// ✅ 好的命名
describe('PointsBalanceCard', () => {
  describe('when user has points', () => {
    describe('and points are positive', () => {
      // 測試內容
    })
  })
})

// ❌ 避免的命名
describe('Test PointsBalanceCard', () => {
  describe('Test positive points', () => {
    // 測試內容
  })
})
```

### test/it 命名

```javascript
// ✅ 好的命名 - 描述行為和期望結果
it('should display formatted points when balance is positive', () => {})
it('should emit update event when balance changes', () => {})
it('should handle API errors gracefully', () => {})

// ❌ 避免的命名
it('test points display', () => {})
it('check balance', () => {})
it('API test', () => {})
```

### 命名模式

1. **行為描述**: `should [action] when [condition]`
2. **狀態驗證**: `should be [state] when [condition]`
3. **錯誤處理**: `should handle [error] gracefully`
4. **邊界情況**: `should work correctly with [edge case]`

## 測試撰寫最佳實踐

### AAA 模式 (Arrange, Act, Assert)

```javascript
it('should calculate total points correctly', () => {
  // Arrange - 準備測試資料
  const transactions = [
    { points: 100, type: 'earn' },
    { points: 50, type: 'spend' }
  ]
  
  // Act - 執行被測試的行為
  const total = calculateTotalPoints(transactions)
  
  // Assert - 驗證結果
  expect(total).toBe(50)
})
```

### 測試隔離

```javascript
describe('UserStore', () => {
  let store
  
  beforeEach(() => {
    // 每個測試前重置狀態
    setActivePinia(createPinia())
    store = useUserStore()
  })
  
  afterEach(() => {
    // 清理模擬和狀態
    vi.clearAllMocks()
  })
})
```

### 有意義的斷言

```javascript
// ✅ 具體的斷言
expect(user.points).toBe(150)
expect(response.status).toBe(200)
expect(component.find('.error-message').exists()).toBe(true)

// ❌ 模糊的斷言
expect(user).toBeTruthy()
expect(response).toBeDefined()
expect(component).toMatchSnapshot() // 過度依賴快照
```

## Vue 組件測試

### 基本組件掛載

```javascript
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard.vue'

describe('PointsBalanceCard', () => {
  let wrapper
  
  const createWrapper = (props = {}) => {
    return mount(PointsBalanceCard, {
      props: {
        balance: 100,
        ...props
      },
      global: {
        plugins: [createPinia()]
      }
    })
  }
  
  beforeEach(() => {
    wrapper = createWrapper()
  })
  
  afterEach(() => {
    wrapper.unmount()
  })
})
```

### Props 測試

```javascript
it('should display correct balance amount', () => {
  const wrapper = createWrapper({ balance: 250 })
  
  expect(wrapper.find('[data-testid="balance-amount"]').text()).toBe('250')
})

it('should handle zero balance', () => {
  const wrapper = createWrapper({ balance: 0 })
  
  expect(wrapper.find('[data-testid="balance-amount"]').text()).toBe('0')
  expect(wrapper.find('.zero-balance').exists()).toBe(true)
})
```

### 事件測試

```javascript
it('should emit refresh event when refresh button is clicked', async () => {
  const wrapper = createWrapper()
  
  await wrapper.find('[data-testid="refresh-button"]').trigger('click')
  
  expect(wrapper.emitted('refresh')).toHaveLength(1)
})
```

### 條件渲染測試

```javascript
it('should show loading state when data is loading', () => {
  const wrapper = createWrapper({ loading: true })
  
  expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="balance-content"]').exists()).toBe(false)
})
```

## API 層測試

### HTTP 請求模擬

```javascript
import { vi } from 'vitest'
import { pointsAPI } from '@/api/pointsAPI.js'

// 模擬 Supabase 客戶端
vi.mock('@/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))

describe('pointsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('getUserPoints', () => {
    it('should return user points successfully', async () => {
      // 設定模擬回應
      const mockResponse = { data: { points: 150 }, error: null }
      supabase.from().select().eq().single.mockResolvedValue(mockResponse)
      
      const result = await pointsAPI.getUserPoints('user123')
      
      expect(result).toEqual({ points: 150 })
      expect(supabase.from).toHaveBeenCalledWith('user_points')
    })
    
    it('should handle API errors gracefully', async () => {
      const mockError = { error: { message: 'Network error' } }
      supabase.from().select().eq().single.mockResolvedValue(mockError)
      
      await expect(pointsAPI.getUserPoints('user123')).rejects.toThrow('Network error')
    })
  })
})
```

### 錯誤處理測試

```javascript
it('should retry failed requests', async () => {
  // 第一次失敗，第二次成功
  supabase.from().select().eq().single
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ data: { points: 100 }, error: null })
  
  const result = await pointsAPI.getUserPoints('user123')
  
  expect(result).toEqual({ points: 100 })
  expect(supabase.from().select().eq().single).toHaveBeenCalledTimes(2)
})
```

## Store 狀態管理測試

### Pinia Store 測試

```javascript
import { setActivePinia, createPinia } from 'pinia'
import { usePointsStore } from '@/stores/points.js'

describe('PointsStore', () => {
  let store
  
  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePointsStore()
  })
  
  describe('actions', () => {
    it('should update points balance', async () => {
      // 模擬 API 回應
      vi.mocked(pointsAPI.getUserPoints).mockResolvedValue({ points: 200 })
      
      await store.fetchUserPoints('user123')
      
      expect(store.balance).toBe(200)
      expect(store.loading).toBe(false)
    })
    
    it('should handle loading states', async () => {
      const promise = store.fetchUserPoints('user123')
      
      expect(store.loading).toBe(true)
      
      await promise
      
      expect(store.loading).toBe(false)
    })
  })
  
  describe('getters', () => {
    it('should calculate formatted balance', () => {
      store.balance = 1234
      
      expect(store.formattedBalance).toBe('1,234')
    })
  })
})
```

## Composables 測試

### 響應式行為測試

```javascript
import { ref } from 'vue'
import { usePointsProfile } from '@/composables/usePointsProfile.js'

describe('usePointsProfile', () => {
  it('should reactively update profile data', async () => {
    const userId = ref('user123')
    const { profile, loading, refresh } = usePointsProfile(userId)
    
    // 模擬 API 回應
    vi.mocked(profileAPI.getProfile).mockResolvedValue({
      id: 'user123',
      points: 150
    })
    
    await refresh()
    
    expect(profile.value).toEqual({
      id: 'user123',
      points: 150
    })
    expect(loading.value).toBe(false)
  })
  
  it('should update when userId changes', async () => {
    const userId = ref('user123')
    const { profile } = usePointsProfile(userId)
    
    // 改變 userId
    userId.value = 'user456'
    
    await nextTick()
    
    expect(profileAPI.getProfile).toHaveBeenCalledWith('user456')
  })
})
```

## 工具函數測試

### 純函數測試

```javascript
import { formatPoints } from '@/utils/formatPoints.js'

describe('formatPoints', () => {
  it('should format positive numbers correctly', () => {
    expect(formatPoints(1234)).toBe('1,234')
    expect(formatPoints(1000000)).toBe('1,000,000')
  })
  
  it('should handle zero and negative numbers', () => {
    expect(formatPoints(0)).toBe('0')
    expect(formatPoints(-100)).toBe('-100')
  })
  
  it('should handle edge cases', () => {
    expect(formatPoints(null)).toBe('0')
    expect(formatPoints(undefined)).toBe('0')
    expect(formatPoints('invalid')).toBe('0')
  })
})
```

### 屬性測試

```javascript
import fc from 'fast-check'
import { formatPoints } from '@/utils/formatPoints.js'

describe('formatPoints properties', () => {
  it('should always return a string', () => {
    fc.assert(fc.property(
      fc.integer(),
      (num) => {
        const result = formatPoints(num)
        expect(typeof result).toBe('string')
      }
    ))
  })
  
  it('should preserve number magnitude', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 1000000 }),
      (num) => {
        const formatted = formatPoints(num)
        const parsed = parseInt(formatted.replace(/,/g, ''))
        expect(parsed).toBe(num)
      }
    ))
  })
})
```

## 模擬和測試替身

### 時間控制

```javascript
describe('time-sensitive operations', () => {
  beforeEach(() => {
    // 使用固定時間
    testHelpers.timeController.useFakeTimers('2024-01-01T00:00:00.000Z')
  })
  
  afterEach(() => {
    testHelpers.timeController.useRealTimers()
  })
  
  it('should handle time-based calculations', () => {
    const startTime = new Date()
    
    // 前進 1 小時
    testHelpers.timeController.advanceTime(60 * 60 * 1000)
    
    const endTime = new Date()
    const duration = endTime - startTime
    
    expect(duration).toBe(60 * 60 * 1000)
  })
})
```

### 隨機數控制

```javascript
describe('random-dependent functions', () => {
  beforeEach(() => {
    // 使用固定種子確保可重現性
    testHelpers.randomController.useMockRandom(12345)
  })
  
  afterEach(() => {
    testHelpers.randomController.useRealRandom()
  })
  
  it('should generate predictable random results', () => {
    const result1 = generateRandomId()
    const result2 = generateRandomId()
    
    // 重置隨機數序列
    testHelpers.randomController.useMockRandom(12345)
    
    const result3 = generateRandomId()
    
    expect(result3).toBe(result1) // 相同種子產生相同結果
  })
})
```

### 模組模擬

```javascript
// 完整模組模擬
vi.mock('@/api/pointsAPI.js', () => ({
  pointsAPI: {
    getUserPoints: vi.fn(),
    updatePoints: vi.fn(),
    getTransactionHistory: vi.fn()
  }
}))

// 部分模組模擬
vi.mock('@/utils/helpers.js', async () => {
  const actual = await vi.importActual('@/utils/helpers.js')
  return {
    ...actual,
    // 只模擬特定函數
    getCurrentTimestamp: vi.fn(() => '2024-01-01T00:00:00.000Z')
  }
})
```

## 測試覆蓋率

### 覆蓋率目標

- **API 層**: 90% 覆蓋率（最高優先級）
- **Store 狀態管理**: 85% 覆蓋率
- **核心 Composables**: 85% 覆蓋率
- **工具函數**: 100% 覆蓋率
- **Vue 組件**: 80% 覆蓋率
- **整體專案**: 80% 覆蓋率

### 覆蓋率檢查

```bash
# 生成覆蓋率報告
npm run test:coverage

# 檢查覆蓋率閾值
npm run test:coverage:check

# 生成 HTML 報告
npm run test:coverage:html
```

### 覆蓋率分析

```javascript
// 查看詳細覆蓋率報告
const report = require('./coverage/coverage-summary.json')

// 識別未覆蓋的程式碼
console.log('Uncovered lines:', report.uncoveredLines)
console.log('Uncovered functions:', report.uncoveredFunctions)
```

## 開發工具和除錯

### 監視模式

```bash
# 基本監視模式
npm run test:watch

# 開發模式（詳細輸出）
npm run test:watch:dev

# 除錯模式
npm run test:watch:debug
```

### 測試除錯

```javascript
// 在測試中使用除錯工具
describe('complex calculation', () => {
  it('should handle edge cases', () => {
    // 啟用除錯模式
    testHelpers.testDebugger.enable()
    
    // 設定斷點
    testHelpers.testDebugger.breakpoint('before calculation')
    
    const result = complexCalculation(input)
    
    // 檢查中間狀態
    testHelpers.testDebugger.inspect('result', result)
    
    expect(result).toBe(expected)
  })
})
```

### 效能監控

```bash
# 執行效能分析
npm run test:perf:analyze

# 查看效能趨勢
npm run test:perf:trend
```

## 常見問題和解決方案

### 1. 測試執行緩慢

**問題**: 測試執行時間過長

**解決方案**:
- 使用 `vi.mock()` 模擬外部依賴
- 避免真實的 HTTP 請求
- 使用假時間控制器
- 檢查是否有無限迴圈或記憶體洩漏

```javascript
// ❌ 緩慢的測試
it('should fetch data', async () => {
  const data = await fetch('/api/data') // 真實請求
  expect(data).toBeDefined()
})

// ✅ 快速的測試
it('should fetch data', async () => {
  vi.mocked(fetch).mockResolvedValue({ data: 'mock data' })
  const data = await fetchData()
  expect(data).toBe('mock data')
})
```

### 2. 測試間相互影響

**問題**: 測試結果不穩定，依賴執行順序

**解決方案**:
- 確保每個測試前後都清理狀態
- 使用獨立的測試資料
- 避免全域變數

```javascript
// ✅ 正確的測試隔離
describe('UserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia()) // 每次都創建新的 Pinia 實例
    vi.clearAllMocks() // 清理所有模擬
  })
})
```

### 3. Vue 組件測試錯誤

**問題**: 組件掛載失敗或找不到元素

**解決方案**:
- 確保提供必要的 props
- 模擬所需的全域插件
- 使用正確的選擇器

```javascript
// ✅ 完整的組件測試設定
const wrapper = mount(MyComponent, {
  props: { required: 'prop' },
  global: {
    plugins: [createPinia()],
    stubs: ['router-link']
  }
})
```

### 4. 非同步測試問題

**問題**: 非同步操作測試不穩定

**解決方案**:
- 使用 `await` 等待非同步操作
- 使用 `waitFor` 等待 DOM 更新
- 模擬非同步依賴

```javascript
// ✅ 正確的非同步測試
it('should update after async operation', async () => {
  const promise = store.fetchData()
  
  expect(store.loading).toBe(true)
  
  await promise
  
  expect(store.loading).toBe(false)
  expect(store.data).toBeDefined()
})
```

### 5. 模擬不生效

**問題**: `vi.mock()` 沒有按預期工作

**解決方案**:
- 確保模擬在 import 之前
- 使用正確的模組路徑
- 檢查模擬的返回值格式

```javascript
// ✅ 正確的模擬設定
vi.mock('@/api/pointsAPI.js', () => ({
  pointsAPI: {
    getUserPoints: vi.fn().mockResolvedValue({ points: 100 })
  }
}))

// 然後才 import
import { pointsAPI } from '@/api/pointsAPI.js'
```

---

## 結語

遵循這些指南和最佳實踐，可以確保測試的品質、可維護性和可靠性。記住：

1. **測試應該簡單明瞭** - 一個測試只驗證一個行為
2. **測試應該獨立** - 不依賴其他測試的執行結果
3. **測試應該快速** - 使用模擬避免外部依賴
4. **測試應該可重現** - 相同的輸入總是產生相同的結果
5. **測試應該有意義** - 測試重要的業務邏輯，而不是實作細節

持續改進測試品質，讓測試成為開發過程中的助力而非阻力。