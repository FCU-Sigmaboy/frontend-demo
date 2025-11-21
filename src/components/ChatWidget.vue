<template>
  <div class="chat-widget-container">
    <!-- Floating Chat Button -->
    <Transition name="fade">
      <button
        v-if="!isOpen"
        class="chat-float-button"
        @click="toggleChat"
        aria-label="開啟客服聊天"
      >
        <i class="bi bi-chat-dots"></i>
        <span v-if="hasUnread" class="unread-badge">{{ unreadCount }}</span>
      </button>
    </Transition>

    <!-- Chat Window -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="chat-window" :class="{ 'mobile-fullscreen': isMobile }">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <div class="bot-avatar">
              <i class="bi bi-robot"></i>
            </div>
            <div class="header-info">
              <h3 class="bot-name">AI 客服助手</h3>
              <span class="bot-status">
                <span class="status-dot"></span>
                線上服務中
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button
              v-if="!isMobile"
              class="header-btn"
              @click="minimizeChat"
              aria-label="最小化"
            >
              <i class="bi bi-dash-lg"></i>
            </button>
            <button
              class="header-btn"
              @click="closeChat"
              aria-label="關閉"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div ref="messagesContainer" class="chat-messages">
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-icon">
              <i class="bi bi-chat-heart"></i>
            </div>
            <h4>您好！我是 AI 客服助手</h4>
            <p>我可以幫您解答平台使用問題、商品搜尋、交易流程等。請問有什麼可以幫您的嗎？</p>
          </div>

          <!-- Message List -->
          <div v-for="(msg, index) in messages" :key="msg.id" class="message-wrapper">
            <div :class="['message', msg.role]">
              <div v-if="msg.role === 'assistant'" class="message-avatar">
                <i class="bi bi-robot"></i>
              </div>
              <div class="message-content">
                <div class="message-bubble">
                  <p v-html="formatMessage(msg.content)"></p>
                  
                  <!-- Links -->
                  <div v-if="msg.links && msg.links.length > 0" class="message-links">
                    <a
                      v-for="(link, idx) in msg.links"
                      :key="idx"
                      :href="link.url"
                      class="message-link-btn"
                      @click.prevent="handleLinkClick(link.url)"
                    >
                      {{ link.text }}
                      <i class="bi bi-arrow-right"></i>
                    </a>
                  </div>
                </div>
                
                <!-- Rating Buttons (for assistant messages only) -->
                <div v-if="msg.role === 'assistant' && !msg.rated" class="message-rating">
                  <button
                    class="rating-btn"
                    @click="rateMessage(msg.id, 'positive')"
                    aria-label="有幫助"
                  >
                    <i class="bi bi-hand-thumbs-up"></i>
                  </button>
                  <button
                    class="rating-btn"
                    @click="rateMessage(msg.id, 'negative')"
                    aria-label="沒幫助"
                  >
                    <i class="bi bi-hand-thumbs-down"></i>
                  </button>
                </div>
                
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </div>

            <!-- Suggestion Chips (show after last assistant message) -->
            <div
              v-if="msg.role === 'assistant' && index === messages.length - 1 && suggestions.length > 0"
              class="suggestion-chips"
            >
              <button
                v-for="(suggestion, idx) in suggestions"
                :key="idx"
                class="suggestion-chip"
                @click="handleSuggestionClick(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="message-wrapper">
            <div class="message assistant">
              <div class="message-avatar">
                <i class="bi bi-robot"></i>
              </div>
              <div class="message-content">
                <div class="message-bubble loading">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
          <div class="input-wrapper">
            <textarea
              ref="inputField"
              v-model="inputText"
              class="chat-input"
              placeholder="輸入訊息..."
              rows="1"
              :maxlength="1000"
              @keydown.enter.exact.prevent="sendMessage"
              @input="autoResize"
            ></textarea>
            <button
              class="send-button"
              :disabled="!inputText.trim() || isLoading"
              @click="sendMessage"
              aria-label="發送訊息"
            >
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
          <div class="input-footer">
            <span class="char-count">{{ inputText.length }}/1000</span>
            <button class="clear-btn" @click="showClearConfirm = true">
              <i class="bi bi-trash"></i>
              清除對話
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Clear Conversation Confirmation Modal -->
    <Transition name="fade">
      <div v-if="showClearConfirm" class="modal-overlay" @click="showClearConfirm = false">
        <div class="modal-content" @click.stop>
          <h4>清除對話記錄？</h4>
          <p>此操作將清除所有對話內容，無法復原。</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showClearConfirm = false">取消</button>
            <button class="btn-confirm" @click="clearConversation">確認清除</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Escalation Modal -->
    <Transition name="fade">
      <div v-if="showEscalation" class="modal-overlay" @click="showEscalation = false">
        <div class="modal-content escalation-modal" @click.stop>
          <h4>需要更多協助？</h4>
          <p>我們可以為您轉接人工客服</p>
          <div class="escalation-options">
            <button class="escalation-btn" @click="handleContactPage">
              <i class="bi bi-envelope"></i>
              前往聯絡頁面
            </button>
            <button class="escalation-btn primary" @click="showEmailForm = true">
              <i class="bi bi-send"></i>
              發送郵件
            </button>
          </div>
          <button class="btn-cancel" @click="showEscalation = false">取消</button>
        </div>
      </div>
    </Transition>

    <!-- Email Form Modal -->
    <Transition name="fade">
      <div v-if="showEmailForm" class="modal-overlay" @click="showEmailForm = false">
        <div class="modal-content email-modal" @click.stop>
          <h4>發送郵件給客服</h4>
          <div class="form-group">
            <label>您的 Email</label>
            <input
              v-model="userEmail"
              type="email"
              class="form-input"
              :disabled="isAuthenticated"
              placeholder="your@email.com"
            />
          </div>
          <div class="form-group">
            <label>問題描述</label>
            <textarea
              v-model="issueDescription"
              class="form-textarea"
              rows="4"
              placeholder="請描述您遇到的問題..."
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showEmailForm = false">取消</button>
            <button
              class="btn-confirm"
              :disabled="!userEmail || !issueDescription"
              @click="sendEscalationEmail"
            >
              發送
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { sendChatMessage, submitFeedback, escalateToSupport } from '@/api/chatbotAPI'

