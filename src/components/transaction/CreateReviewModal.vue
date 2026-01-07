<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              <i class="bi bi-star-fill"></i>
              填寫評價
            </h2>
            <button class="close-btn" @click="closeModal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Transaction Info -->
            <div class="review-form">
              <div class="info-section">
                <h3 class="section-title">交易資訊</h3>
                <div class="info-item">
                  <span class="info-label">商品名稱</span>
                  <span class="info-value">{{ transaction?.item_title }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">交易對象</span>
                  <span class="info-value">{{ transaction?.other_user_nickname }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">交易金額</span>
                  <span class="info-value price">{{ transaction?.item_price }} 點</span>
                </div>
              </div>

              <!-- Rating Section -->
              <div class="rating-section">
                <label class="rating-label">
                  <i class="bi bi-star-fill"></i>
                  評分 <span class="required">*</span>
                </label>
                <div class="stars-container">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    class="star-btn"
                    :class="{ active: star <= rating }"
                    @click="rating = star"
                    @mouseenter="hoverRating = star"
                    @mouseleave="hoverRating = 0"
                  >
                    <i
                      class="bi"
                      :class="star <= (hoverRating || rating) ? 'bi-star-fill' : 'bi-star'"
                    ></i>
                  </button>
                </div>
                <div class="rating-text">
                  <span v-if="rating === 0" class="rating-desc">請選擇評分</span>
                  <span v-else-if="rating === 1" class="rating-desc">非常不滿意</span>
                  <span v-else-if="rating === 2" class="rating-desc">不滿意</span>
                  <span v-else-if="rating === 3" class="rating-desc">普通</span>
                  <span v-else-if="rating === 4" class="rating-desc">滿意</span>
                  <span v-else-if="rating === 5" class="rating-desc">非常滿意</span>
                </div>
              </div>

              <!-- Comment Section -->
              <div class="comment-section">
                <label for="review-comment" class="comment-label">
                  <i class="bi bi-pencil"></i>
                  評論內容（選填）
                </label>
                <textarea
                  id="review-comment"
                  v-model="comment"
                  class="comment-input"
                  placeholder="分享您的交易體驗，例如：商品狀況、賣家態度、交易過程..."
                  rows="5"
                  maxlength="500"
                ></textarea>
                <div class="comment-counter">{{ comment.length }}/500</div>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <i class="bi bi-info-circle"></i>
                <div class="info-content">
                  <h4>提醒</h4>
                  <ul>
                    <li>評價送出後將無法修改</li>
                    <li>請客觀公正地評價交易體驗</li>
                    <li>惡意評價可能會被檢舉處理</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">取消</button>
            <button class="btn-submit" @click="submitReview" :disabled="rating === 0">
              <i class="bi bi-send-fill"></i>
              送出評價
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
    transaction: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const rating = ref(0)
  const hoverRating = ref(0)
  const comment = ref('')

  function closeModal() {
    emit('update:modelValue', false)
    // 延遲重置表單，避免動畫過程中看到變化
    setTimeout(() => {
      rating.value = 0
      hoverRating.value = 0
      comment.value = ''
    }, 300)
  }

  function submitReview() {
    if (rating.value === 0) {
      alert('請選擇評分')
      return
    }

    emit('submit', {
      score: rating.value,
      comment: comment.value.trim() || null,
    })
    closeModal()
  }

  // 當 modal 關閉時重置表單
  watch(
    () => props.modelValue,
    (newVal) => {
      if (!newVal) {
        setTimeout(() => {
          rating.value = 0
          hoverRating.value = 0
          comment.value = ''
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
        color: #ffc107;
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

  .review-form {
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

  .rating-section {
    background: #f9f9f9;
    border: 2px solid #ffc107;
    border-radius: 12px;
    padding: 16px;

    .rating-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
      margin-bottom: 12px;

      i {
        font-size: 14px;
        color: #ffc107;
      }

      .required {
        color: #f44336;
        margin-left: 2px;
      }
    }

    .stars-container {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 12px;
    }

    .star-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      transition: all 0.2s;

      i {
        font-size: 40px;
        color: #ddd;
        transition: all 0.2s;
      }

      &:hover i,
      &.active i {
        color: #ffc107;
        transform: scale(1.1);
      }

      &:active i {
        transform: scale(0.95);
      }
    }

    .rating-text {
      text-align: center;

      .rating-desc {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #ffc107;
      }
    }
  }

  .comment-section {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 16px;

    .comment-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
      margin-bottom: 8px;

      i {
        font-size: 14px;
        color: $primary;
      }
    }

    .comment-input {
      width: 100%;
      padding: 12px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #1e1e1e;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      outline: none;
      resize: vertical;
      min-height: 120px;
      transition: all 0.2s;

      &:focus {
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
      }

      &::placeholder {
        color: #999;
      }
    }

    .comment-counter {
      text-align: right;
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }

  .info-box {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #e3f2fd;
    border: 2px solid #2196f3;
    border-radius: 12px;

    i {
      font-size: 24px;
      color: #2196f3;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .info-content {
      flex: 1;

      h4 {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: #1565c0;
        margin: 0 0 8px 0;
      }

      ul {
        margin: 0;
        padding-left: 20px;
        list-style-type: disc;

        li {
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 13px;
          color: #1565c0;
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

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
          transform: none;
          box-shadow: none;
        }
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

    .btn-submit {
      background: #ffc107;
      color: #1e1e1e;

      &:hover:not(:disabled) {
        background: #ffb300;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
      }

      &:active:not(:disabled) {
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

    .star-btn i {
      font-size: 32px;
    }
  }
</style>
