import { supabase } from '@/lib/supabase';

// ===================================================================
// ### Points & Gamification APIs using Supabase SDK v2
// ===================================================================

// Level Tier Definitions
export const LEVEL_TIERS = [
  { tier: 1, name: '新手交易者', icon: '🌱', minPoints: 0, maxPoints: 499, bonus: 0 },
  { tier: 2, name: '青銅交易者', icon: '🥉', minPoints: 500, maxPoints: 999, bonus: 50 },
  { tier: 3, name: '白銀交易者', icon: '🥈', minPoints: 1000, maxPoints: 2499, bonus: 100 },
  { tier: 4, name: '黃金交易者', icon: '🥇', minPoints: 2500, maxPoints: 4999, bonus: 200 },
  { tier: 5, name: '鉑金交易者', icon: '💎', minPoints: 5000, maxPoints: 9999, bonus: 500 },
  { tier: 6, name: '鑽石交易者', icon: '💠', minPoints: 10000, maxPoints: 19999, bonus: 1000 },
  { tier: 7, name: '大師交易者', icon: '👑', minPoints: 20000, maxPoints: Infinity, bonus: 2000 }
];

// Trust Level Definitions
export const TRUST_TIERS = [
  { tier: 1, name: '新手賣家', maxListingValue: 500, requiredSales: 0 },
  { tier: 2, name: '可信賣家', maxListingValue: 1000, requiredSales: 500 },
  { tier: 3, name: '優質賣家', maxListingValue: 3000, requiredSales: 2000 },
  { tier: 4, name: '金牌賣家', maxListingValue: 5000, requiredSales: 5000 },
  { tier: 5, name: '鑽石賣家', maxListingValue: Infinity, requiredSales: 15000 }
];

// Badge Definitions
export const BADGE_DEFINITIONS = {
  // Streak Badges
  streak_7: { name: '連續簽到達人', icon: '🔥', description: '連續簽到7天', rarity: 'common' },
  streak_30: { name: '月度堅持者', icon: '🌟', description: '連續簽到30天', rarity: 'rare' },
  streak_100: { name: '傳奇簽到王', icon: '👑', description: '連續簽到100天', rarity: 'legendary' },

  // Transaction Badges
  first_sale: { name: '首次出售', icon: '🎉', description: '完成第一筆交易', rarity: 'common' },
  seller_10: { name: '活躍賣家', icon: '💼', description: '完成10筆銷售', rarity: 'uncommon' },
  seller_50: { name: '專業賣家', icon: '🏆', description: '完成50筆銷售', rarity: 'rare' },
  buyer_10: { name: '購物達人', icon: '🛍️', description: '完成10筆購買', rarity: 'uncommon' },

  // Points Badges
  points_1000: { name: '千點富翁', icon: '💰', description: '累積賺取1000點', rarity: 'uncommon' },
  points_5000: { name: '萬點大亨', icon: '💎', description: '累積賺取5000點', rarity: 'rare' },

  // Special Badges
  early_adopter: { name: '早期用戶', icon: '🌱', description: '平台早期註冊用戶', rarity: 'epic' },
  perfect_rating: { name: '完美評價', icon: '⭐', description: '獲得10個5星評價', rarity: 'rare' }
};

// Transaction Types
export const TRANSACTION_TYPES = {
  TRANSACTION_INCOME: { label: '交易收入', icon: '💰', color: '#27ae60' },
  TRANSACTION_EXPENSE: { label: '交易支出', icon: '🛒', color: '#e74c3c' },
  QUEST_REWARD: { label: '任務獎勵', icon: '🎯', color: '#f39c12' },
  DAILY_SIGNIN: { label: '每日簽到', icon: '📅', color: '#3498db' },
  DAILY_LOGIN: { label: '每日登入', icon: '📅', color: '#3498db' },
  LEVEL_BONUS: { label: '升級獎勵', icon: '⭐', color: '#f39c12' },
  BADGE_REWARD: { label: '成就獎勵', icon: '🏆', color: '#e67e22' },
  WELCOME_BONUS: { label: '新手禮包', icon: '🎁', color: '#9b59b6' },
  INITIAL_GIFT: { label: '初始點數', icon: '🎁', color: '#9b59b6' },
  SALE_EARNING: { label: '出售收入', icon: '💰', color: '#27ae60' },
  PURCHASE_SPENDING: { label: '購買支出', icon: '🛒', color: '#e74c3c' },
  ADMIN_ADJUSTMENT: { label: '管理員調整', icon: '⚙️', color: '#95a5a6' }
};

/**
 * Get user points profile (calls Supabase RPC: get_user_points_profile)
 * @returns {Promise<object>} - User points profile
 */
export async function getUserPointsProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  console.log('getUserPointsProfile called - calling RPC: get_user_points_profile');

  const { data, error } = await supabase.rpc('get_user_points_profile');

  if (error) {
    console.error('Supabase get_user_points_profile RPC error:', error);
    throw new Error(error.message || '獲取使用者資料失敗');
  }

  console.log('get_user_points_profile RPC response:', data);
  return data;
}

/**
 * Normalize point log entry
 * @param {object} log - Log entry from Supabase
 * @param {object} param1 - { page, index }
 * @returns {object} - Normalized log entry
 */
