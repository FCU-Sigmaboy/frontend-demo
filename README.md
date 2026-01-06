# 台中易起來 - 二手物品交易平台

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

**一個以環保永續為核心理念的現代化二手物品交易平台**

[線上展示](https://fcu-sigmaboy.github.io/frontend-demo/) | [專案文檔](./points-gamification-system/) | [功能特色](#-核心功能)

</div>

---

## 📋 目錄

- [專案簡介](#-專案簡介)
- [核心功能](#-核心功能)
- [技術架構](#-技術架構)
- [系統特色](#-系統特色)
- [專案結構](#-專案結構)
- [開始使用](#-開始使用)
- [部署方式](#-部署方式)
- [開發指南](#-開發指南)
- [專案亮點](#-專案亮點)
- [未來展望](#-未來展望)
- [團隊成員](#-團隊成員)
- [授權聲明](#-授權聲明)

---

## 🎯 專案簡介

「台中易起來」是一個現代化的二手物品交易平台，致力於促進循環經濟與永續發展。本專案為畢業專題作品，結合了現代前端技術與完整的業務邏輯，打造出兼具實用性與創新性的 Web 應用程式。

### 專案背景

在當前消費型社會中，物品的閒置與浪費問題日益嚴重。本平台透過建立便捷、安全的二手物品交易機制，讓使用者能夠輕鬆地將閒置物品轉讓給需要的人，同時也能以優惠價格取得二手好物，實現資源的最佳化利用。

### 設計理念

- **🌱 永續環保**：減少資源浪費，延長物品生命週期
- **🤝 信任機制**：建立完善的點數與信任等級系統
- **🎮 遊戲化設計**：透過成就系統提升使用者參與度
- **📱 行動優先**：響應式設計，完美支援各種裝置
- **🔒 安全可靠**：完整的身份驗證與交易保護機制

---

## ✨ 核心功能

### 1. 使用者系統
- **Google OAuth 整合**：快速便捷的第三方登入
- **個人檔案管理**：自訂頭像、暱稱、個人簡介
- **地理位置服務**：自動定位與位置管理
- **隱私設定**：完整的隱私控制與資料保護

### 2. 商品管理
- **智慧商品刊登**：
  - 支援多圖上傳與裁切
  - 圖片壓縮優化
  - 多層級分類系統
  - 即時價格建議
- **商品瀏覽**：
  - 多維度篩選與排序
  - 關鍵字搜尋
  - 收藏功能
  - 相似商品推薦

### 3. 地圖搜尋系統
- **Google Maps 整合**：
  - 互動式地圖介面
  - 自訂搜尋半徑（1-50 公里）
  - 地點標記與叢集
  - 使用者位置追蹤
- **進階篩選**：
  - 距離排序
  - 價格區間
  - 商品分類
  - 即時更新

### 4. 點數與遊戲化系統
本專案的一大亮點是完整的點數與遊戲化機制，詳細設計文檔請參見 [points-gamification-system](./points-gamification-system/)：

#### 點數系統
- **新手禮包**：註冊即贈送 500 點數
- **交易獎勵**：
  - 完成交易賺取點數
  - 交易紀錄完整追蹤
  - 點數歷史查詢
- **每日簽到**：
  - 連續簽到獎勵
  - 連勝紀錄追蹤

#### 信任等級制度
- **等級系統**：
  - 新手賣家 → 青銅 → 白銀 → 黃金 → 鑽石
  - 累積銷售額決定信任等級
  - 高價值商品需達特定等級才能刊登
- **成就徽章**：
  - 多層級成就系統
  - 達成里程碑獲得獎勵
  - 進度視覺化追蹤

#### 使用者儀表板
- 即時點數餘額顯示
- 交易歷史紀錄
- 成就與徽章展示
- 信任等級進度
- 連續簽到天數

### 5. 即時通訊系統
- **Supabase Realtime**：
  - 即時訊息推送
  - 線上狀態顯示
  - 打字狀態指示器
  - 訊息已讀回執
- **對話管理**：
  - 多對話列表
  - 訊息搜尋
  - 未讀計數
  - 訊息通知

### 6. 交易流程管理
- **完整交易生命週期**：
  1. 買家發起交易請求
  2. 賣家接受/拒絕
  3. 約定交易時間地點
  4. 交易完成確認
  5. 雙向評價系統
- **狀態追蹤**：
  - 待處理、進行中、已完成
  - 交易歷史查詢
  - 取消與退款機制

### 7. 社交功能
- **追蹤系統**：
  - 追蹤喜愛的賣家
  - 粉絲列表管理
  - 動態更新通知
- **評價系統**：
  - 五星評分
  - 文字評論
  - 評價歷史查詢
  - 信譽分數計算

---

## 🛠 技術架構

### 前端技術棧

#### 核心框架
- **Vue.js 3.5.22**
  - Composition API
  - `<script setup>` 語法
  - Reactivity System
  - Teleport & Suspense
  
#### 建構工具
- **Vite 7.1.7**
  - 極速熱更新（HMR）
  - 優化的打包輸出
  - 按需編譯
  
#### 狀態管理
- **Pinia 3.0.3**
  - 模組化 Store 設計
  - TypeScript 友善
  - DevTools 整合

#### 路由管理
- **Vue Router 4.6.3**
  - SPA 路由
  - 路由守衛
  - 懶加載

#### UI 框架
- **Bootstrap 5.3.8**
  - 響應式設計
  - 現代化組件
- **Bootstrap Vue Next 0.40.6**
  - Vue 3 整合
  - 豐富組件庫
- **Bootstrap Icons 1.13.1**
- **Font Awesome 6.5.1**

#### 地圖服務
- **Leaflet 1.9.4**
  - 開源地圖庫
  - 插件生態系統
- **Leaflet MarkerCluster 1.5.3**
  - 標記聚合
  - 效能優化

#### 工具函式庫
- **Lodash-es 4.17.21**
  - 函數式編程工具
  - Tree-shaking 支援

### 後端服務

#### BaaS 平台
- **Supabase**
  - PostgreSQL 資料庫
  - Row Level Security (RLS)
  - 即時訂閱（Realtime）
  - 檔案儲存（Storage）
  - 身份驗證（Auth）
  - Edge Functions

### 圖片處理
- **Browser Image Compression 2.0.2**
  - 客戶端圖片壓縮
  - 減少上傳頻寬
  - 提升使用者體驗

### 部署平台
- **GitHub Pages**
  - 靜態網站託管
  - 自動化 CI/CD
- **Cloudflare Pages**（備選）
  - CDN 加速
  - 全球分發

### 開發工具
- **Sass 1.93.2**
  - CSS 預處理器
  - 變數與混合
- **Wrangler 4.45.1**
  - Cloudflare 開發工具

---

## 🌟 系統特色

### 1. 完整的企業級架構

#### 分層架構設計
```
src/
├── views/          # 頁面層（20+ 頁面）
├── components/     # 組件層（可重用 UI 組件）
├── stores/         # 狀態管理層（Pinia）
├── api/            # API 層（25+ API 模組）
├── composables/    # 組合式函數
├── router/         # 路由配置
├── utils/          # 工具函數
└── assets/         # 靜態資源
```

#### API 模組化設計
- 單一職責原則（SRP）
- 錯誤處理機制
- 統一的 Response 格式
- API 快取策略

### 2. 效能優化實踐

#### 前端優化
- **程式碼分割**：路由層級的懶加載
- **圖片優化**：
  - WebP 格式支援
  - 響應式圖片
  - 懶加載技術
- **快取策略**：
  - Service Worker
  - Local Storage
  - API Response 快取

#### 載入優化
- Skeleton Screen 骨架屏
- 分頁與無限滾動
- 防抖與節流
- 資料預取

### 3. 安全性設計

#### 身份驗證
- OAuth 2.0 整合
- JWT Token 管理
- Session 持久化
- 自動登出機制

#### 資料安全
- Supabase Row Level Security
- XSS 防護
- CSRF 防護
- 輸入驗證與消毒

### 4. 使用者體驗

#### 響應式設計
- Mobile First 設計理念
- 斷點適配（xs, sm, md, lg, xl）
- 觸控友善介面
- PWA 支援準備

#### 互動設計
- 載入狀態反饋
- 錯誤提示
- 成功訊息
- 引導式操作

### 5. 即時性功能

#### Supabase Realtime 整合
- 訊息即時推送
- 在線狀態同步
- 交易狀態更新
- 通知系統

---

## 📁 專案結構

<details>
<summary>點擊展開完整結構</summary>

```
frontend-demo/
├── .github/                          # GitHub 配置
│   └── workflows/
│       ├── ci.yml                   # CI 持續整合（建置驗證）
│       └── deploy.yml               # CD 自動部署
├── .vscode/                         # VS Code 配置
│   └── extensions.json
├── public/                          # 靜態資源
│   ├── 404.html                    # GitHub Pages SPA 支援
│   └── vite.svg
├── src/
│   ├── api/                        # API 層（26 個模組）
│   │   ├── conversation.js         # 即時通訊 API
│   │   ├── pointsAPI.js           # 點數系統 API
│   │   ├── transactionsAPI.js     # 交易管理 API
│   │   ├── followAPI.js           # 追蹤系統 API
│   │   ├── favorite.js            # 收藏功能 API
│   │   ├── location.js            # 地理位置 API
│   │   ├── image.js               # 圖片處理 API
│   │   └── ...                    # 其他 API 模組
│   ├── assets/                     # 靜態資源
│   │   ├── badges/                # 成就徽章圖示
│   │   ├── Logo.png
│   │   └── icon.png
│   ├── components/                 # UI 組件（18+）
│   │   ├── map/                   # 地圖相關組件
│   │   │   ├── MapContainer.vue
│   │   │   ├── MapSidebar.vue
│   │   │   ├── MapSearchBar.vue
│   │   │   └── ...
│   │   ├── AppHeader.vue          # 頂部導航
│   │   ├── AppFooter.vue          # 底部資訊
│   │   ├── ProductCard.vue        # 商品卡片
│   │   ├── SearchBar.vue          # 搜尋列
│   │   ├── AchievementBadges.vue  # 成就徽章
│   │   ├── TransactionCard.vue    # 交易卡片
│   │   └── ...
│   ├── composables/                # 組合式函數
│   │   ├── useTransactionToast.js
│   │   └── useTypingCoordinator.js
│   ├── events/                     # 事件匯流排
│   │   ├── messageScrollBus.js
│   │   └── typingBus.js
│   ├── lib/
│   │   └── supabase.js            # Supabase 客戶端
│   ├── router/
│   │   └── index.js               # 路由配置
│   ├── stores/                     # Pinia 狀態管理
│   │   ├── auth.js                # 身份驗證
│   │   ├── message.js             # 訊息管理
│   │   ├── points.js              # 點數系統
│   │   ├── transaction.js         # 交易管理
│   │   ├── favorites.js           # 收藏管理
│   │   └── ...
│   ├── styles/                     # 全域樣式
│   ├── utils/                      # 工具函數
│   │   ├── filterFunctions.js
│   │   ├── sortFunctions.js
│   │   ├── formatPoints.js
│   │   └── ...
│   ├── views/                      # 頁面組件（20+）
│   │   ├── HomePage.vue           # 首頁
│   │   ├── ItemListPage.vue       # 商品列表
│   │   ├── ItemDetailPage.vue     # 商品詳情
│   │   ├── MapSearchPage.vue      # 地圖搜尋
│   │   ├── UserDashboardPage.vue  # 使用者儀表板
│   │   ├── MessagesPage.vue       # 訊息頁面
│   │   ├── CreateListingPage.vue  # 建立刊登
│   │   ├── MyTransactionsPage.vue # 我的交易
│   │   └── ...
│   ├── App.vue                     # 根組件
│   ├── main.js                     # 入口檔案
│   └── style.css                   # 全域樣式
├── points-gamification-system/     # 點數系統設計文檔
│   ├── requirements.md            # 需求文檔
│   ├── design.md                  # 設計文檔
│   ├── tasks.md                   # 實作計畫
│   ├── backend-api-recommendations.md
│   └── trophy-design-recommendations.md
├── .env.example                    # 環境變數範例
├── .gitignore
├── index.html                      # HTML 入口
├── package.json                    # 依賴管理
├── vite.config.js                  # Vite 配置
├── wrangler.toml                   # Cloudflare 配置
└── README.md                       # 本文檔
```

</details>

### 程式碼統計

- **總行數**：約 42,000+ 行
- **Vue 組件**：40+ 個
- **API 模組**：26 個
- **Store 模組**：6 個
- **工具函數**：10+ 個

---

## 🚀 開始使用

### 環境需求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 現代瀏覽器（Chrome, Firefox, Safari, Edge）

### 本地開發

#### 1. 克隆專案

```bash
git clone https://github.com/FCU-Sigmaboy/frontend-demo.git
cd frontend-demo
```

#### 2. 安裝依賴

```bash
npm install
```

#### 3. 環境變數設定

複製環境變數範例檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入 Supabase 配置：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4. 啟動開發伺服器

```bash
npm run dev
```

應用程式將在 `http://localhost:5173` 啟動

#### 5. 建構生產版本

```bash
npm run build
```

建構結果將輸出到 `dist/` 目錄

#### 6. 預覽生產版本

```bash
npm run preview
```

---

## 📦 部署方式

### CI/CD 配置

本專案使用 GitHub Actions 進行持續整合與部署。

#### Workflow 檔案

- **`ci.yml`** - 持續整合 (CI)：在每次 push 和 pull request 時執行建置驗證
- **`deploy.yml`** - 持續部署 (CD)：自動部署到 GitHub Pages

#### CI 流程（`ci.yml`）

1. **Checkout** - 取得程式碼
2. **Setup Node.js** - 設置 Node.js 20 環境
3. **Install dependencies** - 安裝專案依賴
4. **Build** - 建置專案驗證程式碼正確性

#### CD 部署流程（`deploy.yml`）

1. **推送程式碼**到 `main`、`master` 或 `vibe` 分支
2. **GitHub Actions** 自動觸發
3. **建構專案**（`npm run build`）
4. **部署到 GitHub Pages**

#### 進階 CI/CD 方案建議

未來可逐步加入以下功能來強化 CI/CD 流程：

| 方案 | 說明 | 安裝指令 |
|------|------|----------|
| **ESLint** | 程式碼風格檢查 | `npm install -D eslint @eslint/js eslint-plugin-vue` |
| **Prettier** | 程式碼格式化 | `npm install -D prettier` |
| **Vitest** | 單元測試框架 | `npm install -D vitest @vue/test-utils happy-dom` |
| **Playwright** | E2E 測試 | `npm install -D @playwright/test` |
| **Codecov** | 程式碼覆蓋率報告 | 在 workflow 中整合 `codecov/codecov-action` |
| **npm audit** | 安全性掃描 | 內建於 npm，無需額外安裝 |

詳細的進階配置範例請參閱 `.github/workflows/ci.yml` 中的註解。

#### 環境變數設定

在 GitHub Repository Settings > Secrets 中設定：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Cloudflare Pages 部署（選用）

```bash
# 安裝 Wrangler
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 部署
npm run build
wrangler pages publish dist
```

### 其他部署平台

本專案可輕鬆部署到：
- Vercel
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront

---

## 💻 開發指南

### 開發規範

#### 程式碼風格
- 使用 ES6+ 語法
- Composition API 優先
- `<script setup>` 語法
- 組件名稱使用 PascalCase
- Props 使用 camelCase

#### 提交規範

```
feat: 新增功能
fix: 修復錯誤
docs: 文檔更新
style: 程式碼格式調整
refactor: 重構
perf: 效能優化
test: 測試相關
chore: 建構工具或輔助工具變動
```

### 檔案命名規範

- **組件**：`PascalCase.vue`（例：`ProductCard.vue`）
- **頁面**：`PascalCasePage.vue`（例：`HomePage.vue`）
- **API**：`camelCaseAPI.js`（例：`get_itemsAPI.js`）
- **Store**：`camelCase.js`（例：`auth.js`）
- **工具**：`camelCase.js`（例：`formatPoints.js`）

### 新增功能流程

1. **建立分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **開發功能**
   - 新增/修改組件
   - 更新 API（如需要）
   - 更新 Store（如需要）

3. **測試**
   - 功能測試
   - 跨瀏覽器測試
   - 響應式測試

4. **提交程式碼**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **建立 Pull Request**

---

## 💡 專案亮點

### 技術亮點

#### 1. 完整的全端整合
- 前端 Vue 3 + 後端 Supabase
- 即時通訊整合
- 檔案上傳與管理
- 地理位置服務

#### 2. 企業級程式架構
- 清晰的分層架構
- 模組化設計
- 可維護性高
- 易於擴展

#### 3. 效能優化
- 程式碼分割與懶加載
- 圖片壓縮與優化
- API 快取策略
- 骨架屏載入

#### 4. 使用者體驗
- 響應式設計
- 直覺的操作流程
- 即時反饋
- 遊戲化設計

### 業務亮點

#### 1. 創新的點數系統
- 完整的經濟模型設計
- 信任等級機制
- 成就系統
- 詳細的系統設計文檔

#### 2. 社交與互動
- 追蹤與粉絲系統
- 即時通訊
- 評價機制
- 社群經營

#### 3. 地圖整合
- Google Maps API
- 半徑搜尋
- 位置追蹤
- 視覺化呈現

---

## 🔮 未來展望

### 短期規劃（1-3 個月）

- [ ] 新增 PWA 支援，實現離線功能
- [ ] 整合推播通知服務
- [ ] 實作更多支付方式整合
- [ ] 加強 SEO 優化
- [ ] 新增深色模式

### 中期規劃（3-6 個月）

- [ ] 開發原生 App（React Native / Flutter）
- [ ] 實作 AI 推薦系統
- [ ] 新增影片上傳功能
- [ ] 建立商家入駐系統
- [ ] 多語言支援（英文、日文）

### 長期規劃（6-12 個月）

- [ ] 區塊鏈整合（NFT 認證）
- [ ] 碳足跡追蹤系統
- [ ] 社群論壇功能
- [ ] 線上競標系統
- [ ] 企業版後台管理系統

---

## 👥 團隊成員

本專案為畢業專題作品，展現完整的軟體開發生命週期與技術整合能力。

### 開發範疇
- 系統架構設計與規劃
- 前端開發與實作
- UI/UX 設計與優化
- 後端服務整合
- 部署與維運

---

## 🎓 學習成果

### 技術能力提升

#### 前端開發
- ✅ Vue 3 Composition API 深度應用
- ✅ 狀態管理（Pinia）實戰經驗
- ✅ 響應式設計與 RWD 實作
- ✅ 前端效能優化技巧
- ✅ 模組化架構設計

#### 後端整合
- ✅ BaaS 平台應用（Supabase）
- ✅ RESTful API 設計
- ✅ 即時通訊實作
- ✅ 資料庫設計與優化
- ✅ 身份驗證與授權

#### DevOps
- ✅ Git 版本控制
- ✅ CI/CD 自動化部署
- ✅ GitHub Actions 實作
- ✅ 雲端服務部署

#### 軟體工程
- ✅ 需求分析與系統設計
- ✅ 專案管理與時程規劃
- ✅ 技術文檔撰寫
- ✅ 程式碼品質控管
- ✅ 團隊協作與溝通

---

## 📄 授權聲明

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

---

## 📞 聯絡資訊

如有任何問題或建議，歡迎透過以下方式聯繫：

- **GitHub Issues**：[提交 Issue](https://github.com/FCU-Sigmaboy/frontend-demo/issues)
- **GitHub Repository**：[專案首頁](https://github.com/FCU-Sigmaboy/frontend-demo)

---

## 🙏 致謝

感謝以下開源專案與服務：

- [Vue.js](https://vuejs.org/) - 漸進式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端建構工具
- [Supabase](https://supabase.com/) - 開源的 Firebase 替代方案
- [Bootstrap](https://getbootstrap.com/) - 強大的前端框架
- [Leaflet](https://leafletjs.com/) - 開源地圖庫
- [GitHub](https://github.com/) - 程式碼託管與協作平台

---

<div align="center">

**⭐ 如果這個專案對您有幫助，歡迎給個星星支持！**

Made with ❤️ by FCU-Sigmaboy Team

</div>
