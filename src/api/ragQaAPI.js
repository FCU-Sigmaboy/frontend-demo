import { supabase } from '@/lib/supabase';

/**
 * 呼叫客服 RAG-QA API
 * @param {string} question - 用戶問題
 * @param {Array} chatHistory - 對話歷史記錄 (可選)
 * @param {number} maxHistory - 最大歷史對話條數 (預設 10)
 * @returns {Promise<Object>} - API 回應
 * @returns {boolean} returns.success - 請求是否成功
 * @returns {string} returns.answer - AI 回答內容
 * @returns {string[]} returns.sources - 參考的文件來源
 * @returns {string} returns.timestamp - 回應時間戳
 * @returns {string} returns.error - 錯誤訊息 (如果有)
 */
export async function askRagQA(question, chatHistory = [], maxHistory = 10) {
  try {
    // 驗證問題參數
    if (!question || typeof question !== 'string' || question.trim() === '') {
      throw new Error('問題不能為空');
    }

    // 格式化對話歷史 (只保留 role 和 content)
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-qa`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          question: question.trim(),
          chat_history: formattedHistory,
          max_history: maxHistory
        })
      }
    );

    const data = await response.json();

    // 處理 API 回傳的錯誤
    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      answer: data.answer,
      sources: data.sources || [],
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('RAG-QA API Error:', error);
    return {
      success: false,
      error: error.message,
      answer: null,
      sources: [],
      timestamp: new Date().toISOString()
    };
  }
}
