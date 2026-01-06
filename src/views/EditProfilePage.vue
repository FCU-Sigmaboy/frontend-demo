<template>
  <div class="edit-profile-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="breadcrumbItems" />

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
          <!-- Loading Skeleton -->
          <div v-if="isLoadingProfile" class="skeleton-form">
            <!-- Avatar Skeleton -->
            <div class="form-section">
              <div class="skeleton-label"></div>
              <div class="skeleton-avatar-section">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-buttons">
                  <div class="skeleton-button"></div>
                </div>
              </div>
            </div>

            <!-- Nickname Skeleton -->
            <div class="form-section">
              <div class="skeleton-label"></div>
              <div class="skeleton-input"></div>
              <div class="skeleton-hint"></div>
            </div>

            <!-- Login Method Skeleton -->
            <div class="form-section">
              <div class="skeleton-label"></div>
              <div class="skeleton-input"></div>
              <div class="skeleton-hint"></div>
            </div>

            <!-- Location Skeleton -->
            <div class="form-section">
              <div class="skeleton-label"></div>
              <div class="skeleton-input-group">
                <div class="skeleton-input flex-1"></div>
                <div class="skeleton-button"></div>
              </div>
              <div class="skeleton-hint"></div>
            </div>

            <!-- Actions Skeleton -->
            <div class="skeleton-actions">
              <div class="skeleton-button"></div>
              <div class="skeleton-button"></div>
            </div>
          </div>

          <!-- Actual Form -->
          <form v-else @submit.prevent="handleSubmit">
            <!-- Avatar Upload Section -->
            <div class="form-section">
              <label class="section-label">大頭貼</label>
              <div class="avatar-upload-section">
                <div
                  class="avatar-preview"
                  :class="{ 'drag-over': isDraggingAvatar }"
                  @dragover.prevent="handleDragOver"
                  @dragleave.prevent="handleDragLeave"
                  @drop.prevent="handleDrop"
                  @click="triggerFileInput"
                >
                  <img
                    v-if="formData.avatar"
                    :src="formData.avatar"
                    alt="Avatar Preview"
                    class="preview-image"
                    referrerpolicy="no-referrer"
                  />
                  <i v-else class="bi bi-person-circle default-avatar"></i>
                  <div v-if="isDraggingAvatar" class="drag-overlay">
                    <i class="bi bi-cloud-upload"></i>
                    <span>放開以上傳</span>
                  </div>
                  <div v-else class="change-overlay">
                    <i class="bi bi-camera-fill"></i>
                    <span>點擊或拖曳更換</span>
                  </div>
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
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
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
                :maxlength="maxNicknameLength"
                @input="handleNicknameInput"
                type="text"
                class="form-input"
                placeholder="請輸入暱稱"
                required
              />
              <div class="hint-row">
                <p class="field-hint">Google 帳戶預設顯示名稱，可隨時修改（最多 {{ maxNicknameLength }} 字）</p>
                <div class="char-count">{{ nicknameLength }} / {{ maxNicknameLength }}</div>
              </div>
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
              <div class="location-input-group">
                <input
                  id="location"
                  v-model="formData.locationDisplay"
                  type="text"
                  class="form-input"
                  placeholder="點擊定位按鈕取得您的位置"
                  disabled
                />
                <button
                  type="button"
                  class="location-btn"
                  @click="getCurrentLocation"
                  :disabled="isGettingLocation"
                >
                  <i v-if="!isGettingLocation" class="bi bi-geo-alt-fill"></i>
                  <i v-else class="bi bi-arrow-repeat spin"></i>
                  {{ isGettingLocation ? '定位中...' : '定位' }}
                </button>
              </div>
              <p class="field-hint">使用瀏覽器定位功能取得您的當前位置</p>
            </div>

            <!-- Office Address Field (Optional) -->
            <div v-if="showOfficeAddress" class="form-section">
              <label for="officeAddress" class="form-label">
                公司地址
              </label>
              <div class="location-input-group">
                <input
                  id="officeAddress"
                  v-model="formData.officeAddressDisplay"
                  type="text"
                  class="form-input"
                  placeholder="點擊定位按鈕取得您的公司位置"
                  disabled
                />
                <button
                  type="button"
                  class="location-btn"
                  @click="getOfficeLocation"
                  :disabled="isGettingOfficeLocation"
                >
                  <i v-if="!isGettingOfficeLocation" class="bi bi-geo-alt-fill"></i>
                  <i v-else class="bi bi-arrow-repeat spin"></i>
                  {{ isGettingOfficeLocation ? '定位中...' : '定位' }}
                </button>
              </div>
              <p class="field-hint">使用瀏覽器定位功能取得您的公司位置</p>
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

    <!-- Image Cropper Modal -->
    <ImageCropper
      v-model:show="showCropper"
      :image-src="cropperImageSrc"
      @confirm="handleCroppedImage"
      @cancel="handleCropperCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getMyProfileForEdit, updateMyProfile } from '../api/profileAPI';
