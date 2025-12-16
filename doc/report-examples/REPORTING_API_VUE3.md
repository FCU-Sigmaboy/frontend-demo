# 檢舉系統 API 串接文件（Vue 3 + JavaScript 版）

本文件說明如何在 Vue 3 + JavaScript 電商前端應用程式中串接檢舉功能，讓用戶可以舉報違規的用戶、商品、訊息或交易。

## 目錄

- [概述](#概述)
- [檢舉類型](#檢舉類型)
- [API 端點](#api-端點)
- [資料結構](#資料結構)
- [串接範例](#串接範例)
- [錯誤處理](#錯誤處理)

---

## 概述

檢舉系統支援四種類型的檢舉：

- **用戶檢舉** (`user`) - 檢舉違規用戶
- **商品檢舉** (`item`) - 檢舉違規商品
- **訊息檢舉** (`message`) - 檢舉不當訊息
- **交易檢舉** (`transaction`) - 檢舉問題交易

用戶必須登入後才能提交檢舉。

---

## 檢舉類型

| 類型 | 代碼          | 說明                 |
| ---- | ------------- | -------------------- |
| 用戶 | `user`        | 檢舉違規或可疑用戶   |
| 商品 | `item`        | 檢舉違規商品列表     |
| 訊息 | `message`     | 檢舉對話中的不當訊息 |
| 交易 | `transaction` | 檢舉交易過程中的問題 |

---

## API 端點

### 1. 取得檢舉原因列表

在顯示檢舉表單前，應先取得對應類型的檢舉原因列表。

```javascript
// composables/useReportReasons.js
import { ref } from "vue";
import { supabase } from "@/integrations/supabase/client";

/**
 * 取得特定類型的檢舉原因
 * @param {'user' | 'item' | 'message' | 'transaction'} reportType
 */
export async function getReportReasons(reportType) {
  const { data, error } = await supabase
    .from("report_reasons")
    .select("id, reason_code, reason_label, description")
    .eq("report_type", reportType)
    .eq("is_active", true)
    .order("display_order");

  if (error) throw error;
  return data;
}
```

**回傳範例：**

```json
[
  {
    "id": 1,
    "reason_code": "FAKE_PRODUCT",
    "reason_label": "假冒商品",
    "description": "商品為仿冒或假冒品牌"
  },
  {
    "id": 2,
    "reason_code": "PROHIBITED_ITEM",
    "reason_label": "違禁商品",
    "description": "販售法律禁止的商品"
  }
]
```

---

### 2. 提交檢舉

使用 Edge Function `submit-report` 提交檢舉。

**端點：** `POST /functions/v1/submit-report`

**請求標頭：**

```
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

**請求參數：**

| 參數             | 類型     | 必填   | 說明                                               |
| ---------------- | -------- | ------ | -------------------------------------------------- |
| `report_type`    | string   | ✅     | 檢舉類型：`user`, `item`, `message`, `transaction` |
| `target_id`      | number   | ✅     | 被檢舉對象的 ID                                    |
| `target_user_id` | string   | 條件性 | 被檢舉用戶的 UUID（`user` 類型必填）               |
| `reason_code`    | string   | ✅     | 檢舉原因代碼                                       |
| `reason_id`      | number   | 選填   | 檢舉原因 ID（建議提供）                            |
| `description`    | string   | 選填   | 詳細說明（最多 1000 字）                           |
| `evidence_urls`  | string[] | 選填   | 證據圖片網址陣列                                   |

---

## 資料結構

### Report 物件

```javascript
/**
 * @typedef {Object} Report
 * @property {number} id - 檢舉 ID
 * @property {'user' | 'item' | 'message' | 'transaction'} report_type - 檢舉類型
 * @property {number} target_id - 被檢舉對象的 ID
 * @property {string | null} target_user_id - 被檢舉用戶的 UUID
 * @property {string} reporter_id - 檢舉者的 UUID
 * @property {number | null} reason_id - 檢舉原因 ID
 * @property {string} reason_code - 檢舉原因代碼
 * @property {string | null} description - 詳細說明
 * @property {string[] | null} evidence_urls - 證據圖片網址陣列
 * @property {'pending' | 'reviewing' | 'resolved' | 'dismissed'} status - 檢舉狀態
 * @property {'low' | 'normal' | 'high' | 'urgent'} priority - 優先權
 * @property {string} created_at - 建立時間
 * @property {string} updated_at - 更新時間
 */
```

### ReportReason 物件

```javascript
/**
 * @typedef {Object} ReportReason
 * @property {number} id - 原因 ID
 * @property {'user' | 'item' | 'message' | 'transaction'} report_type - 檢舉類型
 * @property {string} reason_code - 原因代碼
 * @property {string} reason_label - 原因標籤
 * @property {string | null} description - 原因說明
 * @property {number} display_order - 顯示順序
 * @property {boolean} is_active - 是否啟用
 */
```

---

## 串接範例

### 完整的 Vue 3 Composable 實作

```javascript
// composables/useSubmitReport.js
import { ref } from "vue";
import { supabase } from "@/integrations/supabase/client";

/**
 * 提交檢舉的 Composable
 * @returns {{ submitReport: Function, isLoading: Ref<boolean>, error: Ref<string | null> }}
 */
export function useSubmitReport() {
  const isLoading = ref(false);
  const error = ref(null);

  /**
   * 提交檢舉
   * @param {Object} params - 檢舉參數
   * @param {'user' | 'item' | 'message' | 'transaction'} params.report_type - 檢舉類型
   * @param {number} params.target_id - 被檢舉對象的 ID
   * @param {string} [params.target_user_id] - 被檢舉用戶的 UUID
   * @param {string} params.reason_code - 檢舉原因代碼
   * @param {number} [params.reason_id] - 檢舉原因 ID
   * @param {string} [params.description] - 詳細說明
   * @param {string[]} [params.evidence_urls] - 證據圖片網址陣列
   * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
   */
  const submitReport = async (params) => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "submit-report",
        {
          body: params,
        },
      );

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || "提交檢舉失敗");
      }

      return { success: true, data: data.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "提交檢舉時發生錯誤";
      error.value = message;
      return { success: false, error: message };
    } finally {
      isLoading.value = false;
    }
  };

  return { submitReport, isLoading, error };
}
```

### 檢舉用戶範例

```vue
<!-- components/ReportUserButton.vue -->
<template>
  <button @click="handleReport" :disabled="isLoading" class="report-button">
    {{ isLoading ? "提交中..." : "檢舉用戶" }}
  </button>
</template>

<script setup>
import { useSubmitReport } from "@/composables/useSubmitReport";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

const { submitReport, isLoading } = useSubmitReport();

const handleReport = async () => {
  const result = await submitReport({
    report_type: "user",
    target_id: 0, // 用戶檢舉可設為 0
    target_user_id: props.userId,
    reason_code: "FRAUD",
    description: "此用戶有詐騙行為",
  });

  if (result.success) {
    alert("檢舉已提交，我們會盡快審查");
  }
};
</script>
```

### 檢舉商品範例

```vue
<!-- components/ReportItemButton.vue -->
<template>
  <button @click="handleReport" :disabled="isLoading" class="report-button">
    {{ isLoading ? "提交中..." : "檢舉商品" }}
  </button>
</template>

<script setup>
import { useSubmitReport } from "@/composables/useSubmitReport";

const props = defineProps({
  itemId: {
    type: Number,
    required: true,
  },
});

const { submitReport, isLoading } = useSubmitReport();

const handleReport = async () => {
  const result = await submitReport({
    report_type: "item",
    target_id: props.itemId,
    reason_code: "FAKE_PRODUCT",
    description: "此商品為仿冒品",
    evidence_urls: [
      "https://storage.example.com/evidence1.jpg",
      "https://storage.example.com/evidence2.jpg",
    ],
  });

  if (result.success) {
    alert("檢舉已提交");
  }
};
</script>
```

### 檢舉訊息範例

```vue
<!-- components/ReportMessageButton.vue -->
<template>
  <button @click="handleReport" :disabled="isLoading" class="report-button">
    檢舉訊息
  </button>
</template>

<script setup>
import { useSubmitReport } from "@/composables/useSubmitReport";

const props = defineProps({
  messageId: {
    type: Number,
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
});

const { submitReport, isLoading } = useSubmitReport();

const handleReport = async () => {
  const result = await submitReport({
    report_type: "message",
    target_id: props.messageId,
    target_user_id: props.senderId,
    reason_code: "HARASSMENT",
    description: "此訊息包含騷擾內容",
  });

  if (result.success) {
    alert("檢舉已提交");
  }
};
</script>
```

### 檢舉交易範例

```vue
<!-- components/ReportTransactionButton.vue -->
<template>
  <button @click="handleReport" :disabled="isLoading" class="report-button">
    檢舉交易
  </button>
</template>

<script setup>
import { useSubmitReport } from "@/composables/useSubmitReport";

const props = defineProps({
  transactionId: {
    type: Number,
    required: true,
  },
  otherUserId: {
    type: String,
    required: true,
  },
});

const { submitReport, isLoading } = useSubmitReport();

const handleReport = async () => {
  const result = await submitReport({
    report_type: "transaction",
    target_id: props.transactionId,
    target_user_id: props.otherUserId,
    reason_code: "NO_DELIVERY",
    description: "賣家未依約交付商品",
  });

  if (result.success) {
    alert("檢舉已提交");
  }
};
</script>
```

### 完整的檢舉表單元件

```vue
<!-- components/ReportForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="report-form">
    <h3>提交檢舉</h3>

    <!-- 載入中狀態 -->
    <div v-if="loadingReasons" class="loading">載入中...</div>

    <template v-else>
      <!-- 檢舉原因選擇 -->
      <div class="form-group">
        <label for="reason-select">檢舉原因 *</label>
        <select id="reason-select" v-model="selectedReasonId" required>
          <option value="">請選擇原因</option>
          <option v-for="reason in reasons" :key="reason.id" :value="reason.id">
            {{ reason.reason_label }}
          </option>
        </select>
        <p v-if="selectedReason?.description" class="reason-description">
          {{ selectedReason.description }}
        </p>
      </div>

      <!-- 詳細說明 -->
      <div class="form-group">
        <label for="description">詳細說明（選填）</label>
        <textarea
          id="description"
          v-model="description"
          placeholder="請描述您遇到的問題..."
          maxlength="1000"
          rows="4"
        ></textarea>
        <span class="char-count">{{ description.length }}/1000</span>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- 按鈕 -->
      <div class="form-actions">
        <button
          type="button"
          @click="emit('cancel')"
          :disabled="isLoading"
          class="btn-cancel"
        >
          取消
        </button>
        <button
          type="submit"
          :disabled="isLoading || !selectedReasonId"
          class="btn-submit"
        >
          {{ isLoading ? "提交中..." : "提交檢舉" }}
        </button>
      </div>
    </template>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { supabase } from "@/integrations/supabase/client";
import { useSubmitReport } from "@/composables/useSubmitReport";

const props = defineProps({
  reportType: {
    type: String,
    required: true,
    validator: (value) =>
      ["user", "item", "message", "transaction"].includes(value),
  },
  targetId: {
    type: Number,
    required: true,
  },
  targetUserId: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["success", "cancel"]);

const reasons = ref([]);
const selectedReasonId = ref("");
const description = ref("");
const loadingReasons = ref(true);
const { submitReport, isLoading, error } = useSubmitReport();

// 計算選中的原因物件
const selectedReason = computed(() => {
  if (!selectedReasonId.value) return null;
  return reasons.value.find((r) => r.id === Number(selectedReasonId.value));
});

// 載入檢舉原因
const loadReasons = async () => {
  loadingReasons.value = true;

  const { data, error: fetchError } = await supabase
    .from("report_reasons")
    .select("id, reason_code, reason_label, description")
    .eq("report_type", props.reportType)
    .eq("is_active", true)
    .order("display_order");

  if (!fetchError && data) {
    reasons.value = data;
  }

  loadingReasons.value = false;
};

// 監聽 reportType 變化，重新載入原因列表
watch(
  () => props.reportType,
  () => {
    loadReasons();
  },
);

onMounted(() => {
  loadReasons();
});

const handleSubmit = async () => {
  if (!selectedReason.value) {
    alert("請選擇檢舉原因");
    return;
  }

  const result = await submitReport({
    report_type: props.reportType,
    target_id: props.targetId,
    target_user_id: props.targetUserId,
    reason_code: selectedReason.value.reason_code,
    reason_id: selectedReason.value.id,
    description: description.value || undefined,
  });

  if (result.success) {
    emit("success");
  }
};
</script>

<style scoped>
.report-form {
  max-width: 500px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.report-form h3 {
  margin: 0 0 20px;
  font-size: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.reason-description {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.char-count {
  display: block;
  margin-top: 4px;
  text-align: right;
  font-size: 12px;
  color: #999;
}

.error-message {
  padding: 12px;
  margin-bottom: 16px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c00;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-submit {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #eee;
}

.btn-submit {
  background: #007bff;
  color: #fff;
}

.btn-submit:hover {
  background: #0056b3;
}

.btn-cancel:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #666;
}
</style>
```

---

## 錯誤處理

### 常見錯誤代碼

| 錯誤                                          | 說明                    | 處理建議            |
| --------------------------------------------- | ----------------------- | ------------------- |
| `Unauthorized`                                | 用戶未登入              | 導向登入頁面        |
| `Missing required fields`                     | 缺少必填欄位            | 檢查表單驗證        |
| `Invalid report_type`                         | 無效的檢舉類型          | 使用正確的類型值    |
| `target_user_id is required for user reports` | 用戶檢舉缺少目標用戶 ID | 提供 target_user_id |

### 錯誤處理範例

```javascript
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast"; // 假設有 toast composable

const router = useRouter();
const { showToast } = useToast();

const handleReportWithErrorHandling = async (params) => {
  const result = await submitReport(params);

  if (!result.success) {
    switch (result.error) {
      case "Unauthorized":
        // 導向登入
        router.push("/login");
        break;
      case "Missing required fields":
        // 顯示表單錯誤
        formError.value = "請填寫所有必填欄位";
        break;
      default:
        // 顯示一般錯誤
        showToast({
          type: "error",
          message: result.error || "提交失敗，請稍後再試",
        });
    }
  }
};
```

### 使用 Vue Router 錯誤攔截

```javascript
// composables/useSubmitReportWithAuth.js
import { useRouter } from "vue-router";
import { useSubmitReport } from "./useSubmitReport";

export function useSubmitReportWithAuth() {
  const router = useRouter();
  const {
    submitReport: baseSubmitReport,
    isLoading,
    error,
  } = useSubmitReport();

  const submitReport = async (params) => {
    const result = await baseSubmitReport(params);

    if (!result.success && result.error === "Unauthorized") {
      router.push({
        path: "/login",
        query: { redirect: router.currentRoute.value.fullPath },
      });
    }

    return result;
  };

  return { submitReport, isLoading, error };
}
```

---

## 用戶查看自己的檢舉

用戶可以查看自己提交的檢舉記錄：

```javascript
// composables/useMyReports.js
import { ref, onMounted } from "vue";
import { supabase } from "@/integrations/supabase/client";

export function useMyReports() {
  const reports = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const fetchMyReports = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("reports")
        .select(
          `
          id,
          report_type,
          target_id,
          reason_code,
          status,
          created_at,
          reason:report_reasons(reason_label)
        `,
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      reports.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "載入失敗";
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    fetchMyReports();
  });

  return { reports, isLoading, error, refetch: fetchMyReports };
}
```

### 我的檢舉列表元件

```vue
<!-- components/MyReportsList.vue -->
<template>
  <div class="my-reports">
    <h2>我的檢舉記錄</h2>

    <div v-if="isLoading" class="loading">載入中...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="reports.length === 0" class="empty">尚無檢舉記錄</div>

    <ul v-else class="reports-list">
      <li v-for="report in reports" :key="report.id" class="report-item">
        <div class="report-header">
          <span class="report-type">{{
            getTypeLabel(report.report_type)
          }}</span>
          <span :class="['report-status', `status-${report.status}`]">
            {{ getStatusLabel(report.status) }}
          </span>
        </div>
        <div class="report-reason">
          原因：{{ report.reason?.reason_label || report.reason_code }}
        </div>
        <div class="report-date">
          {{ formatDate(report.created_at) }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useMyReports } from "@/composables/useMyReports";

const { reports, isLoading, error } = useMyReports();

const typeLabels = {
  user: "用戶",
  item: "商品",
  message: "訊息",
  transaction: "交易",
};

const statusLabels = {
  pending: "待處理",
  reviewing: "審查中",
  resolved: "已處理",
  dismissed: "已駁回",
};

const getTypeLabel = (type) => typeLabels[type] || type;
const getStatusLabel = (status) => statusLabels[status] || status;

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
.my-reports {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.my-reports h2 {
  margin-bottom: 24px;
  font-size: 24px;
  color: #333;
}

.reports-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.report-item {
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.report-type {
  font-weight: 600;
  color: #333;
}

.report-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3e0;
  color: #e65100;
}

.status-reviewing {
  background: #e3f2fd;
  color: #1565c0;
}

.status-resolved {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-dismissed {
  background: #f5f5f5;
  color: #757575;
}

.report-reason {
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
}

.report-date {
  font-size: 12px;
  color: #999;
}

.loading,
.error,
.empty {
  padding: 40px;
  text-align: center;
  color: #666;
}

.error {
  color: #c00;
}
</style>
```

> **注意：** 由於 RLS 政策限制，用戶只能查看自己提交的檢舉。

---

## 注意事項

1. **認證要求**：所有檢舉 API 都需要用戶登入
2. **重複檢舉**：系統不會阻止同一用戶重複檢舉同一對象，但管理員審查時會考慮
3. **證據上傳**：evidence_urls 應為公開可訪問的圖片網址，建議使用 Supabase Storage
4. **字數限制**：description 最多 1000 字元
5. **Vue 3 Composition API**：本文件使用 `<script setup>` 語法，這是 Vue 3.2+ 的推薦寫法
6. **響應式資料**：使用 `ref()` 和 `computed()` 來管理元件狀態

---

## 快速開始

### 1. 安裝 Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. 設定 Supabase Client

```javascript
// integrations/supabase/client.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. 環境變數設定

在專案根目錄建立 `.env` 檔案：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 使用元件

```vue
<template>
  <div>
    <!-- 直接使用按鈕 -->
    <ReportUserButton :user-id="targetUserId" />

    <!-- 或使用完整表單 -->
    <ReportForm
      report-type="item"
      :target-id="itemId"
      @success="handleSuccess"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup>
import ReportUserButton from "@/components/ReportUserButton.vue";
import ReportForm from "@/components/ReportForm.vue";

const targetUserId = "user-uuid-here";
const itemId = 123;

const handleSuccess = () => {
  // 關閉 modal、顯示成功訊息等
  alert("檢舉已成功提交！");
};

const closeModal = () => {
  // 關閉 modal
};
</script>
```

---

## 聯繫方式

如有 API 串接問題，請聯繫開發團隊。
