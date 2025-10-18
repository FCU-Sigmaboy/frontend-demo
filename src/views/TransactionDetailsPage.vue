<template>
  <div class="transaction-details-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <div class="breadcrumb-section">
        <div class="container">
          <nav class="breadcrumb">
            <a href="/" class="breadcrumb-link">首頁</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="#" class="breadcrumb-link" @click.prevent="goBack">物品詳情</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">交易</span>
          </nav>
        </div>
      </div>

      <!-- Transaction Form Section -->
      <section class="transaction-form-section">
        <div class="container">
          <div class="transaction-wrapper">
            <!-- Left Side: Transaction Info -->
            <div class="transaction-info">
              <h2 class="form-title">交易資訊</h2>

              <!-- Delivery Method -->
              <div class="form-group">
                <label class="form-label">取貨方式 *</label>
                <input
                  v-model="form.deliveryMethod"
                  type="text"
                  class="form-input"
                  placeholder="面交、7-11、全家"
                />
              </div>

              <!-- Additional Notes -->
              <div class="form-group">
                <label class="form-label">備註</label>
                <textarea
                  v-model="form.notes"
                  class="form-textarea"
                  placeholder="請輸入備註事項..."
                  rows="4"
                ></textarea>
              </div>
            </div>

            <!-- Right Side: Order Summary -->
            <div class="order-summary">
              <h2 class="form-title">訂單摘要</h2>

              <!-- Product Thumbnail -->
              <div class="product-preview">
                <img :src="product.image" alt="Product" class="product-thumbnail" />
              </div>

              <!-- Order Details -->
              <div class="order-details">
                <div class="detail-row">
                  <span class="detail-label">交易方式</span>
                  <span class="detail-value">{{ form.deliveryMethod || '-' }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">取貨地點</span>
                  <span class="detail-value">{{ product.location }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">物品點數</span>
                  <span class="detail-value">{{ product.points }}P</span>
                </div>

                <div v-if="!product.isFree" class="detail-row">
                  <span class="detail-label">運費</span>
                  <span class="detail-value">{{ shippingFee }}P</span>
                </div>

                <div class="divider"></div>

                <div class="detail-row total-row">
                  <span class="detail-label">總計</span>
                  <span class="detail-value total-value">{{ totalPoints }}P</span>
                </div>
              </div>

              <!-- Submit Button -->
              <button class="submit-btn" @click="handleSubmit" :disabled="!isFormValid">
                確認交易
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(500);

const form = ref({
  deliveryMethod: '',
  notes: ''
});

// Mock product data
const product = ref({
  id: 1,
  name: '物品名稱',
  image: 'https://via.placeholder.com/130x130/6fb8a5/ffffff?text=Product',
  location: '台北市北投區',
  points: 700,
  isFree: false // Set to true for free items
});

const shippingFee = ref(0);

// Computed
const totalPoints = computed(() => {
  if (product.value.isFree) {
    return 0;
  }
  return product.value.points + shippingFee.value;
});

const isFormValid = computed(() => {
  return form.value.deliveryMethod.trim() !== '';
});

// Methods
const goBack = () => {
  router.back();
};

const handleSubmit = () => {
  if (!isFormValid.value) {
    alert('請填寫必填欄位');
    return;
  }

  console.log('Transaction submitted:', {
    productId: product.value.id,
    form: form.value,
    totalPoints: totalPoints.value
  });

  // Show success message and redirect
  alert('交易成功！');
  router.push({ name: 'Home' });
};
</script>

<style scoped lang="scss">
.transaction-details-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

// Breadcrumb
.breadcrumb-section {
  padding: 20px 0;
  background-color: #f9f9f9;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #555;
}

.breadcrumb-link {
  color: #6fb8a5;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    color: #5fa795;
    text-decoration: underline;
  }
}

.breadcrumb-separator {
  color: #999;
}

.breadcrumb-current {
  color: #1e1e1e;
}

// Transaction Form Section
.transaction-form-section {
  padding: 30px 0;
  background-color: white;
}

.transaction-wrapper {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 50px;
  align-items: start;
}

// Transaction Info (Left Side)
.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1e1e1e;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d0d0d0;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #1e1e1e;
  transition: all 0.3s;
  background-color: white;

  &::placeholder {
    color: #999;
  }

  &:focus {
    outline: none;
    border-color: #6fb8a5;
    box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

// Order Summary (Right Side)
.order-summary {
  display: flex;
  flex-direction: column;
  gap: 25px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 25px;
  position: sticky;
  top: 80px;
}

.product-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-bottom: 1px solid #e0e0e0;
}

.product-thumbnail {
  width: 130px;
  height: 130px;
  border-radius: 8px;
  object-fit: cover;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
}

.detail-label {
  color: #555;
  font-weight: 400;
}

.detail-value {
  color: #1e1e1e;
  font-weight: 500;
  text-align: right;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 5px 0;
}

.total-row {
  font-size: 16px;
  font-weight: 600;

  .total-value {
    color: #6fb8a5;
    font-size: 18px;
  }
}

.submit-btn {
  width: 100%;
  padding: 14px 24px;
  background-color: #6fb8a5;
  color: white;
  border: none;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background-color: #5fa795;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
  }

  &:disabled {
    background-color: #d0d0d0;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

// Responsive Design
@media (max-width: 1199.98px) {
  .transaction-wrapper {
    grid-template-columns: 1fr 350px;
    gap: 40px;
  }
}

@media (max-width: 991.98px) {
  .container {
    padding: 0 15px;
  }

  .breadcrumb-section {
    padding: 15px 0;
  }

  .breadcrumb {
    font-size: 13px;
  }

  .transaction-form-section {
    padding: 25px 0;
  }

  .transaction-wrapper {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .transaction-info {
    gap: 22px;
  }

  .form-title {
    font-size: 19px;
  }

  .form-group {
    gap: 8px;
  }

  .form-label {
    font-size: 13px;
  }

  .form-input,
  .form-textarea {
    padding: 11px 14px;
    font-size: 13px;
  }

  .order-summary {
    position: static;
    gap: 22px;
    padding: 22px;
  }

  .product-preview {
    padding: 18px 0;
  }

  .product-thumbnail {
    width: 120px;
    height: 120px;
  }

  .order-details {
    gap: 13px;
  }

  .detail-row {
    font-size: 13px;
  }

  .total-row {
    font-size: 15px;

    .total-value {
      font-size: 17px;
    }
  }

  .submit-btn {
    padding: 13px 22px;
    font-size: 15px;
  }
}

@media (max-width: 575.98px) {
  .container {
    padding: 0 10px;
  }

  .breadcrumb-section {
    padding: 12px 0;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .transaction-form-section {
    padding: 20px 0;
  }

  .transaction-wrapper {
    gap: 25px;
  }

  .transaction-info {
    gap: 20px;
  }

  .form-title {
    font-size: 18px;
  }

  .form-group {
    gap: 8px;
  }

  .form-label {
    font-size: 12px;
  }

  .form-input,
  .form-textarea {
    padding: 10px 12px;
    font-size: 12px;
  }

  .form-textarea {
    min-height: 80px;
  }

  .order-summary {
    gap: 20px;
    padding: 20px;
  }

  .product-preview {
    padding: 15px 0;
  }

  .product-thumbnail {
    width: 110px;
    height: 110px;
  }

  .order-details {
    gap: 12px;
  }

  .detail-row {
    font-size: 12px;
  }

  .total-row {
    font-size: 14px;

    .total-value {
      font-size: 16px;
    }
  }

  .submit-btn {
    padding: 12px 20px;
    font-size: 14px;
  }
}

// Lock minimum width at 360px for phone
@media (max-width: 360px) {
  .container {
    min-width: 360px;
    padding: 0 10px;
  }
}
</style>
