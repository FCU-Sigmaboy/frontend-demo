import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllCategories } from '@/api/get_categoriesAPI.js'

export const useCategoriesStore = defineStore('categories', () => {
  // 狀態
  const categories = ref([])
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref(null)

  // Getters
  const mainCategories = computed(() => {
    return categories.value.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color
    }))
  })

  // 根據主分類 ID 取得子分類
  const getSubCategoriesByMainId = computed(() => {
    return (mainCategoryId) => {
      const mainCat = categories.value.find(cat => cat.id === mainCategoryId)
      return mainCat?.sub_categories || []
    }
  })

  // 根據子分類 ID 取得完整資訊
  const getSubCategoryById = computed(() => {
    return (subCategoryId) => {
      for (const mainCat of categories.value) {
        const subCat = mainCat.sub_categories?.find(sub => sub.id === subCategoryId)
        if (subCat) {
          return {
            ...subCat,
            mainCategory: {
              id: mainCat.id,
              name: mainCat.name,
              icon: mainCat.icon,
              color: mainCat.color
            }
          }
        }
      }
      return null
    }
  })

  // Actions
  async function fetchCategories(force = false) {
    // 如果已經載入過且不是強制重新載入，直接返回
    if (isLoaded.value && !force) {
      return categories.value
    }

    isLoading.value = true
    error.value = null

    try {
      const data = await getAllCategories()
      categories.value = data
      isLoaded.value = true
      return data
    } catch (err) {
      error.value = err.message
      console.error('載入分類失敗:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 清除快取（如果需要重新載入）
  function clearCache() {
    categories.value = []
    isLoaded.value = false
    error.value = null
  }

  return {
    // 狀態
    categories,
    isLoading,
    isLoaded,
    error,
    // Getters
    mainCategories,
    getSubCategoriesByMainId,
    getSubCategoryById,
    // Actions
    fetchCategories,
    clearCache
  }
})
