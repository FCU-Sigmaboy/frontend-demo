<template>
  <div class="edit-profile-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="edit-container">
        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="page-title">編輯個人資料</h1>
          <div class="spacer"></div>
        </div>

        <!-- Edit Form -->
        <div class="form-card">
          <form @submit.prevent="handleSubmit">
            <!-- Avatar Upload Section -->
            <div class="form-section">
              <label class="section-label">大頭貼</label>
              <div class="avatar-upload-section">
                <div class="avatar-preview">
                  <img
                    v-if="formData.avatar"
                    :src="formData.avatar"
                    alt="Avatar Preview"
                    class="preview-image"
                    referrerpolicy="no-referrer"
                  />
                  <i v-else class="bi bi-person-circle default-avatar"></i>
                </div>
                <div class="upload-actions">
                  <button type="button" class="upload-btn" @click="triggerFileInput">
                    <i class="bi bi-upload"></i>
                    上傳照片
                  </button>
                  <button
                    v-if="formData.avatar"
                    type="button"
                    class="remove-btn"
                    @click="removeAvatar"
                  >
                    <i class="bi bi-trash"></i>
                    移除
                  </button>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handleFileUpload"
                  />
                </div>
              </div>
            </div>

            <!-- Nickname Field -->
            <div class="form-section">
              <label for="nickname" class="form-label">
                暱稱 <span class="required">*</span>
              </label>
              <input
                id="nickname"
                v-model="formData.nickname"
                type="text"
                class="form-input"
                placeholder="請輸入暱稱"
                required
              />
              <p class="field-hint">Google 帳戶預設顯示名稱，可隨時修改</p>
            </div>

            <!-- Login Method Field (Read-only) -->
            <div class="form-section">
              <label for="loginMethod" class="form-label">
                登入方式
              </label>
              <input
                id="loginMethod"
                v-model="formData.loginMethod"
                type="text"
                class="form-input"
                placeholder="Google"
                disabled
              />
              <p class="field-hint">電子信箱無法修改</p>
            </div>

            <!-- Location Field -->
            <div class="form-section">
              <label for="location" class="form-label">
                所在地區
              </label>
              <select id="location" v-model="formData.location" class="form-select">
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

            <!-- Office Address Field (Optional) -->
            <div v-if="showOfficeAddress" class="form-section">
              <label for="officeAddress" class="form-label">
                公司地址
              </label>
              <select id="officeAddress" v-model="formData.officeAddress" class="form-select">
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

            <!-- Add Office Address Button -->
            <div v-if="!showOfficeAddress" class="form-section">
              <button type="button" class="add-address-btn" @click="toggleOfficeAddress">
                <i class="bi bi-plus-circle"></i>
                新增公司地址
              </button>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="goBack">
                取消
              </button>
              <button type="submit" class="save-btn" :disabled="isSaving">
                <span v-if="!isSaving">儲存變更</span>
                <span v-else>
                  <i class="bi bi-arrow-repeat spin"></i>
                  儲存中...
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const router = useRouter();
const authStore = useAuthStore();

// State
const userPoints = ref(500);
const isSaving = ref(false);
const fileInput = ref(null);
const showOfficeAddress = ref(false);

const formData = ref({
  avatar: authStore.userAvatar || '',
  nickname: authStore.userName || '',
  loginMethod: 'Google',
  location: '',
  officeAddress: ''
});

// Methods
const goBack = () => {
  router.back();
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeAvatar = () => {
  formData.value.avatar = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const toggleOfficeAddress = () => {
  showOfficeAddress.value = !showOfficeAddress.value;
};

const handleSubmit = async () => {
  isSaving.value = true;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update auth store (if needed)
    // authStore.updateProfile(formData.value);

    console.log('Profile updated:', formData.value);

    // Show success message (you can use a toast library)
    alert('個人資料已更新！');

    // Navigate back to profile
    router.push({ name: 'UserProfile' });
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('更新失敗，請稍後再試');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.edit-profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.edit-container {
  max-width: 800px;
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
  margin-bottom: 28px;

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
  margin-bottom: 16px;
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

  &:disabled {
    background: #f5f5f5;
    color: #999;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #999;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.field-hint {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #999;
  margin: 6px 0 0 0;
}

.char-count {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  color: #999;
  text-align: right;
  margin: 6px 0 0 0;
}

// Avatar Upload
.avatar-upload-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-preview {
  flex-shrink: 0;

  .preview-image,
  .default-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
  }

  .default-avatar {
    font-size: 120px;
    color: #e0e0e0;
  }
}

.upload-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-btn,
.remove-btn,
.add-address-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }
}

.upload-btn {
  background: $primary;
  color: white;
  border: none;

  &:hover {
    background: #5fa795;
  }
}

.remove-btn {
  background: white;
  color: #dc3545;
  border: 1px solid #dc3545;

  &:hover {
    background: #dc3545;
    color: white;
  }
}

.add-address-btn {
  background: white;
  color: $primary;
  border: 1px dashed $primary;

  &:hover {
    background: #f0f9f7;
    border-style: solid;
  }
}

// Checkbox Group
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  .checkbox-input {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: $primary;
  }

  .checkbox-text {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    color: #1e1e1e;
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
.save-btn {
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

.save-btn {
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
  .main-content {
    padding: 20px 0 50px;
  }

  .edit-container {
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

  .avatar-upload-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;

    .cancel-btn,
    .save-btn {
      width: 100%;
    }
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .edit-container {
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

  .avatar-preview {
    .preview-image,
    .default-avatar {
      width: 100px;
      height: 100px;
    }

    .default-avatar {
      font-size: 100px;
    }
  }
}
</style>
