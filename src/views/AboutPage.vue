<template>
  <div class="about-page">
    <AppHeader />

    <div class="content-wrapper">
      <BContainer>
        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav">
          <router-link to="/">首頁</router-link> &gt; 關於我們
        </nav>

        <!-- Hero Banner with Upload -->
        <div class="hero-banner" :class="{ 'is-admin': isAdmin }" @click="isAdmin && triggerFileUpload('cover')">
          <img v-if="coverImageUrl" :src="coverImageUrl" alt="關於我們封面圖" class="hero-image" />
          <div v-else class="hero-placeholder">
            <i class="bi bi-image"></i>
          </div>

          <div v-if="isAdmin" class="upload-overlay">
            <div v-if="isUploading" class="upload-status">
              <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">上傳中...請稍候</span>
              </div>
              <p>上傳中...請稍後</p>
            </div>
            <div v-else class="upload-prompt">
              <i class="bi bi-camera-fill"></i>
              <p>點擊更換封面圖片</p>
            </div>
          </div>
        </div>
        <input
          v-if="isAdmin"
          ref="fileInput"
          type="file"
          accept=".jpg,.jpeg,.png,.heic"
          style="display: none"
          @change="handleFileChange"
        />

        <!-- Vision Section -->
        <section class="content-section">
          <h2 class="section-title">我們的願景</h2>
          <p class="section-description">
            打造台中市民最友善的二手物品交易平台，透過點數激勵機制，鼓勵市民將閒置物品重新利用，減少浪費，促進永續發展。讓每個人都能輕鬆參與循環經濟，為環境保護盡一份心力。
          </p>

          <BRow class="image-grid">
            <BCol v-for="(item, index) in visionItems" :key="index" cols="12" md="4" class="mb-4">
              <div class="vision-image-wrapper" :class="{ 'is-admin': isAdmin }" @click="isAdmin && triggerFileUpload(`vision-${index}`)">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="`願景圖片 ${index + 1}`" class="vision-image" />
                <div v-else class="image-placeholder">
                  <i :class="item.icon"></i>
                </div>
                <div v-if="isAdmin" class="upload-overlay">
                  <div v-if="isUploading" class="upload-status">
                    <div class="spinner-border text-light" role="status"></div>
                  </div>
                  <div v-else class="upload-prompt">
                    <i class="bi bi-camera-fill"></i>
                  </div>
                </div>
              </div>
            </BCol>
          </BRow>
        </section>

        <!-- Mission Section -->
        <section class="content-section">
          <h2 class="section-title">我們的使命</h2>
          <p class="section-description">
            台中易起來致力於建立一個安全、便利、環保的二手物品交易生態系統。透過創新的點數制度，讓每一次交易都成為對環境友善的行動。我們相信，透過鄰里間的物品交換與再利用，不僅能減少資源浪費，更能凝聚社區情感，創造更美好的生活環境。我們的平台不涉及真實貨幣交易，所有點數都是透過回收、交易等環保行為獲得，讓永續發展成為每個人的日常習慣。
          </p>
        </section>

        <!-- Team/Values Section -->
        <section class="content-section">
          <BRow class="value-cards">
            <BCol cols="12" md="4" class="mb-4">
              <div class="value-card">
                <div class="value-icon">
                  <i class="bi bi-shield-check"></i>
                </div>
                <h3>安全可靠</h3>
                <p>嚴格的使用者審核機制，確保每筆交易都安全無虞</p>
              </div>
            </BCol>
            <BCol cols="12" md="4" class="mb-4">
              <div class="value-card">
                <div class="value-icon">
                  <i class="bi bi-leaf"></i>
                </div>
                <h3>環保永續</h3>
                <p>透過物品再利用，減少資源浪費，為地球盡一份心力</p>
              </div>
            </BCol>
            <BCol cols="12" md="4" class="mb-4">
              <div class="value-card">
                <div class="value-icon">
                  <i class="bi bi-hand-thumbs-up"></i>
                </div>
                <h3>友善社區</h3>
                <p>促進鄰里互動，建立溫暖的社區交流網絡</p>
              </div>
            </BCol>
          </BRow>
        </section>
      </BContainer>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { BContainer, BRow, BCol } from 'bootstrap-vue-next';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import { useAuthStore } from '../stores/auth';
import { uploadImage } from '../api/uploadImage';
import { supabase } from '../lib/supabase';

const authStore = useAuthStore();
const fileInput = ref(null);
const coverImageUrl = ref(null);
const visionItems = ref([
  { imageUrl: null, icon: 'bi bi-recycle' },
  { imageUrl: null, icon: 'bi bi-people' },
  { imageUrl: null, icon: 'bi bi-heart' },
]);
const isUploading = ref(false);
const currentUploadTarget = ref(null);

const isAdmin = computed(() => authStore.profileData?.role === 'admin');

