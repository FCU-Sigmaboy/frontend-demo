<template>
  <div class="messages-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="messages-container">
        <div class="messages-layout">
          <!-- Conversations List -->
          <aside :class="['conversations-sidebar', { 'mobile-hidden': selectedConversation }]">
            <div class="sidebar-header">
              <h2 class="sidebar-title">訊息</h2>
            </div>

            <!-- Search Bar -->
            <div class="search-bar">
              <i class="bi bi-search"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜尋對話..."
                class="search-input"
              />
            </div>

            <!-- Filter Tabs -->
            <div class="filter-tabs">
              <button
                v-for="filter in filters"
                :key="filter.id"
                :class="['filter-tab', { active: activeFilter === filter.id }]"
                @click="activeFilter = filter.id"
              >
                {{ filter.label }}
                <span v-if="filter.count" class="filter-count">{{ filter.count }}</span>
              </button>
            </div>

            <!-- Conversations List -->
            <div class="conversations-list">
              <TransitionGroup name="conversation-list" tag="div">
                <div
                  v-for="conversation in displayConversations"
                  :key="conversation.id"
                  :class="['conversation-item', { active: selectedConversation?.id === conversation.id }]"
                  @click="selectConversation(conversation)"
                >
                  <div class="conv-avatar">
                    <img
                      :src="conversation.user.avatar"
                      :alt="conversation.user.name"
                      class="avatar-image"
                    />
                    <span v-if="conversation.user.online" class="online-indicator"></span>
                  </div>

                  <div class="conv-content">
                    <div class="conv-header">
                      <h3 class="conv-name">{{ conversation.user.name }}</h3>
                      <span class="conv-time">{{ conversation.lastMessage.time }}</span>
                    </div>
                    <div class="conv-preview">
                      <p class="preview-text">{{ conversation.lastMessage.text }}</p>
                      <span v-if="conversation.unreadCount" class="unread-badge">
                        {{ conversation.unreadCount }}
                      </span>
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Loading State -->
              <div v-if="loading" class="empty-state">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">載入中...</span>
                </div>
                <p>載入對話中...</p>
              </div>

              <!-- Empty State -->
              <div v-else-if="displayConversations.length === 0" class="empty-state">
                <i class="bi bi-chat-left-text"></i>
                <p>尚無對話</p>
              </div>
            </div>
          </aside>

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
              <div v-if="selectedConversation" class="chat-header">
                <button class="back-btn-mobile" @click="deselectConversation">
                  <i class="bi bi-arrow-left"></i>
                </button>

                <div class="chat-user-info">
                  <img
                    :src="selectedConversation.user.avatar"
                    :alt="selectedConversation.user.name"
                    class="user-avatar"
                  />
                  <div class="user-details">
                    <h3 class="user-name">{{ selectedConversation.user.name }}</h3>
                    <span class="user-status">
                      {{ selectedConversation.user.online ? '上線中' : '離線' }}
                    </span>
                  </div>
                </div>

                <div class="more-menu-container">
                  <button class="more-btn" @click="showMoreMenu = !showMoreMenu">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <div v-if="showMoreMenu" class="more-menu-dropdown">
                    <button
                      class="menu-item"
                      @click="handleArchiveConversation"
                    >
                      <i :class="selectedConversation._raw.is_archived ? 'bi bi-inbox' : 'bi bi-archive'"></i>
                      {{ selectedConversation._raw.is_archived ? '取消封存' : '封存對話' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Loading Header Skeleton -->
              <div v-else class="chat-header">
                <button class="back-btn-mobile" @click="deselectConversation">
                  <i class="bi bi-arrow-left"></i>
                </button>

                <div class="chat-user-info">
                  <div class="skeleton-avatar"></div>
                  <div class="user-details">
                    <div class="skeleton-name"></div>
                    <div class="skeleton-status"></div>
                  </div>
                </div>

                <div class="more-menu-container">
                  <button class="more-btn">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                </div>
              </div>

              <!-- Messages Area -->
              <div ref="messagesArea" class="messages-area" @scroll="handleMessagesScroll">
                <!-- Loading Skeleton -->
                <div v-if="messagesLoading" class="skeleton-messages">
                  <div v-for="i in 6" :key="`skeleton-${i}`" :class="['skeleton-message-wrapper', i % 2 === 0 ? 'sent' : 'received']">
                    <div class="skeleton-message">
                      <div class="skeleton-text-line"></div>
                      <div class="skeleton-text-line short"></div>
                      <div class="skeleton-time"></div>
                    </div>
                  </div>
                </div>

                <!-- Actual Messages -->
                <div class="messages-list" v-else>
                  <!-- Loading More Indicator -->
                  <div v-if="isLoadingMoreMessages" class="loading-more-indicator">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                      <span class="visually-hidden">載入中...</span>
                    </div>
                    <span>載入更多訊息...</span>
                  </div>

                  <!-- 按日期分組的訊息 -->
                  <div v-for="group in groupedMessages" :key="group.dateKey" class="date-group">
                    <!-- Date Divider (獨立元素，黏在頂部) -->
                    <div class="date-divider">
                      <span>{{ group.date }}</span>
                    </div>

                    <!-- 該日期的所有訊息 -->
                    <div class="date-group-messages">
                      <div v-for="message in group.messages" :key="message._clientId" class="message-wrapper">
                        <!-- 未讀分隔線 -->
                        <div v-if="message.isFirstUnreadMessage" class="unread-divider">
                          <span class="unread-divider-text">未讀訊息</span>
                        </div>

                        <!-- Message Bubble -->
                        <div :class="[
                          'message',
                          {
                            'message-sent': message.isSent,
                            'message-received': !message.isSent,
                            'message-grouped': message.isGrouped,
                            'message-first-in-group': message.isFirstInGroup,
                            'message-last-in-group': message.isLastInGroup
                          }
                        ]">
                          <div class="message-bubble-wrapper">
                            <div class="message-content">
                              <!-- Item Reference (Discord-style reply) -->
                              <div
                                v-if="message.related_item_id"
                                class="item-reference"
                                @click.stop="openItemPage(message.related_item_id)"
                              >
                                <div class="reference-bar"></div>
                                <div class="reference-content">
                                  <img
                                    v-if="message.relatedItem?.image"
                                    :src="message.relatedItem.image"
                                    alt="提及物品"
                                    class="reference-thumbnail"
                                  />
                                  <i v-else class="bi bi-box-seam reference-icon"></i>
                                  <div class="reference-details">
                                    <span class="reference-text">
                                      {{ message.relatedItem?.title || message.related_item_title || `物品 #${message.related_item_id}` }}
                                    </span>
                                    <span v-if="message.relatedItemPrice" class="reference-meta">
                                      {{ message.relatedItemPrice }}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <p class="message-text">
                                {{ message.text || '[此訊息內容已移除]' }}
                              </p>

                              <div
                                v-if="message.message_type !== 'text' && message.metadata"
                                class="message-metadata"
                              >
                                <span class="metadata-label">附加資訊</span>
                                <pre class="metadata-json">{{ JSON.stringify(message.metadata, null, 2) }}</pre>
                              </div>

                              <!-- 訊息氣泡內的時間（只在群組最後一則顯示） -->
                              <span v-if="message.isLastInGroup" class="message-time">{{ message.time }}</span>
                            </div>

                            <!-- 訊息狀態：在氣泡外面顯示，只在自己發送的訊息顯示 -->
                            <div v-if="message.isSent" class="message-status">
                              <!-- 傳送中 -->
                              <span v-if="message._sending" class="status-sending">
                                <span class="status-dot"></span>
                                傳送中...
                              </span>

                              <!-- 傳送失敗 -->
                              <span v-else-if="message._failed" class="status-failed">
                                <i class="bi bi-exclamation-circle"></i>
                                傳送失敗
                                <button class="retry-btn" @click="retryMessage(message)">
                                  <i class="bi bi-arrow-clockwise"></i>
                                  重新發送
                                </button>
                              </span>

                              <!-- 已讀（雙勾圖標） -->
                              <Transition v-else-if="message.is_read && message.isLatestSentMessage" name="status-fade">
                                <span class="status-read">
                                  <i class="bi bi-check-all"></i>
                                  已讀
                                </span>
                              </Transition>

                              <!-- 已傳送（只在最新的已發送訊息顯示） -->
                               <Transition v-else name="status-fade">
                                 <span v-if="message.isLatestSentMessage" class="status-sent">
                                   <i class="bi bi-check"></i>
                                   已傳送
                                 </span>
                               </Transition>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Scroll to Bottom Button -->
              <transition name="scroll-btn-slide">
                <button
                  v-if="showScrollToBottomBtn"
                  :class="['scroll-to-bottom-btn-floating', { 'with-item-reference': pendingItemReference }]"
                  @click="scrollToBottom"
                  aria-live="polite"
                >
                  <template v-if="typeof scrollButtonLabel === 'string'">
                    <span>{{ scrollButtonLabel }}</span>
                  </template>
                  <template v-else>
                    <span v-if="scrollButtonLabel.newMessages" class="scroll-btn-new">{{ scrollButtonLabel.newMessages }}</span>
                    <span
                      v-if="scrollButtonLabel.typing"
                      class="scroll-btn-typing"
                    >
                      <span class="typing-dots inline" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                      <span class="typing-text">{{ scrollButtonLabel.typing }}...</span>
                    </span>
                  </template>
                </button>
              </transition>

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

              <!-- Typing Indicator (outside input-area-wrapper) -->
              <transition name="typing-indicator-slide">
                <div
                  v-if="showBottomTypingIndicator && selectedConversation"
                  class="typing-indicator"
                  aria-live="polite"
                >
                  <span class="typing-dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <span class="typing-text">{{ typingIndicatorBaseText }}...</span>
                </div>
              </transition>

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
  scrollToBottom
} = useMessagePage();
</script>

