import { useToast } from 'bootstrap-vue-next'

export function useTransactionToast() {
  const { show: showToast } = useToast()

  const toastOptions = {
    pos: 'top-end',
    value: 0,
    toasterClass: 'custom-toast-position'
  }

  const getItemName = (transaction) => {
    // RPC 回傳的是 item_title
    return transaction?.item_title || '物品'
  }

  const getOtherUserName = (transaction) => {
    // RPC 回傳的是 other_user_nickname（對方使用者的暱稱）
    return transaction?.other_user_nickname || '對方'
  }

  const showTransactionReceivedToast = (transaction) => {
    const userName = getOtherUserName(transaction)
    const itemName = getItemName(transaction)
    showToast?.({
      title: '🔔 新交易請求',
      body: `${userName} 想要交易\n${itemName}`,
      variant: 'info',
      ...toastOptions
    })
  }

  const showTransactionAcceptedToast = (transaction) => {
    const userName = getOtherUserName(transaction)
    const itemName = getItemName(transaction)
    showToast?.({
      title: '✅ 交易已接受',
      body: `${userName} 已接受交易\n${itemName}`,
      variant: 'success',
      ...toastOptions
    })
  }

  const showTransactionCompletedToast = (transaction) => {
    const itemName = getItemName(transaction)
    showToast?.({
      title: '🎉 交易已完成',
      body: `恭喜！${itemName} 交易成功`,
      variant: 'success',
      ...toastOptions
    })
  }

  const showTransactionRejectedToast = (transaction) => {
    const userName = getOtherUserName(transaction)
    const itemName = getItemName(transaction)
    showToast?.({
      title: '❌ 交易已拒絕',
      body: `${userName} 拒絕了交易\n${itemName}`,
      variant: 'warning',
      ...toastOptions
    })
  }

  const showTransactionCancelledToast = (transaction) => {
    const itemName = getItemName(transaction)
    const otherUserName = transaction?.other_user_nickname

    // 判斷是誰取消的：如果有 other_user_nickname，表示是對方取消
    const cancelledBy = otherUserName ? `${otherUserName} 取消了交易` : '你取消了交易'

    showToast?.({
      title: '🚫 交易已取消',
      body: `${cancelledBy}\n${itemName}`,
      variant: 'secondary',
      ...toastOptions
    })
  }

  return {
    showTransactionReceivedToast,
    showTransactionAcceptedToast,
    showTransactionCompletedToast,
    showTransactionRejectedToast,
    showTransactionCancelledToast
  }
}