const listeners = new Map();

export const ScrollEvents = Object.freeze({
  Metrics: 'scroll:metrics',
  MessagesAppended: 'scroll:messages-appended',
  ConversationChanged: 'scroll:conversation-changed',
  Reset: 'scroll:reset'
});

function ensureListenerSet(event) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
}

export function onScrollEvent(event, handler) {
  if (!event || typeof handler !== 'function') return;
  ensureListenerSet(event);
  listeners.get(event).add(handler);
}

export function offScrollEvent(event, handler) {
  if (!event || typeof handler !== 'function') return;
  const handlers = listeners.get(event);
  if (!handlers) return;
  handlers.delete(handler);
  if (handlers.size === 0) {
    listeners.delete(event);
  }
}

export function emitScrollEvent(event, payload) {
  const handlers = listeners.get(event);
  if (!handlers || handlers.size === 0) {
    return Promise.resolve();
  }

  const tasks = [];

  handlers.forEach(handler => {
    try {
      tasks.push(Promise.resolve(handler(payload)));
    } catch (err) {
      tasks.push(Promise.reject(err));
    }
  });

  return Promise.all(tasks);
}
