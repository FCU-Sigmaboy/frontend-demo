<template>
  <div class="chat-scroll-controls">
    <transition name="scroll-btn-slide">
      <button
        v-if="showScrollToBottomBtn"
        class="scroll-to-bottom-btn-floating"
        @click="$emit('scroll-to-bottom')"
        aria-live="polite"
      >
        <template v-if="typeof scrollButtonLabel === 'string'">
          <span>{{ scrollButtonLabel }}</span>
        </template>
        <template v-else>
          <span v-if="scrollButtonLabel.newMessages" class="scroll-btn-new">{{ scrollButtonLabel.newMessages }}</span>
          <span
            v-if="scrollButtonLabel.typing"
            class="scroll-btn-typing"
          >
            <span class="typing-dots inline" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span class="typing-text">{{ scrollButtonLabel.typing }}...</span>
          </span>
        </template>
      </button>
    </transition>
  </div>
</template>

<script setup>
const props = defineProps({
  showScrollToBottomBtn: {
    type: Boolean,
    default: false
  },
  scrollButtonLabel: {
    type: [String, Object],
    default: '回到最新'
  },
  pendingItemReference: {
    type: Object,
    default: null
  }
});

defineEmits(['scroll-to-bottom']);
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.chat-scroll-controls {
  position: relative;
}

.typing-text,
.typing-dots,
.scroll-btn-typing {
  position: relative;
  z-index: 1;
}

.scroll-btn-new {
  font-weight: 600;
  color: $primary;
}

.scroll-btn-typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 0;
  font-weight: 500;
  color: $primary;
}

.scroll-btn-typing .typing-text {
  color: inherit;
}

.scroll-btn-new + .scroll-btn-typing {
  margin-left: 8px;
}

.typing-dots {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $primary;
  opacity: 0.25;
  animation: typing-dot 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.typing-dots.inline {
  align-items: center;
  gap: 3px;
  margin-right: 4px;
}

.typing-dots.inline span {
  width: 5px;
  height: 5px;
  opacity: 0.3;
  animation-duration: 1s;
}

@keyframes typing-dot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.25;
  }
  30% {
    transform: translateY(-4px);
    opacity: 0.6;
  }
}

.scroll-to-bottom-btn-floating {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: none;
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: $primary;
  transition: all 0.3s ease;
  z-index: 60;
  white-space: nowrap;

  i {
    font-size: 16px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateX(-50%) translateY(-4px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      background: $primary;
      color: white;

      .scroll-btn-typing {
        color: inherit;

        .typing-dots span {
          background: currentColor;
        }

        .typing-text {
          color: inherit;
        }
      }

      .scroll-btn-new {
        color: inherit;
      }
    }
  }

  &:active {
    transform: translateX(-50%) translateY(-2px);
  }
}

.scroll-btn-slide-enter-active,
.scroll-btn-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scroll-btn-slide-enter-from,
.scroll-btn-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(60px);
}

@media (max-width: 575.98px) {
  .scroll-to-bottom-btn-floating {
    bottom: 28px;
    padding: 10px 16px;
    font-size: 13px;

    i {
      font-size: 14px;
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: translateX(-50%) translateY(-4px);
      }
    }

    &:active {
      transform: translateX(-50%) translateY(-2px);
    }
  }
}
</style>
