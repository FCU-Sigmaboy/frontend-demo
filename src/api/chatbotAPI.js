import { supabase } from '@/lib/supabase'

/**
 * Send a chat message to the AI chatbot
 * @param {string} message - User's message
 * @param {string|null} conversationId - Existing conversation ID (null for new conversation)
 * @param {string} language - Language code ('zh-TW' or 'en')
 * @returns {Promise<Object>} Response with conversationId, messageId, response, suggestions, links
 */
export async function sendChatMessage(message, conversationId = null, language = 'zh-TW') {
  try {
    const { data, error } = await supabase.functions.invoke('chat-message', {
      body: {
        message,
        conversationId,
        language
      }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('[ChatbotAPI] Error sending message:', error)
    throw error
  }
}

/**
 * Submit feedback (rating) for a chatbot response
 * @param {string} messageId - ID of the message being rated
 * @param {string} rating - 'positive' or 'negative'
 * @param {string|null} feedbackText - Optional feedback text
 * @returns {Promise<Object>} Success response
 */
export async function submitFeedback(messageId, rating, feedbackText = null) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-feedback', {
      body: {
        messageId,
        rating,
        feedback: feedbackText
      }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('[ChatbotAPI] Error submitting feedback:', error)
    throw error
  }
}

/**
 * Get conversation history
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Object>} Messages array
 */
export async function getChatHistory(conversationId, limit = 50) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-history', {
      body: { conversationId, limit }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('[ChatbotAPI] Error fetching history:', error)
    throw error
  }
}

/**
 * Escalate conversation to human support
 * @param {string} conversationId - Conversation ID
 * @param {string} issueDescription - User's description of the issue
 * @returns {Promise<Object>} Success response
 */
export async function escalateToSupport(conversationId, issueDescription) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Call N8N escalation webhook
    const response = await fetch(import.meta.env.VITE_N8N_ESCALATION_WEBHOOK_URL || 'https://n8n.your-domain.com/webhook/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        userId: user?.id,
        issueDescription
      })
    })

    if (!response.ok) {
      throw new Error('Escalation request failed')
    }

    return await response.json()
  } catch (error) {
    console.error('[ChatbotAPI] Error escalating to support:', error)
    throw error
  }
}
