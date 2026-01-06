<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              <i class="bi bi-shield-lock"></i>
              交易確認碼
            </h2>
            <button class="close-btn" @click="closeModal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="code-display">
              <div class="code-label">
                <i class="bi bi-key"></i>
                請將此確認碼告知買家
              </div>
              <div v-if="!isCodeRevealed" class="code-hidden">
                <div class="code-masked">••••••</div>
                <button class="reveal-btn" @click="revealCode">
                  <i class="bi bi-eye"></i>
                  點擊顯示確認碼
                </button>
              </div>
              <div v-else class="code-value">{{ code }}</div>
              <p class="code-hint">買家需要在見面時輸入此確認碼來完成交易</p>
            </div>

            <!-- Warning Box -->
            <div class="warning-box">
              <i class="bi bi-exclamation-triangle"></i>
              <div class="warning-content">
                <h4>重要提醒</h4>
                <ul>
                  <li>請勿在見面前提供確認碼</li>
                  <li>請確認買家已收到商品並檢查無誤</li>
                  <li>確認買家當面輸入確認碼後才算交易完成</li>
                  <li>完成後點數將自動轉入您的帳戶</li>
                </ul>
              </div>
            </div>

            <!-- Transaction Info -->
            <div class="transaction-info">
              <h4>交易資訊</h4>
              <div class="info-row">
                <span class="info-label">商品名稱</span>
                <span class="info-value">{{ transaction?.item_title }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">買家</span>
                <span class="info-value">{{ transaction?.other_user_nickname }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">交易金額</span>
                <span class="info-value price">{{ transaction?.item_price }} 點</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-close" @click="closeModal">
              <i class="bi bi-check-lg"></i>
              我知道了
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
  import { ref, watch } from 'vue'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    code: {
      type: String,
      default: '',
    },
    transaction: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const isCodeRevealed = ref(false)

  function closeModal() {
    emit('update:modelValue', false)
    // 延遲重置，避免動畫過程中看到變化
    setTimeout(() => {
      isCodeRevealed.value = false
    }, 300)
  }

  function revealCode() {
    isCodeRevealed.value = true
  }

  // 當 modal 關閉時重置
  watch(
    () => props.modelValue,
    (newVal) => {
      if (!newVal) {
        setTimeout(() => {
          isCodeRevealed.value = false
        }, 300)
      }
    }
  )
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }

  .modal-container {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e0e0e0;

    .modal-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #1e1e1e;
      margin: 0;

      i {
        font-size: 24px;
        color: #2196f3;
      }
    }

    .close-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      i {
        font-size: 18px;
        color: #666;
      }

      &:hover {
        background: #f5f5f5;

        i {
          color: #1e1e1e;
        }
      }
    }
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;

    // 自訂滾動條樣式
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 10px;

      &:hover {
        background: #a8a8a8;
      }
    }
  }

  .code-display {
    text-align: center;
    padding: 24px;
    background: white;
    border: 2px solid #2196f3;
    border-radius: 16px;
    margin-bottom: 20px;

    .code-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin-bottom: 16px;

      i {
        font-size: 16px;
        color: #2196f3;
      }
    }

    .code-hidden {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;

      .code-masked {
        font-family: 'Courier New', monospace;
        font-size: 48px;
        font-weight: 700;
        color: #ccc;
        letter-spacing: 12px;
      }

      .reveal-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        font-weight: 600;
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        i {
          font-size: 16px;
        }

        &:hover {
          background: #1976d2;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    .code-value {
      font-family: 'Courier New', monospace;
      font-size: 48px;
      font-weight: 700;
      color: #2196f3;
      letter-spacing: 12px;
      margin-bottom: 12px;
    }

    .code-hint {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #666;
      margin: 0;
    }
  }

  .warning-box {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fff3e0;
    border: 2px solid #ff9800;
    border-radius: 12px;
    margin-bottom: 20px;

    i {
      font-size: 24px;
      color: #ff9800;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .warning-content {
      flex: 1;

      h4 {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: #e65100;
        margin: 0 0 8px 0;
      }

      ul {
        margin: 0;
        padding-left: 20px;
        list-style-type: disc;

        li {
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 13px;
          color: #e65100;
          line-height: 1.6;
          margin-bottom: 4px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  .transaction-info {
    background: #f9f9f9;
    border-radius: 12px;
    padding: 16px;

    h4 {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .info-label {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #666;
      }

      .info-value {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #1e1e1e;
        font-weight: 500;

        &.price {
          color: $primary;
          font-weight: 700;
          font-size: 16px;
        }
      }
    }
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e0e0e0;

    .btn-close {
      width: 100%;
      padding: 12px 24px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: $primary;
      color: white;

      i {
        font-size: 18px;
      }

      &:hover {
        background: #5fa795;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  // Modal animations
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;
  }

  .modal-fade-enter-active .modal-container,
  .modal-fade-leave-active .modal-container {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .modal-fade-enter-from .modal-container,
  .modal-fade-leave-to .modal-container {
    transform: translateY(100%);
  }

  // Responsive
  @media (max-width: 575.98px) {
    .modal-overlay {
      padding: 0;
      align-items: flex-end;
    }

    .modal-container {
      max-height: 90vh;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      width: 100%;
      max-width: 100%;
    }

    .modal-header {
      padding: 16px 20px;

      .modal-title {
        font-size: 18px;

        i {
          font-size: 20px;
        }
      }
    }

    .modal-body {
      padding: 20px;
    }

    .code-display {
      padding: 20px;

      .code-value {
        font-size: 40px;
        letter-spacing: 10px;
      }
    }

    .modal-footer {
      padding: 12px 20px;
    }
  }
</style>
