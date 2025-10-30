<template>
  <div class="product-card">
    <!-- Card Header -->
    <div class="card-header">
      <div class="seller-info" @click.stop="goToSellerProfile">
        <img :src="product.user.profile_picture_url" :alt="product.user.nickname" class="seller-avatar" />
        <span class="seller-name">{{ product.user.nickname }}</span>
      </div>
      <button class="contact-btn" @click.stop="handleContact">
        私訊此商品
      </button>
    </div>

    <!-- Product Image with Favorite Button -->
    <div class="product-image-wrapper">
      <img :src="product.image_url" :alt="product.title" class="product-image" />
      
    </div>

    <!-- Card Body -->
    <div class="product-body">
      <!-- Product Name and Favorite Button -->
       <div class="name-and-favorite-button-wrapper">
        <h5 class="product-name">{{ product.title }}</h5>

        <!-- Favorite Button -->
        <button
          class="favorite-btn"
          :class="{ active: isFavorite }"
          @click.stop="toggleFavorite"
        >
          <i :class="isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
        </button>
      </div>

      <!-- Price -->
      <p class="product-price"><i class="bi bi-leaf points-icon" style="font-size: 1rem;"></i> {{ product.price }} </p>

      <!-- Location and Distance -->
      <div class="product-meta">
        <i class="bi bi-geo-alt-fill"></i>
        <span>{{ product.formatted_address }}</span>
        <span class="separator">•</span>
        <span>{{ Math.round(product.distance_km * 100) / 100 }} km</span>
      </div>

      <!-- Posted Time -->
      <div class="product-meta">
        <i class="bi bi-clock-fill"></i>
        <span>{{ formattedTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import { formatRelativeTime } from '@/utils/timeFormat';

const router = useRouter();
const favoritesStore = useFavoritesStore();

const props = defineProps({
  product: {
    type: Object,
    required: true,
    default: () => ({
      item_id: 1,
      title: '物品名稱',
      image_url: 'https://placehold.co/600x400',
      price: 700,
      distance_km: '0.5',
      formatted_address: '台中市西屯區',
      created_at: '2024-06-01T12:00:00Z',
      updated_at: '2024-06-01T12:00:00Z',
      favorited_at: '2024-08-01T12:00:00Z',
      favorites_count: 10,
      user: {
        id: "a1b2c3d4-e5f6-4a5b-8c9d-123456789abc",
        nickname: '提供者名稱',
        profile_picture_url: 'https://placehold.co/50x50'
      }
    })
  }
});

const emit = defineEmits(['contact-seller']);

// 檢查是否已收藏
const isFavorite = computed(() => {
  return props.product.favorited_at !== undefined;
});

// 格式化時間
const formattedTime = computed(() => {
  return formatRelativeTime(props.product.created_at);
});

// 切換收藏狀態
const toggleFavorite = () => {
  favoritesStore.toggleFavorite(props.product);
};

const handleContact = () => {
  emit('contact-seller', props.product.item_id);
};

const goToSellerProfile = () => {
  router.push({ name: 'PublicUserProfile', params: { id: props.product.user.id } });
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.product-card {
  background: white;
  border: 0.1px solid $primary;
  border-radius: 5px;
  overflow: hidden;
  transition: all 0.3s;
  height: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-bottom: 0.5px solid #e0e0e0;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.7;
  }

  .seller-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .seller-name {
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.contact-btn {
  background-color: $primary;
  border: none;
  border-radius: 5px;
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: white;
  padding: 4px 10px;
  height: 32px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background-color: #5fa795;
    transform: translateY(-1px);
  }
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75.76%; // Maintain aspect ratio
  overflow: hidden;
  background: #f5f5f5;

  .product-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-body {
  padding: 15px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}


.name-and-favorite-button-wrapper {
    display: flex;
    align-items: center;
    top: 10px;
    right: 10px;

    .favorite-btn {
      display: block;
      bottom: 10px;
      right: 10px;
      width: 26.4px;
      height: 26.4px;
      border-radius: 50%;
      background-color: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      cursor: pointer;
      transition: all 0.3s;
    
      i {
        font-size: 16px;
        color: #1e1e1e;
      }
    
      &.active i,
      &:hover i {
        color: #ff6b6b;
      }
    
      &:hover {
        background-color: #fff;
        transform: scale(1.1);
      }
    }
}

.product-name {
  flex: 8;
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #1e1e1e;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #1e1e1e;
  margin: 0;
  font-weight: 400;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 4.95px;
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555555;
  line-height: 1.5;

  i {
    font-size: 16px;
    flex-shrink: 0;
  }

  .separator {
    margin: 0 2px;
  }
}

@media (max-width: 991.98px) {
  .product-name {
    font-size: 14px;
  }

  .product-price {
    font-size: 14px;
  }

  .seller-name {
    font-size: 13px;
  }

  .product-meta {
    font-size: 13px;

    i {
      font-size: 15px;
    }
  }
}

@media (max-width: 575.98px) {
  .card-header {
    padding: 8px;
  }

  .contact-btn {
    font-size: 12px;
    padding: 3px 8px;
    height: 28px;
  }

  .product-body {
    padding: 12px;
  }

  .product-name {
    font-size: 13px;
  }

  .product-price {
    font-size: 13px;
  }

  .seller-name {
    font-size: 12px;
  }

  .product-meta {
    font-size: 12px;

    i {
      font-size: 14px;
    }
  }
}
</style>
