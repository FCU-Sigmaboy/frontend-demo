<template>
  <div class="combined-achievements-section">
    <div class="achievements-header">
      <h3 class="achievements-title">
        成就與徽章
        <span v-if="showCarbonTotal && totalCarbon > 0" class="carbon-total">
          總碳足跡節省: {{ totalCarbon.toFixed(1) }} kg
        </span>
      </h3>
      <button class="view-all-btn" @click="showModal = true">
        <i class="bi bi-grid-3x3-gap"></i>
        查看全部
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
    </div>

    <!-- Horizontal Achievement Row -->
    <div v-else class="achievements-row-container">
      <div class="achievements-row">
        <div
          v-for="badge in displayedBadges"
          :key="badge.badge_id"
          :class="['achievement-item', { unlocked: badge.unlocked }]"
          @click="onBadgeClick(badge)"
        >
          <div class="achievement-icon-wrapper">
            <span class="achievement-icon">{{ badge.icon }}</span>
            <div v-if="!badge.unlocked" class="lock-overlay">
              <i class="bi bi-lock-fill"></i>
            </div>
          </div>
          <span class="achievement-label">{{ badge.name }}</span>
        </div>

        <!-- Expand Indicator -->
        <div
          v-if="allBadges.length > displayLimit"
          class="expand-indicator"
          @click="showModal = true"
        >
          <span class="achievement-count">+{{ allBadges.length - displayLimit }}</span>
          <i class="bi bi-chevron-right"></i>
        </div>
      </div>
    </div>

    <!-- Achievement Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>成就與徽章</h4>
          <button class="modal-close" @click="showModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Category Tabs -->
          <div class="category-tabs">
            <button
              :class="['category-tab', { active: activeCategory === 'all' }]"
              @click="activeCategory = 'all'"
            >
              全部 ({{ allBadges.length }})
            </button>
            <button
              :class="['category-tab', { active: activeCategory === 'streak' }]"
              @click="activeCategory = 'streak'"
            >
              簽到 ({{ badgesByCategory.streak.length }})
            </button>
            <button
              :class="['category-tab', { active: activeCategory === 'transaction' }]"
              @click="activeCategory = 'transaction'"
            >
              交易 ({{ badgesByCategory.transaction.length }})
            </button>
            <button
              :class="['category-tab', { active: activeCategory === 'points' }]"
              @click="activeCategory = 'points'"
            >
              點數 ({{ badgesByCategory.points.length }})
            </button>
          </div>

          <div class="achievements-grid">
            <div
              v-for="badge in filteredBadges"
              :key="badge.badge_id"
              :class="[
                'achievement-grid-item',
                {
                  unlocked: badge.unlocked,
                  [`rarity-${badge.rarity?.toLowerCase()}`]: true,
                },
              ]"
            >
              <div class="achievement-icon-wrapper">
                <span class="achievement-icon">{{ badge.icon }}</span>
                <div v-if="!badge.unlocked" class="lock-overlay">
                  <i class="bi bi-lock-fill"></i>
                </div>
              </div>
              <span class="achievement-label">{{ badge.name }}</span>
              <span class="achievement-description">{{ badge.description }}</span>

              <!-- 已解鎖徽章：顯示點數獎勵和獲得時間 -->
              <template v-if="badge.unlocked">
                <span v-if="badge.points_reward" class="achievement-points"
                  >+{{ badge.points_reward }}P</span
                >
                <span v-if="badge.earned_at" class="achievement-earned-date">
                  <i class="bi bi-check-circle-fill"></i>
                  {{ formatDate(badge.earned_at) }}
                </span>
              </template>

              <!-- 進行中徽章：顯示進度條 -->
              <template v-else>
                <div class="achievement-progress-wrapper">
                  <div class="progress-text">
                    <span class="progress-percentage"
                      >{{ Math.round(badge.percentage || 0) }}%</span
                    >
                    <span
                      v-if="badge.current_value !== undefined && badge.target_value !== undefined"
                      class="progress-values"
                    >
                      {{ badge.current_value }}/{{ badge.target_value }}
                    </span>
                  </div>
                  <div class="progress-bar-container">
                    <div
                      class="progress-bar-fill"
                      :style="{ width: (badge.percentage || 0) + '%' }"
                    ></div>
                  </div>
                  <span v-if="badge.points_reward" class="achievement-points locked"
                    >解鎖可得 +{{ badge.points_reward }}P</span
                  >
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="showModal = false">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref, onMounted, watch } from 'vue'
  import { getUserBadgesWithProgress } from '@/api/badgesAPI'

  const props = defineProps({
    userId: {
      type: String,
      default: null,
    },
    totalCarbon: {
      type: Number,
      default: 0,
    },
    showCarbonTotal: {
      type: Boolean,
      default: false,
    },
    isOwnProfile: {
      type: Boolean,
      default: true,
    },
  })

  const emit = defineEmits(['achievement-click'])

  const isLoading = ref(false)
  const showModal = ref(false)
  const activeCategory = ref('all')
  const earnedBadges = ref([])
  const inProgressBadges = ref([])
  const displayLimit = 5

  // Fetch badges on mount
  onMounted(() => {
    fetchBadges()
  })

  // Re-fetch when userId changes
  watch(
    () => props.userId,
    () => {
      fetchBadges()
    }
  )

  async function fetchBadges() {
    try {
      isLoading.value = true
      const data = await getUserBadgesWithProgress(props.userId)

      earnedBadges.value = (data?.earned_badges || []).map((b) => ({
        ...b,
        unlocked: true,
      }))

      inProgressBadges.value = (data?.in_progress_badges || []).map((b) => ({
        ...b,
        unlocked: false,
      }))
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    } finally {
      isLoading.value = false
    }
  }

  // All badges combined (earned first, then in-progress)
  const allBadges = computed(() => {
    return [...earnedBadges.value, ...inProgressBadges.value]
  })

  // Badges by category
  const badgesByCategory = computed(() => {
    const categories = {
      streak: [],
      transaction: [],
      points: [],
      carbon: [],
      seasonal: [],
      other: [],
    }

    allBadges.value.forEach((badge) => {
      const cat = badge.category || 'other'
      if (categories[cat]) {
        categories[cat].push(badge)
      } else {
        categories.other.push(badge)
      }
    })

    return categories
  })

  // Filtered badges based on active category
  const filteredBadges = computed(() => {
    if (activeCategory.value === 'all') {
      return allBadges.value
    }
    return badgesByCategory.value[activeCategory.value] || []
  })

  // Displayed badges (only unlocked for public view, or first N badges)
  const displayedBadges = computed(() => {
    if (props.isOwnProfile) {
      // Own profile: show first N badges (earned first)
      return allBadges.value.slice(0, displayLimit)
    } else {
      // Other user's profile: only show earned/unlocked badges
      return earnedBadges.value.slice(0, displayLimit)
    }
  })

  function onBadgeClick(badge) {
    // 轉換資料格式以符合 modal 期望的結構
    const transformedBadge = {
      ...badge,
      label: badge.name,
      points: badge.points_reward,
      progress: badge.percentage || 0,
      type: 'badge',
      ...(badge.current_value !== undefined &&
        badge.target_value !== undefined && {
          threshold: `${badge.current_value}/${badge.target_value}`,
          remainingKg:
            badge.category === 'carbon' ? badge.target_value - badge.current_value : undefined,
        }),
    }

    emit('achievement-click', transformedBadge)
  }

  // 格式化日期顯示
  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .combined-achievements-section {
    position: relative;

    .achievements-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;

      .achievements-title {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 18px;
        font-weight: 600;
        color: #1e1e1e;
        margin: 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .carbon-total {
          font-size: 14px;
          font-weight: 500;
          color: $primary;
          background: #e6f4f0;
          padding: 6px 12px;
          border-radius: 20px;
        }
      }

      .view-all-btn {
        background: none;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 6px 12px;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        color: #555;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s;

        &:hover {
          border-color: $primary;
          color: $primary;
          background: #f0f7f5;
        }
      }
    }
  }

  .loading-state {
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  .achievements-row-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 2px;
    }
  }

  .achievements-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
    min-width: fit-content;
  }

  .achievement-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    min-width: 70px;
    flex-shrink: 0;
    transition: all 0.3s;

    .achievement-icon-wrapper {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f0f7f5;
      border: 2px solid #e0e0e0;
      margin-bottom: 6px;
      overflow: hidden;
      transition: all 0.3s;

      .achievement-icon {
        font-size: 32px;
        line-height: 1;
        filter: grayscale(100%);
        opacity: 0.5;
        transition: all 0.3s;
      }

      .lock-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.4);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;

        i {
          font-size: 20px;
          color: white;
        }
      }
    }

    .achievement-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #999;
      font-weight: 500;
      text-align: center;
      line-height: 1.3;
      word-break: break-word;
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &.unlocked {
      .achievement-icon-wrapper {
        border-color: $primary;
        background-color: #e6f4f0;

        .achievement-icon {
          filter: grayscale(0%);
          opacity: 1;
        }

        .lock-overlay {
          display: none;
        }
      }

      .achievement-label {
        color: #1e1e1e;
      }
    }

    &:hover {
      .achievement-icon-wrapper {
        transform: scale(1.05);
      }
    }
  }

  .expand-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    min-width: 60px;
    height: 60px;
    border: 2px dashed #ccc;
    border-radius: 50%;
    background: #f9f9f9;
    transition: all 0.3s;
    gap: 4px;
    flex-shrink: 0;

    .achievement-count {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #999;
    }

    i {
      font-size: 16px;
      color: #999;
    }

    &:hover {
      border-color: $primary;
      background: #f0f7f5;

      .achievement-count,
      i {
        color: $primary;
      }
    }
  }

  // Modal Styles
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    max-width: 700px;
    width: 90%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s;
    overflow: hidden;
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;

    h4 {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: #1e1e1e;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s;

      &:hover {
        background: #f0f0f0;
        color: #1e1e1e;
      }
    }
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .category-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    .category-tab {
      padding: 8px 16px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #666;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;

      &:hover {
        background: #e6f4f0;
        border-color: $primary;
        color: $primary;
      }

      &.active {
        background: $primary;
        border-color: $primary;
        color: white;
      }
    }
  }

  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
  }

  .achievement-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    transition: all 0.3s;

    .achievement-icon-wrapper {
      width: 80px;
      height: 80px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border-radius: 50%;
      overflow: hidden;
      background-color: #f0f7f5;

      .achievement-icon {
        font-size: 48px;
        filter: grayscale(100%);
        opacity: 0.5;
        transition: all 0.3s;
      }

      .lock-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.4);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;

        i {
          font-size: 24px;
          color: white;
        }
      }
    }

    .achievement-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #1e1e1e;
      text-align: center;
      margin-bottom: 4px;
    }

    .achievement-description {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #999;
      text-align: center;
      margin-bottom: 4px;
    }

    .achievement-points {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: $primary;
      text-align: center;
      margin-top: 4px;

      &.locked {
        color: #999;
        font-size: 10px;
      }
    }

    .achievement-earned-date {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 10px;
      color: #27ae60;
      text-align: center;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;

      i {
        font-size: 10px;
      }
    }

    .achievement-progress-wrapper {
      width: 100%;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .progress-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 11px;

        .progress-percentage {
          font-weight: 600;
          color: $primary;
        }

        .progress-values {
          color: #999;
          font-size: 10px;
        }
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background-color: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, $primary 0%, darken($primary, 10%) 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
    }

    &.unlocked {
      border-color: $primary;
      background: #f0f7f5;

      .achievement-icon-wrapper {
        .achievement-icon {
          filter: grayscale(0%);
          opacity: 1;
        }

        .lock-overlay {
          display: none;
        }
      }
    }

    // Rarity colors
    &.rarity-common.unlocked {
      border-color: #95a5a6;
    }
    &.rarity-uncommon.unlocked {
      border-color: #27ae60;
    }
    &.rarity-rare.unlocked {
      border-color: #3498db;
    }
    &.rarity-epic.unlocked {
      border-color: #9b59b6;
    }
    &.rarity-legendary.unlocked {
      border-color: #f39c12;
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;

    .btn-primary {
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: $primary;
      color: white;
      transition: all 0.3s;

      &:hover {
        background: darken($primary, 10%);
      }
    }
  }

  // Responsive
  @media (max-width: 767.98px) {
    .achievements-header {
      .achievements-title {
        font-size: 16px !important;
        flex-direction: column;
        align-items: flex-start !important;

        .carbon-total {
          font-size: 13px;
        }
      }

      .view-all-btn {
        font-size: 12px;
        padding: 5px 10px;
      }
    }

    .achievement-item {
      min-width: 60px;

      .achievement-icon-wrapper {
        width: 50px;
        height: 50px;

        .achievement-icon {
          font-size: 28px;
        }

        .lock-overlay i {
          font-size: 16px;
        }
      }

      .achievement-label {
        font-size: 10px;
      }
    }

    .expand-indicator {
      width: 50px;
      height: 50px;
      min-width: 50px;
    }

    .modal-content {
      width: 95%;
      max-height: 90vh;
    }

    .achievements-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
    }

    .achievement-grid-item {
      .achievement-icon-wrapper {
        width: 60px;
        height: 60px;

        .achievement-icon {
          font-size: 36px;
        }

        .lock-overlay i {
          font-size: 20px;
        }
      }

      .achievement-label {
        font-size: 12px;
      }
    }
  }

  @media (max-width: 575.98px) {
    .achievement-item {
      min-width: 55px;

      .achievement-icon-wrapper {
        width: 45px;
        height: 45px;

        .achievement-icon {
          font-size: 24px;
        }

        .lock-overlay i {
          font-size: 14px;
        }
      }

      .achievement-label {
        font-size: 9px;
      }
    }

    .expand-indicator {
      width: 45px;
      height: 45px;
      min-width: 45px;

      .achievement-count {
        font-size: 10px;
      }

      i {
        font-size: 14px;
      }
    }

    .achievements-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
