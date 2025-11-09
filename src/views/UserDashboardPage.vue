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

          <!-- Middle Row: Level & Trust -->
          <div class="row g-4 mb-4">
            <div class="col-lg-6">
              <LevelProgressCard
                :current-tier="pointsStore.currentLevelTier"
                :next-tier="pointsStore.nextLevelTier"
                :progress-percentage="pointsStore.levelProgress"
                :points-to-next="pointsStore.pointsToNextLevel"
              />
            </div>
            <div class="col-lg-6">
              <TrustLevelCard
                :current-tier="pointsStore.currentTrustTier"
                :next-tier="pointsStore.nextTrustTier"
                :sales-to-next="pointsStore.salesPointsToNextTrust"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePointsStore } from '@/stores/points';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard.vue';
import DailyStreakCard from '@/components/dashboard/DailyStreakCard.vue';
import LevelProgressCard from '@/components/dashboard/LevelProgressCard.vue';
import TrustLevelCard from '@/components/dashboard/TrustLevelCard.vue';
import BadgesCard from '@/components/dashboard/BadgesCard.vue';
import TransactionHistoryCard from '@/components/dashboard/TransactionHistoryCard.vue';

const router = useRouter();
const pointsStore = usePointsStore();

// State
const isLoading = ref(true);

// Lifecycle
onMounted(async () => {
  await loadDashboardData();
});

// Methods
async function loadDashboardData() {
  try {
    isLoading.value = true;

    // Load all dashboard data in parallel
    await Promise.all([
      pointsStore.fetchProfile(),
      pointsStore.fetchTransactions({ page: 1, size: 20 }),
      pointsStore.fetchBadges()
    ]);

    console.log('Dashboard data loaded successfully');
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
}

async function handleSignIn() {
  try {
    const result = await pointsStore.performDailySignIn();

    if (result.success) {
      // Show success message
      alert(`簽到成功！獲得 ${result.points_awarded} 點數\n連續簽到 ${result.streak_day} 天`);
    }
  } catch (error) {
    console.error('Sign-in error:', error);
    alert('簽到失敗，請稍後再試');
  }
}

async function handleTransactionFilter(filters) {
  try {
    await pointsStore.fetchTransactions(filters, true);
  } catch (error) {
    console.error('Filter error:', error);
  }
}

async function handleLoadMore(page) {
  try {
    await pointsStore.fetchTransactions({ page, size: 20 });
  } catch (error) {
    console.error('Load more error:', error);
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

// Loading State
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

// Responsive Design
@media (max-width: 991.98px) {
  .dashboard-container {
    padding: 25px 15px;
  }

  .row {
    margin-bottom: 20px !important;
  }
}

@media (max-width: 575.98px) {
  .dashboard-container {
    padding: 20px 10px;
  }

  .row {
    margin-bottom: 15px !important;
  }
}

// Lock minimum width at 360px for phone
@media (max-width: 360px) {
  .dashboard-container {
    min-width: 360px;
    padding: 20px 10px;
  }
}
</style>
