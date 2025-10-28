<template>
  <div class="faq-page">
    <AppHeader />

    <div class="content-wrapper">
      <BContainer>
        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav">
          <router-link to="/">首頁</router-link> &gt; 常見 Q&A
        </nav>

        <!-- Page Title -->
        <div class="page-header">
          <h1 class="page-title">常見問題</h1>
          <p class="page-subtitle">以下是使用者最常詢問的問題，若仍有疑問歡迎聯繫客服</p>
        </div>

        <!-- FAQ Accordion -->
        <div class="faq-list">
          <BAccordion>
            <BAccordionItem v-for="(faq, index) in faqData" :key="index">
              <template #title>
                <div class="faq-question">
                  <i class="bi bi-question-circle"></i>
                  <span>{{ faq.question }}</span>
                </div>
              </template>
              <div class="faq-answer">
                <p v-for="(paragraph, pIndex) in faq.answer" :key="pIndex">
                  {{ paragraph }}
                </p>
              </div>
            </BAccordionItem>
          </BAccordion>
        </div>

        <!-- Contact Section -->
        <div class="contact-section">
          <div class="contact-card">
            <i class="bi bi-headset"></i>
            <h3>還有其他問題？</h3>
            <p>我們的客服團隊隨時為您服務</p>
            <button class="btn-contact" @click="handleContact">聯繫客服</button>
          </div>
        </div>
      </BContainer>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { BContainer, BAccordion, BAccordionItem } from 'bootstrap-vue-next';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

const faqData = ref([
  {
    question: '什麼是台中易起來平台？',
    answer: [
      '台中易起來是由台中市政府推出的二手物品交易平台，旨在促進資源再利用、減少浪費，並透過點數激勵制度鼓勵市民參與環保行動。',
      '本平台不涉及真實貨幣交易，所有交易都使用虛擬點數完成，讓環保變得更有趣、更有意義。'
    ]
  },
  {
    question: '如何獲得點數？',
    answer: [
      '您可以透過以下方式獲得點數：',
      '1. 成功出售或贈送二手物品給其他使用者',
      '2. 完成交易並獲得對方給予的好評',
      '3. 參與平台舉辦的各類環保活動',
      '4. 協助回收或將閒置物品重新利用',
      '點數無法透過真實貨幣購買，只能透過實際的環保行為獲得。'
    ]
  },
  {
    question: '點數可以兌換成現金嗎？',
    answer: [
      '不可以。本平台的點數是虛擬獎勵機制，無法兌換成現金或任何實體貨幣。',
      '點數僅能用於平台內的物品交易，目的是鼓勵大家參與資源循環利用，而非進行商業營利。'
    ]
  },
  {
    question: '如何進行物品交易？',
    answer: [
      '交易流程非常簡單：',
      '1. 瀏覽物品列表，找到您感興趣的物品',
      '2. 確認您的點數足夠後，點擊「立即交易」',
      '3. 透過平台私訊功能與提供者聯繫，約定交易時間與地點',
      '4. 面對面完成物品交換，並在平台上確認交易完成',
      '5. 互相給予評價，幫助建立良好的社群信譽'
    ]
  },
  {
    question: '交易是否需要運費？',
    answer: [
      '本平台主要服務台中市民，鼓勵鄰里間面對面交易，因此不涉及運費。',
      '建議您選擇公共場所進行物品交換，既安全又環保。若雙方協議採用郵寄方式，相關費用需自行協商處理，平台不介入運費事宜。'
    ]
  },
  {
    question: '可以上架哪些物品？',
    answer: [
      '您可以上架各類閒置的二手物品，例如：',
      '• 電子產品（手機、平板、電腦配件等）',
      '• 書籍、雜誌、文具用品',
      '• 服飾、鞋包、配件',
      '• 家居用品、廚具、裝飾品',
      '• 運動器材、玩具、樂器等',
      '',
      '但請注意，以下物品禁止上架：',
      '• 違禁品、危險物品、管制藥品',
      '• 仿冒品或侵權物品',
      '• 食品、保健食品',
      '• 活體動物',
      '• 其他違反法律或善良風俗的物品'
    ]
  },
  {
    question: '如何確保交易安全？',
    answer: [
      '我們建議您採取以下措施保障自身權益：',
      '1. 選擇公共場所（如捷運站、便利商店）進行面交',
      '2. 仔細檢查物品狀況後再確認交易',
      '3. 查看對方的評價與信譽分數',
      '4. 若遇到可疑帳號或不當行為，立即檢舉',
      '平台會持續監控異常交易行為，並對違規帳號採取處置措施。'
    ]
  },
  {
    question: '點數有使用期限嗎？',
    answer: [
      '是的，為了鼓勵點數流通，所有點數自獲得日起12個月內有效。',
      '逾期未使用的點數將自動失效，不予退還或補償。建議您定期使用點數進行交易，讓資源持續循環利用。'
    ]
  },
  {
    question: '可以取消或退貨嗎？',
    answer: [
      '由於本平台採用面交方式，建議您在交易前充分溝通、確認物品狀況。',
      '若交易完成後發現物品與描述不符，可以透過平台客服申訴。平台會視情況協助協調，並對惡意欺詐的使用者進行處罰。',
      '為避免糾紛，請務必在交易前詳細確認物品狀況。'
    ]
  },
  {
    question: '如何提升我的信譽分數？',
    answer: [
      '信譽分數是根據您的交易記錄、評價及平台活躍度計算：',
      '1. 完成更多交易並獲得好評',
      '2. 提供真實、詳細的物品描述',
      '3. 準時赴約、態度友善',
      '4. 積極參與平台活動',
      '5. 遵守平台規範，避免違規行為',
      '高信譽分數能讓其他使用者更信任您，提升交易成功率。'
    ]
  },
  {
    question: '忘記密碼怎麼辦？',
    answer: [
      '若您忘記密碼，請至登入頁面點擊「忘記密碼」連結。',
      '系統會寄送密碼重設信件至您註冊的電子郵件信箱，請依照信件指示完成密碼重設。',
      '若仍無法登入，請聯繫客服協助處理。'
    ]
  },
  {
    question: '如何檢舉不當行為？',
    answer: [
      '若您發現其他使用者有詐欺、騷擾、上架違禁品等不當行為，請立即檢舉：',
      '1. 進入該使用者的個人頁面或物品頁面',
      '2. 點擊「檢舉」按鈕',
      '3. 選擇檢舉原因並提供相關說明',
      '4. 上傳證據（如對話截圖）',
      '我們會盡快審查並採取必要措施，感謝您協助維護平台安全。'
    ]
  }
]);

