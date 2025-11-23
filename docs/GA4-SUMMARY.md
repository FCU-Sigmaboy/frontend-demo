# Google Analytics 4 實施摘要

## 專案概述

本專案為「台中易起來」本地交易平台實施完整的 Google Analytics 4 (GA4) 電商追蹤解決方案。

## 快速開始

### 1. 設定 GA4 Measurement ID

複製 `.env.example` 為 `.env` 並設定您的 GA4 Measurement ID：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. 啟動應用

```bash
npm install
npm run dev
```

應用啟動後，所有追蹤功能會自動運作。您可以在瀏覽器控制台看到追蹤事件的確認訊息。

## 已實施的功能

### ✅ 自動追蹤功能（無需額外代碼）

以下功能會自動運作，無需開發人員介入：

1. **頁面瀏覽追蹤** - 每次路由變更都會自動追蹤
2. **用戶識別** - 用戶登入時自動設定 user_id
3. **用戶屬性** - 自動追蹤用戶積分、減碳量等屬性

### ✅ 已整合的頁面追蹤

以下頁面已整合完整的事件追蹤：

#### 首頁 (HomePage.vue)
- 商品列表顯示時自動追蹤
- 搜尋功能追蹤
- 分類選擇追蹤
- 商品收藏追蹤
- 聯繫賣家追蹤

#### 商品詳情頁 (ItemDetailPage.vue)
- 商品瀏覽自動追蹤
- 聯繫賣家追蹤
- 商品收藏/取消收藏追蹤

#### 刊登商品頁 (CreateListingPage.vue)
- 開始刊登流程自動追蹤
- 完成刊登追蹤

### 📋 可用的追蹤函數

開發人員可以在任何組件中使用以下追蹤函數：

```javascript
import {
  trackViewItem,
  trackViewItemList,
  trackSearch,
  trackAddToWishlist,
  trackContactSeller,
  trackSelectCategory,
  trackBeginListing,
  trackCompleteListing,
  trackTransactionInitiated,
  trackTransactionAccepted,
  trackTransactionCompleted,
  // ... 更多函數
} from '@/composables/useAnalytics'
```

## 追蹤的事件類型

### GA4 標準電商事件

| 事件名稱 | 說明 | 已整合 |
|---------|------|--------|
| `page_view` | 頁面瀏覽 | ✅ 自動 |
| `view_item_list` | 瀏覽商品列表 | ✅ 首頁 |
| `view_item` | 瀏覽商品詳情 | ✅ 商品詳情頁 |
| `search` | 搜尋 | ✅ 首頁 |
| `add_to_wishlist` | 加入收藏 | ✅ 首頁、商品詳情頁 |
| `select_content` | 選擇內容（分類） | ✅ 首頁 |
| `login` | 登入 | ✅ 自動 |
| `purchase` | 完成交易 | 📝 待整合 |

### 自訂電商事件

| 事件名稱 | 說明 | 已整合 |
|---------|------|--------|
| `begin_listing` | 開始刊登 | ✅ 刊登頁面 |
| `complete_listing` | 完成刊登 | ✅ 刊登頁面 |
| `transaction_initiated` | 發起交易 | 📝 待整合 |
| `transaction_accepted` | 接受交易 | 📝 待整合 |
| `transaction_cancelled` | 取消交易 | 📝 待整合 |
| `contact_seller` | 聯繫賣家 | ✅ 首頁、商品詳情頁 |
| `submit_review` | 提交評價 | 📝 待整合 |
| `earn_points` | 獲得積分 | 📝 待整合 |

## 驗證追蹤是否正常運作

### 方法 1：瀏覽器控制台

開啟瀏覽器開發者工具（F12），在 Console 頁籤中會看到：

```
[Analytics] Event sent: view_item { item_id: "123", ... }
[Analytics] Event sent: search { search_term: "手機" }
```

### 方法 2：GA4 即時報表

