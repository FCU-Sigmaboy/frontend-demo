<template>
  <div class="transaction-details-page">
    <AppHeader :user-points="userBalance" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="[
        { label: '對話', to: { name: 'Messages' } },
        { label: '交易確認' }
      ]" />

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <p>載入交易資訊中...</p>
      </div>

      <!-- Transaction Form Section -->
      <section v-else class="transaction-form-section">
        <div class="container">
          <div class="transaction-wrapper">
            <!-- Left Side: Transaction Info -->
            <div class="transaction-info">
              <h2 class="form-title">交易確認</h2>

              <!-- Delivery Method (Read-only, always 面交) -->
              <div class="form-group">
                <label class="form-label">取貨方式 *</label>
                <div class="readonly-field">
                  <i class="bi bi-people-fill"></i>
                  <span>面交</span>
                </div>
                <p class="field-hint">此網站目前僅支援面對面交易</p>
              </div>

              <!-- Delivery Location -->
              <div class="form-group">
                <label class="form-label">面交地點</label>
                <input
                  v-model="form.deliveryLocation"
                  type="text"
                  class="form-input"
                  :placeholder="item.location || '台中市北投區...'"
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

              <!-- Product Info -->
              <div class="product-info">
                <img :src="item.cover_image_url" :alt="item.title" class="product-thumbnail" />
                <div class="product-details">
                  <h3 class="product-name">{{ item.title }}</h3>
                  <p class="product-location">
                    <i class="bi bi-geo-alt"></i>
                    {{ item.location }}
                  </p>
                </div>
              </div>

              <!-- Points Calculation -->
              <div class="order-details">
                <div class="detail-row">
                  <span class="detail-label">交易方式</span>
                  <span class="detail-value">面交</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">取貨地點</span>
                  <span class="detail-value">{{ form.deliveryLocation || item.location }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">物品點數</span>
                  <span class="detail-value">{{ item.price }}P</span>
                </div>

                <div class="divider"></div>

                <!-- Balance Calculation -->
                <div class="detail-row balance-row">
                  <span class="detail-label">您的點數</span>
                  <span class="detail-value">{{ userBalance }}P</span>
                </div>

                <div class="detail-row balance-row">
                  <span class="detail-label">交易後剩餘</span>
                  <span :class="['detail-value', { 'insufficient': remainingPoints < 0 }]">
                    {{ remainingPoints }}P
                  </span>
                </div>
              </div>

              <!-- Insufficient Points Warning -->
              <div v-if="remainingPoints < 0" class="warning-message">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span>點數不足，請先儲值或選擇其他物品</span>
              </div>

              <!-- Submit Button -->
              <button
                class="submit-btn"
                @click="handleSubmit"
                :disabled="!isFormValid || remainingPoints < 0"
              >
                確認訂單
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
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import { useTransactions } from '@/composables/useTransactions';

const router = useRouter();
const route = useRoute();
const { getConfirmationDetails, confirmOrder } = useTransactions();

// State
const loading = ref(false);
const userBalance = ref(0);
const item = ref({
  id: '',
  title: '',
  cover_image_url: '',
  location: '',
  price: 0
});
const transaction = ref(null);

const form = ref({
  deliveryLocation: '',
  notes: ''
});

// Computed
const remainingPoints = computed(() => {
  return userBalance.value - item.value.price;
});

const isFormValid = computed(() => {
  // Delivery location is optional, just needs to have valid data loaded
  return item.value.id && userBalance.value >= 0;
});

// Methods
async function loadTransactionData() {
  loading.value = true;
  try {
    const conversationId = route.params.conversationId || route.query.conversationId;
    if (!conversationId) {
      alert('缺少對話 ID');
      router.back();
      return;
    }

    const data = await getConfirmationDetails(conversationId);

    if (data) {
      transaction.value = data.transaction;
      item.value = data.item;
      userBalance.value = data.user.balance;

      // Pre-fill delivery location with item location
      form.value.deliveryLocation = data.item.location || '';
    }
  } catch (err) {
    console.error('Failed to load transaction data:', err);
    alert('載入交易資訊失敗');
    router.back();
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!isFormValid.value || remainingPoints.value < 0) {
    if (remainingPoints.value < 0) {
      alert('點數不足，請先儲值或選擇其他物品');
    }
    return;
  }

  try {
    loading.value = true;

    const result = await confirmOrder(transaction.value.id, {
      delivery_location: form.value.deliveryLocation,
      delivery_notes: form.value.notes
    });

    if (result) {
      alert('訂單確認成功！等待賣家最終確認');
      router.push({ name: 'Messages' });
    }
  } catch (err) {
    console.error('Failed to confirm order:', err);
    alert('確認訂單失敗，請稍後再試');
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadTransactionData();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

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

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    margin-top: 16px;
  }
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
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.readonly-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0faf8;
  border: 1px solid #d0ebe7;
  border-radius: 5px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: $primary;
  font-weight: 500;

  i {
    font-size: 18px;
  }
}

.field-hint {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  color: #666;
  margin: 4px 0 0 0;
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

.product-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;

  .product-thumbnail {
    width: 80px;
    height: 80px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .product-details {
    flex: 1;
    min-width: 0;

    .product-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 8px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .product-location {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #666;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;

      i {
        font-size: 12px;
      }
    }
  }
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

  &.balance-row {
    .detail-label {
      font-weight: 500;
    }

    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: $primary;

      &.insufficient {
        color: #f44336;
      }
    }
  }
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
  margin: 10px 0;
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #f57c00;

  i {
    font-size: 18px;
    flex-shrink: 0;
  }
}

.submit-btn {
  width: 100%;
  padding: 14px 24px;
  background-color: $primary;
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
