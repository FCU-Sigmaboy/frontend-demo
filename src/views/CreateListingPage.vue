<template>
  <div class="create-listing-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="create-container">
        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="page-title">{{ isEdit ? '編輯刊登' : '刊登物品' }}</h1>
          <div class="spacer"></div>
        </div>

        <!-- Create Form -->
        <div class="form-card">
          <form @submit.prevent="handleSubmit">
            <!-- Image Upload Section -->
            <div class="form-section">
              <label class="section-label">
                商品照片 <span class="required">*</span>
              </label>
              <p class="section-hint">最多上傳 8 張照片，第一張為封面照片</p>

              <div class="image-upload-grid">
                <!-- Uploaded Images -->
                <div
                  v-for="(image, index) in formData.images"
                  :key="index"
                  class="image-item"
                >
                  <img :src="image" alt="Product Image" class="uploaded-image" />
                  <button
                    type="button"
                    class="remove-image-btn"
                    @click="removeImage(index)"
                  >
                    <i class="bi bi-x-circle-fill"></i>
                  </button>
                  <span v-if="index === 0" class="cover-badge">封面</span>
                </div>

                <!-- Upload Button -->
                <button
                  v-if="formData.images.length < 8"
                  type="button"
                  class="upload-placeholder"
                  @click="triggerImageInput"
                >
                  <i class="bi bi-plus-circle"></i>
                  <span>上傳照片</span>
                </button>
              </div>

              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                multiple
                style="display: none"
                @change="handleImageUpload"
              />
            </div>

            <!-- Title Field -->
            <div class="form-section">
              <label for="title" class="form-label">
                商品標題 <span class="required">*</span>
              </label>
              <input
                id="title"
                v-model="formData.title"
                type="text"
                class="form-input"
                placeholder="請輸入商品標題"
                maxlength="100"
                required
              />
              <p class="char-count">{{ formData.title.length }}/100</p>
            </div>

            <!-- Category Field -->
            <div class="form-section">
              <label for="category" class="form-label">
                商品分類 <span class="required">*</span>
              </label>
              <select
                id="category"
                v-model="formData.category"
                class="form-select"
                required
              >
                <option value="">請選擇分類</option>
                <option value="1">流行服飾</option>
                <option value="2">鞋包配件</option>
                <option value="3">美妝保養</option>
                <option value="4">電子 3C</option>
                <option value="5">家電用品</option>
                <option value="6">家具家飾</option>
                <option value="7">親子婦幼</option>
                <option value="8">生活娛樂</option>
                <option value="9">圖書影音</option>
              </select>
            </div>

            <!-- Description Field -->
            <div class="form-section">
              <label for="description" class="form-label">
                商品說明 <span class="required">*</span>
              </label>
              <textarea
                id="description"
                v-model="formData.description"
                class="form-textarea"
                rows="6"
                placeholder="請詳細描述商品狀況、使用情形等..."
                maxlength="1000"
                required
              ></textarea>
              <p class="char-count">{{ formData.description.length }}/1000</p>
            </div>

            <!-- Price Field -->
            <div class="form-section">
              <label for="price" class="form-label">
                價格 <span class="required">*</span>
              </label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">NT$</span>
                <input
                  id="price"
                  v-model.number="formData.price"
                  type="number"
                  class="form-input price-input"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    v-model="formData.isFree"
                    type="checkbox"
                    class="checkbox-input"
                    @change="handleFreeChange"
                  />
                  <span class="checkbox-text">免費贈送</span>
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="formData.isNegotiable"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">可議價</span>
                </label>
              </div>
            </div>

            <!-- Condition Field -->
            <div class="form-section">
              <label class="form-label">
                商品狀況 <span class="required">*</span>
              </label>
              <div class="condition-options">
                <label
                  v-for="condition in conditions"
                  :key="condition.value"
                  :class="['condition-option', { active: formData.condition === condition.value }]"
                >
                  <input
                    v-model="formData.condition"
                    type="radio"
                    :value="condition.value"
                    class="condition-radio"
                    required
                  />
                  <span class="condition-label">{{ condition.label }}</span>
                </label>
              </div>
            </div>

            <!-- Location Field -->
            <div class="form-section">
              <label for="location" class="form-label">
                交易地點 <span class="required">*</span>
              </label>
              <select
                id="location"
                v-model="formData.location"
                class="form-select"
                required
              >
                <option value="">請選擇地區</option>
                <option value="中區">台中市中區</option>
                <option value="東區">台中市東區</option>
                <option value="南區">台中市南區</option>
                <option value="西區">台中市西區</option>
                <option value="北區">台中市北區</option>
                <option value="西屯區">台中市西屯區</option>
                <option value="南屯區">台中市南屯區</option>
                <option value="北屯區">台中市北屯區</option>
                <option value="豐原區">台中市豐原區</option>
                <option value="大里區">台中市大里區</option>
                <option value="太平區">台中市太平區</option>
                <option value="沙鹿區">台中市沙鹿區</option>
              </select>
            </div>

            <!-- Trade Method Field -->
            <div class="form-section">
              <label class="form-label">
                交易方式 <span class="required">*</span>
              </label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    v-model="formData.tradeMethods.meetup"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">面交</span>
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="formData.tradeMethods.delivery"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">郵寄/宅配</span>
                </label>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="goBack">
                取消
              </button>
              <button type="submit" class="publish-btn" :disabled="isSubmitting">
                <span v-if="!isSubmitting">
                  {{ isEdit ? '更新刊登' : '發布刊登' }}
                </span>
                <span v-else>
                  <i class="bi bi-arrow-repeat spin"></i>
                  {{ isEdit ? '更新中...' : '發布中...' }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(500);
const isEdit = ref(!!route.params.id);
const isSubmitting = ref(false);
const imageInput = ref(null);

const formData = ref({
  images: [],
  title: '',
  category: '',
  description: '',
  price: 0,
  isFree: false,
  isNegotiable: false,
  condition: '',
  location: '',
  tradeMethods: {
    meetup: false,
    delivery: false
  }
});

const conditions = [
  { value: 'new', label: '全新' },
  { value: 'like-new', label: '近全新' },
  { value: 'good', label: '良好' },
  { value: 'fair', label: '普通' },
  { value: 'poor', label: '有瑕疵' }
];

// Methods
const goBack = () => {
  router.back();
};

const triggerImageInput = () => {
  imageInput.value.click();
};

const handleImageUpload = (event) => {
  const files = Array.from(event.target.files);
  const remainingSlots = 8 - formData.value.images.length;
  const filesToProcess = files.slice(0, remainingSlots);

  filesToProcess.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.images.push(e.target.result);
    };
    reader.readAsDataURL(file);
  });

  // Clear input
  event.target.value = '';
};

