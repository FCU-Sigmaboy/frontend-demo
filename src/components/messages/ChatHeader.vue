<template>
  <div class="chat-header">
    <button class="back-btn-mobile" @click="$emit('back')">
      <i class="bi bi-arrow-left"></i>
    </button>

    <div v-if="conversation" class="chat-user-info" @click.stop="goToUserProfile">
      <img
        :src="conversation.user.avatar"
        :alt="conversation.user.name"
        class="user-avatar"
      />
      <div class="user-details">
        <h3 class="user-name">{{ conversation.user.name }}</h3>
        <span class="user-status">{{ conversation.user.online ? '上線中' : '離線' }}</span>
      </div>
    </div>

    <div v-else class="chat-user-info">
      <div class="skeleton-avatar"></div>
      <div class="user-details">
        <div class="skeleton-name"></div>
        <div class="skeleton-status"></div>
      </div>
    </div>

    <button
      v-if="conversation"
      class="view-listings-btn"
      @click="$emit('view-listings')"
      title="查看對方的刊登物品"
    >
      <i class="bi bi-grid-3x3-gap"></i>
      <span class="btn-text">物品</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  conversation: {
    type: Object,
    default: null
  },
  messagesLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['back', 'view-listings']);

const goToUserProfile = () => {
  if (props.conversation?._raw?.other_user?.id) {
    router.push({ name: 'PublicUserProfile', params: { id: props.conversation._raw.other_user.id } });
  }
};
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  flex: 0 0 auto;
  height: 70px;
}

.back-btn-mobile {
  display: none;
}

.chat-user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  color: #1db187;
}

.view-listings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #1e1e1e;
  white-space: nowrap;
}

.view-listings-btn i {
  font-size: 16px;
  color: #1db187;
}

.view-listings-btn:hover {
  background: #f0faf8;
  border-color: #1db187;
}

.skeleton-avatar,
.skeleton-name,
.skeleton-status {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-name {
  width: 120px;
  height: 16px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.skeleton-status {
  width: 60px;
  height: 12px;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 991.98px) {
  .back-btn-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .back-btn-mobile i {
    font-size: 20px;
    color: #1e1e1e;
  }

  .back-btn-mobile:hover {
    background: #f5f5f5;
  }
}

@media (max-width: 767.98px) {
  .view-listings-btn .btn-text {
    display: none;
  }

  .view-listings-btn {
    padding: 8px;
    min-width: 36px;
  }
}

@media (max-width: 575.98px) {
  .chat-header {
    position: sticky;
    top: 0;
    z-index: 200;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}
</style>
