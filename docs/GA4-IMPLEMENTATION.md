# Google Analytics 4 (GA4) 電商追蹤實施指南

## 概述

本專案已整合 Google Analytics 4 (GA4) 電商增強型測量，用於追蹤「台中易起來」本地交易平台的用戶行為和商業指標。

## 配置步驟

### 1. 設定環境變數

在專案根目錄創建 `.env` 檔案（參考 `.env.example`）：

```bash
# Google Analytics 4
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**如何獲取 Measurement ID：**
1. 前往 [Google Analytics](https://analytics.google.com/)
2. 建立新的 GA4 資源（Property）
3. 在「資料串流」中選擇「網站」
4. 複製「評估 ID」（格式為 G-XXXXXXXXXX）

### 2. GA4 資源建議設定

在 Google Analytics 管理介面中：

**資料串流設定：**
- ✅ 啟用「增強型評估」
- ✅ 啟用「網頁瀏覽」
- ✅ 啟用「捲動」
- ✅ 啟用「連出點擊」
- ✅ 啟用「網站搜尋」
- ✅ 啟用「影片參與」
- ✅ 啟用「檔案下載」

**電子商務設定：**
- 啟用「電子商務評估」
- 設定貨幣為「TWD (新台幣)」

**自訂維度建議：**
| 維度名稱 | 參數名稱 | 範圍 | 說明 |
|---------|---------|------|------|
| 用戶類型 | user_type | 使用者 | active_user/new_user |
| 商品分類 | item_category | 事件 | 商品所屬分類 |
| 商品狀態 | item_variant | 事件 | 全新/二手 |
| 交易方式 | transaction_type | 事件 | 面交/其他 |
| 積分獲得原因 | points_reason | 事件 | 積分來源 |

**自訂指標建議：**
| 指標名稱 | 參數名稱 | 單位 | 說明 |
|---------|---------|------|------|
| 用戶積分 | total_points | 標準 | 用戶總積分 |
| 減碳量 | carbon_saved_kg | 標準 | 累計減碳公斤數 |

## 追蹤事件清單

### 核心電商事件（GA4 標準事件）

| 事件名稱 | 說明 | 觸發時機 |
|---------|------|---------|
| `page_view` | 頁面瀏覽 | 每次路由變更 |
| `view_item_list` | 瀏覽商品列表 | 首頁、搜尋結果頁 |
| `view_item` | 瀏覽商品詳情 | 進入商品詳情頁 |
| `search` | 搜尋 | 執行商品搜尋 |
| `add_to_wishlist` | 加入收藏 | 點擊收藏按鈕 |
| `select_content` | 選擇內容 | 點擊分類 |
| `login` | 登入 | Google 登入成功 |
| `purchase` | 完成交易 | 交易狀態變更為完成 |

### 自訂電商事件

| 事件名稱 | 說明 | 參數 |
|---------|------|------|
| `begin_listing` | 開始刊登 | - |
| `complete_listing` | 完成刊登 | item_id, item_name, price, category |
| `transaction_initiated` | 發起交易 | transaction_id, value, item_id |
| `transaction_accepted` | 接受交易 | transaction_id, value |
| `transaction_cancelled` | 取消交易 | transaction_id |
| `contact_seller` | 聯繫賣家 | item_id, seller_id |
| `submit_review` | 提交評價 | rating, item_id |
| `earn_points` | 獲得積分 | value, points_reason |
| `map_search` | 地圖搜尋 | latitude, longitude |
| `follow_user` | 關注用戶 | followed_user_id |

## 使用方式

### 在 Vue 組件中使用

```vue
<script setup>
import { 
  trackViewItem, 
  trackAddToWishlist,
  trackSearch 
} from '@/composables/useAnalytics'

// 追蹤商品瀏覽
const viewProduct = (product) => {
  trackViewItem(product)
}

// 追蹤加入收藏
const addToFavorites = (product) => {
  trackAddToWishlist(product)
}

