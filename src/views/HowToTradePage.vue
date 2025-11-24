<template>
  <div class="how-to-trade-page">
    <AppHeader />

    <div class="content-wrapper">
      <BContainer>
        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav">
          <router-link to="/">首頁</router-link> &gt; 如何交易
        </nav>

        <!-- Page Title -->
        <div class="page-header">
          <h1 class="page-title">如何交易</h1>
          <p class="page-subtitle">簡單幾步驟，輕鬆完成環保交易</p>
        </div>

        <!-- Guide Tabs -->
        <div class="guide-tabs">
          <button
            :class="['tab-btn', { active: activeTab === 'buyer' }]"
            @click="activeTab = 'buyer'"
          >
            買家指南
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'seller' }]"
            @click="activeTab = 'seller'"
          >
            賣家指南
          </button>
        </div>

        <!-- Steps Section -->
        <div class="steps-container">
          <!-- Buyer's Guide -->
          <div v-if="activeTab === 'buyer'">
            <section v-for="step in buyerSteps" :key="step.number" class="step-section">
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

          <!-- Seller's Guide -->
          <div v-else>
            <section v-for="step in sellerSteps" :key="step.number" class="step-section">
              <div class="step-content">
                <h2 class="step-number">STEP {{ step.number }}</h2>
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-description">{{ step.description }}</p>
              </div>
              <div class="step-image-wrapper">
                <img v-if="step.image" :src="step.image" :alt="step.title" class="step-image" />
                <i v-else :class="step.icon" class="step-icon"></i>
              </div>
            </section>
          </div>
        </div>

        <!-- Tips Section -->
        <section class="tips-section">
          <h2 class="tips-title">
            <i class="bi bi-lightbulb"></i>
            交易小提醒
          </h2>
          <BRow>
            <BCol cols="12" md="6" lg="3" class="mb-4">
              <div class="tip-card">
                <div class="tip-icon">
                  <i class="bi bi-shield-check"></i>
                </div>
                <h4>選擇安全地點</h4>
                <p>建議在捷運站、便利商店等公共場所交易，確保雙方安全。</p>
              </div>
            </BCol>

            <BCol cols="12" md="6" lg="3" class="mb-4">
              <div class="tip-card">
                <div class="tip-icon">
                  <i class="bi bi-eye"></i>
                </div>
                <h4>仔細檢查物品</h4>
                <p>交易前務必檢查物品狀況，確認與描述相符後再完成交易。</p>
              </div>
            </BCol>

            <BCol cols="12" md="6" lg="3" class="mb-4">
              <div class="tip-card">
                <div class="tip-icon">
                  <i class="bi bi-clock"></i>
                </div>
                <h4>準時赴約</h4>
                <p>尊重彼此的時間，若有變動請提前告知對方。</p>
              </div>
            </BCol>

            <BCol cols="12" md="6" lg="3" class="mb-4">
              <div class="tip-card">
                <div class="tip-icon">
                  <i class="bi bi-exclamation-triangle"></i>
                </div>
                <h4>遇到問題立即檢舉</h4>
                <p>若發現詐欺或不當行為，請立即聯繫客服，我們會在1至3個工作天內，做出必要處置。</p>
              </div>
            </BCol>
          </BRow>
        </section>

        <!-- CTA Section -->
        <div class="cta-section">
          <h2>準備好開始交易了嗎？</h2>
          <p>立即加入台中易起來，讓閒置物品找到新主人！</p>
          <router-link to="/items" class="btn-cta">開始瀏覽物品</router-link>
        </div>
      </BContainer>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { BContainer, BRow, BCol } from 'bootstrap-vue-next';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

// Import buyer images
import buy0 from '../assets/images/buy0.png';
import buy1 from '../assets/images/buy1.png';
import buy2 from '../assets/images/buy2.png';
import buy3 from '../assets/images/buy3.png';
import buy4 from '../assets/images/buy4.png';
import buy5 from '../assets/images/buy5.png';
import buy6 from '../assets/images/buy6.png';

// Import seller images
import sell1 from '../assets/images/sell1.png';
import sell2 from '../assets/images/sell2.png';
import sell3 from '../assets/images/sell3.png';
import sell4 from '../assets/images/sell4.png';
import sell5 from '../assets/images/sell5.png';

