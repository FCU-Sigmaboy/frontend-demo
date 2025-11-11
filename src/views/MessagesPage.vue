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
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import OfferMessage from '../components/OfferMessage.vue';
import OrderRequestMessage from '../components/OrderRequestMessage.vue';
import { useMessageStore } from '@/stores/message';
import { useAuthStore } from '@/stores/auth';
import { formatRelativeTime } from '@/utils/timeFormat';
import { getConversationItems, archiveConversation } from '@/api/conversationAPI_v2';

const router = useRouter();
const messageStore = useMessageStore();
const authStore = useAuthStore();

// Local UI State (非共享狀態)
const userPoints = ref(500);
const searchQuery = ref('');
const activeFilter = ref('all');
const messageInput = ref('');
const messagesArea = ref(null);
const showMoreMenu = ref(false);
const messagesLoading = ref(false); // UI 載入骨架屏狀態
const pendingItemReference = ref(null); // 待發送的物品引用
const itemReferenceCache = ref(new Map()); // 物品引用緩存 Map<itemId, itemTitle>
const showScrollToBottomBtn = ref(false); // 顯示「回到最新」按鈕
const isLoadingMoreMessages = ref(false); // 是否正在載入更多訊息
const currentPage = ref(1); // 當前頁碼
const hasMoreMessages = ref(true); // 是否還有更多訊息
const newMessageCount = ref(0); // 新訊息計數
const firstUnreadMessageId = ref(null); // 記錄第一條未讀訊息的 ID，用於固定分隔線位置
const suppressUnreadDivider = ref(false); // 控制是否暫時隱藏未讀訊息分隔線
const hasReachedBottomAfterUnread = ref(false); // 是否在有未讀後已經滑到最底

const TYPING_BROADCAST_INTERVAL = 1200;
const TYPING_STOP_DELAY = 3500;
let typingStopTimerId = null;
let localTypingActive = false;
let lastTypingBroadcastAt = 0;
let suppressTypingBroadcast = false;

const conversationItems = ref([]); // 依對話載入的提及物品列表
const isLoadingConversationItems = ref(false); // 提及物品資料載入狀態
let conversationItemsRequestId = 0; // 追蹤最新的商品載入請求

const conversationItemMap = computed(() => {
  const map = new Map();
  conversationItems.value.forEach(item => {
    if (!item || item.id === undefined || item.id === null) return;
    map.set(item.id, item);
  });
  return map;
});

const pendingItemPrice = computed(() => formatItemPrice(pendingItemReference.value?.price));

const currencyFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0
});

function formatItemPrice(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return currencyFormatter.format(numeric);
}

function toItemKey(id) {
  if (id === undefined || id === null) return null;
  if (typeof id === 'string') {
    const trimmed = id.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    return Number.isNaN(numeric) ? trimmed : numeric;
  }
  if (typeof id === 'number') {
    if (!Number.isFinite(id)) return null;
    return id;
  }
  const numeric = Number(id);
  return Number.isNaN(numeric) ? id : numeric;
}

const UNREAD_DIVIDER_CLEAR_THRESHOLD = 200; // 需要離開底部多遠才視為「往上滑了一段距離」

function clearUnreadDivider({ suppress = false } = {}) {
  firstUnreadMessageId.value = null;
  suppressUnreadDivider.value = suppress;
  hasReachedBottomAfterUnread.value = false;
}

function allowUnreadDivider() {
  suppressUnreadDivider.value = false;
}

function clearTypingStopTimer() {
  if (typingStopTimerId) {
    clearTimeout(typingStopTimerId);
    typingStopTimerId = null;
  }
}

function resetTypingFlags() {
  localTypingActive = false;
  lastTypingBroadcastAt = 0;
}

async function waitForTicks(count = 1) {
  for (let i = 0; i < count; i += 1) {
    await nextTick();
  }
}

