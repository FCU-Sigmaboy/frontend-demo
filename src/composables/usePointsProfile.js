import { ref } from 'vue'
import { getUserPointsProfile } from '@/api/pointsAPI'

const profileState = ref(null)
const isLoadingState = ref(false)
const errorState = ref(null)
const lastFetchedAt = ref(null)
const CACHE_DURATION_MS = 60 * 1000

/**
 * 共用的點數資料 composable
 * - 提供快取，避免重複呼叫 RPC
 * - 任何組件都可以共用同一份狀態
 */
export function usePointsProfile() {
  async function fetchPointsProfile(forceRefresh = false) {
    const isCacheFresh =
      lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_DURATION_MS

    if (!forceRefresh && profileState.value && isCacheFresh) {
      return profileState.value
    }

    if (isLoadingState.value) {
      return profileState.value
    }

    try {
      isLoadingState.value = true
      errorState.value = null

      const data = await getUserPointsProfile()
      profileState.value = data
      lastFetchedAt.value = Date.now()

      return data
    } catch (error) {
      errorState.value = error
      throw error
    } finally {
      isLoadingState.value = false
    }
  }

  return {
    profile: profileState,
    isLoadingProfile: isLoadingState,
    profileError: errorState,
    fetchPointsProfile
  }
}





