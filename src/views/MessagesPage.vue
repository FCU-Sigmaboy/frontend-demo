<template>
  <div class="messages-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="messages-container">
        <div class="messages-layout">
          <!-- Conversations List -->
          <ConversationsSidebar
            :loading="loading"
            :conversations="displayConversations"
            :selected-id="selectedConversation?.id ?? null"
            :filters="filters"
            v-model:search-query="searchQuery"
            v-model:active-filter="activeFilter"
            :mobile-hidden="!!selectedConversation"
            @select="selectConversation"
          />

          <!-- Chat Area -->
          <div :class="['chat-area', { 'mobile-visible': selectedConversation || messagesLoading }]">
            <!-- No Conversation Selected -->
            <div v-if="!selectedConversation && !messagesLoading" class="no-conversation">
              <i class="bi bi-chat-dots"></i>
              <h3>選擇對話開始聊天</h3>
              <p>從左側選擇一個對話，開始與其他使用者交流</p>
            </div>

            <!-- Active Chat (or Loading) -->
            <div v-else class="active-chat">
              <!-- Chat Header -->
              <ChatHeader
                v-if="selectedConversation || messagesLoading"
                :conversation="selectedConversation"
                :show-more-menu="showMoreMenu"
                :messages-loading="messagesLoading"
                @back="deselectConversation"
                @toggle-menu="showMoreMenu = !showMoreMenu"
                @archive="handleArchiveConversation"
              />

              <ChatMessages
                :register-messages-area="registerMessagesArea"
                :messages-loading="messagesLoading"
                :grouped-messages="groupedMessages"
                :is-loading-more-messages="isLoadingMoreMessages"
                @scroll="handleMessagesScroll"
                @open-item="openItemPage"
                @retry="retryMessage"
              />

              <div
                class="chat-overlay-stack"
                :class="{
                  'has-scroll-button': showScrollToBottomBtn,
                  'has-pending-reference': !!pendingItemReference,
                  'has-typing-indicator': showBottomTypingIndicator && !!selectedConversation
                }"
              >
                <ChatScrollControls
                  :show-scroll-to-bottom-btn="showScrollToBottomBtn"
                  :scroll-button-label="scrollButtonLabel"
                  :pending-item-reference="pendingItemReference"
                  @scroll-to-bottom="scrollToBottom"
                />

                <!-- Pending Item Reference (above input, outside wrapper for animation) -->
                <transition name="item-reference-slide">
                  <div v-if="pendingItemReference" class="pending-item-reference">
                    <div class="reference-info">
                      <img
                        v-if="pendingItemReference.image"
                        :src="pendingItemReference.image"
                        alt="提及物品"
                        class="reference-thumbnail"
                      />
                      <i v-else class="bi bi-box-seam"></i>
                      <div class="reference-details">
                        <span class="reference-label">提及物品</span>
                        <span class="reference-title">{{ pendingItemReference.title }}</span>
                        <span v-if="pendingItemPrice" class="reference-meta">{{ pendingItemPrice }}</span>
                      </div>
                    </div>
                    <button class="remove-reference-btn" @click="removePendingItemReference">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </transition>

                <transition name="typing-indicator-slide">
                  <div
                    v-if="showBottomTypingIndicator && selectedConversation"
                    class="typing-indicator-wrapper"
                  >
                    <div class="typing-indicator" aria-live="polite">
                      <span class="typing-dots" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                      <span class="typing-text">{{ typingIndicatorBaseText }}...</span>
                    </div>
                  </div>
                </transition>
              </div>

              <!-- Input Area -->
              <div class="input-area-wrapper">
                <div class="input-area">
                  <button class="attach-btn" @click="handleAttachment">
                    <i class="bi bi-paperclip"></i>
                  </button>
                  <input
                    v-model="messageInput"
                    type="text"
                    placeholder="輸入訊息..."
                    class="message-input"
                    @keypress.enter="sendMessage"
                  />
                  <button
                    class="send-btn"
                    :disabled="!messageInput.trim()"
                    @click="sendMessage"
                  >
                    <i class="bi bi-send-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import ConversationsSidebar from '@/components/messages/ConversationsSidebar.vue';
import ChatHeader from '@/components/messages/ChatHeader.vue';
import ChatMessages from '@/components/messages/ChatMessages.vue';
import ChatScrollControls from '@/components/messages/ChatScrollControls.vue';
import { useMessagePage } from '@/composables/useMessagePage';

