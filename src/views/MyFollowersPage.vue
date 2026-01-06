<template>
  <div class="my-followers-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="[
        { label: '我的檔案', to: { name: 'UserProfile' } },
        { label: '我的追蹤' }
      ]" />

      <div class="followers-container">
        <!-- Tabs -->
        <div class="tabs-section">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="handleTabClick(tab.id)"
          >
            {{ tab.label }}
            <span v-if="tab.count" class="tab-count">({{ tab.count }})</span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋"
            class="search-input"
          />
        </div>

        <!-- Filter Tabs -->
        <FilterTabs
          :items="activeTab === 'followers' ? filteredFollowers : filteredFollowing"
          :filters="filterOptions"
          @update:sortedItems="handleSortedItems"
        />

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="users-list">
          <div v-for="i in 4" :key="`skeleton-${i}`" class="skeleton-user-card">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-info">
              <div class="skeleton-name"></div>
              <div class="skeleton-follow-date"></div>
            </div>
            <div class="skeleton-button"></div>
          </div>
        </div>

        <!-- Followers List (追蹤者) -->
        <TransitionGroup
          v-if="activeTab === 'followers' && !isLoading"
          name="user-list"
          tag="div"
          class="users-list"
        >
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
              />
              <div class="user-info">
                <h3 class="user-name">{{ user.nickname || '未知使用者' }}</h3>
                <p class="user-follow-date">{{ formatFollowerText(user.followed_at) }}</p>
              </div>
            </div>
            <button
              :class="['follow-btn', { following: user.is_following_back }]"
              @click.stop="toggleFollow(user)"
            >
              <span v-if="user.is_following_back" class="btn-text">追蹤中</span>
              <span v-else class="btn-text">回追</span>
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="displayedUsers.length === 0" :key="'empty-followers'" class="empty-state">
            <i class="bi bi-people"></i>
            <p>尚無追蹤者</p>
          </div>
        </TransitionGroup>

        <!-- Following List (追蹤中) -->
        <TransitionGroup
          v-if="activeTab === 'following' && !isLoading"
          name="user-list"
          tag="div"
          class="users-list"
        >
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
              />
              <div class="user-info">
                <h3 class="user-name">{{ user.nickname || '未知使用者' }}</h3>
                <p class="user-follow-date">{{ formatFollowingText(user.followed_at) }}</p>
              </div>
            </div>
            <button
              class="follow-btn following"
              @click.stop="unfollow(user)"
            >
              <span class="btn-text">追蹤中</span>
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="displayedUsers.length === 0" :key="'empty-following'" class="empty-state">
            <i class="bi bi-people"></i>
            <p>尚未追蹤任何人</p>
          </div>
        </TransitionGroup>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import FilterTabs from '../components/FilterTabs.vue';
import {
  getMyFollowers,
  getMyFollowing,
  followUser,
  unfollowUser
} from '@/api/followAPI';

const router = useRouter();
const route = useRoute();
const validTabs = ['followers', 'following'];

const getInitialTab = () => {
  const tabFromRoute = route.query.tab;
  return typeof tabFromRoute === 'string' && validTabs.includes(tabFromRoute)
    ? tabFromRoute
    : 'followers';
};

// State
const userPoints = ref(0);
const activeTab = ref(getInitialTab());
const searchQuery = ref('');
const isLoading = ref(false);

// Data
const followers = ref([]);
const following = ref([]);
const sortedDisplayItems = ref([]);
const defaultAvatar = 'https://placehold.co/48/6fb8a5/ffffff?text=U';

watch([activeTab, searchQuery], () => {
  sortedDisplayItems.value = [];
});

watch(
  () => route.query.tab,
  (newTab) => {
    if (typeof newTab === 'string' && validTabs.includes(newTab)) {
      activeTab.value = newTab;
    }
  }
);

const formatFollowDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const formatFollowerText = (dateString) => {
  const formatted = formatFollowDate(dateString);
  return formatted ? `於 ${formatted} 追蹤了你` : '';
};

