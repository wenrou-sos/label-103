import request from '@/utils/request'

export const getUsers = (params) => {
  return request({
    url: '/users',
    method: 'get',
    params,
  })
}

export const getUserDetail = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'get',
  })
}

export const createUser = (data) => {
  return request({
    url: '/users',
    method: 'post',
    data,
  })
}

export const updateUser = (id, data) => {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data,
  })
}

export const deleteUser = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'delete',
  })
}

export const resetPassword = (id, data) => {
  return request({
    url: `/users/${id}/reset-password`,
    method: 'post',
    data,
  })
}

export const updateUserStatus = (id, data) => {
  return request({
    url: `/users/${id}/status`,
    method: 'put',
    data,
  })
}
