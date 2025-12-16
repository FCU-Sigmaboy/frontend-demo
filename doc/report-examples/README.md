# 檢舉功能範例程式碼

本資料夾包含完整的檢舉功能範例程式碼，供前端開發者快速參考與使用。

## 📁 資料夾結構

```
report-examples/
├── api/
│   └── reportAPI.js          # API 層封裝
├── composables/
│   ├── useSubmitReport.js    # 提交檢舉 Composable
│   └── useMyReports.js       # 查詢記錄 Composable
├── components/
│   ├── ReportUserButton.vue      # 檢舉用戶按鈕
│   ├── ReportItemButton.vue      # 檢舉商品按鈕
│   ├── ReportMessageButton.vue   # 檢舉訊息按鈕
│   ├── ReportTransactionButton.vue # 檢舉交易按鈕
│   ├── ReportForm.vue            # 完整檢舉表單
│   └── MyReportsList.vue         # 我的檢舉記錄
└── README.md                 # 本說明文件
```

---

## 🚀 快速開始

### 1. 複製檔案到專案中

```bash
# 複製 API
cp doc/report-examples/api/reportAPI.js src/api/

# 複製 Composables
cp doc/report-examples/composables/*.js src/composables/

# 複製 Components
cp doc/report-examples/components/*.vue src/components/
```

### 2. 確認依賴

請確保專案中已有以下設定：

```javascript
// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. SCSS 變數依賴

元件使用了以下 SCSS 變數，請確保 `@/styles/variables` 中有定義：

```scss
// src/styles/_variables.scss
$primary: #2e7d32; // 主色
$danger: #dc3545; // 危險/警告色
$warning: #ffc107; // 警示色
```

---

## 📖 使用範例

### 快速按鈕元件

最簡單的使用方式，適合在商品卡片、用戶資料頁等地方快速加入檢舉按鈕：

```vue
<template>
  <div class="product-card">
    <!-- 商品內容 -->
    <h3>{{ product.title }}</h3>

    <!-- 檢舉商品按鈕 -->
    <ReportItemButton
      :item-id="product.id"
      reason-code="FAKE_PRODUCT"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import ReportItemButton from "@/components/ReportItemButton.vue";

const props = defineProps({
  product: Object,
});

const handleSuccess = (data) => {
  console.log("檢舉成功", data);
};
</script>
```

### 完整表單元件

適合在 Modal 或獨立頁面中使用，讓用戶可以選擇原因並填寫詳細說明：

```vue
<template>
  <div>
    <!-- 觸發按鈕 -->
    <button @click="showReportModal = true">檢舉此商品</button>

    <!-- Modal -->
    <ReportForm
      v-if="showReportModal"
      report-type="item"
      :target-id="productId"
      @success="handleSuccess"
      @cancel="showReportModal = false"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import ReportForm from "@/components/ReportForm.vue";

const productId = 123;
const showReportModal = ref(false);

const handleSuccess = () => {
  showReportModal.value = false;
  alert("檢舉已提交！");
};
</script>
```

### 直接使用 Composable

需要更多客製化時，可以直接使用 Composable：

```vue
<script setup>
import { useSubmitReport } from "@/composables/useSubmitReport";

const { submitReport, isLoading, error, clearError } = useSubmitReport();