const {
  userPoints,
  searchQuery,
  activeFilter,
  messageInput,
  messagesArea,
  showMoreMenu,
  messagesLoading,
  pendingItemReference,
  pendingItemPrice,
  showScrollToBottomBtn,
  isLoadingMoreMessages,
  scrollButtonLabel,
  showBottomTypingIndicator,
  typingIndicatorBaseText,
  loading,
  filters,
  displayConversations,
  selectedConversation,
  currentUser,
  groupedMessages,
  selectConversation,
  deselectConversation,
  handleArchiveConversation,
  handleAttachment,
  sendMessage,
  retryMessage,
  openItemPage,
  removePendingItemReference,
  handleMessagesScroll,
  registerMessagesArea,
  scrollToBottom
} = useMessagePage();
</script>

<style scoped lang="scss">
@import '@/styles/variables';

:global(.typing-indicator-slide-enter-active),
:global(.typing-indicator-slide-leave-active) {
  transition: max-height 0.28s ease,
              padding-top 0.28s ease,
              padding-bottom 0.28s ease,
              opacity 0.2s ease;
}

:global(.typing-indicator-slide-enter-from),
:global(.typing-indicator-slide-leave-to) {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
}

:global(.typing-indicator-slide-enter-to),
:global(.typing-indicator-slide-leave-from) {
  max-height: 56px;
  padding-top: 0;
  padding-bottom: 10px;
  opacity: 1;
}

// ============================================
// Z-Index 層級說明 (Z-Index Hierarchy)
// ============================================
// 1000: .keyboard-open .input-area-wrapper (鍵盤開啟時的輸入框)
// 100:  .input-area-wrapper (一般輸入框)
// 60:   .scroll-to-bottom-btn-floating (回到最新按鈕 - ChatScrollControls)
// 50:   .pending-item-reference (物品引用卡片)
// 10:   .input-area-wrapper (手機版)
// ============================================

.messages-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  
  // Mobile viewport fix - use fallback pattern
  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available;
    max-height: -webkit-fill-available;
  }
  
  // Ensure touch scrolling works properly on mobile
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation; // Allow native scrolling
}

.main-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
  // Ensure content doesn't get hidden by footer on mobile
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.messages-container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  // Calculate height properly on mobile devices
  height: calc(100vh - 50px - env(safe-area-inset-bottom, 0px));
  
  // iOS Safari support
  @supports (-webkit-touch-callout: none) {
    height: calc(-webkit-fill-available - 50px - env(safe-area-inset-bottom, 0px));
  }
}

.messages-layout {
  display: flex;
  flex: 1;
  background: white;
  height: 100%;
}

// Chat Area
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.no-conversation {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;

  i {
    font-size: 80px;
    color: #e0e0e0;
    margin-bottom: 20px;
  }

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 8px 0;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

// Active Chat
.active-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; // Allow flex item to shrink
  position: relative; // 為浮動按鈕定位
  overflow: hidden; // Prevent scroll on chat container itself - only messages-area should scroll
}

.chat-overlay-stack {
  display: flex;
  flex-direction: column;
  // gap: 10px;
  position: relative;
  padding-top: 0;
  background-color: #f9f9f9;
}

.chat-overlay-stack.has-scroll-button {
  padding-top: 12px;
}

.chat-overlay-stack.has-pending-reference {
  gap: 12px;
}

.chat-overlay-stack.has-typing-indicator {
  gap: 10px;
}

.typing-indicator-wrapper {
  padding: 0 24px 10px;
  max-height: 56px;
  overflow: hidden;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  color: #4a4a4a;
  opacity: 0.9;
  overflow: hidden;
  background: transparent !important;
}

.typing-text,
.typing-dots {
  position: relative;
  z-index: 1;
}

.typing-text {
  font-weight: 500;
  color: #555;
}

.typing-dots {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $primary;
  opacity: 0.25;
  animation: typing-dot 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-dot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.25;
  }
  30% {
    transform: translateY(-4px);
    opacity: 0.6;
  }
}


// Item Reference Slide Transition (向下沉到輸入框後方)
.item-reference-slide-enter-active {
  transition: all 0.8s ease-out;
}

.item-reference-slide-leave-active {
  transition: opacity 0.3s ease-in, 
              transform 0.4s ease-in,
              max-height 0.4s ease-in,
              padding 0.4s ease-in,
              background-color 0.3s ease-in,
              border-color 0.3s ease-in;
}

