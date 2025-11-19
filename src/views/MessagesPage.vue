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
                @view-listings="handleViewListings"
              />

              <ChatMessages
                :register-messages-area="registerMessagesArea"
                :messages-loading="messagesLoading"
                :grouped-messages="groupedMessages"
                :is-loading-more-messages="isLoadingMoreMessages"
                @scroll="handleMessagesScroll"
                @open-item="openItemPage"
                @retry="retryMessage"
                @reply="handleReply"
              />

              <div
                class="chat-overlay-stack"
                :class="{
                  'has-scroll-button': showScrollToBottomBtn,
                  'has-pending-reference': !!pendingItemReference || !!replyingToMessage,
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

                <!-- Replying To Message (above input) -->
                <transition name="item-reference-slide">
                  <div v-if="replyingToMessage" class="pending-item-reference reply-reference">
                    <div class="reference-info">
                      <div class="reply-line"></div>
                      <div class="reference-details">
                        <span class="reference-label">
                          <i class="bi bi-reply-fill"></i> 回覆 {{ replyingToMessage.isSent ? '自己' : (selectedConversation?.user?.name || '對方') }}
                        </span>
                        <span class="reference-text text-truncate">{{ replyingToMessage.text }}</span>
                      </div>
                    </div>
                    <button class="remove-reference-btn" @click="cancelReply">
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
                  <button class="attach-btn" @click="handleAttachment" title="附件">
                    <i class="bi bi-paperclip"></i>
                  </button>
                  <button class="transaction-btn" @click="handleOpenTransactionModal" title="發起交易">
                    <i class="bi bi-arrow-right-circle-fill"></i>
                  </button>
                  <input
                    v-model="messageInput"
                    type="text"
                    placeholder="輸入訊息..."
                    class="message-input"
                    @keypress.enter="handleSendMessage"
                  />
                  <button
                    class="send-btn"
                    :disabled="!messageInput.trim()"
                    @click="handleSendMessage"
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

    <!-- Transaction Modal -->
    <TransactionModal
      v-model="showTransactionModal"
      :conversation-items="conversationItems"
      :loading="isLoadingTransactionItems"
      :current-user-id="currentUser?.id"
      @confirm="handleTransactionConfirm"
    />

    <!-- User Listings Modal -->
    <UserListingsModal
      v-model="showUserListingsModal"
      :user-id="userListingsUserId"
      :user-name="userListingsUserName"
      @dm-item="handleDMFromModal"
    />

  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import ConversationsSidebar from '@/components/messages/ConversationsSidebar.vue';
import ChatHeader from '@/components/messages/ChatHeader.vue';
import ChatMessages from '@/components/messages/ChatMessages.vue';
import ChatScrollControls from '@/components/messages/ChatScrollControls.vue';
import TransactionModal from '@/components/messages/TransactionModal.vue';
import UserListingsModal from '@/components/messages/UserListingsModal.vue';
import { useMessagePage } from '@/composables/useMessagePage';
import { ref, computed } from 'vue';

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
  scrollToBottom,
  // Transaction Modal
  showTransactionModal,
  isLoadingTransactionItems,
  conversationItems,
  handleOpenTransactionModal,
  handleTransactionConfirm
} = useMessagePage();

// User Listings Modal state
const showUserListingsModal = ref(false);
const userListingsUserId = computed(() => selectedConversation.value?._raw?.other_user?.id || '');
const userListingsUserName = computed(() => selectedConversation.value?.user?.name || '使用者');

// Handle view listings button click
const handleViewListings = () => {
  if (selectedConversation.value) {
    showUserListingsModal.value = true;
  }
};

// Handle DM from modal - attach item and set default prompt
const handleDMFromModal = (item) => {
  // Close the modal
  showUserListingsModal.value = false;

  // Set the pending item reference
  if (pendingItemReference && item) {
    pendingItemReference.value = {
      id: item.item_id,
      title: item.title,
      price: item.price,
      image: item.image_url
    };

    // Set default message prompt
    messageInput.value = `你好，我對「${item.title}」有興趣，請問還有嗎？`;
  }
};

// Reply State
const replyingToMessage = ref(null);

const handleReply = (message) => {
  replyingToMessage.value = message;
  // Focus input
  const inputEl = document.querySelector('.message-input');
  if (inputEl) inputEl.focus();
};

const cancelReply = () => {
  replyingToMessage.value = null;
};

// Intercept sendMessage to include reply context if needed
// Note: The actual backend implementation for replies might need to be added to useMessagePage composable.
// For now, we just clear the UI state after sending.
const originalSendMessage = sendMessage;
// We can't easily override the imported sendMessage directly if it's a const from composable.
// Instead, we should watch for messageInput changes or modify how sendMessage is called in the template?
// Actually, the template calls `sendMessage`. We can wrap it.
// But `sendMessage` is destructured from `useMessagePage`.
// Let's just clear the reply state when `messageInput` is cleared (which happens after send usually)
// OR we can wrap the click handler in the template.
// Let's wrap it in the template? No, `sendMessage` is bound to `@keypress.enter` and click.
// Let's create a wrapper function.

