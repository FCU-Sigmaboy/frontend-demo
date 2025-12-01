<template>
  <footer class="app-footer">
    <BContainer>
      <BRow class="footer-content justify-content-center align-items-start">
        <!-- Logo -->
        <BCol cols="12" lg="3" class="text-center text-lg-start mb-4 mb-lg-0 d-flex justify-content-center justify-content-lg-start">
          <div class="footer-logo">
            <img :src="logoImage" alt="Logo" class="logo-img" />
          </div>
        </BCol>

        <!-- About Section -->
        <BCol cols="12" md="6" lg="3" class="mb-4 mb-lg-0">
          <div class="footer-section about-links">
            <h5 class="footer-heading">關於台中易起來</h5>
            <ul class="footer-links">
              <li><router-link :to="{ name: 'About' }">關於我們</router-link></li>
              <li><router-link :to="{ name: 'Terms' }">服務條款</router-link></li>
            </ul>
          </div>
        </BCol>

        <!-- Rights Section -->
        <BCol cols="12" md="6" lg="3" class="mb-4 mb-lg-0">
          <div class="footer-section rights-links">
            <h5 class="footer-heading">權益相關</h5>
            <ul class="footer-links">
              <li><router-link :to="{ name: 'FAQ' }">常見 Q&A</router-link></li>
              <li><router-link :to="{ name: 'HowToTrade' }">交易教學</router-link></li>
            </ul>
          </div>
        </BCol>
      </BRow>

      <!-- Divider -->
      <hr class="footer-divider" />

      <!-- Copyright -->
      <BRow>
        <BCol cols="12" class="text-center">
          <p class="copyright">© 2025 台中易起來平台. 版權所有.</p>
        </BCol>
      </BRow>
    </BContainer>
  </footer>
</template>

<script setup>
import { BContainer, BRow, BCol } from 'bootstrap-vue-next';

import logoImage from '../assets/Logo-white.png';

</script>

<style scoped lang="scss">
@import '@/styles/variables';

.app-footer {
  background-color: $primary;
  padding: 45px 0 20px;
  margin-top: auto;
}

.footer-content {
  margin-bottom: 30px;
}

.footer-logo {
  .logo-img {
    width: 250px;
    max-width: 100%;
    height: auto;
    object-fit: contain;
  }
}

.footer-section {
  text-align: center;
}

.footer-heading {
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 20px !important;
  font-weight: 500;
  color: white;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.2;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: center;

  li {
    margin-bottom: 12px;
  }

  a {
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #f9f9f9;
    text-decoration: none;
    transition: all 0.3s;

    &:hover {
      color: white;
      text-decoration: underline;
    }
  }
}

.footer-divider {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  margin: 30px auto;
  max-width: 700px;
  opacity: 1;
}

.copyright {
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #f9f9f9;
  margin: 0;
  line-height: 20px;
}

@media (min-width: 768px) {
  .about-links .footer-heading,
  .about-links .footer-links,
  .rights-links .footer-heading,
  .rights-links .footer-links {
    text-align: left;
  }
}

@media (max-width: 991.98px) {
  .app-footer {
    padding: 40px 0 20px;
  }

  .footer-heading {
    font-size: 18px;
    margin-bottom: 15px;
  }

  .footer-links a {
    font-size: 15px;
  }

  .copyright {
    font-size: 13px;
  }
}

@media (max-width: 575.98px) {
  .app-footer {
    padding: 30px 0 15px;
  }

  .footer-logo .logo-img {
    width: 200px;
  }

  .footer-heading {
    font-size: 16px !important;
  }

  .footer-links a {
    font-size: 14px;
  }

  .copyright {
    font-size: 12px;
  }
}
</style>