<style scoped lang="scss">
@import '@/styles/variables';

// ============================================
// Z-Index 層級說明 (Z-Index Hierarchy)
// ============================================
// 1000: .keyboard-open .input-area-wrapper (鍵盤開啟時的輸入框)
// 100:  .input-area-wrapper (一般輸入框)
// 60:   .scroll-to-bottom-btn-floating (回到最新按鈕)
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

// Conversations Sidebar
.conversations-sidebar {
  width: 380px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background: white;
  flex: 0 0 auto; // Fixed width
  min-width: 0; // Allow flex items to shrink below their content
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  flex: 0 0 auto; // Fixed height
  height: 70px;

  .sidebar-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

}

// Search Bar
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;

  i {
    font-size: 16px;
    color: #999;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    outline: none;

    &::placeholder {
      color: #999;
    }
  }
}

// Filter Tabs
.filter-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #d0d0d0;
  border-radius: 20px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s;

  .filter-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: #e0e0e0;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    color: #666;
  }

  &:hover {
    border-color: $primary;
    color: $primary;
  }

  &.active {
    background: $primary;
    border-color: $primary;
    color: white;

    .filter-count {
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }
  }
}

// Conversations List
.conversations-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; // Smooth scrolling on iOS
  overscroll-behavior: contain; // Prevent pull-to-refresh interference
  touch-action: pan-y; // Allow vertical scrolling
}

