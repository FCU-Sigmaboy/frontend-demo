// eslint.config.js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  // JavaScript 推薦規則
  js.configs.recommended,

  // Vue.js 推薦規則（Flat Config 格式）
  ...pluginVue.configs['flat/recommended'],

  // Node.js 配置檔案專用規則
  {
    files: ['*.config.js', 'vite.config.js', 'vitest.config.js', 'eslint.config.js', 'prettier.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      }
    },
  },

  // 測試檔案專用規則（Vitest globals）
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Vitest globals
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
      }
    },
  },

  // 專案自訂規則
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // 第三方全局變量
        google: 'readonly',  // Google Maps API
      }
    },
    rules: {
      // Vue 規則調整
      'vue/multi-word-component-names': 'off',        // 允許單字組件名稱
      'vue/no-unused-vars': 'warn',                   // 未使用的變數警告
      'vue/require-default-prop': 'off',              // 不強制要求預設 prop
      'vue/require-prop-types': 'warn',               // 建議定義 prop 類型
      
      // JavaScript 規則調整
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',                      // 忽略以 _ 開頭的參數
        varsIgnorePattern: '^_'                       // 忽略以 _ 開頭的變數
      }],
      'no-console': ['warn', { 
        allow: ['warn', 'error']                      // 允許 console.warn/error
      }],
      'no-debugger': 'warn',                          // debugger 語句警告
      'prefer-const': 'warn',                         // 建議使用 const
      'no-var': 'error',                              // 禁止使用 var
    }
  },

  // Prettier 整合（必須放在最後）
  eslintConfigPrettier,

  // 忽略檔案設定
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.min.js',
      'public/**',
      'coverage/**',
      '.git/**'
    ]
  }
]
