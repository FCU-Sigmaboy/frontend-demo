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
          <p class="page-subtitle">簡單六步驟，輕鬆完成環保交易</p>
        </div>

        <!-- Steps Grid -->
        <div class="steps-grid">
          <!-- Row 1: Steps 1-3 -->
          <BRow class="step-row">
            <BCol cols="12" md="4" class="mb-4">
              <div class="step-card">
                <div class="step-number">1</div>
                <div class="step-image">
                  <i class="bi bi-search"></i>
                </div>
                <h3 class="step-title">搜尋物品</h3>
                <p class="step-description">
                  使用搜尋功能或瀏覽分類，找到您感興趣的二手物品。可以依據距離、點數、類別等條件篩選。
                </p>
              </div>
            </BCol>

            <BCol cols="12" md="4" class="mb-4">
              <div class="step-card">
                <div class="step-number">2</div>
                <div class="step-image">
                  <i class="bi bi-info-circle"></i>
                </div>
                <h3 class="step-title">查看物品詳情</h3>
                <p class="step-description">
                  仔細閱讀物品描述、查看照片、確認所需點數，並參考提供者的評價與信譽分數。
                </p>
              </div>
            </BCol>

            <BCol cols="12" md="4" class="mb-4">
              <div class="step-card">
                <div class="step-number">3</div>
                <div class="step-image">
                  <i class="bi bi-chat-dots"></i>
                </div>
                <h3 class="step-title">聯繫提供者</h3>
                <p class="step-description">
                  透過平台私訊功能與提供者溝通，詢問物品狀況、約定交易時間與地點。
                </p>
              </div>
            </BCol>
          </BRow>

          <!-- Arrow Down -->
          <div class="arrow-down">
            <i class="bi bi-arrow-down"></i>
          </div>

          <!-- Row 2: Steps 4-6 -->
          <BRow class="step-row">
            <BCol cols="12" md="4" class="mb-4">
              <div class="step-card">
                <div class="step-number">4</div>
                <div class="step-image">
                  <i class="bi bi-hand-index-thumb"></i>
                </div>
                <h3 class="step-title">確認交易</h3>
                <p class="step-description">
                  確認點數足夠後，點擊「確認交易」按鈕。系統會暫時凍結您的點數，待交易完成後轉給提供者。
                </p>
              </div>
            </BCol>

            <BCol cols="12" md="4" class="mb-4">
              <div class="step-card">
                <div class="step-number">5</div>
                <div class="step-image">
                  <i class="bi bi-people"></i>
                </div>
                <h3 class="step-title">面交取物</h3>
                <p class="step-description">
                  前往約定地點（建議選擇公共場所），當面檢查物品狀況，確認無誤後完成交換。
                </p>
              </div>
            </BCol>

            <BCol cols="12" md="4" class="mb-4">
              <div class="step-card">
                <div class="step-number">6</div>
                <div class="step-image">
                  <i class="bi bi-star"></i>
                </div>
                <h3 class="step-title">評價與完成</h3>
                <p class="step-description">
                  在平台上確認交易完成，並給予對方評價。良好的評價有助於建立社群信任。
                </p>
              </div>
            </BCol>
          </BRow>
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
                <p>若發現詐欺或不當行為，請立即透過平台檢舉功能回報。</p>
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
import { BContainer, BRow, BCol } from 'bootstrap-vue-next';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
</script>

<style scoped lang="scss">
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
    color: #6fb8a5;
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

.steps-grid {
  margin-bottom: 80px;
}

.step-row {
  margin-bottom: 20px;
}

.step-card {
  background-color: white;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(111, 184, 165, 0.2);
  }

  .step-number {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 40px;
    height: 40px;
    background-color: #6fb8a5;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 700;
  }

  .step-image {
    width: 120px;
    height: 120px;
    background-color: #e9f5f2;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    border: 2px solid #6fb8a5;

    i {
      font-size: 50px;
      color: #6fb8a5;
    }
  }

  .step-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #1e1e1e;
    margin-bottom: 16px;
  }

  .step-description {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #666;
    margin: 0;
  }
}

.arrow-down {
  text-align: center;
  margin: 30px 0;

  i {
    font-size: 40px;
    color: #6fb8a5;
    animation: bounce 2s infinite;
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
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
      color: #6fb8a5;
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
  background: linear-gradient(135deg, #6fb8a5 0%, #5fa795 100%);
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
    color: #6fb8a5;
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
  .content-wrapper {
    padding: 30px 0 50px;
  }

  .breadcrumb-nav {
    font-size: 15px;
    margin-bottom: 25px;
  }

  .page-header {
    margin-bottom: 50px;
  }

  .page-title {
    font-size: 32px;
  }

  .page-subtitle {
    font-size: 17px;
  }

  .steps-grid {
    margin-bottom: 70px;
  }

  .step-card {
    padding: 35px 25px;

    .step-number {
      width: 36px;
      height: 36px;
      font-size: 18px;
    }

    .step-image {
      width: 110px;
      height: 110px;

      i {
        font-size: 45px;
      }
    }

    .step-title {
      font-size: 20px;
    }

    .step-description {
      font-size: 14px;
    }
  }

  .arrow-down {
    margin: 25px 0;

    i {
      font-size: 36px;
    }
  }

  .tips-section {
    padding: 45px 35px;
    margin-bottom: 50px;
  }

  .tips-title {
    font-size: 26px;
    margin-bottom: 35px;

    i {
      font-size: 30px;
    }
  }

  .tip-card {
    .tip-icon {
      width: 65px;
      height: 65px;

      i {
        font-size: 30px;
      }
    }

    h4 {
      font-size: 17px;
    }

    p {
      font-size: 13px;
    }
  }

  .cta-section {
    padding: 50px 35px;

    h2 {
      font-size: 28px;
    }

    p {
      font-size: 17px;
    }

    .btn-cta {
      font-size: 17px;
      padding: 13px 44px;
    }
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

  .page-header {
    margin-bottom: 40px;
  }

  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 15px;
  }

  .steps-grid {
    margin-bottom: 60px;
  }

  .step-row {
    margin-bottom: 15px;
  }

  .step-card {
    padding: 30px 20px;

    .step-number {
      width: 32px;
      height: 32px;
      font-size: 16px;
      top: 15px;
      left: 15px;
    }

    .step-image {
      width: 100px;
      height: 100px;
      border-radius: 10px;

      i {
        font-size: 40px;
      }
    }

    .step-title {
      font-size: 18px;
      margin-bottom: 14px;
    }

    .step-description {
      font-size: 13px;
    }
  }

  .arrow-down {
    margin: 20px 0;

    i {
      font-size: 32px;
    }
  }

  .tips-section {
    padding: 40px 25px;
    margin-bottom: 40px;
    border-radius: 12px;
  }

  .tips-title {
    font-size: 22px;
    margin-bottom: 30px;

    i {
      font-size: 26px;
    }
  }

  .tip-card {
    padding: 15px;

    .tip-icon {
      width: 60px;
      height: 60px;

      i {
        font-size: 28px;
      }
    }

    h4 {
      font-size: 16px;
      margin-bottom: 10px;
    }

    p {
      font-size: 13px;
    }
  }

  .cta-section {
    padding: 45px 25px;
    border-radius: 12px;

    h2 {
      font-size: 24px;
      margin-bottom: 12px;
    }

    p {
      font-size: 15px;
      margin-bottom: 28px;
    }

    .btn-cta {
      font-size: 16px;
      padding: 12px 40px;
    }
  }
}
</style>