// 追蹤搜尋
const handleSearch = (searchTerm) => {
  trackSearch(searchTerm)
}
</script>
```

### 商品資料格式

追蹤事件時，商品物件應包含以下欄位：

```javascript
const product = {
  item_id: '123',           // 商品 ID (必填)
  title: '商品名稱',         // 商品名稱 (必填)
  category_name: '電子產品', // 分類名稱
  price: 1000,              // 價格 (必填)
  condition: '二手',        // 商品狀態
  location: '台中市'        // 地點
}
```

### 交易資料格式

```javascript
const transaction = {
  transaction_id: 'TXN123',     // 交易 ID (必填)
  item_id: '123',               // 商品 ID
  item_name: '商品名稱',        // 商品名稱
  amount: 1000,                 // 金額 (必填)
  transaction_type: '面交',     // 交易方式
  category: '電子產品'          // 分類
}
```

## 已整合的頁面和功能

### ✅ 基礎設定
- [x] GA4 環境變數配置
- [x] gtag.js 初始化
- [x] 同意模式 (Consent Mode)
- [x] 頁面瀏覽自動追蹤
- [x] 用戶識別追蹤

### ✅ 核心功能
- [x] 路由變更追蹤
- [x] 用戶登入追蹤
- [x] 用戶屬性設定（積分、減碳量等）

### 📝 待整合的頁面（建議）

以下是建議在各頁面添加追蹤的位置：

#### 1. 首頁 (HomePage.vue)
```javascript
// 商品列表顯示時
trackViewItemList(products, '首頁推薦')

// 搜尋功能
trackSearch(searchTerm)

// 點擊分類
trackSelectCategory(categoryName, categoryId)

// 收藏商品
trackAddToWishlist(product)
```

#### 2. 商品詳情頁 (ItemDetailPage.vue)
```javascript
// 頁面載入時
trackViewItem(product)

// 聯繫賣家
trackContactSeller(product, sellerId)

// 收藏/取消收藏
trackAddToWishlist(product)
trackRemoveFromWishlist(product)
```

#### 3. 商品列表頁 (ItemListPage.vue)
```javascript
// 顯示搜尋結果
trackViewItemList(searchResults, '搜尋結果')

// 使用篩選器
trackFilterUsage({ type: 'category', value: categoryName })
```

#### 4. 刊登商品頁 (CreateListingPage.vue)
```javascript
// 開始刊登流程
onMounted(() => {
  trackBeginListing()
})

// 完成刊登
const submitListing = async () => {
  // ... 刊登邏輯
  trackCompleteListing(newItem)
}
```

#### 5. 交易頁面 (MyTransactionsPage.vue)
```javascript
// 發起交易
trackTransactionInitiated(transaction)

// 接受交易
trackTransactionAccepted(transaction)

// 完成交易
trackTransactionCompleted(transaction)

// 取消交易
trackTransactionCancelled(transaction)
```

#### 6. 評價頁面 (MyReviewsPage.vue)
```javascript
// 提交評價
trackSubmitReview(rating, itemId)
```

#### 7. 關注功能
```javascript
// 關注用戶
trackFollowUser(userId)

