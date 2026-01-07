<template>
  <div class="transaction-records-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="records-container">
        <!-- Breadcrumb -->
        <Breadcrumb
          :items="[{ label: '個人檔案', to: { name: 'UserProfile' } }, { label: '我的交易' }]"
        />

        <!-- Page Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="page-title">我的交易</h1>
          <div class="spacer"></div>
        </div>

        <!-- Tabs -->
        <div class="tabs-section">
          <div class="tabs-container">
            <button
              :class="['tab-btn', { active: activeTab === 'confirming' }]"
              @click="activeTab = 'confirming'"
            >
              <i class="bi bi-hourglass-split"></i>
              <span>待確認</span>
              <span class="tab-count">{{ confirmingTransactions.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'pending' }]"
              @click="activeTab = 'pending'"
            >
              <i class="bi bi-clock-history"></i>
              <span>交易中</span>
              <span class="tab-count">{{ pendingTransactions.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'completed' }]"
              @click="activeTab = 'completed'"
            >
              <i class="bi bi-check-circle-fill"></i>
              <span>已完成</span>
              <span class="tab-count">{{ completedTransactions.length }}</span>
            </button>
          </div>
        </div>

        <!-- Role Tabs (買入/賣出) -->
        <div class="role-filter-section" v-if="currentTransactions.length > 0">
          <FilterTabs
            :filters="roleFilters"
            :items="currentTransactions"
            :active-filter-id="activeRoleFilterId"
            @update:filteredItems="handleRoleFilterChange"
          />
        </div>

        <!-- Pagination Info -->
        <div class="pagination-info" v-if="displayTransactions.length > 0">
          <span class="total-count">共 {{ displayTransactions.length }} 筆交易</span>
          <span class="page-size-selector">
            每頁顯示
            <select v-model.number="pageSize" @change="handlePageSizeChange">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
            筆
          </span>
        </div>

        <!-- Transaction List -->
        <div class="transactions-section">
          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>載入中...</p>
          </div>

          <!-- Confirming Transactions Tab -->
          <div v-else-if="activeTab === 'confirming'">
            <div v-if="paginatedTransactions.length > 0" class="transactions-list">
              <div
                v-for="transaction in paginatedTransactions"
                :key="transaction.transaction_id"
                :data-transaction-id="transaction.transaction_id"
                :class="[
                  'transaction-card',
                  { highlighted: highlightedTransactionId === transaction.transaction_id },
                ]"
              >
                <div class="card-header">
                  <div class="transaction-type" :class="transaction.role">
                    <i
                      :class="[
                        'bi',
                        transaction.role === 'giver' ? 'bi-cash-stack' : 'bi-bag-fill',
                      ]"
                    ></i>
                    <span>{{ transaction.role === 'giver' ? '賣出' : '買入' }}</span>
                  </div>
                  <span class="status-badge confirming"> 待確認 </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="
                        transaction.item_image_url ||
                        'https://placehold.co/80x80/6fb8a5/ffffff?text=Item'
                      "
                      :alt="transaction.item_title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item_title }}</h3>
                      <p class="item-meta">
                        {{ transaction.role === 'giver' ? '買家' : '賣家' }}:
                        {{ transaction.other_user_nickname }}
                      </p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row" v-if="transaction.giver_note">
                      <span class="meta-label">賣家備註</span>
                      <span class="meta-value">{{ transaction.giver_note }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.receiver_note">
                      <span class="meta-label">買家備註</span>
                      <span class="meta-value">{{ transaction.receiver_note }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">{{
                        formatPoints(transaction.item_price)
                      }}</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="transaction-actions">
                    <template v-if="transaction.role === 'receiver'">
                      <button
                        class="btn-action btn-reject"
                        @click.stop="handleRejectTransaction(transaction)"
                      >
                        <i class="bi bi-x-circle"></i>
                        拒絕
                      </button>
                      <button
                        class="btn-action btn-confirm"
                        @click.stop="handleConfirmTransaction(transaction)"
                      >
                        <i class="bi bi-check-circle"></i>
                        確認交易
                      </button>
                    </template>
                    <template v-else>
                      <button
                        class="btn-action btn-cancel"
                        @click.stop="handleCancelTransaction(transaction)"
                      >
                        <i class="bi bi-arrow-counterclockwise"></i>
                        撤回
                      </button>
                      <button class="btn-action btn-waiting" disabled>
                        <i class="bi bi-hourglass-split"></i>
                        等待對方接受
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-hourglass-split"></i>
              <p>目前沒有待確認的交易</p>
            </div>
          </div>

          <!-- Pending Transactions Tab -->
          <div v-else-if="activeTab === 'pending'">
            <div v-if="paginatedTransactions.length > 0" class="transactions-list">
              <div
                v-for="transaction in paginatedTransactions"
                :key="transaction.transaction_id"
                :data-transaction-id="transaction.transaction_id"
                :class="[
                  'transaction-card',
                  { highlighted: highlightedTransactionId === transaction.transaction_id },
                ]"
              >
                <div class="card-header">
                  <div class="transaction-type" :class="transaction.role">
                    <i
                      :class="[
                        'bi',
                        transaction.role === 'giver' ? 'bi-cash-stack' : 'bi-bag-fill',
                      ]"
                    ></i>
                    <span>{{ transaction.role === 'giver' ? '賣出' : '買入' }}</span>
                  </div>
                  <span class="status-badge pending"> 交易中 </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="
                        transaction.item_image_url ||
                        'https://placehold.co/80x80/6fb8a5/ffffff?text=Item'
                      "
                      :alt="transaction.item_title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item_title }}</h3>
                      <p class="item-meta">
                        {{ transaction.role === 'giver' ? '買家' : '賣家' }}:
                        {{ transaction.other_user_nickname }}
                      </p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row" v-if="transaction.role === 'giver' && transaction.code">
                      <span class="meta-label">交易確認碼</span>
                      <button class="code-view-btn" @click.stop="handleViewCode(transaction)">
                        <span class="meta-value">點擊查看</span>
                        <i class="bi bi-eye"></i>
                      </button>
                    </div>
                    <div class="meta-row" v-if="transaction.giver_note">
                      <span class="meta-label">賣家備註</span>
                      <span class="meta-value">{{ transaction.giver_note }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.receiver_note">
                      <span class="meta-label">買家備註</span>
                      <span class="meta-value">{{ transaction.receiver_note }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">{{
                        formatPoints(transaction.item_price)
                      }}</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="transaction-actions">
                    <button
                      v-if="transaction.role === 'receiver'"
                      class="btn-action btn-primary"
                      @click.stop="handleInputCode(transaction)"
                    >
                      <i class="bi bi-keyboard"></i>
                      輸入確認碼完成交易
                    </button>
                    <button v-else class="btn-action btn-waiting" disabled>
                      <i class="bi bi-clock-history"></i>
                      等待買家完成交易
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-clock-history"></i>
              <p>目前沒有進行中的交易</p>
            </div>
          </div>

          <!-- Completed Transactions Tab -->
          <div v-else-if="activeTab === 'completed'">
            <div v-if="paginatedTransactions.length > 0" class="transactions-list">
              <div
                v-for="transaction in paginatedTransactions"
                :key="transaction.transaction_id"
                :data-transaction-id="transaction.transaction_id"
                :class="[
                  'transaction-card',
                  { highlighted: highlightedTransactionId === transaction.transaction_id },
                ]"
              >
                <div class="card-header">
                  <div class="transaction-type" :class="transaction.role">
                    <i
                      :class="[
                        'bi',
                        transaction.role === 'giver' ? 'bi-cash-stack' : 'bi-bag-fill',
                      ]"
                    ></i>
                    <span>{{ transaction.role === 'giver' ? '賣出' : '買入' }}</span>
                  </div>
                  <span class="status-badge completed"> 已完成 </span>
                </div>

                <div class="card-body">
                  <div class="item-info">
                    <img
                      :src="
                        transaction.item_image_url ||
                        'https://placehold.co/80x80/6fb8a5/ffffff?text=Item'
                      "
                      :alt="transaction.item_title"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h3 class="item-title">{{ transaction.item_title }}</h3>
                      <p class="item-meta">
                        {{ transaction.role === 'giver' ? '買家' : '賣家' }}:
                        {{ transaction.other_user_nickname }}
                      </p>
                    </div>
                  </div>

                  <div class="transaction-meta">
                    <div class="meta-row" v-if="transaction.completed_at">
                      <span class="meta-label">完成時間</span>
                      <span class="meta-value">{{ formatDate(transaction.completed_at) }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.giver_note">
                      <span class="meta-label">賣家備註</span>
                      <span class="meta-value">{{ transaction.giver_note }}</span>
                    </div>
                    <div class="meta-row" v-if="transaction.receiver_note">
                      <span class="meta-label">買家備註</span>
                      <span class="meta-value">{{ transaction.receiver_note }}</span>
                    </div>
                    <div class="meta-row">
                      <span class="meta-label">交易金額</span>
                      <span class="meta-value price">{{
                        formatPoints(transaction.item_price)
                      }}</span>
                    </div>
                  </div>

                  <!-- Action Buttons for Completed Transactions (Only for Buyer) -->
                  <div class="transaction-actions" v-if="transaction.role === 'receiver'">
                    <button
                      v-if="!transaction.reviewed_at"
                      class="btn-action btn-review"
                      @click.stop="handleWriteReview(transaction)"
                    >
                      <i class="bi bi-star-fill"></i>
                      填寫評價
                    </button>
                    <button v-else class="btn-action btn-reviewed" disabled>
                      <i class="bi bi-check-circle-fill"></i>
                      已評價
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <i class="bi bi-check-circle-fill"></i>
              <p>目前沒有已完成的交易</p>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div class="pagination-controls" v-if="totalPages > 1">
            <button class="pagination-btn" :disabled="currentPage === 1" @click="goToPage(1)">
              <i class="bi bi-chevron-double-left"></i>
            </button>
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <i class="bi bi-chevron-left"></i>
            </button>

            <div class="pagination-pages">
              <button
                v-for="page in visiblePages"
                :key="page"
                :class="['pagination-page', { active: page === currentPage }]"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="goToPage(totalPages)"
            >
              <i class="bi bi-chevron-double-right"></i>
            </button>

            <div class="page-jump">
              <span>前往</span>
              <input
                type="number"
                v-model.number="jumpToPageInput"
                @keyup.enter="handlePageJump"
                min="1"
                :max="totalPages"
              />
              <span>頁</span>
              <button class="jump-btn" @click="handlePageJump">
                <i class="bi bi-arrow-right-short"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />

    <!-- Confirm Transaction Modal -->
    <ConfirmTransactionModal
      v-model="showConfirmModal"
      :transaction="selectedTransaction"
      @confirm="handleConfirmModalSubmit"
    />

    <!-- Input Code Modal -->
    <InputCodeModal
      v-model="showInputCodeModal"
      :transaction="selectedTransactionForCode"
      @confirm="handleInputCodeSubmit"
    />

    <!-- View Code Modal -->
    <ViewCodeModal
      v-model="showViewCodeModal"
      :code="selectedCodeTransaction?.code"
      :transaction="selectedCodeTransaction"
    />

    <!-- Reject Transaction Modal -->
    <RejectTransactionModal
      v-model="showRejectModal"
      :transaction="selectedTransactionForReject"
      @confirm="handleRejectModalSubmit"
    />

    <!-- Cancel Transaction Modal -->
    <CancelTransactionModal
      v-model="showCancelModal"
      :transaction="selectedTransactionForCancel"
      @confirm="handleCancelModalSubmit"
    />

    <!-- Create Review Modal -->
    <CreateReviewModal
      v-model="showReviewModal"
      :transaction="selectedTransactionForReview"
      @submit="handleReviewSubmit"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useTransactionStore } from '@/stores/transaction'
  import { useReviewStore } from '@/stores/review'
  import { useAuthStore } from '@/stores/auth'
  import { usePointsStore } from '@/stores/points'
  import AppHeader from '../components/AppHeader.vue'
  import AppFooter from '../components/AppFooter.vue'
  import Breadcrumb from '../components/Breadcrumb.vue'
  import FilterTabs from '../components/FilterTabs.vue'
  import ConfirmTransactionModal from '../components/transaction/ConfirmTransactionModal.vue'
  import InputCodeModal from '../components/transaction/InputCodeModal.vue'
  import ViewCodeModal from '../components/transaction/ViewCodeModal.vue'
  import RejectTransactionModal from '../components/transaction/RejectTransactionModal.vue'
  import CancelTransactionModal from '../components/transaction/CancelTransactionModal.vue'
  import CreateReviewModal from '../components/transaction/CreateReviewModal.vue'
  import {
    buyerConfirmTransaction,
    cancelTransaction,
    finalizeTransactionWithCode,
  } from '@/api/transactionAPI'
  import { formatPoints } from '@/utils/formatPoints'

  const router = useRouter()
  const route = useRoute()
  const transactionStore = useTransactionStore()
  const reviewStore = useReviewStore()
  const authStore = useAuthStore()
  const pointsStore = usePointsStore()

  const { completed } = transactionStore

  // Helper to refresh user points/profile
  const refreshUserPoints = async () => {
    try {
      const promises = [authStore.updateCustomProfile(), pointsStore.fetchProfile(true)]
      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to refresh user points:', error)
    }
  }

  // State
  const userPoints = ref(0)
  const activeTab = ref('confirming')
  const roleTab = ref('receiver') // 'receiver' (買入), 'giver' (賣出)
  const filteredByRole = ref([]) // FilterTabs 篩選後的結果
  const isLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const jumpToPageInput = ref(1)
  const showConfirmModal = ref(false)
  const selectedTransaction = ref(null)
  const showInputCodeModal = ref(false)
  const selectedTransactionForCode = ref(null)
  const showViewCodeModal = ref(false)
  const selectedCodeTransaction = ref(null)
  const showRejectModal = ref(false)
  const selectedTransactionForReject = ref(null)
  const showCancelModal = ref(false)
  const selectedTransactionForCancel = ref(null)
  const showReviewModal = ref(false)
  const selectedTransactionForReview = ref(null)
  const highlightedTransactionId = ref(null)
  const isNavigatingToTransaction = ref(false)

  // FilterTabs 配置
  const roleFilters = computed(() => [
    {
      id: 1,
      label: '買入',
      type: 'filter',
      filterKey: 'role',
      filterValue: 'receiver',
      sortable: false,
    },
    {
      id: 2,
      label: '賣出',
      type: 'filter',
      filterKey: 'role',
      filterValue: 'giver',
      sortable: false,
    },
  ])

  const activeRoleFilterId = computed(() => {
    const match = roleFilters.value.find((filter) => filter.filterValue === roleTab.value)
    return match?.id ?? roleFilters.value[0]?.id ?? 0
  })

  // Computed
  const confirmingTransactions = computed(() => {
    const transactions = transactionStore.allConfirmingTransactions || []
    return [...transactions].sort((a, b) => b.transaction_id - a.transaction_id)
  })

  const pendingTransactions = computed(() => {
    const transactions = transactionStore.allPendingTransactions || []
    return [...transactions].sort((a, b) => b.transaction_id - a.transaction_id)
  })

  const completedTransactions = computed(() => {
    const transactions = transactionStore.allCompletedTransactions || []
    return [...transactions].sort((a, b) => b.transaction_id - a.transaction_id)
  })

  // 當前選中 tab 的交易列表
  const currentTransactions = computed(() => {
    if (activeTab.value === 'confirming') {
      return confirmingTransactions.value
    } else if (activeTab.value === 'pending') {
      return pendingTransactions.value
    } else if (activeTab.value === 'completed') {
      return completedTransactions.value
    }
    return []
  })

  // 根據角色篩選的交易列表
  const receiverTransactions = computed(() => {
    return currentTransactions.value.filter((t) => t.role === 'receiver')
  })

  const giverTransactions = computed(() => {
    return currentTransactions.value.filter((t) => t.role === 'giver')
  })

  // 顯示的交易列表（使用 FilterTabs 篩選結果）
  const displayTransactions = computed(() => {
    // 如果 FilterTabs 有篩選結果，使用它；否則使用 roleTab 的邏輯
    if (filteredByRole.value.length > 0) {
      return filteredByRole.value
    }
    if (currentTransactions.value.length === 0) {
      return []
    }
    return roleTab.value === 'giver' ? giverTransactions.value : receiverTransactions.value
  })

  // 分頁相關計算
  const totalPages = computed(() => {
    return Math.ceil(displayTransactions.value.length / pageSize.value)
  })

  // 當前頁的交易列表
  const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return displayTransactions.value.slice(start, end)
  })

  // 可見的頁碼按鈕
  const visiblePages = computed(() => {
    const pages = []
    const total = totalPages.value
    const current = currentPage.value

    if (total <= 7) {
      // 如果總頁數 <= 7，顯示所有頁碼
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 總是顯示第一頁
      pages.push(1)

      if (current <= 3) {
        // 當前頁在前面
        pages.push(2, 3, 4, 5)
        pages.push('...')
        pages.push(total)
      } else if (current >= total - 2) {
        // 當前頁在後面
        pages.push('...')
        pages.push(total - 4, total - 3, total - 2, total - 1, total)
      } else {
        // 當前頁在中間
        pages.push('...')
        pages.push(current - 1, current, current + 1)
        pages.push('...')
        pages.push(total)
      }
    }

    return pages
  })

  // (AppHeader expects numeric userPoints prop; keep userPoints as Number)

  // Methods
  const handleRoleFilterChange = (filteredItems, activeFilter) => {
    filteredByRole.value = filteredItems
    // 同步更新 roleTab 以保持狀態一致
    if (activeFilter?.filterValue) {
      roleTab.value = activeFilter.filterValue
    } else if (filteredItems.length > 0) {
      const firstRole = filteredItems[0].role
      roleTab.value = firstRole
    }
    // 重置分頁
    currentPage.value = 1
    jumpToPageInput.value = 1
  }

  const fetchTransactions = async (forceRefresh = false) => {
    isLoading.value = true
    try {
      await transactionStore.fetchAllTransactions(forceRefresh)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      isLoading.value = false
    }
  }

  const goBack = () => {
    router.back()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getStatusText = (status) => {
    const statusMap = {
      completed: '已完成',
      pending: '進行中',
      confirming: '待確認',
      cancelled: '已取消',
      failed: '失敗',
    }
    return statusMap[status] || status
  }

  const handleConfirmTransaction = (transaction) => {
    // 買家確認交易（從 confirming -> pending）
    selectedTransaction.value = transaction
    showConfirmModal.value = true
  }

  const handleRejectTransaction = (transaction) => {
    // 買家拒絕交易（從 confirming -> cancelled）
    selectedTransactionForReject.value = transaction
    showRejectModal.value = true
  }

  const handleCancelTransaction = (transaction) => {
    // 賣家撤回交易（從 confirming -> cancelled）
    selectedTransactionForCancel.value = transaction
    showCancelModal.value = true
  }

  const handleRejectModalSubmit = async () => {
    if (!selectedTransactionForReject.value) return

    try {
      isLoading.value = true
      await cancelTransaction(selectedTransactionForReject.value.transaction_id)

      alert('已拒絕交易，商品已重新上架。')

      // 重新載入交易列表
      await fetchTransactions(true)
      await refreshUserPoints()

      // 重置篩選結果，確保重新渲染
      filteredByRole.value = []
    } catch (error) {
      console.error('Failed to reject transaction:', error)
      alert(`拒絕交易失敗：${error.message}`)
    } finally {
      isLoading.value = false
      selectedTransactionForReject.value = null
    }
  }

  const handleCancelModalSubmit = async () => {
    if (!selectedTransactionForCancel.value) return

    try {
      isLoading.value = true
      await cancelTransaction(selectedTransactionForCancel.value.transaction_id)

      alert('已撤回交易，商品已重新上架。')

      // 重新載入交易列表
      await fetchTransactions(true)
      await refreshUserPoints()

      // 重置篩選結果，確保重新渲染
      filteredByRole.value = []
    } catch (error) {
      console.error('Failed to cancel transaction:', error)
      alert(`撤回交易失敗：${error.message}`)
    } finally {
      isLoading.value = false
      selectedTransactionForCancel.value = null
    }
  }

  const handleConfirmModalSubmit = async (note) => {
    if (!selectedTransaction.value) return

    try {
      isLoading.value = true
      await buyerConfirmTransaction(selectedTransaction.value.transaction_id, note || '')

      alert('交易已確認！請與賣家約定時間地點面交。')

      // 重新載入交易列表
      await fetchTransactions(true)
      await refreshUserPoints()

      // 重置篩選結果，確保重新渲染
      filteredByRole.value = []
    } catch (error) {
      console.error('Failed to confirm transaction:', error)
      alert(`確認交易失敗：${error.message}`)
    } finally {
      isLoading.value = false
      selectedTransaction.value = null
    }
  }

  const handleInputCode = (transaction) => {
    // 買家輸入確認碼完成交易（從 pending -> completed）
    selectedTransactionForCode.value = transaction
    showInputCodeModal.value = true
  }

  const handleInputCodeSubmit = async (code) => {
    if (!selectedTransactionForCode.value) return

    try {
      isLoading.value = true
      const result = await finalizeTransactionWithCode(
        selectedTransactionForCode.value.transaction_id,
        code
      )

      await refreshUserPoints()
      const latestBalance =
        pointsStore.currentBalance ??
        pointsStore.profile?.current_balance ??
        result?.new_balance ??
        0

      alert(`交易完成！\n\n您的新點數餘額：${formatPoints(latestBalance)}`)

      // 重新載入交易列表
      await fetchTransactions(true)

      // 重置篩選結果，確保重新渲染
      filteredByRole.value = []
    } catch (error) {
      console.error('Failed to finalize transaction:', error)
      alert(`完成交易失敗：${error.message}`)
    } finally {
      isLoading.value = false
      selectedTransactionForCode.value = null
    }
  }

  const handleViewCode = (transaction) => {
    selectedCodeTransaction.value = transaction
    showViewCodeModal.value = true
  }

  const handleWriteReview = (transaction) => {
    // 買家填寫評價
    selectedTransactionForReview.value = transaction
    showReviewModal.value = true
  }

  const handleReviewSubmit = async (reviewData) => {
    if (!selectedTransactionForReview.value) return

    try {
      isLoading.value = true

      // 使用 review store 建立評價
      await reviewStore.addReview({
        transaction_id: selectedTransactionForReview.value.transaction_id,
        score: reviewData.score,
        comment: reviewData.comment,
      })

      alert('評價已送出！感謝您的回饋。')

      // 在本地更新交易的 reviewed_at 字段
      const transactionId = selectedTransactionForReview.value.transaction_id
      const role = selectedTransactionForReview.value.role

      // 找到對應的交易並更新
      const transactions = completed[role]
      const transactionIndex = transactions.findIndex((t) => t.transaction_id === transactionId)

      if (transactionIndex !== -1) {
        transactions[transactionIndex].reviewed_at = new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert(`送出評價失敗：${error.message}`)
    } finally {
      isLoading.value = false
      selectedTransactionForReview.value = null
    }
  }

  // 分頁相關方法
  const goToPage = (page) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    jumpToPageInput.value = page

    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = () => {
    currentPage.value = 1
    jumpToPageInput.value = 1
  }

  const handlePageJump = () => {
    const page = jumpToPageInput.value
    if (page >= 1 && page <= totalPages.value) {
      goToPage(page)
    } else {
      jumpToPageInput.value = currentPage.value
    }
  }

  // 根據 transactionId 找到交易並切換到對應的 tab 和 role
  const navigateToTransaction = async (transactionId) => {
    if (!transactionId) return

    const id = parseInt(transactionId)
    if (isNaN(id)) return

    // 標記正在導航中，避免 watch 干擾
    isNavigatingToTransaction.value = true

    // 等待交易資料載入
    await fetchTransactions()

    // 在所有交易中尋找
    let found = false
    let targetTab = ''
    let targetRole = ''

    // 搜尋 confirming
    const confirmingTransaction = confirmingTransactions.value.find((t) => t.transaction_id === id)
    if (confirmingTransaction) {
      found = true
      targetTab = 'confirming'
      targetRole = confirmingTransaction.role
    }

    // 搜尋 pending
    if (!found) {
      const pendingTransaction = pendingTransactions.value.find((t) => t.transaction_id === id)
      if (pendingTransaction) {
        found = true
        targetTab = 'pending'
        targetRole = pendingTransaction.role
      }
    }

    // 搜尋 completed
    if (!found) {
      const completedTransaction = completedTransactions.value.find((t) => t.transaction_id === id)
      if (completedTransaction) {
        found = true
        targetTab = 'completed'
        targetRole = completedTransaction.role
      }
    }

    if (found) {
      // 切換到對應的 tab（先不改 roleTab，避免被 watch 重置）
      activeTab.value = targetTab

      // 等待 activeTab 的 watch 執行完畢
      await nextTick()

      // 現在設定 roleTab
      roleTab.value = targetRole

      // 手動設定 filteredByRole，確保 displayTransactions 包含目標交易
      // 這是關鍵：FilterTabs 組件可能還沒觸發，需要手動設定篩選結果
      filteredByRole.value = currentTransactions.value.filter((t) => t.role === targetRole)

      // 再次等待 DOM 更新
      await nextTick()

      // 找到交易在當前列表中的索引
      const transactionIndex = displayTransactions.value.findIndex((t) => t.transaction_id === id)

      if (transactionIndex !== -1) {
        // 計算應該在哪一頁
        const targetPage = Math.floor(transactionIndex / pageSize.value) + 1
        currentPage.value = targetPage
        jumpToPageInput.value = targetPage

        // 再次等待 DOM 更新完成
        await nextTick()

        // 高亮該交易
        highlightedTransactionId.value = id

        // 滾動到該交易卡片
        setTimeout(() => {
          const card = document.querySelector(`[data-transaction-id="${id}"]`)
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' })

            // 5 秒後移除高亮
            setTimeout(() => {
              highlightedTransactionId.value = null
            }, 5000)
          }
        }, 300)
      }
    }

    // 導航完成，解除標記
    isNavigatingToTransaction.value = false
  }

  // Lifecycle
  onMounted(async () => {
    await fetchTransactions()

    // 檢查是否有 transactionId 參數
    const transactionId = route.query.transactionId
    if (transactionId) {
      await navigateToTransaction(transactionId)
      // 清除 URL 參數，避免刷新頁面時重複跳轉
      router.replace({ query: {} })
    }
  })

  // Watch activeTab to reset roleTab and pagination
  watch(activeTab, () => {
    // 如果正在導航到特定交易，不要重置 roleTab
    if (!isNavigatingToTransaction.value) {
      roleTab.value = 'receiver'
      filteredByRole.value = [] // 重置 FilterTabs 的結果
      currentPage.value = 1
      jumpToPageInput.value = 1
    }
  })

  // Watch roleTab to reset pagination
  watch(roleTab, () => {
    // 如果正在導航到特定交易，不要重置分頁
    if (!isNavigatingToTransaction.value) {
      currentPage.value = 1
      jumpToPageInput.value = 1
    }
  })
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .transaction-records-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f9f9f9;
  }

  .main-content {
    flex: 1;
    padding: 30px 0 60px;
  }

  .records-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 20px;
  }

  // Breadcrumb
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;

    .breadcrumb-link {
      color: $primary;
      text-decoration: none;
      transition: color 0.3s;

      &:hover {
        color: #5fa795;
      }
    }

    i {
      font-size: 12px;
      color: #999;
    }

    .breadcrumb-current {
      color: #1e1e1e;
    }
  }

  // Page Header
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

      i {
        font-size: 20px;
        color: #1e1e1e;
      }

      &:hover {
        background: #f5f5f5;
        transform: translateX(-3px);
      }
    }

    .page-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #1e1e1e;
      margin: 0;
    }

    .spacer {
      width: 40px;
    }
  }

  // Tabs
  .tabs-section {
    background: white;
    border-radius: 12px;
    padding: 0;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow-x: auto;
  }

  // Role Filter Section
  .role-filter-section {
    margin-bottom: 24px;
  }

  .tabs-container {
    display: flex;
    gap: 0;
    min-width: fit-content;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 18px 24px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;

    i {
      font-size: 18px;
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      background: #e0e0e0;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }

    &:hover {
      color: $primary;
      background: #f9f9f9;
    }

    &.active {
      color: $primary;
      border-bottom-color: $primary;

      .tab-count {
        background: $primary;
        color: white;
      }
    }
  }

  // Pagination Info
  .pagination-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    font-family: 'Noto Sans TC', sans-serif;

    .total-count {
      font-size: 14px;
      color: #666;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;

      select {
        padding: 6px 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: white;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: $primary;
        }

        &:focus {
          outline: none;
          border-color: $primary;
          box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
        }
      }
    }
  }

  // Pagination Controls
  .pagination-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 30px 20px;
    margin-top: 24px;

    .pagination-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid #e0e0e0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      color: #1e1e1e;

      i {
        font-size: 16px;
      }

      &:hover:not(:disabled) {
        border-color: $primary;
        color: $primary;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(111, 184, 165, 0.2);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
        background: #f5f5f5;
      }
    }

    .pagination-pages {
      display: flex;
      gap: 6px;
    }

    .pagination-page {
      min-width: 36px;
      height: 36px;
      padding: 0 12px;
      border: 1px solid #e0e0e0;
      background: white;
      border-radius: 6px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1e1e1e;
      cursor: pointer;
      transition: all 0.3s;

      &:hover:not(.active) {
        border-color: $primary;
        color: $primary;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(111, 184, 165, 0.2);
      }

      &.active {
        background: $primary;
        color: white;
        border-color: $primary;
        cursor: default;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }
    }

    .page-jump {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 16px;
      padding-left: 16px;
      border-left: 1px solid #e0e0e0;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;

      input {
        width: 60px;
        height: 36px;
        padding: 0 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        text-align: center;
        transition: all 0.3s;

        &:focus {
          outline: none;
          border-color: $primary;
          box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
        }

        /* Remove spinner */
        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
        }
        -moz-appearance: textfield;
        appearance: textfield;
      }

      .jump-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid $primary;
        background: $primary;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;

        i {
          font-size: 20px;
        }

        &:hover {
          background: #5fa795;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(111, 184, 165, 0.3);
        }
      }
    }
  }

  // Transactions Section
  .transactions-section {
    min-height: 400px;
  }

  // Loading State
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f0f0f0;
      border-top-color: $primary;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      color: #999;
      margin: 0;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .transaction-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &.highlighted {
      animation: highlight-pulse 2s ease-in-out;
      box-shadow:
        0 0 0 3px rgba(111, 184, 165, 0.4),
        0 4px 16px rgba(111, 184, 165, 0.3);
    }
  }

  @keyframes highlight-pulse {
    0%,
    100% {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    50% {
      box-shadow:
        0 0 0 3px rgba(111, 184, 165, 0.4),
        0 4px 16px rgba(111, 184, 165, 0.3);
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .transaction-type {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;

    i {
      font-size: 16px;
    }

    &.purchase {
      color: #2196f3;

      i {
        color: #2196f3;
      }
    }

    &.sale {
      color: #4caf50;

      i {
        color: #4caf50;
      }
    }

    &.giver {
      color: #4caf50;

      i {
        color: #4caf50;
      }
    }

    &.receiver {
      color: #2196f3;

      i {
        color: #2196f3;
      }
    }
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 12px;
    font-weight: 500;

    &.completed {
      background: #e8f5e9;
      color: #4caf50;
    }

    &.pending {
      background: #fff3e0;
      color: #ff9800;
    }

    &.confirming {
      background: #e3f2fd;
      color: #2196f3;
    }

    &.cancelled {
      background: #ffebee;
      color: #f44336;
    }

    &.failed {
      background: #fafafa;
      color: #9e9e9e;
    }
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .item-info {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .item-image {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .item-details {
    flex: 1;
    min-width: 0;

    .item-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 6px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-meta {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }

  .transaction-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .meta-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
    }

    .meta-value {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #1e1e1e;
      font-weight: 500;

      &.price {
        color: $primary;
        font-weight: 600;
        font-size: 16px;
      }
    }

    .code-view-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      transition: all 0.2s;

      .meta-value {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #2196f3;
      }

      i {
        font-size: 14px;
        color: #2196f3;
        transition: color 0.2s;
      }

      &:hover {
        background: #2196f3;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);

        .meta-value,
        i {
          color: white;
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    i {
      font-size: 80px;
      color: #e0e0e0;
      margin-bottom: 20px;
    }

    p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      color: #999;
      margin: 0;
    }
  }

  // Transaction Actions
  .transaction-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;

    .btn-action {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 16px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;

      i {
        font-size: 16px;
      }

      &.btn-reject {
        background: #ffebee;
        color: #d32f2f;
        border: 1px solid #d32f2f;

        &:hover {
          background: #d32f2f;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }

      &.btn-cancel {
        background: #fff3e0;
        color: #f57c00;
        border: 1px solid #f57c00;

        &:hover {
          background: #f57c00;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(245, 124, 0, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }

      &.btn-confirm {
        background: $primary;
        color: white;

        &:hover {
          background: #5fa795;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(111, 184, 165, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }

      &.btn-primary {
        background: #2196f3;
        color: white;

        &:hover {
          background: #1976d2;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }

      &.btn-waiting {
        background: #f5f5f5;
        color: #999;
        cursor: not-allowed;
        opacity: 0.7;

        &:hover {
          transform: none;
          box-shadow: none;
        }
      }

      &.btn-review {
        background: #fff3e0;
        color: #f57c00;
        border: 1px solid #ffc107;

        &:hover {
          background: #ffc107;
          color: #1e1e1e;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }

      &.btn-reviewed {
        background: #e8f5e9;
        color: #4caf50;
        border: 1px solid #4caf50;
        cursor: not-allowed;
        opacity: 0.8;

        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
    }
  }

  // Responsive
  @media (max-width: 767.98px) {
    .main-content {
      padding: 20px 0 50px;
    }

    .records-container {
      padding: 0 15px;
    }

    .page-header {
      margin-bottom: 20px;

      .page-title {
        font-size: 24px;
      }
    }

    .pagination-info {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .pagination-controls {
      flex-wrap: wrap;
      gap: 8px;

      .page-jump {
        margin-left: 0;
        padding-left: 0;
        border-left: none;
        width: 100%;
        justify-content: center;
        margin-top: 8px;
      }
    }

    .tab-btn {
      padding: 16px 20px;
      font-size: 14px;

      i {
        font-size: 16px;
      }

      span:not(.tab-count) {
        display: none;
      }
    }

    .transaction-card {
      padding: 16px;
    }

    .item-info {
      gap: 12px;
    }

    .item-image {
      width: 60px;
      height: 60px;
    }

    .item-details {
      .item-title {
        font-size: 15px;
      }

      .item-meta {
        font-size: 13px;
      }
    }
  }

  @media (max-width: 575.98px) {
    .main-content {
      padding: 15px 0 40px;
    }

    .records-container {
      padding: 0 10px;
    }

    .breadcrumb {
      font-size: 12px;
    }

    .page-header {
      .page-title {
        font-size: 20px;
      }

      .back-btn {
        width: 36px;
        height: 36px;

        i {
          font-size: 18px;
        }
      }

      .spacer {
        width: 36px;
      }
    }

    .empty-state {
      padding: 80px 20px;

      i {
        font-size: 60px;
      }

      p {
        font-size: 16px;
      }
    }
  }
</style>
