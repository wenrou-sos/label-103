import request from '@/utils/request'

export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

export const register = (data) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  })
}

export const getCurrentUser = () => {
  return request({
    url: '/auth/me',
    method: 'get',
  })
}

export const updateProfile = (data) => {
  return request({
    url: '/auth/profile',
    method: 'put',
    data,
  })
}

export const changePassword = (data) => {
  return request({
    url: '/auth/password',
    method: 'put',
    data,
  })
}

export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}
