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
          <div :class="['chat-area', { 'mobile-visible': selectedConversation }]">
            <!-- No Conversation Selected -->
            <div v-if="!selectedConversation" class="no-conversation">
              <i class="bi bi-chat-dots"></i>
              <h3>選擇對話開始聊天</h3>
              <p>從左側選擇一個對話，開始與其他使用者交流</p>
            </div>

            <!-- Active Chat -->
            <div v-else class="active-chat">
              <!-- Chat Header -->
              <div class="chat-header">
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
                <transition-group name="message-pop" tag="div" class="messages-list" v-else>
                  <div v-for="message in messages" :key="message.id" class="message-wrapper">
                    <!-- Date Divider -->
                    <div v-if="message.showDate" class="date-divider">
                      <span>{{ message.date }}</span>
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
                    <div v-else :class="['message', { 'message-sent': message.isSent, 'message-received': !message.isSent }]">
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
                        <span class="message-time">{{ message.time }}</span>
                      </div>
                    </div>
                  </div>
                </transition-group>
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
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import OfferMessage from '../components/OfferMessage.vue';
import OrderRequestMessage from '../components/OrderRequestMessage.vue';
import { supabase } from '@/lib/supabase';
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageAPI,
  markAsRead,
  subscribeToAllMessages
} from '@/api/conversationAPI_v2';
import { formatRelativeTime } from '@/utils/timeFormat';

const router = useRouter();

// State
const userPoints = ref(500);
const searchQuery = ref('');
const activeFilter = ref('all');
const selectedConversation = ref(null);
const messageInput = ref('');
const messagesArea = ref(null);
const showFilterMenu = ref(false);
const loading = ref(false);
const messagesLoading = ref(false); // 訊息載入狀態（用於切換聊天室時顯示 skeleton）
const error = ref(null);
const currentUser = ref(null);
const pendingItemReference = ref(null); // 待發送的物品引用
const itemReferenceCache = ref(new Map()); // 物品引用緩存 Map<itemId, itemTitle>
const showScrollToBottomBtn = ref(false); // 顯示「回到最新」按鈕

const filters = ref([
  { id: 'all', label: '全部', count: 0 },
  { id: 'unread', label: '未讀', count: 0 },
  { id: 'buyer', label: '購買中', count: 0 },
  { id: 'seller', label: '出售中', count: 0 }
]);

// Real conversations from Supabase
const conversations = ref([]);
const messages = ref([]);
const globalMessageSubscription = ref(null); // 全域訊息訂閱
const conversationSubscription = ref(null);
const timeUpdateInterval = ref(null); // 時間更新定時器

// Computed
const filteredConversations = computed(() => {
  let filtered = conversations.value;

  // Filter by type
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'unread') {
      filtered = filtered.filter(c => c.unreadCount > 0);
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
  return filteredConversations.value.map(convo => ({
    id: convo.id,
    user: {
      name: convo.other_user.nickname,
      avatar: convo.other_user.profile_picture_url || `https://placehold.co/48/6fb8a5/ffffff?text=${convo.other_user.nickname?.charAt(0) || 'U'}`,
      online: false
    },
    product: convo.item.id ? {
      id: convo.item.id,
      name: convo.item.title,
      price: 0,
      image: convo.item.cover_image_url || 'https://placehold.co/60x60/6fb8a5/ffffff?text=Item'
    } : null,
    lastMessage: {
      text: convo.last_message || convo.last_message_preview || '開始對話...',
      time: formatRelativeTime(convo.last_message_time || convo.last_updated_at)
    },
    unreadCount: convo.unread_count || 0,
    type: convo.role,
    _raw: convo
  }));
});

// Helper functions
// 時間格式化已改用 @/utils/timeFormat.js 的 formatRelativeTime

// 更新所有訊息和對話的時間顯示
function updateAllTimestamps() {
  // 更新當前對話中的所有訊息時間
  messages.value.forEach(msg => {
    if (msg.created_at) {
      msg.time = formatRelativeTime(msg.created_at);
    }
  });

  // 更新對話列表中的最後訊息時間
  // 由於 displayConversations 是 computed，我們需要觸發 conversations 的更新
  conversations.value = conversations.value.map(conv => ({
    ...conv,
    // 保持原有資料不變，只是觸發 computed 重新計算
  }));
}

