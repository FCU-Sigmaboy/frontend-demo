<template>
  <div class="create-listing-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="breadcrumbItems" />

      <div class="create-container">
        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="page-title">{{ isEdit ? '編輯刊登' : '刊登物品' }}</h1>
          <div class="spacer"></div>
        </div>

        <!-- Loading State - Skeleton -->
        <div v-if="isLoading" class="form-card skeleton-loading">
          <!-- Skeleton Header -->
          <div class="skeleton-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-hint"></div>
            <div class="skeleton-image-grid">
              <div v-for="i in 4" :key="`skeleton-img-${i}`" class="skeleton-image-box"></div>
            </div>
          </div>

          <!-- Skeleton Input Fields -->
          <div class="skeleton-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-input"></div>
          </div>

          <div class="skeleton-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-select"></div>
          </div>

          <div class="skeleton-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-textarea"></div>
          </div>

          <div class="skeleton-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-input short"></div>
          </div>

          <div class="skeleton-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-options">
              <div v-for="i in 5" :key="`skeleton-opt-${i}`" class="skeleton-option"></div>
            </div>
          </div>

          <div class="skeleton-section">
            <div class="skeleton-label"></div>
            <div class="skeleton-select"></div>
          </div>

          <!-- Skeleton Actions -->
          <div class="skeleton-actions">
            <div class="skeleton-button"></div>
            <div class="skeleton-button primary"></div>
          </div>
        </div>

        <!-- Create Form -->
        <div v-else class="form-card">
          <form @submit.prevent="handleSubmit">
            <!-- Image Upload Section -->
            <div class="form-section">
              <label class="section-label">
                商品照片 <span class="required">*</span>
              </label>
              <p class="section-hint">最多上傳 8 張照片，第一張為封面照片。支援拖曳上傳</p>

              <div
                class="image-upload-dropzone"
                :class="{ 'is-dragging': isDragging }"
                @dragover.prevent="handleDragOver"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="handleDrop"
              >
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

                <!-- Drag Overlay -->
                <div v-if="isDragging" class="drag-overlay">
                  <i class="bi bi-cloud-upload"></i>
                  <p>拖曳圖片到這裡上傳</p>
                </div>
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
                <option
                  v-for="subCat in subCategories"
                  :key="subCat.id"
                  :value="subCat.id"
                >
                  {{ subCat.name }}
                </option>
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
                v-model="formData.locationId"
                class="form-select"
                required
              >
                <option :value="null">請選擇地區</option>
                <option
                  v-for="location in userLocations"
                  :key="location.id"
                  :value="location.id"
                >
                  {{ location.formatted_address }}
                  <span v-if="location.is_primary"> (預設)</span>
                  <span v-if="location.type"> - {{ location.type }}</span>
                </option>
              </select>
              <p class="form-hint">
                沒有您想要的地區？
                <router-link :to="{ name: 'UserProfile' }" class="link-text">
                  前往個人資料新增地區
                </router-link>
              </p>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { getItemById } from '../api/get_itemByIdAPI';
import { updateMyItem } from '../api/update_myItemAPI';
import imageCompression from 'browser-image-compression';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';

const route = useRoute();
const router = useRouter();

// State
const userPoints = ref(500);
const itemId = computed(() => route.params.id ? Number(route.params.id) : null);
const isEdit = computed(() => !!itemId.value);

// Breadcrumb items
const breadcrumbItems = computed(() => {
  if (isEdit.value) {
    return [
      { label: '我的刊登', to: '/manage-listings' },
      { label: '編輯刊登' }
    ];
  }
  return [{ label: '刊登物品' }];
});
const isSubmitting = ref(false);
const isLoading = ref(!!route.params.id); // 如果是編輯模式，初始為 true
const isDragging = ref(false);
const imageInput = ref(null);
const subCategories = ref([]);
const userLocations = ref([]);

const formData = ref({
  images: [],
  title: '',
  category: '',
  description: '',
  price: 0,
  isFree: false,
  isNegotiable: false,
  condition: '',
  locationId: null
});

