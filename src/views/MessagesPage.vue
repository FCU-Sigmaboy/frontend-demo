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
              <button class="filter-btn" @click="showFilterMenu = !showFilterMenu">
                <i class="bi bi-funnel"></i>
              </button>
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

                <button class="more-btn">
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
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

                <button class="more-btn">
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
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
                        <!-- Special Message: Offer -->
                        <OfferMessage
                          v-if="message.message_type === 'offer' || message.message_type === 'counter_offer'"
                          :offer="message.metadata"
                          :current-user-id="currentUser?.id"
                          :buyer-id="getBuyerId(selectedConversation)"
                          :seller-id="selectedConversation._raw.item.owner_id"
                          @accept="handleAcceptOffer"
                          @counter="handleCounterOffer"
                          @decline="handleDeclineOffer"
                        />

                        <!-- Special Message: Order Request -->
                        <OrderRequestMessage
                          v-else-if="message.message_type === 'order_request'"
                          :order-request="message.metadata"
                          :current-user-id="currentUser?.id"
                          :seller-id="selectedConversation._raw.seller_id || (selectedConversation._raw.buyer_id === currentUser?.id ? selectedConversation._raw.seller_id : selectedConversation._raw.seller_id)"
                          @accept="handleAcceptOrderRequest"
                          @decline="handleDeclineOrderRequest"
                          @view-details="handleViewOrderDetails"
                        />

                        <!-- Regular Text Message -->
                        <div v-else :class="[
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
                                  <i class="bi bi-box-seam reference-icon"></i>
                                  <span class="reference-text">{{ message.related_item_title || `物品 #${message.related_item_id}` }}</span>
                                </div>
                              </div>

                              <p class="message-text">{{ message.text }}</p>

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
                >
                  <i class="bi bi-arrow-down"></i>
                  <span>回到最新</span>
                </button>
              </transition>

              <!-- Pending Item Reference (above input, outside wrapper for animation) -->
              <transition name="item-reference-slide">
                <div v-if="pendingItemReference" class="pending-item-reference">
                  <div class="reference-info">
                    <i class="bi bi-box-seam"></i>
                    <span class="reference-label">提及物品：</span>
                    <span class="reference-title">{{ pendingItemReference.title }}</span>
                  </div>
                  <button class="remove-reference-btn" @click="removePendingItemReference">
                    <i class="bi bi-x"></i>
                  </button>
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
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import OfferMessage from '../components/OfferMessage.vue';
import OrderRequestMessage from '../components/OrderRequestMessage.vue';
import { useMessageStore } from '@/stores/message';
import { useAuthStore } from '@/stores/auth';
import { formatRelativeTime } from '@/utils/timeFormat';

const router = useRouter();
const messageStore = useMessageStore();
const authStore = useAuthStore();

// Local UI State (非共享狀態)
const userPoints = ref(500);
const searchQuery = ref('');
const activeFilter = ref('all');
const messageInput = ref('');
const messagesArea = ref(null);
const showFilterMenu = ref(false);
const messagesLoading = ref(false); // UI 載入骨架屏狀態
const pendingItemReference = ref(null); // 待發送的物品引用
const itemReferenceCache = ref(new Map()); // 物品引用緩存 Map<itemId, itemTitle>
const showScrollToBottomBtn = ref(false); // 顯示「回到最新」按鈕
const isLoadingMoreMessages = ref(false); // 是否正在載入更多訊息
const currentPage = ref(1); // 當前頁碼
const hasMoreMessages = ref(true); // 是否還有更多訊息

// 從 store 獲取資料
const loading = computed(() => messageStore.isLoadingConversations);
const currentUser = computed(() => authStore.user);

// Filter 計數
const filters = computed(() => {
  const all = messageStore.conversations;
  return [
    { id: 'all', label: '全部', count: all.length },
    { id: 'unread', label: '未讀', count: all.filter(c => c.unread_count > 0).length },
    { id: 'buyer', label: '購買中', count: all.filter(c => c.role === 'buyer').length },
    { id: 'seller', label: '出售中', count: all.filter(c => c.role === 'seller').length }
  ];
});