function normalizePointLog(log, { page, index }) {
  const fallbackId = `${page}-${index}-${log.created_at}`;
  return {
    id: log.point_log_id || log.id || log.transaction_id || fallbackId,
    user_id: log.user_id || null,
    type: log.type,
    amount: log.amount,
    description: log.description,
    balance_before: log.balance_before ?? null,
    balance_after: log.balance_after ?? null,
    reference_type: log.reference_type || null,
    reference_id: log.reference_id || log.transaction_id || null,
    created_at: log.created_at,
    transaction_id: log.transaction_id || null
  };
}

/**
 * Get points transactions with filtering
 * @param {object} params - { type, startDate, endDate, page, size }
 * @returns {Promise<object>} - { transactions, total, page }
 */
export async function getPointLogs(params = {}) {
  const { logType = null, page = 1, size = 20 } = params;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const { data, error } = await supabase.rpc('get_point_logs', {
    p_log_type: logType,
    p_page: page,
    p_size: size
  });

  if (error) {
    console.error('Supabase get_point_logs RPC error:', error);
    throw new Error(error.message || '獲取點數紀錄失敗');
  }

  const normalized = (data || []).map((log, index) => normalizePointLog(log, { page, index }));

  return {
    transactions: normalized,
    total: normalized.length,
    page,
    hasMore: normalized.length === size
  };
}

export async function getPointsTransactions(params = {}) {
  const { type = null, page = 1, size = 20 } = params;
  return getPointLogs({ logType: type, page, size });
}

/**
 * Daily sign-in (RPC V4: daily_check_in)
 * - 自動計算連續簽到與點數
 * - 結果中包含徽章授予資訊
 * @returns {Promise<object>} - 簽到結果 (含徽章資訊)
 */
export async function dailySignIn() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  console.log('dailySignIn called - calling RPC: daily_check_in');

  const { data, error } = await supabase.rpc('daily_check_in');

  if (error) {
    console.error('Supabase daily_check_in RPC error:', error);
    throw new Error(error.message || '每日簽到失敗');
  }

  console.log('daily_check_in RPC response:', data);
  return data;
}

/**
 * 獲取使用者的徽章列表（包含進度）
 * @param {string|null} userId - 指定使用者 ID，預設為當前使用者
 * @returns {Promise<object>} - { user_id, earned_badges, in_progress_badges }
 */
export async function getUserBadgesWithProgress(userId = null) {
  const { data, error } = await supabase.rpc('get_user_badges_with_progress', {
    p_user_id: userId
  });

  if (error) {
    console.error('獲取徽章失敗:', error);
    throw new Error(error.message || '獲取徽章資料失敗');
  }

  return data;
}

/**
 * 與舊版介面相容：僅回傳已獲得徽章列表
 * @param {string|null} userId
 * @returns {Promise<Array>} - earned_badges 陣列
 */
export async function getUserBadges(userId = null) {
  const data = await getUserBadgesWithProgress(userId);
  return data?.earned_badges || [];
}

/**
 * 手動觸發徽章檢查與授予
 * - 呼叫 manually_check_badges RPC
 * @returns {Promise<object>} - { newly_earned_count, total_points_awarded, badges }
 */
export async function manuallyCheckBadges() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const { data, error } = await supabase.rpc('manually_check_badges');

  if (error) {
    console.error('檢查徽章失敗:', error);
    throw new Error(error.message || '手動檢查徽章失敗');
  }

  return data;
}

/**
 * Check listing permission based on trust level
 * @param {number} itemPrice - Item price
 * @returns {Promise<object>} - { allowed, current_trust_level, required_trust_level, sales_needed }
 */
export async function checkListingPermission(itemPrice) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const profile = await getUserPointsProfile();
  const currentTrustTier = TRUST_TIERS[profile.trust_level_tier - 1];

  if (itemPrice <= currentTrustTier.maxListingValue) {
    return {
      allowed: true,
      current_trust_level: currentTrustTier
    };
  }

  const requiredTier = TRUST_TIERS.find(tier => itemPrice <= tier.maxListingValue);
  const salesNeeded = Math.max(0, requiredTier.requiredSales - profile.total_sales_points);

  console.log('checkListingPermission called with price:', itemPrice);
  console.log('Permission denied, sales needed:', salesNeeded);

  return {
    allowed: false,
    current_trust_level: currentTrustTier,
    required_trust_level: requiredTier,
    sales_needed: salesNeeded
  };
}

/**
 * Get current level tier from points
 * @param {number} totalEarned - Total earned points
 * @returns {object} - Level tier object
 */
export function getLevelTier(totalEarned) {
  return LEVEL_TIERS.find(
    tier => totalEarned >= tier.minPoints && totalEarned <= tier.maxPoints
  ) || LEVEL_TIERS[0];
}

/**
 * Get current trust tier from sales points
 * @param {number} totalSalesPoints - Total sales points
 * @returns {object} - Trust tier object
 */
export function getTrustTier(totalSalesPoints) {
  const tiers = TRUST_TIERS.filter(tier => totalSalesPoints >= tier.requiredSales);
  return tiers[tiers.length - 1] || TRUST_TIERS[0];
}

/**
 * Calculate streak reward
 * @param {number} day - Streak day
 * @returns {number} - Points reward
 */
export function calculateStreakReward(day) {
  if (day === 1 || day === 2) return 5;
  if (day === 3) return 10;
  if (day === 7) return 20;
  if (day === 14) return 30;
  if (day === 30) return 50;
  if (day === 100) return 200;
  return 5;
}
