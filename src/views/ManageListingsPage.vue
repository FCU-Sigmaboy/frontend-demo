<template>
  <div class="manage-listings-page">
  <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="breadcrumbItems" />

      <div class="manage-container">
        <!-- Stats Cards (Filter Buttons) -->
        <div class="stats-grid">
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'all' }"
            @click="setFilter('all')"
          >
            <div class="stat-number">{{ stats.all }}</div>
            <div class="stat-label">全部商品</div>
          </div>
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'active' }"
            @click="setFilter('active')"
          >
            <div class="stat-number">{{ stats.active }}</div>
            <div class="stat-label">上架中</div>
          </div>
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'inactive' }"
            @click="setFilter('inactive')"
          >
            <div class="stat-number">{{ stats.inactive }}</div>
            <div class="stat-label">已下架</div>
          </div>
          <div
            class="stat-card"
            :class="{ active: activeFilter === 'sold' }"
            @click="setFilter('sold')"
          >
            <div class="stat-number">{{ stats.sold }}</div>
            <div class="stat-label">已售出</div>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="actions-bar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋"
              class="search-input"
            />
          </div>
          <button class="action-btn primary" @click="goToCreateListing">
            <i class="bi bi-plus-circle"></i>
            刊登
          </button>
        </div>

        <!-- Listings Table (Desktop) -->
        <div class="table-container desktop-view">
          <table class="listings-table">
            <thead>
              <tr>
                <th class="col-image sortable" @click="sortBy('name')">
                  物品 <span class="sort-icon">{{ getSortIcon('name') }}</span>
                </th>
                <th class="col-status sortable" @click="sortBy('status')">
                  狀態 <span class="sort-icon">{{ getSortIcon('status') }}</span>
                </th>
                <th class="col-date sortable" @click="sortBy('publishedDate')">
                  發布日期 <span class="sort-icon">{{ getSortIcon('publishedDate') }}</span>
                </th>
                <th class="col-date sortable" @click="sortBy('updatedDate')">
                  更新日期 <span class="sort-icon">{{ getSortIcon('updatedDate') }}</span>
                </th>
                <th class="col-price sortable" @click="sortBy('price')">
                  點數 <span class="sort-icon">{{ getSortIcon('price') }}</span>
                </th>
                <th class="col-stats sortable" @click="sortBy('likes')">
                  被收藏 <span class="sort-icon">{{ getSortIcon('likes') }}</span>
                </th>
                <th class="col-actions">操作</th>
              </tr>
            </thead>
            <tbody v-if="isLoading">
              <!-- Loading Skeleton Rows -->
              <tr v-for="i in 5" :key="`skeleton-${i}`" class="skeleton-row">
                <td class="col-image">
                  <div class="product-info">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-text" style="width: 150px;"></div>
                  </div>
                </td>
                <td class="col-status">
                  <div class="skeleton-badge"></div>
                </td>
                <td class="col-date">
                  <div class="skeleton-text" style="width: 100px;"></div>
                </td>
                <td class="col-date">
                  <div class="skeleton-text" style="width: 100px;"></div>
                </td>
                <td class="col-price">
                  <div class="skeleton-text" style="width: 60px;"></div>
                </td>
                <td class="col-stats">
                  <div class="skeleton-text" style="width: 40px;"></div>
                </td>
                <td class="col-actions">
                  <div class="skeleton-actions">
                    <div class="skeleton-button"></div>
                    <div class="skeleton-button"></div>
                  </div>
                </td>
              </tr>
            </tbody>

            <!-- Actual Listing Rows -->
            <tbody v-else>
              <tr v-for="listing in filteredListings" :key="listing.id" class="listing-row">
                <!-- Product Info -->
                <td class="col-image">
                  <div class="product-info">
                    <img :src="listing.image" :alt="listing.name" class="product-image" />
                    <div class="product-name" @click="router.push({ name: 'ItemDetail', params: { id: listing.id } })" style="cursor: pointer;">{{ listing.name }}</div>
                  </div>
                </td>

                <!-- Status -->
                <td class="col-status">
                  <span :class="['status-badge', `status-${listing.status}`]">
                    <i :class="getStatusIcon(listing.status)"></i>
                    {{ getStatusText(listing.status) }}
                  </span>
                </td>

                <!-- Published Date -->
                <td class="col-date">{{ listing.publishedDate }}</td>

                <!-- Updated Date -->
                <td class="col-date">{{ listing.updatedDate }}</td>

                <!-- Price -->
                <td class="col-price">{{ formatPoints(listing.price) }}</td>

                <!-- Stats -->
                <td class="col-stats">
                  <div class="stats-cell">
                    <span class="stat-item">
                      <i class="bi bi-heart-fill"></i>
                      {{ listing.likes }}
                    </span>
                  </div>
                </td>

                <!-- Actions -->
                <td class="col-actions">
                  <div class="action-buttons">
                    <button
                      v-if="listing.status === 'waiting' || listing.status === 'in_transaction'"
                      class="btn-sm btn-view"
                      @click="viewTransaction(listing.id)"
                      title="查看交易"
                    >
                      查看交易
                    </button>
                    <template v-else>
                      <button
                        v-if="listing.status !== 'sold'"
                        class="btn-sm btn-edit"
                        @click="editListing(listing.id)"
                        title="編輯"
                      >
                        編輯
                      </button>
                      <button
                        v-if="listing.status === 'inactive'"
                        class="btn-sm btn-toggle"
                        @click="toggleStatus(listing.id, true)"
                        title="上架"
                      >
                        上架
                      </button>
                      <button
                        v-if="listing.status === 'active'"
                        class="btn-sm btn-toggle"
                        @click="toggleStatus(listing.id, false)"
                        title="下架"
                      >
                        下架
                      </button>
                      <button
                        v-if="listing.status !== 'sold'"
                        class="btn-sm btn-delete"
                        @click="deleteListing(listing.id)"
                        title="刪除"
                      >
                        刪除
                      </button>
                      <button
                        v-if="listing.status === 'sold'"
                        class="btn-sm btn-view"
                        @click="viewTransaction(listing.id)"
                        title="查看交易"
                      >
                        查看交易
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div v-if="!isLoading && filteredListings.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>找不到符合條件的刊登</p>
          </div>
        </div>

        <!-- Pagination Controls (Desktop) -->
        <div v-if="!isLoading && allFilteredListings.length > 5" class="pagination-container desktop-view">
          <div class="pagination-info">
            顯示第 {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, allFilteredListings.length) }} 項,共 {{ allFilteredListings.length }} 項
          </div>
          <div class="pagination-controls">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              <i class="bi bi-chevron-left"></i>
              上一頁
            </button>

            <button
              v-for="(page, index) in pageNumbers"
              :key="index"
              class="pagination-btn page-number"
              :class="{ active: page === currentPage, ellipsis: page === '...' }"
              :disabled="page === '...'"
              @click="typeof page === 'number' ? goToPage(page) : null"
            >
              {{ page }}
            </button>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              下一頁
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
          <div class="items-per-page">
            <label for="itemsPerPage">每頁顯示：</label>
            <select id="itemsPerPage" v-model.number="itemsPerPage" @change="currentPage = 1">
              <option :value="5">5 項</option>
              <option :value="10">10 項</option>
              <option :value="20">20 項</option>
              <option :value="50">50 項</option>
            </select>
          </div>
        </div>

        <!-- Listings Cards (Mobile) -->
        <div class="cards-container mobile-view">
          <!-- Mobile Sort Filters -->
          <div v-if="!isLoading && filteredListings.length > 0" class="mobile-sort-section">
            <FilterTabs
              :items="filteredListings"
              :filters="mobileFilterTabs"
              @update:sortedItems="mobileSortedListings = $event"
            />
          </div>

          <!-- Loading Skeleton Cards -->
          <template v-if="isLoading">
            <div v-for="i in 5" :key="`skeleton-card-${i}`" class="listing-card skeleton-card">
              <div class="card-image-section">
                <div class="skeleton-image-large"></div>
              </div>
              <div class="card-content">
                <div class="skeleton-text" style="width: 80%; height: 20px; margin-bottom: 12px;"></div>
                <div class="skeleton-badge" style="margin-bottom: 12px;"></div>
                <div class="card-details">
                  <div class="skeleton-text" style="width: 60%; height: 14px; margin-bottom: 8px;"></div>
                  <div class="skeleton-text" style="width: 50%; height: 14px;"></div>
                </div>
                <div class="skeleton-actions" style="margin-top: 16px;">
                  <div class="skeleton-button"></div>
                  <div class="skeleton-button"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- Actual Listing Cards -->
          <div v-else v-for="listing in (mobileSortedListings.length > 0 ? mobileSortedListings : filteredListings)" :key="`card-${listing.id}`" class="listing-card">
            <div class="card-image-section" @click="router.push({ name: 'ItemDetail', params: { id: listing.id } })">
              <img :src="listing.image" :alt="listing.name" class="card-image" />
              <span :class="['card-status-badge', `status-${listing.status}`]">
                <i :class="getStatusIcon(listing.status)"></i>
                {{ getStatusText(listing.status) }}
              </span>
            </div>

            <div class="card-content">
              <h3 class="card-title" @click="router.push({ name: 'ItemDetail', params: { id: listing.id } })">
                {{ listing.name }}
              </h3>

              <div class="card-details">
                <div class="detail-row">
                  <span class="detail-label">點數</span>
                  <span class="detail-value price">{{ formatPoints(listing.price) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">被收藏</span>
                  <span class="detail-value">
                    <i class="bi bi-heart-fill"></i>
                    {{ listing.likes }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">發布日期</span>
                  <span class="detail-value">{{ listing.publishedDate }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">更新日期</span>
                  <span class="detail-value">{{ listing.updatedDate }}</span>
                </div>
              </div>

              <div class="card-actions">
                <template v-if="listing.status === 'waiting' || listing.status === 'in_transaction'">
                  <button
                    class="btn-card btn-view btn-primary"
                    @click="viewTransaction(listing.id)"
                  >
                    <i class="bi bi-eye"></i>
                    查看交易
                  </button>
                </template>
                <template v-else>
                  <button
                    v-if="listing.status !== 'sold'"
                    class="btn-card btn-edit btn-primary"
                    @click="editListing(listing.id)"
                  >
                    <i class="bi bi-pencil"></i>
                    編輯
                  </button>
                  <button
                    v-if="listing.status === 'sold'"
                    class="btn-card btn-view btn-primary"
                    @click="viewTransaction(listing.id)"
                  >
                    <i class="bi bi-eye"></i>
                    查看交易
                  </button>
                  <button
                    v-if="listing.status === 'inactive'"
                    class="btn-card btn-toggle btn-secondary"
                    @click="toggleStatus(listing.id, true)"
                  >
                    <i class="bi bi-arrow-up-circle"></i>
                    重新上架
                  </button>
                  <button
                    v-if="listing.status === 'active'"
                    class="btn-card btn-toggle btn-secondary"
                    @click="toggleStatus(listing.id, false)"
                  >
                    <i class="bi bi-arrow-down-circle"></i>
                    下架
                  </button>
                  <button
                    v-if="listing.status !== 'sold'"
                    class="btn-card btn-delete btn-tertiary"
                    @click="deleteListing(listing.id)"
                  >
                    <i class="bi bi-trash"></i>
                    <span class="btn-text">刪除</span>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!isLoading && filteredListings.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>找不到符合條件的刊登</p>
          </div>
        </div>

        <!-- Pagination Controls (Mobile) -->
        <div v-if="!isLoading && allFilteredListings.length > 5" class="pagination-container mobile-view">
          <div class="pagination-info-mobile">
            第 {{ currentPage }} / {{ totalPages }} 頁 (共 {{ allFilteredListings.length }} 項)
          </div>
          <div class="pagination-controls-mobile">
            <button
              class="pagination-btn-mobile"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              <i class="bi bi-chevron-left"></i>
            </button>

            <span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span>

            <button
              class="pagination-btn-mobile"
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
          <div class="items-per-page-mobile">
            <select v-model.number="itemsPerPage" @change="currentPage = 1">
              <option :value="5">5 項/頁</option>
              <option :value="10">10 項/頁</option>
              <option :value="20">20 項/頁</option>
              <option :value="50">50 項/頁</option>
            </select>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useTransactionStore } from '@/stores/transaction';
import { getMyItems } from '../api/itemsAPI';
import { toggleItemStatus, deleteMyItem } from '../api/itemsAPI';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import FilterTabs from '../components/FilterTabs.vue';
import { formatPoints } from '@/utils/formatPoints';

const router = useRouter();
const authStore = useAuthStore();
const transactionStore = useTransactionStore();

// Breadcrumb items
const breadcrumbItems = [
  { label: '個人檔案', to: { name: 'UserProfile' } },
  { label: '管理刊登' }
];

// State
const userPoints = ref(500);
const searchQuery = ref('');
const activeFilter = ref('all');
const listings = ref([]);
const isLoading = ref(true);

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Sorting state
const sortKey = ref('');
const sortOrder = ref('asc'); // 'asc' or 'desc'

// Mobile filter tabs configuration
const mobileFilterTabs = ref([
  {
    id: 1,
    label: '更新日期',
    sortKey: 'updatedDate',
    defaultOrder: 'desc',
    ascText: '早到晚',
    descText: '晚到早'
  },
  {
    id: 2,
    label: '發布日期',
    sortKey: 'publishedDate',
    defaultOrder: 'desc',
    ascText: '早到晚',
    descText: '晚到早'
  },
  {
    id: 3,
    label: '點數',
    sortKey: 'price',
    defaultOrder: 'asc',
    ascText: '低到高',
    descText: '高到低'
  },
  {
    id: 4,
    label: '收藏數',
    sortKey: 'likes',
    defaultOrder: 'desc',
    ascText: '少到多',
    descText: '多到少'
  },
  {
    id: 5,
    label: '物品名稱',
    sortKey: 'name',
    defaultOrder: 'asc',
    ascText: 'A-Z',
    descText: 'Z-A'
  }
]);

// Mobile sorted items
const mobileSortedListings = ref([]);

// Computed stats
const stats = computed(() => {
  const all = listings.value.length;
  const active = listings.value.filter(item => item.status === 'active').length;
  const inactive = listings.value.filter(item => item.status === 'inactive').length;
  const sold = listings.value.filter(item => item.status === 'sold').length;

  return { all, active, inactive, sold };
});

// Status priority for default sorting (lower number = higher priority)
const statusPriority = {
  'in_transaction': 1,
  'waiting': 2,
  'active': 3,
  'inactive': 4,
  'sold': 5
};

// Computed filtered listings (with filtering and sorting applied)
const allFilteredListings = computed(() => {
  let filtered = listings.value;

  // Filter by status
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(item => item.status === activeFilter.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Apply sorting
  if (sortKey.value) {
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[sortKey.value];
      let bVal = b[sortKey.value];

      // Handle date sorting
      if (sortKey.value === 'publishedDate' || sortKey.value === 'updatedDate') {
        aVal = new Date(aVal.replace(/\//g, '-'));
        bVal = new Date(bVal.replace(/\//g, '-'));
      }

      // Handle number sorting (price, likes)
      if (sortKey.value === 'price' || sortKey.value === 'likes') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      // Handle string sorting (name, status)
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return sortOrder.value === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortOrder.value === 'asc' ? 1 : -1;
      }
      return 0;
    });
  } else if (activeFilter.value === 'all') {
    // Default sorting for "全部商品": sort by status priority 交易中>上架中>已下架>已售出
    filtered = [...filtered].sort((a, b) => {
      const aPriority = statusPriority[a.status] || 99;
      const bPriority = statusPriority[b.status] || 99;
      return aPriority - bPriority;
    });
  }

  return filtered;
});

// Computed total pages
const totalPages = computed(() => {
  return Math.ceil(allFilteredListings.value.length / itemsPerPage.value);
});

// Computed paginated listings (for display)
const filteredListings = computed(() => {
  // Ensure current page doesn't exceed total pages
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value;
  }

  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return allFilteredListings.value.slice(start, end);
});

// Pagination methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Get page numbers to display
const pageNumbers = computed(() => {
  const pages = [];
  const maxVisible = 5;

  if (totalPages.value <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Show smart pagination
    if (currentPage.value <= 3) {
      // Near start
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages.value);
    } else if (currentPage.value >= totalPages.value - 2) {
      // Near end
      pages.push(1);
      pages.push('...');
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) pages.push(i);
    } else {
      // Middle
      pages.push(1);
      pages.push('...');
      pages.push(currentPage.value - 1);
      pages.push(currentPage.value);
      pages.push(currentPage.value + 1);
      pages.push('...');
      pages.push(totalPages.value);
    }
  }

  return pages;
});

// Load listings from API
const loadListings = async () => {
  try {
    isLoading.value = true;

    if (!authStore.isLoggedIn) {
      console.warn('⚠️ Not logged in, cannot load listings');
      listings.value = [];
      return;
    }

    console.log('🔍 Fetching my items...');

    // Fetch items while ensuring transaction cache is hydrated
    const [, items] = await Promise.all([
      transactionStore.fetchAllTransactions(),
      getMyItems({
        page: 1,
        size: 100,
        sort_by: 'updated_at',
        sort_direction: 'desc'
      })
    ]);

    const itemToTransactionMap = transactionStore.itemToTransactionMap ?? new Map();

    if (items) {
      // Transform API data to match component expectations
      listings.value = items.map(item => {
        // Check if item is in a transaction (active or completed)
        const transactionInfo = itemToTransactionMap.get(item.item_id);

        // Determine status based on transaction status first, then listing_status
        let status;

        if (transactionInfo) {
          // Item has a transaction (waiting, in_transaction, or sold)
          status = transactionInfo.status;
        } else {
          // No transaction - check listing_status
          status = item.listing_status ? 'active' : 'inactive';
        }

        return {
          id: item.item_id,
          name: item.title,
          image: item.image_url || 'https://placehold.co/60x60/6fb8a5/ffffff?text=Item',
          status: status,
          transactionId: transactionInfo?.transactionId,
          publishedDate: formatDate(item.created_at),
          updatedDate: formatDate(item.updated_at),
          price: item.price || 0,
          views: 0, // API doesn't return view_count yet
          likes: item.favorites_count || 0
        };
      });

      console.log('[Item] Loaded listings:', listings.value.length);
    } else {
      listings.value = [];
    }
  } catch (error) {
    console.error('[ItemManagement] Failed to load listings:', error);
    listings.value = [];
    alert('載入刊登失敗，請稍後再試');
  } finally {
    isLoading.value = false;
  }
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '/');
};

// (AppHeader expects numeric userPoints prop; keep userPoints as Number)

// Set filter
const setFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1; // Reset to first page when filter changes
};

