# 測試覆蓋率配置和使用指南

## 概述

本項目已實作增強的測試覆蓋率報告系統，根據需求 2.1, 2.2, 2.3, 2.4, 2.5 提供：

- ✅ **分層覆蓋率閾值** - 不同模組有不同的覆蓋率要求
- ✅ **多格式報告** - 支援 HTML、JSON、LCOV、文字等格式
- ✅ **詳細錯誤處理** - 覆蓋率失敗時提供具體改善建議
- ✅ **優先級管理** - 根據業務重要性設定不同閾值

## 覆蓋率閾值配置

### 優先級分層

| 優先級 | 模組類型 | 覆蓋率要求 | 檔案範例 |
|--------|----------|------------|----------|
| **最高** | API 層 | 90% | `src/api/pointsAPI.js` |
| **高** | Store 狀態管理 | 85% | `src/stores/auth.js` |
| **高** | 核心 Composables | 85% | `src/composables/usePointsProfile.js` |
| **中** | 工具函數 | 100% | `src/utils/formatPoints.js` |
| **中** | 業務邏輯組件 | 80% | `src/components/dashboard/` |

### 全域閾值

- **行覆蓋率**: 80%
- **函數覆蓋率**: 80%
- **分支覆蓋率**: 75%
- **語句覆蓋率**: 80%

## 使用方式

### 基本命令

```bash
# 執行測試並生成覆蓋率報告
npm run test:coverage

# 執行覆蓋率檢查（包含詳細分析）
npm run test:coverage:check

# 生成 HTML 格式報告
npm run test:coverage:html

# CI/CD 模式（生成機器可讀格式）
npm run test:coverage:ci
```

### 報告格式

#### 1. 終端文字報告
```
📊 測試覆蓋率摘要報告
==================================================

🌐 全域覆蓋率統計:
   行覆蓋率:     85.5%
   函數覆蓋率:   90.2%
   分支覆蓋率:   78.9%
   語句覆蓋率:   87.1%

📋 按優先級分組的覆蓋率:
------------------------------
✅ 最高優先級 - API 層:
   目標閾值: 90%
   平均覆蓋率: 92.3%
   檔案數量: 3
```

#### 2. HTML 視覺化報告
- 位置: `coverage/enhanced-report.html`
- 包含互動式圖表和詳細檔案列表
- 支援按優先級篩選和排序

#### 3. JSON 機器可讀報告
- 位置: `coverage/enhanced-report.json`
- 適用於 CI/CD 整合和自動化分析

## 覆蓋率失敗處理

當覆蓋率低於閾值時，系統會提供詳細的改善建議：

```
❌ 覆蓋率閾值檢查失敗
==================================================

📊 最高優先級 - API 層 (1 個檔案)
------------------------------
📁 src/api/pointsAPI.js
   實際覆蓋率: 行 75% | 函數 80% | 分支 70% | 語句 78%
   期望覆蓋率: 行 90% | 函數 90% | 分支 85% | 語句 90%
   
   💡 改善建議:
      • 增加行覆蓋率測試 (目前: 75%, 需要: 90%)
      • 增加分支覆蓋率測試 (目前: 70%, 需要: 85%)
      • API 檔案建議: 測試所有端點、錯誤處理和邊界情況
```

## 配置自訂

### 修改閾值

編輯 `vitest.config.js` 中的 `coverage.thresholds` 區段：

```javascript
thresholds: {
  // 全域閾值
  global: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  },
  
  // 特定檔案閾值
  'src/api/newAPI.js': {
    lines: 95,
    functions: 95,
    branches: 90,
    statements: 95
  }
}
```

### 新增優先級

編輯 `tests/helpers/coverage-config.js` 中的 `COVERAGE_PRIORITIES`：

```javascript
export const COVERAGE_PRIORITIES = {
  // 新增自訂優先級
  CRITICAL_SECURITY: {
    threshold: 100,
    files: [
      'src/security/auth.js',
      'src/security/encryption.js'
    ]
  }
}
```

## CI/CD 整合

### GitHub Actions 範例

```yaml
- name: Run tests with coverage
  run: npm run test:coverage:ci

- name: Upload coverage reports
  uses: actions/upload-artifact@v3
  with:
    name: coverage-reports
    path: coverage/
```

### 覆蓋率趨勢追蹤

系統會生成 JSON 報告，可用於：
- 追蹤覆蓋率變化趨勢
- 設定覆蓋率下降警告
- 整合到品質監控儀表板

## 最佳實踐

### 1. 測試撰寫優先級
1. **API 層** - 優先測試所有端點和錯誤處理
2. **Store** - 確保狀態變更和副作用被測試
3. **工具函數** - 達到 100% 覆蓋率（相對容易）
4. **組件** - 專注於關鍵用戶互動

### 2. 覆蓋率改善策略
- 使用覆蓋率報告識別未測試的程式碼
- 優先處理高優先級模組的覆蓋率缺口
- 定期檢查覆蓋率趨勢，避免下降

### 3. 品質保證
- 設定 CI/CD 在覆蓋率下降時失敗
- 定期審查覆蓋率報告
- 將覆蓋率要求納入程式碼審查流程

## 故障排除

### 常見問題

1. **覆蓋率收集失敗**
   ```bash
   # 清理舊報告
   rm -rf coverage/
   npm run test:coverage
   ```

2. **閾值檢查錯誤**
   ```bash
   # 檢查配置
   node scripts/coverage-check.js --format=json
   ```

3. **報告生成失敗**
   ```bash
   # 手動生成報告
   npm run test:coverage
   node scripts/coverage-check.js --format=html
   ```

### 支援

如有問題，請檢查：
- `vitest.config.js` 配置是否正確
- `tests/helpers/coverage-config.js` 設定是否完整
- 測試檔案是否遵循命名規範 (`.test.js` 或 `.spec.js`)