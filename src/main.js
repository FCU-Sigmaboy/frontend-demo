import { createApp } from 'vue'
// import './style.css'
import './styles/custom.scss'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import { createBootstrap } from 'bootstrap-vue-next'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Google Analytics 4 Plugin
import analyticsPlugin from './plugins/analytics'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(createBootstrap())
app.use(analyticsPlugin) // 初始化 GA4
app.mount('#app')
