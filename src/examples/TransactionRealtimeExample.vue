<template>
  <div>
    <!-- 这个组件展示如何使用交易实时更新功能 -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'

const transactionStore = useTransactionStore()
const authStore = useAuthStore()

// 设置实时更新的回调函数
onMounted(() => {
  // 确保用户已登录后启动实时监听
  if (authStore.isLoggedIn && authStore.userId) {
    // 设置事件回调
    transactionStore.setRealtimeCallbacks({
      // 收到新交易请求（作为卖家）
      onTransactionReceived: (transaction) => {
        console.log('收到新交易请求！', transaction)

        // 可以显示通知
        showNotification({
          title: '新交易请求',
          message: `有人想购买您的商品：${transaction.item?.title || '商品'}`,
          type: 'info',
          action: {
            label: '查看',
            onClick: () => {
              // 跳转到交易页面
              router.push({ name: 'TransactionRecords' })
            }
          }
        })
      },

      // 交易被接受（作为买家）
      onTransactionAccepted: (transaction) => {
        console.log('交易被接受！', transaction)

        showNotification({
          title: '交易已接受',
          message: '卖家已接受您的交易请求，请前往完成交易',
          type: 'success',
          action: {
            label: '查看详情',
            onClick: () => {
              router.push({
                name: 'TransactionRecords'
              })
            }
          }
        })
      },

      // 交易完成
      onTransactionCompleted: (transaction) => {
        console.log('交易完成！', transaction)

        showNotification({
          title: '交易完成',
          message: '恭喜！交易已成功完成',
          type: 'success'
        })
      },

      // 交易被拒绝（作为买家）
      onTransactionRejected: (transaction) => {
        console.log('交易被拒绝', transaction)

        showNotification({
          title: '交易被拒绝',
          message: '很抱歉，卖家拒绝了您的交易请求',
          type: 'warning'
        })
      },

      // 交易被取消
      onTransactionCancelled: (transaction) => {
        console.log('交易被取消', transaction)

        showNotification({
          title: '交易已取消',
          message: '交易已被取消',
          type: 'info'
        })
      }
    })

    // 启动实时监听
    transactionStore.startRealtime(authStore.userId)
  }
})

// 组件卸载时停止监听
onUnmounted(() => {
  transactionStore.stopRealtime()
})

// 示例通知函数（需要根据实际通知系统实现）
function showNotification(options) {
  // 可以使用 toast 库、浏览器通知 API 等
  console.log('Notification:', options)

  // 示例：使用浏览器通知 API
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(options.title, {
      body: options.message,
      icon: '/logo.png'
    })
  }
}
</script>

<!--
使用说明：

1. 在 App.vue 或主布局组件中引入此示例代码

2. 交易状态变化时会自动更新 store 中的数据，并触发相应的回调

3. 可以监听的事件：
   - onTransactionReceived: 收到新交易请求（你是卖家）
   - onTransactionAccepted: 交易被接受（你是买家）
   - onTransactionCompleted: 交易完成
   - onTransactionRejected: 交易被拒绝（你是买家）
   - onTransactionCancelled: 交易被取消

4. Store 会自动管理交易数据的状态转换：
   - waiting → in_transaction (接受交易)
   - in_transaction → completed (完成交易)
   - waiting → rejected (拒绝交易)
   - any → cancelled (取消交易)

5. 实时监听的优点：
   - 无需手动刷新页面
   - 即时收到交易状态变化通知
   - 数据自动同步到 store
   - 可以实现推送通知

6. 性能优化：
   - 仅订阅与当前用户相关的交易（buyer_id 或 seller_id）
   - 自动在组件卸载时取消订阅
   - 避免重复订阅
-->