import { uploadProfilePicture } from '@/api/imageAPI';
import { getCurrentPosition } from '../api/locationAPI';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import ImageCropper from '../components/ImageCropper.vue';

const router = useRouter();
const authStore = useAuthStore();

// Breadcrumb items
const breadcrumbItems = [
  { label: '個人檔案', to: { name: 'UserProfile' } },
  { label: '編輯個人資料' }
];

// State
const userPoints = ref(0);
const isSaving = ref(false);
const isGettingLocation = ref(false);
const isGettingOfficeLocation = ref(false);
const fileInput = ref(null);
const showOfficeAddress = ref(false);
const originalProfile = ref(null); // Store original profile data
const isLoadingProfile = ref(true); // Loading state for profile data
const isDraggingAvatar = ref(false);
const showCropper = ref(false);
const cropperImageSrc = ref('');

const formData = ref({
  avatar: authStore.userAvatar || '',
  avatarFile: null, // Store the File object for upload
  nickname: authStore.userName || '',
  loginMethod: 'Google',
  location: '', // Stores district name like '西屯區'
  locationDisplay: '', // Display string like '台中市西屯區'
  locationCoords: null, // Stores { latitude, longitude }
  officeAddress: '',
  officeAddressDisplay: '',
  officeAddressCoords: null
});

// Nickname settings
const maxNicknameLength = 20; // 先預設 20 但資料庫最多允許 50 字元
const nicknameLength = computed(() => (formData.value.nickname || '').length);

// District coordinate mapping (Taichung districts)
const districtCoordinates = {
  '中區': { latitude: 24.1438, longitude: 120.6794 },
  '東區': { latitude: 24.1378, longitude: 120.6947 },
  '南區': { latitude: 24.1168, longitude: 120.6637 },
  '西區': { latitude: 24.1393, longitude: 120.6739 },
  '北區': { latitude: 24.1635, longitude: 120.6821 },
  '西屯區': { latitude: 24.1812, longitude: 120.6396 },
  '南屯區': { latitude: 24.1398, longitude: 120.6471 },
  '北屯區': { latitude: 24.1810, longitude: 120.7150 },
  '豐原區': { latitude: 24.2569, longitude: 120.7230 },
  '大里區': { latitude: 24.0990, longitude: 120.6772 },
  '太平區': { latitude: 24.1264, longitude: 120.7209 },
  '沙鹿區': { latitude: 24.2364, longitude: 120.5686 }
};

// Methods
const goBack = () => {
  router.back();
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  processImageFile(file);
};