const formatFollowingText = (dateString) => {
  const formatted = formatFollowDate(dateString);
  return formatted ? `在 ${formatted} 開始追蹤` : '';
};

// Filter options
const filterOptions = [
  {
    id: 1,
    label: '追蹤日期',
    sortKey: 'followed_at',
    defaultOrder: 'desc',
    ascText: '早到晚',
    descText: '晚到早'
  },
  {
    id: 2,
    label: '名稱',
    sortKey: ['nickname', 'username'],
    defaultOrder: 'asc',
    ascText: 'A-Z',
    descText: 'Z-A'
  }
];

// Tabs (動態更新計數)
const tabs = computed(() => [
  { id: 'followers', label: '追蹤者', count: followers.value.length },
  { id: 'following', label: '追蹤中', count: following.value.length }
]);

// Computed - 依搜尋條件過濾列表
const filteredFollowers = computed(() => {
  const list = followers.value || [];
  if (!searchQuery.value) return list;

  const query = searchQuery.value.toLowerCase();
  return list.filter(user => {
    const nickname = (user.nickname || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const displayName = (user.display_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return [nickname, username, displayName, email].some(field => field.includes(query));
  });
});

const filteredFollowing = computed(() => {
  const list = following.value || [];
  if (!searchQuery.value) return list;

  const query = searchQuery.value.toLowerCase();
  return list.filter(user => {
    const nickname = (user.nickname || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const displayName = (user.display_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return [nickname, username, displayName, email].some(field => field.includes(query));
  });
});

// 顯示的使用者列表（經過排序）
const displayedUsers = computed(() => {
  return sortedDisplayItems.value.length > 0
    ? sortedDisplayItems.value
    : (activeTab.value === 'followers' ? filteredFollowers.value : filteredFollowing.value);
});

// 處理排序後的資料
const handleSortedItems = (items) => {
  sortedDisplayItems.value = items;
};

const handleTabClick = (tabId) => {
  if (validTabs.includes(tabId)) {
    activeTab.value = tabId;
    router.replace({
      path: route.path,
      query: { ...route.query, tab: tabId }
    });
  }
};

// API Methods - 載入資料
const loadFollowers = async () => {
  try {
    isLoading.value = true;
    const data = await getMyFollowers({
      page: 1,
      pageSize: 100,
      sortBy: 'followed_at',
      sortDirection: 'desc',
      search: searchQuery.value,
    });
    followers.value = data;
  } catch (error) {
    console.error('載入追蹤者列表失敗:', error);
    alert('載入追蹤者列表失敗，請稍後再試');
  } finally {
    isLoading.value = false;
  }
};

const loadFollowing = async () => {
  try {
    isLoading.value = true;
    const data = await getMyFollowing({
      page: 1,
      pageSize: 100,
      sortBy: 'followed_at',
      sortDirection: 'desc',
      search: searchQuery.value
    });
    following.value = data;
  } catch (error) {
    console.error('載入追蹤中列表失敗:', error);
    alert('載入追蹤中列表失敗，請稍後再試');
  } finally {
    isLoading.value = false;
  }
};

// 追蹤/取消追蹤操作
const toggleFollow = async (user) => {
  try {
    const targetUserId = user.user_id;
    if (!targetUserId) return;

    if (user.is_following_back) {
      // 取消追蹤
      await unfollowUser(targetUserId);
      user.is_following_back = false;

      // 從追蹤中列表移除
      const index = following.value.findIndex(f => f.user_id === targetUserId);
      if (index > -1) {
        following.value.splice(index, 1);
      }
    } else {
      // 追蹤回去
      await followUser(targetUserId);
      user.is_following_back = true;

      // 重新載入追蹤中列表
      await loadFollowing();
    }

    // 重新載入追蹤者列表以更新狀態
    await loadFollowers();
  } catch (error) {
    console.error('操作失敗:', error);
    alert(error.message || '操作失敗，請稍後再試');
    if (typeof user.is_following_back === 'boolean') {
      user.is_following_back = !user.is_following_back; // 還原狀態
    }
  }
};

const unfollow = async (user) => {
  try {
    const targetUserId = user.user_id;
    if (!targetUserId) return;

    await unfollowUser(targetUserId);

    // 從追蹤中列表移除
    const index = following.value.findIndex(f => f.user_id === targetUserId);
    if (index > -1) {
      following.value.splice(index, 1);
    }

    // 更新追蹤者列表中的狀態
    const followerIndex = followers.value.findIndex(f => f.user_id === targetUserId);
    if (followerIndex > -1) {
      followers.value[followerIndex].is_following_back = false;
    }
  } catch (error) {
    console.error('取消追蹤失敗:', error);
    alert(error.message || '取消追蹤失敗，請稍後再試');
  }
};

const goToUserProfile = (userId) => {
  router.push({ name: 'PublicUserProfile', params: { id: userId } });
};

// 初始化載入資料
onMounted(async () => {
  await Promise.all([loadFollowers(), loadFollowing()]);
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.my-followers-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 0 0 30px 0;
  overflow: hidden;
}

.followers-container {
  max-width: 1600px;
  min-height: 70vh;
  margin: 0 auto;
  padding: 0 20px;
  overflow: hidden;
}

// Breadcrumb
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;

  .breadcrumb-link {
    color: $primary;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #5fa795;
    }
  }

  i {
    font-size: 12px;
    color: #999;
  }

  .breadcrumb-current {
    color: #1e1e1e;
  }
}

// Tabs
.tabs-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: -18px;

  .tab-count {
    color: #999;
  }

  &:hover {
    color: $primary;
  }

  &.active {
    color: $primary;
    border-bottom-color: $primary;

    .tab-count {
      color: $primary;
    }
  }
}

// Search Bar
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;

  i.bi-search {
    font-size: 16px;
    color: #999;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    outline: none;

    &::placeholder {
      color: #999;
    }
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #f9f9f9;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 14px;
    }

    &:hover {
      background: #f0f0f0;
    }
  }
}