const triggerFileUpload = (target) => {
  if (isUploading.value || !isAdmin.value) return;
  currentUploadTarget.value = target;
  fileInput.value.click();
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];
  if (!allowedTypes.includes(file.type)) {
    alert('圖片格式不符，僅限 JPG, PNG, HEIC。');
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('圖片大小不可超過 5MB。');
    return;
  }

  isUploading.value = true;
  try {
    const target = currentUploadTarget.value;
    let fileName;
    if (target === 'cover') {
      fileName = 'about-us-cover.jpg';
    } else if (target.startsWith('vision-')) {
      const index = parseInt(target.split('-')[1], 10);
      fileName = `about-us-vision-${index + 1}.jpg`;
    }

    const newUrl = await uploadImage(file, fileName);

    if (target === 'cover') {
      coverImageUrl.value = newUrl;
    } else if (target.startsWith('vision-')) {
      const index = parseInt(target.split('-')[1], 10);
      visionItems.value[index].imageUrl = newUrl;
    }

    alert('圖片更新成功！');
  } catch (error) {
    console.error('Upload failed:', error);
    alert(`上傳失敗：${error.message}`);
  } finally {
    isUploading.value = false;
    event.target.value = '';
    currentUploadTarget.value = null;
  }
};

const loadInitialImages = async () => {
  const { data: files, error } = await supabase.storage.from('images').list();
  if (error) {
    console.error('Error listing files:', error);
    return;
  }

  const fileNames = new Set(files.map(file => file.name));

  const getPublicUrl = (fileName) => {
    if (fileNames.has(fileName)) {
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      return data.publicUrl;
    }
    return null;
  };

  coverImageUrl.value = getPublicUrl('about-us-cover.jpg');
  visionItems.value[0].imageUrl = getPublicUrl('about-us-vision-1.jpg');
  visionItems.value[1].imageUrl = getPublicUrl('about-us-vision-2.jpg');
  visionItems.value[2].imageUrl = getPublicUrl('about-us-vision-3.jpg');
};

onMounted(() => {
  loadInitialImages();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.about-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.content-wrapper {
  flex: 1;
  padding: 40px 0 60px;
}

.breadcrumb-nav {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;

  a {
    color: $primary;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.hero-banner, .vision-image-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;

  &.is-admin {
    cursor: pointer;

    &:hover .upload-overlay {
      opacity: 1;
    }
  }
}

.hero-banner {
  margin-bottom: 50px;
}

.hero-image,
.hero-placeholder,
.vision-image {
  width: 100%;
  display: block;
}

.hero-image,
.hero-placeholder {
  height: 400px;
  object-fit: cover;
}

.vision-image,
.image-placeholder {
  height: 280px;
  object-fit: cover;
}

.hero-placeholder, .image-placeholder {
  background: linear-gradient(135deg, #e9f5f2 0%, #d4e9e4 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 80px;
    color: rgba(111, 184, 165, 0.5);
  }
}

.image-placeholder i {
  font-size: 60px;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  .upload-status,
  .upload-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  i {
    font-size: 48px;
  }

  p {
    font-size: 18px;
    font-weight: 500;
    margin: 0;
  }
}

.content-section {
  margin-bottom: 60px;
}

.section-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 32px;
  font-weight: 600;
  color: #1e1e1e;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 3px solid $primary;
  display: inline-block;
}

.section-description {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  line-height: 1.8;
  color: #555;
  margin-bottom: 40px;
}

.image-grid {
  margin-top: 30px;
}

.value-cards {
  margin-top: 30px;
}

.value-card {
  background-color: white;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(111, 184, 165, 0.2);
  }

  .value-icon {
    width: 80px;
    height: 80px;
    background-color: #e9f5f2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;

    i {
      font-size: 40px;
      color: $primary;
    }
  }

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #1e1e1e;
    margin-bottom: 16px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #666;
    margin: 0;
  }
}

@media (max-width: 991.98px) {
  .content-wrapper {
    padding: 30px 0 50px;
  }

  .breadcrumb-nav {
    font-size: 15px;
    margin-bottom: 25px;
  }

  .hero-image,
  .hero-placeholder {
    height: 300px;
  }

  .vision-image,
  .image-placeholder {
    height: 240px;
  }

  .section-title {
    font-size: 28px;
  }

  .section-description {
    font-size: 17px;
  }

  .value-card {
    padding: 35px 25px;
  }
}

@media (max-width: 575.98px) {
  .content-wrapper {
    padding: 20px 0 40px;
  }

  .breadcrumb-nav {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .hero-image,
  .hero-placeholder {
    height: 240px;
  }
  
  .vision-image,
  .image-placeholder {
    height: 200px;
  }

  .content-section {
    margin-bottom: 50px;
  }

  .section-title {
    font-size: 24px;
  }

  .section-description {
    font-size: 16px;
  }

  .value-card {
    padding: 30px 20px;
  }
}
</style>
