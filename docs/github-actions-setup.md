# GitHub Actions 自動化測試設置指南

本文檔描述如何設置和維護專案的 CI/CD 工作流程。

## 工作流程檔案

| 檔案 | 用途 | 觸發條件 |
|------|------|----------|
| `test.yml` | 完整測試套件 | push 到主分支、手動觸發 |
| `pr-check.yml` | PR 快速檢查 | PR 開啟/更新 |
| `deploy.yml` | GitHub Pages 部署 | push 到主分支 |

## 分支保護設置

在 GitHub 儲存庫設置中，建議啟用以下分支保護規則：

### Required Status Checks
- **Require status checks to pass before merging**
  - 必要檢查 (required-checks)
  - 執行測試套件 (test)
  - 測試覆蓋率分析 (coverage)

### 建議設置
- Require branches to be up to date before merging
- Require conversation resolution before merging

## 快取策略

工作流程使用 npm 快取加速依賴安裝：

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

這會自動快取 `node_modules` 目錄，大幅減少 CI 執行時間。

## 並行執行策略

`test.yml` 使用矩陣策略並行執行測試：

1. **Node.js 版本矩陣**: 同時在 18.x 和 20.x 執行
2. **測試分組矩陣**: 按模組並行執行 (api, components, stores, composables, utils, helpers)

## 效能優化

### 1. 並行控制
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
同一分支上的新 push 會取消舊的執行中工作流程。

### 2. fail-fast: false
並行測試使用 `fail-fast: false`，確保所有測試組都完成執行，便於一次發現所有問題。

### 3. Artifact 復用
Coverage job 會下載 test job 產出的 artifacts，避免重複執行測試。

## 故障排除

### 常見問題

1. **測試超時**: 檢查是否有無限迴圈或未正確 mock 的網路請求
2. **覆蓋率不足**: 查看 coverage 報告找出未覆蓋的程式碼區塊
3. **權限錯誤**: 確認 workflow 有正確的 permissions 設置
