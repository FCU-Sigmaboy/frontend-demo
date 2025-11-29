import { supabase } from '@/lib/supabase';

/**
 * Send an admin notification message to a user
 * This creates a system message in the user's chat from the admin
 * @param {string} userId - Target user ID
 * @param {string} message - Message content
 * @param {object} metadata - Additional metadata (e.g., points, activity info)
 * @returns {Promise<object>} - Created message
 */
export async function sendAdminNotificationToUser(userId, message, metadata = {}) {
  try {
    // TODO: Implement actual API call to create admin system message
    // This would create a special conversation with the system/admin
    // and send a message to it
    
    console.log('Sending admin notification to user:', userId, message, metadata);
    
    // Mock response
    return {
      id: `admin_msg_${Date.now()}`,
      userId,
      message,
      metadata,
      createdAt: new Date().toISOString(),
      type: 'admin_notification'
    };
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    throw error;
  }
}

/**
 * Send admin notifications to multiple users
 * @param {Array<string>} userIds - Target user IDs
 * @param {string} message - Message content
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} - Batch send result
 */
export async function sendBatchAdminNotifications(userIds, message, metadata = {}) {
  try {
    console.log('Sending batch admin notifications to users:', userIds.length, message);
    
    const results = await Promise.allSettled(
      userIds.map(userId => sendAdminNotificationToUser(userId, message, metadata))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      total: userIds.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    console.error('Failed to send batch notifications:', error);
    throw error;
  }
}

/**
 * Get admin/system conversation for a user
 * This is a special conversation for system notifications
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Admin conversation or null
 */
export async function getAdminConversationForUser(userId) {
  try {
    // TODO: Implement actual API call
    // This would fetch or create a special conversation with ID 'system' or similar
    
    console.log('Getting admin conversation for user:', userId);
    
    // Mock response
    return {
      id: 'admin_system',
      userId,
      otherUser: {
        id: 'system',
        name: '系統管理員',
        avatar: null
      },
      isSystemConversation: true,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get admin conversation:', error);
    throw error;
  }
}