const router = useRouter()
const authStore = useAuthStore()

// State
const isOpen = ref(false)
const isLoading = ref(false)
const messages = ref([])
const inputText = ref('')
const suggestions = ref([])
const conversationId = ref(null)
const hasUnread = ref(false)
const unreadCount = ref(0)
const showClearConfirm = ref(false)
const showEscalation = ref(false)
const showEmailForm = ref(false)
const userEmail = ref('')
const issueDescription = ref('')

// Refs
const messagesContainer = ref(null)
const inputField = ref(null)

// Computed
const isMobile = computed(() => window.innerWidth < 768)
const isAuthenticated = computed(() => authStore.isLoggedIn)

// Load conversation from localStorage
const loadConversation = () => {
  try {
    const saved = localStorage.getItem('chatbot_conversation')
    if (saved) {
      const data = JSON.parse(saved)
      messages.value = data.messages || []
      conversationId.value = data.conversationId || null
      suggestions.value = data.suggestions || []
    }
  } catch (error) {
    console.error('[ChatWidget] Error loading conversation:', error)
  }
}

// Save conversation to localStorage
const saveConversation = () => {
  try {
    localStorage.setItem('chatbot_conversation', JSON.stringify({
      messages: messages.value,
      conversationId: conversationId.value,
      suggestions: suggestions.value
    }))
  } catch (error) {
    console.error('[ChatWidget] Error saving conversation:', error)
  }
}

// Toggle chat window
const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    hasUnread.value = false
    unreadCount.value = 0
    nextTick(() => {
      scrollToBottom()
      inputField.value?.focus()
    })
  }
}

// Close chat
const closeChat = () => {
  isOpen.value = false
}

// Minimize chat (desktop only)
const minimizeChat = () => {
  isOpen.value = false
}

// Auto-resize textarea
const autoResize = () => {
  const textarea = inputField.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }
}

