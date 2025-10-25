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
                v-for="conversation in filteredConversations"
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

              <!-- Empty State -->
              <div v-if="filteredConversations.length === 0" class="empty-state">
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
              <div v-if="selectedConversation.product" class="product-context">
                <img
                  :src="selectedConversation.product.image"
                  :alt="selectedConversation.product.name"
                  class="product-image"
                />
                <div class="product-info">
                  <h4 class="product-name">{{ selectedConversation.product.name }}</h4>
                  <p class="product-price">NT$ {{ selectedConversation.product.price }}</p>
                </div>
                <button class="view-product-btn" @click="goToProduct(selectedConversation.product.id)">
                  查看
                </button>
              </div>

              <!-- Messages Area -->
              <div ref="messagesArea" class="messages-area">
                <div v-for="message in messages" :key="message.id" class="message-wrapper">
                  <!-- Date Divider -->
                  <div v-if="message.showDate" class="date-divider">
                    <span>{{ message.date }}</span>
                  </div>

                  <!-- Message -->
                  <div :class="['message', { 'message-sent': message.isSent, 'message-received': !message.isSent }]">
                    <div class="message-content">
                      <p class="message-text">{{ message.text }}</p>
                      <span class="message-time">{{ message.time }}</span>
                    </div>
                  </div>
                </div>
              </div>

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
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const router = useRouter();

// State
const userPoints = ref(500);
const searchQuery = ref('');
const activeFilter = ref('all');
const selectedConversation = ref(null);
const messageInput = ref('');
const messagesArea = ref(null);
const showFilterMenu = ref(false);

const filters = [
  { id: 'all', label: '全部', count: 5 },
  { id: 'unread', label: '未讀', count: 2 },
  { id: 'buying', label: '購買中', count: 2 },
  { id: 'selling', label: '出售中', count: 3 }
];

// Mock conversations
const conversations = ref([
  {
    id: 1,
    user: {
      name: '王小明',
      avatar: 'https://placehold.co/48/6fb8a5/ffffff?text=WM',
      online: true
    },
    product: {
      id: 1,
      name: 'iPhone 13 Pro',
      price: 25000,
      image: 'https://placehold.co/60x60/6fb8a5/ffffff?text=Phone'
    },
    lastMessage: {
      text: '你好，請問這個還在嗎？',
      time: '10:30'
    },
    unreadCount: 2,
    type: 'buying'
  },
  {
    id: 2,
    user: {
      name: '李美麗',
      avatar: 'https://placehold.co/48/5a9d8c/ffffff?text=LM',
      online: false
    },
    product: {
      id: 2,
      name: '二手沙發',
      price: 5000,
      image: 'https://placehold.co/60x60/5a9d8c/ffffff?text=Sofa'
    },
    lastMessage: {
      text: '好的，謝謝！',
      time: '昨天'
    },
    unreadCount: 0,
    type: 'selling'
  },
  {
    id: 3,
    user: {
      name: '陳大明',
      avatar: 'https://placehold.co/48/4a8b7d/ffffff?text=CD',
      online: true
    },
    product: null,
    lastMessage: {
      text: '下午3點可以面交嗎？',
      time: '2天前'
    },
    unreadCount: 0,
    type: 'buying'
  }
]);

const messages = ref([]);

// Computed
const filteredConversations = computed(() => {
  let filtered = conversations.value;

  // Filter by type
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'unread') {
      filtered = filtered.filter(c => c.unreadCount > 0);
    } else {
      filtered = filtered.filter(c => c.type === activeFilter.value);
    }
  }

  // Filter by search
  if (searchQuery.value) {
    filtered = filtered.filter(c =>
      c.user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
});

// Methods
const selectConversation = (conversation) => {
  selectedConversation.value = conversation;

  // Mark as read
  conversation.unreadCount = 0;

  // Load messages (mock data)
  messages.value = [
    {
      id: 1,
      text: '你好！',
      time: '10:25',
      isSent: false,
      showDate: true,
      date: '今天'
    },
    {
      id: 2,
      text: '嗨！有什麼可以幫忙的嗎？',
      time: '10:26',
      isSent: true,
      showDate: false
    },
    {
      id: 3,
      text: '請問這個還在嗎？',
      time: '10:30',
      isSent: false,
      showDate: false
    }
  ];

  // Scroll to bottom
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
    }
  });
};

const deselectConversation = () => {
  selectedConversation.value = null;
};

const sendMessage = () => {
  if (!messageInput.value.trim()) return;

  const newMessage = {
    id: messages.value.length + 1,
    text: messageInput.value,
    time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    isSent: true,
    showDate: false
  };

  messages.value.push(newMessage);
  messageInput.value = '';

  // Update conversation last message
  if (selectedConversation.value) {
    selectedConversation.value.lastMessage = {
      text: newMessage.text,
      time: newMessage.time
    };
  }

  // Scroll to bottom
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
    }
  });
};

const handleAttachment = () => {
  console.log('Handle attachment');
  // Implement file attachment logic
};

const goToProduct = (productId) => {
  router.push({ name: 'ItemDetail', params: { id: productId } });
};
</script>

<style scoped lang="scss">
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
    border-color: #6fb8a5;
    color: #6fb8a5;
  }

  &.active {
    background: #6fb8a5;
    border-color: #6fb8a5;
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
    border-left: 3px solid #6fb8a5;
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
    background: #6fb8a5;
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
        color: #6fb8a5;
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

// Product Context
.product-context {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;

  .product-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
  }

  .product-info {
    flex: 1;
    min-width: 0;

    .product-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-price {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #6fb8a5;
      margin: 0;
    }
  }

  .view-product-btn {
    padding: 8px 16px;
    background: white;
    border: 1px solid #6fb8a5;
    border-radius: 6px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #6fb8a5;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #6fb8a5;
      color: white;
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
      background: #6fb8a5;
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
        color: #6fb8a5;
      }

      &:hover {
        background: #6fb8a5;

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
      border-color: #6fb8a5;
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
