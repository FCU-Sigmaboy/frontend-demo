<template>
  <div class="how-to-trade-page">
    <AppHeader />

    <div class="content-wrapper">
      <BContainer>
        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav"><router-link to="/">首頁</router-link> &gt; 交易教學</nav>

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

        <!-- Buyer's Guide -->
        <div v-if="activeTab === 'buyer'" class="steps-container">
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
        <div v-else class="steps-container">
          <section v-for="step in sellerSteps" :key="step.number" class="step-section">
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
  import { ref } from 'vue'
  import { BContainer } from 'bootstrap-vue-next'
  import AppHeader from '../components/AppHeader.vue'
  import AppFooter from '../components/AppFooter.vue'

  // Import buyer images
  import buy1 from '../assets/images/buy1.jpg'
  import buy2 from '../assets/images/buy2.jpg'
  import buy3 from '../assets/images/buy3.jpg'
  import buy4 from '../assets/images/buy4.jpg'
  import buy5 from '../assets/images/buy5.jpg'
  import buy6 from '../assets/images/buy6.jpg'
  import buy7 from '../assets/images/buy7.jpg'

  // Import seller images
  import sell1 from '../assets/images/sell1.jpg'
  import sell2 from '../assets/images/sell2.jpg'
  import sell3 from '../assets/images/sell3.jpg'
  import sell4 from '../assets/images/sell4.jpg'
  import sell5 from '../assets/images/sell5.jpg'
  import sell7 from '../assets/images/sell 7ps.png'

  // Import posting guide images
  import post1 from '../assets/images/post1.jpg'
  import post2 from '../assets/images/post2.jpg'
  import post3 from '../assets/images/post3.jpg'
  import post4 from '../assets/images/post4.jpg'
  import post5 from '../assets/images/post5.jpg'

  const activeTab = ref('buyer')

  const buyerSteps = ref([
    {
      number: 1,
      title: '與賣家聯繫',
      description: '找到所需商品後，點擊「私訊此商品」按鈕。',
      image: buy1,
    },
    {
      number: 2,
      title: '表達交易意願',
      description: '系統預設傳訊息「我想詢問」，或您可以手動輸入更改想詢問的內容',
      image: buy2,
    },
    {
      number: 3,
      title: '檢視交易',
      description:
        '待賣家發起交易，跳出「詳情請點擊下方按鈕」系統訊息，可點擊「查看交易詳情」按鈕。或是點擊上方交易清單按鈕（即收據圖示），可以查看所有交易紀錄',
      image: buy3,
    },
    {
      number: 4,
      title: '確認交易',
      description: '點擊「確認交易」按鈕。 ',
      image: buy4,
    },
    {
      number: 5,
      title: '再一次確認交易',
      description:
        '在您的對話視窗中，點擊「確認交易」按鈕。此時系統將會預扣您的點數，確保交易順利進行。',
      image: buy5,
    },
    {
      number: 6,
      title: '面交取物',
      description: '前往約定地點，當面檢查物品狀況，確認無誤後，輸入賣方提供的 PIN 碼完成交換。',
      image: buy6,
    },
    {
      number: 7,
      title: '交易完成',
      description: '跳出交易成功通知，即表示完成交易。',
      image: buy7,
    },
  ])

  const sellerSteps = ref([
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
      description:
        '按下「使用 AI 辨識物品資訊」按鈕，AI 將會讀取圖片中的物品，辨識其顏色、材質與特徵。接著，系統會根據這些資訊，自動為您生成一個吸引人的標題、一段詳盡的描述，並推薦最適合的商品分類，讓您省下大量時間，輕鬆完成刊登。',
      image: post3,
    },
    {
      number: 4,
      title: '確認與修改資訊',
      description: 'AI 辨識完成後，您可以在欄位中手動修改或補充資訊，並設定您期望交換的點數。',
      image: post4,
    },
    {
      number: 5,
      title: '完成刊登',
      description: '確認所有資訊無誤後，點擊「確認」按鈕，即可成功刊登您的物品。',
      image: post5,
    },
    {
      number: 6,
      title: '收到買家訊息',
      description: '刊登後，當有買家對您的物品感興趣時，您會收到私訊。',
      image: sell1,
    },
    {
      number: 7,
      title: '發起交易',
      description:
        '點擊發起交易按鈕（即傳遞愛圖示），出現此視窗，點選買家詢問商品，再按「確認交易」按鈕，即正式發起交易。',
      image: sell7,
    },
    {
      number: 8,
      title: '檢視交易',
      description:
        '聊天室跳出「詳情請點擊下方按鈕」系統訊息，接著按「查看交易詳情」，或是點擊上方交易清單按鈕（即收據圖示），可以查看所有交易紀錄',
      image: sell3,
    },
    {
      number: 9,
      title: '面交提供 PIN 碼',
      description:
        '交易頁面中，點擊「點擊查看」按鈕，跳出此視窗，上面顯示的 PIN 碼，需在面交時給買家。',
      image: sell4,
    },
    {
      number: 10,
      title: '交易完成',
      description:
        '當買家完成 PIN 碼驗證後，交易流程即視為結束，系統將把該筆訂單歸類至已完成交易，即為完成交易。',
      image: sell5,
    },
  ])
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
