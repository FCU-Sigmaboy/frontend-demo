<template>
  <div
    ref="localMessagesArea"
    class="messages-area"
    @scroll="handleScroll"
  >
    <div v-if="messagesLoading" class="skeleton-messages">
      <div
        v-for="i in 6"
        :key="`skeleton-${i}`"
        :class="['skeleton-message-wrapper', i % 2 === 0 ? 'sent' : 'received']"
      >
        <div class="skeleton-message">
          <div class="skeleton-text-line"></div>
          <div class="skeleton-text-line short"></div>
          <div class="skeleton-time"></div>
        </div>
      </div>
    </div>

    <div v-else class="messages-list">
      <div v-if="isLoadingMoreMessages" class="loading-more-indicator">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <span>載入更多訊息...</span>
      </div>

      <div v-for="group in groupedMessages" :key="group.dateKey" class="date-group">
        <div class="date-divider">
          <span>{{ group.date }}</span>
        </div>

        <div class="date-group-messages">
          <div
            v-for="message in group.messages"
            :key="message._clientId"
            class="message-wrapper"
            :data-message-id="message.id"
          >
            <div v-if="message.isFirstUnreadMessage" class="unread-divider">
              <span class="unread-divider-text">未讀訊息</span>
            </div>

            <div
              :class="[
                'message',
                {
                  'message-sent': message.isSent,
                  'message-received': !message.isSent,
                  'message-grouped': message.isGrouped,
                  'message-first-in-group': message.isFirstInGroup,
                  'message-last-in-group': message.isLastInGroup
                }
              ]"
            >
              <div class="message-bubble-wrapper">
                <div class="message-content">
                  <div
                    v-if="message.related_item_id"
                    class="item-reference"
                    @click.stop="handleOpenItem(message.related_item_id)"
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
                          {{ message.relatedItemPrice }} 點
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

                  <span v-if="message.isLastInGroup" class="message-time">{{ message.time }}</span>
                </div>

                <div v-if="message.isSent" class="message-status">
                  <span v-if="message._sending" class="status-sending">
                    <span class="status-dot"></span>
                    傳送中...
                  </span>

                  <span v-else-if="message._failed" class="status-failed">
                    <i class="bi bi-exclamation-circle"></i>
                    傳送失敗
                    <button class="retry-btn" @click="handleRetry(message)">
                      <i class="bi bi-arrow-clockwise"></i>
                      重新發送
                    </button>
                  </span>

                  <Transition v-else-if="message.is_read && message.isLatestSentMessage" name="status-fade">
                    <span class="status-read">
                      <i class="bi bi-check-all"></i>
                      已讀
                    </span>
                  </Transition>

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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  registerMessagesArea: {
    type: Function,
    default: null
  },
  messagesLoading: {
    type: Boolean,
    default: false
  },
  groupedMessages: {
    type: Array,
    default: () => []
  },
  isLoadingMoreMessages: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['scroll', 'open-item', 'retry']);

const localMessagesArea = ref(null);

const handleScroll = event => {
  emit('scroll', event);
};

const handleOpenItem = itemId => {
  emit('open-item', itemId);
};

const handleRetry = message => {
  emit('retry', message);
};

onMounted(() => {
  if (props.registerMessagesArea) {
    props.registerMessagesArea(localMessagesArea.value);
  }
});

onBeforeUnmount(() => {
  if (props.registerMessagesArea) {
    props.registerMessagesArea(null);
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.messages-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f9f9f9;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  min-height: 0;
  position: relative;
}

.messages-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-shrink: 0;
  min-height: min-content;
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

  &:has(.message-grouped:not(.message-last-in-group)) {
    margin-bottom: 2px;
  }

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

  &.message-grouped {
    margin-bottom: 1px;
  }

  &.message-first-in-group:not(.message-last-in-group) {
    margin-bottom: 1px;
  }

  &.message-last-in-group {
    margin-bottom: 8px;
  }

  &.message-sent {
    justify-content: flex-end;

    .message-content {
      background: $primary;
      color: white;
      border-radius: 16px 16px 16px 16px;
      transform-origin: bottom right;

      .message-time {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    &.message-first-in-group:not(.message-last-in-group) {
      .message-content {
        border-radius: 16px 16px 4px 16px;
      }
    }

    &.message-grouped:not(.message-first-in-group):not(.message-last-in-group) {
      .message-content {
        border-radius: 16px 4px 4px 16px;
      }
    }

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
      border-radius: 16px 16px 16px 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transform-origin: bottom left;

      .message-time {
        color: #999;
      }
    }

    &.message-first-in-group:not(.message-last-in-group) {
      .message-content {
        border-radius: 16px 16px 16px 4px;
      }
    }

    &.message-grouped:not(.message-first-in-group):not(.message-last-in-group) {
      .message-content {
        border-radius: 4px 16px 16px 4px;
      }
    }

    &.message-last-in-group:not(.message-first-in-group) {
      .message-content {
        border-radius: 4px 16px 16px 16px;
      }
    }
  }
}

.message-content {
  width: 100%;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;

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

  .message-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    word-wrap: break-word;
  }

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

  .message-time {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    align-self: flex-end;
  }
}

.message-bubble-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  max-width: 70%;
}

.message-received .message-bubble-wrapper {
  align-items: flex-start;
}

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

.skeleton-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 12px;
}

.skeleton-message-wrapper {
  display: flex;

  &.sent {
    justify-content: flex-end;
  }

  &.received {
    justify-content: flex-start;
  }
}

.skeleton-message {
  width: 60%;
  max-width: 340px;
  background: white;
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.skeleton-text-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;

  &.short {
    width: 60%;
    align-self: flex-end;
  }
}

.skeleton-time {
  width: 40px;
  height: 10px;
  border-radius: 4px;
  align-self: flex-end;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 575.98px) {
  .messages-area {
    padding: 16px;
    padding-bottom: 64px; // 為固定在底部的 input-area-wrapper 預留空間
    overflow-y: scroll;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    touch-action: pan-y;
    min-height: 0;
    position: relative;
  }

  .message-bubble-wrapper {
    max-width: 85%;
  }
}
</style>
