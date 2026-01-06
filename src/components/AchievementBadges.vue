<template>
  <div class="achievements-section">
    <div class="achievements-header">
      <h3 class="achievements-title">
        成就徽章
        <span v-if="showCarbonTotal" class="carbon-total"
          >總碳足跡節省: {{ totalCarbon.toFixed(1) }} kg</span
        >
      </h3>
      <button class="view-all-btn" @click="showModal = true">
        <i class="bi bi-grid-3x3-gap"></i>
        查看全部
      </button>
    </div>

    <!-- Horizontal Badge Row -->
    <div class="badges-row-container">
      <div class="badges-row" :class="{ expanded: isExpanded }">
        <div
          v-for="(badge, index) in displayedBadges"
          :key="badge.id"
          :class="[
            'badge-item',
            { unlocked: badge.unlocked, current: index === currentBadgeIndex },
          ]"
          @click="onBadgeClick(badge, index)"
        >
          <div class="badge-icon-wrapper">
            <img :src="badge.image" :alt="badge.label" class="badge-image" />
            <div v-if="!badge.unlocked && showProgress" class="progress-badge">
              {{ badge.progress }}%
            </div>
          </div>
          <span class="badge-label">{{ badge.label }}</span>
        </div>

        <!-- Expand Indicator -->
        <div v-if="!isExpanded && badges.length > 1" class="expand-indicator" @click="expandRow">
          <span class="badge-count">+{{ badges.length - 1 }}</span>
          <i class="bi bi-chevron-right"></i>
        </div>
      </div>
    </div>

    <!-- Badge Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>成就徽章</h4>
          <button class="modal-close" @click="showModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="badges-grid">
            <div
              v-for="badge in badges"
              :key="badge.id"
              :class="[
                'badge-grid-item',
                { unlocked: badge.unlocked, selected: selectedBadges.includes(badge.id) },
              ]"
              @click="toggleBadgeSelection(badge.id)"
            >
              <div class="badge-icon-wrapper">
                <img :src="badge.image" :alt="badge.label" class="badge-image" />
                <div v-if="!badge.unlocked && showProgress" class="progress-badge">
                  {{ badge.progress }}%
                </div>
              </div>
              <span class="badge-label">{{ badge.label }}</span>
              <span v-if="!badge.unlocked && showThreshold" class="badge-requirement"
                >{{ badge.threshold }} kg</span
              >
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="saveBadgeSelection">儲存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref, onMounted } from 'vue'

  // Import badge images
  import badge1 from '../assets/badges/1badge.png'
  import badge2 from '../assets/badges/2badge.png'
  import badge3 from '../assets/badges/3badge.png'
  import badge4 from '../assets/badges/4badge.png'

  const props = defineProps({
    totalCarbon: {
      type: Number,
      default: 0,
    },
    showCarbonTotal: {
      type: Boolean,
      default: false,
    },
    showProgress: {
      type: Boolean,
      default: false,
    },
    showThreshold: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['badge-click'])

  // State
  const isExpanded = ref(false)
  const showModal = ref(false)
  const selectedBadges = ref([]) // Badges selected to display on profile
  const currentBadgeIndex = ref(0) // Currently displayed badge index

  // Load saved badge selections from localStorage
  onMounted(() => {
    const saved = localStorage.getItem('selectedCarbonBadges')
    if (saved) {
      selectedBadges.value = JSON.parse(saved)
    } else {
      // Default: select first unlocked badge or first badge
      const firstUnlocked = badges.value.findIndex((b) => b.unlocked)
      if (firstUnlocked >= 0) {
        selectedBadges.value = [badges.value[firstUnlocked].id]
        currentBadgeIndex.value = firstUnlocked
      } else {
        selectedBadges.value = [badges.value[0].id]
      }
    }
  })

  // Calculate badges based on totalCarbon
  const badges = computed(() => {
    const carbon = props.totalCarbon

    return [
      {
        id: 1,
        label: '環保新手',
        image: badge1,
        description: '減少 10 公斤碳排放，開啟環保旅程',
        threshold: 10,
        unlocked: carbon >= 10,
        progress: Math.min((carbon / 10) * 100, 100),
        remainingKg: Math.max(10 - carbon, 0),
      },
      {
        id: 2,
        label: '環保達人',
        image: badge2,
        description: '減少 50 公斤碳排放，感謝您的貢獻',
        threshold: 50,
        unlocked: carbon >= 50,
        progress: Math.min((carbon / 50) * 100, 100),
        remainingKg: Math.max(50 - carbon, 0),
      },
      {
        id: 3,
        label: '環保高手',
        image: badge3,
        description: '減少 100 公斤碳排放，您是環保實踐家',
        threshold: 100,
        unlocked: carbon >= 100,
        progress: Math.min((carbon / 100) * 100, 100),
        remainingKg: Math.max(100 - carbon, 0),
      },
      {
        id: 4,
        label: '環保大師',
        image: badge4,
        description: '減少 200 公斤碳排放，環保精神值得敬佩',
        threshold: 200,
        unlocked: carbon >= 200,
        progress: Math.min((carbon / 200) * 100, 100),
        remainingKg: Math.max(200 - carbon, 0),
      },
    ]
  })

  // Displayed badges (selected ones or all if expanded)
  const displayedBadges = computed(() => {
    if (isExpanded.value) {
      return badges.value
    }
    // Show only selected badges, or first badge if none selected
    if (selectedBadges.value.length > 0) {
      return badges.value.filter((b) => selectedBadges.value.includes(b.id))
    }
    return [badges.value[0]]
  })

  function expandRow() {
    isExpanded.value = true
  }

  function onBadgeClick(badge, index) {
    if (!isExpanded.value) {
      // If collapsed, expand on click
      expandRow()
    } else {
      // If expanded, emit click event
      emit('badge-click', badge)
    }
    currentBadgeIndex.value = index
  }

  function toggleBadgeSelection(badgeId) {
    const index = selectedBadges.value.indexOf(badgeId)
    if (index > -1) {
      selectedBadges.value.splice(index, 1)
    } else {
      selectedBadges.value.push(badgeId)
    }
  }

  function saveBadgeSelection() {
    localStorage.setItem('selectedCarbonBadges', JSON.stringify(selectedBadges.value))
    isExpanded.value = false
    showModal.value = false
    // Update current badge index to first selected
    if (selectedBadges.value.length > 0) {
      const firstSelected = badges.value.findIndex((b) => selectedBadges.value.includes(b.id))
      if (firstSelected >= 0) {
        currentBadgeIndex.value = firstSelected
      }
    }
  }
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .achievements-section {
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

  // Horizontal Badge Row
  .badges-row-container {
    overflow-x: auto;
    overflow-y: hidden;
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

  .badges-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
    transition: all 0.3s ease;
    min-width: fit-content;
  }

  .badge-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    min-width: 70px;
    flex-shrink: 0;
    transition: all 0.3s;

    .badge-icon-wrapper {
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

      .badge-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: filter 0.3s;
        filter: grayscale(100%) opacity(0.6);
        padding: 8px;
      }

      .progress-badge {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(111, 184, 165, 0.9);
        color: white;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 9px;
        font-weight: 700;
        text-align: center;
        padding: 2px 0;
      }

      .check-mark {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $primary;
        background: white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        i {
          font-size: 18px;
          line-height: 1;
        }
      }
    }

    .badge-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #999;
      font-weight: 500;
      text-align: center;
      line-height: 1.3;
      transition: all 0.3s;
      word-break: break-word;
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &.unlocked {
      .badge-icon-wrapper {
        border-color: $primary;
        background-color: #e6f4f0;

        .badge-image {
          filter: grayscale(0%) opacity(1);
        }
      }
      .badge-label {
        color: #1e1e1e;
      }
    }

    &.current {
      .badge-icon-wrapper {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
      }
    }

    &:hover {
      .badge-icon-wrapper {
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
    align-self: flex-start;
    margin-top: 0;

    .badge-count {
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
      color: $primary;

      .badge-count,
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
    max-width: 600px;
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

  .badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
  }

  .badge-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    transition: all 0.3s;

    .badge-icon-wrapper {
      width: 80px;
      height: 80px;
      margin-bottom: 8px;
    }

    .badge-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #1e1e1e;
      text-align: center;
      margin-bottom: 4px;
    }

    .badge-requirement {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #999;
      text-align: center;
    }

    &.unlocked {
      border-color: $primary;
      background: #f0f7f5;
    }

    &.selected {
      border-color: $primary;
      background: #e6f4f0;
      box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.2);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;

    button {
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      border: none;

      &.btn-secondary {
        background: #f0f0f0;
        color: #555;

        &:hover {
          background: #e0e0e0;
        }
      }

      &.btn-primary {
        background: $primary;
        color: white;

        &:hover {
          background: darken($primary, 10%);
        }
      }
    }
  }

  // Responsive Design
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

    .badges-row {
      align-items: flex-start;
    }

    .badge-item {
      min-width: 60px;

      .badge-icon-wrapper {
        width: 50px;
        height: 50px;
      }

      .badge-label {
        font-size: 10px;
      }
    }

    .expand-indicator {
      width: 50px;
      height: 50px;
      min-width: 50px;
      margin-top: 0;
    }

    .modal-content {
      width: 95%;
      max-height: 90vh;
    }

    .badges-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
    }

    .badge-grid-item {
      .badge-icon-wrapper {
        width: 60px;
        height: 60px;
      }

      .badge-label {
        font-size: 12px;
      }
    }
  }

  @media (max-width: 575.98px) {
    .badges-row {
      align-items: flex-start;
    }

    .badge-item {
      min-width: 55px;

      .badge-icon-wrapper {
        width: 45px;
        height: 45px;
      }

      .badge-label {
        font-size: 9px;
      }
    }

    .expand-indicator {
      width: 45px;
      height: 45px;
      min-width: 45px;
      margin-top: 0;

      .badge-count {
        font-size: 10px;
      }

      i {
        font-size: 14px;
      }
    }

    .badges-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