// Scroll to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Send message
const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  // Add user message
  const userMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: text,
    timestamp: new Date().toISOString()
  }
  messages.value.push(userMessage)
  inputText.value = ''
  suggestions.value = []
  
  // Reset textarea height
  if (inputField.value) {
    inputField.value.style.height = 'auto'
  }

  scrollToBottom()
  isLoading.value = true

  try {
    // Call API
    const response = await sendChatMessage(text, conversationId.value, 'zh-TW')
    
    // Update conversation ID
    if (response.conversationId) {
      conversationId.value = response.conversationId
    }

    // Add bot response
    const botMessage = {
      id: response.messageId || Date.now().toString(),
      role: 'assistant',
      content: response.response,
      links: response.links || [],
      timestamp: new Date().toISOString(),
      rated: false
    }
    messages.value.push(botMessage)

    // Update suggestions
    if (response.suggestions && response.suggestions.length > 0) {
      suggestions.value = response.suggestions
    }

    // Check if escalation is suggested
    if (response.shouldEscalate) {
      setTimeout(() => {
        showEscalation.value = true
      }, 1000)
    }

    // Show unread if window is closed
    if (!isOpen.value) {
      hasUnread.value = true
      unreadCount.value++
    }

    scrollToBottom()
    saveConversation()
  } catch (error) {
    console.error('[ChatWidget] Error sending message:', error)
    
    // Add error message
    const errorMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '抱歉，目前無法處理您的訊息。請稍後再試，或直接聯繫客服。',
      timestamp: new Date().toISOString(),
      rated: false
    }
    messages.value.push(errorMessage)
    scrollToBottom()
  } finally {
    isLoading.value = false
  }
}

// Handle suggestion click
const handleSuggestionClick = (suggestion) => {
  inputText.value = suggestion
  sendMessage()
}

// Handle link click
const handleLinkClick = (url) => {
  if (url.startsWith('/')) {
    // Internal link - use router
    router.push(url)
    closeChat()
  } else {
    // External link - open in new tab
    window.open(url, '_blank')
  }
}

// Rate message
const rateMessage = async (messageId, rating) => {
  try {
    await submitFeedback(messageId, rating)
    
    // Mark message as rated
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.rated = true
    }

    // If negative rating, show escalation after a delay
    if (rating === 'negative') {
      setTimeout(() => {
        showEscalation.value = true
      }, 500)
    }

    saveConversation()
  } catch (error) {
    console.error('[ChatWidget] Error rating message:', error)
  }
}

// Clear conversation
const clearConversation = () => {
  messages.value = []
  conversationId.value = null
  suggestions.value = []
  showClearConfirm.value = false
  localStorage.removeItem('chatbot_conversation')
}

// Handle contact page
const handleContactPage = () => {
  showEscalation.value = false
  router.push({ name: 'FAQ' }) // Adjust route name as needed
  closeChat()
}

// Send escalation email
const sendEscalationEmail = async () => {
  if (!userEmail.value || !issueDescription.value) return

  try {
    await escalateToSupport(conversationId.value, issueDescription.value)
    
    // Show success message
    const successMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '已成功發送郵件給客服團隊！我們會在 24 小時內回覆您。',
      timestamp: new Date().toISOString(),
      rated: false
    }
    messages.value.push(successMessage)
    
    showEmailForm.value = false
    showEscalation.value = false
    issueDescription.value = ''
    
    scrollToBottom()
    saveConversation()
  } catch (error) {
    console.error('[ChatWidget] Error sending escalation email:', error)
    alert('發送失敗，請稍後再試')
  }
}

// Format message (convert URLs to links, line breaks, etc.)
const formatMessage = (text) => {
  if (!text) return ''
  
  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g
  let formatted = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  
  // Convert line breaks
  formatted = formatted.replace(/\n/g, '<br>')
  
  return formatted
}

