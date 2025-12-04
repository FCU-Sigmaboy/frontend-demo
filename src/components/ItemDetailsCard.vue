<template>
  <div class="transaction-card" @click="closeReportMenu">
    <!-- Product Name and Favorite -->
    <div class="product-header">
      <h3 class="product-name">{{ productName }}</h3>
      <div class="header-actions">
        <button
          class="favorite-btn"
          :class="{ active: isFavorite }"
          @click.stop="handleToggleFavorite"
          :title="isFavorite ? '取消收藏' : '加入收藏'"
        >
          <i :class="['bi', isFavorite ? 'bi-heart-fill' : 'bi-heart']"></i>
        </button>
        <button
          v-if="!isOwner"
          class="report-btn"
          @click.stop="toggleReportMenu"
          ref="reportBtnRef"
        >
          <i class="bi bi-flag"></i>
          <span class="hint-text">檢舉</span>
        </button>
      </div>
    </div>

    <!-- Report Context Menu -->
    <Transition name="menu-fade">
      <div
        v-if="showReportMenu"
        class="context-menu"
        :style="reportMenuStyle"
        @click.stop
      >
        <div class="context-menu-item danger" @click="handleReport">
          <i class="bi bi-flag"></i> 檢舉物品
        </div>
      </div>
    </Transition>

    <!-- Unlisted Status Warning -->
    <div v-if="!listingStatus || isInTransaction" class="unlisted-warning">
      <i class="bi bi-exclamation-circle-fill"></i>
      <span v-if="isInTransaction">此物品{{ transactionStatusText }}（已下架）</span>
      <span v-else>此物品已下架</span>
    </div>

    <!-- Price and Condition -->
    <div class="price-condition-row">
      <div v-if="price !== null && price !== undefined" class="price-info">
        <i class="bi bi-leaf"></i>
        <span class="price">{{ price }} 點數</span>
      </div>
      <div v-if="condition" class="condition-badge">
        <i class="bi bi-box-seam"></i>
        <span>{{ condition }}</span>
      </div>
    </div>

    <!-- Carbon Value -->
    <!-- <div v-if="carbonValue !== null && carbonValue !== undefined" class="carbon-info">
      <i class="bi bi-tree-fill"></i>
      <span>減碳 {{ carbonValue }} kg CO₂</span>
    </div> -->

    <!-- Badges -->
    <div class="badges">
      <span v-for="tag in tags" :key="tag" class="badge tag-badge">{{ tag }}</span>
    </div>

    <!-- Location Info -->
    <div class="info-row">
      <i class="bi bi-geo-alt-fill"></i>
      <span>{{ location }}</span>
      <span class="separator">•</span>
      <span>{{ distance }}</span>
    </div>

    <!-- Posted Time -->
    <div class="info-row">
      <i class="bi bi-clock-fill"></i>
      <span>發布於 {{ formattedPostedTime }}</span>
    </div>

    <!-- Description Section -->
    <div class="section">
      <h4 class="section-title">物品描述</h4>
      <div class="description-wrapper">
        <p class="description">
          {{ displayedDescription }}
          <span v-if="shouldTruncate && !isExpanded" class="expand-trigger" @click="toggleExpand">...展開更多</span>
          <span v-if="shouldTruncate && isExpanded" class="expand-trigger" @click="toggleExpand"> 顯示更少</span>
        </p>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Seller Info Section -->
    <div class="section">
      <h4 class="section-title">提供者資訊</h4>
      <div class="seller-info" @click="goToSellerProfile">
        <img :src="sellerAvatar" :alt="sellerName" class="seller-avatar" />
        <div class="seller-details">
          <div class="seller-name-row">
            <p class="seller-name">{{ sellerName }}</p>
            <button
              v-if="!isOwner && authStore.user"
              :class="['follow-btn', { following: isFollowing, loading: isLoadingFollow }]"
              @click.stop="toggleFollow"
              :disabled="isLoadingFollow"
            >
              <template v-if="isLoadingFollow">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </template>
              <template v-else>
                <i :class="['bi', isFollowing ? 'bi-check' : 'bi-plus']"></i>
                <span>{{ isFollowing ? '已追蹤' : '追蹤' }}</span>
              </template>
            </button>
          </div>
          <div class="seller-rating">
            <i class="bi bi-star-fill"></i>
            <span>{{ formattedRating }}</span>
            <span class="rating-text">平均評價星數</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Action Buttons -->
    <div class="actions">
      <button
        v-if="!isOwner"
        class="btn-primary"
        :disabled="!listingStatus"
        @click="handleMessage"
      >
        {{ listingStatus ? '私訊詢問' : '物品已下架' }}
      </button>
         <!-- /listing/44/edit -->

      <button
        v-else
        class="btn-primary"
        :disabled="isInTransaction"
        @click="router.push({ name: 'EditListing', params: { id: props.productId } })"
      >
        {{ isInTransaction ? '物品交易中或已售出無法編輯' : '編輯物品' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { formatRelativeTime } from '@/utils/timeFormat';
import { useAuthStore } from '@/stores/auth';
import { useFavoritesStore } from '@/stores/favorites';
import { createOrGetConversation } from '@/api/conversation';
import { getPublicUserProfile } from '@/api/get_userProfileAPI';
import { followUser, unfollowUser } from '@/api/followAPI';

const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

const isOwner = computed(() => {
  return authStore.user && authStore.user.id === props.sellerId;
});

const router = useRouter();

// Description expansion state
const isExpanded = ref(false);
const MAX_DESCRIPTION_LENGTH = 100;

// Report menu state
const showReportMenu = ref(false);
const reportBtnRef = ref(null);
const reportMenuStyle = ref({});

const toggleReportMenu = () => {
  if (!showReportMenu.value && reportBtnRef.value) {
    const rect = reportBtnRef.value.getBoundingClientRect();
    reportMenuStyle.value = {
      top: `${rect.bottom + 5}px`,
      right: `${window.innerWidth - rect.right}px`
    };
  }
  showReportMenu.value = !showReportMenu.value;
};

const closeReportMenu = () => {
  showReportMenu.value = false;
};

const handleReport = () => {
  closeReportMenu();
  if (!authStore.user) {
    alert('請先登入才能檢舉物品');
    authStore.signInWithGoogle();
    return;
  }
  // TODO: Implement report functionality
  alert('檢舉功能開發中\n物品 ID: ' + props.productId);
  console.log('Report item:', props.productId);
};

// Close report menu when clicking outside
const handleClickOutside = (event) => {
  if (showReportMenu.value && reportBtnRef.value && !reportBtnRef.value.contains(event.target)) {
    closeReportMenu();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const props = defineProps({
  productId: {
    type: String,
    default: ''
  },
  productName: {
    type: String,
    default: '物品名稱'
  },
  price: {
    type: Number,
    default: null
  },
  condition: {
    type: String,
    default: null
  },
  carbonValue: {
    type: Number,
    default: null
  },
  listingStatus: {
    type: Boolean,
    default: true
  },
  tags: {
    type: Array,
    default: () => ['標籤 1', '標籤 2']
  },
  location: {
    type: String,
    default: '台北市北投區'
  },
  distance: {
    type: String,
    default: '4.2公里'
  },
  postedTime: {
    type: String,
    default: '3天前'
  },
  description: {
    type: String,
    default: '物品描述...'
  },
  sellerName: {
    type: String,
    default: '提供者名稱'
  },
  sellerAvatar: {
    type: String,
    default: 'https://placehold.co/49/1e1e1e/ffffff?text=A'
  },
  sellerId: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  rating: {
    type: [String, Number],
    default: 0
  },
  isInTransaction: {
    type: Boolean,
    default: false
  },
  transactionStatusText: {
    type: String,
    default: null
  }
});

// Favorites Logic
const isFavorite = computed(() => {
  return favoritesStore.isFavorite(props.productId);
});

const handleToggleFavorite = async () => {
  if (!authStore.user) {
    await authStore.signInWithGoogle();
    return;
  }
  
  const item = {
    item_id: Number(props.productId),
    title: props.productName,
    price: props.price,
    image_url: props.imageUrl || props.sellerAvatar, 
  };
  
  await favoritesStore.toggleFavorite(item);
};

// Follow Logic
const isFollowing = ref(false);
const isLoadingFollow = ref(false);

const checkFollowStatus = async () => {
  if (!authStore.user || !props.sellerId || isOwner.value) return;
  
  try {
    const profile = await getPublicUserProfile(props.sellerId);
    if (profile) {
      isFollowing.value = !!profile.followed_at;
    }
  } catch (error) {
    console.error('Failed to check follow status:', error);
  }
};

const toggleFollow = async () => {
  if (!authStore.user) {
    await authStore.signInWithGoogle();
    return;
  }
  
  if (isLoadingFollow.value) return;
  
  try {
    isLoadingFollow.value = true;
    
    if (isFollowing.value) {
      await unfollowUser(props.sellerId);
      isFollowing.value = false;
    } else {
      await followUser(props.sellerId);
      isFollowing.value = true;
    }
  } catch (error) {
    console.error('Follow action failed:', error);
    alert('操作失敗，請稍後再試');
  } finally {
    isLoadingFollow.value = false;
  }
};

// Initialize
onMounted(async () => {
  if (props.sellerId) {
    checkFollowStatus();
  }
  // Ensure favorites are loaded
  if (authStore.user) {
    await favoritesStore.loadFavorites();
  }
});

watch(() => props.sellerId, (newId) => {
  if (newId) {
    checkFollowStatus();
  }
});

watch(() => authStore.user, async (newUser) => {
  if (newUser) {
    await favoritesStore.loadFavorites();
  }
});

// 格式化相對時間
const formattedPostedTime = computed(() => {
  return formatRelativeTime(props.postedTime);
});

// 格式化評分顯示
const formattedRating = computed(() => {
  if (!props.rating) return '0.0';
  const ratingNum = typeof props.rating === 'string' ? parseFloat(props.rating) : props.rating;
  return ratingNum.toFixed(1);
});

// Description truncation logic
const shouldTruncate = computed(() => {
  return props.description && props.description.length > MAX_DESCRIPTION_LENGTH;
});

const displayedDescription = computed(() => {
  if (!shouldTruncate.value || isExpanded.value) {
    return props.description;
  }
  return props.description.substring(0, MAX_DESCRIPTION_LENGTH);
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const handleMessage = async () => {
  // 檢查是否登入
  if (!authStore.user) {
    await authStore.signInWithGoogle();
    return;
  }

  // 檢查是否為自己的商品
  if (isOwner.value) {
    alert('無法與自己的商品發起對話');
    return;
  }

  try {
    // 使用 v2 API: createOrGetConversation(otherUserId, initialItemId)
    const conversation = await createOrGetConversation(
      props.sellerId,
      props.productId
    );

    // 導航到訊息頁面，並傳遞物品資訊以便在輸入框上方顯示
    router.push({
      name: 'Messages',
      query: {
        conversationId: conversation.conversation_id,
        itemId: props.productId,
        itemTitle: props.productName
      }
    });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    alert('無法開啟對話，請稍後再試');
  }
};

const goToSellerProfile = () => {
  router.push({ name: 'PublicUserProfile', params: { id: props.sellerId } });
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.transaction-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.product-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.favorite-btn,
.report-btn {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;

  i {
    font-size: 24px;
    color: #ccc;
    transition: color 0.3s;
  }
  
  &:hover {
    transform: scale(1.1);

    i {
      color: #999;
    }
  }
}

.favorite-btn {
  &.active i {
    color: #ff4757;
    animation: heart-pulse 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  &:hover.active i {
    color: #ff4757;
  }
}

.report-btn {
  i {
    font-size: 22px;
  }

  .hint-text {
    position: absolute;
    bottom: -35px;
    left: 50%;
    transform: translateX(-50%) scale(0);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10000;

    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 5px solid rgba(0, 0, 0, 0.85);
    }
  }

  &:hover {
    i {
      color: #ff4757;
    }

    .hint-text {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
  }
}

@keyframes heart-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.unlisted-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #856404;

  i {
    font-size: 18px;
    color: #ffc107;
  }
}

.badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  border-radius: 15px;
  padding: 5px 12px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.tag-badge {
  background-color: #f5f5f5;
  color: #1e1e1e;
  border: 1px solid #d0d0d0;
}

.price-condition-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Noto Sans TC', sans-serif;

  i {
    font-size: 20px;
    color: $primary;
  }

  .price {
    font-size: 20px;
    font-weight: 600;
    color: $primary;
  }
}

.condition-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #e8f5f1;
  border: 1px solid $primary;
  border-radius: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: $primary;

  i {
    font-size: 14px;
  }
}

.carbon-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #e8f5e9;
  border: 1px solid #4caf50;
  border-radius: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #2e7d32;

  i {
    font-size: 16px;
    color: #4caf50;
  }
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;

  i {
    font-size: 16px;
    color: $primary;
  }

  .separator {
    margin: 0 4px;
  }
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 8px 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
}

.description-wrapper {
  position: relative;
}

.description {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.expand-trigger {
  color: $primary;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  margin-left: 4px;

  &:hover {
    color: #5fa795;
    text-decoration: underline;
  }
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.7;
  }
}

.seller-avatar {
  width: 49px;
  height: 49px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.seller-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.seller-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.seller-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1e1e1e;
  margin: 0;
}

.follow-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: $primary;
  border: 1px solid $primary;
  border-radius: 15px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  i {
    font-size: 14px;
  }
  
  .spinner-border {
    width: 12px;
    height: 12px;
    border-width: 1px;
  }

  &:hover:not(:disabled) {
    background: #5fa795;
    border-color: #5fa795;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &.following {
    background: white;
    color: $primary;
    border-color: $primary;

    &:hover:not(:disabled) {
      background: #ffebee;
      color: #dc3545;
      border-color: #dc3545;
      
      i::before {
        content: "\f62a"; /* bi-x */
      }
      
      span {
        display: none;
      }
      
      &::after {
        content: "取消";
      }
    }
  }
}

.seller-rating {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;

  i {
    color: #ffc107;
    font-size: 16px;
  }

  .rating-text {
    margin-left: 3px;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary {
  width: 100%;
  padding: 12px 24px;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  background-color: $primary;
  color: white;

  &:hover:not(:disabled) {
    background-color: #5fa795;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
  }

  &:disabled {
    background-color: #d0d0d0;
    color: #999;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

// Context Menu Styles
.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 160px;
  overflow: hidden;

  .context-menu-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #333;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }

    i {
      font-size: 16px;
      color: #666;
    }

    &.danger {
      color: #ff4757;

      i {
        color: #ff4757;
      }

      &:hover {
        background: #fff0f0;
      }
    }
  }
}

// Menu fade animation
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease-out;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

// Responsive Design
@media (max-width: 991.98px) {
  .transaction-card {
    padding: 20px;
    gap: 14px;
  }

  .product-name {
    font-size: 22px;
  }

  .unlisted-warning {
    padding: 8px 14px;
    font-size: 13px;

    i {
      font-size: 16px;
    }
  }

  .price-info {
    i {
      font-size: 18px;
    }

    .price {
      font-size: 18px;
    }
  }

  .condition-badge,
  .carbon-info {
    font-size: 12px;
    padding: 5px 10px;
  }

  .badge {
    font-size: 11px;
    padding: 4px 10px;
  }

  .info-row {
    font-size: 13px;

    i {
      font-size: 15px;
    }
  }

  .section-title {
    font-size: 17px;
  }

  .description {
    font-size: 13px;
  }

  .expand-trigger {
    font-size: 13px;
  }

  .seller-name {
    font-size: 15px;
  }

  .seller-rating {
    font-size: 13px;

    i {
      font-size: 15px;
    }
  }

  .btn-primary {
    font-size: 15px;
    padding: 11px 22px;
  }
}

@media (max-width: 575.98px) {
  .transaction-card {
    padding: 18px;
    gap: 12px;
  }

  .product-name {
    font-size: 20px;
  }

  .price-condition-row {
    gap: 12px;
  }

  .price-info {
    i {
      font-size: 16px;
    }

    .price {
      font-size: 16px;
    }
  }

  .condition-badge,
  .carbon-info {
    font-size: 11px;
    padding: 4px 8px;

    i {
      font-size: 13px;
    }
  }

  .unlisted-warning {
    padding: 8px 12px;
    font-size: 12px;

    i {
      font-size: 15px;
    }
  }

  .badge {
    font-size: 10px;
    padding: 3px 8px;
  }

  .info-row {
    font-size: 12px;

    i {
      font-size: 14px;
    }
  }

  .section-title {
    font-size: 16px;
  }

  .description {
    font-size: 12px;
  }

  .expand-trigger {
    font-size: 12px;
  }

  .seller-avatar {
    width: 44px;
    height: 44px;
  }

  .seller-name {
    font-size: 14px;
  }

  .seller-rating {
    font-size: 12px;

    i {
      font-size: 14px;
    }
  }

  .btn-primary {
    font-size: 14px;
    padding: 10px 20px;
  }
}
</style>
