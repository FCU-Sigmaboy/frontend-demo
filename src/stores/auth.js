import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const isLoggedIn = ref(false)
  const user = ref(null)
  const session = ref(null)

  // Getters
  const userName = computed(() => {
    if (!user.value) return '訪客'
    return user.value.user_metadata?.full_name ||
           user.value.user_metadata?.name ||
           user.value.email?.split('@')[0] ||
           '使用者'
  })

  const userEmail = computed(() => user.value?.email || '')
  const userAvatar = computed(() => user.value?.user_metadata?.avatar_url || '')

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

  // 設定 session
  function setSession(newSession) {
    session.value = newSession
    user.value = newSession?.user || null
    isLoggedIn.value = !!newSession
  }

  // 初始化認證狀態
  async function initAuth() {
    try {
      console.log(
        await supabase.auth.getUser()
      );
      // 獲取當前 session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)

      // 監聽認證狀態變化
      supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log('Auth state changed:', _event)
        setSession(newSession)
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
    // Getters
    userName,
    userEmail,
    userAvatar,
    // Actions
    signInWithGoogle,
    signOut,
    initAuth,
    setSession
  }
})
