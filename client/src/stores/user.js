import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const userName = computed(() => userInfo.value?.realName || userInfo.value?.username || '')

  const login = async (credentials) => {
    const result = await loginApi(credentials)
    token.value = result.token
    userInfo.value = result.user
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
    return result
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (e) {
      // ignore
    }
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchUserInfo = async () => {
    const result = await getCurrentUser()
    userInfo.value = result.user
    localStorage.setItem('user', JSON.stringify(result.user))
    return result.user
  }

  const updateUserInfo = (user) => {
    userInfo.value = user
    localStorage.setItem('user', JSON.stringify(user))
  }

  const hasRole = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    return roles.includes(userRole.value)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userRole,
    userName,
    login,
    logout,
    fetchUserInfo,
    updateUserInfo,
    hasRole,
  }
})
