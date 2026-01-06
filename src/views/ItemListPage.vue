<template>
  <div class="item-list-page">
    <AppHeader :user-points="userPoints" />

    <main class="main-content">
      <!-- Breadcrumb -->
      <Breadcrumb :items="breadcrumbItems" />

      <!-- Search Bar Section -->
      <section class="search-section">
        <div class="search-section-container">
          <!-- Map View Toggle Button -->
          <button class="map-toggle-btn" @click="toggleToMapView">
            <i class="bi bi-map"></i>
          </button>

          <SearchBar @search="handleSearch" />
        </div>
      </section>

      <!-- Category and Filter Section -->
      <section class="filter-header-section">
        <div class="filter-container">
          <!-- Category Breadcrumb Tabs -->
          <CategoryTabs
            v-model="currentTabValue"
            :categories="tabsData"
            :loading="categoriesStore.isLoading"
            @change="handleCategoryChange"
          />

          <!-- Page Title -->
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
      </section>

      <!-- Filter Tabs Section -->
      <section class="filter-section">
        <div class="filter-section-container">
          <!-- Location Switcher -->
          <div class="location-switcher">
            <button class="location-btn" @click="toggleLocationMenu">
              <i class="bi bi-geo-alt-fill"></i>
              <span class="location-text">
                {{
                  currentLocationType === 'current'
                    ? '目前位置'
                    : currentLocationType === 'home'
                      ? '家'
                      : '公司'
                }}
              </span>
              <i class="bi bi-chevron-down"></i>
            </button>

            <!-- Location Menu -->
            <div v-if="showLocationMenu" class="location-menu">
              <button
                class="location-option"
                :class="{ active: currentLocationType === 'current' }"
                @click="switchLocation('current')"
              >
                <i class="bi bi-geo-alt-fill"></i>
                <span>目前位置</span>
              </button>
              <button
                class="location-option"
                :class="{ active: currentLocationType === 'home', disabled: !savedLocations.home }"
                :disabled="!savedLocations.home"
                @click="switchLocation('home')"
              >
                <i class="bi bi-house-fill"></i>
                <span>家</span>
                <span v-if="!savedLocations.home" class="not-set">(未設定)</span>
              </button>
              <button
                class="location-option"
                :class="{ active: currentLocationType === 'work', disabled: !savedLocations.work }"
                :disabled="!savedLocations.work"
                @click="switchLocation('work')"
              >
                <i class="bi bi-briefcase-fill"></i>
                <span>公司</span>
                <span v-if="!savedLocations.work" class="not-set">(未設定)</span>
              </button>
            </div>
          </div>

          <FilterTabs
            :items="products"
            :filters="filters"
            v-model:sortedItems="displayedProducts"
          />
        </div>
      </section>

      <!-- Product Grid Section -->
      <section class="products-section">
        <div class="products-container">
          <!-- Loading Skeleton -->
          <div v-if="loading" class="products-grid">
            <div v-for="i in 8" :key="`skeleton-${i}`" class="skeleton-product-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
              </div>
            </div>
          </div>

          <!-- Actual Product Cards with Animation -->
          <TransitionGroup v-else name="product-list" tag="div" class="products-grid">
            <ProductCard
              v-for="product in displayedProducts"
              :key="product.item_id"
              :product="product"
              @click="goToProductDetail(product.item_id)"
              @contact-seller="handleContactSeller"
            />
          </TransitionGroup>

          <!-- Empty State -->
          <div
            v-if="!loading && displayedProducts && displayedProducts.length === 0"
            class="empty-state"
          >
            <i class="bi bi-inbox"></i>
            <p>找不到符合條件的物品</p>
          </div>

          <!-- Load More Button -->
          <div
            v-if="!loading && hasMore && displayedProducts && displayedProducts.length > 0"
            class="load-more-section"
          >
            <button class="load-more-btn" @click="loadMore">載入更多</button>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppHeader from '../components/AppHeader.vue'
  import AppFooter from '../components/AppFooter.vue'
  import Breadcrumb from '../components/Breadcrumb.vue'
  import SearchBar from '../components/SearchBar.vue'
  import ProductCard from '../components/ProductCard.vue'
  import CategoryTabs from '../components/CategoryTabs.vue'
  import FilterTabs from '../components/FilterTabs.vue'

  import { useCategoriesStore } from '@/stores/categories.js'
  import { searchItems } from '@/api/itemsAPI'
  import { sortByRecommendation } from '@/utils/sortFunctions.js'
  import { getMyLocations } from '@/api/locationAPI'

  const route = useRoute()
  const router = useRouter()

  const categoriesStore = useCategoriesStore()

  if (!categoriesStore.isLoaded) {
    categoriesStore.fetchCategories().catch((error) => {
      console.error('Failed to fetch categories in ExploreSection:', error)
    })
  }

  const categories = computed(() => categoriesStore.categories)

  // State
  const userPoints = ref(0)
  const selectedCategory = ref(0) // 當前選中的主分類
  const selectedSubCategory = ref(0) // 當前選中的子分類
  const searchQuery = ref('')
  const hasMore = ref(true)
  const loading = ref(false)

  // Location switching
  const currentLocationType = ref('current') // 'current', 'home', 'work'
  const savedLocations = ref({
    home: null,
    work: null,
  })
  const showLocationMenu = ref(false)
  const userLocation = ref(null)

  // Filters - 使用配置驅動的方式
  const filters = [
    {
      id: 1,
      label: '上架時間',
      sortKey: 'created_at',
      defaultOrder: 'desc', // 預設：晚到早
      ascText: '晚到早',
      descText: '早到晚',
    },
    {
      id: 2,
      label: '距離',
      sortKey: 'distance_km',
      defaultOrder: 'asc', // 預設：近到遠
      ascText: '近到遠',
      descText: '遠到近',
    },
    {
      id: 3,
      label: '價格',
      sortKey: 'price',
      defaultOrder: 'asc', // 預設：低到高
      ascText: '低到高',
      descText: '高到低',
    },
    {
      id: 4,
      label: '為你推薦',
      sortFn: sortByRecommendation,
      sortable: false, // 不可切換排序方向
    },
  ]

  // Products data
  const products = ref([])
  const displayedProducts = ref([])

  // Computed

  // 動態計算 category tabs 顯示的內容
  const tabsData = computed(() => {
    const subCategoryId = route.query.subCategory
    const categoryId = route.query.category

    // 場景 1: 有 subCategory - 從 subCategory 反查主分類，顯示該主分類的所有子分類
    if (subCategoryId) {
      const subCat = categoriesStore.getSubCategoryById(Number(subCategoryId))
      if (subCat?.mainCategory) {
        const subCategories = categoriesStore.getSubCategoriesByMainId(subCat.mainCategory.id)
        return [{ id: 0, name: '全部' }, ...subCategories]
      }
    }

    // 場景 2: 有 category（但沒有 subCategory）- 顯示該主分類的所有子分類
    if (categoryId) {
      const subCategories = categoriesStore.getSubCategoriesByMainId(Number(categoryId))
      return [{ id: 0, name: '全部' }, ...subCategories]
    }

    // 場景 3: 都沒有 - 顯示所有主分類
    return [{ id: 0, name: '全部' }, ...categories.value]
  })

  // 當前選中的 tab ID
  const currentTabValue = computed(() => {
    // 如果有 subCategory，返回 selectedSubCategory
    if (route.query.subCategory) {
      return selectedSubCategory.value
    }
    // 如果有 category，返回 0（因為還沒選子分類）
    if (route.query.category) {
      return 0
    }
    // 否則返回 selectedCategory（主分類層級）
    return selectedCategory.value
  })

  // 主分類名稱（用於麵包屑）
  const mainCategoryName = computed(() => {
    if (selectedCategory.value === 0) return ''
    const mainCategory = categories.value.find((c) => c.id === selectedCategory.value)
    return mainCategory?.name || ''
  })

  // 子分類名稱（用於麵包屑）
  const subCategoryName = computed(() => {
    if (selectedSubCategory.value === 0) return ''
    const subCat = categoriesStore.getSubCategoryById(selectedSubCategory.value)
    return subCat?.name || ''
  })

  // 麵包屑項目
  const breadcrumbItems = computed(() => {
    const items = []

    // 第一層：物品列表
    if (selectedCategory.value !== 0 || selectedSubCategory.value !== 0) {
      items.push({ label: '物品列表', to: { name: 'ItemList' } })
    } else {
      items.push({ label: '物品列表' })
      return items
    }

    // 第二層：主分類
    if (selectedCategory.value !== 0) {
      if (selectedSubCategory.value !== 0) {
        items.push({
          label: mainCategoryName.value,
          to: { name: 'ItemList', query: { category: selectedCategory.value } },
        })
      } else {
        items.push({ label: mainCategoryName.value })
        return items
      }
    }

    // 第三層：子分類
    if (selectedSubCategory.value !== 0) {
      items.push({ label: subCategoryName.value })
    }

    return items
  })

  const pageTitle = computed(() => {
    const categoryId = route.query.category
    const subCategoryId = route.query.subCategory

    let categoryLabel = '全部物品'

    if (subCategoryId) {
      // 有子分類：顯示子分類名稱
      const subCat = categoriesStore.getSubCategoryById(Number(subCategoryId))
      categoryLabel = subCat?.name || '全部物品'
    } else if (categoryId) {
      // 只有主分類：顯示主分類名稱
      const mainCategory = categories.value.find((c) => c.id === Number(categoryId))
      categoryLabel = mainCategory?.name || '全部物品'
    }

    if (searchQuery.value) {
      if (!categoryId && !subCategoryId) {
        return `有關 "${searchQuery.value}" 的物品`
      }
      return `${categoryLabel} 中有關 "${searchQuery.value}" 的物品`
    }

    return categoryLabel
  })

  // Methods
  const handleSearch = (data) => {
    searchQuery.value = data.query

    // Update URL query params
    const query = { ...route.query }

    if (data.query) {
      query.search = data.query
    } else {
      delete query.search
    }

    if (data.distance) {
      query.distance = data.distance
    } else {
      delete query.distance
    }

    router.push({ query })

    console.log('Search:', data)

    // Scroll to top after search
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const searchSection = document.querySelector('.search-section-container')
    const mapToggleBtn = document.querySelector('.map-toggle-btn')
    if (searchSection) {
      if (window.scrollY > 300) {
        searchSection.classList.add('scrolled')
        mapToggleBtn.classList.add('scrolled')
      } else {
        searchSection.classList.remove('scrolled')
        mapToggleBtn.classList.remove('scrolled')
      }
    }
  }

  const handleCategoryChange = (tabId) => {
    const query = { ...route.query }

    // 判斷當前是在主分類層級還是子分類層級
    const isInSubCategoryLevel = route.query.category || route.query.subCategory

    if (!isInSubCategoryLevel) {
      // 當前在主分類層級：選擇的是主分類
      if (tabId === 0) {
        delete query.category
      } else {
        query.category = tabId
      }
      delete query.subCategory // 確保清除子分類
    } else {
      // 當前在子分類層級：選擇的是子分類
      if (tabId === 0) {
        // 點擊「全部」- 返回該主分類的「全部」產品
        delete query.subCategory

        // 需要保留 category 參數，如果沒有則需要從 subCategory 反查
        if (!query.category && route.query.subCategory) {
          const subCat = categoriesStore.getSubCategoryById(Number(route.query.subCategory))
          if (subCat?.mainCategory) {
            query.category = subCat.mainCategory.id
          }
        }
      } else {
        // 選擇子分類 - 只保留 subCategory，不需要 category
        query.subCategory = tabId
        delete query.category
      }
    }

    router.push({ query })
  }

  const goToProductDetail = (productId) => {
    router.push({ name: 'ItemDetail', params: { id: productId } })
  }

  const handleContactSeller = (productId) => {
    console.log('Contact seller for product:', productId)
  }

  const toggleToMapView = () => {
    // Build query params from current route
    const query = {}

    if (route.query.search) {
      query.search = route.query.search
    }
    if (route.query.distance) {
      query.distance = route.query.distance
    }
    if (route.query.category) {
      query.category = route.query.category
    }
    if (route.query.subCategory) {
      query.subCategory = route.query.subCategory
    }

    router.push({ name: 'MapSearch', query })
  }

  const loadMore = () => {
    console.log('Load more products')
    // Implement pagination logic
    hasMore.value = false
  }

  // Parse PostGIS WKB format to lat/lng
  function parseWKBPoint(wkbHex) {
    try {
      const coordsStartChar = 18
      const lonHex = wkbHex.substring(coordsStartChar, coordsStartChar + 16)
      const latHex = wkbHex.substring(coordsStartChar + 16, coordsStartChar + 32)

      if (!lonHex || !latHex || lonHex.length !== 16 || latHex.length !== 16) {
        return { latitude: null, longitude: null }
      }

      const lonMatch = lonHex.match(/.{2}/g)
      const latMatch = latHex.match(/.{2}/g)

      if (!lonMatch || !latMatch) {
        return { latitude: null, longitude: null }
      }

      const lonBytes = new Uint8Array(lonMatch.map((byte) => parseInt(byte, 16)))
      const latBytes = new Uint8Array(latMatch.map((byte) => parseInt(byte, 16)))

      const longitude = new DataView(lonBytes.buffer).getFloat64(0, true)
      const latitude = new DataView(latBytes.buffer).getFloat64(0, true)

      return { latitude, longitude }
    } catch (error) {
      console.error('[ItemListPage] Failed to parse WKB:', error)
      return { latitude: null, longitude: null }
    }
  }

  // Fetch saved locations (home and work)
  async function fetchSavedLocations() {
    try {
      const locations = await getMyLocations()

      if (locations && locations.length > 0) {
        locations.forEach((location) => {
          let latitude = null
          let longitude = null

          if (location.coordinates) {
            const coords = parseWKBPoint(location.coordinates)
            latitude = coords.latitude
            longitude = coords.longitude
          }

          if (latitude !== null && longitude !== null) {
            const locationData = {
              ...location,
              latitude,
              longitude,
            }

            if (location.type === '家') {
              savedLocations.value.home = locationData
            } else if (location.type === '公司') {
              savedLocations.value.work = locationData
            }
          }
        })
      }
    } catch (error) {
      console.error('[ItemListPage] Failed to fetch saved locations:', error)
    }
  }

  // Fetch current location
  async function fetchCurrentLocation() {
    try {
      if (!navigator.geolocation) {
        console.error('[ItemListPage] Geolocation is not supported')
        return false
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            userLocation.value = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              type: 'current',
            }
            resolve(true)
          },
          (error) => {
            console.error('[ItemListPage] Failed to get current location:', error)
            userLocation.value = null
            resolve(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        )
      })
    } catch (error) {
      console.error('[ItemListPage] Failed to fetch current location:', error)
      return false
    }
  }

  // Switch location
  async function switchLocation(locationType) {
    currentLocationType.value = locationType
    showLocationMenu.value = false

    switch (locationType) {
      case 'current':
        await fetchCurrentLocation()
        break
      case 'home':
        if (savedLocations.value.home) {
          userLocation.value = savedLocations.value.home
        }
        break
      case 'work':
        if (savedLocations.value.work) {
          userLocation.value = savedLocations.value.work
        }
        break
    }

    // Reload products with new location
    if (userLocation.value) {
      await loadProductsWithLocation()
    }
  }

  // Toggle location menu
  function toggleLocationMenu() {
    showLocationMenu.value = !showLocationMenu.value
  }

  // Close location menu when clicking outside
  function handleClickOutside(event) {
    const locationSwitcher = document.querySelector('.location-switcher')
    if (locationSwitcher && !locationSwitcher.contains(event.target)) {
      showLocationMenu.value = false
    }
  }

  // Load products with location
  async function loadProductsWithLocation() {
    const categoryId = route.query.category
    const subCategoryId = route.query.subCategory
    const distance = route.query.distance
    const search = route.query.search

    const mainCategoryId = subCategoryId ? null : categoryId

    const params = {
      main_category_id: mainCategoryId,
      sub_category_id: subCategoryId,
      keyword: search || null,
      distance_range_km: distance ? Number(distance) : null,
    }

    if (userLocation.value) {
      params.user_latitude = userLocation.value.latitude
      params.user_longitude = userLocation.value.longitude
    }

    await loadProducts(params)
  }

  // Load products function
  const loadProducts = async (filters) => {
    loading.value = true
    try {
      // Add user location if available
      const params = { ...filters }
      if (userLocation.value && !params.user_latitude && !params.user_longitude) {
        params.user_latitude = userLocation.value.latitude
        params.user_longitude = userLocation.value.longitude
      }

      const data = await searchItems(params)
      products.value = data || []
      displayedProducts.value = data || []
      console.log('Products loaded:', data)
    } catch (error) {
      console.error('Failed to load products:', error)
      products.value = []
      displayedProducts.value = []
    } finally {
      loading.value = false
    }
  }

  // 同步更新 selectedCategory 和 selectedSubCategory (不觸發搜索)
  watch(
    () => [route.query.category, route.query.subCategory, categories.value.length],
    ([newCategoryId, newSubCategoryId, categoriesLength]) => {
      // 更新子分類選擇
      if (newSubCategoryId) {
        selectedSubCategory.value = Number(newSubCategoryId)
        // 從子分類反查主分類
        if (categoriesLength > 0) {
          const subCat = categoriesStore.getSubCategoryById(Number(newSubCategoryId))
          selectedCategory.value = subCat?.mainCategory?.id || 0
        }
      } else {
        selectedSubCategory.value = 0

        // 更新主分類選擇
        if (!newCategoryId) {
          selectedCategory.value = 0
        } else {
          const categoryId = Number(newCategoryId)
          // 如果 categories 還沒加載完成，直接使用 ID
          if (categoriesLength === 0) {
            selectedCategory.value = categoryId
          } else {
            const category = categories.value.find((c) => c.id === categoryId)
            selectedCategory.value = category ? category.id : 0
          }
        }
      }
    }
  )

  // Initialize location on mount
  onMounted(async () => {
    await fetchSavedLocations()
    await fetchCurrentLocation()
    document.addEventListener('click', handleClickOutside)
    // Add scroll listener
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', handleScroll)
  })

  // 監聽 URL query 參數變化來觸發搜索
  watch(
    () => [route.query.category, route.query.subCategory, route.query.distance, route.query.search],
    ([categoryId, subCategoryId, distance, search]) => {
      // 如果同時有 category 和 subCategory，自動移除 category
      if (categoryId && subCategoryId) {
        const query = { ...route.query }
        delete query.category
        router.replace({ query })
        return // 等待 URL 更新後重新觸發
      }

      // 如果有 subCategory，不使用 category (subCategory 優先)
      const mainCategoryId = subCategoryId ? null : categoryId

      loadProducts({
        main_category_id: mainCategoryId,
        sub_category_id: subCategoryId,
        keyword: search || null,
        distance_range_km: distance ? Number(distance) : null,
      })
    },
    { immediate: true }
  )

  // 同步 searchQuery 與 URL
  watch(
    () => route.query.search,
    (newSearch) => {
      searchQuery.value = newSearch || ''
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .item-list-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f9f9f9;
  }

  .main-content {
    flex: 1;
    padding-bottom: 60px;
  }

  // Breadcrumb Section
  .breadcrumb-section {
    padding: 15px 0 10px;
    background-color: #f9f9f9;
  }

  // Search Section
  .search-section {
    padding: 10px 0;
    position: sticky;
    top: 60px;
    z-index: 100;
  }

  .search-section-container {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px;
    transition: all 0.3s ease-in-out;
  }

  .search-section-container.scrolled {
    background: transparent;
    max-width: 800px;

    .map-toggle-btn {
      background-color: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
    }

    .search-bar-wrapper {
      background-color: rgba(255, 255, 255, 0);
      backdrop-filter: blur(10px);
    }
  }

  // Map Toggle Button (Square style next to SearchBar)
  .map-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    width: 128px;
    gap: 10px;
    padding: 0 15px;
    background: white;
    border: 1px solid #d5d5d5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;

    &::after {
      content: '顯示地圖';
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1e1e1e;
    }

    i {
      font-size: 22px;
      color: #6fb8a5;
    }

    &:hover {
      background: #f8f9fa;
      border-color: #6fb8a5;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  .breadcrumb-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #555;
    flex-wrap: wrap;
  }

  .breadcrumb-link {
    color: $primary;
    text-decoration: none;
    transition: all 0.3s;

    &:hover {
      color: #5fa795;
      text-decoration: underline;
    }
  }

  .breadcrumb-separator {
    color: #999;
  }

  .breadcrumb-current {
    color: #1e1e1e;
    font-weight: 500;
  }

  // Filter Header Section
  .filter-header-section {
    padding: 30px 0 20px;
    background-color: #f9f9f9;
  }

  .filter-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px;

    :deep(.category-tabs) {
      margin-bottom: 20px;
    }
  }

  .page-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  // Filter Section
  .filter-section {
    padding: 20px 0;
    background-color: #f9f9f9;
  }

  .filter-section-container {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px;
  }

  // Products Section
  .products-section {
    padding: 20px 0 40px;
  }

  .products-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 40px;
  }

  // Product List Animation
  .product-list-move,
  .product-list-enter-active,
  .product-list-leave-active {
    transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
  }

  .product-list-enter-from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }

  .product-list-leave-to {
    opacity: 0;
    transform: scale(0.8) translateY(-30px);
  }

  .product-list-leave-active {
    position: absolute;
  }

  // Skeleton Product Card
  .skeleton-product-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .skeleton-image {
    width: 100%;
    height: 280px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-title {
    width: 80%;
    height: 20px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-text {
    width: 100%;
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: shimmer 1.5s ease-in-out infinite;

    &.short {
      width: 60%;
    }
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
    text-align: center;
    padding: 80px 20px;
    color: #999;

    i {
      font-size: 64px;
      margin-bottom: 20px;
      display: block;
    }

    p {
      font-size: 18px;
      font-family: 'Noto Sans TC', sans-serif;
    }
  }

  // Load More
  .load-more-section {
    text-align: center;
    padding: 20px 0;
  }

  .load-more-btn {
    background-color: white;
    border: 1px solid $primary;
    border-radius: 5px;
    padding: 12px 40px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 16px;
    color: $primary;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: $primary;
      color: white;
    }
  }

  // Location Switcher (Inline style for filter section)
  .location-switcher {
    position: relative;
    z-index: 99;

    .location-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 32px;
      padding: 0 16px;
      background: white;
      border: none;
      border-radius: 5px;
      box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;

      i {
        font-size: 16px;
        color: #6fb8a5;

        &.bi-chevron-down {
          display: inline-block;
          font-size: 12px;
          color: #666;
          margin-left: 2px;
          transition: transform 0.2s;
        }
      }

      .location-text {
        display: inline-block;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #1e1e1e;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.3);
      }

      &:active {
        transform: translateY(-1px);
      }
    }

    .location-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      min-width: 180px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      animation: slideDown 0.2s ease-out;

      .location-option {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: white;
        border: none;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;

        i {
          font-size: 16px;
          color: #666;
          width: 20px;
        }

        span {
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #1e1e1e;

          &.not-set {
            font-size: 12px;
            color: #999;
            margin-left: auto;
          }
        }

        &:last-child {
          border-bottom: none;
        }

        &:hover:not(:disabled) {
          background: #f8f9fa;
        }

        &.active {
          background: rgba(111, 184, 165, 0.1);

          i {
            color: #6fb8a5;
          }

          span {
            color: #6fb8a5;
            font-weight: 600;
          }
        }

        &.disabled,
        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;

          &:hover {
            background: white;
          }
        }
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  // Responsive Design
  @media (max-width: 1399.98px) {
    .products-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
  }

  @media (max-width: 991.98px) {
    .breadcrumb-section {
      padding: 12px 0 8px;
    }

    .search-section {
      padding: 8px 0 18px;
    }

    .search-section-container {
      padding: 0 15px;
      gap: 10px;
    }

    .map-toggle-btn {
      width: 128px;
      height: 50px;

      i {
        font-size: 20px;
      }
    }

    .breadcrumb-container {
      padding: 0 15px;
    }

    .breadcrumb {
      font-size: 13px;
      gap: 6px;
    }

    .filter-header-section {
      padding: 25px 0 18px;
    }

    .filter-container {
      padding: 0 15px;

      :deep(.category-tabs) {
        margin-bottom: 18px;
      }
    }

    .page-title {
      font-size: 24px;
    }

    .filter-section {
      padding: 18px 0;
    }

    .filter-section-container {
      padding: 0 15px;
      gap: 12px;
    }

    .products-section {
      padding: 18px 0 35px;
    }

    .products-container {
      padding: 0 15px;
    }

    .products-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 35px;
    }

    .empty-state {
      padding: 60px 20px;

      i {
        font-size: 56px;
      }

      p {
        font-size: 16px;
      }
    }

    .load-more-btn {
      padding: 10px 35px;
      font-size: 15px;
    }
  }

  @media (max-width: 575.98px) {
    .search-section-container {
      flex-direction: column;
      padding: 0 10px;
      gap: 10px;
    }

    .map-toggle-btn {
      width: 100%;
      height: 44px;
      border-radius: 8px;
      gap: 8px;
      order: 1; // Place after SearchBar

      &::after {
        content: '顯示地圖';
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #1e1e1e;
      }

      i {
        font-size: 18px;
      }
    }

    .map-toggle-btn.scrolled {
      width: 25%;
      min-width: 88px;
      background-color: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
    }

    .filter-section-container {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 0 10px;
    }

    .location-switcher {
      .location-btn {
        width: 100%;
        justify-content: flex-start;
        height: 36px;
        padding: 0 14px;
      }

      .location-menu {
        width: 100%;
        min-width: unset;
      }
    }

    .breadcrumb-section {
      padding: 10px 0 6px;
    }

    .search-section {
      padding: 6px 0 15px;
    }

    .breadcrumb-container {
      padding: 0 10px;
    }

    .breadcrumb {
      font-size: 12px;
      gap: 5px;
    }

    .filter-header-section {
      padding: 20px 0 15px;
    }

    .filter-container {
      padding: 0 10px;

      :deep(.category-tabs) {
        margin-bottom: 15px;
      }
    }

    .page-title {
      font-size: 20px;
    }

    .filter-section {
      padding: 15px 0;
    }

    .products-section {
      padding: 15px 0 30px;
    }

    .products-container {
      padding: 0 10px;
    }

    .products-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 30px;
    }

    .empty-state {
      padding: 40px 15px;

      i {
        font-size: 48px;
      }

      p {
        font-size: 14px;
      }
    }

    .load-more-btn {
      padding: 10px 30px;
      font-size: 14px;
    }
  }

  // Lock minimum width at 360px for phone
  @media (max-width: 360px) {
    .filter-container,
    .products-container {
      min-width: 360px;
      padding: 0 10px;
    }
  }
</style>
