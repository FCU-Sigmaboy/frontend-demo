# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Google Analytics 4 Integration

本專案已整合 Google Analytics 4 (GA4) 電商追蹤功能。

### 快速設定

1. 複製 `.env.example` 為 `.env`
2. 設定你的 GA4 Measurement ID：
   ```bash
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

詳細的實施指南、事件列表和使用方式請參閱：[GA4 實施文檔](./docs/GA4-IMPLEMENTATION.md)

### 主要功能

- ✅ 自動追蹤頁面瀏覽
- ✅ 電商事件追蹤（商品瀏覽、搜尋、收藏等）
- ✅ 交易流程追蹤
- ✅ 用戶行為分析
- ✅ 隱私權合規（GDPR Consent Mode）

所有追蹤功能都透過 `@/composables/useAnalytics` 提供，可輕鬆在任何 Vue 組件中使用。
