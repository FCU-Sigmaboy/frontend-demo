import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { startChat } from '@/api/conversationsAPI'

// Messaging diagnostics composable
// 用途: 協助前端快速檢查後端 Messaging RPC 是否為最新版本並偵測 42702 等遺留問題
export function useMessagingDiagnostics() {
  const running = ref(false)
  const results = ref([])
  const error = ref(null)

  function push(message, data = null, level = 'info') {
    results.value.push({ ts: new Date().toISOString(), level, message, data })
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log']('[MessagingDiag]', message, data || '')
  }

  async function run({ testItemId } = {}) {
    running.value = true
    results.value = []
    error.value = null

    try {
      push('開始診斷 Messaging RPC 與 Realtime 設定')

      // 1. 檢查登入狀態
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        push('尚未登入，部分測試將略過', authErr, 'warn')
      } else {
        push('使用者登入確認', { user_id: user.id })
      }

      // 2. 檢查函式是否存在 + 參數是否符合最新簽章
      const functionChecks = [
        { name: 'create_or_get_conversation', argsLike: '(p_item_id', expectParams: ['p_item_id'] },
        { name: 'get_user_conversations', argsLike: '(p_page', expectParams: ['p_page', 'p_size', 'p_role', 'p_include_deleted'] },
        { name: 'get_conversation_messages', argsLike: '(p_conversation_id', expectParams: ['p_conversation_id', 'p_page', 'p_size'] },
        { name: 'send_message', argsLike: '(p_conversation_id', expectParams: ['p_conversation_id', 'p_content'] },
        { name: 'mark_messages_as_read', argsLike: '(p_conversation_id', expectParams: ['p_conversation_id'] },
        { name: 'get_unread_message_count', argsLike: '()' }
      ]

      for (const fn of functionChecks) {
        const { data: fnRows, error: fnErr } = await supabase
          .rpc('pg_functions')
          .catch(() => ({ data: null, error: null }))
        if (fnErr || !fnRows) {
          push(`無法使用 pg_functions RPC 檢查 ${fn.name}，略過低層 catalog 檢查`, fnErr, 'warn')
          // 移除不必要的 continue; 直接進入下一輪迴圈
        }
        // TODO: 若後端提供 pg_functions 視圖, 可在此比對簽章
      }

      // 3. 實際呼叫 startChat 測試 42702 fallback
      if (testItemId) {
        push('測試 startChat RPC 呼叫', { itemId: testItemId })
        try {
          const convo = await startChat(testItemId)
          push('startChat 成功', convo)
        } catch (e) {
          if (String(e.message).includes('ambiguous')) {
            push('偵測到 42702 模糊欄位錯誤 (前端 fallback 已觸發或需要部署修正)', { error: e.message }, 'error')
          } else {
            push('startChat 失敗', { error: e.message }, 'error')
          }
        }
      } else {
        push('未提供 testItemId，略過 startChat 功能測試', null, 'warn')
      }

      // 4. 建立 realtime channel 快速 smoke test (不訂閱事件僅測試建立)
      const channel = supabase.channel('diag-messaging')
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          push('Realtime channel 建立成功')
          supabase.removeChannel(channel)
          push('Realtime channel 已立即關閉 (smoke test)')
        }
      })
    } catch (e) {
      error.value = e
      push('診斷程序發生未預期錯誤', { error: e.message }, 'error')
    } finally {
      running.value = false
      push('診斷完成')
    }
  }

  return { running, results, error, run }
}
// 此 composable 於 MessagingDiagnosticsPage.vue 中被引用以避免未使用警告
