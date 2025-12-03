import { supabase } from '@/lib/supabase'

/**
 * 獲取使用者的徽章列表（包含進度）
 * @param {string|null} userId - 使用者 ID (null = 當前使用者)
 * @returns {Promise<object>} - { user_id, earned_badges, in_progress_badges }
 */
export async function getUserBadgesWithProgress(userId = null) {
  const { data, error } = await supabase.rpc('get_user_badges_with_progress', {
    p_user_id: userId
  })

  if (error) {
    console.error('獲取徽章失敗:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * 手動觸發徽章檢查與授予
 * @returns {Promise<object>} - { newly_earned_count, total_points_awarded, badges }
 */
export async function manuallyCheckBadges() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const { data, error } = await supabase.rpc('manually_check_badges')

  if (error) {
    console.error('檢查徽章失敗:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * 每日簽到 (V4 含徽章系統)
 * @returns {Promise<object>} - 簽到結果
 */
export async function dailySignIn() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('使用者未登入')

  const { data, error } = await supabase.rpc('daily_check_in')

  if (error) {
    console.error('每日簽到失敗:', error)
    throw new Error(error.message)
  }

  return data
}