.conversation-item {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: #f9f9f9;
  }

  &.active {
    background: #f0faf8;
    border-left: 3px solid $primary;
  }
}

// TransitionGroup 動畫
.conversation-list-move {
  transition: transform 0.4s ease;
}

.conversation-list-enter-active,
.conversation-list-leave-active {
  transition: all 0.4s ease;
}

.conversation-list-enter-from,
.conversation-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.conversation-list-leave-active {
  position: absolute;
}

.conv-avatar {
  position: relative;
  flex-shrink: 0;

  .avatar-image {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #00b894;
    border: 2px solid white;
    border-radius: 50%;
  }
}

.conv-content {
  flex: 1;
  min-width: 0;
}

.conv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .conv-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }

  .conv-time {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    color: #999;
    flex-shrink: 0;
  }
}

.conv-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .preview-text {
    flex: 1;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .unread-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: $primary;
    border-radius: 10px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }
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

.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  flex: 0 0 auto; // Fixed height
  height: 70px;

  .back-btn-mobile {
    display: none;
  }

  .chat-user-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0; // Allow text to truncate

      .user-name {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-status {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 12px;
        color: $primary;
      }
    }
  }

  .more-menu-container {
    position: relative;
  }

  .more-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 18px;
      color: #666;
    }

    &:hover {
      background: #f5f5f5;
    }
  }

  .more-menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 180px;
    z-index: 1000;
    overflow: hidden;

    .menu-item {
      width: 100%;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #1e1e1e;
      text-align: left;
      transition: background 0.2s;

      i {
        font-size: 16px;
        color: #666;
      }

      &:hover {
        background: #f5f5f5;
      }

      &:active {
        background: #e8e8e8;
      }
    }
  }
}


