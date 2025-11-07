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

              <!-- Product Context (if applicable) -->
              <ItemContextBar
                v-if="selectedConversation.product"
                :items="[selectedConversation.product]"
                @item-click="goToProduct"
              />

              <!-- Messages Area -->
              <div ref="messagesArea" class="messages-area">
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
                    :seller-id="selectedConversation._raw.item.owner_id"
                    @accept="handleAcceptOrderRequest"
                    @decline="handleDeclineOrderRequest"
                    @view-details="handleViewOrderDetails"
                  />

                  <!-- Regular Text Message -->
                  <div v-else :class="['message', { 'message-sent': message.isSent, 'message-received': !message.isSent }]">
                    <div class="message-content">
                      <p class="message-text">{{ message.text }}</p>
                      <span class="message-time">{{ message.time }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Action Bar -->
              <QuickActionBar
                v-if="selectedConversation && selectedConversation.product"
                :conversation-id="selectedConversation.id"
                :item-id="selectedConversation.product.id"
                :current-user-id="currentUser?.id"
                :seller-id="selectedConversation._raw.item.owner_id"
                :current-price="selectedConversation.product.price || 0"
                :transaction-state="currentTransactionState"
                :message-count="messages.length"
                :pending-offer="currentPendingOffer"
                @send-quick-prompt="handleSendQuickPrompt"
                @make-offer="handleMakeOffer"
                @accept-offer="handleAcceptOffer"
                @counter-offer="handleCounterOffer"
                @request-order="handleRequestOrder"
              />

              <!-- Input Area -->
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
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import ItemContextBar from '../components/ItemContextBar.vue';
import QuickActionBar from '../components/QuickActionBar.vue';
import OfferMessage from '../components/OfferMessage.vue';
import OrderRequestMessage from '../components/OrderRequestMessage.vue';
import { supabase } from '@/lib/supabase';
import {
  getMyConversations,
  getConversationMessages,
  sendMessage as sendMessageAPI,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToConversations
} from '@/api/conversationsAPI';
import { useTransactions } from '@/composables/useTransactions';

const router = useRouter();
const {
  makeOffer,
  acceptOffer,
  counterOffer,
  declineOffer,
  requestOrder,
  acceptOrderRequest,
  declineOrderRequest
} = useTransactions();

// State
const userPoints = ref(500);
const searchQuery = ref('');
const activeFilter = ref('all');
const selectedConversation = ref(null);
const messageInput = ref('');
const messagesArea = ref(null);
const showFilterMenu = ref(false);
const loading = ref(false);
const error = ref(null);
const currentUser = ref(null);

const filters = ref([
  { id: 'all', label: '全部', count: 0 },
  { id: 'unread', label: '未讀', count: 0 },
  { id: 'buyer', label: '購買中', count: 0 },
  { id: 'seller', label: '出售中', count: 0 }
]);

// Real conversations from Supabase
const conversations = ref([]);
const messages = ref([]);
const messageSubscription = ref(null);
const conversationSubscription = ref(null);

// Transaction state
const currentTransactionState = ref('negotiating');
const currentPendingOffer = ref(null);

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
      online: false // We don't have online status yet
    },
    product: convo.item.id ? {
      id: convo.item.id,
      name: convo.item.title,
      price: 0, // Will need to fetch from items if needed
      image: convo.item.cover_image_url || 'https://placehold.co/60x60/6fb8a5/ffffff?text=Item'
    } : null,
    lastMessage: {
      text: convo.last_message_preview || '開始對話...',
      time: formatTime(convo.last_updated_at)
    },
    unreadCount: convo.unread_count || 0,
    type: convo.role,
    _raw: convo
  }));
});

// Helper functions
function formatTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than 1 day
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  }

  // Less than 2 days
  if (diff < 48 * 60 * 60 * 1000) {
    return '昨天';
  }

  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }

  // Show date
  return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

