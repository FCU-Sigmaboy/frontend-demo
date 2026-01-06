// vitest.config.js
// Sprint 1: 基礎配置 - 無覆蓋率門檻
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 測試環境：使用 happy-dom 模擬瀏覽器環境
    environment: 'happy-dom',

    // 全域 API：讓 describe, it, expect 等可直接使用
    globals: true,

    // 測試檔案匹配模式
    include: ['src/**/*.{test,spec}.{js,ts}'],

    // 排除目錄
    exclude: ['node_modules', 'dist', '.git', '.cache'],

    // 覆蓋率設定（Sprint 1: 僅啟用報告，不設門檻）
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/*.config.mjs',
        'src/main.js',
        'src/router/**',
        'src/lib/**',
        'src/**/*.test.js',
        'src/**/*.spec.js',
      ],
      // Sprint 3+ 再啟用門檻（從低門檻開始，逐步提高）：
      // 20% 門檻是保守起步值，目的是：
      // 1. 讓 CI 開始強制執行覆蓋率
      // 2. 避免一開始就設太高導致頻繁失敗
      // 3. 隨著測試增加，逐步調高至 40% → 60%
      // thresholds: {
      //   lines: 20,
      //   functions: 20,
      //   branches: 15,
      //   statements: 20
      // }
    },

    // 設置檔案（在每個測試檔案前執行）
    setupFiles: ['./src/test/setup.js'],
  },
  resolve: {
    // 根目錄別名（與 Vite 一致，test 區塊會自動繼承）
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
