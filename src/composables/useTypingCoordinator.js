import { onBeforeUnmount } from 'vue'
import { TypingEvents, onTypingEvent, offTypingEvent, emitTypingEvent } from '@/events/typingBus'

export function useTypingCoordinator({
  messageStore,
  getIdentity,
  getSelectedConversationId,
  typingStopDelay = 3500,
  typingBroadcastInterval = 1200,
}) {
  let typingStopTimerId = null
  let localTypingActive = false
  let lastTypingBroadcastAt = 0

  function clearTypingTimer() {
    if (typingStopTimerId) {
      clearTimeout(typingStopTimerId)
      typingStopTimerId = null
    }
  }

  function resetTypingFlags() {
    localTypingActive = false
    lastTypingBroadcastAt = 0
  }

  function currentIdentity() {
    try {
      return typeof getIdentity === 'function' ? getIdentity() : null
    } catch (err) {
      console.error('[TypingCoordinator] failed to resolve identity', err)
      return null
    }
  }

  function currentConversation() {
    try {
      return typeof getSelectedConversationId === 'function' ? getSelectedConversationId() : null
    } catch (err) {
      console.error('[TypingCoordinator] failed to resolve conversation id', err)
      return null
    }
  }

  function broadcastTyping(conversationId, isTyping, identity) {
    const actor = identity || currentIdentity()
    const targetConversation = conversationId || currentConversation()

    if (!targetConversation || !actor?.id) return Promise.resolve()

    return messageStore.broadcastTypingStatus(targetConversation, isTyping, actor).catch((err) => {
      console.error('[TypingCoordinator] failed to broadcast typing status', err)
    })
  }

  async function handleConversationChanged({
    prevConversationId = null,
    nextConversationId = null,
    identity = null,
  } = {}) {
    if (prevConversationId && prevConversationId === nextConversationId) {
      return
    }

    if (prevConversationId) {
      await broadcastTyping(prevConversationId, false, identity)
    }

    clearTypingTimer()
    resetTypingFlags()

    if (prevConversationId) {
      try {
        await messageStore.leaveTypingChannel(prevConversationId)
      } catch (err) {
        console.error('[TypingCoordinator] failed to leave typing channel', err)
      }
    }

    if (nextConversationId) {
      const actor = identity || currentIdentity()
      if (actor?.id) {
        try {
          await messageStore.joinTypingChannel(nextConversationId, actor)
        } catch (err) {
          console.error('[TypingCoordinator] failed to join typing channel', err)
        }
      }
    }
  }

  function handleInputChanged({ conversationId = null, content = '' } = {}) {
    const actor = currentIdentity()
    const targetConversation = conversationId || currentConversation()

    if (!targetConversation || !actor?.id) {
      clearTypingTimer()
      resetTypingFlags()
      return
    }

    const trimmed = typeof content === 'string' ? content.trim() : ''
    const now = Date.now()

    if (!trimmed) {
      if (localTypingActive) {
        void broadcastTyping(targetConversation, false, actor)
      }
      clearTypingTimer()
      resetTypingFlags()
      return
    }

    if (!localTypingActive || now - lastTypingBroadcastAt > typingBroadcastInterval) {
      localTypingActive = true
      lastTypingBroadcastAt = now
      void broadcastTyping(targetConversation, true, actor)
    }

    clearTypingTimer()

    typingStopTimerId = setTimeout(() => {
      const latestConversationId = currentConversation()
      const identityNow = currentIdentity()

      if (!latestConversationId || !identityNow?.id) {
        resetTypingFlags()
        typingStopTimerId = null
        return
      }

      void broadcastTyping(latestConversationId, false, identityNow)
      resetTypingFlags()
      typingStopTimerId = null
    }, typingStopDelay)
  }

  function handleSendMessage({ conversationId = null } = {}) {
    const targetConversation = conversationId || currentConversation()
    if (!targetConversation) {
      clearTypingTimer()
      resetTypingFlags()
      return
    }

    clearTypingTimer()
    resetTypingFlags()

    const actor = currentIdentity()
    if (actor?.id) {
      void broadcastTyping(targetConversation, false, actor)
    }
  }

  async function handleReset({ conversationId = null } = {}) {
    const targetConversation = conversationId || currentConversation()

    clearTypingTimer()
    resetTypingFlags()

    if (targetConversation) {
      await broadcastTyping(targetConversation, false)
      try {
        await messageStore.leaveTypingChannel(targetConversation)
      } catch (err) {
        console.error('[TypingCoordinator] failed to leave typing channel during reset', err)
      }
    }
  }

  const handlerMap = new Map([
    [TypingEvents.ConversationChanged, handleConversationChanged],
    [TypingEvents.InputChanged, handleInputChanged],
    [TypingEvents.SendMessage, handleSendMessage],
    [TypingEvents.Reset, handleReset],
  ])

  handlerMap.forEach((handler, event) => onTypingEvent(event, handler))

  onBeforeUnmount(() => {
    handlerMap.forEach((handler, event) => offTypingEvent(event, handler))
    clearTypingTimer()
    resetTypingFlags()
  })

  function emitConversationChanged(payload) {
    return emitTypingEvent(TypingEvents.ConversationChanged, payload)
  }

  function emitInputChanged(payload) {
    return emitTypingEvent(TypingEvents.InputChanged, payload)
  }

  function emitSendMessage(payload) {
    return emitTypingEvent(TypingEvents.SendMessage, payload)
  }

  function emitReset(payload) {
    return emitTypingEvent(TypingEvents.Reset, payload)
  }

  return {
    emitConversationChanged,
    emitInputChanged,
    emitSendMessage,
    emitReset,
    clearTypingTimer,
    resetTypingFlags,
  }
}