// Messages Area
.messages-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f9f9f9;
  // Ensure proper scrolling on mobile
  -webkit-overflow-scrolling: touch; // Smooth scrolling on iOS
  overscroll-behavior: contain; // Prevent pull-to-refresh interference
  touch-action: pan-y; // Allow vertical scrolling
  min-height: 0; // Allow flex item to shrink
  position: relative; // 為了定位「回到最新」按鈕
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 24px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  color: #4a4a4a;
  opacity: 0.9;
  overflow: hidden;
  background: transparent !important;
}

.typing-text,
.typing-dots,
.scroll-btn-typing {
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

.scroll-btn-new {
  font-weight: 600;
  color: $primary;
}

.scroll-btn-typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 0;
  font-weight: 500;
  color: $primary;
}

.scroll-btn-typing .typing-text {
  color: inherit;
}

.scroll-btn-new + .scroll-btn-typing {
  margin-left: 8px;
}

.typing-dots.inline {
  align-items: center;
  gap: 3px;
  margin-right: 4px;
}

.typing-dots.inline span {
  width: 5px;
  height: 5px;
  opacity: 0.3;
  animation-duration: 1s;
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

.messages-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-shrink: 0; // Prevent content from shrinking
  min-height: min-content; // Allow content to determine height
}

.date-group {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
}

.date-group-messages {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.loading-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: $primary;
  
  .spinner-border {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
}

.message-wrapper {
  margin-bottom: 16px;

  // 群組中的訊息（不是最後一則）：間距更小
  &:has(.message-grouped:not(.message-last-in-group)) {
    margin-bottom: 2px;
  }

  // 群組第一則（不是最後一則）：間距更小
  &:has(.message-first-in-group:not(.message-last-in-group)) {
    margin-bottom: 2px;
  }
}

.date-divider {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  padding: 8px 0;

  span {
    padding: 6px 16px;
    background: white;
    border-radius: 12px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    color: #999;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

// 未讀分隔線
.unread-divider {
  display: flex;
  align-items: center;
  margin: 16px 0;
  position: relative;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ff4757;
  }

  &::before {
    margin-right: 12px;
  }

  &::after {
    margin-left: 12px;
  }

  .unread-divider-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #ff4757;
    background: white;
    padding: 4px 12px;
    border-radius: 12px;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.15);
    animation: unread-pulse 2s ease-in-out infinite;
  }
}

@keyframes unread-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.message {
  display: flex;
  margin-bottom: 8px;

  // 群組訊息：減少間距
  &.message-grouped {
    margin-bottom: 1px;
  }

  // 群組第一則訊息（不是最後一則）：減少間距
  &.message-first-in-group:not(.message-last-in-group) {
    margin-bottom: 1px;
  }

  // 群組最後一則訊息：恢復正常間距
  &.message-last-in-group {
    margin-bottom: 8px;
  }

  &.message-sent {
    justify-content: flex-end;

    .message-content {
      background: $primary;
      color: white;
      border-radius: 16px 16px 16px 16px; // 預設：單獨訊息
      transform-origin: bottom right;

      .message-time {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    // 群組第一則（最上）：右上保持圓角，右下變小圓角
    &.message-first-in-group:not(.message-last-in-group) {
      .message-content {
        border-radius: 16px 16px 4px 16px;
      }
    }

    // 群組中間：右上和右下都是小圓角
    &.message-grouped:not(.message-first-in-group):not(.message-last-in-group) {
      .message-content {
        border-radius: 16px 4px 4px 16px;
      }
    }

    // 群組最後一則（最下）：右上小圓角，右下恢復圓角
    &.message-last-in-group:not(.message-first-in-group) {
      .message-content {
        border-radius: 16px 4px 16px 16px;
      }
    }
  }

  &.message-received {
    justify-content: flex-start;

    .message-content {
      background: white;
      color: #1e1e1e;
      border-radius: 16px 16px 16px 16px; // 預設：單獨訊息
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transform-origin: bottom left;

      .message-time {
        color: #999;
      }
    }

    // 群組第一則（最上）：左上保持圓角，左下變小圓角
    &.message-first-in-group:not(.message-last-in-group) {
      .message-content {
        border-radius: 16px 16px 16px 4px;
      }
    }

    // 群組中間：左上和左下都是小圓角
    &.message-grouped:not(.message-first-in-group):not(.message-last-in-group) {
      .message-content {
        border-radius: 4px 16px 16px 4px;
      }
    }

    // 群組最後一則（最下）：左上小圓角，左下恢復圓角
    &.message-last-in-group:not(.message-first-in-group) {
      .message-content {
        border-radius: 4px 16px 16px 16px;
      }
    }
  }
}

.message-content {
  width: 100%; // 填滿 bubble-wrapper 的寬度
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  // Discord-style item reference
  .item-reference {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    padding: 6px 8px;
    opacity: 0.8;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.05);
    }

    .reference-bar {
      width: 3px;
      height: 100%;
      min-height: 20px;
      background-color: currentColor;
      border-radius: 2px;
      opacity: 0.5;
    }

    .reference-content {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      font-weight: 500;

      .reference-icon {
        font-size: 14px;
      }

      .reference-thumbnail {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .reference-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        line-height: 1.2;
      }

      .reference-text {
        opacity: 0.9;
        font-weight: 600;
      }

      .reference-meta {
        font-size: 11px;
        color: rgba(0, 0, 0, 0.6);
      }
    }
  }

  // Override hover effect for sent messages
  &.message-sent .item-reference:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .message-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    word-wrap: break-word;

  .message-metadata {
    margin-top: 4px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.04);
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;

    .metadata-label {
      display: block;
      margin-bottom: 4px;
      font-weight: 600;
      color: #4a4a4a;
    }

    .metadata-json {
      margin: 0;
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.4;
      background: transparent;
    }
  }
  }

  .message-time {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    align-self: flex-end;
  }
}