// API Methods
async function loadConversations() {
  loading.value = true;
  error.value = null;

  try {
    const role = activeFilter.value === 'all' ? 'all' : activeFilter.value;
    const data = await getMyConversations(role, { page: 1, size: 50 });

    if (data) {
      conversations.value = data;
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
  try {
    const data = await getConversationMessages(conversationId, { limit: 50 });

    if (data) {
      // Transform messages for display
      let lastDate = '';
      messages.value = data.map((msg) => {
        const msgDate = new Date(msg.sent_at).toLocaleDateString('zh-TW');
        const showDate = msgDate !== lastDate;
        lastDate = msgDate;

        return {
          id: msg.id,
          text: msg.content,
          time: formatMessageTime(msg.sent_at),
          isSent: msg.sender_id === currentUser.value?.id,
          showDate,
          date: showDate ? formatDateDivider(msg.sent_at) : ''
        };
      });

      // Mark messages as read
      await markMessagesAsRead(conversationId);
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
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

  // Unsubscribe from previous conversation
  if (messageSubscription.value) {
    messageSubscription.value.unsubscribe();
    messageSubscription.value = null;
  }

  // Load messages from API
  await loadMessages(conversation.id);

  // Mark as read locally
  conversation.unreadCount = 0;

  // Subscribe to real-time messages
  messageSubscription.value = subscribeToMessages(conversation.id, handleRealtimeMessage);

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

  // Unsubscribe from messages
  if (messageSubscription.value) {
    messageSubscription.value.unsubscribe();
    messageSubscription.value = null;
  }
}

// Real-time message handler
function handleRealtimeMessage(newMessage) {
  if (!selectedConversation.value || newMessage.conversation_id !== selectedConversation.value.id) {
    return;
  }

  // Check if message already exists (avoid duplicates)
  const exists = messages.value.some(m => m.id === newMessage.id);
  if (exists) return;

  // Add message to list
  messages.value.push({
    id: newMessage.id,
    text: newMessage.content,
    time: formatMessageTime(newMessage.sent_at),
    isSent: newMessage.sender_id === currentUser.value?.id,
    showDate: false
  });

  // Auto-scroll to bottom
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
    }
  });

  // Mark as read if received
  if (newMessage.sender_id !== currentUser.value?.id) {
    markMessagesAsRead(selectedConversation.value.id);
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || !selectedConversation.value) return;

  const content = messageInput.value.trim();
  messageInput.value = '';

  try {
    // Send message via API
    const newMessage = await sendMessageAPI(selectedConversation.value.id, content);

    // Add to messages list
    messages.value.push({
      id: newMessage.id,
      text: newMessage.content,
      time: formatMessageTime(newMessage.sent_at),
      isSent: true,
      showDate: false
    });

    // Update conversation last message
    if (selectedConversation.value) {
      selectedConversation.value.lastMessage = {
        text: newMessage.content,
        time: formatTime(newMessage.sent_at)
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

function goToProduct(itemOrId) {
  const productId = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
  router.push({ name: 'ItemDetail', params: { id: productId } });
}

// Helper function to get buyer ID from conversation
function getBuyerId(conversation) {
  if (!conversation || !conversation._raw) return null;
  // Buyer is the person who started the conversation (not the item owner)
  return conversation._raw.role === 'buyer'
    ? currentUser.value?.id
    : conversation._raw.other_user.id;
}

// Transaction Handlers
async function handleSendQuickPrompt(promptText) {
  messageInput.value = promptText;
  await sendMessage();
}

async function handleMakeOffer(offerData) {
  if (!selectedConversation.value) return;

  try {
    const offer = await makeOffer(
      selectedConversation.value.id,
      offerData.amount,
      'buyer'
    );

    // Send as special message
    const offerMessage = await sendMessageAPI(selectedConversation.value.id, `買家出價 ${offerData.amount}P`, {
      message_type: 'offer',
      metadata: {
        ...offer,
        original_price: offerData.originalPrice
      }
    });

    // Add to messages
    messages.value.push({
      id: offerMessage.id,
      message_type: 'offer',
      metadata: {
        ...offer,
        original_price: offerData.originalPrice
      },
      time: formatMessageTime(offerMessage.sent_at),
      isSent: true,
      showDate: false
    });

    // Set as current pending offer
    currentPendingOffer.value = offer;

    scrollToBottom();
  } catch (err) {
    console.error('Failed to make offer:', err);
    alert('出價失敗，請稍後再試');
  }
}

async function handleAcceptOffer(offer) {
  try {
    await acceptOffer(offer.id);

    // Update message status
    const messageIndex = messages.value.findIndex(
      m => m.metadata?.id === offer.id
    );
    if (messageIndex >= 0) {
      messages.value[messageIndex].metadata.status = 'accepted';
    }

    currentPendingOffer.value = null;
    alert('已接受出價');
  } catch (err) {
    console.error('Failed to accept offer:', err);
    alert('接受出價失敗，請稍後再試');
  }
}

async function handleCounterOffer(offerData) {
  try {
    const result = await counterOffer(offerData.originalOfferId, offerData.amount);

    // Send counter offer message
    const counterMessage = await sendMessageAPI(selectedConversation.value.id, `賣家還價 ${offerData.amount}P`, {
      message_type: 'counter_offer',
      metadata: result.counter_offer
    });

    // Add to messages
    messages.value.push({
      id: counterMessage.id,
      message_type: 'counter_offer',
      metadata: result.counter_offer,
      time: formatMessageTime(counterMessage.sent_at),
      isSent: true,
      showDate: false
    });

    // Update original offer status
    const originalMessageIndex = messages.value.findIndex(
      m => m.metadata?.id === offerData.originalOfferId
    );
    if (originalMessageIndex >= 0) {
      messages.value[originalMessageIndex].metadata.status = 'countered';
    }

    currentPendingOffer.value = result.counter_offer;
    scrollToBottom();
  } catch (err) {
    console.error('Failed to counter offer:', err);
    alert('還價失敗，請稍後再試');
  }
}

async function handleDeclineOffer(offer) {
  try {
    await declineOffer(offer.id);

    // Update message status
    const messageIndex = messages.value.findIndex(
      m => m.metadata?.id === offer.id
    );
    if (messageIndex >= 0) {
      messages.value[messageIndex].metadata.status = 'declined';
    }

    currentPendingOffer.value = null;
    alert('已拒絕出價');
  } catch (err) {
    console.error('Failed to decline offer:', err);
    alert('拒絕出價失敗，請稍後再試');
  }
}

async function handleRequestOrder() {
  if (!selectedConversation.value || !selectedConversation.value.product) return;

  try {
    const orderReq = await requestOrder(
      selectedConversation.value.id,
      selectedConversation.value.product.id,
      selectedConversation.value.product.price
    );

    // Send order request message
    const orderMessage = await sendMessageAPI(selectedConversation.value.id, '請求訂單', {
      message_type: 'order_request',
      metadata: {
        ...orderReq,
        item: selectedConversation.value.product,
        agreed_price: selectedConversation.value.product.price,
        delivery_method: '面交'
      }
    });

    // Add to messages
    messages.value.push({
      id: orderMessage.id,
      message_type: 'order_request',
      metadata: {
        ...orderReq,
        item: selectedConversation.value.product,
        agreed_price: selectedConversation.value.product.price,
        delivery_method: '面交'
      },
      time: formatMessageTime(orderMessage.sent_at),
      isSent: true,
      showDate: false
    });

    currentTransactionState.value = 'order_requested';
    scrollToBottom();
  } catch (err) {
    console.error('Failed to request order:', err);
    alert('請求訂單失敗，請稍後再試');
  }
}

async function handleAcceptOrderRequest(orderRequest) {
  try {
    await acceptOrderRequest(orderRequest.id);

    // Update message status
    const messageIndex = messages.value.findIndex(
      m => m.metadata?.id === orderRequest.id
    );
    if (messageIndex >= 0) {
      messages.value[messageIndex].metadata.status = 'accepted';
    }

    currentTransactionState.value = 'buyer_confirmed';

    // Navigate to transaction confirmation page
    router.push({
      name: 'TransactionDetails',
      query: { conversationId: selectedConversation.value.id }
    });
  } catch (err) {
    console.error('Failed to accept order request:', err);
    alert('接受訂單失敗，請稍後再試');
  }
}

async function handleDeclineOrderRequest(orderRequest) {
  try {
    await declineOrderRequest(orderRequest.id);

    // Update message status
    const messageIndex = messages.value.findIndex(
      m => m.metadata?.id === orderRequest.id
    );
    if (messageIndex >= 0) {
      messages.value[messageIndex].metadata.status = 'declined';
    }

    currentTransactionState.value = 'negotiating';
    alert('已拒絕訂單請求');
  } catch (err) {
    console.error('Failed to decline order request:', err);
    alert('拒絕訂單失敗，請稍後再試');
  }
}

function handleViewOrderDetails(orderRequest) {
  router.push({
    name: 'TransactionDetails',
    query: { conversationId: selectedConversation.value.id }
  });
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
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
}

// Lifecycle
onMounted(() => {
  initialize();
});

onBeforeUnmount(() => {
  // Clean up subscriptions
  if (messageSubscription.value) {
    messageSubscription.value.unsubscribe();
  }
  if (conversationSubscription.value) {
    conversationSubscription.value.unsubscribe();
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.messages-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.messages-container {
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - 50px); // Subtract header height
}

.messages-layout {
  display: flex;
  height: 100%;
  background: white;
}

// Conversations Sidebar
.conversations-sidebar {
  width: 380px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background: white;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;

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
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;

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

      .user-name {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0;
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

// Input Area
.input-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e0e0e0;

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
  }

  .message-content {
    max-width: 85%;
  }
}
</style>
