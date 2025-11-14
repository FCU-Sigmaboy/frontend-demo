<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              <i class="bi bi-x-circle"></i>
              拒絕交易
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
                <div v-if="transaction?.giver_note" class="info-item">
                  <span class="info-label">賣家備註</span>
                  <span class="info-value">{{ transaction.giver_note }}</span>
                </div>
              </div>

              <!-- Warning -->
              <div class="warning-box">
                <i class="bi bi-info-circle"></i>
                <p>拒絕後需要再次提案才能交易</p>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">取消</button>
            <button class="btn-reject" @click="confirmReject">
              <i class="bi bi-x-circle"></i>
              確認拒絕
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  transaction: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

function closeModal() {
  emit('update:modelValue', false);
}

function confirmReject() {
  emit('confirm');
  closeModal();
}
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
      color: #d32f2f;
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

.warning-box {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 8px;

  i {
    font-size: 20px;
    color: #ff9800;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #e65100;
    margin: 0;
    line-height: 1.5;
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

  .btn-reject {
    background: #d32f2f;
    color: white;

    &:hover {
      background: #b71c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
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

  .modal-footer {
    padding: 12px 20px;
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>