function normalizeConversationItem(apiItem) {
  if (!apiItem) return null;

  const id = toItemKey(apiItem.item_id ?? apiItem.itemId ?? null);
  if (id === null) {
    return null;
  }

  const titleSource = apiItem.item_title ?? apiItem.itemTitle;
  const title = titleSource && String(titleSource).trim()
    ? String(titleSource).trim()
    : `物品 #${id}`;

  return {
    id,
    title,
    price: apiItem.item_price ?? apiItem.itemPrice ?? null,
    image: apiItem.item_image_url ?? apiItem.itemImageUrl ?? null,
    status: apiItem.item_status ?? apiItem.itemStatus ?? null,
    addedAt: apiItem.added_at ?? apiItem.addedAt ?? null,
    addedBy: (apiItem.added_by_user_id || apiItem.added_by_user_name)
      ? {
          id: apiItem.added_by_user_id ?? null,
          name: apiItem.added_by_user_name ?? ''
        }
      : null,
    messageCount: apiItem.message_count ?? apiItem.messageCount ?? 0
  };
}

function resolveItemFromMap(itemId) {
  if (itemId === undefined || itemId === null) return null;

  const normalizedKey = toItemKey(itemId);
  if (normalizedKey !== null && conversationItemMap.value.has(normalizedKey)) {
    return conversationItemMap.value.get(normalizedKey);
  }

  return null;
}

function refreshPendingItemReferenceFromCache() {
  if (!pendingItemReference.value || pendingItemReference.value.id === undefined || pendingItemReference.value.id === null) {
    return;
  }

  const matchedItem = resolveItemFromMap(pendingItemReference.value.id);
  if (!matchedItem) return;

  pendingItemReference.value = {
    ...pendingItemReference.value,
    ...matchedItem,
    id: matchedItem.id,
    title: matchedItem.title
  };
}

function applyItemMetadataToMessages() {
  const nextCache = new Map(itemReferenceCache.value);

  messageStore.currentMessages.forEach(msg => {
    const itemKey = toItemKey(msg.related_item_id);
    if (itemKey === null) {
      return;
    }

    const matchedItem = resolveItemFromMap(itemKey);
    if (matchedItem) {
      if (matchedItem.title) {
        msg.related_item_title = matchedItem.title;
      }
      if (matchedItem.image) {
        msg._related_item_image = matchedItem.image;
      }
      if (matchedItem.price !== undefined && matchedItem.price !== null) {
        msg._related_item_price = matchedItem.price;
      }
    }

    const title = msg.related_item_title || matchedItem?.title;
    if (title) {
      nextCache.set(itemKey, title);
    }
  });

  itemReferenceCache.value = nextCache;
  refreshPendingItemReferenceFromCache();
}

async function loadConversationItems(conversationId) {
  const activeConversationId = conversationId ?? selectedConversation.value?.id;
  if (!activeConversationId) return;

  const requestId = ++conversationItemsRequestId;
  isLoadingConversationItems.value = true;

  try {
    const data = await getConversationItems(activeConversationId);
    if (requestId !== conversationItemsRequestId) {
      return;
    }

    if (selectedConversation.value?.id !== activeConversationId) {
      return;
    }

    const normalizedItems = Array.isArray(data)
      ? data.map(normalizeConversationItem).filter(Boolean)
      : [];

    conversationItems.value = normalizedItems;

    const nextCache = new Map(itemReferenceCache.value);
    normalizedItems.forEach(item => {
      if (item.id !== null && item.title) {
        nextCache.set(item.id, item.title);
      }
    });
    itemReferenceCache.value = nextCache;

    applyItemMetadataToMessages();
  } catch (err) {
    if (requestId === conversationItemsRequestId) {
      console.error('Failed to load conversation items:', err);
    }
  } finally {
    if (requestId === conversationItemsRequestId) {
      isLoadingConversationItems.value = false;
    }
  }
}

// 從 store 獲取資料
const loading = computed(() => messageStore.isLoadingConversations);
const currentUser = computed(() => authStore.user);

const currentUserIdentity = computed(() => {
  const user = currentUser.value;
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const profileNickname = authStore.profileData?.nickname;
  const fallbackNickname =
    profileNickname ||
    metadata.nickname ||
    metadata.full_name ||
    metadata.name ||
    (user.email ? user.email.split('@')[0] : null) ||
    '我';

  return {
    id: user.id,
    nickname: fallbackNickname
  };
});

// Filter 計數
const filters = computed(() => {
  const all = messageStore.conversations;
  return [
    { id: 'all', label: '全部', count: all.length },
    { id: 'archived', label: '封存', count: all.filter(c => c.is_archived).length }
  ];
});

