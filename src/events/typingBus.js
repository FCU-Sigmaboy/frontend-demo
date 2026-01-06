const listeners = new Map()

export const TypingEvents = Object.freeze({
  ConversationChanged: 'typing:conversation-changed',
  InputChanged: 'typing:input-changed',
  SendMessage: 'typing:send-message',
  Reset: 'typing:reset',
})

function ensureListenerSet(event) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set())
  }
}

export function onTypingEvent(event, handler) {
  if (!event || typeof handler !== 'function') return
  ensureListenerSet(event)
  listeners.get(event).add(handler)
}

export function offTypingEvent(event, handler) {
  if (!event || typeof handler !== 'function') return
  const handlers = listeners.get(event)
  if (!handlers) return
  handlers.delete(handler)
  if (handlers.size === 0) {
    listeners.delete(event)
  }
}

export function emitTypingEvent(event, payload) {
  const handlers = listeners.get(event)
  if (!handlers || handlers.size === 0) {
    return Promise.resolve()
  }

  const tasks = []

  handlers.forEach((handler) => {
    try {
      tasks.push(Promise.resolve(handler(payload)))
    } catch (err) {
      tasks.push(Promise.reject(err))
    }
  })

  return Promise.all(tasks)
}
