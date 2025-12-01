<template>
  <div class="customer-service-wrapper">
    <!-- 聊天視窗 -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="chat-window">
        <!-- 標題列 -->
        <div class="chat-header">
          <div class="header-content">
            <div class="avatar-wrapper">
              <i class="bi bi-robot"></i>
            </div>
            <div>
              <h6 class="mb-0">智慧小助手</h6>
              <small class="text-muted">隨時為您服務</small>
            </div>
          </div>
          <button class="btn-close-chat" @click="toggleChat" aria-label="關閉">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- 對話內容 -->
        <div class="chat-body" ref="chatBodyRef">
          <!-- 歡迎訊息 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <i class="bi bi-chat-heart mb-2"></i>
            <p>您好!我是小助手</p>
            <p class="text-muted small">請問有什麼可以幫助您的嗎?</p>
          </div>

          <!-- 對話記錄 -->
          <div v-for="(msg, index) in messages" :key="index" class="message-wrapper">
            <div :class="['message', msg.role === 'user' ? 'message-user' : 'message-bot']">
              <div class="message-avatar">
                <img 
                  v-if="msg.role === 'user' && userAvatar" 
                  :src="userAvatar" 
                  alt="用戶頭像"
                  class="avatar-image"
                />
                <i v-else :class="msg.role === 'user' ? 'bi bi-person-circle' : 'bi bi-robot'"></i>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessageContent(msg.content)"></div>
                <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- 載入中指示器 -->
          <div v-if="isLoading" class="message message-bot">
            <div class="message-avatar">
              <i class="bi bi-robot"></i>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 輸入區域 -->
        <div class="chat-footer">
          <div class="input-wrapper">
            <input
              v-model="inputMessage"
              type="text"
              class="form-control"
              placeholder="輸入您的問題..."
              @keypress.enter="sendMessage"
              :disabled="isLoading"
            />
            <button
              class="btn-send"
              @click="sendMessage"
              :disabled="!inputMessage.trim() || isLoading"
            >
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
          <button class="btn-clear-history" @click="clearHistory" title="清除對話記錄">
            <i class="bi bi-trash"></i>
            清除記錄
          </button>
        </div>
      </div>
    </Transition>

    <!-- 懸浮按鈕 -->
    <button
      class="chat-bubble"
      :class="{ 'bubble-hidden': isOpen }"
      @click="toggleChat"
      aria-label="開啟客服"
    >
      <i class="bi bi-chat-dots-fill"></i>
      <span v-if="unreadCount > 0" class="badge-count">{{ unreadCount }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { askRagQA } from '../api/ragQaAPI'
import { useAuthStore } from '../stores/auth'

// 狀態管理
const authStore = useAuthStore()
const isOpen = ref(false)
const isLoading = ref(false)
const inputMessage = ref('')
const messages = ref([])
const unreadCount = ref(0)
const chatBodyRef = ref(null)

// 用戶頭像
const userAvatar = computed(() => {
  return authStore.user?.user_metadata?.avatar_url || authStore.user?.user_metadata?.picture || null
})

// Local Storage Key
const STORAGE_KEY = 'customer_service_chat_history'

// 載入對話記錄
onMounted(() => {
  loadChatHistory()
})

// 載入本地對話記錄
function loadChatHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      messages.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('載入對話記錄失敗:', error)
  }
}

// 儲存對話記錄
function saveChatHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
  } catch (error) {
    console.error('儲存對話記錄失敗:', error)
  }
}

// 切換聊天視窗
function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 發送訊息
async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date().toISOString()
  }

  messages.value.push(userMessage)
  saveChatHistory()

  const question = inputMessage.value.trim()
  inputMessage.value = ''

  scrollToBottom()

  // 呼叫 API
  isLoading.value = true
  try {
    // 準備對話歷史 (只取最近 10 條)
    const chatHistory = messages.value
      .slice(-11) // 取 11 條,因為最後一條是剛剛加入的用戶訊息
      .slice(0, -1) // 移除最後一條(當前問題)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    const response = await askRagQA(question, chatHistory, 10)

    if (response.success) {
      const botMessage = {
        role: 'assistant',
        content: response.answer || '抱歉,我無法回答這個問題。',
        timestamp: response.timestamp || new Date().toISOString(),
        sources: response.sources || []
      }
      messages.value.push(botMessage)
      
      // 如果視窗關閉,增加未讀數
      if (!isOpen.value) {
        unreadCount.value++
      }
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error('發送訊息失敗:', error)
    const errorMessage = {
      role: 'assistant',
      content: '抱歉,發生了一些錯誤,請稍後再試。錯誤原因: ' + error.message,
      timestamp: new Date().toISOString()
    }
    messages.value.push(errorMessage)
  } finally {
    isLoading.value = false
    saveChatHistory()
    scrollToBottom()
  }
}

