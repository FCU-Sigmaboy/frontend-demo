import { supabase } from "@/lib/supabase";

// ===================================================================
// ### 檢舉 API (Report APIs)
// ###
// ### 包含以下功能：
// ###   - 取得檢舉原因列表
// ###   - 提交檢舉
// ###   - 查詢我的檢舉記錄
// ###
// ### 版本歷史:
// ###   - v1.0.0 (2025-12-16): 初版建立
// ===================================================================

// ===========================================
// ## 常數定義
// ===========================================

/**
 * 檢舉類型列表
 */
export const REPORT_TYPES = {
  USER: "user",
  ITEM: "item",
  MESSAGE: "message",
  TRANSACTION: "transaction",
};

/**
 * 檢舉狀態列表
 */
export const REPORT_STATUS = {
  PENDING: "pending",
  REVIEWING: "reviewing",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
};

// ===========================================
// ## 取得檢舉原因列表
// ===========================================

/**
 * 取得特定類型的檢舉原因列表
 *
 * @param {'user' | 'item' | 'message' | 'transaction'} reportType - 檢舉類型
 * @returns {Promise<Array>} - 回傳檢舉原因列表
 * @throws {Error} - 當取得失敗時拋出錯誤
 *
 * @example
 * // 取得商品檢舉的原因列表
 * const reasons = await getReportReasons('item');
 * console.log(reasons);
 * // [
 * //   { id: 1, reason_code: 'FAKE_PRODUCT', reason_label: '假冒商品', description: '...' },
 * //   { id: 2, reason_code: 'PROHIBITED_ITEM', reason_label: '違禁商品', description: '...' }
 * // ]
 */
export async function getReportReasons(reportType) {
  // 1. 參數驗證
  const validTypes = Object.values(REPORT_TYPES);
  if (!validTypes.includes(reportType)) {
    throw new Error(
      `無效的檢舉類型：${reportType}，有效類型為：${validTypes.join(", ")}`,
    );
  }

  // 2. 查詢資料庫
  const { data, error } = await supabase
    .from("report_reasons")
    .select("id, reason_code, reason_label, description")
    .eq("report_type", reportType)
    .eq("is_active", true)
    .order("display_order");

  // 3. 錯誤處理
  if (error) {
    console.error("取得檢舉原因失敗:", error);
    throw new Error(error.message);
  }

  // 4. 回傳資料
  return data || [];
}

// ===========================================
// ## 提交檢舉
// ===========================================

/**
 * 提交檢舉
 *
 * @param {Object} reportData - 檢舉資料
 * @param {'user' | 'item' | 'message' | 'transaction'} reportData.report_type - 檢舉類型（必填）
 * @param {number} reportData.target_id - 被檢舉對象的 ID（必填）
 * @param {string} [reportData.target_user_id] - 被檢舉用戶的 UUID（用戶檢舉必填）
 * @param {string} reportData.reason_code - 檢舉原因代碼（必填）
 * @param {number} [reportData.reason_id] - 檢舉原因 ID（建議提供）
 * @param {string} [reportData.description] - 詳細說明（選填，最多 1000 字）
 * @param {string[]} [reportData.evidence_urls] - 證據圖片網址陣列（選填）
 * @returns {Promise<Object>} - 回傳提交結果
 * @throws {Error} - 當提交失敗時拋出錯誤
 *
 * @example
 * // 檢舉商品
 * const result = await submitReport({
 *   report_type: 'item',
 *   target_id: 123,
 *   reason_code: 'FAKE_PRODUCT',
 *   description: '此商品為仿冒品'
 * });
 *
 * @example
 * // 檢舉用戶（需要提供 target_user_id）
 * const result = await submitReport({
 *   report_type: 'user',
 *   target_id: 0,
 *   target_user_id: 'user-uuid-here',
 *   reason_code: 'FRAUD',
 *   description: '詐騙行為'
 * });
 */
