<template>
  <div class="container py-4">
    <h1 class="h4 mb-3">Messaging 診斷工具</h1>
    <p class="text-muted mb-3">用於快速檢查後端 RPC 是否部署正確以及是否仍出現 42702 (item_id ambiguous) 錯誤。此頁面可在部署後暫時保留，確認穩定後移除。</p>

    <form class="row g-3" @submit.prevent="runDiagnostics">
      <div class="col-auto">
        <label for="itemId" class="form-label mb-0">測試物品 ID</label>
        <input v-model.number="testItemId" type="number" id="itemId" class="form-control form-control-sm" placeholder="例如 34" />
      </div>
      <div class="col-auto align-self-end">
        <button type="submit" class="btn btn-primary btn-sm" :disabled="running">
          <span v-if="running" class="spinner-border spinner-border-sm me-1" />
          {{ running ? '執行中...' : '開始診斷' }}
        </button>
      </div>
    </form>

    <hr />

    <div v-if="error" class="alert alert-danger">
      <strong>錯誤:</strong> {{ error.message }}
    </div>

    <ul class="list-group small">
      <li v-for="r in results" :key="r.ts + r.message" class="list-group-item d-flex justify-content-between align-items-start" :class="{
        'list-group-item-danger': r.level === 'error',
        'list-group-item-warning': r.level === 'warn',
        'list-group-item-info': r.level === 'info'
      }">
        <div>
          <div><strong>[{{ r.level.toUpperCase() }}]</strong> {{ r.message }}</div>
          <pre v-if="r.data" class="mb-0 mt-1 bg-light p-2 rounded" style="white-space: pre-wrap; max-height: 200px; overflow:auto;">{{ formatData(r.data) }}</pre>
        </div>
        <small class="text-muted ms-2">{{ r.ts.split('T')[1].split('.')[0] }}</small>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useMessagingDiagnostics } from '@/composables/useMessagingDiagnostics'

export default {
  name: 'MessagingDiagnosticsPage',
  setup() {
    const { running, results, error, run } = useMessagingDiagnostics()
    const testItemId = ref('')

    function runDiagnostics() {
      run({ testItemId: testItemId.value || null })
    }

    function formatData(data) {
      try {
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      } catch (e) {
        return String(data)
      }
    }

    return { running, results, error, runDiagnostics, testItemId, formatData }
  }
}
</script>

<style scoped>
.container {
  max-width: 900px;
}
pre { font-size: 12px; }
</style>