// Sorting methods
const sortBy = (key) => {
  if (sortKey.value === key) {
    // Toggle sort order if clicking the same column
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort key and default to ascending
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
  // No need to reset page - sorting happens within current page for animation to work
};

const getSortIcon = (key) => {
  if (sortKey.value !== key) {
    return '⇅'; // Default unsorted icon
  }
  return sortOrder.value === 'asc' ? '↑' : '↓';
};

// Methods
const getStatusIcon = (status) => {
  const icons = {
    active: 'bi bi-circle-fill',
    inactive: 'bi bi-dash-circle',
    sold: 'bi bi-check-circle',
    waiting: 'bi bi-hourglass-split',
    in_transaction: 'bi bi-clock-history'
  };
  return icons[status] || 'bi-circle';
};

const getStatusText = (status) => {
  const texts = {
    active: '上架中',
    inactive: '已下架',
    sold: '已售出',
    waiting: '待接受',
    in_transaction: '交易中'
  };
  return texts[status] || status;
};

const goToCreateListing = () => {
  router.push({ name: 'CreateListing' });
};

const editListing = (id) => {
  router.push({ name: 'EditListing', params: { id: String(id) } });
};

const viewTransaction = (id) => {
  const listing = listings.value.find(l => l.id === id);
  const transactionId = listing?.transactionId;

  router.push({
    name: 'TransactionRecords',
    query: transactionId ? { transactionId } : {}
  });
};

// Toggle listing status (上架/下架)
const toggleStatus = async (id, newStatus) => {
  const action = newStatus ? '上架' : '下架';

  try {
    console.log(`[ItemManagement] Toggling item #${id} status to ${newStatus}`);

    await toggleItemStatus(id, newStatus);

    // Update local state
    const listing = listings.value.find(l => l.id === id);
    if (listing) {
      listing.status = newStatus ? 'active' : 'inactive';
    }

  } catch (error) {
    console.error(`[ItemManagement] Failed to toggle status:`, error);
    alert(`${action}失敗：${error.message}`);
  }
};

// Delete listing
const deleteListing = async (id) => {
  if (!confirm('確定要刪除此刊登嗎？刪除後無法復原。')) return;

  try {
    console.log(`[ItemManagement] Deleting item #${id}`);

    await deleteMyItem(id);

    // Remove from local state
    listings.value = listings.value.filter(l => l.id !== id);

    alert('刪除成功！');
  } catch (error) {
    console.error('[ItemManagement] Failed to delete item:', error);
    alert(`刪除失敗：${error.message}`);
  }
};

// Load listings on mount and when auth state changes
onMounted(() => {
  // Try to load immediately if already logged in
  if (authStore.isLoggedIn) {
    loadListings();
  } else {
    // If not logged in yet, wait a bit for auth to initialize
    setTimeout(() => {
      if (authStore.isLoggedIn) {
        loadListings();
      } else {
        // Still not logged in, stop loading
        isLoading.value = false;
      }
    }, 100);
  }
});

// Watch for auth state changes (e.g., after login or page refresh)
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn && listings.value.length === 0 && !isLoading.value) {
    loadListings();
  }
});