// 訊息氣泡包裝器
.message-bubble-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end; // 對齊到右邊（發送的訊息）
  gap: 1px;
  max-width: 70%;
}

.message-received .message-bubble-wrapper {
  align-items: flex-start; // 對齊到左邊（接收的訊息）
}

// 訊息狀態樣式（在氣泡外面）
.message-status {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;

  .status-sending {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #999;

    .status-dot {
      width: 4px;
      height: 4px;
      background: #999;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  .status-failed {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #ff4444;

    i {
      font-size: 12px;
    }

    .retry-btn {
      margin-left: 6px;
      padding: 2px 8px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      border-radius: 4px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #ff4444;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 68, 68, 0.2);
      }

      i {
        font-size: 11px;
      }
    }
  }

  .status-sent {
    color: #999;
    display: flex;
    align-items: center;
    gap: 4px;

    i {
      font-size: 12px;
    }
  }

  .status-read {
    color: $primary;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;

    i {
      font-size: 14px;
      font-weight: bold;
    }
  }
}

// Status Fade Transition (已傳送狀態向右漂走效果 - 超快速)
.status-fade-enter-active {
  transition: transform 0.05s ease-in;
}

.status-fade-leave-active {
  transition: transform 0.05s ease-out;
}

.status-fade-enter-from {
  transform: scaleY(0.5);
}

.status-fade-leave-to {
  transform: scaleY(0);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

// Floating Scroll to Bottom Button (從輸入框向上浮出)
.scroll-to-bottom-btn-floating {
  position: absolute;
  bottom: 88px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: none;
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: $primary;
  transition: all 0.3s ease;
  z-index: 50;
  white-space: nowrap;

  // 當有物品引用卡片時,向上移動
  &.with-item-reference {
    bottom: 188px;
  }

  i {
    font-size: 16px;
  }

  // 只在支援 hover 的設備上顯示 hover 效果 (排除觸控設備)
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateX(-50%) translateY(-4px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      background: $primary;
      color: white;

      .scroll-btn-typing {
        color: inherit;

        .typing-dots span {
          background: currentColor;
        }

        .typing-text {
          color: inherit;
        }
      }

      .scroll-btn-new {
        color: inherit;
      }
    }
  }

  &:active {
    transform: translateX(-50%) translateY(-2px);
  }
}

// ============================================
// 動畫和過渡效果 (Animations & Transitions)
// ============================================

// Message Pop Animation (訊息彈出動畫)
.message-pop-enter-active {
  animation: messagePop 0.25s ease-out;
  
  .message-content {
    animation: messageContentPop 0.25s ease-out;
  }
}

