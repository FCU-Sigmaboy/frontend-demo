<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useMessageStore } from './stores/message'
import { useTransactionStore } from './stores/transaction'
import { subscribeToUserPresence } from './api/conversation'
import { BToastOrchestrator } from 'bootstrap-vue-next'
import { useTransactionToast } from './composables/useTransactionToast'
import ChatWidget from './components/ChatWidget.vue'

const authStore = useAuthStore()
const messageStore = useMessageStore()
const transactionStore = useTransactionStore()
const presenceChannel = ref(null)
const realtimeUserId = ref(null)

const {
  showTransactionReceivedToast,
  showTransactionAcceptedToast,
  showTransactionCompletedToast,
  showTransactionRejectedToast,
  showTransactionCancelledToast
} = useTransactionToast()

async function startPresenceTracking() {
  if (presenceChannel.value) return

  console.log('[App] Starting presence tracking')
  presenceChannel.value = subscribeToUserPresence((presenceState) => {
    console.log('[App] Presence update received:', presenceState)
    messageStore.updateOnlineUsers(presenceState)
  })

  await new Promise(resolve => setTimeout(resolve, 500))

  if (authStore.user?.id) {
    await presenceChannel.value.track({
      user_id: authStore.user.id,
      online_at: new Date().toISOString()
    })
  }

  setTimeout(() => {
    const currentState = presenceChannel.value.presenceState()
    if (currentState) {
      messageStore.updateOnlineUsers(currentState)
    }
  }, 1500)
}

function stopPresenceTracking() {
  if (presenceChannel.value) {
    console.log('[App] Stopping presence tracking')
    presenceChannel.value.unsubscribe()
    presenceChannel.value = null
  }
}

function setupTransactionCallbacks() {
  transactionStore.setRealtimeCallbacks({
    onTransactionReceived: showTransactionReceivedToast,
    onTransactionAccepted: showTransactionAcceptedToast,
    onTransactionCompleted: showTransactionCompletedToast,
    onTransactionRejected: showTransactionRejectedToast,
    onTransactionCancelled: showTransactionCancelledToast
  })
}

async function startTransactionTracking(userId) {
  if (!userId) return

  if (realtimeUserId.value === userId && transactionStore.isRealtimeActive) {
    console.log('[App] Transaction tracking already active for user:', userId)
    return
  }

  realtimeUserId.value = userId

  try {
    console.log('[App] Fetching transactions & starting realtime for user:', userId)
    setupTransactionCallbacks()
    await transactionStore.fetchAllTransactions(false) // 使用快取，不強制重新載入
    transactionStore.startRealtime(userId)
  } catch (error) {
    console.error('[App] Failed to start transaction tracking', error)
  }
}

function stopTransactionTracking() {
  realtimeUserId.value = null
  console.log('[App] Stopping transaction tracking')
  transactionStore.stopRealtime()
  transactionStore.clearAll()
}

// 監聽登入狀態
watch(() => authStore.isLoggedIn, async (isLoggedIn) => {
  console.log('[App] Auth state changed. Logged in:', isLoggedIn)
  if (isLoggedIn) {
    // 使用者登入後，載入對話並啟動監聽
    await messageStore.loadConversations()
    messageStore.startGlobalMessageListener()
    await startPresenceTracking()
    await startTransactionTracking(authStore.user?.id)
  } else {
    // 使用者登出，重置訊息 store
    messageStore.reset()
    stopPresenceTracking()
    stopTransactionTracking()
  }
})

// watch(() => authStore.user?.id, async (userId) => {
//   console.log('[App] User ID watcher triggered. userId:', userId)
//   if (userId) {
//     await startTransactionTracking(userId)
//   } else {
//     stopTransactionTracking()
//   }
// }, { immediate: true })

onMounted(async () => {
  await authStore.initAuth()

  // 如果使用者已登入，初始化訊息功能
  if (authStore.isLoggedIn) {
    await messageStore.loadConversations()
    messageStore.startGlobalMessageListener()
    await startPresenceTracking()
  }
})

onBeforeUnmount(() => {
  messageStore.stopGlobalMessageListener()
  stopPresenceTracking()
  stopTransactionTracking()
})
</script>

<template>
  <div id="app">
    <router-view />
    <BToastOrchestrator teleport-to="body" />
    <ChatWidget />
  </div>
</template>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans TC', 'Inter', 'Noto Sans JP', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f9f9f9;
  min-width: 360px;
}

#app {
  min-height: 100vh;
  min-width: 360px;
}

/* Toast positioning - avoid header overlap */
.custom-toast-position {
  top: 100px !important;
  margin-top: 20px !important;
  z-index: 9999 !important;
}

/* Fallback for all toast containers */
.b-toast-container,
.b-toaster,
.b-toaster-top-right,
.b-toaster-top-end,
[class*="b-toast"],
[class*="b-toaster"] {
  top: 100px !important;
  z-index: 9999 !important;
}

/* More specific selectors */
div[class*="toast"][class*="top"],
.toast-container {
  top: 100px !important;
  z-index: 9999 !important;
}

/* Toast styling - clean white background */
.toast {
  background-color: #ffffff !important;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.toast-header {
  background-color: #ffffff !important;
  border-bottom: none !important;
  color: #333333 !important;
  padding-bottom: 0.25rem !important;
}

.toast-body {
  background-color: #ffffff !important;
  color: #666666 !important;
  padding-top: 0.25rem !important;
  white-space: pre-line !important;
}

/* Remove variant background colors */
.toast.bg-info,
.toast.bg-success,
.toast.bg-warning,
.toast.bg-secondary,
.toast.bg-danger {
  background-color: #ffffff !important;
}

.toast.bg-info .toast-header,
.toast.bg-success .toast-header,
.toast.bg-warning .toast-header,
.toast.bg-secondary .toast-header,
.toast.bg-danger .toast-header {
  background-color: #ffffff !important;
  color: #333333 !important;
}

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;300;400;500;700;900&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Noto+Sans+JP:wght@100;300;400;500;700;900&display=swap');
</style>
