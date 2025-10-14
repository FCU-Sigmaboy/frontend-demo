<template>
  <footer class="app-footer">
    <BContainer>
      <BRow class="footer-content">
        <!-- Logo -->
        <BCol cols="12" lg="3" class="text-center text-lg-start mb-4 mb-lg-0">
          <div class="footer-logo">
            <img :src="logoImage" alt="Logo" class="logo-img" />
          </div>
        </BCol>

        <!-- About Section -->
        <BCol cols="12" md="6" lg="3" class="mb-4 mb-lg-0">
          <h5 class="footer-heading">關於台中易起來</h5>
          <ul class="footer-links">
            <li><a href="#">關於我們</a></li>
            <li><a href="#">服務條款</a></li>
          </ul>
        </BCol>

        <!-- Rights Section -->
        <BCol cols="12" md="6" lg="3" class="mb-4 mb-lg-0">
          <h5 class="footer-heading">權益相關</h5>
          <ul class="footer-links">
            <li><a href="#">常見 Q&A</a></li>
            <li><a href="#">如何交易</a></li>
          </ul>
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

const logoImage = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="35" fill="%2364978a"/></svg>';
</script>

<style scoped lang="scss">
.app-footer {
  background-color: #64978a;
  padding: 57px 0 20px;
  margin-top: auto;
}

.footer-content {
  margin-bottom: 30px;
}

.footer-logo {
  .logo-img {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }
}

.footer-heading {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 30px;
  color: #000;
  margin-bottom: 20px;
  font-weight: 400;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    margin-bottom: 12px;
  }

  a {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    color: #000;
    text-decoration: none;
    transition: all 0.3s;

    &:hover {
      color: #333;
      text-decoration: underline;
    }
  }
}

.footer-divider {
  border: 0;
  border-top: 1px solid #000;
  margin: 30px auto;
  max-width: 700px;
  opacity: 1;
}

.copyright {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13.781px;
  color: #000;
  margin: 0;
  line-height: 20px;
}

@media (max-width: 991.98px) {
  .app-footer {
    padding: 40px 0 20px;
  }

  .footer-heading {
    font-size: 24px;
  }

  .footer-links a {
    font-size: 18px;
  }
}
</style>
