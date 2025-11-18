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
  'streak_7': { name: '連續簽到達人', icon: '🔥', description: '連續簽到7天', rarity: 'common' },
  'streak_30': { name: '月度堅持者', icon: '🌟', description: '連續簽到30天', rarity: 'rare' },
  'streak_100': { name: '傳奇簽到王', icon: '👑', description: '連續簽到100天', rarity: 'legendary' },

  // Transaction Badges
  'first_sale': { name: '首次出售', icon: '🎉', description: '完成第一筆交易', rarity: 'common' },
  'seller_10': { name: '活躍賣家', icon: '💼', description: '完成10筆銷售', rarity: 'uncommon' },
  'seller_50': { name: '專業賣家', icon: '🏆', description: '完成50筆銷售', rarity: 'rare' },
  'buyer_10': { name: '購物達人', icon: '🛍️', description: '完成10筆購買', rarity: 'uncommon' },

  // Points Badges
  'points_1000': { name: '千點富翁', icon: '💰', description: '累積賺取1000點', rarity: 'uncommon' },
  'points_5000': { name: '萬點大亨', icon: '💎', description: '累積賺取5000點', rarity: 'rare' },

  // Special Badges
  'early_adopter': { name: '早期用戶', icon: '🌱', description: '平台早期註冊用戶', rarity: 'epic' },
  'perfect_rating': { name: '完美評價', icon: '⭐', description: '獲得10個5星評價', rarity: 'rare' }
};

// Transaction Types
export const TRANSACTION_TYPES = {
  WELCOME_BONUS: { label: '新手禮包', icon: '🎁', color: '#9b59b6' },
  SALE_EARNING: { label: '出售收入', icon: '💰', color: '#27ae60' },
  PURCHASE_SPENDING: { label: '購買支出', icon: '🛒', color: '#e74c3c' },
  DAILY_SIGNIN: { label: '每日簽到', icon: '📅', color: '#3498db' },
  LEVEL_BONUS: { label: '升級獎勵', icon: '⭐', color: '#f39c12' },
  BADGE_REWARD: { label: '成就獎勵', icon: '🏆', color: '#e67e22' },
  ADMIN_ADJUSTMENT: { label: '管理員調整', icon: '⚙️', color: '#95a5a6' }
};

/**
 * Get user points profile
 * @returns {Promise<object>} - User points profile
 */
export async function getUserPointsProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  // Example data for testing
  const exampleProfile = {
    user_id: user.id,
    current_balance: 500,
    total_earned: 1200,
    total_spent: 700,
    daily_streak: 7,
    last_signin_date: '2025-11-06',
    current_level_tier: 2,
    trust_level_tier: 1,
    total_sales_points: 450,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-11-06T00:00:00Z'
  };

  console.log('getUserPointsProfile called');
  console.log('Returning example profile:', exampleProfile);

  return exampleProfile;
}

/**
 * Get points transactions with filtering
 * @param {object} params - { type, startDate, endDate, page, size }
 * @returns {Promise<object>} - { transactions, total, page }
 */