const conditions = [
  { value: '全新', label: '全新' },
  { value: '近全新', label: '近全新' },
  { value: '良好', label: '良好' },
  { value: '普通', label: '普通' },
  { value: '需修理', label: '需修理' }
];

// Fetch categories from database
const fetchCategories = async () => {
  try {
    console.log('🔍 Fetching sub_categories from database...');

    const { data, error } = await supabase
      .from('sub_categories')
      .select('id, name')
      .order('id');

    if (error) {
      console.error('❌ Error fetching sub_categories:', error);
      return;
    }

    subCategories.value = data || [];
    console.log('✅ Loaded sub_categories:', subCategories.value);
  } catch (error) {
    console.error('❌ Failed to fetch categories:', error);
  }
};

// Fetch user's locations from database
const fetchUserLocations = async () => {
  try {
    console.log('📍 Fetching user locations...');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated');
      return;
    }

    const { data, error } = await supabase
      .from('locations')
      .select('id, formatted_address, type, is_primary')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('❌ Error fetching locations:', error);
      return;
    }

    userLocations.value = data || [];
    console.log('✅ Loaded user locations:', userLocations.value);

    // If no locations, warn user
    if (userLocations.value.length === 0) {
      alert('請先在個人資料頁面設定您的所在地區');
      router.push({ name: 'UserProfile' });
    }
  } catch (error) {
    console.error('❌ Failed to fetch user locations:', error);
  }
};

// Load item data for editing
const loadItemData = async () => {
  if (!itemId.value) return;

  try {
    isLoading.value = true;
    console.log('📝 Loading item data for editing...');

    const item = await getItemById(itemId.value);

    if (!item) {
      alert('找不到該物品');
      router.push({ name: 'ManageListings' });
      return;
    }

    // Populate form with item data
    formData.value = {
      images: item.image_urls || [],
      title: item.title || '',
      category: item.sub_category_id || '',
      description: item.description || '',
      price: item.price || 0,
      isFree: item.price === 0,
      isNegotiable: false, // This field doesn't exist in DB
      condition: item.condition || '',
      locationId: item.location_id || null
    };

    console.log('✅ Item data loaded:', formData.value);
  } catch (error) {
    console.error('❌ Failed to load item:', error);
    alert(`載入失敗：${error.message}`);
    router.push({ name: 'ManageListings' });
  } finally {
    isLoading.value = false;
  }
};

// Load categories and item data on mount
onMounted(async () => {
  await fetchCategories();
  await fetchUserLocations();

  if (isEdit.value) {
    await loadItemData();
  }
});

// Methods
const goBack = () => {
  router.back();
};

const triggerImageInput = () => {
  imageInput.value.click();
};

// Compress image before converting to base64
const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.3,              // 限制 300KB
    maxWidthOrHeight: 1000,      // 最大解析度
    useWebWorker: true,          // 使用多執行緒
    fileType: 'image/webp'       // 轉換為 WebP
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Fallback to original file
  }
};

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files);
  const remainingSlots = 8 - formData.value.images.length;
  const filesToProcess = files.slice(0, remainingSlots);

  for (const file of filesToProcess) {
    // Compress image first
    const compressedFile = await compressImage(file);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.images.push(e.target.result);
    };
    reader.readAsDataURL(compressedFile);
  }

  // Clear input
  event.target.value = '';
};

const removeImage = (index) => {
  formData.value.images.splice(index, 1);
};

// Drag and Drop handlers
const handleDragOver = (event) => {
  isDragging.value = true;
};

const handleDragLeave = (event) => {
  // Only set to false if leaving the dropzone entirely
  if (event.target.classList.contains('image-upload-dropzone')) {
    isDragging.value = false;
  }
};

