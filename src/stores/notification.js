import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([])
  const unreadNotifications = ref([])
  const showNotificationModal = ref(false)
  const currentNotification = ref(null)

  // Getters
  const unreadCount = computed(() => unreadNotifications.value.length)

  const hasUnreadNotifications = computed(() => unreadCount.value > 0)

  const latestNotification = computed(() => {
    if (unreadNotifications.value.length === 0) return null
    return unreadNotifications.value[0]
  })

  // Actions
  
  /**
   * Add a new notification
   * @param {object} notification - Notification object
   */
  function addNotification(notification) {
    const newNotification = {
      id: notification.id || `notif_${Date.now()}`,
      type: notification.type || 'points_reward',
      title: notification.title || '系統通知',
      message: notification.message || '',
      points: notification.points || 0,
      createdAt: notification.createdAt || new Date().toISOString(),
      read: false,
      ...notification
    }

    notifications.value.unshift(newNotification)
    unreadNotifications.value.unshift(newNotification)

    console.log('New notification added:', newNotification)
  }

  /**
   * Mark a notification as read
   * @param {string|number} notificationId - Notification ID
   */
  function markAsRead(notificationId) {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      unreadNotifications.value = unreadNotifications.value.filter(
        n => n.id !== notificationId
      )
      console.log('Notification marked as read:', notificationId)
    }
  }

  /**
   * Mark all notifications as read
   */
  function markAllAsRead() {
    notifications.value.forEach(n => {
      n.read = true
    })
    unreadNotifications.value = []
    console.log('All notifications marked as read')
  }

  /**
   * Show notification modal
   * @param {object} notification - Notification to display
   */
  function showNotification(notification) {
    currentNotification.value = notification
    showNotificationModal.value = true
  }

  /**
   * Hide notification modal
   */
  function hideNotificationModal() {
    showNotificationModal.value = false
    if (currentNotification.value) {
      markAsRead(currentNotification.value.id)
      currentNotification.value = null
    }
  }

  /**
   * Clear all notifications
   */
  function clearAllNotifications() {
    notifications.value = []
    unreadNotifications.value = []
    console.log('All notifications cleared')
  }

  /**
   * Simulate receiving a points reward notification
   * This would normally come from the backend
   * @param {object} reward - Reward details
   */
  function receivePointsReward(reward) {
    const notification = {
      type: 'points_reward',
      title: reward.title || '贈點活動',
      message: reward.message || '恭喜您獲得點數獎勵！',
      points: reward.points || 0,
      activityId: reward.activityId || null,
      createdAt: new Date().toISOString()
    }

    addNotification(notification)

    // Auto-show the notification modal for points rewards
    setTimeout(() => {
      if (latestNotification.value && latestNotification.value.type === 'points_reward') {
        showNotification(latestNotification.value)
      }
    }, 500)
  }

  /**
   * Check for new notifications on login
   * This should be called after user logs in
   */
  async function checkNewNotifications() {
    try {
      // TODO: Call API to fetch new notifications
      // For now, we'll use mock data
      console.log('Checking for new notifications...')
      
      // Example: Simulate receiving a notification
      // This would be replaced with actual API call
      // const response = await fetch('/api/notifications/unread')
      // const data = await response.json()
      // data.forEach(notif => addNotification(notif))
    } catch (error) {
      console.error('Failed to check notifications:', error)
    }
  }

  /**
   * Reset store (used on logout)
   */
  function reset() {
    notifications.value = []
    unreadNotifications.value = []
    showNotificationModal.value = false
    currentNotification.value = null
    console.log('Notification store reset')
  }

  return {
    // State
    notifications,
    unreadNotifications,
    showNotificationModal,
    currentNotification,

    // Getters
    unreadCount,
    hasUnreadNotifications,
    latestNotification,

    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    showNotification,
    hideNotificationModal,
    clearAllNotifications,
    receivePointsReward,
    checkNewNotifications,
    reset
  }
})