// Filter Tabs Wrapper (添加底部間距)
.followers-container {
  :deep(.filter-tabs-wrapper) {
    margin-bottom: 30px;
  }
}

// Users List
.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

// User List Animation
.user-list-move {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.user-list-enter-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.user-list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
  position: absolute;
  width: calc(100% - 40px);
}

.user-list-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.user-list-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

// Skeleton User Card
.skeleton-user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-name {
  width: 120px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-follow-date {
  width: 80px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-button {
  width: 80px;
  height: 32px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .user-clickable-area {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
    cursor: pointer;
    transition: opacity 0.3s;

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
    }

    .user-follow-date {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #999;
      margin: 0;
    }
  }

  .follow-btn {
    padding: 8px 20px;
    background: white;
    border: 1px solid $primary;
    border-radius: 6px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: $primary;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;

    &:hover {
      background: $primary;
      color: white;
    }

    &.following {
      background: $primary;
      color: white;

      &:hover {
        background: #dc3545;
        border-color: #dc3545;

        .btn-text {
          display: none;
        }

        &::after {
          content: '取消追蹤';
        }
      }
    }
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  i {
    font-size: 60px;
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

// Responsive
@media (max-width: 767.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .followers-container {
    padding: 0 15px;

    :deep(.filter-tabs-wrapper) {
      margin-bottom: 25px;
    }
  }

  .user-card {
    flex-wrap: wrap;
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .followers-container {
    padding: 0 10px;

    :deep(.filter-tabs-wrapper) {
      margin-bottom: 20px;
    }
  }

  .breadcrumb {
    font-size: 12px;
  }

  .tabs-section {
    gap: 12px;
  }

  .tab-btn {
    font-size: 15px;
  }

  .user-card {
    padding: 16px;

    .user-avatar {
      width: 40px;
      height: 40px;
    }

    .user-info {
      .user-name {
        font-size: 14px;
      }

      .user-follow-date {
        font-size: 12px;
      }
    }

    .follow-btn {
      padding: 6px 16px;
      font-size: 13px;
    }
  }

  .empty-state {
    padding: 60px 20px;

    i {
      font-size: 50px;
    }

    p {
      font-size: 13px;
    }
  }
}
</style>
