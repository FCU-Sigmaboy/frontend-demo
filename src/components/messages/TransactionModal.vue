<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>提出交易</h3>
            <button class="close-btn" @click="closeModal">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>載入中...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="sortedItems.length === 0" class="empty-state">
              <i class="bi bi-inbox"></i>
              <p>此聊天室中沒有您的商品</p>
              <p class="empty-hint">只有您自己的商品才能提出交易</p>
            </div>

            <!-- Items List -->
            <div v-else class="items-list">
              <div class="items-header">
                <p class="items-hint">選擇要交易的商品</p>
                <span class="items-count">共 {{ sortedItems.length }} 件</span>
              </div>

              <!-- Note Input (shown when item is selected) -->
              <transition name="note-expand">
                <div v-if="selectedItemId" class="note-section">
                  <label for="transaction-note" class="note-label">
                    <i class="bi bi-pencil"></i>
                    備註（選填）
                  </label>
                  <textarea
                    id="transaction-note"
                    v-model="transactionNote"
                    class="note-input"
                    placeholder="例如：請準時面交喔、請攜帶零錢..."
                    rows="3"
                    maxlength="200"
                  ></textarea>
                  <div class="note-counter">{{ transactionNote.length }}/200</div>
                </div>
              </transition>

              <TransitionGroup name="item-list" tag="div">
                <div
                  v-for="item in displayItems"
                  :key="item.id"
                  class="item-card"
                  :class="{
                    selected: selectedItemId === item.id,
                    disabled: !isItemAvailable(item),
                  }"
                  @click="selectItem(item)"
                >
                  <div class="item-image">
                    <img v-if="item.image" :src="item.image" :alt="item.title" />
                    <i v-else class="bi bi-box-seam"></i>
                  </div>

                  <div class="item-details">
                    <h4 class="item-title">{{ item.title }}</h4>
                    <p v-if="item.price" class="item-price">{{ formatPrice(item.price) }}</p>
                    <div class="item-meta">
                      <span v-if="item.inTransaction" class="transaction-status">
                        <i class="bi bi-clock-history"></i>
                        正在交易中
                      </span>
                      <span
                        v-else-if="item.status"
                        class="item-status"
                        :class="getStatusClass(item.status)"
                      >
                        {{ getStatusText(item.status) }}
                      </span>
                      <span v-if="item.messageCount" class="message-count">
                        <i class="bi bi-chat-dots"></i>
                        {{ item.messageCount }} 則訊息
                      </span>
                    </div>
                  </div>

                  <div v-if="selectedItemId === item.id" class="check-icon">
                    <i class="bi bi-check-circle-fill"></i>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">取消</button>
            <button class="btn-confirm" :disabled="!selectedItemId" @click="confirmTransaction">
              確認交易
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    conversationItems: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    currentUserId: {
      type: String,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  const selectedItemId = ref(null)
  const transactionNote = ref('')

  const currencyFormatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  })

  // 過濾並排序商品：只顯示我的商品，優先顯示在聊天室中提及次數多的
  const sortedItems = computed(() => {
    if (!props.conversationItems || !props.currentUserId) return []

    // 只保留當前用戶擁有的商品（使用 ownerId 而不是 addedBy）
    const myItems = props.conversationItems.filter((item) => {
      // 檢查商品擁有者 ID 是否等於當前用戶 ID
      return item.ownerId && item.ownerId === props.currentUserId
    })

    // 排序
    return [...myItems].sort((a, b) => {
      // 先按狀態排序（available > 其他）
      const aAvailable = isItemAvailable(a)
      const bAvailable = isItemAvailable(b)
      if (aAvailable && !bAvailable) return -1
      if (!aAvailable && bAvailable) return 1

      // 再按訊息數量排序
      const aCount = a.messageCount || 0
      const bCount = b.messageCount || 0
      if (aCount !== bCount) return bCount - aCount

      // 最後按添加時間排序
      return new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
    })
  })

  // 顯示商品：選中的商品浮到最上面
  const displayItems = computed(() => {
    if (!selectedItemId.value) {
      return sortedItems.value
    }

    // 將選中的商品移到最前面
    const selected = sortedItems.value.find((item) => item.id === selectedItemId.value)
    const others = sortedItems.value.filter((item) => item.id !== selectedItemId.value)

    return selected ? [selected, ...others] : sortedItems.value
  })

  function isItemAvailable(item) {
    // 如果正在交易中，視為不可用
    if (item.inTransaction) {
      return false
    }
    return !item.status || item.status === 'available'
  }

  function getStatusClass(status) {
    const statusMap = {
      available: 'status-available',
      sold: 'status-sold',
      reserved: 'status-reserved',
      unavailable: 'status-unavailable',
    }
    return statusMap[status] || ''
  }

  function getStatusText(status) {
    const statusMap = {
      available: '可交易',
      sold: '已售出',
      reserved: '已保留',
      unavailable: '不可用',
    }
    return statusMap[status] || status
  }

  function formatPrice(price) {
    if (price === null || price === undefined) return ''
    return currencyFormatter.format(price)
  }

  function selectItem(item) {
    if (!isItemAvailable(item)) return

    if (selectedItemId.value === item.id) {
      selectedItemId.value = null
    } else {
      selectedItemId.value = item.id
    }
  }

  function closeModal() {
    emit('update:modelValue', false)
    // 延遲重置選擇和備註，避免動畫過程中看到變化
    setTimeout(() => {
      selectedItemId.value = null
      transactionNote.value = ''
    }, 300)
  }

  function confirmTransaction() {
    if (!selectedItemId.value) return

    const selectedItem = props.conversationItems.find((item) => item.id === selectedItemId.value)

    if (selectedItem) {
      emit('confirm', {
        item: selectedItem,
        note: transactionNote.value.trim(),
      })
      closeModal()
    }
  }

  // 當 modal 關閉時重置選擇和備註
  watch(
    () => props.modelValue,
    (newVal) => {
      if (!newVal) {
        setTimeout(() => {
          selectedItemId.value = null
          transactionNote.value = ''
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
    z-index: 2000;
    padding: 20px;
  }

  .modal-container {
    background: white;
    border-radius: 16px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e0e0e0;

    h3 {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
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
        font-size: 24px;
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
    padding: 20px 24px;
    min-height: 200px;
    max-height: calc(80vh - 160px); // 減去 header 和 footer 的高度

    // 更好的滾動體驗
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;

    // 自訂滾動條樣式 (僅 webkit 瀏覽器)
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

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;

    i {
      font-size: 48px;
      color: #e0e0e0;
      margin-bottom: 16px;
    }

    p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      margin: 0;
    }

    .empty-hint {
      font-size: 12px;
      color: #bbb;
      margin-top: 8px;
    }
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .items-list {
    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .items-hint {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
    }

    .items-count {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      color: #999;
      background: #f0f0f0;
      padding: 4px 12px;
      border-radius: 12px;
    }
  }

  .note-section {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;

    .note-label {
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

    .note-input {
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
      min-height: 80px;
      transition: all 0.2s;

      &:focus {
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
      }

      &::placeholder {
        color: #999;
      }
    }

    .note-counter {
      text-align: right;
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }

  // Note expand animation
  .note-expand-enter-active,
  .note-expand-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .note-expand-enter-from,
  .note-expand-leave-to {
    max-height: 0;
    opacity: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .note-expand-enter-to,
  .note-expand-leave-from {
    max-height: 200px;
    opacity: 1;
  }

  // Item list transition (商品移動動畫)
  .item-list-move {
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .item-list-enter-active {
    transition: all 0.3s ease;
  }

  .item-list-leave-active {
    transition: all 0.3s ease;
    position: absolute;
  }

  .item-list-enter-from,
  .item-list-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }

  .item-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f9f9f9;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover:not(.disabled) {
      background: #f0f0f0;
      border-color: $primary;
    }

    &.selected {
      background: rgba(111, 184, 165, 0.1);
      border-color: $primary;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        background: #f9f9f9;
        border-color: transparent;
      }
    }

    .item-image {
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      i {
        font-size: 24px;
        color: #999;
      }
    }

    .item-details {
      flex: 1;
      min-width: 0;

      .item-title {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0 0 4px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-price {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: $primary;
        margin: 0 0 8px 0;
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;

        .transaction-status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          background: rgba(255, 152, 0, 0.15);
          color: #ff9800;
          display: flex;
          align-items: center;
          gap: 4px;

          i {
            font-size: 12px;
          }
        }

        .item-status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;

          &.status-available {
            background: rgba(111, 184, 165, 0.1);
            color: $primary;
          }

          &.status-sold {
            background: rgba(0, 0, 0, 0.05);
            color: #999;
          }

          &.status-reserved {
            background: rgba(255, 152, 0, 0.1);
            color: #ff9800;
          }

          &.status-unavailable {
            background: rgba(244, 67, 54, 0.1);
            color: #f44336;
          }
        }

        .message-count {
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 4px;

          i {
            font-size: 12px;
          }
        }
      }
    }

    .check-icon {
      flex-shrink: 0;

      i {
        font-size: 24px;
        color: $primary;
      }
    }
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e0e0e0;

    button {
      flex: 1;
      padding: 12px 24px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
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
      background: $primary;
      color: white;

      &:hover:not(:disabled) {
        background: darken($primary, 5%);
      }

      &:disabled {
        background: #e0e0e0;
        color: #999;
        cursor: not-allowed;
      }
    }
  }

  // Modal Transitions
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
    transition: transform 0.3s ease;
  }

  .modal-fade-enter-from .modal-container,
  .modal-fade-leave-to .modal-container {
    transform: scale(0.9);
  }

  // Responsive
  @media (max-width: 575.98px) {
    .modal-overlay {
      padding: 0;
      align-items: flex-end;
    }

    .modal-container {
      max-width: 100%;
      max-height: 90vh;
      border-radius: 16px 16px 0 0;
    }

    .item-card {
      .item-image {
        width: 60px;
        height: 60px;

        i {
          font-size: 24px;
        }
      }

      .item-details {
        .item-title {
          font-size: 14px;
        }

        .item-price {
          font-size: 13px;
        }
      }
    }

    .modal-fade-enter-from .modal-container,
    .modal-fade-leave-to .modal-container {
      transform: translateY(100%);
    }
  }
</style>
