<template>
  <div class="about-page">
    <AppHeader />

    <div class="content-wrapper">
      <BContainer>
        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav">
          <router-link to="/">首頁</router-link> &gt; 關於我們
        </nav>

        <!-- Hero Banner -->
        <div class="hero-banner">
          <div class="hero-placeholder">
            <i class="bi bi-image"></i>
          </div>
        </div>

        <!-- Vision Section -->
        <section class="content-section">
          <h2 class="section-title">我們的願景</h2>
          <p class="section-description">
            打造台中市民最友善的二手物品交易平台，透過點數激勵機制，鼓勵市民將閒置物品重新利用，減少浪費，促進永續發展。讓每個人都能輕鬆參與循環經濟，為環境保護盡一份心力。
          </p>

          <BRow class="image-grid">
            <BCol cols="12" md="4" class="mb-4">
              <div class="image-placeholder">
                <i class="bi bi-recycle"></i>
              </div>
            </BCol>
            <BCol cols="12" md="4" class="mb-4">
              <div class="image-placeholder">
                <i class="bi bi-people"></i>
              </div>
            </BCol>
            <BCol cols="12" md="4" class="mb-4">
              <div class="image-placeholder">
                <i class="bi bi-heart"></i>
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
import { BContainer, BRow, BCol } from 'bootstrap-vue-next';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
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

.hero-banner {
  margin-bottom: 50px;
  border-radius: 12px;
  overflow: hidden;
}

.hero-placeholder {
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, $primary 0%, #5fa795 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 80px;
    color: rgba(255, 255, 255, 0.3);
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

.image-placeholder {
  width: 100%;
  height: 280px;
  background-color: #e9f5f2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed $primary;

  i {
    font-size: 60px;
    color: $primary;
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

  .hero-placeholder {
    height: 300px;

    i {
      font-size: 60px;
    }
  }

  .section-title {
    font-size: 28px;
  }

  .section-description {
    font-size: 17px;
  }

  .image-placeholder {
    height: 240px;

    i {
      font-size: 50px;
    }
  }

  .value-card {
    padding: 35px 25px;

    .value-icon {
      width: 70px;
      height: 70px;

      i {
        font-size: 35px;
      }
    }

    h3 {
      font-size: 20px;
    }

    p {
      font-size: 15px;
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

  .hero-placeholder {
    height: 240px;
    border-radius: 8px;

    i {
      font-size: 50px;
    }
  }

  .content-section {
    margin-bottom: 50px;
  }

  .section-title {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .section-description {
    font-size: 16px;
    margin-bottom: 30px;
  }

  .image-placeholder {
    height: 200px;

    i {
      font-size: 40px;
    }
  }

  .value-card {
    padding: 30px 20px;

    .value-icon {
      width: 60px;
      height: 60px;

      i {
        font-size: 30px;
      }
    }

    h3 {
      font-size: 18px;
    }

    p {
      font-size: 14px;
    }
  }
}
</style>
