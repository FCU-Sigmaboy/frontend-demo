<template>
  <div class="map-category-filter">
    <label class="form-label">分類篩選</label>

    <!-- Main category -->
    <select
      v-model="selectedMainCategory"
      class="form-select mb-2"
      @change="handleMainCategoryChange"
      aria-label="選擇主要分類"
    >
      <option :value="null">全部分類</option>
      <option
        v-for="category in mainCategories"
        :key="category.id"
        :value="category.id"
      >
        {{ category.name }}
      </option>
    </select>

    <!-- Sub category (shown only when main category is selected) -->
    <select
      v-if="selectedMainCategory && subCategories.length > 0"
      v-model="selectedSubCategory"
      class="form-select"
      @change="handleSubCategoryChange"
      aria-label="選擇子分類"
    >
      <option :value="null">所有子分類</option>
      <option
        v-for="subCat in subCategories"
        :key="subCat.id"
        :value="subCat.id"
      >
        {{ subCat.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCategoriesStore } from '@/stores/categories'

// Props
const props = defineProps({
  mainCategoryId: {
    type: Number,
    default: null
  },
  subCategoryId: {
    type: Number,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:mainCategoryId', 'update:subCategoryId', 'change'])

// State
const categoriesStore = useCategoriesStore()
const selectedMainCategory = ref(props.mainCategoryId)
const selectedSubCategory = ref(props.subCategoryId)

// Computed
const mainCategories = computed(() => categoriesStore.mainCategories)

const subCategories = computed(() => {
  if (!selectedMainCategory.value) return []
  return categoriesStore.getSubCategoriesByMainId(selectedMainCategory.value)
})

// Handle main category change
function handleMainCategoryChange() {
  // Reset sub category when main category changes
  selectedSubCategory.value = null

  emit('update:mainCategoryId', selectedMainCategory.value)
  emit('update:subCategoryId', null)
  emit('change', {
    mainCategoryId: selectedMainCategory.value,
    subCategoryId: null
  })
}

// Handle sub category change
function handleSubCategoryChange() {
  emit('update:subCategoryId', selectedSubCategory.value)
  emit('change', {
    mainCategoryId: selectedMainCategory.value,
    subCategoryId: selectedSubCategory.value
  })
}

// Watch for external changes
watch(() => props.mainCategoryId, (newValue) => {
  selectedMainCategory.value = newValue
})

watch(() => props.subCategoryId, (newValue) => {
  selectedSubCategory.value = newValue
})

// Load categories on mount
categoriesStore.fetchCategories()
</script>

<style scoped lang="scss">
.map-category-filter {
  margin-bottom: 1.5rem;

  .form-label {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
}
</style>