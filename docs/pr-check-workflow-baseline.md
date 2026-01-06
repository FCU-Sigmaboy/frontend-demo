# PR 檢查 CI/CD Workflow 基礎方案

> **專案名稱**：台中易起來 - 二手物品交易平台  
> **版本**：1.0.0  
> **日期**：2026 年 1 月  
> **文檔類型**：PR 檢查 Workflow 基礎方案

---

## 目錄

- [概述](#概述)
- [現況分析](#現況分析)
  - [現有 CI Workflow](#現有-ci-workflow)
  - [現有工具配置](#現有工具配置)
  - [現有 npm 腳本](#現有-npm-腳本)
- [PR 檢查流程設計](#pr-檢查流程設計)
  - [檢查項目總覽](#檢查項目總覽)
  - [Jobs 依賴關係](#jobs-依賴關係)
  - [詳細檢查說明](#詳細檢查說明)
- [實施狀態與建議](#實施狀態與建議)
  - [已完成項目](#已完成項目)
  - [待改進項目](#待改進項目)
- [Workflow 配置範例](#workflow-配置範例)
- [驗證方式](#驗證方式)
- [後續發展路線圖](#後續發展路線圖)

---

## 概述

本文檔記錄「台中易起來」前端專案 PR（Pull Request）檢查的 CI/CD workflow 基礎方案。PR 檢查 workflow 旨在確保每次程式碼變更在合併前都經過自動化品質驗證，包含程式碼風格檢查、單元測試及建置驗證。

### 目標

1. **確保程式碼品質**：透過 ESLint 靜態分析和 Prettier 格式檢查
2. **驗證功能正確性**：透過 Vitest 單元測試驗證核心邏輯
3. **確保建置成功**：透過 `npm run build` 驗證專案可正確打包
4. **自動化檢查流程**：減少人工審查負擔，加速開發迭代

### 適用範圍

- 所有推送到 `main`、`master`、`vibe` 分支的程式碼
- 所有針對上述分支的 Pull Request

---

## 現況分析

### 現有 CI Workflow

目前專案已配置 `.github/workflows/ci.yml`，包含以下三個 jobs：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CI Workflow 架構圖                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐                                                      │
│   │     lint     │ ← 程式碼品質檢查（ESLint + Prettier）                 │
│   └──────┬───────┘                                                      │
│          │                                                              │
│          ├─────────────────────────────────┐                           │
│          │                                 │                           │
│          ▼                                 ▼                           │
│   ┌──────────────┐                 ┌──────────────┐                    │
│   │     test     │                 │    build     │                    │
│   │              │                 │              │                    │
│   │ (允許失敗)   │                 │ (必須成功)   │                    │
│   └──────────────┘                 └──────────────┘                    │
│   ↳ 單元測試 + 覆蓋率              ↳ 建置驗證                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Job 詳細說明

| Job | 名稱 | 依賴 | 失敗策略 | 說明 |
|-----|------|------|----------|------|
| `lint` | Code Quality | 無 | 阻擋 CI | ESLint + Prettier 檢查 |
| `test` | Unit Tests | `lint` | `continue-on-error: true` | Vitest 單元測試 |
| `build` | Build | `lint` | 阻擋 CI | 建置專案 |

### 現有工具配置

#### ESLint (`eslint.config.js`)

- 使用 ESLint 9.x Flat Config 格式
- 整合 `eslint-plugin-vue` 支援 Vue 3
- 整合 `eslint-config-prettier` 避免規則衝突
- 自訂規則包含：
  - `vue/multi-word-component-names`: off
  - `no-unused-vars`: warn（忽略 `_` 開頭的變數）
  - `no-console`: warn（允許 `console.warn/error`）
  - `no-var`: error

#### Prettier (`prettier.config.js`)

- 不使用分號 (`semi: false`)
- 使用單引號 (`singleQuote: true`)
- 縮排 2 空格 (`tabWidth: 2`)
- 每行最大 100 字元 (`printWidth: 100`)
- ES5 相容尾隨逗號 (`trailingComma: 'es5'`)
- Vue 檔案 script/style 縮排 (`vueIndentScriptAndStyle: true`)

#### Vitest (`vitest.config.js`)

- 測試環境：`happy-dom`
- 全域 API 啟用 (`globals: true`)
- 覆蓋率工具：`@vitest/coverage-v8`
- 目前未設定覆蓋率門檻（Sprint 1 階段）
- 設置檔：`./src/test/setup.js`

### 現有 npm 腳本

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

---

## PR 檢查流程設計

### 檢查項目總覽

PR 合併前必須通過以下檢查：

| 檢查項目 | 工具 | 命令 | 狀態 | 阻擋合併 |
|----------|------|------|------|----------|
| ESLint 靜態分析 | ESLint 9.x | `npm run lint` | ✅ 已實施 | 是 |
| Prettier 格式檢查 | Prettier 3.x | `npm run format:check` | ✅ 已實施 | 是 |
| 單元測試 | Vitest 4.x | `npm run test` | ✅ 已實施 | 否（監控中）|
| 測試覆蓋率 | @vitest/coverage-v8 | `npm run test:coverage` | ✅ 已實施 | 否（監控中）|
| 建置驗證 | Vite 7.x | `npm run build` | ✅ 已實施 | 是 |

### Jobs 依賴關係

```
觸發條件: push / pull_request to [main, master, vibe]
                    │
                    ▼
            ┌───────────────┐
            │     lint      │  ← 必須通過
            │ (Code Quality)│
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│     test      │       │    build      │
│ (Unit Tests)  │       │   (Build)     │
│               │       │               │
│ allow failure │       │ must pass     │
└───────────────┘       └───────────────┘
```

### 詳細檢查說明

#### 1. Code Quality Job (lint)

**目的**：確保程式碼符合團隊規範，維持一致的程式碼風格

**執行步驟**：

1. Checkout 程式碼
2. 設置 Node.js 20.x 環境（使用 npm 快取）
3. 安裝依賴 (`npm ci`)
4. 執行 ESLint (`npm run lint`)
5. 執行 Prettier 檢查 (`npm run format:check`)

**失敗處理**：

- ESLint 錯誤 → CI 失敗，阻擋合併
- Prettier 格式問題 → CI 失敗，阻擋合併
- ESLint 警告 → CI 通過，但建議處理

#### 2. Unit Tests Job (test)

**目的**：驗證核心功能邏輯正確性

**執行步驟**：

1. Checkout 程式碼
2. 設置 Node.js 20.x 環境（使用 npm 快取）
3. 安裝依賴 (`npm ci`)
4. 執行單元測試 (`npm run test`)
5. 執行測試覆蓋率 (`npm run test:coverage`)
6. 上傳覆蓋率報告作為 Artifact

**失敗處理**（目前 Sprint 1 階段）：

- 測試失敗 → CI 顯示失敗狀態，但不阻擋合併
- 使用 `continue-on-error: true` 設定

**未來規劃**：

- Sprint 3+：移除 `continue-on-error`，測試失敗將阻擋合併
- Sprint 5+：啟用覆蓋率門檻

#### 3. Build Job (build)

**目的**：確保專案可正確建置

**執行步驟**：

1. Checkout 程式碼
2. 設置 Node.js 20.x 環境（使用 npm 快取）
3. 安裝依賴 (`npm ci`)
4. 執行建置 (`npm run build`)

**失敗處理**：

- 建置失敗 → CI 失敗，阻擋合併

---

## 實施狀態與建議

### 已完成項目

| 項目 | 說明 | 配置檔案 |
|------|------|----------|
| ✅ ESLint 整合 | 使用 ESLint 9.x Flat Config | `eslint.config.js` |
| ✅ Prettier 整合 | 自動格式化配置 | `prettier.config.js` |
| ✅ Vitest 整合 | 單元測試框架 | `vitest.config.js` |
| ✅ CI Workflow | GitHub Actions 配置 | `.github/workflows/ci.yml` |
| ✅ 覆蓋率報告上傳 | Artifact 保留 7 天 | ci.yml 中配置 |
| ✅ npm 快取 | 加速 CI 執行 | ci.yml 中配置 |

### 待改進項目

| 項目 | 優先級 | 說明 | 參考文檔 |
|------|--------|------|----------|
| 🟡 啟用覆蓋率門檻 | 中 | 設定最低覆蓋率要求（建議 20% 起步） | ci-cd-plan-2.md |
| 🟡 測試必須通過 | 中 | 移除 `continue-on-error: true` | ci-cd-plan-2.md |
| 🟢 安全性掃描 | 低 | 加入 `npm audit` | ci-cd-plan.md |
| 🟢 E2E 測試 | 低 | Playwright 端對端測試 | ci-cd-plan.md |

---

## Workflow 配置範例

### 現有 PR 檢查 Workflow

```yaml
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
    continue-on-error: true  # Sprint 1: 允許失敗
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
        if: success() || failure()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  # 建置驗證
  build:
    name: Build
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

      - name: Build project
        run: npm run build
```

### 建議改進（Sprint 3+ 版本）

```yaml
# 移除 continue-on-error，測試失敗將阻擋合併
test:
  name: Unit Tests
  runs-on: ubuntu-latest
  needs: lint
  # 移除 continue-on-error
  steps:
    # ... 同上
```

---

## 驗證方式

### 本地驗證

在提交 PR 前，開發者可在本地執行以下命令驗證：

```bash
# 執行完整品質檢查
npm run code-quality

# 執行測試
npm run test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 執行建置
npm run build
```

### CI 驗證

1. 提交程式碼或開啟 PR
2. GitHub Actions 自動觸發 CI workflow
3. 在 PR 頁面查看 Checks 狀態
4. 所有必要檢查通過後可合併

### 覆蓋率報告查看

1. 進入 GitHub Actions 頁面
2. 選擇對應的 workflow run
3. 下載 `coverage-report` artifact
4. 開啟 `coverage/index.html` 查看詳細報告

---

## 後續發展路線圖

### 階段規劃

```
當前                                                               未來
  │                                                                  │
  ▼                                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 階段一   │ →  │ 階段二   │ →  │ 階段三   │ →  │ 階段四   │ →  │ 階段五   │
│ 程式碼   │    │ 單元測試 │    │ E2E測試 │    │ 安全性   │    │ 進階部署 │
│ 品質檢查 │    │ 整合     │    │ 整合    │    │ 與覆蓋率 │    │ 策略     │
│          │    │          │    │          │    │          │    │          │
│ ✅完成   │    │ 🔄進行中 │    │ ⏳待開始 │    │ ⏳待開始 │    │ ⏳待開始 │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
   ESLint        Vitest        Playwright     npm audit      Docker
   Prettier                                   Codecov        多環境
```

### 短期目標（1-2 週）

- [ ] 完成 Sprint 2 核心工具函數測試
- [ ] utils/ 目錄覆蓋率達 70%+
- [ ] 總體覆蓋率達 10-15%

### 中期目標（3-4 週）

- [ ] 完成 Sprint 3 狀態管理測試
- [ ] 啟用覆蓋率門檻（20%）
- [ ] 移除 `continue-on-error`，測試必須通過
- [ ] 總體覆蓋率達 30%+

### 長期目標（2-3 個月）

- [ ] 完成 E2E 測試整合
- [ ] 加入安全性掃描
- [ ] 覆蓋率達 60%+
- [ ] Docker 容器化部署

---

## 相關文檔

| 文檔 | 說明 |
|------|------|
| [ci-cd-plan.md](./ci-cd-plan.md) | CI/CD 五階段方案計劃書（總覽） |
| [ci-cd-plan-1.md](./ci-cd-plan-1.md) | 階段一：程式碼品質檢查實作指引 |
| [ci-cd-plan-2.md](./ci-cd-plan-2.md) | 階段二：單元測試整合實作指引 |
| [ci-cd-plan-2-1.md](./ci-cd-plan-2-1.md) | 階段二 Sprint 1：基礎建設 |
| [ci-cd-plan-2-2.md](./ci-cd-plan-2-2.md) | 階段二 Sprint 2：核心工具函數 |

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月