1. 前往 [Google Analytics](https://analytics.google.com/)
2. 選擇您的資源
3. 點擊「報表」→「即時」
4. 在網站上進行操作（瀏覽商品、搜尋等）
5. 確認即時報表中顯示事件

### 方法 3：GA4 DebugView

1. 安裝 Chrome 擴充功能：[Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. 啟用擴充功能
3. 重新載入頁面
4. 前往 GA4 → 設定 → DebugView
5. 查看詳細的事件資訊

## GA4 資源設定建議

### 必要設定

在 Google Analytics 管理介面中：

1. **啟用電子商務評估**
   - 管理 → 資源設定 → 資料串流
   - 選擇您的網站串流
   - 增強型評估 → 啟用「電子商務評估」

2. **設定貨幣**
   - 管理 → 資源設定
   - 貨幣設定：TWD (新台幣)

### 建議的自訂維度

前往 管理 → 資源 → 自訂定義 → 自訂維度，建立以下維度：

| 維度名稱 | 參數名稱 | 範圍 |
|---------|---------|------|
| 用戶類型 | user_type | 使用者 |
| 商品分類 | item_category | 事件 |
| 商品狀態 | item_variant | 事件 |
| 交易方式 | transaction_type | 事件 |

### 建議的自訂指標

前往 管理 → 資源 → 自訂定義 → 自訂指標，建立以下指標：

| 指標名稱 | 參數名稱 | 單位 |
|---------|---------|------|
| 用戶積分 | total_points | 標準 |
| 減碳量 | carbon_saved_kg | 標準 |

## 隱私權合規

本實施已包含以下隱私權保護措施：

- ✅ **同意模式 (Consent Mode)**：預設拒絕廣告相關 cookies
- ✅ **IP 匿名化**：自動匿名化使用者 IP 位址
- ✅ **安全 Cookies**：使用 `SameSite=None;Secure` 標記

## 效能影響

- ✅ **非同步載入**：gtag.js 採用非同步載入，不阻塞頁面渲染
- ✅ **批次處理**：事件追蹤採用批次處理，降低網路請求
- ✅ **錯誤處理**：完整的錯誤處理，不影響主要功能
- ✅ **優雅降級**：GA4 未設定時不會中斷應用執行

## 常見問題

### Q: 為什麼看不到即時資料？

**A:** 請檢查：
1. `.env` 檔案中的 `VITE_GA_MEASUREMENT_ID` 是否正確
2. 瀏覽器控制台是否有錯誤訊息
3. 是否有廣告攔截器阻擋 GA4
4. 等待 1-2 分鐘，資料可能有延遲

### Q: 如何停用追蹤（用於開發）？

**A:** 有兩種方法：
1. 移除 `.env` 中的 `VITE_GA_MEASUREMENT_ID`
2. 安裝瀏覽器擴充功能：[Google Analytics Opt-out](https://tools.google.com/dlpage/gaoptout)

### Q: 如何在新頁面添加追蹤？

**A:** 在 Vue 組件中引入並使用追蹤函數：

```vue
<script setup>
import { trackViewItem } from '@/composables/useAnalytics'

// 在適當的時機呼叫追蹤函數
const handleProductClick = (product) => {
  trackViewItem(product)
  // ... 其他邏輯
}
</script>
```

### Q: 追蹤會影響網站效能嗎？

**A:** 影響極小。GA4 採用非同步載入和批次處理，對使用者體驗的影響可忽略不計。

## 後續建議

### 建議整合的頁面

以下頁面建議添加追蹤（已建立函數，只需整合）：

1. **交易頁面** (MyTransactionsPage.vue)
   - 追蹤交易發起、接受、完成、取消

2. **評價頁面** (MyReviewsPage.vue)
   - 追蹤評價提交

3. **地圖搜尋頁** (MapSearchPage.vue)
   - 追蹤地圖搜尋行為

4. **商品列表頁** (ItemListPage.vue)
   - 追蹤搜尋結果和篩選器使用

### 建議的報表

在 GA4 中建立以下探索報表：

1. **使用者交易漏斗**
   - 瀏覽商品 → 收藏 → 聯繫賣家 → 發起交易 → 完成交易

2. **刊登流程分析**
   - 開始刊登 → 完成刊登
   - 轉換率分析

3. **分類效能分析**
   - 各分類的瀏覽、收藏、交易數
   - 熱門分類排行

4. **用戶參與度分析**
   - 積分系統使用情況
   - 活躍用戶 vs 新用戶

## 相關文件

- 📖 [完整實施指南](./GA4-IMPLEMENTATION.md) - 詳細的技術文檔
- 📝 [README.md](../README.md) - 專案說明
- 🔧 [.env.example](../.env.example) - 環境變數範例

## 支援

如有問題或建議，請：
1. 查閱 [GA4-IMPLEMENTATION.md](./GA4-IMPLEMENTATION.md) 完整文檔
2. 檢查瀏覽器控制台的錯誤訊息
3. 聯繫開發團隊或提交 Issue

---

**實施狀態**：✅ 核心功能已完成並通過測試  
**安全性檢查**：✅ 無安全漏洞  
**代碼審查**：✅ 已通過  
**最後更新**：2025年11月
