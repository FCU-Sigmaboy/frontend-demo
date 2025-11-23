<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h3>新增自動規則</h3>
        <button class="close-btn" @click="close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>規則名稱 *</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="例如：新用戶歡迎禮"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label>觸發條件 *</label>
          <select v-model="form.trigger" class="form-control">
            <option value="new_user">新用戶註冊</option>
            <option value="first_transaction">首次交易完成</option>
            <option value="level_up">升級</option>
            <option value="daily_login">每日登入</option>
            <option value="transaction_milestone">交易里程碑</option>
          </select>
        </div>

        <div class="form-group">
          <label>贈送點數 *</label>
          <input
            v-model.number="form.points"
            type="number"
            min="1"
            placeholder="輸入點數"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label>通知訊息</label>
          <textarea
            v-model="form.message"
            placeholder="用戶收到點數時顯示的訊息"
            class="form-control"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <input
              v-model="form.enabled"
              type="checkbox"
              id="rule-enabled"
            />
            <label for="rule-enabled">立即啟用此規則</label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close">取消</button>
        <button class="btn-primary" @click="submit">建立規則</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'submit']);

const form = ref({
  name: '',
  trigger: 'new_user',
  points: 500,
  message: '',
  enabled: true
});

const close = () => {
  emit('update:modelValue', false);
  resetForm();
};

const resetForm = () => {
  form.value = {
    name: '',
    trigger: 'new_user',
    points: 500,
    message: '',
    enabled: true
  };
};

const submit = () => {
  if (!form.value.name || !form.value.trigger || !form.value.points) {
    alert('請填寫所有必填欄位');
    return;
  }

  emit('submit', { ...form.value });
  close();
};

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    color: #666;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s;

    &:hover {
      background: #f5f5f5;
      color: #1e1e1e;
    }
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1e1e1e;
    font-size: 14px;
  }

  .form-control {
    width: 100%;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(111, 184, 165, 0.1);
    }
  }

  textarea.form-control {
    resize: vertical;
    min-height: 80px;
  }
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  label {
    margin: 0;
    cursor: pointer;
    font-weight: 500;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid #e0e0e0;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: $primary;
  color: white;

  &:hover {
    background: #5fa795;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(111, 184, 165, 0.3);
  }
}

.btn-secondary {
  background: #e0e0e0;
  color: #1e1e1e;

  &:hover {
    background: #d0d0d0;
  }
}
</style>
