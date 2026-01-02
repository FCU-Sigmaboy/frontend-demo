---
description: 軟體測試課程畢業專題 - 測試方法與報告產出指引
---

# 軟體測試專題 - 專案執行與應用指引 (Expert Edition)

> **本指引目標**：將「軟體測試課程畢業專題」的規範需求，轉化為本專案 (Vue.js + Vitest) 的具體執行方法與對應策略。本文件同時參考 **ISTQB® Foundation Level Syllabus (v4.0)** 之黑盒測試設計技術標準。

---

## 1. 專案與課程需求對應 (Tool Mapping)

課程規範主要提及 Java 生態系工具，本專案使用現代前端測試生態系進行功能等價對應：

| 課程要求 (Java)     | 本專案實作 (JavaScript/Vue) | 對應工具/技術             | 說明                                                              |
| :------------------ | :-------------------------- | :------------------------ | :---------------------------------------------------------------- |
| **JUnit**           | **Vitest**                  | `vitest`                  | 單元測試框架，語法與 Jest/JUnit 相容 (`describe`, `it`, `expect`) |
| **Jacoco**          | **@vitest/coverage-v8**     | `c8` / `v8`               | 程式碼覆蓋率分析引擎，產出與 Jacoco 相同的 LCOV/HTML 報告         |
| **PMD**             | **ESLint**                  | `eslint`                  | 靜態程式碼分析工具，檢查代碼品質、潛在錯誤與風格問題              |
| **MetricsReloaded** | **Code Metrics Analysis**   | `scripts/code-metrics.js` | 自定義分析腳本，計算 WMC (Weighted Methods per Class) 與複雜度    |
| **Surefire**        | **Vitest Reporters**        | `default`, `html`         | 測試結果報告生成                                                  |

---

## 2. 測試設計策略 (Test Design Techniques) - 符合 ISTQB® 標準

本專案將四種核心黑盒測試設計技術 (Black-box Test Design Techniques) 與 `27` 個 API 模組的測試實作深度結合。

### 2.1 等價類別劃分 (Equivalence Partitioning, EP)

> **ISTQB® 定義**：將輸入資料或輸出資料劃分為群組（稱為等價類別或分區），其中同一分區內的所有元素預期會以相同方式被系統處理。若一個分區內的某個測試案例有效，則該分區內的所有測試案例都應有效；若一個測試案例失敗，則所有測試案例都應失敗。
>
> _ISTQB® CTFL Syllabus v4.0, Section 4.2.1_

**本專案應用**：

| 功能模組                | 有效等價類 (Valid EP)   | 無效等價類 (Invalid EP)                   | 實作參考                                    |
| :---------------------- | :---------------------- | :---------------------------------------- | :------------------------------------------ |
| `create_review.js` 評分 | 整數 1, 2, 3, 4, 5      | 0, 6, -1, 100, `null`, `undefined`, "abc" | `tests/unit/api/create_review.test.js`      |
| `image.js` 檔案上傳     | JPEG, PNG, WebP (< 5MB) | GIF, BMP, 過大檔案 (> 5MB), 空檔案        | `tests/unit/api/image.test.js`              |
| `get_searchItemsAPI.js` | 有效分類 ID, 有效關鍵字 | 空字串, SQL 注入嘗試, 過長文字 (> 255)    | `tests/unit/api/get_searchItemsAPI.test.js` |

---

### 2.2 邊界值分析 (Boundary Value Analysis, BVA)

> **ISTQB® 定義**：邊界值分析是一種基於等價分區邊界進行測試的技術。開發人員往往在這些邊界值上犯錯，因此邊界測試能有效發現缺陷。ISTQB 定義了兩種變體：
>
> - **2-value BVA**：測試邊界值及其最接近的鄰居。
> - **3-value BVA**：測試邊界值及其兩側的鄰居（更嚴謹）。
>
> _ISTQB® CTFL Syllabus v4.0, Section 4.2.2_

