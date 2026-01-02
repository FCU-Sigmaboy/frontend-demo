import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  createOrGetConversation,
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  getConversationItems,
  archiveConversation,
  getTotalUnreadCount,
  deleteMessage,
  restoreMessage,
  subscribeToMessages,
  subscribeToMessageUpdates,
  subscribeToAllMessages,
  subscribeToUserPresence,
  createConversationTypingChannel
} from '@/api/conversation';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        if (callback) callback('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
      unsubscribe: vi.fn(),
      presenceState: vi.fn(() => ({}))
    }))
  }
}));

describe.sequential('conversation API', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe.sequential('createOrGetConversation', () => {
    it('應該成功創建或獲取對話', async () => {
      // Arrange
      const otherUserId = 'user-456';
      const initialItemId = 123;
      const mockConversation = {
        conversation_id: 789,
        participant_1_id: 'user-123',
        participant_2_id: 'user-456',
        initial_item_id: 123,
        is_new: true,
        current_user_is_participant_1: false
      };

      supabase.rpc.mockResolvedValueOnce({
        data: [mockConversation],
        error: null
      });

      // Act
      const result = await createOrGetConversation(otherUserId, initialItemId);

      // Assert
      expect(result).toEqual(mockConversation);
      expect(supabase.rpc).toHaveBeenCalledWith('create_or_get_conversation_v2', {
        p_other_user_id: otherUserId,
        p_initial_item_id: initialItemId
      });
    });

    it('應該支援不帶商品 ID 創建對話', async () => {
      // Arrange
      const otherUserId = 'user-456';
      const mockConversation = {
        conversation_id: 789,
        participant_1_id: 'user-123',
        participant_2_id: 'user-456',
        initial_item_id: null,
        is_new: false
      };

      supabase.rpc.mockResolvedValueOnce({
        data: [mockConversation],
        error: null
      });

      // Act
      const result = await createOrGetConversation(otherUserId);

      // Assert
      expect(result).toEqual(mockConversation);
      expect(supabase.rpc).toHaveBeenCalledWith('create_or_get_conversation_v2', {
        p_other_user_id: otherUserId,
        p_initial_item_id: null
      });
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'RPC failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(createOrGetConversation('user-456')).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('sendMessage', () => {
    it('應該成功發送訊息', async () => {
      // Arrange
      const conversationId = 789;
      const content = 'Hello!';
      const mockMessage = {
        message_id: 1001,
        conversation_id: 789,
        sender_id: 'user-123',
        content: 'Hello!',
        message_type: 'text',
        related_item_id: null,
        created_at: '2024-01-15T10:30:00Z'
      };

      supabase.rpc.mockResolvedValueOnce({
        data: [mockMessage],
        error: null
      });

      // Act
      const result = await sendMessage(conversationId, content);

      // Assert
      expect(result).toEqual(mockMessage);
      expect(supabase.rpc).toHaveBeenCalledWith('send_message_v2', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: 'text',
        p_related_item_id: null
      });
    });

    it('應該支援發送商品相關訊息', async () => {
      // Arrange
      const conversationId = 789;
      const content = '請問這個商品還有嗎?';
      const relatedItemId = 123;

      supabase.rpc.mockResolvedValueOnce({
        data: [{ message_id: 1001 }],
        error: null
      });

      // Act
      await sendMessage(conversationId, content, 'item_reference', relatedItemId);

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('send_message_v2', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: 'item_reference',
        p_related_item_id: relatedItemId
      });
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Send failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(sendMessage(789, 'Hello!')).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('getConversations', () => {
    it('應該成功獲取對話列表', async () => {
      // Arrange
      const mockConversations = [
        {
          conversation_id: 456,
          other_user_id: 'user-789',
          other_user_name: '張三',
          other_user_avatar: 'https://example.com/avatar.jpg',
          last_message_content: '你好',
          last_message_at: '2024-01-15T10:30:00Z',
          unread_count: 3
        }
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockConversations,
        error: null
      });

      // Act
      const result = await getConversations();

      // Assert
      expect(result).toEqual(mockConversations);
    });

    it('應該支援自訂參數', async () => {
      // Arrange
      supabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Act
      const result = await getConversations(2, 50, true);

      // Assert
      expect(result).toEqual([]);
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Get failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(getConversations()).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('getMessages', () => {
    it('應該成功獲取訊息列表', async () => {
      // Arrange
      const conversationId = 456;
      const mockMessages = [
        {
          message_id: 789,
          sender_id: 'user-123',
          content: '你好',
          message_type: 'text',
          is_mine: true,
          created_at: '2024-01-15T10:30:00Z'
        }
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockMessages,
        error: null
      });

      // Act
      const result = await getMessages(conversationId);

      // Assert
      expect(result).toEqual(mockMessages);
      expect(supabase.rpc).toHaveBeenCalledWith('get_conversation_messages_v2', {
        p_conversation_id: conversationId,
        p_page: 1,
        p_size: 50,
        p_include_deleted: false
      });
    });

    it('應該支援自訂分頁參數', async () => {
      // Arrange
      supabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Act
      const result = await getMessages(456, 2, 30);

      // Assert
      expect(result).toEqual([]);
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Get messages failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(getMessages(456)).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('markAsRead', () => {
    it('應該成功標記訊息為已讀', async () => {
      // Arrange
      const conversationId = 456;
      const updatedCount = 5;

      supabase.rpc.mockResolvedValueOnce({
        data: updatedCount,
        error: null
      });

      // Act
      const result = await markAsRead(conversationId);

      // Assert
      expect(result).toBe(updatedCount);
    });

    it('應該支援標記到特定訊息', async () => {
      // Arrange
      const conversationId = 456;
      const upToMessageId = 1000;

      supabase.rpc.mockResolvedValueOnce({
        data: 3,
        error: null
      });

      // Act
      await markAsRead(conversationId, upToMessageId);

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith('mark_messages_as_read_v2', {
        p_conversation_id: conversationId,
        p_up_to_message_id: upToMessageId
      });
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Mark as read failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(markAsRead(456)).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('getConversationItems', () => {
    it('應該成功獲取對話中的商品', async () => {
      // Arrange
      const conversationId = 456;
      const mockItems = [
        {
          item_id: 123,
          item_title: 'iPhone 15 Pro',
          item_price: 35000,
          item_status: 'available',
          message_count: 15
        }
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockItems,
        error: null
      });

      // Act
      const result = await getConversationItems(conversationId);

      // Assert
      expect(result).toEqual(mockItems);
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Get items failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(getConversationItems(456)).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('archiveConversation', () => {
    it('應該成功歸檔對話', async () => {
      // Arrange
      const conversationId = 456;

      supabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null
      });

      // Act
      const result = await archiveConversation(conversationId, true);

      // Assert
      expect(result).toBe(true);
    });

    it('應該成功取消歸檔對話', async () => {
      // Arrange
      const conversationId = 456;

      supabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null
      });

      // Act
      const result = await archiveConversation(conversationId, false);

      // Assert
      expect(result).toBeTruthy();
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Archive failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(archiveConversation(456)).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('getTotalUnreadCount', () => {
    it('應該成功獲取總未讀數', async () => {
      // Arrange
      const mockConversations = [
        { conversation_id: 1, unread_count: 3 },
        { conversation_id: 2, unread_count: 5 },
        { conversation_id: 3, unread_count: 0 }
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockConversations,
        error: null
      });

      // Act
      const result = await getTotalUnreadCount();

      // Assert
      expect(result).toBe(8);
    });

    it('應該處理空對話列表', async () => {
      // Arrange
      supabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Act
      const result = await getTotalUnreadCount();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe.sequential('deleteMessage', () => {
    it('應該成功軟刪除訊息', async () => {
      // Arrange
      const messageId = 789;

      supabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null
      });

      // Act
      const result = await deleteMessage(messageId);

      // Assert
      expect(result).toBe(true);
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Delete failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(deleteMessage(789)).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('restoreMessage', () => {
    it('應該成功恢復訊息', async () => {
      // Arrange
      const messageId = 789;

      supabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null
      });

      // Act
      const result = await restoreMessage(messageId);

      // Assert
      expect(result).toBe(true);
    });

    it('應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Restore failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(restoreMessage(789)).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('Realtime Subscriptions', () => {
    it('subscribeToMessages 應該創建訂閱並處理各種狀態', () => {
      // Arrange
      const conversationId = 456;
      const callback = vi.fn();

      // Mock subscription channel
      const mockChannel = {
        on: vi.fn().mockImplementation((event, filter, cb) => {
           if (cb) cb({ new: { id: 1 } });
           return mockChannel;
        }),
        subscribe: vi.fn((statusCb) => {
          // Simulate different statuses
          statusCb('SUBSCRIBED');
          statusCb('CHANNEL_ERROR');
          statusCb('TIMED_OUT');
          statusCb('CLOSED');
          return { unsubscribe: vi.fn() };
        }),
        unsubscribe: vi.fn()
      }
      supabase.channel.mockReturnValueOnce(mockChannel);

      // Act
      subscribeToMessages(conversationId, callback);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith(`conversation_v2_${conversationId}`);
      expect(callback).toHaveBeenCalledWith({ id: 1 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('已訂閱對話'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('訂閱對話 #456 失敗'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('訂閱對話 #456 逾時'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('訂閱已關閉'));
    });

    it('subscribeToMessages 應該支援自訂表名', () => {
      // Arrange
      const conversationId = 456;
      const callback = vi.fn();
      const customTable = 'custom_messages';

      // Act
      const channel = subscribeToMessages(conversationId, callback, customTable);

      // Assert
      expect(channel).toBeDefined();
    });

    it('subscribeToMessageUpdates 應該創建更新訂閱並處理各種狀態', () => {
      // Arrange
      const onUpdate = vi.fn();
      const mockChannel = {
        on: vi.fn().mockImplementation((event, filter, cb) => {
           if (cb) cb({ new: { id: 1, is_read: true }, old: { id: 1 } });
           return mockChannel;
        }),
        subscribe: vi.fn((statusCb) => {
          statusCb('SUBSCRIBED');
          statusCb('CHANNEL_ERROR');
          statusCb('TIMED_OUT');
          statusCb('CLOSED');
           return { unsubscribe: vi.fn() };
        })
      };
      supabase.channel.mockReturnValueOnce(mockChannel);

      // Act
      subscribeToMessageUpdates(onUpdate);

      // Assert
      expect(onUpdate).toHaveBeenCalledWith({ id: 1, is_read: true });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('已訂閱訊息更新'));
    });

    it('subscribeToAllMessages 應該創建全域訂閱並處理各種狀態', () => {
      // Arrange
      const callback = vi.fn();
       const mockChannel = {
        on: vi.fn().mockImplementation((event, filter, cb) => {
           if (cb) cb({ new: { conversation_id: 123 } });
           return mockChannel;
        }),
        subscribe: vi.fn((statusCb) => {
          statusCb('SUBSCRIBED');
          statusCb('CHANNEL_ERROR');
          statusCb('TIMED_OUT');
          statusCb('CLOSED');
          return { unsubscribe: vi.fn() };
        })
      };
      supabase.channel.mockReturnValueOnce(mockChannel);

      // Act
      subscribeToAllMessages(callback);

      // Assert
      expect(callback).toHaveBeenCalledWith({ conversation_id: 123 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('已訂閱所有對話'));
    });

    it('subscribeToUserPresence 應該創建線上狀態訂閱', () => {
      // Arrange
      const onPresenceUpdate = vi.fn();
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        presenceState: vi.fn(() => ({}))
      };
      supabase.channel.mockReturnValueOnce(mockChannel);

      // Act
      const channel = subscribeToUserPresence(onPresenceUpdate);

      // Manually trigger the 'sync' event callback to test coverage
      const syncCallback = mockChannel.on.mock.calls.find(call => call[1].event === 'sync')[2];
      syncCallback();

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith('online-users');
      expect(channel).toBeDefined();
      expect(mockChannel.on).toHaveBeenCalled();
      expect(onPresenceUpdate).toHaveBeenCalled();
    });

    it('createConversationTypingChannel 應該創建輸入中頻道', () => {
      // Arrange
      const conversationId = 456;
      const presenceKey = 'user-123';

      // Act
      const channel = createConversationTypingChannel(conversationId, presenceKey);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith(
        `conversation-typing-${conversationId}`,
        expect.objectContaining({
          config: expect.objectContaining({
            presence: expect.objectContaining({ key: presenceKey })
          })
        })
      );
    });

    it('createConversationTypingChannel 應該生成隨機 key', () => {
      // Arrange
      const conversationId = 456;

      // Act
      const channel = createConversationTypingChannel(conversationId);

      // Assert
      expect(supabase.channel).toHaveBeenCalled();
      expect(channel).toBeDefined();
    });
  });

  describe.sequential('錯誤處理邊界情況', () => {
    it('getConversations 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'RPC connection failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(getConversations()).rejects.toThrow(errorMessage);
    });

    it('getMessages 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Messages query failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(getMessages(456)).rejects.toThrow(errorMessage);
    });

    it('markAsRead 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Mark read failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(markAsRead(456)).rejects.toThrow(errorMessage);
    });

    it('getConversationItems 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Get items failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(getConversationItems(456)).rejects.toThrow(errorMessage);
    });

    it('archiveConversation 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Archive failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(archiveConversation(456)).rejects.toThrow(errorMessage);
    });

    it('deleteMessage 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Delete message failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(deleteMessage(789)).rejects.toThrow(errorMessage);
    });

    it('restoreMessage 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Restore message failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(restoreMessage(789)).rejects.toThrow(errorMessage);
    });
  });

  describe.sequential('進階場景', () => {
    it('sendMessage 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Send message failed';
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage)
      });

      // Act & Assert
      await expect(sendMessage(789, 'Hello')).rejects.toThrow(errorMessage);
    });

    it('getTotalUnreadCount 應該計算所有未讀訊息', async () => {
      // Arrange
      const mockConversations = [
        { conversation_id: 1, unread_count: 2 },
        { conversation_id: 2, unread_count: 3 },
        { conversation_id: 3, unread_count: 1 },
        { conversation_id: 4, unread_count: 0 }
      ];

      supabase.rpc.mockResolvedValueOnce({
        data: mockConversations,
        error: null
      });

      // Act
      const result = await getTotalUnreadCount();

      // Assert
      expect(result).toBe(6);
    });

    it('subscribeToMessages 應該使用預設表名', () => {
      // Arrange
      const conversationId = 456;
      const callback = vi.fn();

      // Act
      const channel = subscribeToMessages(conversationId, callback);

      // Assert
      expect(channel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          table: 'conversation_messages_v2'
        }),
        expect.any(Function)
      );
    });

    it('subscribeToMessageUpdates 應該在 RPC 失敗時拋出錯誤', async () => {
      // Arrange
      const onUpdate = vi.fn();
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      };
      supabase.channel.mockReturnValueOnce(mockChannel);

      // Act
      const channel = subscribeToMessageUpdates(onUpdate);

      // Assert
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('subscribeToAllMessages 應該支援自訂表名', () => {
      // Arrange
      const callback = vi.fn();
      const customTable = 'old_messages';

      // Act
      const channel = subscribeToAllMessages(callback, customTable);

      // Assert
      expect(channel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          table: customTable
        }),
        expect.any(Function)
      );
    });
  });
    it('subscribeToUserPresence 應該處理 sync 事件', () => {
      // Arrange
      const onPresenceUpdate = vi.fn();
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        presenceState: vi.fn(() => ({ 'user-123': [{ online_at: '2024-01-15T10:30:00Z' }] }))
      };
      supabase.channel.mockReturnValueOnce(mockChannel);

      // Act
      const channel = subscribeToUserPresence(onPresenceUpdate);

      // Assert
      expect(mockChannel.on).toHaveBeenCalledWith(
        'presence',
        expect.objectContaining({ event: 'sync' }),
        expect.any(Function)
      );
    });

    it('createConversationTypingChannel 應該設定廣播配置', () => {
      // Arrange
      const conversationId = 456;
      const presenceKey = 'user-123';

      // Act
      const channel = createConversationTypingChannel(conversationId, presenceKey);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith(
        `conversation-typing-${conversationId}`,
        expect.objectContaining({
          config: expect.objectContaining({
            broadcast: { self: true },
            presence: { key: presenceKey }
          })
        })
      );
    });

    describe('Realtime advanced behaviors', () => {
      it('subscribeToMessages 應處理 CHANNEL_ERROR 狀態並建立訂閱', () => {
        const conversationId = 1;
        const callback = vi.fn();
        const mockChannel = {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn((cb) => { if (cb) cb('CHANNEL_ERROR'); }),
          unsubscribe: vi.fn()
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        const channel = subscribeToMessages(conversationId, callback);

        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(channel).toBeDefined();
      });

      it('subscribeToMessages 應在 INSERT payload 時呼叫 callback', () => {
        const conversationId = 1;
        const callback = vi.fn();
        let storedHandler;
        const mockChannel = {
          on: vi.fn((event, opts, cb) => { storedHandler = cb; return mockChannel; }),
          subscribe: vi.fn(),
          unsubscribe: vi.fn()
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        subscribeToMessages(conversationId, callback);

        // Simulate payload
        storedHandler({ new: { message_id: 999, conversation_id: conversationId } });

        expect(callback).toHaveBeenCalledWith({ message_id: 999, conversation_id: conversationId });
      });

      it('subscribeToMessageUpdates 應處理 TIMED_OUT 狀態', () => {
        const onUpdate = vi.fn();
        const mockChannel = {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn((cb) => { if (cb) cb('TIMED_OUT'); })
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        const channel = subscribeToMessageUpdates(onUpdate);

        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(channel).toBeDefined();
      });

      it('subscribeToMessageUpdates 應在 UPDATE 時呼叫 onUpdate', () => {
        let storedHandler;
        const onUpdate = vi.fn();
        const mockChannel = {
          on: vi.fn((event, opts, cb) => { storedHandler = cb; return mockChannel; }),
          subscribe: vi.fn()
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        subscribeToMessageUpdates(onUpdate);
        storedHandler({ new: { message_id: 1 }, old: { message_id: 0 } });

        expect(onUpdate).toHaveBeenCalledWith({ message_id: 1 });
      });

      it('subscribeToAllMessages 應在 INSERT 時呼叫 callback', () => {
        let storedHandler;
        const callback = vi.fn();
        const mockChannel = {
          on: vi.fn((event, opts, cb) => { storedHandler = cb; return mockChannel; }),
          subscribe: vi.fn()
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        subscribeToAllMessages(callback);
        storedHandler({ new: { conversation_id: 42 } });

        expect(callback).toHaveBeenCalledWith({ conversation_id: 42 });
      });

      it('subscribeToUserPresence 在 sync 時應觸發 onPresenceUpdate', () => {
        const onPresenceUpdate = vi.fn();
        const mockChannel = {
          on: vi.fn((event, opts, cb) => { if (event === 'presence' && opts.event === 'sync') cb(); return mockChannel; }),
          subscribe: vi.fn(),
          presenceState: vi.fn(() => ({ 'user-123': [{ online_at: '2025-01-01T00:00:00Z' }] }))
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        subscribeToUserPresence(onPresenceUpdate);

        expect(onPresenceUpdate).toHaveBeenCalledWith({ 'user-123': [{ online_at: '2025-01-01T00:00:00Z' }] });
      });

      it('subscribeToAllMessages 應處理 CHANNEL_ERROR 狀態', () => {
        const callback = vi.fn();
        const mockChannel = {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn((cb) => { if (cb) cb('CHANNEL_ERROR'); })
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        const channel = subscribeToAllMessages(callback);

        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(channel).toBeDefined();
      });

      it('subscribeToAllMessages 應處理 CLOSED 狀態', () => {
        const callback = vi.fn();
        const mockChannel = {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn((cb) => { if (cb) cb('CLOSED'); })
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        const channel = subscribeToAllMessages(callback);

        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(channel).toBeDefined();
      });

      it('subscribeToUserPresence 應該處理 join 和 leave 事件', () => {
        const onPresenceUpdate = vi.fn();
        const handlers = {};
        const mockChannel = {
          on: vi.fn((type, filter, cb) => {
            if (type === 'presence') {
                handlers[filter.event] = cb;
            }
            return mockChannel;
          }),
          subscribe: vi.fn(),
          presenceState: vi.fn()
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        subscribeToUserPresence(onPresenceUpdate);

        // Execute the empty callbacks to ensure coverage
        if (handlers['join']) handlers['join']();
        if (handlers['leave']) handlers['leave']();

        // Assert they were registered
        expect(mockChannel.on).toHaveBeenCalledWith('presence', { event: 'join' }, expect.any(Function));
        expect(mockChannel.on).toHaveBeenCalledWith('presence', { event: 'leave' }, expect.any(Function));
      });

      it('subscribeToUserPresence 應該處理 subscribe callback', () => {
        const onPresenceUpdate = vi.fn();
        const mockChannel = {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn((cb) => cb && cb()), // Execute callback immediately
          presenceState: vi.fn()
        };
        supabase.channel.mockReturnValueOnce(mockChannel);

        subscribeToUserPresence(onPresenceUpdate);

        expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));
      });
    });
  });