// Computed - 從 store 過濾對話
const filteredConversations = computed(() => {
  let filtered = messageStore.conversations;

  // Filter by type
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'unread') {
      filtered = filtered.filter(c => c.unread_count > 0);
    } else {
      filtered = filtered.filter(c => c.role === activeFilter.value);
    }
  }

  // Filter by search
  if (searchQuery.value) {
    filtered = filtered.filter(c =>
      c.other_user.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
});

// Transform conversations for display
const displayConversations = computed(() => {
  return filteredConversations.value.map(convo => {
    // 檢查對方使用者是否線上（從 store 獲取）
    const otherUserId = convo.other_user.id;
    const isOnline = messageStore.onlineUsers.has(otherUserId);

    return {
      id: convo.id,
      user: {
        name: convo.other_user.nickname,
        avatar: convo.other_user.profile_picture_url || `https://placehold.co/48/6fb8a5/ffffff?text=${convo.other_user.nickname?.charAt(0) || 'U'}`,
        online: isOnline
      },
      product: convo.item.id ? {
        id: convo.item.id,
        name: convo.item.title,
        price: 0,
        image: convo.item.cover_image_url || 'https://placehold.co/60x60/6fb8a5/ffffff?text=Item'
      } : null,
      lastMessage: {
        text: convo.last_message || '開始對話...',
        time: formatRelativeTime(convo.last_message_time)
      },
      unreadCount: convo.unread_count || 0,
      type: convo.role,
      _raw: convo
    };
  });
});

// 當前選中的對話
const selectedConversation = computed(() => {
  if (!messageStore.selectedConversationId) return null;
  return displayConversations.value.find(c => c.id === messageStore.selectedConversationId);
});

// 當前訊息列表（從 store 轉換為顯示格式）
const messages = computed(() => {
  return messageStore.currentMessages.map((msg, index) => {
    // 使用標準化的日期比較（去除時分秒）
    const msgDateObj = new Date(msg.created_at);
    const msgDateOnly = new Date(msgDateObj.getFullYear(), msgDateObj.getMonth(), msgDateObj.getDate());

    const prevMsg = index > 0 ? messageStore.currentMessages[index - 1] : null;
    let showDate = false;

    if (prevMsg) {
      const prevDateObj = new Date(prevMsg.created_at);
      const prevDateOnly = new Date(prevDateObj.getFullYear(), prevDateObj.getMonth(), prevDateObj.getDate());
      showDate = msgDateOnly.getTime() !== prevDateOnly.getTime();
    } else {
      // 第一則訊息總是顯示日期
      showDate = true;
    }

    // 如果有物品引用信息，加入緩存
    if (msg.related_item_id && msg.related_item_title) {
      itemReferenceCache.value.set(msg.related_item_id, msg.related_item_title);
    }

    // 判斷分組狀態
    let isGrouped = false;        // 是否與前一則訊息群組
    let isFirstInGroup = false;   // 是否為群組第一則
    let isLastInGroup = false;    // 是否為群組最後一則
    let hasGroupWithPrev = false; // 與前一則能否組成群組
    let hasGroupWithNext = false; // 與下一則能否組成群組

    // 檢查與前一則訊息的關係
    if (prevMsg) {
      const timeDiff = new Date(msg.created_at) - new Date(prevMsg.created_at);
      const isSameSender = msg.is_mine === prevMsg.is_mine;
      const isWithinMinute = timeDiff < 60000; // 1分鐘 = 60000 毫秒

      hasGroupWithPrev = isSameSender && isWithinMinute && !showDate;
    }

    // 檢查與下一則訊息的關係
    const nextMsg = index < messageStore.currentMessages.length - 1
      ? messageStore.currentMessages[index + 1]
      : null;

    if (nextMsg) {
      const nextTimeDiff = new Date(nextMsg.created_at) - new Date(msg.created_at);
      const isSameSenderAsNext = msg.is_mine === nextMsg.is_mine;
      const isWithinMinuteFromNext = nextTimeDiff < 60000;
      
      // 計算下一則訊息的標準化日期
      const nextMsgDateObj = new Date(nextMsg.created_at);
      const nextMsgDateOnly = new Date(nextMsgDateObj.getFullYear(), nextMsgDateObj.getMonth(), nextMsgDateObj.getDate());
      const hasDateDividerAfter = msgDateOnly.getTime() !== nextMsgDateOnly.getTime();

      hasGroupWithNext = isSameSenderAsNext && isWithinMinuteFromNext && !hasDateDividerAfter;
    }

    // 根據前後關係決定群組狀態
    isGrouped = hasGroupWithPrev;           // 與前一則群組
    isFirstInGroup = !hasGroupWithPrev;     // 沒有前一則群組 = 是第一則
    isLastInGroup = !hasGroupWithNext;      // 沒有下一則群組 = 是最後一則

    return {
      id: msg.id,
      text: msg.content,
      time: formatRelativeTime(msg.created_at),
      created_at: msg.created_at,
      isSent: msg.is_mine,
      showDate,
      date: showDate ? formatDateDivider(msg.created_at) : '',
      message_type: msg.message_type,
      related_item_id: msg.related_item_id,
      related_item_title: msg.related_item_title,
      metadata: msg.metadata,
      sender: msg.sender,
      _clientId: msg._clientId || msg.id, // 使用不變的 clientId 或回退到 id
      _sending: msg._sending, // 傳送中
      _failed: msg._failed, // 傳送失敗
      _failedContent: msg._failedContent,
      _failedRelatedItemId: msg._failedRelatedItemId,
      _failedRelatedItemTitle: msg._failedRelatedItemTitle,
      is_read: msg.is_read || false, // 對方是否已讀
      isGrouped, // 是否與上一則訊息群組
      isFirstInGroup, // 是否為群組第一則
      isLastInGroup // 是否為群組最後一則
    };
  }).map((msg, index, arr) => {
    // 找到最後一則已發送且已成功的訊息
    const isLatestSentMessage = msg.isSent && !msg._sending && !msg._failed &&
      !arr.slice(index + 1).some(m => m.isSent && !m._sending && !m._failed);

    return {
      ...msg,
      isLatestSentMessage
    };
  });
});

