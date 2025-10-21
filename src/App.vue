<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans TC', 'Inter', 'Noto Sans JP', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f9f9f9;
  min-width: 360px;
}

#app {
  min-height: 100vh;
  min-width: 360px;
}

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;300;400;500;700;900&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Noto+Sans+JP:wght@100;300;400;500;700;900&display=swap');
</style>
