/**
 * Google Analytics 4 Plugin
 * 初始化並載入 GA4 追蹤代碼
 */

export default {
  install(app) {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
    
    if (!measurementId) {
      console.warn('[GA4 Plugin] VITE_GA_MEASUREMENT_ID not found in environment variables')
      return
    }
    
    // 動態載入 gtag.js 腳本
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    
    script.onload = () => {
      console.log('[GA4 Plugin] Google Analytics loaded successfully')
      
      // 配置 GA4
      if (window.gtag) {
        window.gtag('config', measurementId, {
          send_page_view: false, // 我們會手動追蹤頁面瀏覽
          cookie_flags: 'SameSite=None;Secure',
          anonymize_ip: true // 匿名化 IP（隱私保護）
        })
      }
    }
    
    script.onerror = () => {
      console.error('[GA4 Plugin] Failed to load Google Analytics')
    }
    
    document.head.appendChild(script)
    
    console.log('[GA4 Plugin] Initialized with measurement ID:', measurementId)
  }
}
