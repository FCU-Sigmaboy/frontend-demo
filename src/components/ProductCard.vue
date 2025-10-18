<template>
  <div class="product-card">
    <!-- Card Header -->
    <div class="card-header">
      <div class="seller-info">
        <img :src="product.sellerAvatar" :alt="product.sellerName" class="seller-avatar" />
        <span class="seller-name">{{ product.sellerName }}</span>
      </div>
      <button class="contact-btn" @click.stop="handleContact">
        私訊此商品
      </button>
    </div>

    <!-- Product Image with Favorite Button -->
    <div class="product-image-wrapper">
      <img :src="product.image" :alt="product.name" class="product-image" />
      <button
        class="favorite-btn"
        :class="{ active: isFavorite }"
        @click.stop="toggleFavorite"
      >
        <i :class="isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
      </button>
    </div>

    <!-- Card Body -->
    <div class="product-body">
      <!-- Product Name -->
      <h5 class="product-name">{{ product.name }}</h5>

      <!-- Price -->
      <p class="product-price">{{ product.price }}P</p>

      <!-- Location and Distance -->
      <div class="product-meta">
        <i class="bi bi-geo-alt-fill"></i>
        <span>{{ product.location }}</span>
        <span class="separator">•</span>
        <span>{{ product.distance }}</span>
      </div>

      <!-- Posted Time -->
      <div class="product-meta">
        <i class="bi bi-clock-fill"></i>
        <span>{{ product.postedTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  product: {
    type: Object,
    required: true,
    default: () => ({
      id: 1,
      name: '物品名稱',
      price: 700,
      image: '',
      sellerName: '提供者名稱',
      sellerAvatar: '',
      location: '台中市西屯區',
      distance: '500m',
      postedTime: '3天前'
    })
  }
});

const emit = defineEmits(['favorite-toggle', 'contact-seller']);

const isFavorite = ref(false);

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value;
  emit('favorite-toggle', { productId: props.product.id, isFavorite: isFavorite.value });
};

const handleContact = () => {
  emit('contact-seller', props.product.id);
};
</script>

<style scoped lang="scss">
.product-card {
  background: white;
  border: 0.1px solid #1e1e1e;
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
  background-color: #6fb8a5;
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

  .favorite-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 26.4px;
    height: 26.4px;
    border-radius: 50%;
    background-color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

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

.product-body {
  padding: 15px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.product-name {
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