const processImageFile = (file) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    alert('僅支援 JPG、PNG、WEBP、GIF 格式的圖片');
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  // Validate file size (stricter limit for animated formats)
  const isAnimated = file.type === 'image/gif';
  const maxSize = isAnimated ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for GIF, 5MB for others

  if (file.size > maxSize) {
    const sizeLimit = isAnimated ? '2MB' : '5MB';
    alert(`${isAnimated ? '動畫' : ''}圖片大小不能超過 ${sizeLimit}`);
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  // GIF files bypass cropper to preserve animation
  if (isAnimated) {
    // Store the File object directly for upload
    formData.value.avatarFile = file;

    // Create preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.avatar = e.target.result; // Preview only
    };
    reader.readAsDataURL(file);
  } else {
    // Show cropper modal for static images
    const reader = new FileReader();
    reader.onload = (e) => {
      cropperImageSrc.value = e.target.result;
      showCropper.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const handleNicknameInput = (event) => {
  const value = event.target.value || '';
  if (value.length > maxNicknameLength) {
    // Trim the input to the max length and update the model
    formData.value.nickname = value.substring(0, maxNicknameLength);
    // Optional: provide a subtle feedback
    alert(`暱稱不可超過 ${maxNicknameLength} 字元`);
  } else {
    formData.value.nickname = value;
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  isDraggingAvatar.value = true;
};

const handleDragLeave = (event) => {
  // Only set to false if leaving the dropzone entirely
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  // Check if mouse is outside the dropzone
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDraggingAvatar.value = false;
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  isDraggingAvatar.value = false;

  const files = Array.from(event.dataTransfer.files);
  const imageFile = files.find(file => file.type.startsWith('image/'));

  if (!imageFile) {
    alert('請拖曳圖片檔案');
    return;
  }

  processImageFile(imageFile);
};

const handleCroppedImage = async (blob) => {
  // Convert blob to File
  const file = new File([blob], 'profile-picture.webp', { type: 'image/webp' });
  
  // Store the File object for later upload
  formData.value.avatarFile = file;

  // Create preview using FileReader
  const reader = new FileReader();
  reader.onload = (e) => {
    formData.value.avatar = e.target.result; // Preview only
  };
  reader.readAsDataURL(blob);
};

const handleCropperCancel = () => {
  cropperImageSrc.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const removeAvatar = () => {
  formData.value.avatar = '';
  formData.value.avatarFile = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const toggleOfficeAddress = () => {
  showOfficeAddress.value = !showOfficeAddress.value;
};

const getCurrentLocation = async () => {
  isGettingLocation.value = true;
  
  try {
    console.log('Getting current location...');
    const position = await getCurrentPosition();
    
    console.log('Location obtained:', position);
    
    // Store coordinates
    formData.value.locationCoords = {
      latitude: position.latitude,
      longitude: position.longitude
    };
    
    // Use Nominatim API to reverse geocode
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}&accept-language=zh-TW`
    );
    
    if (!response.ok) {
      throw new Error('地址解析失敗');
    }
    
    const data = await response.json();
    console.log('🗺️ Reverse geocode result:', data);
    
    // Extract detailed address information
    const address = data.address;
    let fullAddress = '';
    
    if (address) {
      // Build address: 市 + 區 + 里
      const city = address.city || address.county || '';
      const district = address.town || address.city_district || address.district || address.suburb || '';
      const village = address.village || address.neighbourhood || '';
      
      // Construct full address (市區里)
      const parts = [];
      if (city) parts.push(city);
      if (district) parts.push(district);
      if (village) parts.push(village);
      
      fullAddress = parts.join('');
      
      // Set display text and location
      if (fullAddress) {
        formData.value.locationDisplay = fullAddress;
        formData.value.location = fullAddress;
      } else {
        formData.value.locationDisplay = '定位成功';
        formData.value.location = '定位成功';
      }

      console.log('Address components:', { city, district, village, raw: address });
    } else {
      formData.value.locationDisplay = '定位成功';
      formData.value.location = '定位成功';
    }
    
    console.log('Location set:', formData.value.locationDisplay);
  } catch (error) {
    console.error('Location error:', error);

    // User-friendly error messages
    if (error.message.includes('拒絕')) {
      alert('需要位置權限才能使用此功能，請在瀏覽器設定中允許位置存取');
    } else if (error.message.includes('不支援')) {
      alert('您的瀏覽器不支援地理定位功能');
    } else if (error.message.includes('逾時')) {
      alert('定位逾時，請確認您的網路連線並重試');
    } else {
      alert(`定位失敗：${error.message}`);
    }
  } finally {
    isGettingLocation.value = false;
  }
};

const getOfficeLocation = async () => {
  isGettingOfficeLocation.value = true;
  
  try {
    console.log('Getting office location...');
    const position = await getCurrentPosition();

    console.log('Office location obtained:', position);

    // Store coordinates
    formData.value.officeAddressCoords = {
      latitude: position.latitude,
      longitude: position.longitude
    };
    
    // Use Nominatim API to reverse geocode
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}&accept-language=zh-TW`
    );
    
    if (!response.ok) {
      throw new Error('地址解析失敗');
    }
    
    const data = await response.json();
    console.log('🗺️ Office reverse geocode result:', data);
    
    // Extract detailed address information
    const address = data.address;
    let fullAddress = '';
    
    if (address) {
      // Build address: 市 + 區 + 里
      const city = address.city || address.county || '';
      const district = address.town || address.city_district || address.district || address.suburb || '';
      const village = address.village || address.neighbourhood || '';
      
      // Construct full address (市區里)
      const parts = [];
      if (city) parts.push(city);
      if (district) parts.push(district);
      if (village) parts.push(village);
      
      fullAddress = parts.join('');
      
      // Set display text and location
      if (fullAddress) {
        formData.value.officeAddressDisplay = fullAddress;
        formData.value.officeAddress = fullAddress;
      } else {
        formData.value.officeAddressDisplay = '定位成功';
        formData.value.officeAddress = '定位成功';
      }
      
      console.log('Office address components:', { city, district, village, raw: address });
    } else {
      formData.value.officeAddressDisplay = '定位成功';
      formData.value.officeAddress = '定位成功';
    }
    
    console.log('Office location set:', formData.value.officeAddressDisplay);
  } catch (error) {
    console.error('Office location error:', error);
    
    // User-friendly error messages
    if (error.message.includes('拒絕')) {
      alert('需要位置權限才能使用此功能，請在瀏覽器設定中允許位置存取');
    } else if (error.message.includes('不支援')) {
      alert('您的瀏覽器不支援地理定位功能');
    } else if (error.message.includes('逾時')) {
      alert('定位逾時，請確認您的網路連線並重試');
    } else {
      alert(`定位失敗：${error.message}`);
    }
  } finally {
    isGettingOfficeLocation.value = false;
  }
};

const loadProfileData = async () => {
  isLoadingProfile.value = true;
  try {
    const profile = await getMyProfileForEdit();
    console.log('📋 Loaded profile data:', profile);

      if (profile) {
      originalProfile.value = profile;

      // Populate form data
      formData.value.avatar = profile.profile_picture_url || '';
      // Ensure nickname not exceed max length
      formData.value.nickname = (profile.nickname || '').substring(0, maxNicknameLength);

      // Extract primary location district name
      if (profile.locations && profile.locations.length > 0) {
        const primaryLoc = profile.locations.find(loc => loc.is_primary);
        if (primaryLoc) {
          // Directly use formatted_address
          if (primaryLoc.formatted_address) {
            formData.value.locationDisplay = primaryLoc.formatted_address;
            formData.value.location = primaryLoc.formatted_address;
          }
          
          // Store coordinates if available
          if (primaryLoc.coordinates) {
            // Convert PostGIS GeoJSON format to {latitude, longitude}
            if (primaryLoc.coordinates.type === 'Point' && primaryLoc.coordinates.coordinates) {
              formData.value.locationCoords = {
                longitude: primaryLoc.coordinates.coordinates[0],
                latitude: primaryLoc.coordinates.coordinates[1]
              };
            } else if (primaryLoc.coordinates.latitude && primaryLoc.coordinates.longitude) {
              // Already in correct format
              formData.value.locationCoords = primaryLoc.coordinates;
            }
          }
        }

        // Check if there's an office address
        const officeAddr = profile.locations.find(loc => !loc.is_primary && loc.type.includes('公司'));
        if (officeAddr) {
          showOfficeAddress.value = true;
          
          // Directly use formatted_address
          if (officeAddr.formatted_address) {
            formData.value.officeAddressDisplay = officeAddr.formatted_address;
            formData.value.officeAddress = officeAddr.formatted_address;
          }
          
          // Store coordinates if available
          if (officeAddr.coordinates) {
            // Convert PostGIS GeoJSON format to {latitude, longitude}
            if (officeAddr.coordinates.type === 'Point' && officeAddr.coordinates.coordinates) {
              formData.value.officeAddressCoords = {
                longitude: officeAddr.coordinates.coordinates[0],
                latitude: officeAddr.coordinates.coordinates[1]
              };
            } else if (officeAddr.coordinates.latitude && officeAddr.coordinates.longitude) {
              // Already in correct format
              formData.value.officeAddressCoords = officeAddr.coordinates;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
    alert('載入個人資料失敗，請稍後再試');
  } finally {
    isLoadingProfile.value = false;
  }
};

const handleSubmit = async () => {
  isSaving.value = true;

  try {
    // Validate nickname length on submit
    if ((formData.value.nickname || '').length > maxNicknameLength) {
      alert(`暱稱不可超過 ${maxNicknameLength} 字元`);
      isSaving.value = false;
      return;
    }
    // Prepare userData (only changed fields)
    const userData = {};
    if (formData.value.nickname !== originalProfile.value?.nickname) {
      userData.nickname = formData.value.nickname;
    }

    // Upload avatar if a new file was selected
    if (formData.value.avatarFile) {
      console.log('📤 Uploading new avatar...');
      const avatarUrl = await uploadProfilePicture(
        formData.value.avatarFile,
        authStore.user?.id
      );
      userData.profile_picture_url = avatarUrl;
      console.log('✅ Avatar uploaded:', avatarUrl);
    }

    // Prepare profileData (empty for now, no balance/carbon changes from this page)
    const profileData = {};

    // Prepare locationsArray
    const locationsArray = [];

    // Primary location (home)
    if (formData.value.locationCoords) {
      const existingPrimaryLoc = originalProfile.value?.locations?.find(loc => loc.is_primary);
      locationsArray.push({
        id: existingPrimaryLoc?.id, // Include ID if updating existing location
        coordinates: formData.value.locationCoords,
        type: '家',
        is_primary: true,
        formatted_address: formData.value.locationDisplay || formData.value.location
      });
    }

    // Office location (if provided)
    if (showOfficeAddress.value && formData.value.officeAddressCoords) {
      const existingOfficeLoc = originalProfile.value?.locations?.find(
        loc => !loc.is_primary && loc.type.includes('公司')
      );
      locationsArray.push({
        id: existingOfficeLoc?.id, // Include ID if updating existing location
        coordinates: formData.value.officeAddressCoords,
        type: '公司',
        is_primary: false,
        formatted_address: formData.value.officeAddressDisplay || formData.value.officeAddress
      });
    }

    console.log('📤 Updating profile with:', { userData, profileData, locationsArray });

    // Call the real update API
    const result = await updateMyProfile(userData, profileData, locationsArray);

    console.log('✅ Profile updated successfully:', result);

    // Update auth store with new data
    authStore.updateCustomProfile({
      nickname: userData.nickname,
      avatar_url: userData.profile_picture_url
    });

    // Show success message
    alert('個人資料已更新！');

    // Navigate back to profile
    router.push({ name: 'UserProfile' });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    alert(`更新失敗：${error.message}`);
  } finally {
    isSaving.value = false;
  }
};

// Load profile data on mount
onMounted(() => {
  loadProfileData();
});
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

.location-input-group {
  display: flex;
  gap: 12px;
  align-items: stretch;

  .form-input {
    flex: 1;
  }

  .location-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 24px;
    min-width: 120px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: white;
    background: $primary;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;

    i {
      font-size: 16px;
    }

    &:hover:not(:disabled) {
      background: #5fa795;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }

    &:disabled {
      background: #b0d4cb;
      cursor: not-allowed;
      transform: none;
    }

    .spin {
      animation: spin 1s linear infinite;
    }
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
  margin: 0;
}

.hint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

@media (max-width: 575.98px) {
  .hint-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .char-count { text-align: left; }
}

// Avatar Upload
.avatar-upload-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-preview {
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 50%;
  overflow: hidden;

  .preview-image,
  .default-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  .default-avatar {
    font-size: 120px;
    color: #e0e0e0;
  }

  .change-overlay,
  .drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: 50%;

    i {
      font-size: 24px;
      color: white;
    }

    span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      color: white;
      font-weight: 500;
    }
  }

  .drag-overlay {
    opacity: 1;
    background: rgba(111, 184, 165, 0.8);
  }

  &:hover .change-overlay {
    opacity: 1;
  }

  &.drag-over {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(111, 184, 165, 0.4);
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

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Skeleton Loading Styles
.skeleton-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.skeleton-label {
  width: 120px;
  height: 18px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
  margin-bottom: 16px;
}

.skeleton-avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.skeleton-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.skeleton-button {
  width: 120px;
  height: 40px;
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

  &.flex-1 {
    flex: 1;
  }
}

.skeleton-input-group {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.skeleton-hint {
  width: 200px;
  height: 13px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
  margin-top: 6px;
}

.skeleton-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #e0e0e0;
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

  .location-input-group {
    flex-direction: column;

    .location-btn {
      width: 100%;
    }
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
