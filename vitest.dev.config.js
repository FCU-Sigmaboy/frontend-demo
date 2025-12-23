// 開發環境專用的 Vitest 配置
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // 測試環境設定
    environment: 'jsdom',
    
    // 全域設定
    globals: true,
    
    // 設定檔案
    setupFiles: ['./tests/setup/test-setup.js'],
    
    // 模擬重置
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // 開發模式專用設定
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './coverage/test-results.json'
    },
    
    // 詳細的錯誤輸出
    printConsoleTrace: true,
    logHeapUsage: true,
    
    // 測試超時設定（開發模式下更寬鬆）
    testTimeout: 15000,
    hookTimeout: 15000,
    
    // 監視模式設定
    watch: {
      ignore: ['node_modules/', 'dist/', 'coverage/'],
      include: ['src/**', 'tests/**'],
      exclude: ['**/*.log', '**/*.tmp'],
      chokidar: {
        usePolling: false,
        interval: 100,
        binaryInterval: 300,
        ignoreInitial: true,
        followSymlinks: false,
        cwd: process.cwd(),
        disableGlobbing: false,
        ignored: [
          'node_modules/**',
          'dist/**',
          'coverage/**',
          '.git/**',
          '**/*.log',
          '**/*.tmp'
        ]
      }
    },
    
    // 覆蓋率配置（開發模式下更詳細）
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      reportsDirectory: './coverage',
      
      // 包含的檔案模式
      include: [
        'src/**/*.{js,ts,vue}',
        '!src/main.js',
        '!src/router/**'
      ],
      
      // 排除的檔案
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.config.js',
        '**/*.config.ts',
        'src/main.js',
        'src/router/',
        '**/*.d.ts',
        'coverage/',
        'public/',
        '.github/',
        '.vscode/',
        '.idea/',
        '**/*.test.{js,ts,vue}',
        '**/*.spec.{js,ts,vue}',
        'src/assets/**',
        'src/styles/**'
      ],
      
      // 開發模式下的覆蓋率閾值（較寬鬆）
      thresholds: {
        global: {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70
        }
      },
      
      // 每個檔案的覆蓋率閾值
      perFile: true,
      
      // 覆蓋率收集選項
      all: true,
      skipFull: false,
      
      // 報告選項
      reportOnFailure: true,
      
      // 清理舊的覆蓋率報告
      clean: true,
      cleanOnRerun: true
    },
    
    // 並行執行配置（開發模式下較保守）
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2, // 開發模式下使用較少線程以便除錯
        minThreads: 1
      }
    },
    
    // 測試檔案匹配模式
    include: [
      'tests/**/*.{test,spec}.{js,ts,vue}',
      'src/**/*.{test,spec}.{js,ts,vue}'
    ],
    
    // 排除檔案
    exclude: [
      'node_modules/',
      'dist/',
      'coverage/',
      'public/',
      '.git/'
    ],
    
    // 錯誤處理
    onConsoleLog: (log, type) => {
      // 開發模式下顯示所有日誌
      return true
    },
    
    // 測試重試設定（開發模式下不重試）
    retry: 0,
    
    // 測試隔離設定
    isolate: true,
    
    // 測試序列化設定
    sequence: {
      shuffle: false,
      concurrent: false, // 開發模式下順序執行以便除錯
      setupFiles: 'list'
    },
    
    // 開發模式專用的環境變數
    env: {
      NODE_ENV: 'development',
      VITEST_DEV_MODE: 'true'
    }
  }
})