// API Methods
async function loadConversations() {
  loading.value = true;
  error.value = null;

  try {
    // v2 API: getConversations(page, size, includeArchived)
    const data = await getConversations(1, 50, false);

    if (data) {
      // Transform v2 data structure to match component expectations
      conversations.value = data.map(conv => ({
        id: conv.conversation_id,
        item: {
          id: conv.initial_item_id,
          title: conv.initial_item_title || '未知商品',
          cover_image_url: conv.initial_item_image || null
        },
        other_user: {
          id: conv.other_user_id,
          nickname: conv.other_user_name || '未知使用者',
          profile_picture_url: conv.other_user_avatar || null
        },
        last_message: conv.last_message_content || '開始對話...',
        last_message_time: conv.last_message_at || conv.created_at,
        unread_count: conv.unread_count || 0,
        is_archived: conv.is_archived || false,
        created_at: conv.created_at,
        // Determine role based on current user
        role: currentUser.value ?
          (conv.other_user_id === currentUser.value.id ? 'seller' : 'buyer') :
          'buyer'
      }));
      updateFilterCounts();
    }
  } catch (err) {
    console.error('Failed to load conversations:', err);
    error.value = '載入對話失敗';
  } finally {
    loading.value = false;
  }
}

function updateFilterCounts() {
  const all = conversations.value;
  filters.value[0].count = all.length;
  filters.value[1].count = all.filter(c => c.unread_count > 0).length;
  filters.value[2].count = all.filter(c => c.role === 'buyer').length;
  filters.value[3].count = all.filter(c => c.role === 'seller').length;
}

async function loadMessages(conversationId) {
  messagesLoading.value = true; // 開始載入訊息
  try {
    // v2 API: getMessages(conversationId, page, size)
    let data = await getMessages(conversationId, 1, 50);

    if (data) {
      // 確保訊息順序：舊訊息在上，新訊息在下
      // 如果後端返回的是降序（新到舊），需要反轉
      // 檢查第一條和最後一條的時間戳
      if (data.length > 1) {
        const firstTime = new Date(data[0].created_at).getTime();
        const lastTime = new Date(data[data.length - 1].created_at).getTime();

        // 如果第一條比最後一條新，說明是降序，需要反轉
        if (firstTime > lastTime) {
          console.log('[Debug] 訊息順序為降序，反轉為升序');
          data = data.reverse();
        }
      }

      // Transform messages for display
      let lastDate = '';
      messages.value = data.map((msg) => {
        const msgDate = new Date(msg.created_at).toLocaleDateString('zh-TW');
        const showDate = msgDate !== lastDate;
        lastDate = msgDate;

        // 如果有物品引用信息，加入緩存
        if (msg.related_item_id && msg.related_item_title) {
          itemReferenceCache.value.set(msg.related_item_id, msg.related_item_title);
        }

        return {
          id: msg.message_id,
          text: msg.content,
          time: formatRelativeTime(msg.created_at),
          created_at: msg.created_at, // 保存原始時間戳用於自動更新
          isSent: msg.is_mine,
          showDate,
          date: showDate ? formatDateDivider(msg.created_at) : '',
          message_type: msg.message_type,
          related_item_id: msg.related_item_id,
          related_item_title: msg.related_item_title,
          sender: {
            id: msg.sender_id,
            name: msg.sender_name,
            avatar: msg.sender_avatar
          }
        };
      });

      // Mark messages as read
      await markAsRead(conversationId);
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
  } finally {
    messagesLoading.value = false; // 載入完成
  }
}

function formatDateDivider(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 24 * 60 * 60 * 1000) {
    return '今天';
  }
  if (diff < 48 * 60 * 60 * 1000) {
    return '昨天';
  }
  return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
}

// Methods
async function selectConversation(conversation) {
  selectedConversation.value = conversation;

  // Load messages from API
  await loadMessages(conversation.id);

  // Mark as read locally
  conversation.unreadCount = 0;

  // Scroll to bottom
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
    }
  });
}

function deselectConversation() {
  selectedConversation.value = null;
  messages.value = [];
}

