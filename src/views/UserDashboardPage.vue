<template>
  <div class="user-dashboard-page">
    <AppHeader />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="[{ label: '點數儀表板' }]" />

      <div class="dashboard-container">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">載入中...</span>
          </div>
          <p class="loading-text">載入儀表板資料...</p>
        </div>

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Top Row: Points Balance & Daily Streak -->
          <div class="row g-4 mb-4">
            <div class="col-lg-8">
              <PointsBalanceCard
                :current-balance="pointsStore.currentBalance"
                :total-earned="pointsStore.totalEarned"
                :total-spent="pointsStore.totalSpent"
                :auto-fetch="false"
              />
            </div>
            <div class="col-lg-4">
              <DailyStreakCard
                :streak-days="pointsStore.dailyStreak"
                :has-signed-in-today="pointsStore.hasSignedInToday"
                @sign-in="handleSignIn"
              />
            </div>
          </div>

          <!-- Middle Row: Level Progress -->
          <div class="row g-4 mb-4">
            <div class="col-12">
              <LevelProgressCard
                :current-tier="pointsStore.currentLevelTier"
                :next-tier="pointsStore.nextLevelTier"
                :progress-percentage="pointsStore.levelProgress"
                :points-to-next="pointsStore.pointsToNextLevel"
              />
            </div>
          </div>

          <!-- Badges Section -->
          <div class="row g-4 mb-4">
            <div class="col-12">
              <BadgesCard
                :badges="pointsStore.badges"
                :earned-count="pointsStore.earnedBadgesCount"
              />
            </div>
          </div>

          <!-- Transaction History Section -->
          <div class="row g-4">
            <div class="col-12">
              <TransactionHistoryCard
                :transactions="pointsStore.transactions"
                @filter="handleTransactionFilter"
                @load-more="handleLoadMore"
              />
            </div>
          </div>
        </template>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePointsStore } from '@/stores/points'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard.vue'
import DailyStreakCard from '@/components/dashboard/DailyStreakCard.vue'
import LevelProgressCard from '@/components/dashboard/LevelProgressCard.vue'
import BadgesCard from '@/components/dashboard/BadgesCard.vue'
import TransactionHistoryCard from '@/components/dashboard/TransactionHistoryCard.vue'

const pointsStore = usePointsStore()

const isLoading = ref(true)

onMounted(async () => {
  await loadDashboardData()
})

async function loadDashboardData() {
  try {
    isLoading.value = true
    await Promise.all([
      pointsStore.fetchProfile(),
      pointsStore.fetchTransactions({ page: 1, size: 20 }),
      pointsStore.fetchBadges()
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleSignIn() {
  try {
    const result = await pointsStore.performDailySignIn()

    if (result.success) {
      let message = `${result.message}\n\n`
      message += `🎁 獲得點數: ${result.points_awarded} P\n`
      message += `🔥 連續簽到: ${result.streak_day} 天\n`

      if (result.new_balance !== undefined) {
        message += `💰 當前餘額: ${result.new_balance} P\n`
      }

      if (result.badges?.newly_earned_count > 0) {
        message += `\n🏆 獲得 ${result.badges.newly_earned_count} 個新徽章！\n`
        result.badges.badges?.forEach(badge => {
          message += `${badge.icon} ${badge.name}\n`
        })
      }

      if (result.next_reward > 0) {
        message += `\n📅 再簽到 ${result.next_reward} 天可獲得下個獎勵！`
      }

      alert(message)
      await loadDashboardData()
    } else {
      alert(result.message || '您今天已經簽到過了')
    }
  } catch (error) {
    console.error('Sign-in error:', error)
    alert(`簽到失敗: ${error.message || '請稍後再試'}`)
  }
}

async function handleTransactionFilter(filters) {
  try {
    await pointsStore.fetchTransactions(filters, true)
  } catch (error) {
    console.error('Filter error:', error)
  }
}

async function handleLoadMore(page) {
  try {
    await pointsStore.fetchTransactions({ page, size: 20 })
  } catch (error) {
    console.error('Load more error:', error)
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.user-dashboard-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.row.g-4 {
  > [class*='col-'] {
    display: flex;
    flex-direction: column;

    > * {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.loading-text {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: #555;
  margin: 0;
}

@media (max-width: 991.98px) {
  .dashboard-container {
    padding: 25px 15px;
  }
}

@media (max-width: 575.98px) {
  .dashboard-container {
    padding: 20px 10px;
  }
}
</style>