// 清除對話記錄
function clearHistory() {
  if (confirm('確定要清除所有對話記錄嗎?')) {
    messages.value = []
    localStorage.removeItem(STORAGE_KEY)
  }
}

// 格式化訊息內容 (支援超連結)
function formatMessageContent(content) {
  if (!content) return ''
  
  // 先進行基本的 HTML 跳脫
  let escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  // 將換行符號轉換為 <br>
  escapedContent = escapedContent.replace(/\n/g, '<br>')
  
  // 偵測並轉換 Markdown 風格的連結 [文字](URL)
  escapedContent = escapedContent.replace(
    /\[([^\]]+)\]\(([^\)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  
  // 偵測並轉換純 URL (http:// 或 https://)
  escapedContent = escapedContent.replace(
    /(?<!href=&quot;|href=")(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  
  return escapedContent
}

// 格式化時間
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 滾動到底部
function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

// 監聽訊息變化,自動滾動
watch(() => messages.value.length, () => {
  if (isOpen.value) {
    scrollToBottom()
  }
})
</script>

<style scoped>
.customer-service-wrapper {
  position: fixed;
  bottom: 156px; /* scroll-to-top (30px + 56px) + location-switcher 下面的位置 + gap (12px) */
  right: 30px;
  z-index: 9999;

  @media (max-width: 575.98px) {
    bottom: 164px; /* view-toggle-btn (90px) + gap (12px) + location-switcher position */
    right: 24px;
  }
}

/* 懸浮泡泡按鈕 */
.chat-bubble {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6FB8A5 0%, #5fa795 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: white;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(111, 184, 165, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.chat-bubble:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(111, 184, 165, 0.4);
}

.chat-bubble.bubble-hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0);
}

.chat-bubble:active {
  transform: translateY(-1px);
}

.badge-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* 聊天視窗 */
.chat-window {
  position: fixed;
  bottom: 226px; /* customer-service-wrapper (156px) + bubble height (56px) + gap (14px) */
  right: 30px;
  width: 380px;
  height: 550px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 575.98px) {
    bottom: 234px; /* customer-service-wrapper (164px) + bubble height (56px) + gap (14px) */
    width: calc(100vw - 48px);
    max-width: 380px;
    height: 500px;
    right: 24px;
  }
}

/* 標題列 */
.chat-header {
  background: linear-gradient(135deg, #6FB8A5 0%, #5fa795 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.btn-close-chat {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.btn-close-chat:hover {
  opacity: 1;
}

/* 對話內容區域 */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: #6FB8A5;
}

.welcome-message i {
  font-size: 48px;
}

.message-wrapper {
  margin-bottom: 16px;
}

.message {
  display: flex;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.message-user {
  flex-direction: row-reverse;
}

.message-user .message-avatar {
  background: #667eea;
  color: white;
}

.message-bot .message-avatar {
  background: #e9f5f2;
  color: #6FB8A5;
}

.message-content {
  max-width: 70%;
}

.message-text {
  padding: 10px 14px;
  border-radius: 12px;
  word-wrap: break-word;
  line-height: 1.5;
}

/* 訊息中的超連結樣式 */
.message-text :deep(a) {
  color: inherit;
  text-decoration: underline;
  font-weight: 500;
  transition: opacity 0.2s;
}

.message-user .message-text :deep(a) {
  color: #fff;
}

.message-user .message-text :deep(a):hover {
  opacity: 0.8;
}

.message-bot .message-text :deep(a) {
  color: #6FB8A5;
}

.message-bot .message-text :deep(a):hover {
  color: #5fa795;
  text-decoration: underline;
}

.message-user .message-text {
  background: #6FB8A5;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-bot .message-text {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  padding: 0 4px;
}

/* 載入指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: white;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6FB8A5;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

/* 輸入區域 */
.chat-footer {
  padding: 12px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.input-wrapper .form-control {
  flex: 1;
  border-radius: 20px;
  border: 1px solid #dee2e6;
  padding: 8px 16px;
}

.input-wrapper .form-control:focus {
  border-color: #6FB8A5;
  box-shadow: 0 0 0 0.2rem rgba(111, 184, 165, 0.25);
}

.btn-send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #6FB8A5;
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-send:hover:not(:disabled) {
  background: #5fa795;
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear-history {
  width: 100%;
  padding: 6px;
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  color: #6c757d;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-clear-history:hover {
  background: #e9f5f2;
  border-color: #6FB8A5;
  color: #6FB8A5;
}

/* 動畫 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 120px);
    bottom: 90px;
    right: 20px;
  }
}

/* 滾動條樣式 */
.chat-body::-webkit-scrollbar {
  width: 6px;
}

.chat-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-body::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
