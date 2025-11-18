import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMessageStore } from '@/stores/message';
import { useAuthStore } from '@/stores/auth';
import { useTransactionStore } from '@/stores/transaction';
import { formatRelativeTime } from '@/utils/timeFormat';
import { getConversationItems, archiveConversation } from '@/api/conversationAPI_v2';
import { useTypingCoordinator } from '@/composables/useTypingCoordinator';
import { useScrollCoordinator } from '@/composables/useScrollCoordinator';

const UNREAD_DIVIDER_CLEAR_THRESHOLD = 200;
const TYPING_BROADCAST_INTERVAL = 1200;
const TYPING_STOP_DELAY = 3500;

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

function formatDateDivider(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const daysDiff = Math.floor((todayOnly - dateOnly) / (24 * 60 * 60 * 1000));

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '上午' : '下午';
  const displayHours = hours % 12 || 12;
  const timeStr = `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;

  if (daysDiff === 0) {
    return '今天';
  }

  if (daysDiff > 0 && daysDiff < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${weekday} ${timeStr}`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日 ${timeStr}`;
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

export function useMessagePage() {
  const router = useRouter();
  const messageStore = useMessageStore();
  const authStore = useAuthStore();
  const transactionStore = useTransactionStore();

  const userPoints = ref(500);
  const searchQuery = ref('');
  const activeFilter = ref('all');
  const messageInput = ref('');
  const messagesArea = ref(null);
  let registeredMessagesArea = null;
  const showMoreMenu = ref(false);
  const messagesLoading = ref(false);
  const pendingItemReference = ref(null);
  const itemReferenceCache = ref(new Map());
  const showScrollToBottomBtn = ref(false);
  const isLoadingMoreMessages = ref(false);
  const currentPage = ref(1);
  const hasMoreMessages = ref(true);
  const newMessageCount = ref(0);
  const firstUnreadMessageId = ref(null);
  const suppressUnreadDivider = ref(false);
  const hasReachedBottomAfterUnread = ref(false);

  // Transaction Modal
  const showTransactionModal = ref(false);
  const isLoadingTransactionItems = ref(false);

  let suppressTypingBroadcast = false;

  const conversationItems = ref([]);
  const isLoadingConversationItems = ref(false);
  let conversationItemsRequestId = 0;

  const conversationItemMap = computed(() => {
    const map = new Map();
    conversationItems.value.forEach(item => {
      if (!item || item.id === undefined || item.id === null) return;
      map.set(item.id, item);
    });
    return map;
  });

  const currencyFormatter = new Intl.NumberFormat('zh-TW', {
    currency: 'TWD',
    maximumFractionDigits: 0
  });

  const pendingItemPrice = computed(() => formatItemPrice(pendingItemReference.value?.price));

  function formatItemPrice(value) {
    if (value === undefined || value === null || value === '') return null;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return null;
    return currencyFormatter.format(numeric);
  }

  function clearUnreadDivider({ suppress = false } = {}) {
    firstUnreadMessageId.value = null;
    suppressUnreadDivider.value = suppress;
    hasReachedBottomAfterUnread.value = false;
  }

  function allowUnreadDivider() {
    suppressUnreadDivider.value = false;
  }

  async function waitForTicks(count = 1) {
    for (let i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await nextTick();
    }
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

  const filters = computed(() => {
    const all = messageStore.conversations;
    return [
      { id: 'all', label: '全部', count: all.length },
      { id: 'archived', label: '封存', count: all.filter(c => c.is_archived).length }
    ];
  });

  const filteredConversations = computed(() => {
    let filtered = messageStore.conversations;

    if (activeFilter.value === 'archived') {
      filtered = filtered.filter(c => c.is_archived);
    } else if (activeFilter.value === 'all') {
      filtered = filtered.filter(c => !c.is_archived);
    }

    if (searchQuery.value) {
      filtered = filtered.filter(c =>
        c.other_user.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    }

    return filtered;
  });

  const displayConversations = computed(() => {
    return filteredConversations.value
      .map(convo => {
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
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

        const timeA = new Date(a._raw.last_message_time || 0).getTime();
        const timeB = new Date(b._raw.last_message_time || 0).getTime();
        return timeB - timeA;
      });
  });

  const selectedConversation = computed(() => {
    if (!messageStore.selectedConversationId) return null;
    return displayConversations.value.find(c => c.id === messageStore.selectedConversationId) || null;
  });

  const typingCoordinator = useTypingCoordinator({
    messageStore,
    getIdentity: () => currentUserIdentity.value,
    getSelectedConversationId: () => selectedConversation.value?.id ?? null,
    typingStopDelay: TYPING_STOP_DELAY,
    typingBroadcastInterval: TYPING_BROADCAST_INTERVAL
  });

  const scrollCoordinator = useScrollCoordinator({
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
    unreadDividerClearThreshold: UNREAD_DIVIDER_CLEAR_THRESHOLD
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
        await scrollCoordinator.emitReset({ conversationId: oldId || null });
      }

      if (newId === oldId) {
        return;
      }

      if (!newId) {
        pendingItemReference.value = null;
        suppressTypingBroadcast = true;
        messageInput.value = '';
        await nextTick();
        suppressTypingBroadcast = false;

        await typingCoordinator.emitConversationChanged({
          prevConversationId: oldId || null,
          nextConversationId: null,
          identity: currentUserIdentity.value || null
        });
        await scrollCoordinator.emitConversationChanged({ conversationId: null });
        return;
      } else {
        pendingItemReference.value = messageStore.getPendingItemReference(newId);
        suppressTypingBroadcast = true;
        messageInput.value = messageStore.getMessageDraft(newId);
        await nextTick();
        suppressTypingBroadcast = false;
      }

      await typingCoordinator.emitConversationChanged({
        prevConversationId: oldId || null,
        nextConversationId: newId || null,
        identity: currentUserIdentity.value || null
      });
      await scrollCoordinator.emitConversationChanged({ conversationId: newId || null });
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
      void typingCoordinator.emitInputChanged({
        conversationId,
        content: newValue
      });
    }
  );

  const messages = computed(() => {
    const itemMap = conversationItemMap.value;
    return messageStore.currentMessages.map((msg, index) => {
      const msgDateObj = new Date(msg.created_at);
      const msgDateOnly = new Date(msgDateObj.getFullYear(), msgDateObj.getMonth(), msgDateObj.getDate());

      const prevMsg = index > 0 ? messageStore.currentMessages[index - 1] : null;
      let showDate = false;

      if (prevMsg) {
        const prevDateObj = new Date(prevMsg.created_at);
        const prevDateOnly = new Date(prevDateObj.getFullYear(), prevDateObj.getMonth(), prevDateObj.getDate());
        showDate = msgDateOnly.getTime() !== prevDateOnly.getTime();
      } else {
        showDate = true;
      }

      let isGrouped = false;
      let isFirstInGroup = false;
      let isLastInGroup = false;
      let hasGroupWithPrev = false;
      let hasGroupWithNext = false;

      if (prevMsg) {
        const timeDiff = new Date(msg.created_at) - new Date(prevMsg.created_at);
        const isSameSender = msg.is_mine === prevMsg.is_mine;
        const isWithinMinute = timeDiff < 60000;

        hasGroupWithPrev = isSameSender && isWithinMinute && !showDate;
      }

      const nextMsg = index < messageStore.currentMessages.length - 1
        ? messageStore.currentMessages[index + 1]
        : null;

      if (nextMsg) {
        const nextTimeDiff = new Date(nextMsg.created_at) - new Date(msg.created_at);
        const isSameSenderAsNext = msg.is_mine === nextMsg.is_mine;
        const isWithinMinuteFromNext = nextTimeDiff < 60000;

        const nextMsgDateObj = new Date(nextMsg.created_at);
        const nextMsgDateOnly = new Date(nextMsgDateObj.getFullYear(), nextMsgDateObj.getMonth(), nextMsgDateObj.getDate());
        const hasDateDividerAfter = msgDateOnly.getTime() !== nextMsgDateOnly.getTime();

        hasGroupWithNext = isSameSenderAsNext && isWithinMinuteFromNext && !hasDateDividerAfter;
      }

      isGrouped = hasGroupWithPrev;
      isFirstInGroup = !hasGroupWithPrev;
      isLastInGroup = !hasGroupWithNext;

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
        _clientId: msg._clientId || msg.id,
        _sending: msg._sending,
        _failed: msg._failed,
        _failedContent: msg._failedContent,
        _failedRelatedItemId: msg._failedRelatedItemId,
        _failedRelatedItemTitle: msg._failedRelatedItemTitle,
        is_read: msg.is_read || false,
        isGrouped,
        isFirstInGroup,
        isLastInGroup
      };
    }).map((msg, index, arr) => {
      const isLatestSentMessage = msg.isSent && !msg._sending && !msg._failed &&
        !arr.slice(index + 1).some(m => m.isSent && !m._sending && !m._failed);

      let isFirstUnreadMessage = false;

      if (!suppressUnreadDivider.value) {
        if (firstUnreadMessageId.value) {
          isFirstUnreadMessage = msg.id === firstUnreadMessageId.value;
        } else if (!msg.isSent && !msg.is_read) {
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

  const groupedMessages = computed(() => {
    const groups = [];
    let currentGroup = null;

    messages.value.forEach((message) => {
      if (message.showDate) {
        currentGroup = {
          date: message.date,
          dateKey: new Date(message.created_at).toLocaleDateString('zh-TW'),
          messages: [message]
        };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  });

  async function selectConversation(conversation) {
    const previousConversationId = selectedConversation.value?.id || messageStore.selectedConversationId || null;
    if (previousConversationId && previousConversationId !== conversation.id) {
      messageStore.setPendingItemReference(previousConversationId, pendingItemReference.value);
      messageStore.setMessageDraft(previousConversationId, messageInput.value);
    }

    if (messageStore.selectedConversationId !== conversation.id) {
      messageStore.selectedConversationId = conversation.id;
    }

    // 檢查快取，如果有快取則不顯示載入中狀態
    const cached = messageStore.getCachedMessages(conversation.id);
    if (!cached) {
      messagesLoading.value = true;
    }

    currentPage.value = 1;
    hasMoreMessages.value = true;
    isLoadingMoreMessages.value = false;
    newMessageCount.value = 0;
    clearUnreadDivider();

    conversationItems.value = [];
    itemReferenceCache.value = new Map();

    try {
      await messageStore.loadMessages(conversation.id);

      applyItemMetadataToMessages();

      // 從快取中取得 hasMore 資訊
      const updatedCache = messageStore.getCachedMessages(conversation.id);
      if (updatedCache) {
        hasMoreMessages.value = updatedCache.hasMore;
        currentPage.value = Math.max(...Array.from(updatedCache.loadedPages));
      } else if (messageStore.currentMessages.length < 50) {
        hasMoreMessages.value = false;
      }

      messagesLoading.value = false;

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
      showMoreMenu.value = false;

      await archiveConversation(conversationId, !isCurrentlyArchived);

      const conversation = messageStore.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.is_archived = !isCurrentlyArchived;
      }

      if (!isCurrentlyArchived && activeFilter.value === 'all') {
        deselectConversation();
      }
    } catch (error) {
      console.error('Failed to archive/unarchive conversation:', error);
      alert('操作失敗，請稍後再試');
    }
  }

  function handleClickOutside(event) {
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
    messageStore.clearSelectedConversation();
    void scrollCoordinator.emitReset({ conversationId: conversationId || null });
  }

  async function sendMessage() {
    if (!messageInput.value.trim() || !selectedConversation.value) return;

    const content = messageInput.value.trim();
    const relatedItemId = pendingItemReference.value ? pendingItemReference.value.id : null;
    const relatedItemTitle = pendingItemReference.value ? pendingItemReference.value.title : null;

    messageInput.value = '';
    if (selectedConversation.value?.id) {
      void typingCoordinator.emitSendMessage({ conversationId: selectedConversation.value.id });
    }

    clearUnreadDivider({ suppress: true });

    const tempMessageId = `temp-${Date.now()}`;

    const optimisticMessage = {
      id: tempMessageId,
      content: content,
      created_at: new Date().toISOString(),
      is_mine: true,
      is_read: false,
      message_type: 'text',
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

    messageStore.currentMessages.push(optimisticMessage);

    await waitForTicks(2);
    scrollToBottom(false);

    const shouldClearItemReference = !!pendingItemReference.value;
    if (shouldClearItemReference) {
      const activeConversationId = selectedConversation.value?.id || null;
      pendingItemReference.value = null;
      if (activeConversationId) {
        messageStore.clearPendingItemReference(activeConversationId);
      }

      const currentQuery = { ...router.currentRoute.value.query };
      if (currentQuery.itemId || currentQuery.itemTitle) {
        delete currentQuery.itemId;
        delete currentQuery.itemTitle;
        router.replace({ query: currentQuery });
      }
    }

    try {
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
      console.error('Failed to send message:', err);

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
  }

  function handleAttachment() {
    console.log('Handle attachment');
    alert('檔案附件功能尚未實作');
  }

  async function handleOpenTransactionModal() {
    if (!selectedConversation.value) {
      alert('請先選擇一個對話');
      return;
    }

    showTransactionModal.value = true;

    // 載入聊天室商品列表（每次都重新載入以確保數據最新）
    isLoadingTransactionItems.value = true;
    try {
      await loadConversationItems(selectedConversation.value.id);

      // 需要為每個商品補充擁有者信息
      // 因為 getConversationItems 返回的 added_by_user_id 是提及者，不是商品擁有者
      // 我們需要調用額外的 API 來獲取商品詳情
      await enrichItemsWithOwnerInfo();
    } catch (error) {
      console.error('Failed to load conversation items for transaction:', error);
    } finally {
      isLoadingTransactionItems.value = false;
    }
  }

  async function enrichItemsWithOwnerInfo() {
    // 為聊天室中的商品補充擁有者信息和交易狀態
    const { getItemById } = await import('@/api/get_itemByIdAPI');
    try {
      await transactionStore.fetchAllTransactions();
    } catch (error) {
      console.error('Failed to refresh transaction cache for conversation items:', error);
    }

    const itemTransactionMap = transactionStore.itemToTransactionMap?.value ?? new Map();

    const enrichedItems = await Promise.all(
      conversationItems.value.map(async (item) => {
        try {
          const itemDetail = await getItemById(item.id);
          const transactionInfo = itemTransactionMap.get(item.id);

          return {
            ...item,
            ownerId: itemDetail?.user_id || null,
            inTransaction: transactionInfo ? transactionInfo.status !== 'sold' : false,
            transactionStatus: transactionInfo?.status || null,
            transactionRole: transactionInfo?.role || null,
            transactionId: transactionInfo?.transactionId || null
          };
        } catch (error) {
          console.error(`Failed to fetch owner info for item ${item.id}:`, error);
          return item;
        }
      })
    );

    conversationItems.value = enrichedItems;
  }

  async function handleTransactionConfirm(payload) {
    const { item, note } = payload;

    console.log('Transaction confirmed for item:', item);
    console.log('Seller note:', note);

    if (!selectedConversation.value) {
      alert('對話資訊錯誤');
      return;
    }

    try {
      // 獲取對方用戶 ID（買家）
      const receiverId = selectedConversation.value._raw.other_user.id;

      // 調用發起交易 API
      const transactionApi = await import('@/api/transaction_before_meetAPI');
      const result = await transactionApi.initiateTransaction(item.id, receiverId);

      console.log('Transaction initiated:', result);

      // 如果有備註，更新備註
      if (note) {
        await transactionApi.updateGiverNote(result.transaction_id, note);
      }

      // 立即刷新交易資料，避免等待 realtime 才更新
      transactionStore.fetchAllTransactions(true).catch(err => {
        console.error('Failed to refresh transactions after initiation:', err);
      });

      // 關閉交易視窗
      showTransactionModal.value = false;

      // 自動發送訊息給買家
      const autoMessage = '我已發起交易，再麻煩您確認這筆交易';
      messageInput.value = autoMessage;

      // 立即發送訊息
      await sendMessage();

      // TODO: 可以導航到交易詳情頁面
      // router.push({
      //   name: 'TransactionDetail',
      //   params: { id: result.transaction_id }
      // });

    } catch (error) {
      console.error('Failed to initiate transaction:', error);
      alert(`發起交易失敗：${error.message}`);
    }
  }

  function openItemPage(itemId) {
    const itemUrl = router.resolve({ name: 'ItemDetail', params: { id: itemId } }).href;
    window.open(itemUrl, '_blank');
  }

  function removePendingItemReference() {
    pendingItemReference.value = null;

    if (selectedConversation.value?.id) {
      messageStore.clearPendingItemReference(selectedConversation.value.id);
    }

    const currentQuery = { ...router.currentRoute.value.query };
    if (currentQuery.itemId || currentQuery.itemTitle) {
      delete currentQuery.itemId;
      delete currentQuery.itemTitle;
      router.replace({ query: currentQuery });
    }
  }

  async function retryMessage(failedMessage) {
    if (!failedMessage._failed) return;

    const content = failedMessage._failedContent || failedMessage.content;
    const relatedItemId = failedMessage._failedRelatedItemId || failedMessage.related_item_id;
    const relatedItemTitle = failedMessage._failedRelatedItemTitle || failedMessage.related_item_title;

    failedMessage._sending = true;
    failedMessage._failed = false;

    try {
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

      const index = messageStore.currentMessages.findIndex(m => m._clientId === failedMessage._clientId);
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

      failedMessage._sending = false;
      failedMessage._failed = true;
    }
  }

  async function handleMessagesScroll(event) {
    const target = event?.target instanceof HTMLElement
      ? event.target
      : messagesArea.value;

    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight } = target;

    void scrollCoordinator.emitScrollMetrics({
      scrollTop,
      scrollHeight,
      clientHeight
    });
  }

  function registerMessagesArea(element) {
    if (registeredMessagesArea === element) {
      messagesArea.value = element;
      return;
    }

    if (registeredMessagesArea) {
      registeredMessagesArea.removeEventListener('scroll', handleMessagesScroll);
    }

    registeredMessagesArea = element || null;
    messagesArea.value = registeredMessagesArea;

    if (registeredMessagesArea) {
      registeredMessagesArea.addEventListener('scroll', handleMessagesScroll, { passive: true });

      void scrollCoordinator.emitScrollMetrics({
        scrollTop: registeredMessagesArea.scrollTop,
        scrollHeight: registeredMessagesArea.scrollHeight,
        clientHeight: registeredMessagesArea.clientHeight
      });
    }
  }

  function scrollToBottom(arg) {
    const defaultOptions = { smooth: false, preferUnread: true };
    let options = { ...defaultOptions };

    if (typeof arg === 'boolean') {
      options.smooth = arg;
    } else if (arg && typeof arg === 'object') {
      const isEvent = typeof arg.preventDefault === 'function';
      if (isEvent) {
        arg.preventDefault();
        arg.stopPropagation?.();
      } else {
        options = { ...options, ...arg };
      }
    }

    newMessageCount.value = 0;

    nextTick(() => {
      const container = messagesArea.value;
      if (!container) return;

      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints;
      const behavior = options.smooth && !isMobile ? 'smooth' : 'auto';

      if (options.preferUnread && firstUnreadMessageId.value) {
        const selector = `[data-message-id="${String(firstUnreadMessageId.value)}"]`;
        const target = container.querySelector(selector);

        if (target) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const offset = targetRect.top - containerRect.top + container.scrollTop - 48;
          const top = Math.max(0, offset);

          container.scrollTo({ top, behavior });
          return;
        }
      }

      const scrollTop = container.scrollHeight;

      if (isMobile) {
        container.scrollTop = scrollTop;

        setTimeout(() => {
          if (messagesArea.value) {
            messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
          }
        }, 50);

        if (window.matchMedia('(max-width: 575.98px)').matches) {
          setTimeout(() => {
            if (messagesArea.value) {
              messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
            }
          }, 150);
        }
      } else {
        container.scrollTo({ top: scrollTop, behavior });
      }

      if (firstUnreadMessageId.value) {
        hasReachedBottomAfterUnread.value = true;
      }
    });
  }

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

  async function initialize() {
    const conversationId = router.currentRoute.value.query.conversationId;
    const itemId = router.currentRoute.value.query.itemId;
    const itemTitle = router.currentRoute.value.query.itemTitle;

    if (conversationId) {
      messagesLoading.value = true;

      try {
        if (messageStore.conversations.length === 0) {
          await messageStore.loadConversations();
        }

        const conversation = displayConversations.value.find(
          c => c.id === parseInt(conversationId, 10)
        );
        if (conversation) {
          await selectConversation(conversation);

          if (itemId && itemTitle) {
            pendingItemReference.value = {
              id: itemId,
              title: itemTitle
            };
            const cacheKey = toItemKey(itemId);
            if (cacheKey !== null) {
              const nextCache = new Map(itemReferenceCache.value);
              nextCache.set(cacheKey, itemTitle);
              itemReferenceCache.value = nextCache;
            }
            messageInput.value = '我想詢問';
          }
        } else {
          messagesLoading.value = false;
        }
      } catch (err) {
        console.error('Failed to initialize conversation:', err);
        messagesLoading.value = false;
      }
    }
  }

  function handleMobileKeyboard() {
    const isMobile = window.matchMedia('(max-width: 575.98px)').matches;

    if (isMobile) {
      const originalHeight = window.innerHeight;

      window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        const isKeyboardOpen = currentHeight < (originalHeight - 100);

        if (isKeyboardOpen) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      });
    }
  }

  onMounted(async () => {
    messageStore.setIsInMessagesPage(true);
    messageStore.setIsAtMessagesBottom(true);

    await initialize();
    handleMobileKeyboard();

    await waitForTicks(2);

    document.addEventListener('click', handleClickOutside);

    watch(
      () => messageStore.currentMessages.length,
      async (newLen, oldLen) => {
        if (newLen <= oldLen) return;

        if (messagesLoading.value || isLoadingMoreMessages.value) return;

        await waitForTicks(2);

        if (!messagesArea.value) return;

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

          void scrollCoordinator.emitMessagesAppended({ appendedMessages });
        }
      }
    );
  });

  onBeforeUnmount(() => {
    const conversationId = selectedConversation.value?.id;
    if (conversationId) {
      messageStore.setPendingItemReference(conversationId, pendingItemReference.value);
      messageStore.setMessageDraft(conversationId, messageInput.value);
    }
    void typingCoordinator.emitReset({ conversationId: conversationId || null });
    void scrollCoordinator.emitReset({ conversationId: conversationId || null });

    messageStore.setIsInMessagesPage(false);
    messageStore.setIsAtMessagesBottom(true);

    registerMessagesArea(null);

    document.removeEventListener('click', handleClickOutside);
  });

  return {
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
    typingIndicatorText,
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
  };
}
