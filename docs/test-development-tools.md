# 測試開發工具指南

本指南介紹如何使用專案中的測試監視模式和開發工具，以提升測試開發體驗和除錯效率。

## 目錄

- [快速開始](#快速開始)
- [監視模式](#監視模式)
- [開發者報告器](#開發者報告器)
- [測試除錯工具](#測試除錯工具)
- [性能監控](#性能監控)
- [故障排除](#故障排除)
- [最佳實踐](#最佳實踐)

## 快速開始

### 基本測試命令

```bash
# 執行所有測試
npm test

# 監視模式（檔案變更時自動重新執行）
npm run test:watch

# 開發模式（詳細輸出）
npm run test:dev

# 除錯模式（啟用除錯工具）
npm run test:debug

# 性能分析
npm run test:perf
```

### 開發環境設定

在開發過程中，建議使用以下環境變數：

```bash
# 啟用開發模式
NODE_ENV=development

# 啟用測試除錯
DEBUG_TESTS=true

# 啟用詳細日誌
VITEST_LOG_LEVEL=verbose
```

## 監視模式

### 基本監視模式

```bash
# 標準監視模式
npm run test:watch

# 開發者友好的監視模式
npm run test:watch:dev

# 除錯監視模式
npm run test:watch:debug
```

### 監視模式功能

在監視模式下，您可以使用以下鍵盤快捷鍵：

- `r` - 重新執行所有測試
- `f` - 只重新執行失敗的測試
- `c` - 清除控制台
- `p` - 切換性能指標顯示
- `v` - 切換詳細錯誤輸出
- `q` - 退出監視模式

### 智能檔案監視

監視模式會自動監視以下檔案變更：

- `src/**/*.{js,ts,vue}` - 源代碼檔案
- `tests/**/*.{js,ts,vue}` - 測試檔案
- `*.config.{js,ts}` - 配置檔案
- `package.json` - 依賴變更

## 開發者報告器

### 功能特色

開發者報告器提供以下增強功能：

1. **彩色輸出** - 使用顏色區分不同類型的測試結果
2. **詳細錯誤報告** - 包含堆疊追蹤和修復建議
3. **性能指標** - 顯示測試執行時間和記憶體使用
4. **分組顯示** - 按檔案分組顯示測試結果
5. **智能建議** - 根據錯誤類型提供修復建議

### 配置選項

您可以在測試中自定義報告器行為：

```javascript
import { createDeveloperReporter } from '../tests/helpers/dev-reporter.js'

const reporter = createDeveloperReporter({
  showPassedTests: true,    // 顯示通過的測試
  showSkippedTests: true,   // 顯示跳過的測試
  showPerformance: true,    // 顯示性能指標
  verboseErrors: true,      // 詳細錯誤輸出
  colorOutput: true,        // 彩色輸出
  maxErrorLines: 20         // 最大錯誤行數
})
```

## 測試除錯工具

### 啟用除錯模式

```bash
# 方法 1: 使用環境變數
DEBUG_TESTS=true npm test

# 方法 2: 使用預定義腳本
npm run test:debug
```

### 除錯函數

在除錯模式下，您可以在測試中使用以下全域函數：

#### debug() - 除錯輸出

```javascript
test('example test', () => {
  const data = { name: 'test', value: 123 }
  debug('檢查資料', data)
  
  // 測試邏輯...
})
```

#### breakpoint() - 設置斷點

```javascript
test('complex test', () => {
  const result = complexCalculation()
  breakpoint('計算完成', { result })
  
  // 繼續測試...
})
```

#### watch() - 監視變數

```javascript
test('variable tracking', () => {
  let counter = 0
  
  for (let i = 0; i < 5; i++) {
    counter += i
    watch('counter', counter)
  }
})
```

#### inspect() - 檢查物件

```javascript
test('object inspection', () => {
  const component = mount(MyComponent)
  inspect(component.vm, 'Component Instance')
  inspect(component.element, 'DOM Element')
})
```

#### trace() - 追蹤函數呼叫

```javascript
test('function tracing', () => {
  function myFunction(a, b) {
    const result = a + b
    trace('myFunction', [a, b], result)
    return result
  }
  
  myFunction(1, 2)
})
```

### 故障排除助手

除錯工具包含智能故障排除功能，會自動分析錯誤並提供解決建議：

```javascript
// 自動分析常見錯誤
try {
  // 測試代碼
} catch (error) {
  // 故障排除助手會自動提供建議
  printTroubleshootingHelp(error)
}
```

## 性能監控

### 基本性能分析

```bash
# 執行測試並收集性能資料
npm run test:perf

# 分析性能結果
npm run test:perf:analyze

# 查看性能趨勢
npm run test:perf:trend
```

### 性能指標

性能監控會追蹤以下指標：

1. **測試執行時間** - 個別測試和總體執行時間
2. **記憶體使用** - 堆記憶體使用情況
3. **慢測試識別** - 超過閾值的測試
4. **性能趨勢** - 歷史性能變化

### 性能閾值

預設的性能閾值：

- 慢測試警告：> 1 秒
- 慢測試錯誤：> 5 秒
- 記憶體警告：> 100MB
- 記憶體錯誤：> 200MB

### 自定義性能監控

```javascript
import { performanceAnalyzer } from '../tests/helpers/watch-mode.js'

beforeEach(() => {
  performanceAnalyzer.startAnalysis()
})

afterEach(() => {
  performanceAnalyzer.endAnalysis()
  const report = performanceAnalyzer.getPerformanceReport()
  
  if (report.slowTests.length > 0) {
    console.log('發現慢測試:', report.slowTests)
  }
})
```

## 故障排除

### 常見問題和解決方案

#### 1. 測試執行緩慢

**症狀**: 測試執行時間過長

**解決方案**:
- 檢查是否有無限迴圈
- 使用 `test.concurrent()` 並行執行獨立測試
- 減少測試中的 DOM 操作
- 優化測試資料生成

#### 2. 記憶體洩漏

**症狀**: 記憶體使用持續增長

**解決方案**:
- 確保在 `afterEach()` 中清理資源
- 檢查事件監聽器是否正確移除
- 驗證模擬物件是否正確重置

#### 3. 測試不穩定

**症狀**: 測試結果不一致

**解決方案**:
- 使用固定的隨機種子
- 避免依賴系統時間
- 確保測試間的狀態隔離

#### 4. Vue 組件測試問題

**症狀**: 組件掛載或渲染失敗

**解決方案**:
- 檢查組件依賴是否正確模擬
- 驗證 props 和 slots 配置
- 確保 Pinia store 正確設定

### 除錯技巧

1. **使用 console.log()** - 在關鍵點輸出變數值
2. **添加斷點** - 使用 `debugger;` 語句暫停執行
3. **檢查模擬設定** - 驗證模擬函數是否正確配置
4. **隔離測試** - 單獨執行有問題的測試
5. **查看完整堆疊** - 啟用詳細錯誤輸出

## 最佳實踐

### 開發工作流程

1. **開始開發**
   ```bash
   npm run test:watch:dev
   ```

2. **遇到問題時**
   ```bash
   npm run test:debug
   ```

3. **性能檢查**
   ```bash
   npm run test:perf:analyze
   ```

4. **提交前檢查**
   ```bash
   npm run test:coverage
   ```

### 測試撰寫建議

1. **使用描述性的測試名稱**
   ```javascript
   test('should calculate total price including tax', () => {
     // 測試邏輯
   })
   ```

2. **適當使用除錯工具**
   ```javascript
   test('complex calculation', () => {
     const input = generateTestData()
     debug('輸入資料', input)
     
     const result = complexFunction(input)
     inspect(result, '計算結果')
     
     expect(result).toBeDefined()
   })
   ```

3. **監控性能**
   ```javascript
   test('performance critical function', () => {
     const startTime = performance.now()
     
     // 執行測試
     const result = performanceFunction()
     
     const duration = performance.now() - startTime
     if (duration > 100) {
       console.warn(`測試執行時間過長: ${duration}ms`)
     }
   })
   ```

### 團隊協作

1. **共享除錯配置** - 將除錯設定加入版本控制
2. **記錄性能基準** - 定期檢查性能趨勢
3. **分享故障排除經驗** - 更新常見問題解決方案
4. **統一開發環境** - 使用相同的測試工具配置

## 進階功能

### 自定義報告器

```javascript
import { DeveloperTestReporter } from '../tests/helpers/dev-reporter.js'

class CustomReporter extends DeveloperTestReporter {
  onTestFinish(test) {
    super.onTestFinish(test)
    
    // 自定義邏輯
    if (test.result?.state === 'fail') {
      this.sendSlackNotification(test)
    }
  }
}
```

### 擴展除錯工具

```javascript
import { testDebugger } from '../tests/helpers/test-debugger.js'

// 添加自定義除錯函數
testDebugger.addCustomDebugger('apiCall', (url, response) => {
  console.log(`API 呼叫: ${url}`)
  console.log(`回應:`, response)
})
```

### 整合 CI/CD

```yaml
# GitHub Actions 範例
- name: Run tests with performance monitoring
  run: |
    npm run test:perf
    npm run test:perf:analyze
    
- name: Upload performance report
  uses: actions/upload-artifact@v2
  with:
    name: performance-report
    path: coverage/performance-report.json
```

## 結論

這些測試開發工具旨在提升開發體驗和測試效率。通過合理使用監視模式、除錯工具和性能監控，您可以：

- 更快地識別和修復問題
- 提高測試的可靠性和性能
- 改善整體的開發工作流程

如有任何問題或建議，請參考專案的 GitHub Issues 或聯繫開發團隊。