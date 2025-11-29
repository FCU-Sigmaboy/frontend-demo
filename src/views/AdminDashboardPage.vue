<template>
  <div class="admin-dashboard-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <div class="dashboard-container">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">
            <i class="bi bi-shield-check"></i>
            管理員控制台
          </h1>
          <p class="page-subtitle">活動贈點系統管理</p>
        </div>

        <!-- Quick Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-people-fill"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">總用戶數</div>
              <div class="stat-value">{{ stats.totalUsers }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-gift-fill"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">活動總數</div>
              <div class="stat-value">{{ stats.totalActivities }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-coin"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">已發放點數</div>
              <div class="stat-value">{{ formatPoints(stats.totalPointsDistributed) }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-bell-fill"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">待處理通知</div>
              <div class="stat-value">{{ stats.pendingNotifications }}</div>
            </div>
          </div>
        </div>

        <!-- Main Navigation Tabs -->
        <div class="tabs-section">
          <div class="tabs-container">
            <button
              :class="['tab-btn', { active: activeTab === 'activities' }]"
              @click="activeTab = 'activities'"
            >
              <i class="bi bi-calendar-event"></i>
              <span>活動管理</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'distribute' }]"
              @click="activeTab = 'distribute'"
            >
              <i class="bi bi-send-fill"></i>
              <span>發放點數</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'auto-rules' }]"
              @click="activeTab = 'auto-rules'"
            >
              <i class="bi bi-gear-fill"></i>
              <span>自動規則</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'history' }]"
              @click="activeTab = 'history'"
            >
              <i class="bi bi-clock-history"></i>
              <span>發放記錄</span>
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Activities Management Tab -->
          <div v-if="activeTab === 'activities'" class="content-panel">
            <div class="panel-header">
              <h2>活動列表</h2>
              <button class="btn-primary" @click="showCreateActivityModal = true">
                <i class="bi bi-plus-circle"></i>
                新建活動
              </button>
            </div>

            <div v-if="activities.length === 0" class="empty-state">
              <i class="bi bi-inbox"></i>
              <p>尚無活動，點擊上方按鈕建立第一個活動</p>
            </div>

            <div v-else class="activities-list">
              <div
                v-for="activity in activities"
                :key="activity.id"
                class="activity-card"
              >
                <div class="activity-header">
                  <div class="activity-title">
                    <i class="bi bi-gift"></i>
                    {{ activity.title }}
                  </div>
                  <span :class="['status-badge', activity.status]">
                    {{ getStatusText(activity.status) }}
                  </span>
                </div>
                <div class="activity-body">
                  <p class="activity-description">{{ activity.description }}</p>
                  <div class="activity-meta">
                    <div class="meta-item">
                      <i class="bi bi-coin"></i>
                      {{ formatPoints(activity.points) }}
                    </div>
                    <div class="meta-item">
                      <i class="bi bi-people"></i>
                      {{ activity.recipientCount || 0 }} 人
                    </div>
                    <div class="meta-item">
                      <i class="bi bi-calendar"></i>
                      {{ formatDate(activity.createdAt) }}
                    </div>
                  </div>
                </div>
                <div class="activity-actions">
                  <button class="btn-action btn-edit" @click="editActivity(activity)">
                    <i class="bi bi-pencil"></i>
                    編輯
                  </button>
                  <button class="btn-action btn-delete" @click="deleteActivity(activity.id)">
                    <i class="bi bi-trash"></i>
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Distribute Points Tab -->
          <div v-if="activeTab === 'distribute'" class="content-panel">
            <div class="panel-header">
              <h2>單次發放點數</h2>
            </div>

            <div class="distribute-form">
              <div class="form-group">
                <label>活動名稱</label>
                <input
                  v-model="distributeForm.title"
                  type="text"
                  placeholder="例如：新年紅包"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>活動說明</label>
                <textarea
                  v-model="distributeForm.description"
                  placeholder="簡單描述此次贈點活動"
                  class="form-control"
                  rows="3"
                ></textarea>
              </div>

              <div class="form-group">
                <label>贈送點數</label>
                <input
                  v-model.number="distributeForm.points"
                  type="number"
                  min="1"
                  placeholder="輸入點數"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>發放條件</label>
                <div class="filter-options">
                  <div class="filter-option">
                    <input
                      v-model="distributeForm.filters.all"
                      type="checkbox"
                      id="filter-all"
                    />
                    <label for="filter-all">所有用戶</label>
                  </div>
                  <div class="filter-option">
                    <input
                      v-model="distributeForm.filters.level"
                      type="checkbox"
                      id="filter-level"
                    />
                    <label for="filter-level">指定等級</label>
                    <select
                      v-if="distributeForm.filters.level"
                      v-model="distributeForm.levelMin"
                      class="form-control-sm"
                    >
                      <option :value="1">新手交易者</option>
                      <option :value="2">青銅交易者</option>
                      <option :value="3">白銀交易者</option>
                      <option :value="4">黃金交易者</option>
                      <option :value="5">鉑金交易者</option>
                      <option :value="6">鑽石交易者</option>
                      <option :value="7">大師交易者</option>
                    </select>
                  </div>
                  <div class="filter-option">
                    <input
                      v-model="distributeForm.filters.registered"
                      type="checkbox"
                      id="filter-registered"
                    />
                    <label for="filter-registered">註冊時間</label>
                    <input
                      v-if="distributeForm.filters.registered"
                      v-model="distributeForm.registeredBefore"
                      type="date"
                      class="form-control-sm"
                    />
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-secondary" @click="resetDistributeForm">
                  <i class="bi bi-arrow-clockwise"></i>
                  重置
                </button>
                <button class="btn-primary" @click="distributePoints">
                  <i class="bi bi-send"></i>
                  立即發放
                </button>
              </div>
            </div>
          </div>

          <!-- Auto Rules Tab -->
          <div v-if="activeTab === 'auto-rules'" class="content-panel">
            <div class="panel-header">
              <h2>自動發放規則</h2>
              <button class="btn-primary" @click="showCreateRuleModal = true">
                <i class="bi bi-plus-circle"></i>
                新增規則
              </button>
            </div>

            <div v-if="autoRules.length === 0" class="empty-state">
              <i class="bi bi-robot"></i>
              <p>尚無自動規則，點擊上方按鈕建立第一條規則</p>
            </div>

            <div v-else class="rules-list">
              <div
                v-for="rule in autoRules"
                :key="rule.id"
                class="rule-card"
              >
                <div class="rule-header">
                  <div class="rule-title">
                    <i class="bi bi-lightning-charge"></i>
                    {{ rule.name }}
                  </div>
                  <div class="rule-toggle">
                    <label class="switch">
                      <input
                        type="checkbox"
                        :checked="rule.enabled"
                        @change="toggleRule(rule.id)"
                      />
                      <span class="slider"></span>
                    </label>
                    <span class="toggle-label">{{ rule.enabled ? '啟用' : '停用' }}</span>
                  </div>
                </div>
                <div class="rule-body">
                  <div class="rule-trigger">
                    <strong>觸發條件：</strong>
                    <span>{{ getTriggerText(rule.trigger) }}</span>
                  </div>
                  <div class="rule-reward">
                    <strong>贈送點數：</strong>
                    <span class="points">{{ formatPoints(rule.points) }}</span>
                  </div>
                </div>
                <div class="rule-actions">
                  <button class="btn-action btn-edit" @click="editRule(rule)">
                    <i class="bi bi-pencil"></i>
                    編輯
                  </button>
                  <button class="btn-action btn-delete" @click="deleteRule(rule.id)">
                    <i class="bi bi-trash"></i>
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'" class="content-panel">
            <div class="panel-header">
              <h2>發放記錄</h2>
            </div>

            <div v-if="history.length === 0" class="empty-state">
              <i class="bi bi-clock-history"></i>
              <p>尚無發放記錄</p>
            </div>

            <div v-else class="history-table">
              <table>
                <thead>
                  <tr>
                    <th>時間</th>
                    <th>活動名稱</th>
                    <th>點數</th>
                    <th>發放人數</th>
                    <th>類型</th>
                    <th>狀態</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in history" :key="record.id">
                    <td>{{ formatDateTime(record.createdAt) }}</td>
                    <td>{{ record.title }}</td>
                    <td class="points-col">{{ formatPoints(record.points) }}</td>
                    <td>{{ record.recipientCount }} 人</td>
                    <td>
                      <span class="type-badge">
                        {{ record.type === 'manual' ? '手動' : '自動' }}
                      </span>
                    </td>
                    <td>
                      <span :class="['status-badge', record.status]">
                        {{ getStatusText(record.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />

    <!-- Create Activity Modal -->
    <CreateActivityModal
      v-model="showCreateActivityModal"
      @submit="handleCreateActivity"
    />

    <!-- Create Rule Modal -->
    <CreateRuleModal
      v-model="showCreateRuleModal"
      @submit="handleCreateRule"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import CreateActivityModal from '../components/admin/CreateActivityModal.vue';
import CreateRuleModal from '../components/admin/CreateRuleModal.vue';
import { formatPoints } from '@/utils/formatPoints';

const router = useRouter();
const authStore = useAuthStore();

// State
const userPoints = ref(500);
const activeTab = ref('activities');
const showCreateActivityModal = ref(false);
const showCreateRuleModal = ref(false);

// Stats
const stats = ref({
  totalUsers: 0,
  totalActivities: 0,
  totalPointsDistributed: 0,
  pendingNotifications: 0
});

// Activities
const activities = ref([]);

// Distribute Form
const distributeForm = ref({
  title: '',
  description: '',
  points: 100,
  filters: {
    all: true,
    level: false,
    registered: false
  },
  levelMin: 1,
  registeredBefore: ''
});

// Auto Rules
const autoRules = ref([]);

// History
const history = ref([]);

// Methods
const getStatusText = (status) => {
  const statusMap = {
    active: '進行中',
    completed: '已完成',
    pending: '待處理',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

const getTriggerText = (trigger) => {
  const triggerMap = {
    new_user: '新用戶註冊',
    first_transaction: '首次交易完成',
    level_up: '升級',
    daily_login: '每日登入',
    transaction_milestone: '交易里程碑'
  };
  return triggerMap[trigger] || trigger;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW');
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
};

const resetDistributeForm = () => {
  distributeForm.value = {
    title: '',
    description: '',
    points: 100,
    filters: {
      all: true,
      level: false,
      registered: false
    },
    levelMin: 1,
    registeredBefore: ''
  };
};

const distributePoints = async () => {
  if (!distributeForm.value.title || !distributeForm.value.points) {
    alert('請填寫完整資訊');
    return;
  }

  try {
    // TODO: Call API to distribute points
    alert('點數發放成功！');
    resetDistributeForm();
  } catch (error) {
    console.error('Failed to distribute points:', error);
    alert('發放失敗：' + error.message);
  }
};

const handleCreateActivity = async (activityData) => {
  try {
    // TODO: Call API to create activity
    console.log('Creating activity:', activityData);
    alert('活動建立成功！');
    showCreateActivityModal.value = false;
  } catch (error) {
    console.error('Failed to create activity:', error);
    alert('建立失敗：' + error.message);
  }
};

const editActivity = (activity) => {
  console.log('Editing activity:', activity);
  // TODO: Implement edit functionality
};

const deleteActivity = async (activityId) => {
  if (!confirm('確定要刪除此活動嗎？')) return;

  try {
    // TODO: Call API to delete activity
    console.log('Deleting activity:', activityId);
    alert('活動已刪除');
  } catch (error) {
    console.error('Failed to delete activity:', error);
    alert('刪除失敗：' + error.message);
  }
};

const handleCreateRule = async (ruleData) => {
  try {
    // TODO: Call API to create rule
    console.log('Creating rule:', ruleData);
    alert('規則建立成功！');
    showCreateRuleModal.value = false;
  } catch (error) {
    console.error('Failed to create rule:', error);
    alert('建立失敗：' + error.message);
  }
};

const editRule = (rule) => {
  console.log('Editing rule:', rule);
  // TODO: Implement edit functionality
};

const toggleRule = async (ruleId) => {
  try {
    // TODO: Call API to toggle rule
    console.log('Toggling rule:', ruleId);
  } catch (error) {
    console.error('Failed to toggle rule:', error);
    alert('切換失敗：' + error.message);
  }
};

const deleteRule = async (ruleId) => {
  if (!confirm('確定要刪除此規則嗎？')) return;

  try {
    // TODO: Call API to delete rule
    console.log('Deleting rule:', ruleId);
    alert('規則已刪除');
  } catch (error) {
    console.error('Failed to delete rule:', error);
    alert('刪除失敗：' + error.message);
  }
};

const loadData = async () => {
  try {
    // TODO: Load data from API
    // Mock data for now
    stats.value = {
      totalUsers: 1234,
      totalActivities: 15,
      totalPointsDistributed: 50000,
      pendingNotifications: 3
    };

    activities.value = [
      {
        id: 1,
        title: '新年紅包',
        description: '慶祝新年，全站用戶送紅包',
        points: 500,
        status: 'completed',
        recipientCount: 1000,
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    autoRules.value = [
      {
        id: 1,
        name: '新用戶歡迎禮',
        trigger: 'new_user',
        points: 500,
        enabled: true
      }
    ];

    history.value = [
      {
        id: 1,
        title: '新年紅包',
        points: 500,
        recipientCount: 1000,
        type: 'manual',
        status: 'completed',
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

// Lifecycle
onMounted(() => {
  // Check if user is admin
  // TODO: Implement proper admin check
  loadData();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.admin-dashboard-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;

  .page-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    i {
      color: $primary;
      font-size: 36px;
    }
  }

  .page-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $primary, #5fa795);

    i {
      font-size: 28px;
      color: white;
    }
  }

  .stat-content {
    flex: 1;

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e1e1e;
    }
  }
}

.tabs-section {
  background: white;
  border-radius: 12px;
  padding: 0;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
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

  &:hover {
    color: $primary;
    background: #f9f9f9;
  }

  &.active {
    color: $primary;
    border-bottom-color: $primary;
  }
}

.tab-content {
  min-height: 400px;
}

.content-panel {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h2 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
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
}

.btn-primary {
  background: $primary;
  color: white;

  &:hover {
    background: #5fa795;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(111, 184, 165, 0.3);
  }
}

.btn-secondary {
  background: #e0e0e0;
  color: #1e1e1e;

  &:hover {
    background: #d0d0d0;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;

  i {
    font-size: 80px;
    color: #e0e0e0;
    margin-bottom: 20px;
  }

  p {
    font-size: 16px;
    color: #999;
    margin: 0;
  }
}

.activities-list,
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card,
.rule-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;

  &:hover {
    border-color: $primary;
    box-shadow: 0 4px 12px rgba(111, 184, 165, 0.2);
  }
}

.activity-header,
.rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.activity-title,
.rule-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e1e1e;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    color: $primary;
  }
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &.active {
    background: #e8f5e9;
    color: #4caf50;
  }

  &.completed {
    background: #e3f2fd;
    color: #2196f3;
  }

  &.pending {
    background: #fff3e0;
    color: #ff9800;
  }

  &.cancelled {
    background: #ffebee;
    color: #f44336;
  }
}

.activity-body {
  margin-bottom: 16px;
}

.activity-description {
  color: #666;
  margin: 0 0 12px 0;
}

.activity-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #666;

    i {
      color: $primary;
    }
  }
}

.activity-actions,
.rule-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &.btn-edit {
    background: #e3f2fd;
    color: #2196f3;

    &:hover {
      background: #2196f3;
      color: white;
    }
  }

  &.btn-delete {
    background: #ffebee;
    color: #f44336;

    &:hover {
      background: #f44336;
      color: white;
    }
  }
}

.distribute-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1e1e1e;
  }

  .form-control {
    width: 100%;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
    }
  }

  .form-control-sm {
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 13px;
    margin-left: 8px;
  }
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  label {
    margin: 0;
    cursor: pointer;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
}

.rule-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: $primary;

      &:before {
        transform: translateX(26px);
      }
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    border-radius: 24px;
    transition: 0.4s;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: 0.4s;
    }
  }
}

.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.rule-body {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;

  .rule-trigger,
  .rule-reward {
    display: flex;
    gap: 8px;

    strong {
      color: #1e1e1e;
    }

    span {
      color: #666;
    }

    .points {
      color: $primary;
      font-weight: 600;
    }
  }
}

.history-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: #f9f9f9;

      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #1e1e1e;
        border-bottom: 2px solid #e0e0e0;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #f0f0f0;

        &:hover {
          background: #f9f9f9;
        }
      }

      td {
        padding: 12px;
        color: #666;

        &.points-col {
          color: $primary;
          font-weight: 600;
        }
      }
    }
  }
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 767.98px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .tab-btn {
    span {
      display: none;
    }
  }

  .content-panel {
    padding: 20px;
  }

  .panel-header {
    flex-direction: column;
    gap: 12px;

    h2 {
      font-size: 20px;
    }
  }
}
</style>