export async function submitReport(reportData) {
  // 1. 驗證必填欄位
  if (!reportData.report_type) {
    throw new Error("缺少必填欄位：report_type");
  }

  if (reportData.target_id === null || reportData.target_id === undefined) {
    throw new Error("缺少必填欄位：target_id");
  }

  if (!reportData.reason_code) {
    throw new Error("缺少必填欄位：reason_code");
  }

  // 2. 用戶檢舉必須提供 target_user_id
  if (
    reportData.report_type === REPORT_TYPES.USER &&
    !reportData.target_user_id
  ) {
    throw new Error("用戶檢舉必須提供 target_user_id");
  }

  // 3. 驗證描述長度
  if (reportData.description && reportData.description.length > 1000) {
    throw new Error("描述內容不可超過 1000 字");
  }

  // 4. 準備請求參數
  const requestBody = {
    report_type: reportData.report_type,
    target_id: reportData.target_id,
    reason_code: reportData.reason_code,
  };

  // 加入選填欄位
  if (reportData.target_user_id) {
    requestBody.target_user_id = reportData.target_user_id;
  }
  if (reportData.reason_id) {
    requestBody.reason_id = reportData.reason_id;
  }
  if (reportData.description) {
    requestBody.description = reportData.description;
  }
  if (reportData.evidence_urls && reportData.evidence_urls.length > 0) {
    requestBody.evidence_urls = reportData.evidence_urls;
  }

  // 5. 呼叫 Edge Function
  const { data, error } = await supabase.functions.invoke("submit-report", {
    body: requestBody,
  });

  // 6. 錯誤處理
  if (error) {
    console.error("提交檢舉失敗:", error);
    throw new Error(error.message);
  }

  // 7. 檢查回傳結果
  if (!data.success) {
    throw new Error(data.error || "提交檢舉失敗");
  }

  // 8. 回傳資料
  return data.data;
}

// ===========================================
// ## 查詢我的檢舉記錄
// ===========================================

/**
 * 取得我提交的檢舉記錄
 *
 * @param {Object} [params] - 查詢參數
 * @param {number} [params.page=1] - 頁碼，預設為 1
 * @param {number} [params.pageSize=20] - 每頁數量，預設為 20
 * @param {'user' | 'item' | 'message' | 'transaction'} [params.reportType] - 篩選檢舉類型
 * @param {'pending' | 'reviewing' | 'resolved' | 'dismissed'} [params.status] - 篩選狀態
 * @returns {Promise<Array>} - 回傳檢舉記錄列表
 * @throws {Error} - 當取得失敗時拋出錯誤
 *
 * @example
 * // 取得所有我的檢舉
 * const reports = await getMyReports();
 *
 * @example
 * // 取得特定類型的檢舉
 * const reports = await getMyReports({ reportType: 'item' });
 *
 * @example
 * // 分頁取得
 * const reports = await getMyReports({ page: 2, pageSize: 10 });
 */
export async function getMyReports(params = {}) {
  // 1. 設定預設參數
  const { page = 1, pageSize = 20, reportType, status } = params;

  // 2. 計算分頁範圍
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 3. 建立查詢
  let query = supabase
    .from("reports")
    .select(
      `
      id,
      report_type,
      target_id,
      reason_code,
      description,
      status,
      priority,
      created_at,
      updated_at,
      reason:report_reasons(reason_label)
    `,
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  // 4. 加入篩選條件
  if (reportType) {
    query = query.eq("report_type", reportType);
  }
  if (status) {
    query = query.eq("status", status);
  }

  // 5. 執行查詢
  const { data, error } = await query;

  // 6. 錯誤處理
  if (error) {
    console.error("取得檢舉記錄失敗:", error);
    throw new Error(error.message);
  }

  // 7. 回傳資料
  return data || [];
}

/**
 * 取得單筆檢舉詳情
 *
 * @param {number} reportId - 檢舉 ID
 * @returns {Promise<Object>} - 回傳檢舉詳情
 * @throws {Error} - 當取得失敗或檢舉不存在時拋出錯誤
 *
 * @example
 * const report = await getReportDetail(123);
 */
export async function getReportDetail(reportId) {
  // 1. 參數驗證
  if (!reportId) {
    throw new Error("必須提供檢舉 ID");
  }

  // 2. 查詢資料庫
  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_type,
      target_id,
      target_user_id,
      reason_code,
      description,
      evidence_urls,
      status,
      priority,
      created_at,
      updated_at,
      reason:report_reasons(id, reason_code, reason_label, description)
    `,
    )
    .eq("id", reportId)
    .single();

  // 3. 錯誤處理
  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("檢舉記錄不存在");
    }
    console.error("取得檢舉詳情失敗:", error);
    throw new Error(error.message);
  }

  // 4. 回傳資料
  return data;
}

/* 回傳 data 範例 (getMyReports)
[
  {
    "id": 1,
    "report_type": "item",
    "target_id": 123,
    "reason_code": "FAKE_PRODUCT",
    "description": "此商品為仿冒品",
    "status": "pending",
    "priority": "normal",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T10:30:00Z",
    "reason": {
      "reason_label": "假冒商品"
    }
  }
]
*/
