<template>
  <div class="how-to-post-page">
    <AppHeader />

    <div class="content-wrapper">
      <BContainer>
        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav">
          <router-link to="/">首頁</router-link> &gt; 刊登教學
        </nav>

        <!-- Page Title -->
        <div class="page-header">
          <h1 class="page-title">如何刊登</h1>
          <p class="page-subtitle">遵循這些簡單的步驟，輕鬆刊登您的物品以進行交換</p>
        </div>

        <!-- Steps Section -->
        <div class="steps-container">
          <section v-for="step in postingSteps" :key="step.number" class="step-section">
            <div class="step-content">
              <h2 class="step-number">STEP {{ step.number }}</h2>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-description">{{ step.description }}</p>
            </div>
            <div class="step-image-wrapper">
              <img :src="step.image" :alt="step.title" class="step-image" />
            </div>
          </section>
        </div>
      </BContainer>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { BContainer } from 'bootstrap-vue-next';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

// Import posting guide images
import post1 from '../assets/images/post1.jpg';
import post2 from '../assets/images/post2.jpg';
import post3 from '../assets/images/post3.jpg';
import post4 from '../assets/images/post4.jpg';
import post5 from '../assets/images/post5.jpg';

const postingSteps = ref([
  {
    number: 1,
    title: '開始刊登',
    description: '前往主頁面，點擊「刊登」按鈕。',
    image: post1,
  },
  {
    number: 2,
    title: '上傳圖片',
    description: '點擊此處，可上傳商品圖。',
    image: post2,
  },
  {
    number: 3,
    title: 'AI 幫您寫文案',
    description: '按下「使用 AI 辨識物品資訊」按鈕，系統會開始分析圖片。',
    image: post3,
  },
  {
    number: 4,
    title: '確認與修改資訊',
    description: 'AI 辨識完成後，即完成自動生成標題、描述與分類。',
    image: post4,
  },
  {
    number: 5,
    title: '完成刊登',
    description: '確認所有資訊無誤後，點擊「確認」按鈕，即可成功刊登您的物品。',
    image: post5,
  },
]);
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.how-to-post-page {
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

.page-header {
  text-align: center;
  margin-bottom: 60px;
}

.page-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #1e1e1e;
  margin-bottom: 12px;
}

.page-subtitle {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  color: #666;
}

.steps-container {
  max-width: 800px;
  margin: 0 auto 80px;
}

.step-section {
  margin-bottom: 80px;
  text-align: center;
}

.step-image-wrapper {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  display: inline-block;
  overflow: hidden;
  margin-top: 24px;
  width: 100%;
}

.step-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  aspect-ratio: 1680 / 920;
}

.step-content {
  padding: 20px 0;
}

.step-number {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: $primary;
  margin-bottom: 12px;
}

.step-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 28px;
  font-weight: 600;
  color: #1e1e1e;
  margin-bottom: 16px;
}

.step-description {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #666;
  margin: 0;
}

.cta-section {
  background: linear-gradient(135deg, $primary 0%, #5fa795 100%);
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  color: white;
  box-shadow: 0 8px 24px rgba(111, 184, 165, 0.3);

  h2 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    margin-bottom: 32px;
    opacity: 0.95;
  }

  .btn-cta {
    display: inline-block;
    background-color: white;
    color: $primary;
    border-radius: 30px;
    padding: 14px 48px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s;

    &:hover {
      background-color: #f0f0f0;
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
  }
}

@media (max-width: 991.98px) {
  .step-section {
    margin-bottom: 60px;
  }
  .step-content {
    padding: 15px;
  }
}

@media (max-width: 767.98px) {
  .step-section {
    margin-bottom: 40px;
  }
  .step-image-wrapper {
    margin-bottom: 20px;
  }
  .step-content {
    text-align: center;
  }
}
</style>