.message-pop-leave-active {
  transition: all 0.2s ease-out;
}

.message-pop-enter-from,
.message-pop-leave-to {
  opacity: 0;
}

// Scroll Button Slide Transition (從下方滑入向上浮出)
.scroll-btn-slide-enter-active,
.scroll-btn-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scroll-btn-slide-enter-from,
.scroll-btn-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(60px);
}

// Typing Indicator Slide (輸入中提示上下收合)
.typing-indicator-slide-enter-active,
.typing-indicator-slide-leave-active {
  transition: max-height 0.25s ease,
              padding-top 0.25s ease,
              padding-bottom 0.25s ease;
}

.typing-indicator-slide-enter-from,
.typing-indicator-slide-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.typing-indicator-slide-enter-to,
.typing-indicator-slide-leave-from {
  max-height: 40px;
  padding-top: 10px;
  padding-bottom: 0;
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

  .conversations-sidebar {
    width: 320px;

    &.mobile-hidden {
      display: none;
    }
  }

  .chat-header {
    .back-btn-mobile {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;

      i {
        font-size: 20px;
        color: #1e1e1e;
      }

      &:hover {
        background: #f5f5f5;
      }
    }
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

  .conversations-sidebar {
    width: 100%;
    border-right: none;

    &.mobile-hidden {
      display: none;
    }
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
  }

  // 固定 chat-header 在頂部
  .chat-header {
    position: sticky;
    top: 0;
    z-index: 200; // 確保在 input-area-wrapper 之上
    background: white; // 確保有背景色
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); // 增加陰影效果
  }

  .messages-area {
    flex: 1;
    overflow-y: scroll; // Force scroll container
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch; // Ensure smooth scrolling on iOS
    overscroll-behavior-y: contain; // Prevent pull-to-refresh
    touch-action: pan-y; // Explicitly allow vertical scrolling
    padding: 16px; // Reduced padding for mobile
    padding-bottom: 80px; // 增加底部間距，避免被固定的輸入框遮擋
    // Use min-height instead of fixed height for better keyboard handling
    min-height: 0; // Critical: Allow flex item to shrink
    position: relative;
    // Remove max-height to allow natural scrolling
  }

  // 固定 input-area-wrapper 在底部
  .input-area-wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
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
  }

  .message-input {
    padding: 10px 12px; // Smaller input for mobile
  }

  .message-bubble-wrapper {
    max-width: 85%; // 手機版訊息泡泡更寬
  }

  .scroll-to-bottom-btn-floating {
    bottom: 80px; // 調整手機版的位置
    padding: 10px 16px;
    font-size: 13px;

    // 當有物品引用卡片時,向上移動 (手機版)
    &.with-item-reference {
      bottom: 127px; // 80px (輸入框) + 47px (手機版物品引用卡片高度)
    }

    i {
      font-size: 14px;
    }

    // 手機上移除 hover 效果
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: translateX(-50%) translateY(-4px);
      }
    }

    &:active {
      transform: translateX(-50%) translateY(-2px);
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
.keyboard-open {
  .messages-container {
    height: auto;
    min-height: 50vh;
  }

  .messages-area {
    max-height: 60vh;
    overflow-y: auto;
  }

  .input-area-wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 1000;
  }
}

// Skeleton Loading Styles
.skeleton-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  flex-shrink: 0; // Prevent content from shrinking
}

.skeleton-message-wrapper {
  display: flex;
  width: 100%;

  &.sent {
    justify-content: flex-end;
  }

  &.received {
    justify-content: flex-start;
  }
}

.skeleton-message {
  max-width: 70%;
  min-width: 200px; // 增加最小寬度
  padding: 16px 20px; // 增加內邊距
  border-radius: 12px;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 10px; // 增加間距

  .sent & {
    background: linear-gradient(90deg, #e8f5f1 25%, #d8ede7 50%, #e8f5f1 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .received & {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
}

.skeleton-text-line {
  height: 16px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);

  &.short {
    width: 70%;
  }
}

.skeleton-time {
  width: 50px;
  height: 12px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.1);
  align-self: flex-end;
  margin-top: 4px;
}

// Header Skeleton Styles
.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-name {
  width: 120px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  margin-bottom: 6px;
}

.skeleton-status {
  width: 60px;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
</style>