// Watch for search query changes and reset to first page
watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.manage-listings-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.main-content {
  flex: 1;
  padding: 30px 0 60px;
}

.manage-container {
  max-width: 1600px;
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

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &.active {
    border-color: $primary;
    background: #f0f9f7;

    .stat-number {
      color: $primary;
    }

    .stat-label {
      color: $primary;
      font-weight: 600;
    }
  }

  .stat-number {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e1e1e;
    margin-bottom: 8px;
    transition: color 0.3s;
  }

  .stat-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    transition: all 0.3s;
  }
}

// Actions Bar
.actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  padding: 10px 16px;
  flex: 1;
  max-width: 400px;

  i {
    font-size: 16px;
    color: #999;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    outline: none;

    &::placeholder {
      color: #999;
    }
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
  }

  &.primary {
    background: $primary;
    border-color: $primary;
    color: white;

    &:hover {
      background: #5fa795;
    }
  }

  &:hover {
    background: #f5f5f5;
  }
}

// Table
.table-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.listings-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Noto Sans TC', sans-serif;

  thead {
    background: #f9f9f9;

    th {
      padding: 16px 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      white-space: nowrap;

      &.sortable {
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
        position: relative;

        &:hover {
          background: #f0f0f0;
          color: $primary;
        }

        &:active {
          background: #e8e8e8;
        }

        .sort-icon {
          display: inline-block;
          margin-left: 6px;
          font-size: 12px;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        &:hover .sort-icon {
          opacity: 1;
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f0f0f0;

      &:hover {
        background: #fafafa;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 16px 12px;
      font-size: 14px;
      color: #1e1e1e;
      vertical-align: middle;
    }
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .product-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .product-name {
    font-weight: 500;
    color: #1e1e1e;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }


}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  i {
    font-size: 10px;
  }

  &.status-active {
    background: #e8f5f3;
    color: #00b894;

    i {
      color: #00b894;
    }
  }

  &.status-inactive {
    background: #f5f5f5;
    color: #999;

    i {
      color: #999;
    }
  }

  &.status-sold {
    background: #e3f2fd;
    color: #2196f3;

    i {
      color: #2196f3;
    }
  }

  &.status-waiting {
    background: #fff8e1;
    color: #f57c00;

    i {
      color: #f57c00;
    }
  }

  &.status-in_transaction {
    background: #fff3e0;
    color: #ff9800;

    i {
      color: #ff9800;
    }
  }
}

.stats-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #666;

    i {
      font-size: 14px;
      color: #999;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 12px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &.btn-view {
    background: white;
    border-color: $primary;
    color: $primary;

    &:hover {
      background: $primary;
      color: white;
    }
  }

  &.btn-edit {
    background: white;
    border-color: #2196f3;
    color: #2196f3;

    &:hover {
      background: #2196f3;
      color: white;
    }
  }

  &.btn-toggle {
    background: white;
    border-color: $primary;
    color: $primary;

    &:hover {
      background: $primary;
      color: white;
    }
  }

  &.btn-delete {
    background: white;
    border-color: #dc3545;
    color: #dc3545;

    &:hover {
      background: #dc3545;
      color: white;
    }
  }
}

// Skeleton Loading Styles
.skeleton-row {
  td {
    padding: 16px 12px;
  }
}

.skeleton-image {
  width: 60px;
  height: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-text {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-badge {
  width: 80px;
  height: 28px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.5s ease-in-out infinite;
  display: inline-block;
}

.skeleton-actions {
  display: flex;
  gap: 8px;
}

.skeleton-button {
  width: 60px;
  height: 32px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;

  i {
    font-size: 60px;
    color: #e0e0e0;
    margin-bottom: 16px;
  }

  p {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

// Mobile Cards View
.cards-container {
  display: none; // Hidden on desktop

  &.mobile-view {
    display: none;
  }
}

// Mobile Sort Section
.mobile-sort-section {
  margin-bottom: 20px;
  padding: 0;

  // Override FilterTabs styles to allow wrapping
  :deep(.filter-tabs) {
    flex-wrap: wrap;
    gap: 10px;
  }

  :deep(.filter-tab) {
    flex-shrink: 0;
  }
}

.listing-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.card-image-section {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  cursor: pointer;

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-status-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    backdrop-filter: blur(8px);

    i {
      font-size: 10px;
    }

    &.status-active {
      background: rgba(0, 184, 148, 0.9);
      color: white;
    }

    &.status-inactive {
      background: rgba(149, 149, 149, 0.9);
      color: white;
    }

    &.status-sold {
      background: rgba(33, 150, 243, 0.9);
      color: white;
    }

    &.status-waiting {
      background: rgba(245, 124, 0, 0.9);
      color: white;
    }

    &.status-in_transaction {
      background: rgba(255, 152, 0, 0.9);
      color: white;
    }
  }
}

.card-content {
  padding: 16px;
}

.card-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0 0 12px 0;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: $primary;
  }
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;

  .detail-label {
    color: #666;
    font-weight: 400;
  }

  .detail-value {
    color: #1e1e1e;
    font-weight: 500;

    &.price {
      color: $primary;
      font-weight: 600;
      font-size: 16px;
    }

    i {
      font-size: 12px;
      color: #ff6b6b;
      margin-right: 4px;
    }
  }
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 14px;
  }

  // Primary buttons (編輯/查看交易) - flexible width
  &.btn-primary {
    flex: 1;
    font-size: 15px;
    padding: 11px 16px;
    font-weight: 600;
  }

  // Secondary buttons (上架/下架) - flexible width
  &.btn-secondary {
    flex: 1;
  }

  // Tertiary buttons (刪除) - 35% width on desktop, less prominent
  &.btn-tertiary {
    flex: 0 0 calc(35% - 8px);
    font-size: 12px;
    padding: 9px 10px;

    // Hide text on mobile, keep icon only
    .btn-text {
      display: inline;
    }
  }

  &.btn-view,
  &.btn-edit {
    background: white;
    border-color: $primary;
    color: $primary;

    &:hover {
      background: $primary;
      color: white;
    }
  }

  &.btn-edit {
    border-color: #2196f3;
    color: #2196f3;

    &:hover {
      background: #2196f3;
      color: white;
    }
  }

  &.btn-toggle {
    background: white;
    border-color: $primary;
    color: $primary;

    &:hover {
      background: $primary;
      color: white;
    }
  }

  &.btn-delete {
    background: white;
    border-color: #dc3545;
    color: #dc3545;

    &:hover {
      background: #dc3545;
      color: white;
    }
  }
}

.skeleton-card {
  .card-image-section {
    cursor: default;
  }
}

.skeleton-image-large {
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

// Responsive
@media (max-width: 1199.98px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 991.98px) {
  .main-content {
    padding: 20px 0 50px;
  }

  .manage-container {
    padding: 0 15px;
  }
}

@media (max-width: 767.98px) {
  .stats-grid {
    gap: 12px;
  }

  .stat-card {
    padding: 20px 16px;

    .stat-number {
      font-size: 28px;
    }

    .stat-label {
      font-size: 13px;
    }
  }

  .actions-bar {
    .search-box {
      max-width: 100%;
    }

    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }

  // Switch to card view on mobile
  .desktop-view {
    display: none !important;
  }

  .mobile-view {
    display: block !important;
  }

  .listing-card {
    margin-bottom: 12px;
  }

  .card-image-section {
    height: 180px;
  }

  .card-content {
    padding: 14px;
  }

  .card-title {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .card-details {
    gap: 6px;
    margin-bottom: 14px;
    padding-bottom: 14px;
  }

  .detail-row {
    font-size: 13px;

    .detail-value.price {
      font-size: 15px;
    }
  }

  .btn-card {
    padding: 9px 10px;
    font-size: 13px;

    &.btn-primary {
      flex: 1;
      font-size: 14px;
      padding: 10px 12px;
    }

    &.btn-secondary {
      flex: 1;
      font-size: 13px;
    }

    &.btn-tertiary {
      flex: 0 0 auto;
      width: 42px;
      height: 42px;
      padding: 0;
      justify-content: center;

      .btn-text {
        display: none;
      }

      i {
        font-size: 16px;
        margin: 0;
      }
    }

    i {
      font-size: 13px;
    }
  }
}

@media (max-width: 575.98px) {
  .main-content {
    padding: 15px 0 40px;
  }

  .manage-container {
    padding: 0 10px;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .listing-card {
    margin-bottom: 10px;
  }

  .card-image-section {
    height: 160px;

    .card-status-badge {
      top: 8px;
      right: 8px;
      padding: 4px 10px;
      font-size: 12px;
    }
  }

  .card-content {
    padding: 12px;
  }

  .card-title {
    font-size: 15px;
    margin-bottom: 8px;
  }

  .card-details {
    gap: 5px;
    margin-bottom: 12px;
    padding-bottom: 12px;
  }

  .detail-row {
    font-size: 12px;

    .detail-value.price {
      font-size: 14px;
    }

    i {
      font-size: 11px;
    }
  }

  .btn-card {
    padding: 8px 8px;
    font-size: 12px;

    &.btn-primary {
      flex: 1;
      font-size: 12px;
      padding: 9px 10px;
    }

    &.btn-secondary {
      flex: 1;
      font-size: 12px;
    }

    &.btn-tertiary {
      width: 38px;
      height: 38px;
      padding: 0;

      .btn-text {
        display: none;
      }

      i {
        font-size: 15px;
        margin: 0;
      }
    }

    i {
      font-size: 12px;
    }
  }
}

// Pagination Styles
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: 'Noto Sans TC', sans-serif;
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 12px;
  }

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: $primary;
    color: $primary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.page-number {
    min-width: 40px;
    padding: 8px 12px;
    justify-content: center;

    &.active {
      background: $primary;
      border-color: $primary;
      color: white;
      font-weight: 600;
    }

    &.ellipsis {
      border: none;
      cursor: default;
      background: transparent;

      &:hover {
        background: transparent;
        border: none;
      }
    }
  }
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;

  label {
    font-weight: 500;
  }

  select {
    padding: 8px 12px;
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #1e1e1e;
    cursor: pointer;
    background: white;
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

// Mobile Pagination Styles
.pagination-container.mobile-view {
  display: none;
}

.pagination-info-mobile {
  width: 100%;
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.pagination-controls-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.pagination-btn-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  i {
    font-size: 16px;
    color: #1e1e1e;
  }

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: $primary;

    i {
      color: $primary;
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-indicator {
  font-size: 14px;
  font-weight: 600;
  color: #1e1e1e;
  min-width: 60px;
  text-align: center;
}

.items-per-page-mobile {
  width: 100%;
  text-align: center;

  select {
    width: 120px;
    padding: 8px 12px;
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 13px;
    color: #1e1e1e;
    cursor: pointer;
    background: white;
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

@media (max-width: 767.98px) {
  .pagination-container.desktop-view {
    display: none !important;
  }

  .pagination-container.mobile-view {
    display: flex !important;
    flex-direction: column;
    padding: 16px;
  }
}

@media (max-width: 991.98px) {
  .pagination-container.desktop-view {
    .pagination-info {
      width: 100%;
      text-align: center;
      margin-bottom: 12px;
    }

    .pagination-controls {
      width: 100%;
    }

    .items-per-page {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
