<template>
  <section class="explore-section">
    <div class="section-container">
      <h2 class="section-title">探索</h2>

      <div class="categories-wrapper">
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
        >
          <CategoryCard
            v-for="category in categories"
            :key="category.id"
            :category="category"
            @click="handleCategoryClick"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import CategoryCard from './CategoryCard.vue';

const emit = defineEmits(['category-click']);

// Categories data
const categories = [
  { id: 1, category_id: 1, name: '流行服飾', icon: 'bi bi-bag', image: 'https://placehold.co/150/f4a261/ffffff?text=流行服飾' },
  { id: 2, category_id: 2, name: '鞋包配件', icon: 'bi bi-handbag', image: 'https://placehold.co/150/e76f51/ffffff?text=鞋包配件' },
  { id: 3, category_id: 3, name: '美妝保養', icon: 'bi bi-flower1', image: 'https://placehold.co/150/f4c2c2/ffffff?text=美妝保養' },
  { id: 4, category_id: 4, name: '電子 3C', icon: 'bi bi-laptop', image: 'https://placehold.co/150/457b9d/ffffff?text=電子3C' },
  { id: 5, category_id: 5, name: '家電用品', icon: 'bi bi-tv', image: 'https://placehold.co/150/a8dadc/ffffff?text=家電用品' },
  { id: 6, category_id: 6, name: '家具家飾', icon: 'bi bi-house', image: 'https://placehold.co/150/8d99ae/ffffff?text=家具家飾' },
  { id: 7, category_id: 7, name: '親子婦幼', icon: 'bi bi-heart', image: 'https://placehold.co/150/ffc8dd/ffffff?text=親子婦幼' },
  { id: 8, category_id: 8, name: '生活娛樂', icon: 'bi bi-controller', image: 'https://placehold.co/150/cdb4db/ffffff?text=生活娛樂' },
  { id: 9, category_id: 9, name: '圖書影音', icon: 'bi bi-book', image: 'https://placehold.co/150/ffafcc/ffffff?text=圖書影音' }
];

// Drag/swipe state
const categoriesContainer = ref(null);
const isDragging = ref(false);
const isMouseDown = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);

const startDrag = (e) => {
  isMouseDown.value = true;
  const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
  startX.value = pageX - categoriesContainer.value.offsetLeft;
  scrollLeft.value = categoriesContainer.value.scrollLeft;
};

const onDrag = (e) => {
  if (!isMouseDown.value) return;

  // Only set isDragging to true when actually moving
  isDragging.value = true;
  e.preventDefault();

  const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
  const x = pageX - categoriesContainer.value.offsetLeft;
  const walk = (x - startX.value) * 2;
  categoriesContainer.value.scrollLeft = scrollLeft.value - walk;
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
  overflow: hidden;
}

.categories-container {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 30px;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

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
}

@media (max-width: 1199.98px) {
  .categories-container {
    gap: 15px;
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

  .categories-container {
    gap: 10px;
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

  .categories-container {
    gap: 5px;
    cursor: grab;

    &.is-dragging {
      cursor: grabbing;
    }
  }
}
</style>