const handleCustomReport = async () => {
  const result = await submitReport({
    report_type: "item",
    target_id: 123,
    reason_code: "FAKE_PRODUCT",
    description: "自訂描述內容...",
  });

  if (result.success) {
    // 自訂成功處理邏輯
  } else {
    // 自訂錯誤處理邏輯
  }
};
</script>
```

---

## 🔧 API 說明

### reportAPI.js

| 函式                           | 說明             | 參數                                                         |
| ------------------------------ | ---------------- | ------------------------------------------------------------ |
| `getReportReasons(reportType)` | 取得檢舉原因列表 | `reportType`: 'user' \| 'item' \| 'message' \| 'transaction' |
| `submitReport(reportData)`     | 提交檢舉         | 見下方詳細說明                                               |
| `getMyReports(params)`         | 取得我的檢舉記錄 | `page`, `pageSize`, `reportType`, `status`                   |
| `getReportDetail(reportId)`    | 取得單筆檢舉詳情 | `reportId`: number                                           |

### submitReport 參數說明

| 參數             | 類型     | 必填   | 說明                                     |
| ---------------- | -------- | ------ | ---------------------------------------- |
| `report_type`    | string   | ✅     | 'user', 'item', 'message', 'transaction' |
| `target_id`      | number   | ✅     | 被檢舉對象 ID                            |
| `target_user_id` | string   | 條件性 | 用戶檢舉時必填                           |
| `reason_code`    | string   | ✅     | 檢舉原因代碼                             |
| `reason_id`      | number   | 選填   | 檢舉原因 ID                              |
| `description`    | string   | 選填   | 詳細說明（最多 1000 字）                 |
| `evidence_urls`  | string[] | 選填   | 證據圖片 URL 陣列                        |

---

## 📋 元件 Props 一覽

### ReportUserButton

| Prop          | 類型    | 必填 | 預設值  | 說明               |
| ------------- | ------- | ---- | ------- | ------------------ |
| `userId`      | String  | ✅   | -       | 被檢舉用戶 UUID    |
| `reasonCode`  | String  | -    | 'FRAUD' | 檢舉原因代碼       |
| `reasonId`    | Number  | -    | -       | 檢舉原因 ID        |
| `description` | String  | -    | ''      | 詳細說明           |
| `showConfirm` | Boolean | -    | true    | 是否顯示確認對話框 |

### ReportItemButton

| Prop           | 類型   | 必填 | 預設值         | 說明              |
| -------------- | ------ | ---- | -------------- | ----------------- |
| `itemId`       | Number | ✅   | -              | 被檢舉商品 ID     |
| `reasonCode`   | String | -    | 'FAKE_PRODUCT' | 檢舉原因代碼      |
| `evidenceUrls` | Array  | -    | []             | 證據圖片 URL 陣列 |

### ReportMessageButton

| Prop         | 類型   | 必填 | 預設值       | 說明            |
| ------------ | ------ | ---- | ------------ | --------------- |
| `messageId`  | Number | ✅   | -            | 被檢舉訊息 ID   |
| `senderId`   | String | ✅   | -            | 訊息發送者 UUID |
| `reasonCode` | String | -    | 'HARASSMENT' | 檢舉原因代碼    |

### ReportTransactionButton

| Prop            | 類型   | 必填 | 預設值        | 說明          |
| --------------- | ------ | ---- | ------------- | ------------- |
| `transactionId` | Number | ✅   | -             | 被檢舉交易 ID |
| `otherUserId`   | String | ✅   | -             | 交易對方 UUID |
| `reasonCode`    | String | -    | 'NO_DELIVERY' | 檢舉原因代碼  |

### ReportForm

| Prop           | 類型   | 必填 | 預設值 | 說明           |
| -------------- | ------ | ---- | ------ | -------------- |
| `reportType`   | String | ✅   | -      | 檢舉類型       |
| `targetId`     | Number | ✅   | -      | 被檢舉對象 ID  |
| `targetUserId` | String | -    | -      | 用戶檢舉時必填 |

### MyReportsList

| Prop       | 類型   | 必填 | 預設值 | 說明         |
| ---------- | ------ | ---- | ------ | ------------ |
| `pageSize` | Number | -    | 20     | 每頁顯示數量 |

---

## 🎨 樣式客製化

所有元件都使用 scoped styles，可以透過以下方式自訂樣式：

### 1. 覆寫 CSS 變數

```scss
// 在父層元件覆寫變數
.my-page {
  --report-btn-color: #e91e63;
}
```

### 2. 使用 :deep() 選擇器

```scss
// 覆寫子元件樣式
:deep(.report-form) {
  max-width: 600px;

  &__title {
    font-size: 24px;
  }
}
```

### 3. 複製元件後修改

直接複製元件檔案到專案中，根據需求修改樣式。

---

## ⚠️ 注意事項

1. **認證要求**：所有檢舉 API 都需要用戶登入
2. **證據上傳**：`evidence_urls` 應為公開可訪問的圖片 URL，建議使用 Supabase Storage
3. **字數限制**：description 最多 1000 字元
4. **RLS 政策**：用戶只能查看自己提交的檢舉記錄

---

## 📮 聯繫方式

如有 API 串接問題，請聯繫後端開發團隊。
