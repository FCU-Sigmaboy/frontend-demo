import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'public/**',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs'
    ]
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        crypto: 'readonly',
        Intl: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        JSON: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Boolean: 'readonly',
        Symbol: 'readonly',
        BigInt: 'readonly',
        Error: 'readonly',
        TypeError: 'readonly',
        RangeError: 'readonly',
        SyntaxError: 'readonly',
        ReferenceError: 'readonly',
        RegExp: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        ArrayBuffer: 'readonly',
        DataView: 'readonly',
        Uint8Array: 'readonly',
        Int8Array: 'readonly',
        Uint16Array: 'readonly',
        Int16Array: 'readonly',
        Uint32Array: 'readonly',
        Int32Array: 'readonly',
        Float32Array: 'readonly',
        Float64Array: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        EventTarget: 'readonly',
        atob: 'readonly',
        btoa: 'readonly'
      }
    },
    rules: {
      // 代碼複雜度規則 (用於生成類似 PMD 的複雜度報告)
      'complexity': ['warn', { max: 20 }], // 環路複雜度限制
      'max-depth': ['warn', { max: 4 }], // 最大嵌套深度
      'max-nested-callbacks': ['warn', { max: 3 }], // 最大回調嵌套數
      'max-params': ['warn', { max: 5 }], // 函數最大參數數量
      'max-statements': ['warn', { max: 30 }], // 函數最大語句數
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
      
      // 代碼品質規則
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',
      
      // Vue 相關規則
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'warn',
      'vue/no-unused-vars': 'error',
      'vue/component-tags-order': ['error', {
        order: ['template', 'script', 'style']
      }],
      'vue/max-attributes-per-line': ['warn', {
        singleline: { max: 5 },
        multiline: { max: 1 }
      }]
    }
  },
  {
    // 測試文件的特殊規則
    files: ['tests/**/*.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'max-lines-per-function': 'off',
      'max-statements': 'off'
    }
  }
]