const removeImage = (index) => {
  formData.value.images.splice(index, 1);
};

const handleFreeChange = () => {
  if (formData.value.isFree) {
    formData.value.price = 0;
    formData.value.isNegotiable = false;
  }
};

const handleSubmit = async () => {
  // Validate images
  if (formData.value.images.length === 0) {
    alert('請至少上傳一張商品照片');
    return;
  }

  // Validate trade methods
  if (!formData.value.tradeMethods.meetup && !formData.value.tradeMethods.delivery) {
    alert('請至少選擇一種交易方式');
    return;
  }

  isSubmitting.value = true;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Listing created:', formData.value);

    // Show success message
    alert(isEdit.value ? '刊登已更新！' : '刊登成功！');

    // Navigate to profile or listing detail
    router.push({ name: 'UserProfile' });
  } catch (error) {
    console.error('Error creating listing:', error);
    alert('刊登失敗，請稍後再試');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.create-listing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.create-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

// Page Header
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    i {
      font-size: 20px;
      color: #1e1e1e;
    }

    &:hover {
      background: #f5f5f5;
      transform: translateX(-3px);
    }
  }

  .page-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  .spacer {
    width: 40px;
  }
}

// Form Card
.form-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

// Form Sections
.form-section {
  margin-bottom: 32px;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.section-label {
  display: block;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1e1e1e;
  margin-bottom: 8px;

  .required {
    color: #dc3545;
  }
}

.section-hint {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #999;
  margin: 0 0 16px 0;
}

.form-label {
  display: block;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #1e1e1e;
  margin-bottom: 8px;

  .required {
    color: #dc3545;
  }
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  color: #1e1e1e;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  transition: all 0.3s;
  outline: none;

  &:focus {
    border-color: #6fb8a5;
    box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
  }

  &::placeholder {
    color: #999;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.char-count {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #999;
  text-align: right;
  margin: 6px 0 0 0;
}

// Image Upload
.image-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;

  .uploaded-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-image-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;

    i {
      font-size: 20px;
      color: white;
    }

    &:hover {
      background: rgba(220, 53, 69, 0.9);
    }
  }

  .cover-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    padding: 4px 10px;
    background: #6fb8a5;
    color: white;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    font-weight: 600;
    border-radius: 4px;
  }
}

.upload-placeholder {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f9f9f9;
  border: 2px dashed #d0d0d0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 32px;
    color: #999;
  }

  span {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
  }

  &:hover {
    background: #f0f0f0;
    border-color: #6fb8a5;

    i,
    span {
      color: #6fb8a5;
    }
  }
}

// Price Input
.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .currency-symbol {
    position: absolute;
    left: 16px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #666;
    pointer-events: none;
  }

  .price-input {
    padding-left: 48px;
  }
}

// Checkbox Group
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .checkbox-input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #6fb8a5;
  }

  .checkbox-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    color: #1e1e1e;
  }
}

// Condition Options
.condition-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.condition-option {
  flex: 1;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: white;
  border: 2px solid #d0d0d0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  .condition-radio {
    display: none;
  }

  .condition-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    color: #666;
    font-weight: 500;
  }

  &:hover {
    border-color: #6fb8a5;
    background: #f9fffe;
  }

  &.active {
    border-color: #6fb8a5;
    background: #6fb8a5;

    .condition-label {
      color: white;
    }
  }
}

// Form Actions
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.publish-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.cancel-btn {
  background: white;
  color: #666;
  border: 1px solid #d0d0d0;

  &:hover {
    background: #f5f5f5;
    border-color: #b0b0b0;
  }
}

.publish-btn {
  background: #6fb8a5;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #5fa795;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
  }

  &:disabled {
    background: #b0d4cb;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Responsive
@media (max-width: 767.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .create-container {
    padding: 0 15px;
  }

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
    }
  }

  .form-card {
    padding: 30px 24px;
  }

  .image-upload-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .condition-options {
    flex-direction: column;
  }

  .condition-option {
    min-width: 100%;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;

    .cancel-btn,
    .publish-btn {
      width: 100%;
    }
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .create-container {
    padding: 0 10px;
  }

  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
    }

    .back-btn {
      width: 36px;
      height: 36px;

      i {
        font-size: 18px;
      }
    }

    .spacer {
      width: 36px;
    }
  }

  .form-card {
    padding: 24px 16px;
  }

  .section-label {
    font-size: 16px;
  }

  .form-label {
    font-size: 14px;
  }

  .image-upload-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>