export async function getPointsTransactions(params = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const {
    type = null,
    startDate = null,
    endDate = null,
    page = 1,
    size = 20
  } = params;

  // Example transactions data
  const allTransactions = [
    {
      id: 'trans_1',
      user_id: user.id,
      type: 'sale_earning',
      amount: 450,
      description: '出售 IKEA 檯燈',
      balance_before: 500,
      balance_after: 950,
      reference_type: 'transaction',
      reference_id: 'trans_123',
      created_at: '2025-11-06T14:30:00Z'
    },
    {
      id: 'trans_2',
      user_id: user.id,
      type: 'purchase_spending',
      amount: -300,
      description: '購買 登山背包',
      balance_before: 800,
      balance_after: 500,
      reference_type: 'transaction',
      reference_id: 'trans_122',
      created_at: '2025-11-05T10:15:00Z'
    },
    {
      id: 'trans_3',
      user_id: user.id,
      type: 'daily_signin',
      amount: 20,
      description: '每日簽到 (第 7 天)',
      balance_before: 780,
      balance_after: 800,
      reference_type: 'signin',
      reference_id: '2025-11-05',
      created_at: '2025-11-05T09:00:00Z'
    },
    {
      id: 'trans_4',
      user_id: user.id,
      type: 'level_bonus',
      amount: 50,
      description: '升級至 青銅交易者',
      balance_before: 730,
      balance_after: 780,
      reference_type: 'level',
      reference_id: '2',
      created_at: '2025-11-04T16:20:00Z'
    },
    {
      id: 'trans_5',
      user_id: user.id,
      type: 'badge_reward',
      amount: 20,
      description: '獲得成就: 連續簽到達人',
      balance_before: 710,
      balance_after: 730,
      reference_type: 'badge',
      reference_id: 'streak_7',
      created_at: '2025-11-04T09:05:00Z'
    },
    {
      id: 'trans_6',
      user_id: user.id,
      type: 'welcome_bonus',
      amount: 500,
      description: '新手禮包',
      balance_before: 0,
      balance_after: 500,
      reference_type: null,
      reference_id: null,
      created_at: '2025-01-01T00:00:00Z'
    }
  ];

  // Filter by type if specified
  let filtered = allTransactions;
  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }

  // Simulate pagination
  const start = (page - 1) * size;
  const end = start + size;
  const paginated = filtered.slice(start, end);

  console.log('getPointsTransactions called with:', params);
  console.log('Returning:', { total: filtered.length, page, count: paginated.length });

  return {
    transactions: paginated,
    total: filtered.length,
    page
  };
}

/**
 * Daily sign-in (calls Supabase RPC: daily_check_in)
 * @returns {Promise<object>} - { success, message, points_awarded, streak_day, next_reward, new_balance }
 */
export async function dailySignIn() {
  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  console.log('dailySignIn called - calling RPC: daily_check_in');

  // 2. Call the RPC function (no parameters needed)
  const { data, error } = await supabase.rpc('daily_check_in');

  // 3. Error handling (catches RAISE EXCEPTION from RPC)
  if (error) {
    console.error('Supabase daily_check_in RPC error:', error);
    throw new Error(error.message || '每日簽到失敗');
  }

  console.log('daily_check_in RPC response:', data);

  // 4. Return the RPC result
  // Expected format:
  // {
  //   success: true/false,
  //   message: "簽到成功！",
  //   points_awarded: 5,
  //   streak_day: 8,
  //   next_reward: 6,
  //   new_balance: 1005
  // }
  return data;
}

/**
 * Get user badges
 * @returns {Promise<Array>} - User badges
 */
export async function getUserBadges() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  // Example badges
  const exampleBadges = [
    {
      id: 'badge_1',
      user_id: user.id,
      badge_id: 'streak_7',
      name: '連續簽到達人',
      icon: '🔥',
      description: '連續簽到7天',
      rarity: 'common',
      earned_at: '2025-11-04T09:05:00Z',
      points_rewarded: 20
    },
    {
      id: 'badge_2',
      user_id: user.id,
      badge_id: 'first_sale',
      name: '首次出售',
      icon: '🎉',
      description: '完成第一筆交易',
      rarity: 'common',
      earned_at: '2025-11-02T14:00:00Z',
      points_rewarded: 10
    },
    {
      id: 'badge_3',
      user_id: user.id,
      badge_id: 'early_adopter',
      name: '早期用戶',
      icon: '🌱',
      description: '平台早期註冊用戶',
      rarity: 'epic',
      earned_at: '2025-01-01T00:00:00Z',
      points_rewarded: 100
    }
  ];

  console.log('getUserBadges called');
  console.log('Returning example badges:', exampleBadges);

  return exampleBadges;
}

/**
 * Check listing permission based on trust level
 * @param {number} itemPrice - Item price
 * @returns {Promise<object>} - { allowed, current_trust_level, required_trust_level, sales_needed }
 */
export async function checkListingPermission(itemPrice) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  // Get user profile
  const profile = await getUserPointsProfile();
  const currentTrustTier = TRUST_TIERS[profile.trust_level_tier - 1];

  // Check if allowed
  if (itemPrice <= currentTrustTier.maxListingValue) {
    return {
      allowed: true,
      current_trust_level: currentTrustTier
    };
  }

  // Find required trust level
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
  return 5; // Default
}
