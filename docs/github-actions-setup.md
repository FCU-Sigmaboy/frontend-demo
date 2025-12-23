# GitHub Actions 自動化測試設置指南

## 概述

本文件說明如何設置 GitHub Actions 自動化測試工作流程，實現需求 7.1, 7.2, 7.3, 7.5 中定義的自動化測試和 PR 阻止機制。

## 工作流程檔案

### 1. 主要測試工作流程 (`.github/workflows/test.yml`)

**功能:**
- 在推送到主要分支時自動執行測試
- 在 Pull Request 時執行完整測試套件
- 支援多 Node.js 版本的矩陣測試
- 並行執行不同類型的測試
- 生成覆蓋率報告和測試摘要

**觸發條件:**
- `push` 到 `main`, `master`, `vibe` 分支
- 所有 `pull_request`
- 手動觸發 (`workflow_dispatch`)

**作業 (Jobs):**
1. **test** - 基本測試執行 (Node.js 18.x, 20.x)
2. **coverage** - 覆蓋率分析和報告生成
3. **quality** - 程式碼品質檢查
4. **parallel-tests** - 按模組並行執行測試
5. **test-summary** - 測試結果彙總

### 2. PR 檢查工作流程 (`.github/workflows/pr-check.yml`)

**功能:**
- 提供必要的 PR 檢查，失敗時阻止合併
- 執行品質檢查並提供詳細報告
- 在 PR 中顯示覆蓋率變化

**作業 (Jobs):**
1. **required-checks** - 必要檢查 (阻止合併)
2. **quality-checks** - 品質檢查 (不阻止合併)

## 分支保護設置

為了實現需求 7.3 (測試失敗時阻止 PR 合併)，需要在 GitHub 儲存庫設置中配置分支保護規則。

### 設置步驟

1. 前往 GitHub 儲存庫 → Settings → Branches
2. 點擊 "Add rule" 或編輯現有規則
3. 配置以下設置:

```
Branch name pattern: main (或 master)

☑️ Restrict pushes that create files
☑️ Require a pull request before merging
  ☑️ Require approvals: 1
  ☑️ Dismiss stale PR approvals when new commits are pushed
  ☑️ Require review from code owners

☑️ Require status checks to pass before merging
  ☑️ Require branches to be up to date before merging
  
  Required status checks:
  - 必要檢查 (required-checks)
  - 執行測試套件 (test)
  - 測試覆蓋率分析 (coverage)
  - 程式碼品質檢查 (quality)

☑️ Require conversation resolution before merging
☑️ Include administrators
```

### 狀態檢查說明

| 檢查名稱 | 必要性 | 說明 |
|----------|--------|------|
| 必要檢查 | ✅ 必要 | 基本測試和覆蓋率檢查，失敗時阻止合併 |
| 執行測試套件 | ✅ 必要 | 完整的單元測試執行 |
| 測試覆蓋率分析 | ✅ 必要 | 覆蓋率閾值檢查 |
| 程式碼品質檢查 | ✅ 必要 | 測試結構和配置驗證 |
| 品質檢查 | ⚠️ 可選 | 額外品質資訊，不阻止合併 |

## 快取策略

### Node.js 依賴快取
```yaml
- name: 設置 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # 自動快取 node_modules
```

### 測試結果快取
- 測試結果保存為 artifacts，保留 7 天
- 覆蓋率報告保存為 artifacts，保留 30 天
- 支援跨作業的資料共享

## 並行執行策略

### 測試類型並行
```yaml
strategy:
  matrix:
    test-group: 
      - api
      - components  
      - stores
      - composables
      - utils
```

### Node.js 版本並行
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

## 報告整合

### 覆蓋率報告
- 自動上傳到 Codecov (如果配置)
- 在 PR 中顯示覆蓋率變化
- 生成 HTML 和 JSON 格式報告

### PR 註解
- 自動在 PR 中添加覆蓋率摘要
- 顯示測試執行狀態
- 提供改善建議

### 測試摘要
- 在 GitHub Actions 摘要中顯示詳細結果
- 包含所有作業的執行狀態
- 提供快速的視覺化回饋

## 效能優化

### 執行時間優化
- 並行執行不同測試類型
- 使用 npm ci 而非 npm install
- 啟用依賴快取

### 資源使用優化
- 限制並行作業數量
- 使用 ubuntu-latest (最快的執行環境)
- 合理設置 artifact 保留時間

## 故障排除

### 常見問題

1. **測試超時**
   - 檢查 `testTimeout` 設置
   - 確認測試中沒有無限迴圈
   - 檢查模擬設置是否正確

2. **覆蓋率收集失敗**
   - 確認 vitest.config.js 配置正確
   - 檢查檔案路徑是否正確
   - 驗證排除模式是否過於寬泛

3. **分支保護規則不生效**
   - 確認狀態檢查名稱與工作流程中的作業名稱一致
   - 檢查是否有管理員權限繞過規則
   - 驗證分支名稱模式是否正確

### 除錯技巧

1. **啟用除錯日誌**
   ```yaml
   env:
     ACTIONS_STEP_DEBUG: true
     ACTIONS_RUNNER_DEBUG: true
   ```

2. **檢查工作流程語法**
   ```bash
   # 使用 GitHub CLI 驗證工作流程
   gh workflow view test.yml
   ```

3. **本地測試**
   ```bash
   # 使用 act 在本地執行 GitHub Actions
   act pull_request
   ```

## 監控和維護

### 定期檢查項目
- [ ] 工作流程執行時間是否合理 (< 10 分鐘)
- [ ] 覆蓋率報告是否正常生成
- [ ] 分支保護規則是否有效
- [ ] Artifact 儲存空間使用情況

### 效能指標
- 平均測試執行時間
- 覆蓋率趨勢
- 測試失敗率
- PR 合併時間

### 更新維護
- 定期更新 GitHub Actions 版本
- 檢查 Node.js 版本支援
- 更新測試依賴版本
- 檢視和優化工作流程配置

## 相關文件

- [測試覆蓋率指南](./coverage-guide.md)
- [Vitest 配置文件](../vitest.config.js)
- [測試結構說明](../tests/README.md)