// Global real-time message handler (處理所有對話的新訊息)
function handleGlobalRealtimeMessage(newMessage) {
  console.log('[Debug] 收到全域新訊息:', newMessage);

  const messageId = newMessage.message_id || newMessage.id;
  const createdAt = newMessage.created_at || newMessage.sent_at;
  const senderId = newMessage.sender_id;
  const content = newMessage.content;
  const conversationId = newMessage.conversation_id;

  // 1. 更新對話列表中的最後訊息和未讀數
  const conversation = conversations.value.find(c => c.id === conversationId);
  if (conversation) {
    conversation.last_message = content;
    conversation.last_message_time = createdAt;

    // 如果訊息不是自己發的，增加未讀數
    if (senderId !== currentUser.value?.id) {
      conversation.unread_count = (conversation.unread_count || 0) + 1;
    }

    console.log('[Debug] 已更新對話列表中的對話 #' + conversationId);
  }

  // 2. 如果是當前選中的對話，更新訊息列表
  if (selectedConversation.value && conversationId === selectedConversation.value.id) {
    console.log('[Debug] 訊息屬於當前對話，準備新增到訊息列表');

    // Check if message already exists (avoid duplicates)
    const exists = messages.value.some(m => m.id === messageId);
    if (exists) {
      console.log('[Debug] 訊息已存在，避免重複');
      return;
    }

    // Add message to current conversation's message list
    const relatedItemId = newMessage.related_item_id || null;
    let relatedItemTitle = newMessage.related_item_title || null;

    // 如果沒有標題但有 ID，嘗試從緩存中獲取
    if (relatedItemId && !relatedItemTitle) {
      relatedItemTitle = itemReferenceCache.value.get(relatedItemId) || null;
    }

    const newMsg = {
      id: messageId,
      text: content,
      time: formatRelativeTime(createdAt),
      created_at: createdAt, // 保存原始時間戳用於自動更新
      isSent: senderId === currentUser.value?.id,
      showDate: false,
      message_type: newMessage.message_type || 'text',
      related_item_id: relatedItemId,
      related_item_title: relatedItemTitle,
      sender: {
        id: senderId,
        name: newMessage.sender_name || '未知使用者',
        avatar: newMessage.sender_avatar || null
      }
    };

    messages.value.push(newMsg);
    console.log('[Debug] 訊息已新增到列表，目前總訊息數:', messages.value.length);

    // Auto-scroll to bottom
    nextTick(() => {
      if (messagesArea.value) {
        messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
        console.log('[Debug] 已滾動到底部');
      }
    });

    // Mark as read if received and conversation is currently selected
    if (senderId !== currentUser.value?.id) {
      markAsRead(conversationId);
      // 重置當前對話的未讀數
      if (conversation) {
        conversation.unread_count = 0;
      }
      console.log('[Debug] 已標記訊息為已讀');
    }
  } else {
    console.log('[Debug] 訊息不屬於當前對話，只更新對話列表');
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || !selectedConversation.value) return;

  const content = messageInput.value.trim();
  const relatedItemId = pendingItemReference.value ? pendingItemReference.value.id : null;
  const relatedItemTitle = pendingItemReference.value ? pendingItemReference.value.title : null;

  messageInput.value = '';

  // 如果有物品引用，加入緩存
  if (relatedItemId && relatedItemTitle) {
    itemReferenceCache.value.set(relatedItemId, relatedItemTitle);
  }

  try {
    // v2 API: sendMessage(conversationId, content, messageType, relatedItemId)
    const newMessage = await sendMessageAPI(
      selectedConversation.value.id,
      content,
      'text',
      relatedItemId
    );

    console.log('[Debug] 發送訊息成功，回傳資料:', newMessage);

    // 清除待發送的物品引用
    if (pendingItemReference.value) {
      pendingItemReference.value = null;

      // 清除 URL 中的物品相關參數
      const currentQuery = { ...router.currentRoute.value.query };
      if (currentQuery.itemId || currentQuery.itemTitle) {
        delete currentQuery.itemId;
        delete currentQuery.itemTitle;
        router.replace({ query: currentQuery });
      }
    }

    // 檢查訊息是否已存在（可能由 realtime 先加入）
    const messageId = newMessage.message_id || newMessage.id;
    const exists = messages.value.some(m => m.id === messageId);

    if (exists) {
      console.log('[Debug] 訊息已由 realtime 加入，跳過手動添加');
    } else {
      // Add to messages list
      messages.value.push({
        id: messageId,
        text: newMessage.content,
        time: formatRelativeTime(newMessage.created_at),
        created_at: newMessage.created_at, // 保存原始時間戳用於自動更新
        isSent: true,
        showDate: false,
        message_type: newMessage.message_type || 'text',
        related_item_id: newMessage.related_item_id || relatedItemId,
        related_item_title: newMessage.related_item_title || relatedItemTitle,
        sender: {
          id: newMessage.sender_id,
          name: currentUser.value?.user_metadata?.nickname || '我',
          avatar: currentUser.value?.user_metadata?.profile_picture_url || null
        }
      });
      console.log('[Debug] 訊息已手動加入列表');
    }

    // Update conversation last message
    if (selectedConversation.value) {
      selectedConversation.value.lastMessage = {
        text: newMessage.content,
        time: formatRelativeTime(newMessage.created_at)
      };
    }

    // Scroll to bottom
    nextTick(() => {
      if (messagesArea.value) {
        messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
      }
    });
  } catch (err) {
    console.error('Failed to send message:', err);
    alert('發送訊息失敗，請稍後再試');
    messageInput.value = content; // Restore message
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

// Handle messages area scroll to show/hide scroll-to-bottom button
function handleMessagesScroll() {
  if (!messagesArea.value) return;

  const { scrollTop, scrollHeight, clientHeight } = messagesArea.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  // 顯示按鈕的閾值：距離底部超過 200px
  showScrollToBottomBtn.value = distanceFromBottom > 200;
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesArea.value) {
      // Use smooth scrolling on mobile to prevent issues with virtual keyboard
      if ('ontouchstart' in window || navigator.maxTouchPoints) {
        // On mobile devices, use a more reliable scroll method
        messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
      } else {
        // On desktop, use smooth scrolling
        messagesArea.value.scrollTo({
          top: messagesArea.value.scrollHeight,
          behavior: 'smooth'
        });
      }
      
      // On mobile devices, ensure the last message is visible after a delay
      if (window.matchMedia('(max-width: 575.98px)').matches) {
        setTimeout(() => {
          const allMessages = messagesArea.value.querySelectorAll('.message-wrapper');
          if (allMessages.length > 0) {
            const lastMessage = allMessages[allMessages.length - 1];
            if (lastMessage) {
              lastMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }, 100); // Delay to account for keyboard animation
      }
    }
  });
}

// Initialize
async function initialize() {
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    router.push('/login');
    return;
  }

  currentUser.value = user;
  await loadConversations();

  // 訂閱所有對話的新訊息 (全域監聽)
  // 如果資料庫使用舊表名，請改為: subscribeToAllMessages(handleGlobalRealtimeMessage, 'conversation_messages')
  globalMessageSubscription.value = subscribeToAllMessages(handleGlobalRealtimeMessage);
  console.log('[Debug] 已啟動全域訊息監聽');

  // 如果 URL 有指定 conversationId，自動選擇該對話
  const conversationId = router.currentRoute.value.query.conversationId;
  const itemId = router.currentRoute.value.query.itemId;
  const itemTitle = router.currentRoute.value.query.itemTitle;

  if (conversationId) {
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
onMounted(() => {
  initialize();
  handleMobileKeyboard();

  // 啟動時間自動更新定時器（每分鐘更新一次）
  timeUpdateInterval.value = setInterval(() => {
    updateAllTimestamps();
    console.log('[Debug] 已更新所有時間顯示');
  }, 60000); // 60000ms = 1分鐘
});

onBeforeUnmount(() => {
  // Clean up subscriptions
  if (globalMessageSubscription.value) {
    globalMessageSubscription.value.unsubscribe();
    console.log('[Debug] 已取消全域訊息監聽');
  }
  if (conversationSubscription.value) {
    conversationSubscription.value.unsubscribe();
  }

  // 清除時間更新定時器
  if (timeUpdateInterval.value) {
    clearInterval(timeUpdateInterval.value);
    console.log('[Debug] 已清除時間更新定時器');
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
  // Ensure proper mobile layout
  min-height: 0; // Allow flex item to shrink
  position: relative; // 為浮動按鈕定位
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
  background: #f9f9f9;
  // Ensure proper scrolling on mobile
  -webkit-overflow-scrolling: touch; // Smooth scrolling on iOS
  min-height: 0; // Allow flex item to shrink
  display: flex;
  flex-direction: column;
  position: relative; // 為了定位「回到最新」按鈕
}

.messages-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.message-wrapper {
  margin-bottom: 16px;
}

.date-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;

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

  &.message-sent {
    justify-content: flex-end;

    .message-content {
      background: $primary;
      color: white;
      border-radius: 16px 16px 4px 16px;
      transform-origin: bottom right;

      .message-time {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  &.message-received {
    justify-content: flex-start;

    .message-content {
      background: white;
      color: #1e1e1e;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transform-origin: bottom left;

      .message-time {
        color: #999;
      }
    }
  }
}

.message-content {
  max-width: 70%;
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
  }

  .active-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    height: -webkit-fill-available; // For iOS Safari
    flex: 1;
  }

  .messages-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 16px; // Reduced padding for mobile
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

  .message-content {
    max-width: 85%;
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
</style>
