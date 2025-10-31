<template>
  <div class="my-followers-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="followers-container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a href="/" class="breadcrumb-link">首頁</a>
          <i class="bi bi-chevron-right"></i>
          <span class="breadcrumb-current">我的追蹤</span>
        </nav>

        <!-- Tabs -->
        <div class="tabs-section">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
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
          <button class="filter-btn">
            <i class="bi bi-funnel"></i>
            篩選
          </button>
        </div>

        <!-- Followers List (追蹤者) -->
        <div v-show="activeTab === 'followers'" class="users-list">
          <div
            v-for="user in filteredFollowers"
            :key="user.id"
            class="user-card"
          >
            <div class="user-clickable-area" @click="goToUserProfile(user.id)">
              <img
                :src="user.avatar"
                :alt="user.name"
                class="user-avatar"
              />
              <div class="user-info">
                <h3 class="user-name">{{ user.name }}</h3>
                <p class="user-handle">@{{ user.handle }}</p>
              </div>
            </div>
            <span class="follow-date">{{ user.followDate }}</span>
            <button
              :class="['follow-btn', { following: user.isFollowing }]"
              @click.stop="toggleFollow(user)"
            >
              {{ user.isFollowing ? '追蹤中' : '追蹤回去' }}
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="filteredFollowers.length === 0" class="empty-state">
            <i class="bi bi-people"></i>
            <p>尚無追蹤者</p>
          </div>
        </div>

        <!-- Following List (追蹤中) -->
        <div v-show="activeTab === 'following'" class="users-list">
          <div
            v-for="user in filteredFollowing"
            :key="user.id"
            class="user-card"
          >
            <div class="user-clickable-area" @click="goToUserProfile(user.id)">
              <img
                :src="user.avatar"
                :alt="user.name"
                class="user-avatar"
              />
              <div class="user-info">
                <h3 class="user-name">{{ user.name }}</h3>
                <p class="user-handle">@{{ user.handle }}</p>
              </div>
            </div>
            <span class="follow-date">{{ user.followDate }}</span>
            <button
              class="follow-btn following"
              @click.stop="unfollow(user)"
            >
              追蹤中
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="filteredFollowing.length === 0" class="empty-state">
            <i class="bi bi-people"></i>
            <p>尚未追蹤任何人</p>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const router = useRouter();

// State
const userPoints = ref(500);
const activeTab = ref('followers');
const searchQuery = ref('');

const tabs = [
  { id: 'followers', label: '追蹤者', count: 4 },
  { id: 'following', label: '追蹤中', count: 3 }
];

// Mock followers data
const followers = ref([
  {
    id: 1,
    name: '使用者名稱',
    handle: '使用者帳號',
    avatar: 'https://placehold.co/48/6fb8a5/ffffff?text=U1',
    followDate: '2025/10/10',
    isFollowing: false
  },
  {
    id: 2,
    name: '使用者名稱',
    handle: '使用者帳號',
    avatar: 'https://placehold.co/48/5a9d8c/ffffff?text=U2',
    followDate: '2025/10/10',
    isFollowing: true
  },
  {
    id: 3,
    name: '使用者名稱',
    handle: '使用者帳號',
    avatar: 'https://placehold.co/48/4a8b7d/ffffff?text=U3',
    followDate: '2025/10/10',
    isFollowing: false
  },
  {
    id: 4,
    name: '使用者名稱',
    handle: '使用者帳號',
    avatar: 'https://placehold.co/48/3a7a6e/ffffff?text=U4',
    followDate: '2025/10/10',
    isFollowing: true
  }
]);

// Mock following data
const following = ref([
  {
    id: 5,
    name: '使用者名稱',
    handle: '使用者帳號',
    avatar: 'https://placehold.co/48/6fb8a5/ffffff?text=U5',
    followDate: '2025/10/10'
  },
  {
    id: 6,
    name: '使用者名稱',
    handle: '使用者帳號',
    avatar: 'https://placehold.co/48/5a9d8c/ffffff?text=U6',
    followDate: '2025/10/10'
  },
  {
    id: 7,
    name: '使用者名稱',
    handle: '使用者帳號',
    avatar: 'https://placehold.co/48/4a8b7d/ffffff?text=U7',
    followDate: '2025/10/10'
  }
]);

// Computed
const filteredFollowers = computed(() => {
  if (!searchQuery.value) return followers.value;

  return followers.value.filter(user =>
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.handle.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const filteredFollowing = computed(() => {
  if (!searchQuery.value) return following.value;

  return following.value.filter(user =>
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.handle.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Methods
const toggleFollow = (user) => {
  user.isFollowing = !user.isFollowing;

  if (user.isFollowing) {
    // Add to following list
    following.value.push({
      ...user,
      followDate: new Date().toISOString().split('T')[0].replace(/-/g, '/')
    });
    tabs[1].count++;
  } else {
    // Remove from following list
    const index = following.value.findIndex(f => f.id === user.id);
    if (index > -1) {
      following.value.splice(index, 1);
      tabs[1].count--;
    }
  }
};

const unfollow = (user) => {
  if (confirm(`確定要取消追蹤 ${user.name}？`)) {
    const index = following.value.findIndex(f => f.id === user.id);
    if (index > -1) {
      following.value.splice(index, 1);
      tabs[1].count--;
    }

    // Update followers list if user is there
    const follower = followers.value.find(f => f.id === user.id);
    if (follower) {
      follower.isFollowing = false;
    }
  }
};

const goToUserProfile = (userId) => {
  router.push({ name: 'PublicUserProfile', params: { id: userId } });
};
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
  padding: 30px 0 60px;
}

.followers-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
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

// Users List
.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

    .user-handle {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #999;
      margin: 0;
    }
  }

  .follow-date {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #999;
    flex-shrink: 0;
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

        &::before {
          content: '取消追蹤';
        }

        &::after {
          content: '';
        }
      }

      &::after {
        content: '追蹤中';
      }

      &:not(:hover)::before {
        content: '';
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
  }

  .user-card {
    flex-wrap: wrap;

    .follow-date {
      order: 4;
      width: 100%;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #f0f0f0;
    }
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .followers-container {
    padding: 0 10px;
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

      .user-handle {
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
