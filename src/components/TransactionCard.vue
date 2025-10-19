<template>
  <div class="transaction-card">
    <!-- Product Name -->
    <h3 class="product-name">{{ productName }}</h3>

    <!-- Badges -->
    <div class="badges">
      <span v-if="isFree" class="badge free-badge">免費贈送</span>
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
      <span>發布於 {{ postedTime }}</span>
    </div>

    <div class="divider"></div>

    <!-- Description Section -->
    <div class="section">
      <h4 class="section-title">物品描述</h4>
      <p class="description">{{ description }}</p>
    </div>

    <div class="divider"></div>

    <!-- Seller Info Section -->
    <div class="section">
      <h4 class="section-title">提供者資訊</h4>
      <div class="seller-info">
        <img :src="sellerAvatar" :alt="sellerName" class="seller-avatar" />
        <div class="seller-details">
          <p class="seller-name">{{ sellerName }}</p>
          <div class="seller-rating">
            <i class="bi bi-star-fill"></i>
            <span>{{ rating }}</span>
            <span class="rating-text">平均評價星數</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Action Buttons -->
    <div class="actions">
      <button class="btn-primary" @click="handleTransaction">
        {{ isFree ? '立即索取' : '立即交易' }}
      </button>
      <button class="btn-secondary" @click="handleMessage">
        私訊詢問
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  productName: {
    type: String,
    default: '物品名稱'
  },
  isFree: {
    type: Boolean,
    default: false
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
  rating: {
    type: Number,
    default: 4.5
  }
});

const emit = defineEmits(['transaction', 'message']);

const handleTransaction = () => {
  emit('transaction');
};

const handleMessage = () => {
  emit('message');
};
</script>

<style scoped lang="scss">
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

.free-badge {
  background-color: #6fb8a5;
  color: white;
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
    color: #6fb8a5;
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

.btn-primary,
.btn-secondary {
  width: 100%;
  padding: 12px 24px;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-primary {
  background-color: #6fb8a5;
  color: white;

  &:hover {
    background-color: #5fa795;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
  }
}

.btn-secondary {
  background-color: white;
  color: #6fb8a5;
  border: 1px solid #6fb8a5;

  &:hover {
    background-color: #f5f5f5;
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

  .btn-primary,
  .btn-secondary {
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

  .btn-primary,
  .btn-secondary {
    font-size: 14px;
    padding: 10px 20px;
  }
}
</style>
