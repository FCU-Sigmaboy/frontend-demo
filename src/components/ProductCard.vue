<template>
  <BCard class="product-card" no-body>
    <!-- Product Image with Favorite Button -->
    <div class="product-image-wrapper">
      <img :src="product.image" :alt="product.name" class="product-image" />
      <BButton
        variant="light"
        class="favorite-btn"
        @click="toggleFavorite"
      >
        <i :class="isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
      </BButton>
    </div>

    <!-- Card Body -->
    <BCardBody class="product-body">
      <!-- Seller Info -->
      <div class="seller-info d-flex align-items-center mb-2">
        <img :src="product.sellerAvatar" :alt="product.sellerName" class="seller-avatar" />
        <span class="seller-name">{{ product.sellerName }}</span>
        <BBadge variant="success" class="seller-badge ms-auto">私訊此商品</BBadge>
      </div>

      <!-- Product Name -->
      <h5 class="product-name">{{ product.name }}</h5>

      <!-- Price -->
      <p class="product-price">{{ product.price }}P</p>

      <!-- Location and Distance -->
      <div class="product-location d-flex align-items-center">
        <i class="bi bi-geo-alt"></i>
        <span>{{ product.location }}</span>
        <span class="mx-1">•</span>
        <span>{{ product.distance }}</span>
      </div>

      <!-- Posted Time -->
      <div class="product-time d-flex align-items-center">
        <i class="bi bi-clock"></i>
        <span>{{ product.postedTime }}</span>
      </div>
    </BCardBody>
  </BCard>
</template>

<script setup>
import { ref } from 'vue';
import { BCard, BCardBody, BButton, BBadge } from 'bootstrap-vue-next';

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
</script>

<style scoped lang="scss">
.product-card {
  border: 3.3px solid #64978a;
  border-radius: 23.1px;
  overflow: hidden;
  transition: all 0.3s;
  height: 100%;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; // 4:3 aspect ratio
  overflow: hidden;

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
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    border-radius: 8.25px;
    background-color: rgba(255, 255, 255, 0.8);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.3s;

    i {
      font-size: 20px;
      color: #ff6b6b;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.95);
      transform: scale(1.1);
    }
  }
}

.product-body {
  padding: 16px;
  background-color: #fff;
}

.seller-info {
  margin-bottom: 12px;

  .seller-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 10px;
  }

  .seller-name {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16.5px;
    color: #000;
    flex: 1;
  }

  .seller-badge {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13.2px;
    font-weight: 500;
    background-color: #99a072;
    color: #000;
    border-radius: 13.2px;
    padding: 6px 14px;
    border: 1.65px solid #99a072;
    box-shadow: none;
    cursor: pointer;
    transition: all 0.3s;
    line-height: 33px;

    &:hover {
      background-color: #8a9164;
      border-color: #8a9164;
      transform: translateY(-2px);
    }
  }
}

.product-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 26.4px;
  color: #000;
  margin-bottom: 8px;
  font-weight: 400;
}

.product-price {
  font-family: 'Inter', sans-serif;
  font-size: 23.1px;
  color: #000;
  margin-bottom: 12px;
  font-weight: 400;
}

.product-location,
.product-time {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 19.8px;
  color: #555555;
  margin-bottom: 6px;
  line-height: 33px;

  i {
    margin-right: 6px;
    font-size: 23.1px;
  }
}

@media (max-width: 767.98px) {
  .product-name {
    font-size: 20px;
  }

  .product-price {
    font-size: 18px;
  }

  .seller-name {
    font-size: 14px;
  }

  .product-location,
  .product-time {
    font-size: 14px;
  }
}
</style>