const handleContact = () => {
  alert('客服功能開發中，敬請期待！');
};
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.faq-page {
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
  margin-bottom: 50px;
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
  font-size: 16px;
  color: #666;
}

.faq-list {
  margin-bottom: 60px;

  :deep(.accordion) {
    --bs-accordion-border-color: #e0e0e0;
    --bs-accordion-border-radius: 8px;
  }

  :deep(.accordion-item) {
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px !important;
    margin-bottom: 16px;
    overflow: hidden;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.accordion-button) {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    background-color: white;
    padding: 20px 24px;
    border: none;
    box-shadow: none;

    &:not(.collapsed) {
      background-color: #e9f5f2;
      color: $primary;
    }

    &:focus {
      box-shadow: none;
      border: none;
    }

    &::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236fb8a5'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
    }
  }

  :deep(.accordion-body) {
    padding: 24px;
    background-color: white;
    border-top: 1px solid #e0e0e0;
  }

  .faq-question {
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      font-size: 22px;
      color: $primary;
      flex-shrink: 0;
    }

    span {
      flex: 1;
    }
  }

  .faq-answer {
    p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: #555;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.contact-section {
  display: flex;
  justify-content: center;
  margin-top: 60px;
}

.contact-card {
  background: linear-gradient(135deg, $primary 0%, #5fa795 100%);
  border-radius: 16px;
  padding: 50px 60px;
  text-align: center;
  color: white;
  max-width: 600px;
  box-shadow: 0 8px 24px rgba(111, 184, 165, 0.3);

  i {
    font-size: 60px;
    margin-bottom: 24px;
    opacity: 0.9;
  }

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    margin-bottom: 28px;
    opacity: 0.95;
  }

  .btn-contact {
    background-color: white;
    color: $primary;
    border: none;
    border-radius: 25px;
    padding: 12px 40px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: #f0f0f0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
    margin-bottom: 40px;
  }

  .page-title {
    font-size: 32px;
  }

  .page-subtitle {
    font-size: 15px;
  }

  .faq-list {
    :deep(.accordion-button) {
      font-size: 17px;
      padding: 18px 20px;
    }

    :deep(.accordion-body) {
      padding: 20px;
    }

    .faq-question i {
      font-size: 20px;
    }

    .faq-answer p {
      font-size: 15px;
    }
  }

  .contact-card {
    padding: 45px 50px;

    i {
      font-size: 55px;
    }

    h3 {
      font-size: 26px;
    }

    p {
      font-size: 15px;
    }

    .btn-contact {
      font-size: 15px;
      padding: 11px 36px;
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
    margin-bottom: 30px;
  }

  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .faq-list {
    margin-bottom: 50px;

    :deep(.accordion-item) {
      margin-bottom: 12px;
      border-radius: 6px !important;
    }

    :deep(.accordion-button) {
      font-size: 16px;
      padding: 16px 18px;
    }

    :deep(.accordion-body) {
      padding: 18px;
    }

    .faq-question {
      gap: 10px;

      i {
        font-size: 18px;
      }
    }

    .faq-answer p {
      font-size: 14px;
      line-height: 1.7;
    }
  }

  .contact-section {
    margin-top: 50px;
  }

  .contact-card {
    padding: 40px 30px;
    border-radius: 12px;

    i {
      font-size: 50px;
      margin-bottom: 20px;
    }

    h3 {
      font-size: 24px;
    }

    p {
      font-size: 14px;
      margin-bottom: 24px;
    }

    .btn-contact {
      font-size: 14px;
      padding: 10px 32px;
    }
  }
}
</style>