// Computed - 從 store 過濾對話
const filteredConversations = computed(() => {
  let filtered = messageStore.conversations;

  // Filter by type
  if (activeFilter.value === 'archived') {
    filtered = filtered.filter(c => c.is_archived);
  } else if (activeFilter.value === 'all') {
    filtered = filtered.filter(c => !c.is_archived);
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
  return filteredConversations.value
    .map(convo => {
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
    })
    .sort((a, b) => {
      // 有未讀訊息的對話優先
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

      // 如果都有或都沒有未讀，按最後訊息時間排序
      const timeA = new Date(a._raw.last_message_time || 0).getTime();
      const timeB = new Date(b._raw.last_message_time || 0).getTime();
      return timeB - timeA;
    });
});

// 當前選中的對話
const selectedConversation = computed(() => {
  if (!messageStore.selectedConversationId) return null;
  return displayConversations.value.find(c => c.id === messageStore.selectedConversationId);
});

const typingUsers = computed(() => {
  const conversationId = selectedConversation.value?.id;
  if (!conversationId) return [];
  return messageStore.getTypingUsers(conversationId);
});

const typingIndicatorBaseText = computed(() => {
  if (!typingUsers.value.length) return '';

  if (typingUsers.value.length === 1) {
    const name = typingUsers.value[0].nickname || '對方';
    return `${name} 正在輸入`;
  }

  if (typingUsers.value.length === 2) {
    const first = typingUsers.value[0].nickname || '對方';
    const second = typingUsers.value[1].nickname || '其他使用者';
    return `${first}、${second} 正在輸入`;
  }

  return '多人正在輸入';
});

const typingIndicatorText = computed(() => {
  return typingIndicatorBaseText.value ? `${typingIndicatorBaseText.value}...` : '';
});

const scrollButtonLabel = computed(() => {
  const showNewMessages = newMessageCount.value > 0;
  const showTyping = !!typingIndicatorBaseText.value;

  if (!showNewMessages && !showTyping) {
    return '回到最新';
  }

  if (showNewMessages && showTyping) {
    return {
      newMessages: `${newMessageCount.value}則新訊息`,
      typing: typingIndicatorBaseText.value
    };
  }

  if (showNewMessages) {
    return {
      newMessages: `${newMessageCount.value}則新訊息`,
      typing: null
    };
  }

  return {
    newMessages: null,
    typing: typingIndicatorBaseText.value
  };
});

const showBottomTypingIndicator = computed(() => {
  if (!typingIndicatorText.value) return false;

  if (showScrollToBottomBtn.value) {
    const buttonLabel = scrollButtonLabel.value;
    if (buttonLabel && typeof buttonLabel === 'object' && buttonLabel.typing) {
      return false;
    }
    if (typeof buttonLabel === 'string' && buttonLabel.includes('正在輸入')) {
      return false;
    }
  }

  return true;
});

watch(
  () => selectedConversation.value?.id,
  async (newId, oldId) => {
    if (oldId && oldId !== newId) {
      messageStore.setPendingItemReference(oldId, pendingItemReference.value);
      messageStore.setMessageDraft(oldId, messageInput.value);

      const identity = currentUserIdentity.value;
      if (identity) {
        messageStore.broadcastTypingStatus(oldId, false, identity).catch(err => {
          console.error('Failed to broadcast typing status when leaving conversation:', err);
        });
      }

      try {
        await messageStore.leaveTypingChannel(oldId);
      } catch (err) {
        console.error('Failed to leave typing channel:', err);
      }
      clearTypingStopTimer();
      resetTypingFlags();
    }

    if (!newId) {
      pendingItemReference.value = null;
      suppressTypingBroadcast = true;
      messageInput.value = '';
      await nextTick();
      suppressTypingBroadcast = false;
      return;
    }

    pendingItemReference.value = messageStore.getPendingItemReference(newId);
    suppressTypingBroadcast = true;
    messageInput.value = messageStore.getMessageDraft(newId);
    await nextTick();
    suppressTypingBroadcast = false;

    clearTypingStopTimer();
    resetTypingFlags();

    const identity = currentUserIdentity.value;
    if (identity) {
      messageStore.joinTypingChannel(newId, identity).catch(err => {
        console.error('Failed to join typing channel:', err);
      });
    }
  }
);

watch(
  pendingItemReference,
  newValue => {
    const conversationId = selectedConversation.value?.id;
    if (!conversationId) return;
    messageStore.setPendingItemReference(conversationId, newValue);
  },
  { deep: true }
);

watch(
  messageInput,
  newValue => {
    const conversationId = selectedConversation.value?.id;
    if (!conversationId) return;

    messageStore.setMessageDraft(conversationId, newValue);

    if (suppressTypingBroadcast) return;

    const identity = currentUserIdentity.value;
    if (!identity?.id) return;

    const trimmed = newValue.trim();
    const now = Date.now();

    if (!trimmed) {
      if (localTypingActive) {
        messageStore.broadcastTypingStatus(conversationId, false, identity).catch(err => {
          console.error('Failed to broadcast typing end:', err);
        });
      }
      clearTypingStopTimer();
      resetTypingFlags();
      return;
    }

    if (!localTypingActive || now - lastTypingBroadcastAt > TYPING_BROADCAST_INTERVAL) {
      localTypingActive = true;
      lastTypingBroadcastAt = now;
      messageStore.broadcastTypingStatus(conversationId, true, identity).catch(err => {
        console.error('Failed to broadcast typing status:', err);
      });
    }

    clearTypingStopTimer();

    typingStopTimerId = setTimeout(() => {
      const activeConversationId = selectedConversation.value?.id;
      const activeIdentity = currentUserIdentity.value;
      if (!activeConversationId || !activeIdentity?.id) {
        resetTypingFlags();
        typingStopTimerId = null;
        return;
      }

      messageStore.broadcastTypingStatus(activeConversationId, false, activeIdentity).catch(err => {
        console.error('Failed to broadcast typing end:', err);
      });
      resetTypingFlags();
      typingStopTimerId = null;
    }, TYPING_STOP_DELAY);
  }
);

// 當前訊息列表（從 store 轉換為顯示格式）
const messages = computed(() => {
  const itemMap = conversationItemMap.value;
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

    const itemKey = toItemKey(msg.related_item_id);
    const matchedItem = itemKey !== null ? itemMap.get(itemKey) : null;

    let relatedItemTitle = msg.related_item_title || matchedItem?.title || null;

    if (!relatedItemTitle && itemKey !== null) {
      const cachedTitle = itemReferenceCache.value.get(itemKey);
      if (cachedTitle) {
        relatedItemTitle = cachedTitle;
      }
    }

    if (!relatedItemTitle && itemKey !== null) {
      relatedItemTitle = `物品 #${itemKey}`;
    }

    const relatedItemImage = matchedItem?.image ?? msg._related_item_image ?? null;
    const relatedItemPriceRaw = matchedItem?.price ?? msg._related_item_price ?? null;
    const relatedItemPrice = relatedItemPriceRaw !== null && relatedItemPriceRaw !== undefined
      ? formatItemPrice(relatedItemPriceRaw)
      : null;

    const relatedItem = matchedItem || (relatedItemImage || relatedItemPrice !== null
      ? {
          id: itemKey,
          title: relatedItemTitle,
          image: relatedItemImage,
          price: relatedItemPriceRaw
        }
      : null);

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
      related_item_title: relatedItemTitle,
  relatedItem,
      relatedItemPrice,
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

    // 找到第一條未讀的接收訊息（對方發給我的未讀訊息）
    let isFirstUnreadMessage = false;

    if (!suppressUnreadDivider.value) {
      // 如果已經記錄了第一條未讀訊息的 ID，則固定在那個位置
      if (firstUnreadMessageId.value) {
        isFirstUnreadMessage = msg.id === firstUnreadMessageId.value;
      } else if (!msg.isSent && !msg.is_read) {
        // 還沒記錄時，動態計算第一條未讀訊息
        const hasUnreadBefore = arr.slice(0, index).some(m => !m.isSent && !m.is_read);
        const hasSentMessageAfter = arr.slice(index + 1).some(m => m.isSent);
        isFirstUnreadMessage = !hasUnreadBefore && !hasSentMessageAfter;

        if (isFirstUnreadMessage) {
          firstUnreadMessageId.value = msg.id;
          hasReachedBottomAfterUnread.value = false;
        }
      }
    } else {
      isFirstUnreadMessage = false;
    }

    return {
      ...msg,
      isLatestSentMessage,
      isFirstUnreadMessage
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
  const previousConversationId = selectedConversation.value?.id || messageStore.selectedConversationId || null;
  if (previousConversationId && previousConversationId !== conversation.id) {
    messageStore.setPendingItemReference(previousConversationId, pendingItemReference.value);
    messageStore.setMessageDraft(previousConversationId, messageInput.value);
  }

  if (messageStore.selectedConversationId !== conversation.id) {
    messageStore.selectedConversationId = conversation.id;
  }
  messagesLoading.value = true;

  // 重置分頁狀態
  currentPage.value = 1;
  hasMoreMessages.value = true;
  isLoadingMoreMessages.value = false;
  newMessageCount.value = 0; // 重置新訊息計數
  clearUnreadDivider(); // 重置未讀訊息分隔線狀態

  conversationItems.value = [];
  itemReferenceCache.value = new Map();

  try {
    // 使用 store 載入訊息
    await messageStore.loadMessages(conversation.id);

    applyItemMetadataToMessages();

    if (messageStore.currentMessages.length < 50) {
      hasMoreMessages.value = false;
    }

    messagesLoading.value = false;

    // 後續以背景方式載入提及物品資料，避免阻塞訊息呈現
    loadConversationItems(conversation.id).catch(err => {
      console.error('Failed to refresh conversation items after select:', err);
    });

    await waitForTicks(3);

    scrollToBottom(false);
  } catch (err) {
    messagesLoading.value = false;
    throw err;
  }
}

async function handleArchiveConversation() {
  if (!selectedConversation.value) return;

  const conversationId = selectedConversation.value.id;
  const isCurrentlyArchived = selectedConversation.value._raw.is_archived || false;

  try {
    // 關閉選單
    showMoreMenu.value = false;

    // 調用 API 切換封存狀態
    await archiveConversation(conversationId, !isCurrentlyArchived);

    // 更新 store 中的對話狀態
    const conversation = messageStore.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.is_archived = !isCurrentlyArchived;
    }

    // 如果當前在「全部」頁籤且對話被封存，取消選擇該對話
    if (!isCurrentlyArchived && activeFilter.value === 'all') {
      deselectConversation();
    }
  } catch (error) {
    console.error('Failed to archive/unarchive conversation:', error);
    alert('操作失敗，請稍後再試');
  }
}

function handleClickOutside(event) {
  // 檢查點擊是否在選單容器外部
  if (showMoreMenu.value) {
    const menuContainer = event.target.closest('.more-menu-container');
    if (!menuContainer) {
      showMoreMenu.value = false;
    }
  }
}

function deselectConversation() {
  const conversationId = selectedConversation.value?.id;
  if (conversationId) {
    messageStore.setPendingItemReference(conversationId, pendingItemReference.value);
    messageStore.setMessageDraft(conversationId, messageInput.value);
  }
  pendingItemReference.value = null;
  clearTypingStopTimer();
  resetTypingFlags();
  messageStore.clearSelectedConversation();
}

async function sendMessage() {
  if (!messageInput.value.trim() || !selectedConversation.value) return;

  const content = messageInput.value.trim();
  const relatedItemId = pendingItemReference.value ? pendingItemReference.value.id : null;
  const relatedItemTitle = pendingItemReference.value ? pendingItemReference.value.title : null;

  // 立即清空輸入框
  messageInput.value = '';
  clearTypingStopTimer();
  resetTypingFlags();
  if (selectedConversation.value?.id && currentUserIdentity.value?.id) {
    messageStore.broadcastTypingStatus(selectedConversation.value.id, false, currentUserIdentity.value).catch(err => {
      console.error('Failed to broadcast typing end after send:', err);
    });
  }

  // 發送訊息時重置未讀訊息分隔線（因為我已經回覆了）
  clearUnreadDivider({ suppress: true });

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
  await waitForTicks(2);
  scrollToBottom(false);

  // 清除待發送的物品引用
  const shouldClearItemReference = !!pendingItemReference.value;
  if (shouldClearItemReference) {
    const activeConversationId = selectedConversation.value?.id || null;
    pendingItemReference.value = null;
    if (activeConversationId) {
      messageStore.clearPendingItemReference(activeConversationId);
    }

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

    applyItemMetadataToMessages();

    if (relatedItemId && selectedConversation.value) {
      const itemKey = toItemKey(relatedItemId);
      const hasCachedItem = itemKey !== null ? resolveItemFromMap(itemKey) : null;
      if (!hasCachedItem) {
        loadConversationItems(selectedConversation.value.id).catch(err => {
          console.error('Failed to refresh conversation items after sending message:', err);
        });
      }
    }

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

  if (selectedConversation.value?.id) {
    messageStore.clearPendingItemReference(selectedConversation.value.id);
  }

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

    applyItemMetadataToMessages();

    if (relatedItemId && selectedConversation.value) {
      const itemKey = toItemKey(relatedItemId);
      const hasCachedItem = itemKey !== null ? resolveItemFromMap(itemKey) : null;
      if (!hasCachedItem) {
        loadConversationItems(selectedConversation.value.id).catch(err => {
          console.error('Failed to refresh conversation items after retrying message:', err);
        });
      }
    }

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

// 檢查是否在訊息底部
function isAtBottom() {
  if (!messagesArea.value) return false;
  const { scrollTop, scrollHeight, clientHeight } = messagesArea.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  return distanceFromBottom < 100; // 100px 閾值
}

async function handleMessagesScroll() {
  if (!messagesArea.value) return;

  const { scrollTop, scrollHeight, clientHeight } = messagesArea.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  const distanceFromTop = scrollTop;

  showScrollToBottomBtn.value = distanceFromBottom > 200;

  // 更新 store 中的「是否在底部」狀態
  const atBottom = distanceFromBottom < 100;
  const wasPreviouslyAtBottom = messageStore.isAtMessagesBottom;
  messageStore.setIsAtMessagesBottom(atBottom);

  if (
    !atBottom &&
    firstUnreadMessageId.value &&
    hasReachedBottomAfterUnread.value &&
    distanceFromBottom > UNREAD_DIVIDER_CLEAR_THRESHOLD
  ) {
    clearUnreadDivider({ suppress: true });
    console.log('[MessagesPage] 從底部向上滑動一段距離，清除未讀訊息分隔線');
  }

  // 當使用者滾動到底部時，重置新訊息計數並標記為已讀
  if (atBottom) {
    newMessageCount.value = 0;
    if (firstUnreadMessageId.value) {
      hasReachedBottomAfterUnread.value = true;
      allowUnreadDivider();
    }

    // 如果剛從不在底部變成在底部，且仍有未讀訊息，則標記為已讀
    if (!wasPreviouslyAtBottom && selectedConversation.value) {
      const hasUnreadMessages = messageStore.currentMessages.some(msg => !msg.is_mine && !msg.is_read);

      if (hasUnreadMessages) {
        const unreadMessageIds = [];

        // 先樂觀地將未讀訊息設為已讀，以避免分隔線再次出現
        messageStore.currentMessages.forEach(msg => {
          if (!msg.is_mine && !msg.is_read) {
            unreadMessageIds.push(msg.id);
            msg.is_read = true;
          }
        });

        allowUnreadDivider();

        try {
          const { markAsRead } = await import('@/api/conversationAPI_v2');
          await markAsRead(selectedConversation.value.id);
          console.log('[MessagesPage] 滾動到底部，已標記為已讀');

          // 更新對話列表中的未讀計數
          const conversation = messageStore.conversations.find(c => c.id === selectedConversation.value.id);
          if (conversation) {
            conversation.unread_count = 0;
          }
        } catch (err) {
          // 如果 API 失敗，還原本地未讀狀態
          messageStore.currentMessages.forEach(msg => {
            if (unreadMessageIds.includes(msg.id)) {
              msg.is_read = false;
            }
          });

          allowUnreadDivider();

          console.error('[MessagesPage] 標記已讀失敗:', err);
        }
      }
    }
  }

  if (distanceFromTop < 200 && !isLoadingMoreMessages.value && hasMoreMessages.value && selectedConversation.value) {
    loadMoreMessages();
  }
}

function scrollToBottom(smooth = false) {
  // 重置新訊息計數
  newMessageCount.value = 0;

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

    if (firstUnreadMessageId.value) {
      hasReachedBottomAfterUnread.value = true;
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

      applyItemMetadataToMessages();

      const needsItemRefresh = olderMessages.some(msg => {
        const itemKey = toItemKey(msg.related_item_id);
        if (itemKey === null) return false;
        return !resolveItemFromMap(itemKey);
      });

      if (needsItemRefresh && selectedConversation.value) {
        loadConversationItems(selectedConversation.value.id).catch(err => {
          console.error('Failed to refresh conversation items while loading more:', err);
        });
      }

      await waitForTicks(2);

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
          const cacheKey = toItemKey(itemId);
          if (cacheKey !== null) {
            const nextCache = new Map(itemReferenceCache.value);
            nextCache.set(cacheKey, itemTitle);
            itemReferenceCache.value = nextCache;
          }
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
  // 設置為在訊息頁面
  messageStore.setIsInMessagesPage(true);
  messageStore.setIsAtMessagesBottom(true); // 初始化為在底部

  await initialize();
  handleMobileKeyboard();

  await waitForTicks(2);

  if (messagesArea.value) {
    messagesArea.value.addEventListener('scroll', handleMessagesScroll, { passive: true });
  }

  // 添加點擊外部關閉選單的監聽器
  document.addEventListener('click', handleClickOutside);

  watch(
    () => messageStore.currentMessages.length,
    async (newLen, oldLen) => {
      // 只在訊息增加時處理（不處理減少，例如刪除訊息的情況）
      if (newLen <= oldLen) return;

      // 跳過初次載入或往上載入更多訊息時的變化
      if (messagesLoading.value || isLoadingMoreMessages.value) return;

      await waitForTicks(2);

      if (!messagesArea.value) return;

      // 檢查是否在底部
      const atBottom = isAtBottom();

      // 取得本次新增的訊息（僅限陣列尾端新增的部分）
      const appendedMessages = messageStore.currentMessages.slice(oldLen);
      if (appendedMessages.length > 0) {
        applyItemMetadataToMessages();

        const hasItemReferenceWithoutCache = appendedMessages.some(msg => {
          const itemKey = toItemKey(msg.related_item_id);
          if (itemKey === null) return false;
          return !resolveItemFromMap(itemKey);
        });

        if (hasItemReferenceWithoutCache && selectedConversation.value) {
          loadConversationItems(selectedConversation.value.id).catch(err => {
            console.error('Failed to refresh conversation items for new message:', err);
          });
        }
      }
      const incomingMessages = appendedMessages.filter(msg => !msg.is_mine);
      const incomingCount = incomingMessages.length;

      if (atBottom) {
        // 在底部：自動滾動到最新訊息
        messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
        showScrollToBottomBtn.value = false;
        newMessageCount.value = 0;
        messageStore.setIsAtMessagesBottom(true); // 確保 store 知道在底部
        allowUnreadDivider();

        if (firstUnreadMessageId.value) {
          hasReachedBottomAfterUnread.value = true;
        }
      } else {
        // 不在底部：增加新訊息計數，顯示按鈕
        if (incomingCount > 0) {
          newMessageCount.value += incomingCount;
        }
        showScrollToBottomBtn.value = true;
        messageStore.setIsAtMessagesBottom(false); // 通知 store 不在底部

        if (incomingCount > 0) {
          allowUnreadDivider();
          hasReachedBottomAfterUnread.value = false;
        }
      }
    }
  );
});

onBeforeUnmount(() => {
  const conversationId = selectedConversation.value?.id;
  if (conversationId) {
    messageStore.setPendingItemReference(conversationId, pendingItemReference.value);
    messageStore.setMessageDraft(conversationId, messageInput.value);
    if (currentUserIdentity.value?.id) {
      messageStore.broadcastTypingStatus(conversationId, false, currentUserIdentity.value).catch(err => {
        console.error('Failed to broadcast typing end before unmount:', err);
      });
    }
    messageStore.leaveTypingChannel(conversationId).catch(err => {
      console.error('Failed to leave typing channel before unmount:', err);
    });
  }

  clearTypingStopTimer();
  resetTypingFlags();

  // 離開訊息頁面
  messageStore.setIsInMessagesPage(false);
  messageStore.setIsAtMessagesBottom(true); // 重置為預設值

  if (messagesArea.value) {
    messagesArea.value.removeEventListener('scroll', handleMessagesScroll);
  }

  // 移除點擊外部關閉選單的監聽器
  document.removeEventListener('click', handleClickOutside);
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
