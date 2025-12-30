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
      unsubscribe: vi.fn()
    }))
  }
}));

describe('conversation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrGetConversation', () => {
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

  describe('sendMessage', () => {
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

  describe('getConversations', () => {
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

  describe('getMessages', () => {
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

  describe('markAsRead', () => {
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

  describe('getConversationItems', () => {
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

  describe('archiveConversation', () => {
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

  describe('getTotalUnreadCount', () => {
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

  describe('deleteMessage', () => {
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

  describe('restoreMessage', () => {
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

  describe('Realtime Subscriptions', () => {
    it('subscribeToMessages 應該創建訂閱', () => {
      // Arrange
      const conversationId = 456;
      const callback = vi.fn();

      // Act
      const channel = subscribeToMessages(conversationId, callback);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith(`conversation_v2_${conversationId}`);
      expect(channel).toBeDefined();
      expect(channel.on).toHaveBeenCalled();
      expect(channel.subscribe).toHaveBeenCalled();
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

    it('subscribeToMessageUpdates 應該創建更新訂閱', () => {
      // Arrange
      const onUpdate = vi.fn();

      // Act
      const channel = subscribeToMessageUpdates(onUpdate);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith('message_updates', expect.any(Object));
      expect(channel).toBeDefined();
    });

    it('subscribeToAllMessages 應該創建全域訂閱', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      const channel = subscribeToAllMessages(callback);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith('all_conversations');
      expect(channel).toBeDefined();
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

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith('online-users');
      expect(channel).toBeDefined();
      expect(mockChannel.on).toHaveBeenCalled();
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
});