**本專案應用 (3-value BVA)**：

| 功能模組                     | 邊界定義    | 測試值 (BVA-3)                  | 實作參考                           |
| :--------------------------- | :---------- | :------------------------------ | :--------------------------------- |
| `pointsAPI.js` Bronze/Silver | 999 / 1000  | 998, **999**, **1000**, 1001    | `tests/unit/api/pointsAPI.test.js` |
| `pointsAPI.js` Silver/Gold   | 4999 / 5000 | 4998, **4999**, **5000**, 5001  | `tests/unit/api/pointsAPI.test.js` |
| `location.js` 經度範圍       | -180 / 180  | -181, **-180**, 0, **180**, 181 | `tests/unit/api/location.test.js`  |
| `location.js` 緯度範圍       | -90 / 90    | -91, **-90**, 0, **90**, 91     | `tests/unit/api/location.test.js`  |

---

### 2.3 狀態轉換測試 (State Transition Testing)

> **ISTQB® 定義**：狀態轉換測試用於測試系統在不同狀態之間的轉換。測試案例設計應涵蓋：
>
> - **典型狀態序列**
> - **所有有效轉換 (0-switch coverage)**
> - **無效轉換（預期應被拒絕）**
>
> _ISTQB® CTFL Syllabus v4.0, Section 4.2.4_

**本專案應用 - 交易狀態機 (Transaction State Machine)**：

```
            ┌─────────┐      initiateTransaction      ┌───────────┐
            │  IDLE   │ ────────────────────────────► │  PENDING  │
            └─────────┘                               └───────────┘
                                                            │
                             ┌──────────────────────────────┼──────────────────────────────┐
                             │ buyerConfirmTransaction      │ cancelTransaction            │
                             ▼                              ▼                              │
                      ┌────────────┐                 ┌────────────┐                       │
                      │ CONFIRMING │                 │ CANCELLED  │ ◄─────────────────────┘
                      └────────────┘                 └────────────┘         (from CONFIRMING)
                             │
                             │ finalizeTransactionWithCode
                             ▼
                      ┌────────────┐
                      │ COMPLETED  │  ──✕──►  CANCELLED (INVALID TRANSITION)
                      └────────────┘
```

| 轉換                                   | 預期結果 | 測試案例類型 | 實作參考                                    |
| :------------------------------------- | :------- | :----------- | :------------------------------------------ |
| `pending` → `confirming`               | ✅ 允許  | 有效轉換     | `transaction_before_meetAPI.test.js`        |
| `confirming` → `completed`             | ✅ 允許  | 有效轉換     | `transaction_meetAPI.test.js`               |
| `pending` / `confirming` → `cancelled` | ✅ 允許  | 有效轉換     | `transaction_before_meetAPI.test.js`        |
| `completed` → `cancelled`              | ❌ 禁止  | **無效轉換** | 驗證 API 拋出 `InvalidStateTransition` 錯誤 |

---

### 2.4 錯誤猜測 (Error Guessing) 與經驗法則

> **ISTQB® 定義**：錯誤猜測是一種依賴測試人員知識、經驗和直覺來識別可能包含缺陷的區域的技術。常見的錯誤來源包括：
>
> - 空、零或負值輸入
> - 網路或資料庫連線失敗
> - 權限不足 (401/403)
> - 併發條件 (Race Conditions)
>
> _ISTQB® CTFL Syllabus v4.0, Section 4.4.2_

**本專案應用**：

| 錯誤場景                 | 模擬方法                                                 | 驗證項目                 | 覆蓋檔案      |
| :----------------------- | :------------------------------------------------------- | :----------------------- | :------------ |
| 網路斷線                 | `vi.mock` 返回 `{ error: { message: 'Network Error' } }` | 拋出 `網路連線失敗` 錯誤 | 所有 API 模組 |
| 未授權 (401)             | `vi.mock` 返回 `{ error: { code: 401 } }`                | 拋出 `授權失敗` 錯誤     | `location.js` |
| 資料庫錯誤 (500)         | `vi.mock` 返回 `{ error: { code: 500 } }`                | 拋出 `伺服器錯誤` 提示   | 所有 API 模組 |
| RPC 返回 `null` 或空陣列 | `vi.mock` 返回 `{ data: null }` / `{ data: [] }`         | 正確處理 Fallback 邏輯   | `ragQaAPI.js` |

