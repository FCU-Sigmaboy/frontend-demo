import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { getMyProfileForEdit } from '@/api/profileAPI'
import { getCurrentPosition, saveLocation } from '@/api/locationAPI'

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const isLoggedIn = ref(false)
  const user = ref(null)
  const session = ref(null)

  // Complete profile data from API (including balance, carbon_saved_kg, locations, etc.)
  const profileData = ref(null)
  
  // Loading state to prevent duplicate API calls
  const isLoadingProfile = ref(false)

  // Getters
  const userName = computed(() => {
    if (!user.value) return '訪客'
    if (!profileData.value) return '使用者'
    return profileData.value.nickname || '使用者'
  })

  const userEmail = computed(() => {
    if (!user.value) return ''
    return profileData.value?.email || user.value.email || ''
  })

  const userAvatar = computed(() => {
    if (!user.value) return ''
    return profileData.value?.profile_picture_url || ''
  })

  // Actions

  // Google 登入
  async function signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 登入後導回當前頁面
          redirectTo: window.location.href
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Google 登入錯誤:', error)
      return { data: null, error }
    }
  }

  // 登出
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      isLoggedIn.value = false
      user.value = null
      session.value = null
    } catch (error) {
      console.error('登出錯誤:', error)
    }
  }

  // 更新 profile (從資料庫重新載入)
  async function updateCustomProfile() {
    if (!user.value) return
    
    // Prevent duplicate calls
    if (isLoadingProfile.value) {
      console.log('⏳ Profile update already in progress, skipping...')
      return
    }

    try {
      isLoadingProfile.value = true
      
      // 直接使用 getMyProfileForEdit API 獲取最新的 profile 資料
      const data = await getMyProfileForEdit()

      if (!data) {
        console.warn('Failed to update profile: No data returned')
        return
      }

      // 儲存完整的 profile 資料
      profileData.value = data

      console.log('✅ Profile updated:', {
        nickname: data.nickname,
        avatar: data.profile_picture_url,
        balance: data.profile_details?.balance,
        carbon_saved: data.profile_details?.carbon_saved_kg,
        locations_count: data.locations?.length || 0
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    } finally {
      isLoadingProfile.value = false
    }
  }

  // 從資料庫載入完整 profile (使用 getMyProfileForEdit API)
  async function loadCustomProfile() {
    if (!user.value) return
    
    // Prevent duplicate calls
    if (isLoadingProfile.value) {
      console.log('Profile load already in progress, skipping...')
      return
    }

    try {
      isLoadingProfile.value = true
      
      // 使用 getMyProfileForEdit API 獲取完整的 profile 資料
      const data = await getMyProfileForEdit()

      if (!data) {
        console.warn('Failed to load profile: No data returned')
        return
      }

      // 儲存完整的 profile 資料
      profileData.value = data

      console.log('Profile loaded:', {
        nickname: data.nickname,
        avatar: data.profile_picture_url,
        balance: data.profile_details?.balance,
        carbon_saved: data.profile_details?.carbon_saved_kg,
        locations_count: data.locations?.length || 0
      })

      // 檢查是否有 locations，如果沒有則自動獲取並儲存當前位置
      if (!data.locations || data.locations.length === 0) {
        console.log('📍 No locations found, attempting to get current position...')
        await autoSaveCurrentLocation()
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      isLoadingProfile.value = false
    }
  }

  // 自動獲取並儲存當前位置
  async function autoSaveCurrentLocation() {
    try {
      // 獲取當前位置
      console.log('🌍 Getting current position...')
      const position = await getCurrentPosition()
      console.log('✅ Position obtained:', position)

      // 獲取 session token
      const token = session.value?.access_token
      if (!token) {
        console.warn('⚠️ No session token available for saving location')
        return
      }

      // 儲存位置（首次必須為「家」）
      console.log('💾 Saving location as 家...')
      const result = await saveLocation({
        latitude: position.latitude,
        longitude: position.longitude,
        type: '家'
      }, token)

      console.log('✅ Location saved successfully:', result.data)

      // 重新載入 profile 以更新 locations
      await updateCustomProfile()
    } catch (error) {
      // 靜默處理錯誤，不影響用戶體驗
      if (error.message.includes('拒絕')) {
        console.log('ℹ️ User denied location permission')
      } else if (error.message.includes('不支援')) {
        console.log('ℹ️ Geolocation not supported')
      } else {
        console.log('ℹ️ Could not auto-save location:', error.message)
      }
    }
  }

  // 設定 session
  function setSession(newSession) {
    session.value = newSession
    user.value = newSession?.user || null
    isLoggedIn.value = !!newSession

    // Load profile when user logs in
    if (newSession?.user) {
      loadCustomProfile()
    } else {
      // Clear profile when logged out
      profileData.value = null
    }
  }

  // 初始化認證狀態
  async function initAuth() {
    try {
      // 獲取當前 session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)

      // 監聽認證狀態變化
      supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log('Auth state changed:', _event)
        
        // Only reload profile on SIGNED_IN event, not on TOKEN_REFRESHED
        if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
          setSession(newSession)
        } else if (_event === 'SIGNED_OUT') {
          setSession(null)
        } else if (_event === 'TOKEN_REFRESHED') {
          // Just update session without reloading profile
          session.value = newSession
          user.value = newSession?.user || null
          isLoggedIn.value = !!newSession
        }
      })
    } catch (error) {
      console.error('初始化認證失敗:', error)
    }
  }

  return {
    // 狀態
    isLoggedIn,
    user,
    session,
    profileData,
    isLoadingProfile,
    // Getters
    userName,
    userEmail,
    userAvatar,
    // Actions
    signInWithGoogle,
    signOut,
    initAuth,
    setSession,
    updateCustomProfile,
    loadCustomProfile
  }
})