const handleSendMessage = async () => {
  if (!messageInput.value.trim()) return;

  // If replying to a message, send as reply type
  if (replyingToMessage.value) {
    const quotedText = replyingToMessage.value.text || '';
    const replyText = messageInput.value.trim();
    const replyContent = JSON.stringify({
      type: 'reply',
      '回覆的訊息內容': quotedText,
      '你的訊息內容': replyText
    });

    // Clear the input and reply state before sending
    const relatedItemId = pendingItemReference.value ? pendingItemReference.value.id : null;
    const relatedItemTitle = pendingItemReference.value ? pendingItemReference.value.title : null;

    messageInput.value = '';
    cancelReply();

    // Send as reply type
    await sendReplyMessage(replyContent, relatedItemId, relatedItemTitle);
  } else {
    // Normal message
    await sendMessage();
  }
};

// Helper to send reply messages (bypassing the normal sendMessage flow)
const sendReplyMessage = async (content, relatedItemId, relatedItemTitle) => {
  if (!selectedConversation.value) return;

  const tempMessageId = `temp-${Date.now()}`;

  // Parse the reply content to show properly in optimistic UI
  let parsedReplyText = content;
  try {
    const parsed = JSON.parse(content);
    parsedReplyText = parsed['你的訊息內容'] || content;
  } catch (e) {
    // Ignore parse errors
  }

  const optimisticMessage = {
    id: tempMessageId,
    content: content,
    text: parsedReplyText,
    created_at: new Date().toISOString(),
    is_mine: true,
    is_read: false,
    message_type: 'reply', // Keep as reply for optimistic UI, backend will store as text
    related_item_id: relatedItemId,
    related_item_title: relatedItemTitle,
    sender: {
      id: currentUser.value?.id,
      name: currentUser.value?.user_metadata?.nickname || '我',
      avatar: currentUser.value?.user_metadata?.profile_picture_url || null
    },
    metadata: null,
    _sending: true,
    _clientId: tempMessageId
  };

  // Import the message store method
  const { useMessageStore } = await import('@/stores/message');
  const messageStore = useMessageStore();
  messageStore.currentMessages.push(optimisticMessage);

  // Scroll to bottom
  setTimeout(() => scrollToBottom(false), 100);

  // Clear pending item reference if any
  if (pendingItemReference.value) {
    pendingItemReference.value = null;
    if (selectedConversation.value?.id) {
      messageStore.clearPendingItemReference(selectedConversation.value.id);
    }
  }

  // Send to backend
  try {
    const newMessage = await messageStore.sendMessage(content, 'text', relatedItemId, relatedItemTitle);

    // Update the optimistic message with the real one
    const index = messageStore.currentMessages.findIndex(m => m.id === tempMessageId);
    if (index !== -1) {
      const message = messageStore.currentMessages[index];
      const realMessageId = newMessage.message_id || newMessage.id;

      const realMessageExists = messageStore.currentMessages.some(
        (m, i) => i !== index && m.id === realMessageId
      );

      if (realMessageExists) {
        messageStore.currentMessages.splice(index, 1);
      } else {
        message.id = realMessageId;
        message.created_at = newMessage.created_at;
        message.metadata = newMessage.metadata;
        message._sending = false;

        if (newMessage.sender_id) {
          message.sender.id = newMessage.sender_id;
        }
      }
    }
  } catch (err) {
    console.error('Failed to send reply message:', err);

    const index = messageStore.currentMessages.findIndex(m => m.id === tempMessageId);
    if (index !== -1) {
      const message = messageStore.currentMessages[index];
      message._sending = false;
      message._failed = true;
      message._failedContent = content;
      message._failedRelatedItemId = relatedItemId;
      message._failedRelatedItemTitle = relatedItemTitle;
    }
  }
};
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
    color: #757575;
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

.reply-reference {
  background: #f0f4fa;
  
  .reply-line {
    width: 3px;
    height: 36px;
    background-color: $primary;
    border-radius: 2px;
    opacity: 0.6;
  }
  
  .reference-label {
    display: flex;
    align-items: center;
    gap: 4px;
    
    i {
      font-size: 12px;
    }
  }
  
  .reference-text {
    font-size: 13px;
    color: #555;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  .transaction-btn,
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

  .transaction-btn {
    i {
      color: $primary;
    }

    &:hover {
      background: rgba(111, 184, 165, 0.1);

      i {
        color: darken($primary, 10%);
      }
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
      color: #757575;
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
    color: #757575;
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
  .transaction-btn,
  .send-btn {
    width: 36px;
    height: 36px;

    i {
      font-size: 18px;
    }
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
