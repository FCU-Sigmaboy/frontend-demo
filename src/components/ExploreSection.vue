<template>
  <section class="explore-section">
    <div class="section-container">
      <h2 class="section-title">探索</h2>

      <div class="categories-wrapper">
        <!-- Left Arrow -->
        <button
          v-if="showLeftArrow && !loading"
          class="nav-arrow nav-arrow-left"
          @click="scrollLeft"
          aria-label="Previous"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <div
          ref="categoriesContainer"
          class="categories-container"
          :class="{ 'is-dragging': isDragging }"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
          @touchstart="startDrag"
          @touchmove="onDrag"
          @touchend="endDrag"
          @scroll="handleScroll"
        >
          <!-- Loading State with Skeleton Cards -->
          <template v-if="loading">
            <div v-for="i in 8" :key="`skeleton-${i}`" class="skeleton-card">
              <div class="skeleton-icon">
                <BSpinner variant="primary" type="grow" small />
              </div>
              <div class="skeleton-text"></div>
            </div>
          </template>

          <!-- Actual Category Cards -->
          <CategoryCard
            v-else
            v-for="category in categories"
            :key="category.id"
            :category="category"
            @click="handleCategoryClick"
          />
        </div>

        <!-- Right Arrow -->
        <button
          v-if="showRightArrow && !loading"
          class="nav-arrow nav-arrow-right"
          @click="scrollRight"
          aria-label="Next"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { BSpinner } from 'bootstrap-vue-next';
import CategoryCard from './CategoryCard.vue';
import { useCategoriesStore } from '@/stores/categories.js'

const emit = defineEmits(['category-click']);
const categoriesStore = useCategoriesStore()

if (!categoriesStore.isLoaded) {
  categoriesStore.fetchCategories().catch((error) => {
    console.error('Failed to fetch categories in ExploreSection:', error);
  });
}

// Categories data
const categories = computed(() => categoriesStore.categories);
const loading = computed(() => categoriesStore.isLoading);
console.log(categoriesStore.categories); 


// Drag/swipe state
const categoriesContainer = ref(null);
const isDragging = ref(false);
const isMouseDown = ref(false);
const startX = ref(0);
const scrollLeftPos = ref(0);

// Arrow visibility
const showLeftArrow = ref(false);
const showRightArrow = ref(true);

const startDrag = (e) => {
  isMouseDown.value = true;
  const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
  startX.value = pageX - categoriesContainer.value.offsetLeft;
  scrollLeftPos.value = categoriesContainer.value.scrollLeft;
};

const onDrag = (e) => {
  if (!isMouseDown.value) return;

  // Only set isDragging to true when actually moving
  isDragging.value = true;
  e.preventDefault();

  const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
  const x = pageX - categoriesContainer.value.offsetLeft;
  const walk = (x - startX.value) * 2;
  categoriesContainer.value.scrollLeft = scrollLeftPos.value - walk;
};

const endDrag = () => {
  isMouseDown.value = false;
  // Reset isDragging after a short delay to allow click event to check it
  setTimeout(() => {
    isDragging.value = false;
  }, 10);
};

const handleCategoryClick = (category) => {
  if (!isDragging.value) {
    emit('category-click', category);
  }
};

// Arrow navigation
const scrollLeft = () => {
  const container = categoriesContainer.value;
  const scrollAmount = container.offsetWidth * 0.8;
  container.scrollBy({
    left: -scrollAmount,
    behavior: 'smooth'
  });
};

const scrollRight = () => {
  const container = categoriesContainer.value;
  const scrollAmount = container.offsetWidth * 0.8;
  container.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  });
};

const handleScroll = () => {
  const container = categoriesContainer.value;
  if (!container) return;

  // Show/hide left arrow
  showLeftArrow.value = container.scrollLeft > 10;

  // Show/hide right arrow
  const maxScroll = container.scrollWidth - container.clientWidth;
  showRightArrow.value = container.scrollLeft < maxScroll - 10;
};

// Update arrow visibility on mount and resize
onMounted(() => {
  if (categoriesContainer.value) {
    handleScroll();
    window.addEventListener('resize', handleScroll);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleScroll);
});
</script>

<style scoped lang="scss">
.explore-section {
  width: 100%;
  background-color: #f2efeb;
  padding: 50px 0;
}

.section-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: black;
  margin-bottom: 30px;
  padding-left: 0;
}

.categories-wrapper {
  position: relative;
  min-height: 180px;
}

.skeleton-card {
  flex-shrink: 0;
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .skeleton-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .skeleton-text {
    width: 80%;
    height: 16px;
    background: #f0f0f0;
    border-radius: 4px;
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.categories-container {
  display: flex;
  gap: 32px;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  &.is-dragging {
    cursor: grabbing;
    scroll-behavior: auto;

    :deep(.category-card) {
      pointer-events: none;
    }
  }

  :deep(.category-card) {
    flex-shrink: 0;
    width: 140px;
  }
}

// Navigation Arrows
.nav-arrow {
  position: absolute;
  top: calc(50% - 15px);
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;

  i {
    font-size: 24px;
    color: #1e1e1e;
  }

  &:hover {
    background: #f5f5f5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-50%) scale(1.05);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &.nav-arrow-left {
    left: -50px;
  }

  &.nav-arrow-right {
    right: -50px;
  }
}

@media (max-width: 1199.98px) {
  .skeleton-card {
    width: 130px;
  }

  .categories-container {
    gap: 14px;

    :deep(.category-card) {
      width: 130px;
    }
  }

  .nav-arrow {
    width: 44px;
    height: 44px;

    i {
      font-size: 22px;
    }

    &.nav-arrow-left {
      left: -18px;
    }

    &.nav-arrow-right {
      right: -18px;
    }
  }
}

@media (max-width: 991.98px) {
  .explore-section {
    padding: 40px 0;
  }

  .section-container {
    padding: 0 15px;
  }

  .section-title {
    font-size: 22px;
    margin-bottom: 25px;
  }

  .skeleton-card {
    width: 120px;
  }

  .categories-container {
    gap: 12px;

    :deep(.category-card) {
      width: 120px;
    }
  }

  .nav-arrow {
    width: 40px;
    height: 40px;

    i {
      font-size: 20px;
    }

    &.nav-arrow-left {
      left: -15px;
    }

    &.nav-arrow-right {
      right: -15px;
    }
  }
}

@media (max-width: 767.98px) {
  .nav-arrow {
    display: none;
  }
}

@media (max-width: 575.98px) {
  .explore-section {
    padding: 30px 0;
  }

  .section-container {
    padding: 0 10px;
  }

  .section-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .skeleton-card {
    width: 110px;
  }

  .categories-container {
    gap: 10px;
    cursor: grab;

    &.is-dragging {
      cursor: grabbing;
    }

    :deep(.category-card) {
      width: 110px;
    }
  }
}
</style>
