import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const userProfile = ref(null)
  const token = ref(localStorage.getItem('auth_token') || null)
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isVendor = computed(() => userProfile.value?.vendor || false)
  const isModerator = computed(() => userProfile.value?.moderator || false)

  // 方法
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await authAPI.login(credentials)
      user.value = response.user
      userProfile.value = response.profile
      token.value = response.token
      
      // 保存token到localStorage
      localStorage.setItem('auth_token', response.token)
      
      return { success: true }
    } catch (err) {
      error.value = err.message || '登录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    userProfile.value = null
    token.value = null
    error.value = null
    
    // 清除localStorage中的token
    localStorage.removeItem('auth_token')
  }

  const fetchProfile = async () => {
    if (!token.value) return
    
    loading.value = true
    try {
      const profile = await authAPI.getProfile()
      userProfile.value = profile
    } catch (err) {
      console.error('获取用户资料失败:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (profileData) => {
    loading.value = true
    error.value = null
    
    try {
      const updatedProfile = await authAPI.updateProfile(profileData)
      userProfile.value = updatedProfile
      return { success: true, profile: updatedProfile }
    } catch (err) {
      error.value = err.message || '更新资料失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const refreshToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await authAPI.refreshToken()
      token.value = response.token
      localStorage.setItem('auth_token', response.token)
      return true
    } catch (err) {
      console.error('刷新token失败:', err)
      logout()
      return false
    }
  }

  // 初始化时检查token
  const init = async () => {
    if (token.value && !user.value) {
      await fetchProfile()
    }
  }

  return {
    // 状态
    user,
    userProfile,
    token,
    loading,
    error,
    
    // 计算属性
    isAuthenticated,
    isVendor,
    isModerator,
    
    // 方法
    login,
    logout,
    fetchProfile,
    updateProfile,
    refreshToken,
    init
  }
}, {
  persist: {
    key: 'user',
    storage: localStorage,
    paths: ['user', 'userProfile', 'token']
  }
})