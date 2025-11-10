<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useMessageStore } from './stores/message'
import { subscribeToUserPresence } from './api/conversationAPI_v2'

const authStore = useAuthStore()
const messageStore = useMessageStore()
const presenceChannel = ref(null)

async function startPresenceTracking() {
  if (presenceChannel.value) return

  presenceChannel.value = subscribeToUserPresence((presenceState) => {
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
    presenceChannel.value.unsubscribe()
    presenceChannel.value = null
  }
}

// 監聽登入狀態
watch(() => authStore.isLoggedIn, async (isLoggedIn) => {
  if (isLoggedIn) {
    // 使用者登入後，載入對話並啟動監聽
    await messageStore.loadConversations()
    messageStore.startGlobalMessageListener()
    await startPresenceTracking()
  } else {
    // 使用者登出，重置訊息 store
    messageStore.reset()
    stopPresenceTracking()
  }
})

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
})
</script>

<template>
  <div id="app">
    <router-view />
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

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;300;400;500;700;900&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Noto+Sans+JP:wght@100;300;400;500;700;900&display=swap');
</style>
