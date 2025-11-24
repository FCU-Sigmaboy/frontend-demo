<template>
  <div class="about-page">
    <AppHeader />

    <div class="content-wrapper">
      <BContainer>
        <!-- Breadcrumb -->
        <Breadcrumb :items="[{ label: '關於我們' }]" />

        <!-- Hero Banner with Upload -->
        <div class="hero-banner" :class="{ 'is-admin': isAdmin }" @click="isAdmin && triggerFileUpload('cover')">
          <img :src="coverImageUrl" alt="關於我們封面圖" class="hero-image" />
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
            「台中易起來」（以下簡稱「本平台」）致力於打造友善環境的惜物生活圈。我們提倡以「再利用」取代「丟棄」，減少對自然生態的衝擊，守護唯一的家園。透過點數獎勵機制，讓參與循環經濟變得輕鬆簡單，將閒置資源轉化為生生不息的綠色能量。
          </p>

          <BRow class="image-grid">
            <BCol v-for="(item, index) in visionItems" :key="index" cols="12" md="4" class="mb-4">
              <div class="vision-item">
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
                <div class="vision-caption">
                  <p>{{ item.caption }}</p>
                </div>
              </div>
            </BCol>
          </BRow>
        </section>

        <!-- Mission Section -->
        <section class="content-section">
          <h2 class="section-title">我們的使命</h2>
          <p class="section-description">
            本平台致力於建立一個安全、便利、環保的二手物品交易生態系統。透過創新的點數制度，讓每一次交易都成為對環境友善的行動。我們相信，透過鄰里間的物品交換與再利用，不僅能減少資源浪費，更能凝聚社區情感，創造更美好的生活環境。我們的平台不涉及真實貨幣交易，所有點數都是透過回收、交易等環保行為獲得，讓永續發展成為每個人的日常習慣。
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
                <h3>安全可靠的 PIN 碼機制</h3>
                <p>買家透過私訊與賣家取得聯繫後，賣家即可發起交易，經買家確認無誤，現場面交時，必須輸入賣方提供的 PIN 碼，完成全部流程。系統將立即撥付點數至賣家帳戶，保障每筆交易安全無虞。</p>
              </div>
            </BCol>
            <BCol cols="12" md="4" class="mb-4">
              <div class="value-card">
                <div class="value-icon">
                  <i class="bi bi-leaf"></i>
                </div>
                <h3>環保永續</h3>
                <p>我們深信世上沒有廢棄物，只有放錯位置的資源。透過交換賦予閒置物品第二生命，不僅能延長產品週期，也能減少碳排放，讓每一次的點數獲取都成為愛護地球的具體實踐。</p>
              </div>
            </BCol>
            <BCol cols="12" md="4" class="mb-4">
              <div class="value-card">
                <div class="value-icon">
                  <i class="bi bi-hand-thumbs-up"></i>
                </div>
                <h3>友善社區</h3>
                <p>我們致力於打破都市冷漠，透過不涉及金錢的純粹分享，重拾鄰里間的信任與溫度。每一次的面交不僅是物品的傳遞，更是連結在地情感、建立互助生活圈的溫暖契機。</p>
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
import Breadcrumb from '../components/Breadcrumb.vue';
import { useAuthStore } from '../stores/auth';
import { uploadImage } from '../api/uploadImage';
import { supabase } from '../lib/supabase';
import marketImage from '../assets/market.jpg';
import earthImage from '../assets/earth.jpg';
import fishImage from '../assets/fish.jpg';
import forestImage from '../assets/forest.jpg';

const authStore = useAuthStore();
const fileInput = ref(null);
const coverImageUrl = ref(marketImage);
const visionItems = ref([
  { imageUrl: earthImage, icon: 'bi bi-recycle', caption: '守護家園 —— 承擔責任，減輕地球負擔' },
  { imageUrl: fishImage, icon: 'bi bi-people', caption: '拒絕浪費 —— 減少污染，讓生態喘息' },
  { imageUrl: forestImage, icon: 'bi bi-heart', caption: '點亮新生 —— 循環利用，看見永續希望' },
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

    let newUrl = await uploadImage(file, fileName);

    // Add a timestamp to break the cache
    newUrl = `${newUrl}?t=${new Date().getTime()}`;

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
  // Since we are using local images as defaults, we don't need to fetch from Supabase on initial load.
  // The upload function will handle updating the images.
};

onMounted(() => {
  // No need to load initial images from Supabase if we are using local defaults.
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

.vision-item {
  text-align: center;
}

.vision-caption {
  margin-top: 16px;

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 400;
    color: #333;
    margin: 0;
  }
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