// 取消關注
trackUnfollowUser(userId)
```

#### 8. 地圖搜尋 (MapSearchPage.vue)
```javascript
// 使用地圖搜尋
trackMapSearch({ 
  latitude: lat, 
  longitude: lng,
  name: locationName 
})
```

## 測試和驗證

### 1. 開發環境測試

在瀏覽器控制台檢查 Analytics 事件：
```javascript
// 所有事件都會在控制台顯示
[Analytics] Event sent: view_item { item_id: "123", ... }
```

### 2. GA4 即時報表

1. 前往 Google Analytics
2. 選擇「報表」→「即時」
3. 觸發各種事件
4. 確認事件在即時報表中顯示

### 3. GA4 DebugView

啟用除錯模式：

**方法 1：瀏覽器擴充功能**
- 安裝「Google Analytics Debugger」Chrome 擴充功能
- 啟用擴充功能後重新載入頁面

**方法 2：URL 參數**
```
https://your-domain.com/?debug_mode=true
```

前往 GA4 → 設定 → DebugView 查看詳細事件資訊

### 4. GTM Preview 模式（如有使用 GTM）

如果未來考慮使用 Google Tag Manager：
1. 在 GTM 中啟用預覽模式
2. 在網站上觸發事件
3. 在 GTM 預覽視窗中查看事件觸發情況

## 隱私權和合規性

### GDPR/個資法合規

本實作已包含基礎的同意模式設定：

```javascript
gtag('consent', 'default', {
  'analytics_storage': 'granted',      // 分析 Cookie
  'ad_storage': 'denied',              // 廣告 Cookie（預設拒絕）
  'ad_user_data': 'denied',            // 廣告用戶資料（預設拒絕）
  'ad_personalization': 'denied'       // 個人化廣告（預設拒絕）
});
```

**建議增加功能：**
1. Cookie 同意橫幅
2. 隱私權政策頁面更新
3. 允許用戶管理追蹤偏好

### IP 匿名化

已啟用 IP 匿名化：
```javascript
gtag('config', MEASUREMENT_ID, {
  anonymize_ip: true
});
```

## 進階功能

### 1. 電商報表

GA4 提供以下內建電商報表：
- 購買旅程（Purchase journey）
- 電子商務購買（Ecommerce purchases）
- 商品推廣（Item promotion）
- 商品清單（Item list）

### 2. 自訂報表和探索

建議建立的自訂報表：
- **使用者交易漏斗**：瀏覽商品 → 收藏 → 發起交易 → 完成交易
- **刊登流程分析**：開始刊登 → 完成刊登
- **分類效能**：各分類的瀏覽、收藏、交易數
- **積分系統分析**：積分獲得來源和用戶參與度

### 3. 整合 BigQuery（選用）

對於進階分析，可以將 GA4 資料匯出到 BigQuery：
1. 在 GA4 中啟用 BigQuery 連結
2. 設定每日資料匯出
3. 使用 SQL 進行深度分析

## 常見問題

### Q: 為什麼看不到即時資料？

A: 檢查以下項目：
1. 確認 `.env` 中的 `VITE_GA_MEASUREMENT_ID` 正確
2. 檢查瀏覽器控制台是否有錯誤訊息
3. 確認沒有廣告攔截器阻擋 GA4
4. 等待 1-2 分鐘，資料可能有延遲

### Q: 事件沒有顯示參數？

A: 
1. 檢查自訂維度是否已在 GA4 中建立
2. 確認參數名稱完全一致（區分大小寫）
3. 等待 24-48 小時讓資料完全處理

### Q: 如何追蹤單頁應用 (SPA) 的頁面瀏覽？

A: 本專案已在 router/index.js 中設定 `router.afterEach` 自動追蹤所有路由變更。

### Q: 可以同時使用 GA4 和 Universal Analytics (UA) 嗎？

A: 可以，但 Universal Analytics 已於 2023 年 7 月停止處理資料。建議只使用 GA4。

## 效能考量

- ✅ gtag.js 採用非同步載入，不會阻塞頁面渲染
- ✅ 事件追蹤採用批次處理，降低網路請求
- ✅ 所有追蹤函數都有錯誤處理，不會影響主要功能
- ✅ 在 GA4 未初始化時會優雅降級（顯示警告但不中斷執行）

## 維護和更新

### 定期檢查項目
- [ ] 每月檢視 GA4 報表，識別異常模式
- [ ] 每季檢查事件追蹤是否正常運作
- [ ] 追蹤新功能時更新此文件
- [ ] 定期檢查 GA4 更新和新功能

### 新增追蹤事件流程
1. 在 `useAnalytics.js` 中新增追蹤函數
2. 在相關 Vue 組件中引入並使用
3. 更新本文件的事件列表
4. 在 GA4 中建立對應的自訂維度/指標（如需要）
5. 測試驗證

## 參考資源

- [GA4 官方文檔](https://support.google.com/analytics/answer/9304153)
- [GA4 電商事件參考](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [gtag.js 開發者指南](https://developers.google.com/analytics/devguides/collection/gtagjs)
- [GA4 事件命名規範](https://support.google.com/analytics/answer/9267735)
- [同意模式文檔](https://developers.google.com/tag-platform/security/concepts/consent-mode)

## 支援

如有問題或建議，請聯繫開發團隊或提交 Issue。
