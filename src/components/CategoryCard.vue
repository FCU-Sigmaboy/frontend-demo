<template>
  <div class="category-card" @click="handleClick">
    <div class="category-icon">
      <img v-if="category.image" :src="category.image" :alt="category.name" />
      <i v-else :class="category.icon" class="placeholder-icon"></i>
    </div>
    <p class="category-name">{{ category.name }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  category: {
    type: Object,
    required: true,
    default: () => ({
      id: 1,
      name: '分類',
      icon: 'bi bi-grid',
      image: null
    })
  }
});

const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click', props.category);
};
</script>

<style scoped lang="scss">
.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: transform 0.3s;
  padding: 10px;
  border-radius: 8px;

  &:hover {
    transform: translateY(-5px);
  }
}

.category-icon {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  overflow: hidden;
  background: #f5f5f5;
  transition: all 0.3s;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-icon {
    font-size: 64px;
    color: #6fb8a5;
  }
}

.category-name {
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1e1e1e;
  text-align: center;
  margin: 0;
}

@media (max-width: 991.98px) {
  .category-card {
    padding: 8px;
  }

  .category-icon {
    width: 120px;
    height: 120px;

    .placeholder-icon {
      font-size: 48px;
    }
  }

  .category-name {
    font-size: 14px;
  }
}

@media (max-width: 575.98px) {
  .category-card {
    padding: 5px;
  }

  .category-icon {
    width: 100px;
    height: 100px;

    .placeholder-icon {
      font-size: 40px;
    }
  }

  .category-name {
    font-size: 12px;
  }
}
</style>