const activeTab = ref('buyer');

const buyerSteps = ref([
  {
    number: 1,
    title: '與賣家聯繫',
    description: '找到所需商品後，點擊「私訊此商品」按鈕',
    image: buy0,
  },
  {
    number: 2,
    title: '表達交易意願',
    description: '跳轉到聊天室視窗，傳訊息給賣家',
    image: buy1,
  },
  {
    number: 3,
    title: '檢視交易',
    description: '如賣家願意交易，跳出「詳情請點擊」系統訊息，請您點擊「查看交易詳情」按鈕',
    image: buy2,
  },
  {
    number: 4,
    title: '確認交易',
    description: '接著跳轉到「我的交易」頁面，點擊「確認交易」',
    image: buy3,
  },
  {
    number: 5,
    title: '再一次確認交易',
    description: '在您的對話視窗中，點擊「確認交易」按鈕。此時系統將會預扣您的點數，確保交易順利進行。',
    image: buy4,
  },
  {
    number: 6,
    title: '面交取物',
    description: '前往約定地點（建議選擇公共場所），當面檢查物品狀況，確認無誤後，輸入賣方提供的 PIN 碼完成交換。',
    image: buy5,
  },
  {
    number: 7,
    title: '交易完成',
    description: '跳出交易成功視窗，即表示完成交易',
    image: buy6,
  },
]);

const sellerSteps = ref([
  {
    number: 1,
    title: '發起交易',
    description: '點擊圖片左下角「傳遞愛」按鈕，即為發起交易，接著跳出此視窗，請按「確認交易」。',
    image: sell1,
  },
  {
    number: 2,
    title: '檢視交易',
    description: '按下「確認交易」按鈕，聊天室內跳出「詳情請點擊下方按鈕」訊息，請按「查看交易詳情」。',
    image: sell2,
  },
  {
    number: 3,
    title: '發起交易',
    description: '接著系統跳轉到「我的交易」頁面，點擊「點擊查看」，跳出 PIN 碼，需面交時提供給買家輸入。',
    image: sell3,
  },
  {
    number: 4,
    title: '面交提供 PIN 碼',
    description: '待買家輸入 PIN 碼，即完成所有交易，收到通知買家已接受交易',
    image: sell4,
  },
  {
    number: 5,
    title: '面交並提供 PIN 碼',
    description: '在約定地點與買家見面，並在他們確認物品狀況後，提供您的交易 PIN 碼讓他們輸入。',
    image: sell5,
  },
  {
    number: 6,
    title: '完成交易與評價',
    description: '買家輸入 PIN 碼後，交易即告完成，點數將自動轉入您的帳戶。別忘了給予對方一個好評！',
    icon: 'bi bi-check2-circle',
  },
]);
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.how-to-trade-page {
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
  margin-bottom: 40px;
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

.guide-tabs {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 60px;

  .tab-btn {
    padding: 12px 32px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    border: 2px solid transparent;
    border-radius: 30px;
    background-color: #e0e0e0;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;

    &.active {
      background-color: $primary;
      color: white;
      border-color: $primary;
    }

    &:hover:not(.active) {
      background-color: #d0d0d0;
    }
  }
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

.step-icon {
  font-size: 120px;
  color: $primary;
  padding: 80px;
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

.tips-section {
  background-color: white;
  border-radius: 16px;
  padding: 50px 40px;
  margin-bottom: 60px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 28px;
  font-weight: 600;
  color: #1e1e1e;
  margin-bottom: 40px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  i {
    font-size: 32px;
    color: #ffc107;
  }
}

.tip-card {
  text-align: center;
  padding: 20px;

  .tip-icon {
    width: 70px;
    height: 70px;
    background-color: #e9f5f2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;

    i {
      font-size: 32px;
      color: $primary;
    }
  }

  h4 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin-bottom: 12px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #666;
    margin: 0;
  }
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
  .guide-tabs {
    gap: 10px;
    .tab-btn {
      padding: 10px 20px;
      font-size: 16px;
    }
  }
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