---

## 3. 自動化測試執行與報告產出

請依序執行以下指令以產生所有必要的報告文件。

### 3.1 執行單元測試 (JUnit/Surefire 對應)

```bash
# 執行所有 API 層測試
npm run test:api

# 執行特定檔案
npx vitest run tests/unit/api/pointsAPI.test.js
```

### 3.2 產生覆蓋率報告 (Jacoco 對應)

```bash
# 產生 HTML 與 LCOV 格式的覆蓋率報告
npm run test:api:coverage
```

- **查看報告**：打開 `coverage/index.html`

### 3.3 產生靜態分析報告 (PMD 對應)

```bash
# 執行 ESLint 並輸出 HTML 報告
npm run lint:report
```

### 3.4 產生程式碼度量報告 (MetricsReloaded 對應)

```bash
# 計算 WMC 與代碼複雜度
npm run report:metrics
```

---

## 4. 系統要求達成驗證 (Verification Checklist)

截至 **2026-01-02**，本專案已**全面達成**並**超越**課程之畢業門檻要求：

| 系統要求             | 課程門檻 | 本專案實績             | 狀態        | 證明文件/位置                    |
| :------------------- | :------- | :--------------------- | :---------- | :------------------------------- |
| **有意義的功能**     | > 5 個   | **8 個** 大模組        | ✅ **PASS** | `docs/簡報-軟體測試專題.md` p.3  |
| **WMC (複雜度總和)** | > 200    | **2633**               | ✅ **PASS** | `reports/code-metrics.html`      |
| **單元測試數量**     | ≥ 50     | **760+** (API 層 411+) | ✅ **PASS** | `npm run test:api` 輸出          |
| **Branch Coverage**  | ≥ 90%    | **96.16%**             | ✅ **PASS** | `coverage/index.html` (API 層)   |
| **Bug & Fix**        | ≥ 10     | **12 個** 重大修復     | ✅ **PASS** | `docs/簡報-軟體測試專題.md` p.13 |

---

## 5. 書面與口頭報告準備指引

### 5.1 書面報告 (Written Report)

- **參考範本**：`docs/書面報告-軟體測試專題.md`
- **內容重點**：
  - **測試規劃**：引用本文件第 2 節的 ISTQB 標準策略。
  - **測試結果**：截圖 `coverage/index.html` 的摘要表。
  - **Bug 列表**：詳列 12 個已修復的 Bug 及其發現方式（如：BVA 發現點數負值問題）。

### 5.2 口頭報告 (Presentation)

- **參考範本**：`docs/簡報-軟體測試專題.md`
- **Demo 流程建議** (15 min)：
  1.  **專案介紹 (2 min)**：30秒展示首頁，強調 8 大功能。
  2.  **測試架構 (3 min)**：解釋 Vitest 與 JUnit 的對應，展示專案結構。
  3.  **現場跑測試 (3 min)**：執行 `npm run test:api` (讓它跑完顯示綠勾勾，視覺效果佳)。
  4.  **展示報告 (4 min)**：打開 `coverage/index.html` 展示 **96.16%** 的分支覆蓋率 (亮點)。
  5.  **心得與結語 (3 min)**：強調 TDD 對開發的幫助。

---

## 6. 參考資料

- **ISTQB® Certified Tester Foundation Level Syllabus v4.0** - [https://www.istqb.org/](https://www.istqb.org/)
- **Vitest Official Documentation** - [https://vitest.dev/](https://vitest.dev/)
- **ESLint Official Documentation** - [https://eslint.org/](https://eslint.org/)
