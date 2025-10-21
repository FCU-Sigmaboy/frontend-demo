<template>
  <div class="hero-banner">
    <div class="banner-content">
      <div class="decorative-element sparkle">✨</div>
      <div class="event-text">
        <h1 class="event-title">台中花草節</h1>
        <p class="event-subtitle">買之林環保市集</p>
        <p class="event-date">2025.10.10 - 10.17</p>
      </div>
      <div class="decorative-flowers">
        <!-- Floral decorative elements -->
      </div>
    </div>
  </div>
</template>

<script setup>
// No props or state needed for static banner
</script>

<style scoped lang="scss">
.hero-banner {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.banner-content {
  background: linear-gradient(135deg, #6fb8a5 0%, #5a9d8c 100%);
  border-radius: 5px;
  min-height: 400px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.decorative-element {
  position: absolute;
  font-size: 48px;

  &.sparkle {
    top: 15%;
    left: 15%;
    animation: sparkle 2s ease-in-out infinite;
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.event-text {
  text-align: center;
  z-index: 2;
  color: white;

  .event-title {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 64px;
    font-weight: 700;
    margin-bottom: 15px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    letter-spacing: 4px;
  }

  .event-subtitle {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 10px;
    letter-spacing: 2px;
  }

  .event-date {
    font-family: 'Inter', 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 300;
    opacity: 0.95;
    letter-spacing: 1px;
  }
}

.decorative-flowers {
  position: absolute;
  inset: 0;
  pointer-events: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  &::before {
    width: 300px;
    height: 300px;
    top: -150px;
    right: -100px;
  }

  &::after {
    width: 200px;
    height: 200px;
    bottom: -80px;
    left: -60px;
  }
}

@media (max-width: 1600px) {
  .hero-banner {
    padding: 0 15px;
  }

  .banner-content {
    min-height: 300px;
    padding: 30px;
  }

  .event-text {
    .event-title {
      font-size: 48px;
      letter-spacing: 2px;
    }

    .event-subtitle {
      font-size: 20px;
    }

    .event-date {
      font-size: 16px;
    }
  }
}

@media (max-width: 575.98px) {
  .hero-banner {
    padding: 0 10px;
  }

  .banner-content {
    min-height: 250px;
    padding: 20px;
    border-radius: 10px;
  }

  .event-text {
    .event-title {
      font-size: 36px;
      letter-spacing: 1px;
    }

    .event-subtitle {
      font-size: 16px;
    }

    .event-date {
      font-size: 14px;
    }
  }

  .decorative-element.sparkle {
    font-size: 32px;
    top: 10%;
    left: 10%;
  }
}

// Extra small phones (360px)
@media (max-width: 374px) {
  .hero-banner {
    padding: 0 8px;
  }

  .banner-content {
    min-height: 220px;
    padding: 15px;
  }

  .event-text {
    .event-title {
      font-size: 30px;
      letter-spacing: 0.5px;
    }

    .event-subtitle {
      font-size: 14px;
    }

    .event-date {
      font-size: 12px;
    }
  }

  .decorative-element.sparkle {
    font-size: 28px;
  }
}
</style>
