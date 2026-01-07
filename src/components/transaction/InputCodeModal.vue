<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              <i class="bi bi-keyboard"></i>
              輸入交易確認碼
            </h2>
            <button class="close-btn" @click="closeModal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Transaction Info -->
            <div class="transaction-info">
              <div class="info-section">
                <h3 class="section-title">交易資訊</h3>
                <div class="info-item">
                  <span class="info-label">商品名稱</span>
                  <span class="info-value">{{ transaction?.item_title }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">交易金額</span>
                  <span class="info-value price">{{ transaction?.item_price }} 點</span>
                </div>
                <div class="info-item">
                  <span class="info-label">賣家</span>
                  <span class="info-value">{{ transaction?.other_user_nickname }}</span>
                </div>
              </div>

              <!-- Code Input -->
              <div class="code-section">
                <label for="confirm-code" class="code-label">
                  <i class="bi bi-shield-lock"></i>
                  請輸入賣家提供的 6 位數交易確認碼
                </label>
                <input
                  id="confirm-code"
                  v-model="code"
                  type="text"
                  class="code-input"
                  placeholder="請輸入 6 位數字"
                  maxlength="6"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  @input="validateCode"
                />
                <div v-if="codeError" class="code-error">
                  <i class="bi bi-exclamation-circle"></i>
                  {{ codeError }}
                </div>
              </div>

              <!-- Warning Box -->
              <div class="warning-box">
                <i class="bi bi-exclamation-triangle"></i>
                <div class="warning-content">
                  <h4>重要提醒</h4>
                  <ul>
                    <li>請確認您已經收到商品且符合預期</li>
                    <li>請確認商品狀況與描述相符</li>
                    <li>完成交易後點數將轉移給賣家，無法退回</li>
                    <li>如有任何問題，請在確認前與賣家溝通</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">取消</button>
            <button class="btn-confirm" :disabled="!isCodeValid" @click="confirmCode">
              <i class="bi bi-check-circle"></i>
              確認完成交易
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    transaction: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  const code = ref('')
  const codeError = ref('')

  const isCodeValid = computed(() => {
    return /^\d{6}$/.test(code.value)
  })

  function validateCode(event) {
    // 只允許數字輸入
    code.value = code.value.replace(/[^0-9]/g, '')

    // 清除錯誤訊息
    if (codeError.value) {
      codeError.value = ''
    }
  }

  function closeModal() {
    emit('update:modelValue', false)
    // 延遲重置，避免動畫過程中看到變化
    setTimeout(() => {
      code.value = ''
      codeError.value = ''
    }, 300)
  }

  function confirmCode() {
    if (!isCodeValid.value) {
      codeError.value = '請輸入 6 位數字'
      return
    }

    emit('confirm', code.value)
    closeModal()
  }

  // 當 modal 關閉時重置
  watch(
    () => props.modelValue,
    (newVal) => {
      if (!newVal) {
        setTimeout(() => {
          code.value = ''
          codeError.value = ''
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

  .transaction-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .info-section {
    background: #f9f9f9;
    border-radius: 12px;
    padding: 16px;

    .section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      &:first-of-type {
        padding-top: 0;
      }

      .info-label {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #666;
        flex-shrink: 0;
        margin-right: 16px;
      }

      .info-value {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #1e1e1e;
        font-weight: 500;
        text-align: right;
        word-break: break-word;

        &.price {
          color: $primary;
          font-weight: 700;
          font-size: 16px;
        }
      }
    }
  }

  .code-section {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 16px;

    .code-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
      margin-bottom: 12px;

      i {
        font-size: 16px;
        color: #2196f3;
      }
    }

    .code-input {
      width: 100%;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: 700;
      color: #2196f3;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      outline: none;
      text-align: center;
      letter-spacing: 8px;
      transition: all 0.2s;

      &:focus {
        border-color: #2196f3;
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1);
      }

      &::placeholder {
        color: #ccc;
        font-size: 16px;
        letter-spacing: normal;
        font-family: 'Noto Sans TC', sans-serif;
        font-weight: 400;
      }
    }

    .code-error {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 8px 12px;
      background: #ffebee;
      border: 1px solid #f44336;
      border-radius: 6px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #c62828;

      i {
        font-size: 14px;
        flex-shrink: 0;
      }
    }
  }

  .warning-box {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fff3e0;
    border: 2px solid #ff9800;
    border-radius: 12px;

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

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #e0e0e0;

    button {
      flex: 1;
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
      gap: 6px;

      i {
        font-size: 16px;
      }
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #666;

      &:hover {
        background: #e0e0e0;
        color: #1e1e1e;
      }
    }

    .btn-confirm {
      background: #2196f3;
      color: white;

      &:hover:not(:disabled) {
        background: #1976d2;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        background: #e0e0e0;
        color: #999;
        cursor: not-allowed;
        opacity: 0.6;
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

    .code-section {
      .code-input {
        font-size: 28px;
        letter-spacing: 6px;
      }
    }

    .modal-footer {
      padding: 12px 20px;
      flex-direction: column;

      button {
        width: 100%;
      }
    }
  }
</style>
