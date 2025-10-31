/**
 * 將時間戳轉換為相對時間格式
 * @param {string|Date} date - 時間字串或 Date 物件
 * @returns {string} - 格式化後的相對時間，如 "5分鐘前"、"3天前"
 */
export function formatRelativeTime(date) {
  if (!date) return '未知時間';

  const now = new Date();
  const past = new Date(date);

  // 計算時間差（毫秒）
  const diffMs = now - past;

  // 如果是未來時間，返回"剛剛"
  if (diffMs < 0) return '剛剛';

  // 轉換為秒
  const diffSeconds = Math.floor(diffMs / 1000);

  // 小於1分鐘
  if (diffSeconds < 60) {
    return '剛剛';
  }

  // 小於1小時
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}分鐘前`;
  }

  // 小於1天
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}小時前`;
  }

  // 小於30天
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}天前`;
  }

  // 小於12個月
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}個月前`;
  }

  // 超過12個月
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}年前`;
}
