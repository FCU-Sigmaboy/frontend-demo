<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h3>新建活動</h3>
        <button class="close-btn" @click="close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>活動名稱 *</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="例如：新年紅包"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label>活動說明 *</label>
          <textarea
            v-model="form.description"
            placeholder="簡單描述此次贈點活動的目的和內容"
            class="form-control"
            rows="4"
          ></textarea>
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
          <label>活動狀態</label>
          <select v-model="form.status" class="form-control">
            <option value="active">進行中</option>
            <option value="pending">待處理</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close">取消</button>
        <button class="btn-primary" @click="submit">建立活動</button>
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
  title: '',
  description: '',
  points: 100,
  status: 'active'
});

const close = () => {
  emit('update:modelValue', false);
  resetForm();
};

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    points: 100,
    status: 'active'
  };
};

const submit = () => {
  if (!form.value.title || !form.value.description || !form.value.points) {
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