const handleDrop = async (event) => {
  isDragging.value = false;

  const files = Array.from(event.dataTransfer.files);

  // Filter only image files
  const imageFiles = files.filter(file => file.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    alert('請拖曳圖片檔案');
    return;
  }

  const remainingSlots = 8 - formData.value.images.length;
  const filesToProcess = imageFiles.slice(0, remainingSlots);

  if (imageFiles.length > remainingSlots) {
    alert(`最多只能上傳 8 張照片，已自動選取前 ${remainingSlots} 張`);
  }

  for (const file of filesToProcess) {
    // Compress image first
    const compressedFile = await compressImage(file);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.images.push(e.target.result);
    };
    reader.readAsDataURL(compressedFile);
  }
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

  // Validate location
  if (!formData.value.locationId) {
    alert('請選擇交易地點');
    return;
  }

  // Validate location belongs to user
  const isValidLocation = userLocations.value.some(loc => loc.id === formData.value.locationId);
  if (!isValidLocation) {
    alert('請選擇您在個人資料中設定的地區。如需新增地區，請先前往個人資料頁面設定。');
    return;
  }

  isSubmitting.value = true;

  try {
    if (isEdit.value) {
      // Update existing item
      console.log('📝 Updating item:', formData.value);

      const updateData = {
        title: formData.value.title,
        description: formData.value.description,
        condition: formData.value.condition,
        price: formData.value.price,
        sub_category_id: formData.value.category,
        image_urls: formData.value.images,
        location_id: formData.value.locationId
      };

      const result = await updateMyItem(itemId.value, updateData);

      console.log('✅ Item updated successfully:', result);
    } else {
      // Create new item
      console.log('📝 Creating new listing:', formData.value);

      const itemData = {
        ...formData.value,
        user_location_id: formData.value.locationId,
        category: formData.value.category
      };

      const { createItem } = await import('../api/create_myItemAPI');
      const result = await createItem(itemData);

      console.log('✅ Listing created successfully:', result);
    }

    // Navigate to manage listings page
    router.push({ name: 'ManageListings' });
  } catch (error) {
    console.error('❌ Error submitting listing:', error);
    alert((isEdit.value ? '更新' : '刊登') + '失敗：' + error.message);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.create-listing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

.create-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

// Skeleton Loading
.skeleton-loading {
  padding: 40px;

  .skeleton-section {
    margin-bottom: 32px;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .skeleton-label {
    width: 120px;
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    margin-bottom: 12px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-hint {
    width: 250px;
    height: 14px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    margin-bottom: 16px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-image-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .skeleton-image-box {
    aspect-ratio: 1;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-input {
    width: 100%;
    height: 48px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.5s ease-in-out infinite;

    &.short {
      width: 40%;
    }
  }

  .skeleton-select {
    width: 100%;
    height: 48px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-textarea {
    width: 100%;
    height: 140px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .skeleton-option {
    flex: 1;
    min-width: 100px;
    height: 48px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-actions {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    margin-top: 40px;
    padding-top: 32px;
    border-top: 1px solid #e0e0e0;
  }

  .skeleton-button {
    width: 120px;
    height: 50px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.5s ease-in-out infinite;

    &.primary {
      opacity: 0.8;
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
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
    border-color: $primary;
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

.form-hint {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #666;
  margin: 8px 0 0 0;

  .link-text {
    color: $primary;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Image Upload
.image-upload-dropzone {
  position: relative;
  padding: 16px;
  border: 2px dashed #d0d0d0;
  border-radius: 12px;
  background: #fafafa;
  transition: all 0.3s;

  &.is-dragging {
    border-color: $primary;
    background: rgba(111, 184, 165, 0.05);
  }
}

.image-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(111, 184, 165, 0.95);
  border-radius: 12px;
  color: white;
  pointer-events: none;
  z-index: 10;

  i {
    font-size: 64px;
    margin-bottom: 16px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
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
    background: $primary;
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
    border-color: $primary;

    i,
    span {
      color: $primary;
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
    accent-color: $primary;
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
    border-color: $primary;
    background: #f9fffe;
  }

  &.active {
    border-color: $primary;
    background: $primary;

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
  background: $primary;
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

  .skeleton-loading {
    padding: 30px 24px;

    .skeleton-image-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .skeleton-actions {
      flex-direction: column-reverse;
      gap: 12px;

      .skeleton-button {
        width: 100%;
      }
    }
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

  .skeleton-loading {
    padding: 24px 16px;

    .skeleton-image-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .skeleton-options {
      flex-direction: column;
    }

    .skeleton-option {
      min-width: 100%;
    }
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
