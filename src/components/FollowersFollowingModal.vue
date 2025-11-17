<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ activeTab === 'followers' ? '追蹤者' : '追蹤中' }}</h3>
            <button class="close-btn" @click="closeModal">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <!-- Tabs -->
          <div class="modal-tabs">
            <button
              :class="['tab-btn', { active: activeTab === 'followers' }]"
              @click="activeTab = 'followers'"
            >
              追蹤者
              <span v-if="followersCount !== null" class="tab-count">{{ followersCount }}</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'following' }]"
              @click="activeTab = 'following'"
            >
              追蹤中
              <span v-if="followingCount !== null" class="tab-count">{{ followingCount }}</span>
            </button>
          </div>

          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">載入中...</span>
              </div>
              <p>載入中...</p>
            </div>

            <!-- Users List -->
            <div v-else-if="displayedUsers.length > 0" class="users-list">
              <div
                v-for="user in displayedUsers"
                :key="user.user_id"
                class="user-card"
              >
                <div class="user-clickable-area" @click="goToUserProfile(user.user_id)">
                  <img
                    :src="user.profile_picture_url || defaultAvatar"
                    :alt="user.nickname || '未知使用者'"
                    class="user-avatar"
                    referrerpolicy="no-referrer"
                  />
                  <div class="user-info">
                    <h3 class="user-name">{{ user.nickname || '未知使用者' }}</h3>
                    <p v-if="activeTab === 'followers'" class="user-follow-date">
                      {{ formatFollowerText(user.followed_at) }}
                    </p>
                    <p v-else class="user-follow-date">
                      {{ formatFollowingText(user.followed_at) }}
                    </p>
                  </div>
                </div>
                <button
                  v-if="activeTab === 'following' && currentUserId"
                  class="follow-btn following"
                  @click.stop="handleUnfollow(user)"
                  :disabled="isUnfollowing"
                >
                  <span class="btn-text">追蹤中</span>
                </button>
                <button
                  v-else-if="activeTab === 'followers' && user.user_id !== currentUserId && currentUserId"
                  :class="['follow-btn', { following: user.is_following_back }]"
                  @click.stop="handleToggleFollow(user)"
                  :disabled="isTogglingFollow"
                >
                  <span v-if="user.is_following_back" class="btn-text">追蹤中</span>
                  <span v-else class="btn-text">追蹤</span>
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <i class="bi bi-people"></i>
              <p>{{ activeTab === 'followers' ? '尚無追蹤者' : '尚未追蹤任何人' }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getPublicFollowers, getPublicFollowing, followUser, unfollowUser } from '@/api/followAPI';
import { formatRelativeTime } from '@/utils/timeFormat';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  },
  initialTab: {
    type: String,
    default: 'followers',
    validator: (value) => ['followers', 'following'].includes(value)
  },
  followersCount: {
    type: Number,
    default: null
  },
  followingCount: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref(props.initialTab);
const isLoading = ref(false);
const isTogglingFollow = ref(false);
const isUnfollowing = ref(false);
const followers = ref([]);
const following = ref([]);

const currentUserId = computed(() => authStore.user?.id);
const defaultAvatar = 'https://placehold.co/48/6fb8a5/ffffff?text=User';

const displayedUsers = computed(() => {
  return activeTab.value === 'followers' ? followers.value : following.value;
});

function closeModal() {
  emit('update:modelValue', false);
}

function formatFollowerText(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `追蹤於 ${formatRelativeTime(date)}`;
}

function formatFollowingText(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `追蹤於 ${formatRelativeTime(date)}`;
}

async function loadFollowers() {
  if (isLoading.value) return;
  
  try {
    isLoading.value = true;
    const data = await getPublicFollowers(props.userId, { page: 1, pageSize: 100 });
    followers.value = data || [];
  } catch (error) {
    console.error('載入追蹤者失敗:', error);
    followers.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function loadFollowing() {
  if (isLoading.value) return;
  
  try {
    isLoading.value = true;
    const data = await getPublicFollowing(props.userId, { page: 1, pageSize: 100 });
    following.value = data || [];
  } catch (error) {
    console.error('載入追蹤中失敗:', error);
    following.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function handleToggleFollow(user) {
  if (!currentUserId.value) {
    await authStore.signInWithGoogle();
    return;
  }

  if (isTogglingFollow.value) return;

  try {
    isTogglingFollow.value = true;
    
    if (user.is_following_back) {
      await unfollowUser(user.user_id);
      user.is_following_back = false;
    } else {
      await followUser(user.user_id);
      user.is_following_back = true;
    }
  } catch (error) {
    console.error('追蹤操作失敗:', error);
    alert(error.message || '操作失敗，請稍後再試');
  } finally {
    isTogglingFollow.value = false;
  }
}

async function handleUnfollow(user) {
  if (!currentUserId.value) {
    await authStore.signInWithGoogle();
    return;
  }

  if (isUnfollowing.value) return;

  try {
    isUnfollowing.value = true;
    await unfollowUser(user.user_id);
    
    // 從列表中移除
    const index = following.value.findIndex(f => f.user_id === user.user_id);
    if (index !== -1) {
      following.value.splice(index, 1);
    }
  } catch (error) {
    console.error('取消追蹤失敗:', error);
    alert(error.message || '操作失敗，請稍後再試');
  } finally {
    isUnfollowing.value = false;
  }
}

function goToUserProfile(userId) {
  closeModal();
  router.push({ name: 'PublicUserProfile', params: { id: userId } });
}

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'followers' && followers.value.length === 0) {
    loadFollowers();
  } else if (newTab === 'following' && following.value.length === 0) {
    loadFollowing();
  }
});

// Watch for modal open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    activeTab.value = props.initialTab;
    if (props.initialTab === 'followers') {
      loadFollowers();
    } else {
      loadFollowing();
    }
  }
});

// Load initial data
onMounted(() => {
  if (props.modelValue) {
    if (props.initialTab === 'followers') {
      loadFollowers();
    } else {
      loadFollowing();
    }
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    i {
      font-size: 24px;
      color: #666;
    }

    &:hover {
      background: #f5f5f5;

      i {
        color: #1e1e1e;
      }
    }
  }
}

.modal-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid #d0d0d0;
    border-radius: 20px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: #e0e0e0;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }

    &:hover {
      border-color: $primary;
      color: $primary;
    }

    &.active {
      background: $primary;
      border-color: $primary;
      color: white;

      .tab-count {
        background: rgba(255, 255, 255, 0.3);
        color: white;
      }
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  min-height: 200px;
  max-height: calc(80vh - 200px);

  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;

  i {
    font-size: 48px;
    color: #e0e0e0;
    margin-bottom: 16px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  transition: background 0.2s;

  &:hover {
    background: #f9f9f9;
  }
}

.user-clickable-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 4px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-follow-date {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    color: #999;
    margin: 0;
  }
}

.follow-btn {
  padding: 6px 16px;
  background: $primary;
  border: none;
  border-radius: 20px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: darken($primary, 10%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.following {
    background: #e0e0e0;
    color: #666;

    &:hover:not(:disabled) {
      background: #d0d0d0;
    }
  }
}

@media (max-width: 575.98px) {
  .modal-container {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
    margin-top: auto;
  }

  .modal-body {
    max-height: calc(90vh - 200px);
  }
}
</style>




