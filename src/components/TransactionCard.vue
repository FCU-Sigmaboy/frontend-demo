<template>
  <div class="transaction-card">
    <!-- Product Name -->
    <h3 class="product-name">{{ productName }}</h3>

    <!-- Unlisted Status Warning -->
    <div v-if="!listingStatus" class="unlisted-warning">
      <i class="bi bi-exclamation-circle-fill"></i>
      <span>此物品已下架</span>
    </div>

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
      <p class="description">{{ description }}</p>
    </div>

    <div class="divider"></div>

    <!-- Seller Info Section -->
    <div class="section">
      <h4 class="section-title">提供者資訊</h4>
      <div class="seller-info" @click="goToSellerProfile">
        <img :src="sellerAvatar" :alt="sellerName" class="seller-avatar" />
        <div class="seller-details">
          <p class="seller-name">{{ sellerName }}</p>
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
        class="btn-primary"
        :disabled="!listingStatus"
        @click="handleMessage"
      >
        {{ listingStatus ? '私訊詢問' : '物品已下架' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatRelativeTime } from '@/utils/timeFormat';

const router = useRouter();

const props = defineProps({
  productName: {
    type: String,
    default: '物品名稱'
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
  rating: {
    type: [String, Number],
    default: 0
  }
});

const emit = defineEmits(['message']);

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

const handleMessage = () => {
  emit('message');
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

.product-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
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

.description {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  margin: 0;
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
}

.seller-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1e1e1e;
  margin: 0;
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
