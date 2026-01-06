import { onBeforeUnmount } from 'vue';
import { ScrollEvents, onScrollEvent, offScrollEvent, emitScrollEvent } from '@/events/messageScrollBus';

export function useScrollCoordinator({
  messagesArea,
  messageStore,
  selectedConversation,
  showScrollToBottomBtn,
  newMessageCount,
  isLoadingMoreMessages,
  hasMoreMessages,
  firstUnreadMessageId,
  hasReachedBottomAfterUnread,
  clearUnreadDivider,
  allowUnreadDivider,
  loadMoreMessages,
  scrollToBottom,
  unreadDividerClearThreshold
}) {
  async function handleMetrics(payload = {}) {
    const area = messagesArea.value;
    if (!area) return;

    const rawScrollTop = typeof payload.scrollTop === 'number' ? payload.scrollTop : area.scrollTop;
    const rawScrollHeight = typeof payload.scrollHeight === 'number' ? payload.scrollHeight : area.scrollHeight;
    const rawClientHeight = typeof payload.clientHeight === 'number' ? payload.clientHeight : area.clientHeight;

    const scrollTop = Number.isFinite(rawScrollTop) ? rawScrollTop : 0;
    const scrollHeight = Number.isFinite(rawScrollHeight) ? rawScrollHeight : 0;
    const clientHeight = Number.isFinite(rawClientHeight) ? rawClientHeight : 0;

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const distanceFromTop = scrollTop;

    showScrollToBottomBtn.value = distanceFromBottom > 200;

    const wasPreviouslyAtBottom = messageStore.isAtMessagesBottom;
    const atBottom = distanceFromBottom < 100;
    messageStore.setIsAtMessagesBottom(atBottom);

    if (
      !atBottom &&
      firstUnreadMessageId.value &&
      hasReachedBottomAfterUnread.value &&
      distanceFromBottom > unreadDividerClearThreshold
    ) {
      clearUnreadDivider({ suppress: true });
      console.log('[MessagesPage] 從底部向上滑動一段距離，清除未讀訊息分隔線');
    }

    if (atBottom) {
      newMessageCount.value = 0;

      if (firstUnreadMessageId.value) {
        hasReachedBottomAfterUnread.value = true;
        allowUnreadDivider();
      }

      if (!wasPreviouslyAtBottom && selectedConversation.value) {
        const hasUnreadMessages = messageStore.currentMessages.some(msg => !msg.is_mine && !msg.is_read);

        if (hasUnreadMessages) {
          const unreadMessageIds = [];

          messageStore.currentMessages.forEach(msg => {
            if (!msg.is_mine && !msg.is_read) {
              unreadMessageIds.push(msg.id);
              msg.is_read = true;
            }
          });

          allowUnreadDivider();

          try {
            const { markAsRead } = await import('@/api/conversationAPI');
            await markAsRead(selectedConversation.value.id);
            console.log('[MessagesPage] 滾動到底部，已標記為已讀');

            const conversation = messageStore.conversations.find(c => c.id === selectedConversation.value.id);
            if (conversation) {
              conversation.unread_count = 0;
            }
          } catch (err) {
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

  function handleMessagesAppended(payload = {}) {
    const { appendedMessages } = payload;
    if (!Array.isArray(appendedMessages) || appendedMessages.length === 0) {
      return;
    }

    const atBottom = messageStore.isAtMessagesBottom;

    if (atBottom) {
      scrollToBottom(false);
      showScrollToBottomBtn.value = false;
      newMessageCount.value = 0;
      messageStore.setIsAtMessagesBottom(true);
      allowUnreadDivider();
      if (firstUnreadMessageId.value) {
        hasReachedBottomAfterUnread.value = true;
      }
    } else {
      const incomingCount = appendedMessages.filter(msg => !msg.is_mine).length;

      if (incomingCount > 0) {
        newMessageCount.value += incomingCount;
        allowUnreadDivider();
        hasReachedBottomAfterUnread.value = false;
      }

      showScrollToBottomBtn.value = true;
      messageStore.setIsAtMessagesBottom(false);
    }
  }

  function handleConversationChanged() {
    clearUnreadDivider();
    newMessageCount.value = 0;
    showScrollToBottomBtn.value = false;
    messageStore.setIsAtMessagesBottom(true);
    allowUnreadDivider();
    hasReachedBottomAfterUnread.value = false;
  }

  function handleReset() {
    clearUnreadDivider({ suppress: true });
    newMessageCount.value = 0;
    showScrollToBottomBtn.value = false;
    messageStore.setIsAtMessagesBottom(true);
    allowUnreadDivider();
    hasReachedBottomAfterUnread.value = false;
  }

  const handlerMap = new Map([
    [ScrollEvents.Metrics, handleMetrics],
    [ScrollEvents.MessagesAppended, handleMessagesAppended],
    [ScrollEvents.ConversationChanged, handleConversationChanged],
    [ScrollEvents.Reset, handleReset]
  ]);

  handlerMap.forEach((handler, event) => onScrollEvent(event, handler));

  onBeforeUnmount(() => {
    handlerMap.forEach((handler, event) => offScrollEvent(event, handler));
  });

  function emitScrollMetrics(payload) {
    return emitScrollEvent(ScrollEvents.Metrics, payload);
  }

  function emitMessagesAppended(payload) {
    return emitScrollEvent(ScrollEvents.MessagesAppended, payload);
  }

  function emitConversationChanged(payload) {
    return emitScrollEvent(ScrollEvents.ConversationChanged, payload);
  }

  function emitReset(payload) {
    return emitScrollEvent(ScrollEvents.Reset, payload);
  }

  return {
    emitScrollMetrics,
    emitMessagesAppended,
    emitConversationChanged,
    emitReset
  };
}
