# CI/CD 五階段方案計劃書

> **專案名稱**：台中易起來 - 二手物品交易平台  
> **版本**：1.0.0  
> **日期**：2026 年 1 月  
> **文檔類型**：CI/CD 方案規劃書

---

## 目錄

- [概述](#概述)
- [現況分析](#現況分析)
- [五階段規劃](#五階段規劃)
  - [階段一：程式碼品質檢查](#階段一程式碼品質檢查)
  - [階段二：單元測試整合](#階段二單元測試整合)
  - [階段三：端對端測試](#階段三端對端測試)
  - [階段四：安全性與覆蓋率](#階段四安全性與覆蓋率)
  - [階段五：進階部署策略](#階段五進階部署策略)
- [實施時程表](#實施時程表)
- [風險評估與應對策略](#風險評估與應對策略)
- [預期成效](#預期成效)

---

## 概述

本文檔為「台中易起來」二手物品交易平台的 CI/CD（持續整合/持續部署）五階段方案計劃書。基於現有 `ci.yml` 中的規劃建議，制定循序漸進的實施方案，逐步提升專案的程式碼品質、測試覆蓋率、安全性及部署效率。

### 目標

1. **提升程式碼品質**：透過自動化檢查確保程式碼風格一致性
2. **增強系統可靠性**：透過完整的測試機制降低錯誤發生率
3. **保障應用安全性**：透過安全掃描及時發現並修復漏洞
4. **加速開發迭代**：透過自動化流程縮短發布週期

---

## 現況分析

### 現有 CI 配置（ci.yml）

目前專案的 CI workflow 包含以下步驟：

```yaml
jobs:
  build:
    steps:
      - Checkout repository     # 取得程式碼
      - Setup Node.js          # 設置 Node.js 20 環境
      - Install dependencies   # 安裝專案依賴 (npm ci)
      - Build project          # 建置專案 (npm run build)
```

### 現有 CD 配置（deploy.yml）

目前專案的 CD workflow 包含：

- **觸發條件**：推送到 `main`、`master` 或 `vibe` 分支
- **部署目標**：GitHub Pages
- **環境變數**：透過 GitHub Secrets 管理 Supabase 連線資訊

### 待改進項目

根據 `ci.yml` 中的建議，以下功能尚未實施：

| 功能 | 狀態 | 優先級 |
|------|------|--------|
| ESLint 程式碼檢查 | ❌ 未實施 | 高 |
| Prettier 格式化 | ❌ 未實施 | 高 |
| 單元測試 (Vitest) | ❌ 未實施 | 高 |
| E2E 測試 (Playwright) | ❌ 未實施 | 中 |
| 安全性掃描 | ❌ 未實施 | 高 |
| 程式碼覆蓋率 | ❌ 未實施 | 中 |
| Docker 容器化 | ❌ 未實施 | 低 |

---

## 五階段規劃

### 階段一：程式碼品質檢查

#### 目標

建立統一的程式碼風格規範，確保團隊協作時程式碼一致性，減少程式碼審查中的風格討論。

#### 工具選擇

| 工具 | 用途 | 版本建議 |
|------|------|----------|
| ESLint | JavaScript/Vue 程式碼靜態分析 | ^9.x |
| @eslint/js | ESLint 官方 JavaScript 規則 | 最新版 |
| eslint-plugin-vue | Vue.js 專用 ESLint 規則 | ^9.x |
| Prettier | 程式碼自動格式化 | ^3.x |
| eslint-config-prettier | 避免 ESLint 與 Prettier 衝突 | ^9.x |

#### 安裝指令

```bash
# 安裝 ESLint 及相關套件
npm install -D eslint @eslint/js eslint-plugin-vue

# 安裝 Prettier 及整合套件
npm install -D prettier eslint-config-prettier
```

#### 配置檔案

**eslint.config.js**

```javascript
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,vue}'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'warn',
      'no-console': 'warn'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**']
  }
]
```

**prettier.config.js**

```javascript
export default {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  vueIndentScriptAndStyle: true
}
```

#### package.json 腳本更新

```json
{
  "scripts": {
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs",
    "lint:fix": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix",
    "format": "prettier --write \"src/**/*.{js,vue,css,scss}\"",
    "format:check": "prettier --check \"src/**/*.{js,vue,css,scss}\""
  }
}
```

#### CI Workflow 更新

```yaml
jobs:
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
```

#### 預期成效

- ✅ 統一程式碼風格，減少團隊討論成本
- ✅ 自動發現潛在錯誤（未使用變數、語法問題）
- ✅ 提升程式碼可讀性與維護性

#### 實施時程

**預估時間**：1-2 週

---

### 階段二：單元測試整合

#### 目標

建立單元測試機制，確保核心功能邏輯正確，提供程式碼重構的安全網。

#### 工具選擇

| 工具 | 用途 | 版本建議 |
|------|------|----------|
| Vitest | 單元測試框架（Vite 原生支援） | ^2.x |
| @vue/test-utils | Vue 組件測試工具 | ^2.x |
| happy-dom | 輕量級 DOM 模擬環境 | ^15.x |

#### 安裝指令

```bash
npm install -D vitest @vue/test-utils happy-dom
```

#### 配置檔案

**vitest.config.js**

```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.js']
    }
  }
})
```

#### 測試範例

**src/utils/formatPoints.test.js**

```javascript
import { describe, it, expect } from 'vitest'
import { formatPoints } from './formatPoints'

describe('formatPoints', () => {
  it('should format points with comma separator', () => {
    expect(formatPoints(1000)).toBe('1,000')
    expect(formatPoints(1000000)).toBe('1,000,000')
  })

  it('should handle zero', () => {
    expect(formatPoints(0)).toBe('0')
  })

  it('should handle negative numbers', () => {
    expect(formatPoints(-500)).toBe('-500')
  })
})
```

**src/components/ProductCard.test.js**

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from './ProductCard.vue'

describe('ProductCard', () => {
  it('renders product title correctly', () => {
    const wrapper = mount(ProductCard, {
      props: {
        product: {
          id: 1,
          title: '測試商品',
          price: 100,
          imageUrl: '/test.jpg'
        }
      }
    })
    expect(wrapper.text()).toContain('測試商品')
  })

  it('displays formatted price', () => {
    const wrapper = mount(ProductCard, {
      props: {
        product: {
          id: 1,
          title: '測試商品',
          price: 1500,
          imageUrl: '/test.jpg'
        }
      }
    })
    expect(wrapper.text()).toContain('1,500')
  })
})
```

#### package.json 腳本更新

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

#### CI Workflow 更新

```yaml
jobs:
  test:
    name: Unit Tests
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

      - name: Run unit tests
        run: npm run test

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: coverage/
```

#### 測試覆蓋目標

| 模組 | 目標覆蓋率 | 優先級 |
|------|------------|--------|
| utils/ | 90%+ | 高 |
| stores/ | 80%+ | 高 |
| api/ | 70%+ | 中 |
| components/ | 60%+ | 中 |

#### 預期成效

- ✅ 確保核心業務邏輯正確性
- ✅ 提供重構安全網
- ✅ 提前發現迴歸錯誤

#### 實施時程

**預估時間**：2-3 週

---

### 階段三：端對端測試

#### 目標

建立端對端（E2E）測試機制，模擬真實使用者操作流程，確保整體系統功能正常運作。

#### 工具選擇

| 工具 | 用途 | 版本建議 |
|------|------|----------|
| Playwright | E2E 測試框架 | ^1.x |
| @playwright/test | Playwright 測試執行器 | ^1.x |

#### 安裝指令

```bash
# 安裝 Playwright
npm install -D @playwright/test

# 安裝瀏覽器
npx playwright install --with-deps
```

#### 配置檔案

**playwright.config.js**

```javascript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
})
```

#### 測試範例

**e2e/home.spec.js**

```javascript
import { test, expect } from '@playwright/test'

test.describe('首頁功能測試', () => {
  test('應正確載入首頁', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/台中易起來/)
    await expect(page.locator('header')).toBeVisible()
  })

  test('應顯示商品列表', async ({ page }) => {
    await page.goto('/')
    const productCards = page.locator('.product-card')
    await expect(productCards.first()).toBeVisible()
  })

  test('搜尋功能應正常運作', async ({ page }) => {
    await page.goto('/')
    await page.fill('[data-testid="search-input"]', '手機')
    await page.click('[data-testid="search-button"]')
    await expect(page).toHaveURL(/.*search.*手機.*/)
  })
})
```

**e2e/auth.spec.js**

```javascript
import { test, expect } from '@playwright/test'

test.describe('使用者認證流程', () => {
  test('未登入使用者應被導向登入頁', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('登入頁面應顯示 Google 登入按鈕', async ({ page }) => {
    await page.goto('/login')
    const googleButton = page.locator('[data-testid="google-login"]')
    await expect(googleButton).toBeVisible()
  })
})
```

**e2e/product.spec.js**

```javascript
import { test, expect } from '@playwright/test'

test.describe('商品功能測試', () => {
  test('商品詳情頁應顯示完整資訊', async ({ page }) => {
    await page.goto('/items')
    await page.locator('.product-card').first().click()
    
    await expect(page.locator('.product-title')).toBeVisible()
    await expect(page.locator('.product-price')).toBeVisible()
    await expect(page.locator('.product-description')).toBeVisible()
  })

  test('地圖搜尋應正常運作', async ({ page }) => {
    await page.goto('/map-search')
    await expect(page.locator('#map')).toBeVisible()
    
    // 等待地圖載入
    await page.waitForSelector('.leaflet-container')
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()
  })
})
```

#### package.json 腳本更新

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

#### CI Workflow 更新

```yaml
jobs:
  e2e:
    name: E2E Tests
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

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

#### E2E 測試場景規劃

| 測試場景 | 優先級 | 說明 |
|----------|--------|------|
| 首頁載入與導航 | 高 | 基礎功能驗證 |
| 使用者認證流程 | 高 | 登入/登出/權限 |
| 商品瀏覽與搜尋 | 高 | 核心業務流程 |
| 地圖搜尋功能 | 中 | 地理位置服務 |
| 交易流程 | 中 | 完整交易週期 |
| 即時通訊 | 中 | 訊息發送與接收 |
| 響應式設計 | 低 | 多裝置相容性 |

#### 預期成效

- ✅ 確保使用者關鍵流程正常運作
- ✅ 跨瀏覽器相容性驗證
- ✅ 提前發現整合問題

#### 實施時程

**預估時間**：2-3 週

---

### 階段四：安全性與覆蓋率

#### 目標

建立安全性掃描機制，確保專案無已知漏洞；同時整合程式碼覆蓋率報告，追蹤測試品質。

#### 工具選擇

| 工具 | 用途 | 說明 |
|------|------|------|
| npm audit | 依賴安全性掃描 | npm 內建功能 |
| Snyk | 進階安全性掃描 | 可選用 |
| @vitest/coverage-v8 | 程式碼覆蓋率 | Vitest 內建 |
| Codecov | 覆蓋率報告平台 | 雲端服務 |

#### 4.1 安全性掃描

##### npm audit 配置

```bash
# 基礎掃描
npm audit

# 僅報告中高危漏洞
npm audit --audit-level=moderate

# 自動修復
npm audit fix
```

##### CI Workflow 更新 - 安全掃描

```yaml
jobs:
  security:
    name: Security Scan
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

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Check for outdated packages
        run: npm outdated || true
```

##### Snyk 整合（可選）

```yaml
jobs:
  snyk:
    name: Snyk Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

#### 4.2 程式碼覆蓋率

##### Vitest 覆蓋率配置

**vitest.config.js 更新**

```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        'src/main.js',
        '**/*.d.ts'
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60
      }
    }
  }
})
```

##### Codecov 整合

```yaml
jobs:
  coverage:
    name: Code Coverage
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

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true
          verbose: true
```

##### 覆蓋率徽章

在 README.md 中加入覆蓋率徽章：

```markdown
[![codecov](https://codecov.io/gh/FCU-Sigmaboy/frontend/graph/badge.svg)](https://codecov.io/gh/FCU-Sigmaboy/frontend)
```

#### package.json 腳本更新

```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "test:coverage": "vitest run --coverage"
  }
}
```

#### 安全性政策

建立 **SECURITY.md**：

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a private issue.

We will respond within 48 hours.
```

#### 預期成效

- ✅ 及時發現並修復安全漏洞
- ✅ 追蹤測試覆蓋率趨勢
- ✅ 確保依賴套件安全性
- ✅ 建立安全回報機制

#### 實施時程

**預估時間**：1-2 週

---

### 階段五：進階部署策略

#### 目標

建立完整的多環境部署策略，支援 Docker 容器化，並實現更靈活的部署選項。

#### 5.1 Docker 容器化

##### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_BASE_PATH=/

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

# Production stage
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

##### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

##### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
    ports:
      - "3000:80"
    restart: unless-stopped
```

##### .dockerignore

```
node_modules
dist
.git
.github
*.md
.env*
!.env.example
```

#### 5.2 多環境部署

##### 環境配置

| 環境 | 分支 | 用途 | 部署目標 |
|------|------|------|----------|
| Development | `develop` | 開發測試 | 開發伺服器 |
| Staging | `staging` | 預發布驗證 | 測試環境 |
| Production | `main` | 正式環境 | GitHub Pages / Cloudflare |

##### 多環境 CI Workflow

```yaml
name: Multi-Environment Deploy

on:
  push:
    branches:
      - main
      - staging
      - develop

jobs:
  determine-environment:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}
    steps:
      - id: set-env
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" = "refs/heads/staging" ]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
          fi

  build-and-deploy:
    needs: determine-environment
    runs-on: ubuntu-latest
    environment: ${{ needs.determine-environment.outputs.environment }}
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

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_BASE_PATH: ${{ vars.VITE_BASE_PATH }}

      - name: Deploy to ${{ needs.determine-environment.outputs.environment }}
        run: echo "Deploying to ${{ needs.determine-environment.outputs.environment }}"
        # 根據環境執行不同部署步驟
```

#### 5.3 Docker 映像發布

##### GitHub Container Registry (GHCR)

```yaml
name: Build and Push Docker Image

on:
  release:
    types: [published]

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
            VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### 5.4 Node.js 多版本測試

```yaml
jobs:
  test-matrix:
    name: Test on Node ${{ matrix.node-version }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

#### package.json 腳本更新

```json
{
  "scripts": {
    "docker:build": "docker build -t taichung-marketplace .",
    "docker:run": "docker run -p 3000:80 taichung-marketplace",
    "docker:compose": "docker-compose up -d"
  }
}
```

#### 預期成效

- ✅ 支援 Docker 容器化部署
- ✅ 多環境隔離與管理
- ✅ 映像版本追蹤
- ✅ 跨版本相容性驗證

#### 實施時程

**預估時間**：2-3 週

---

## 實施時程表

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD 五階段實施時程表                               │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│    第 1-2 週  │   第 3-5 週   │   第 6-8 週   │   第 9-10 週  │  第 11-13 週  │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│   階段一      │    階段二     │    階段三     │    階段四     │    階段五     │
│  程式碼品質   │   單元測試    │   E2E 測試    │ 安全性與覆蓋率 │   進階部署    │
│              │              │              │              │              │
│ • ESLint     │ • Vitest     │ • Playwright │ • npm audit  │ • Docker     │
│ • Prettier   │ • Vue Test   │ • 瀏覽器測試  │ • Codecov    │ • 多環境     │
│              │   Utils      │              │ • 覆蓋率門檻  │ • GHCR       │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### 里程碑

| 里程碑 | 預計完成時間 | 關鍵成果 |
|--------|--------------|----------|
| M1 | 第 2 週 | ESLint + Prettier 整合完成，CI 自動執行 |
| M2 | 第 5 週 | 單元測試框架建立，核心功能覆蓋 |
| M3 | 第 8 週 | E2E 測試完成，關鍵流程驗證 |
| M4 | 第 10 週 | 安全掃描整合，覆蓋率報告上線 |
| M5 | 第 13 週 | Docker 部署就緒，多環境支援 |

---

## 風險評估與應對策略

### 風險一覽

| 風險項目 | 發生機率 | 影響程度 | 應對策略 |
|----------|----------|----------|----------|
| 團隊學習曲線 | 中 | 中 | 提供培訓文檔與工作坊 |
| 測試編寫耗時 | 高 | 中 | 優先覆蓋核心功能，逐步擴展 |
| CI 執行時間過長 | 中 | 低 | 使用快取、平行執行 |
| 第三方服務中斷 | 低 | 中 | 備用方案、本地替代 |
| 安全漏洞修復衝擊 | 中 | 高 | 定期更新、漏洞優先處理 |

### 緩解措施

1. **團隊培訓**：在每個階段開始前進行工具培訓
2. **漸進導入**：先在非關鍵功能測試，確認穩定後再推廣
3. **快取優化**：使用 npm cache 和 GitHub Actions cache
4. **平行執行**：獨立 jobs 平行運行，縮短總執行時間
5. **回滾機制**：保留舊版配置，必要時快速回滾

---

## 預期成效

### 量化指標

| 指標 | 當前值 | 階段五目標 |
|------|--------|------------|
| CI 執行時間 | ~2 分鐘 | < 10 分鐘 |
| 程式碼覆蓋率 | 0% | 60%+ |
| E2E 測試覆蓋 | 0 個 | 20+ 場景 |
| 安全漏洞數 | 未知 | 0 (critical/high) |
| 部署頻率 | 手動 | 每日自動 |

### 質化效益

1. **程式碼品質提升**
   - 統一的程式碼風格
   - 減少程式碼審查時間
   - 降低技術債務

2. **開發效率提升**
   - 自動化測試減少手動測試時間
   - 快速發現並定位問題
   - 增加重構信心

3. **系統穩定性提升**
   - 減少生產環境錯誤
   - 提前發現整合問題
   - 更快的問題響應

4. **安全性保障**
   - 及時發現安全漏洞
   - 依賴套件安全管理
   - 建立安全回報機制

---

## 附錄

### A. 完整 CI Workflow 範例

完整的 `ci.yml` 配置請參見專案根目錄下的 `.github/workflows/ci.yml`。

### B. 相關文檔連結

- [ESLint 官方文檔](https://eslint.org/)
- [Vitest 官方文檔](https://vitest.dev/)
- [Playwright 官方文檔](https://playwright.dev/)
- [Codecov 官方文檔](https://docs.codecov.com/)
- [Docker 官方文檔](https://docs.docker.com/)

### C. 參考資料

- GitHub Actions 官方文檔
- Vue.js 測試指南
- 前端 CI/CD 最佳實踐

---

> **文檔維護者**：FCU-Sigmaboy Team  
> **最後更新**：2026 年 1 月