// 將訊息按日期分組
const groupedMessages = computed(() => {
  const groups = [];
  let currentGroup = null;

  messages.value.forEach((message) => {
    if (message.showDate) {
      // 開始新的日期群組
      currentGroup = {
        date: message.date,
        dateKey: new Date(message.created_at).toLocaleDateString('zh-TW'),
        messages: [message]
      };
      groups.push(currentGroup);
    } else if (currentGroup) {
      // 添加到當前日期群組
      currentGroup.messages.push(message);
    }
  });

  return groups;
});

function formatDateDivider(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  // 將時間標準化為當天的 00:00:00，以便正確比較日期
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 計算日期差（以天為單位）
  const daysDiff = Math.floor((todayOnly - dateOnly) / (24 * 60 * 60 * 1000));

  // 格式化時間（上午/下午 時:分）
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '上午' : '下午';
  const displayHours = hours % 12 || 12;
  const timeStr = `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;

  // 今天：只顯示 "今天"
  if (daysDiff === 0) {
    return '今天';
  }

  // 這禮拜內（7天內）：顯示 "周X 下午 X:XX"
  if (daysDiff > 0 && daysDiff < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${weekday} ${timeStr}`;
  }

  // 超過這禮拜：顯示 "X月X日 下午 X:XX"
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日 ${timeStr}`;
}

// Methods
async function selectConversation(conversation) {
  messagesLoading.value = true;

  // 重置分頁狀態
  currentPage.value = 1;
  hasMoreMessages.value = true;
  isLoadingMoreMessages.value = false;

  try {
    // 使用 store 載入訊息
    await messageStore.loadMessages(conversation.id);

    if (messageStore.currentMessages.length < 50) {
      hasMoreMessages.value = false;
    }

    messagesLoading.value = false;

    await nextTick();
    await nextTick();
    await nextTick();

    scrollToBottom(false);
  } catch (err) {
    messagesLoading.value = false;
    throw err;
  }
}

function deselectConversation() {
  messageStore.clearSelectedConversation();
}

async function sendMessage() {
  if (!messageInput.value.trim() || !selectedConversation.value) return;

  const content = messageInput.value.trim();
  const relatedItemId = pendingItemReference.value ? pendingItemReference.value.id : null;
  const relatedItemTitle = pendingItemReference.value ? pendingItemReference.value.title : null;

  // 立即清空輸入框
  messageInput.value = '';

  // 創建臨時訊息 ID（用於樂觀更新）
  const tempMessageId = `temp-${Date.now()}`;

  // 立即添加樂觀訊息到列表
  const optimisticMessage = {
    id: tempMessageId,
    content: content,
    created_at: new Date().toISOString(),
    is_mine: true,
    message_type: 'text',
    related_item_id: relatedItemId,
    related_item_title: relatedItemTitle,
    sender: {
      id: currentUser.value?.id,
      name: currentUser.value?.user_metadata?.nickname || '我',
      avatar: currentUser.value?.user_metadata?.profile_picture_url || null
    },
    metadata: null,
    _sending: true, // 標記為正在發送
    _clientId: tempMessageId // 永久的客戶端 ID，用於 v-for key（不會改變）
  };

  // 立即添加到 store
  messageStore.currentMessages.push(optimisticMessage);

  // 立即滾動到底部
  await nextTick();
  await nextTick();
  scrollToBottom(false);

  // 清除待發送的物品引用
  const shouldClearItemReference = !!pendingItemReference.value;
  if (shouldClearItemReference) {
    pendingItemReference.value = null;

    // 清除 URL 中的物品相關參數
    const currentQuery = { ...router.currentRoute.value.query };
    if (currentQuery.itemId || currentQuery.itemTitle) {
      delete currentQuery.itemId;
      delete currentQuery.itemTitle;
      router.replace({ query: currentQuery });
    }
  }

  try {
    // 在背景發送訊息
    const newMessage = await messageStore.sendMessage(content, 'text', relatedItemId, relatedItemTitle);

    console.log('[Debug] 發送訊息成功，真實 ID:', newMessage.message_id || newMessage.id);

    // 找到並更新樂觀訊息（只更新屬性，不替換整個物件，避免重新渲染造成抖動）
    const index = messageStore.currentMessages.findIndex(m => m.id === tempMessageId);
    if (index !== -1) {
      const message = messageStore.currentMessages[index];
      const realMessageId = newMessage.message_id || newMessage.id;

      // 檢查真實 ID 是否已存在（可能 realtime 已經添加了）
      const realMessageExists = messageStore.currentMessages.some(
        (m, i) => i !== index && m.id === realMessageId
      );

      if (realMessageExists) {
        // 如果 realtime 已經添加了真實訊息，直接移除樂觀訊息
        console.log('[Debug] Realtime 已添加真實訊息，移除樂觀訊息');
        messageStore.currentMessages.splice(index, 1);
      } else {
        // 更新屬性而不是替換物件
        message.id = realMessageId;
        message.created_at = newMessage.created_at;
        message.metadata = newMessage.metadata;
        message._sending = false; // 移除發送中標記

        // 更新 sender 資訊（如果後端有返回）
        if (newMessage.sender_id) {
          message.sender.id = newMessage.sender_id;
        }
      }
    }
  } catch (err) {
    console.error('Failed to send message:', err);

    // 發送失敗，標記為失敗狀態（不移除訊息）
    const index = messageStore.currentMessages.findIndex(m => m.id === tempMessageId);
    if (index !== -1) {
      const message = messageStore.currentMessages[index];
      message._sending = false;
      message._failed = true; // 標記為發送失敗
      message._failedContent = content; // 保存原始內容用於重試
      message._failedRelatedItemId = relatedItemId; // 保存物品 ID 用於重試
      message._failedRelatedItemTitle = relatedItemTitle; // 保存物品標題用於重試
    }
  }
}

function handleAttachment() {
  console.log('Handle attachment');
  alert('檔案附件功能尚未實作');
}

function openItemPage(itemId) {
  // 在新分页中打开物品页面
  const itemUrl = router.resolve({ name: 'ItemDetail', params: { id: itemId } }).href;
  window.open(itemUrl, '_blank');
}

function removePendingItemReference() {
  pendingItemReference.value = null;

  // 清除 URL 中的物品相關參數
  const currentQuery = { ...router.currentRoute.value.query };
  if (currentQuery.itemId || currentQuery.itemTitle) {
    delete currentQuery.itemId;
    delete currentQuery.itemTitle;
    router.replace({ query: currentQuery });
  }
}

// 重新發送失敗的訊息
async function retryMessage(failedMessage) {
  if (!failedMessage._failed) return;

  const content = failedMessage._failedContent || failedMessage.content;
  const relatedItemId = failedMessage._failedRelatedItemId || failedMessage.related_item_id;
  const relatedItemTitle = failedMessage._failedRelatedItemTitle || failedMessage.related_item_title;

  // 標記為發送中
  failedMessage._sending = true;
  failedMessage._failed = false;

  try {
    // 發送訊息
    const newMessage = await messageStore.sendMessage(content, 'text', relatedItemId, relatedItemTitle);

    console.log('[Debug] 重新發送訊息成功，真實 ID:', newMessage.message_id || newMessage.id);

    // 找到並更新訊息
    const index = messageStore.currentMessages.findIndex(m => m._clientId === failedMessage._clientId);
    if (index !== -1) {
      const message = messageStore.currentMessages[index];
      const realMessageId = newMessage.message_id || newMessage.id;

      // 檢查真實 ID 是否已存在
      const realMessageExists = messageStore.currentMessages.some(
        (m, i) => i !== index && m.id === realMessageId
      );

      if (realMessageExists) {
        // 如果 realtime 已經添加了真實訊息，直接移除這則訊息
        messageStore.currentMessages.splice(index, 1);
      } else {
        // 更新屬性
        message.id = realMessageId;
        message.created_at = newMessage.created_at;
        message.metadata = newMessage.metadata;
        message._sending = false;

        // 清除失敗相關的屬性
        delete message._failed;
        delete message._failedContent;
        delete message._failedRelatedItemId;
        delete message._failedRelatedItemTitle;

        if (newMessage.sender_id) {
          message.sender.id = newMessage.sender_id;
        }
      }
    }
  } catch (err) {
    console.error('Failed to retry message:', err);

    // 重新標記為失敗
    failedMessage._sending = false;
    failedMessage._failed = true;
  }
}

function handleMessagesScroll() {
  if (!messagesArea.value) return;

  const { scrollTop, scrollHeight, clientHeight } = messagesArea.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  const distanceFromTop = scrollTop;

  showScrollToBottomBtn.value = distanceFromBottom > 200;

  if (distanceFromTop < 200 && !isLoadingMoreMessages.value && hasMoreMessages.value && selectedConversation.value) {
    loadMoreMessages();
  }
}

function scrollToBottom(smooth = false) {
  nextTick(() => {
    if (!messagesArea.value) return;

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints;
    const scrollOptions = {
      top: messagesArea.value.scrollHeight,
      behavior: smooth && !isMobile ? 'smooth' : 'auto'
    };

    // Force immediate scroll on mobile for better reliability
    if (isMobile) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;

      // Double-check after a short delay to ensure scroll completed
      setTimeout(() => {
        if (messagesArea.value) {
          messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
        }
      }, 50);

      // Additional check for iOS devices
      if (window.matchMedia('(max-width: 575.98px)').matches) {
        setTimeout(() => {
          if (messagesArea.value) {
            messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
          }
        }, 150);
      }
    } else {
      messagesArea.value.scrollTo(scrollOptions);
    }
  });
}

// Load more messages when scrolling to top
async function loadMoreMessages() {
  if (!selectedConversation.value || isLoadingMoreMessages.value || !hasMoreMessages.value) return;

  isLoadingMoreMessages.value = true;

  try {
    const scrollHeightBefore = messagesArea.value.scrollHeight;
    const scrollTopBefore = messagesArea.value.scrollTop;

    const nextPage = currentPage.value + 1;
    const olderMessages = await messageStore.loadMoreMessages(selectedConversation.value.id, nextPage, 50);

    if (olderMessages && olderMessages.length > 0) {
      currentPage.value = nextPage;

      if (olderMessages.length < 50) {
        hasMoreMessages.value = false;
      }

      await nextTick();
      await nextTick();

      const scrollHeightAfter = messagesArea.value.scrollHeight;
      const heightDifference = scrollHeightAfter - scrollHeightBefore;
      messagesArea.value.scrollTop = scrollTopBefore + heightDifference;
    } else {
      if (currentPage.value > 1) {
        hasMoreMessages.value = false;
      }
    }
  } catch (err) {
    console.error('Failed to load more messages:', err);
  } finally {
    isLoadingMoreMessages.value = false;
  }
}

// Initialize
async function initialize() {
  // 對話已由 App.vue 中的 store 載入，這裡只需處理 URL 參數

  // 如果 URL 有指定 conversationId，自動選擇該對話
  const conversationId = router.currentRoute.value.query.conversationId;
  const itemId = router.currentRoute.value.query.itemId;
  const itemTitle = router.currentRoute.value.query.itemTitle;

  if (conversationId) {
    // 立即顯示 loading 狀態
    messagesLoading.value = true;

    try {
      // 等待 conversations 載入完成
      if (messageStore.conversations.length === 0) {
        await messageStore.loadConversations();
      }

      const conversation = displayConversations.value.find(
        c => c.id === parseInt(conversationId)
      );
      if (conversation) {
        await selectConversation(conversation);

        // 如果有物品資訊，設置為待發送的物品引用
        if (itemId && itemTitle) {
          pendingItemReference.value = {
            id: itemId,
            title: itemTitle
          };
          // 加入緩存
          itemReferenceCache.value.set(itemId, itemTitle);
          // 預填訊息內容
          messageInput.value = '我想詢問';
        }
      } else {
        // 如果找不到對話，關閉 loading
        messagesLoading.value = false;
      }
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
      messagesLoading.value = false;
    }
  }
}

// Mobile keyboard handling to prevent input area from being covered
function handleMobileKeyboard() {
  // Check if we're on a mobile device
  const isMobile = window.matchMedia('(max-width: 575.98px)').matches;
  
  if (isMobile) {
    // Adjust viewport height when virtual keyboard appears
    const originalHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      // If the window height is smaller, likely the keyboard is open
      const currentHeight = window.innerHeight;
      const isKeyboardOpen = currentHeight < (originalHeight - 100); // Threshold for keyboard detection
      
      if (isKeyboardOpen) {
        // Add a class to handle keyboard state
        document.body.classList.add('keyboard-open');
      } else {
        document.body.classList.remove('keyboard-open');
      }
    });
  }
}

// Lifecycle
onMounted(async () => {
  await initialize();
  handleMobileKeyboard();

  await nextTick();
  await nextTick();

  if (messagesArea.value) {
    messagesArea.value.addEventListener('scroll', handleMessagesScroll, { passive: true });
  }

  watch(
    () => messageStore.currentMessages.length,
    async (newLen, oldLen) => {
      await nextTick();
      await nextTick();

      if (!messagesArea.value) return;

      const { scrollTop, scrollHeight, clientHeight } = messagesArea.value;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < 300) {
        messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
        showScrollToBottomBtn.value = false;
      } else {
        showScrollToBottomBtn.value = true;
      }
    }
  );
});

onBeforeUnmount(() => {
  if (messagesArea.value) {
    messagesArea.value.removeEventListener('scroll', handleMessagesScroll);
  }
});
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

  .filter-btn {
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

      .reference-text {
        opacity: 0.9;
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
    bottom: 145px;
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

// Item Reference Slide Transition (向下沉到輸入框後方)
.item-reference-slide-enter-active {
  transition: all 0.3s ease-out;
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

    .reference-label {
      font-size: 13px;
      font-weight: 500;
    }

    .reference-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
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

  .messages-area {
    flex: 1;
    overflow-y: scroll; // Force scroll container
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch; // Ensure smooth scrolling on iOS
    overscroll-behavior-y: contain; // Prevent pull-to-refresh
    touch-action: pan-y; // Explicitly allow vertical scrolling
    padding: 16px; // Reduced padding for mobile
    // Use min-height instead of fixed height for better keyboard handling
    min-height: 0; // Critical: Allow flex item to shrink
    position: relative;
    // Remove max-height to allow natural scrolling
  }

  .input-area-wrapper {
    position: sticky;
    bottom: 0;
    z-index: 100; // 保持與桌面版一致
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

    span {
      display: none; // 在手機上只顯示圖標,變成圓形按鈕
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
