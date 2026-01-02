<template>
  <div class="hero-banner">
    <div class="banner-content">
      <transition name="fade" mode="out-in">
        <img 
          :key="currentIndex" 
          :src="currentBanner.url" 
          :alt="`Banner ${currentIndex + 1}`"
          @click="()=> router.push({name: 'ItemList', query: { subCategory: currentBanner.id }})"
          class="banner-image"
        />
      </transition>
      
      <!-- 導航點 -->
      <div class="carousel-dots">
        <button 
          v-for="(banner, index) in banners" 
          :key="index"
          :class="['dot', { active: index === currentIndex }]"
          @click="goToSlide(index)"
          :aria-label="`跳轉至第 ${index + 1} 張圖片`"
        ></button>
      </div>

      <!-- 左右箭頭 -->
      <button class="carousel-arrow prev" @click="prevSlide" aria-label="上一張">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button class="carousel-arrow next" @click="nextSlide" aria-label="下一張">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router';

const router = useRouter();

// 導入 banner 圖片
const banners = [
  {url: new URL('@/assets/banners/1.webp', import.meta.url).href, id: 36},
  {url: new URL('@/assets/banners/2.webp', import.meta.url).href, id: 13},
  {url: new URL('@/assets/banners/3.webp', import.meta.url).href, id: 42}
]

const currentIndex = ref(0)
let intervalId = null

const currentBanner = computed(() => banners[currentIndex.value])

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % banners.length
  resetAutoPlay()
}

const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + banners.length) % banners.length
  resetAutoPlay()
}

const goToSlide = (index) => {
  currentIndex.value = index
  resetAutoPlay()
}

const startAutoPlay = () => {
  intervalId = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % banners.length
  }, 5000) // 每 5 秒切換
}

const stopAutoPlay = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const resetAutoPlay = () => {
  stopAutoPlay()
  startAutoPlay()
}

onMounted(() => {
  startAutoPlay()
})

onBeforeUnmount(() => {
  stopAutoPlay()
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.hero-banner {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.banner-content {
  position: relative;
  width: 100%;
  height: fit-content;
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.banner-image {
  width: 100%;
  aspect-ratio: 2/1;
  cursor: pointer;
  display: block;
}

// 淡入淡出動畫
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 導航點
.carousel-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 2;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: scale(1.1);
  }

  &.active {
    background: white;
    width: 32px;
    border-radius: 6px;
  }
}

// 左右箭頭
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: all 0.3s ease;
  color: #333;

  &:hover {
    background: white;
    transform: translateY(-50%) scale(1.1);
  }

  &.prev {
    left: 20px;
  }

  &.next {
    right: 20px;
  }
}

@media (max-width: 1600px) {
  .hero-banner {
    padding: 0 15px;
  }
}

@media (max-width: 575.98px) {
  .hero-banner {
    padding: 0 10px;
  }

  .banner-content {
    border-radius: 10px;
  }

  .carousel-arrow {
    width: 36px;
    height: 36px;

    &.prev {
      left: 10px;
    }

    &.next {
      right: 10px;
    }

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .carousel-dots {
    bottom: 15px;
    gap: 8px;
  }

  .dot {
    width: 10px;
    height: 10px;

    &.active {
      width: 24px;
    }
  }
}

// Extra small phones (360px)
@media (max-width: 374px) {
  .hero-banner {
    padding: 0 8px;
  }

  .carousel-arrow {
    width: 32px;
    height: 32px;

    &.prev {
      left: 4px;
    }

    &.next {
      right: 4px;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .carousel-dots {
    bottom: 12px;
    gap: 6px;
  }

  .dot {
    width: 8px;
    height: 8px;

    &.active {
      width: 20px;
    }
  }
}
</style>
