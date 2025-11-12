<template>
  <aside :class="['conversations-sidebar', { 'mobile-hidden': mobileHidden }]">
    <div class="sidebar-header">
      <h2 class="sidebar-title">訊息</h2>
    </div>

    <div class="search-bar">
      <i class="bi bi-search"></i>
      <input
        v-model="searchModel"
        type="text"
        placeholder="搜尋對話..."
        class="search-input"
      />
    </div>

    <div class="filter-tabs">
      <button
        v-for="filter in filters"
        :key="filter.id"
        :class="['filter-tab', { active: activeFilter === filter.id }]"
        @click="selectFilter(filter.id)"
      >
        {{ filter.label }}
        <span v-if="filter.count" class="filter-count">{{ filter.count }}</span>
      </button>
    </div>

    <div class="conversations-list">
      <TransitionGroup name="conversation-list" tag="div">
        <div
          v-for="conversation in conversations"
          :key="conversation.id"
          :class="['conversation-item', { active: selectedId === conversation.id }]"
          @click="handleSelect(conversation)"
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

      <div v-if="loading" class="empty-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <p>載入對話中...</p>
      </div>

      <div v-else-if="!loading && conversations.length === 0" class="empty-state">
        <i class="bi bi-chat-left-text"></i>
        <p>尚無對話</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  conversations: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: [Number, String],
    default: null
  },
  filters: {
    type: Array,
    default: () => []
  },
  activeFilter: {
    type: String,
    default: 'all'
  },
  searchQuery: {
    type: String,
    default: ''
  },
  mobileHidden: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'update:searchQuery', 'update:activeFilter']);

const searchModel = computed({
  get: () => props.searchQuery,
  set: value => emit('update:searchQuery', value)
});

function selectFilter(filterId) {
  if (filterId === props.activeFilter) return;
  emit('update:activeFilter', filterId);
}

function handleSelect(conversation) {
  emit('select', conversation);
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.conversations-sidebar {
  width: 380px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background: white;
  flex: 0 0 auto;
  min-width: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  height: 70px;

  .sidebar-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }
}

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

.conversations-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
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

@media (max-width: 991.98px) {
  .conversations-sidebar {
    width: 320px;

    &.mobile-hidden {
      display: none;
    }
  }
}

@media (max-width: 575.98px) {
  .conversations-sidebar {
    width: 100%;
    border-right: none;

    &.mobile-hidden {
      display: none;
    }
  }
}
</style>