// Format time
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // Less than 1 minute
  if (diff < 60000) {
    return '剛剛'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} 分鐘前`
  }
  
  // Same day
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  }
  
  // Different day
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

// Watch auth state to update email
watch(() => authStore.user, (user) => {
  if (user?.email) {
    userEmail.value = user.email
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  loadConversation()
  
  // Set user email if authenticated
  if (authStore.user?.email) {
    userEmail.value = authStore.user.email
  }
})

onBeforeUnmount(() => {
  saveConversation()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.chat-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
  font-family: 'Noto Sans TC', 'Inter', sans-serif;
}

// Floating Button
.chat-float-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary 0%, #5fa795 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(111, 184, 165, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(111, 184, 165, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }

  i {
    font-size: 28px;
    color: white;
  }

  .unread-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ff4757;
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
  }
}

// Chat Window
.chat-window {
  width: 380px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.mobile-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100vh;
    border-radius: 0;
    z-index: 9999;
  }
}

// Header
.chat-header {
  background: linear-gradient(135deg, $primary 0%, #5fa795 100%);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bot-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 24px;
      color: white;
    }
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .bot-name {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .bot-status {
    font-size: 12px;
    opacity: 0.9;
    display: flex;
    align-items: center;
    gap: 6px;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s ease-in-out infinite;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .header-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    i {
      font-size: 16px;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// Messages Area
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 3px;

    &:hover {
      background: #b0b0b0;
    }
  }
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: #666;

  .welcome-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary 0%, #5fa795 100%);
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 32px;
      color: white;
    }
  }

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message {
  display: flex;
  gap: 8px;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background: $primary;
      color: white;
      border-radius: 16px 16px 4px 16px;
    }
  }

  &.assistant {
    .message-bubble {
      background: white;
      color: #333;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary 0%, #5fa795 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 18px;
    color: white;
  }
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 75%;
}

.message-bubble {
  padding: 12px 16px;
  word-wrap: break-word;

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;

    :deep(a) {
      color: inherit;
      text-decoration: underline;
    }
  }

  &.loading {
    padding: 16px;
  }
}

.message-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.message-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(111, 184, 165, 0.1);
  color: $primary;
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: rgba(111, 184, 165, 0.2);
    transform: translateX(2px);
  }

  i {
    font-size: 12px;
  }
}

.message-rating {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.rating-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  i {
    font-size: 14px;
    color: #666;
  }

  &:hover {
    background: #e0e0e0;
    transform: scale(1.1);

    i {
      color: $primary;
    }
  }
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

// Typing Indicator
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: typing 1.4s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

// Suggestion Chips
.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 40px;
}

.suggestion-chip {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $primary;
    color: white;
    border-color: $primary;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(111, 184, 165, 0.3);
  }
}

// Input Area
.chat-input-area {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  font-family: 'Noto Sans TC', 'Inter', sans-serif;
  resize: none;
  max-height: 120px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: $primary;
  }

  &::placeholder {
    color: #999;
  }
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: $primary;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #5fa795;
    transform: scale(1.05);
  }

  &:disabled {
    background: #d0d0d0;
    cursor: not-allowed;
  }

  i {
    font-size: 16px;
  }
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
}

.char-count {
  font-size: 11px;
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #666;
  }

  i {
    font-size: 12px;
  }
}

// Modals
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  h4 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #333;
  }

  p {
    font-size: 14px;
    color: #666;
    margin: 0 0 20px 0;
    line-height: 1.5;
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;

  &:hover {
    background: #e0e0e0;
  }
}

.btn-confirm {
  background: $primary;
  color: white;

  &:hover {
    background: #5fa795;
  }

  &:disabled {
    background: #d0d0d0;
    cursor: not-allowed;
  }
}

.escalation-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.escalation-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e0e0e0;
  background: white;
  color: #333;

  &:hover {
    background: #f9f9f9;
    border-color: $primary;
  }

  &.primary {
    background: $primary;
    color: white;
    border-color: $primary;

    &:hover {
      background: #5fa795;
    }
  }

  i {
    font-size: 16px;
  }
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 6px;
  }
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Noto Sans TC', 'Inter', sans-serif;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: $primary;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  animation: slideUp 0.3s ease-out;
}

.slide-up-leave-active {
  animation: slideDown 0.3s ease-in;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

// Mobile Responsive
@media (max-width: 767px) {
  .chat-widget-container {
    bottom: 16px;
    right: 16px;
  }

  .chat-float-button {
    width: 56px;
    height: 56px;

    i {
      font-size: 26px;
    }
  }

  .chat-window {
    width: 100%;
    height: 100vh;
    border-radius: 0;
  }

  .modal-overlay {
    padding: 16px;
  }

  .modal-content {
    max-width: 100%;
  }
}

// Accessibility
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
