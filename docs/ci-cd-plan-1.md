# 階段一：程式碼品質檢查 - 實作指引

> **階段**：Phase 1 - Code Quality  
> **預估時間**：1-2 週  
> **前置需求**：Node.js 18+, npm 9+  
> **文檔版本**：1.0.0

---

## 目錄

- [概述](#概述)
- [實作步驟](#實作步驟)
  - [Step 1：安裝依賴套件](#step-1安裝依賴套件)
  - [Step 2：建立 ESLint 配置檔](#step-2建立-eslint-配置檔)
  - [Step 3：建立 Prettier 配置檔](#step-3建立-prettier-配置檔)
  - [Step 4：更新 package.json 腳本](#step-4更新-packagejson-腳本)
  - [Step 5：建立 EditorConfig（可選）](#step-5建立-editorconfig可選)
  - [Step 6：設定 VS Code 整合（可選）](#step-6設定-vs-code-整合可選)
  - [Step 7：更新 CI Workflow](#step-7更新-ci-workflow)
- [驗證清單](#驗證清單)
- [常見問題排解](#常見問題排解)
- [規則說明與自訂](#規則說明與自訂)

---

## 概述

本文檔為 CI/CD 五階段計劃中「階段一：程式碼品質檢查」的詳細實作指引。透過整合 ESLint 和 Prettier，建立統一的程式碼風格規範，確保團隊協作時程式碼一致性。

### 目標

1. **靜態程式碼分析**：使用 ESLint 發現潛在錯誤與程式碼問題
2. **統一程式碼格式**：使用 Prettier 自動格式化程式碼
3. **CI 自動化檢查**：在每次提交時自動執行程式碼品質檢查
4. **開發體驗優化**：整合編輯器即時提示與自動修復

### 工具版本

| 工具 | 版本 | 說明 |
|------|------|------|
| eslint | ^9.x | JavaScript/Vue 靜態分析工具（使用新版 Flat Config 格式） |
| @eslint/js | 最新版 | ESLint 官方 JavaScript 規則 |
| eslint-plugin-vue | ^9.x | Vue.js 專用 ESLint 規則 |
| prettier | ^3.x | 程式碼自動格式化工具 |
| eslint-config-prettier | ^9.x | 避免 ESLint 與 Prettier 規則衝突 |

> ⚠️ **重要提示**：ESLint 9.x 引入了全新的 Flat Config 格式，使用 `eslint.config.js` 取代舊版的 `.eslintrc.*` 配置檔。此版本不向後相容舊版配置格式。

---

## 實作步驟

### Step 1：安裝依賴套件

在專案根目錄執行以下指令安裝所需套件：

```bash
# 安裝 ESLint 核心及 Vue 插件
npm install -D eslint @eslint/js eslint-plugin-vue

# 安裝 Prettier 及 ESLint 整合套件
npm install -D prettier eslint-config-prettier
```

#### 驗證安裝

```bash
# 確認套件已安裝
npm ls eslint prettier

# 預期輸出類似：
# ├── eslint@9.x.x
# ├── eslint-config-prettier@9.x.x
# ├── eslint-plugin-vue@9.x.x
# └── prettier@3.x.x
```

---

### Step 2：建立 ESLint 配置檔

在專案根目錄建立 `eslint.config.js` 檔案：

```javascript
// eslint.config.js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // JavaScript 推薦規則
  js.configs.recommended,

  // Vue.js 推薦規則（Flat Config 格式）
  ...pluginVue.configs['flat/recommended'],

  // 專案自訂規則
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // 瀏覽器全域變數
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
      }
    },
    rules: {
      // Vue 規則調整
      'vue/multi-word-component-names': 'off',        // 允許單字組件名稱
      'vue/no-unused-vars': 'warn',                   // 未使用的變數警告
      'vue/require-default-prop': 'off',              // 不強制要求預設 prop
      'vue/require-prop-types': 'warn',               // 建議定義 prop 類型
      
      // JavaScript 規則調整
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',                      // 忽略以 _ 開頭的參數
        varsIgnorePattern: '^_'                       // 忽略以 _ 開頭的變數
      }],
      'no-console': ['warn', { 
        allow: ['warn', 'error']                      // 允許 console.warn/error
      }],
      'no-debugger': 'warn',                          // debugger 語句警告
      'prefer-const': 'warn',                         // 建議使用 const
      'no-var': 'error',                              // 禁止使用 var
    }
  },

  // Prettier 整合（必須放在最後）
  eslintConfigPrettier,

  // 忽略檔案設定
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.min.js',
      'public/**',
      'coverage/**',
      '.git/**'
    ]
  }
]
```

#### 驗證 ESLint 配置

```bash
# 執行 ESLint 檢查（ESLint 9.x Flat Config 不需要 --ext 參數）
npx eslint src/

# 嚴格模式：任何警告都會導致失敗（建議用於 CI）
npx eslint src/ --max-warnings=0

# 檢查特定檔案
npx eslint src/App.vue
```

---

### Step 3：建立 Prettier 配置檔

在專案根目錄建立 `prettier.config.js` 檔案：

```javascript
// prettier.config.js
export default {
  // 基礎格式設定
  semi: false,                    // 不使用分號
  singleQuote: true,              // 使用單引號
  tabWidth: 2,                    // 縮排寬度 2 空格
  useTabs: false,                 // 使用空格而非 Tab
  
  // 程式碼寬度
  printWidth: 100,                // 每行最大字元數
  
  // 尾隨逗號
  trailingComma: 'es5',           // ES5 相容的尾隨逗號
  
  // 括號與空格
  bracketSpacing: true,           // 物件括號內加空格 { foo: bar }
  bracketSameLine: false,         // HTML 標籤 > 換行
  arrowParens: 'always',          // 箭頭函數參數總是加括號 (x) => x
  
  // Vue 檔案設定
  vueIndentScriptAndStyle: true,  // Vue 檔案 script/style 縮排
  singleAttributePerLine: false,  // 多屬性不強制換行
  
  // 其他
  endOfLine: 'lf',                // 使用 LF 換行符
  htmlWhitespaceSensitivity: 'css', // HTML 空白處理
  proseWrap: 'preserve',          // Markdown 不自動換行
}
```

#### 建立 .prettierignore 檔案

在專案根目錄建立 `.prettierignore` 檔案：

```
# 建置輸出
dist/
build/

# 依賴
node_modules/

# 套件鎖定檔案
package-lock.json
pnpm-lock.yaml
yarn.lock

# 自動產生的檔案
coverage/
*.min.js
*.min.css

# 其他
.git/
public/
```

#### 驗證 Prettier 配置

```bash
# 檢查格式問題
npx prettier --check "src/**/*.{js,vue,css,scss}"

# 自動修復格式
npx prettier --write "src/**/*.{js,vue,css,scss}"
```

---

### Step 4：更新 package.json 腳本

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
    "code-quality": "npm run lint && npm run format:check"
  }
}
```

> 📝 **ESLint 9.x 說明**：使用 Flat Config 格式時，檔案類型篩選在 `eslint.config.js` 的 `files` 屬性中定義，因此不再需要 `--ext` 參數。

```json
// 舊版 ESLint 8.x 寫法（參考用）
{
  "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs"
}
```

#### 腳本說明

| 腳本 | 說明 |
|------|------|
| `npm run lint` | 執行 ESLint 檢查，報告問題但不修改 |
| `npm run lint:fix` | 執行 ESLint 檢查並自動修復可修復的問題 |
| `npm run format` | 使用 Prettier 格式化所有原始碼 |
| `npm run format:check` | 檢查程式碼格式，不修改檔案 |
| `npm run code-quality` | 執行完整程式碼品質檢查（CI 使用） |

---

### Step 5：建立 EditorConfig（可選）

在專案根目錄建立 `.editorconfig` 檔案，確保跨編輯器一致性：

```ini
# .editorconfig
# https://editorconfig.org

root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

---

### Step 6：設定 VS Code 整合（可選）

更新 `.vscode/settings.json` 以整合 ESLint 和 Prettier：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": [
    "javascript",
    "vue"
  ]
}
```

#### 建議安裝的 VS Code 擴充功能

更新 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig"
  ]
}
```

---

### Step 7：更新 CI Workflow

更新 `.github/workflows/ci.yml` 加入程式碼品質檢查：

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

  # 建置驗證
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint  # 依賴 lint job 成功後才執行
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

## 驗證清單

完成上述步驟後，請依序驗證：

### ✅ 安裝驗證

```bash
# 確認所有套件已安裝
npm ls eslint prettier eslint-plugin-vue eslint-config-prettier @eslint/js
```

### ✅ 配置檔案驗證

確認以下檔案已建立：

- [ ] `eslint.config.js`
- [ ] `prettier.config.js`
- [ ] `.prettierignore`
- [ ] `.editorconfig`（可選）
- [ ] `.vscode/settings.json`（可選）

### ✅ 腳本驗證

```bash
# 測試 ESLint
npm run lint

# 測試 Prettier 檢查
npm run format:check

# 測試完整品質檢查
npm run code-quality
```

### ✅ 修復現有問題

```bash
# 自動修復 ESLint 問題
npm run lint:fix

# 自動格式化程式碼
npm run format
```

### ✅ CI 驗證

1. 提交變更到分支
2. 確認 GitHub Actions 正確觸發
3. 確認 `lint` job 成功執行

---

## 常見問題排解

### Q1：ESLint 報錯 "Parsing error: Unexpected token"

**原因**：ESLint 無法解析 Vue 檔案或新版 JavaScript 語法

**解決方案**：確認 `eslint-plugin-vue` 已安裝且版本正確

```bash
npm install -D eslint-plugin-vue@latest
```

### Q2：Prettier 與 ESLint 規則衝突

**原因**：兩者對同一規則有不同設定

**解決方案**：確認 `eslint-config-prettier` 放在 ESLint 配置的最後

```javascript
// eslint.config.js
export default [
  // ... 其他配置
  eslintConfigPrettier,  // 必須放在最後
]
```

### Q3：VS Code 儲存時沒有自動格式化

**解決方案**：

1. 確認已安裝 Prettier 擴充功能
2. 確認 `.vscode/settings.json` 配置正確
3. 重新載入 VS Code 視窗 (`Ctrl+Shift+P` → "Reload Window")

### Q4：CI 因 lint 錯誤失敗

**解決方案**：

```bash
# 本地執行相同檢查
npm run lint
npm run format:check

# 修復問題
npm run lint:fix
npm run format

# 提交修復
git add .
git commit -m "fix: resolve linting and formatting issues"
```

### Q5：某些檔案不想被檢查

**解決方案**：更新 `eslint.config.js` 的 `ignores` 區塊：

```javascript
{
  ignores: [
    'dist/**',
    'node_modules/**',
    'public/**',
    'src/legacy/**',  // 新增要忽略的路徑
  ]
}
```

---

## 規則說明與自訂

### ESLint 規則參考

| 規則 | 設定 | 說明 |
|------|------|------|
| `vue/multi-word-component-names` | `off` | 允許單字組件名（如 `App.vue`） |
| `vue/require-default-prop` | `off` | 不強制要求 prop 預設值 |
| `no-unused-vars` | `warn` | 未使用變數顯示警告 |
| `no-console` | `warn` | 允許 `console.warn/error` |
| `no-var` | `error` | 禁止使用 `var` |
| `prefer-const` | `warn` | 建議使用 `const` |

### 自訂規則

若需新增或修改規則，請編輯 `eslint.config.js` 的 `rules` 區塊：

```javascript
rules: {
  // 新增規則
  'vue/no-v-html': 'warn',           // 警告使用 v-html
  'vue/component-name-in-template-casing': ['error', 'PascalCase'],
  
  // 修改現有規則
  'no-console': 'error',             // 將 console 改為錯誤
}
```

### Prettier 選項參考

| 選項 | 設定 | 說明 |
|------|------|------|
| `semi` | `false` | 不使用分號 |
| `singleQuote` | `true` | 使用單引號 |
| `tabWidth` | `2` | 縮排 2 空格 |
| `printWidth` | `100` | 每行最大 100 字元 |
| `trailingComma` | `es5` | ES5 相容尾隨逗號 |
| `vueIndentScriptAndStyle` | `true` | Vue script/style 縮排 |

---

## 下一步

完成階段一後，請繼續進行：

- **[階段二：單元測試整合](./ci-cd-plan-2.md)**：Vitest + Vue Test Utils

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月  
> **參考**：[ci-cd-plan.md](./ci-cd-plan.md)