.item-reference-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.item-reference-slide-leave-to {
  opacity: 0;
  transform: translateY(100px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  background-color: transparent;
  border-color: transparent;
}

// ============================================
// Keyframes
// ============================================

@keyframes messagePop {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes messageContentPop {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// ============================================
// 輸入框和物品引用 (Input Area & Item Reference)
// ============================================

// Input Area Wrapper (包含輸入框)
.input-area-wrapper {
  display: flex;
  flex-direction: column;
  background: white;
  border-top: 1px solid #e0e0e0;
  z-index: 100; // 最高層級,確保在所有元素上方
}

// Pending Item Reference (在輸入框上方，獨立於 wrapper 外)
.pending-item-reference {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #f0faf8;
  border-bottom: 1px solid #e0e0e0;
  border-top: 1px solid #e0e0e0;
  overflow: hidden;
  position: relative;
  z-index: 50; // 比 input-area-wrapper (100) 低,會沉到輸入框後方
  
  // 背景色參與過渡動畫,避免白色殘影
  &.item-reference-slide-leave-active {
    background: transparent;
    border-color: transparent;
  }

  .reference-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    color: $primary;

    i {
      font-size: 16px;
    }

    .reference-thumbnail {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .reference-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: #1e1e1e;
      line-height: 1.2;
    }

    .reference-label {
      font-size: 13px;
      font-weight: 500;
      color: $primary;
    }

    .reference-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
    }

    .reference-meta {
      font-size: 12px;
      color: rgba(30, 30, 30, 0.65);
    }
  }

  .remove-reference-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;

    i {
      font-size: 20px;
      color: #666;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.05);

      i {
        color: #1e1e1e;
      }
    }
  }
}

// Input Area
.input-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;

  .attach-btn,
  .send-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;

    i {
      font-size: 20px;
      color: #666;
    }

    &:hover {
      background: #f5f5f5;
    }
  }

  .send-btn {
    &:not(:disabled) {
      i {
        color: $primary;
      }

      &:hover {
        background: $primary;

        i {
          color: white;
        }
      }
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .message-input {
    flex: 1;
    padding: 12px 16px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 24px;
    outline: none;
    transition: all 0.3s;

    &:focus {
      border-color: $primary;
      background: white;
    }

    &::placeholder {
      color: #999;
    }
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  i {
    font-size: 60px;
    color: #e0e0e0;
    margin-bottom: 16px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

// Responsive
@media (max-width: 991.98px) {
  .messages-container {
    height: calc(100vh - 60px);
  }

  .chat-area {
    &.mobile-visible {
      display: flex;
    }

    &:not(.mobile-visible) {
      display: none;
    }
  }
}

@media (max-width: 575.98px) {
  .messages-layout {
    flex-direction: column;
    overflow: hidden; // Critical: Prevent layout from scrolling
  }

  .chat-area {
    width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0; // Allow flex item to shrink
    overflow: hidden; // Prevent outer container from scrolling
  }

  .active-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    height: -webkit-fill-available; // For iOS Safari
    flex: 1;
    min-height: 0; // Critical for nested flex containers
    overflow: hidden; // Only messages-area should scroll
    background: #f9f9f9; // 與 messages-area 和 chat-overlay-stack 背景一致
  }

  .chat-overlay-stack {
    padding-bottom: 64px; // 為固定在底部的 input-area-wrapper 預留空間 (12px padding-top + 40px content + 12px padding-bottom)
  }

  // 固定 input-area-wrapper 在底部
  .input-area-wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 64px; // 固定高度
    z-index: 100; // 保持與桌面版一致
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05); // 增加陰影效果
  }

  .pending-item-reference {
    padding: 10px 16px;

    .reference-info {
      gap: 6px;

      i {
        font-size: 14px;
      }

      .reference-label {
        font-size: 12px;
      }

      .reference-title {
        font-size: 13px;
      }
    }

    .remove-reference-btn {
      width: 26px;
      height: 26px;

      i {
        font-size: 18px;
      }
    }
  }

  .input-area {
    padding: 12px 16px;
    height: 100%; // 填滿 input-area-wrapper 的高度
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }

  .message-input {
    padding: 10px 12px; // Smaller input for mobile
  }

  .attach-btn,
  .send-btn {
    width: 36px;
    height: 36px;
  }

  // Fix for iOS Safari virtual keyboard
  @supports (-webkit-touch-callout: none) {
    .input-area-wrapper .input-area {
      padding-bottom: max(12px, env(safe-area-inset-bottom));
    }
  }
}

// Adjust layout when virtual keyboard is open
:global(.keyboard-open) .messages-page .messages-container {
  height: auto;
  min-height: 50vh;
}

:global(.keyboard-open) .messages-page .messages-area {
  max-height: 60vh;
  overflow-y: auto;
}

:global(.keyboard-open) .messages-page .input-area-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
}

</style>
