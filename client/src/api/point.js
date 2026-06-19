import request from '@/utils/request'

export const getPointRecords = (params) => {
  return request({
    url: '/points',
    method: 'get',
    params,
  })
}

export const getMyPointRecords = (params) => {
  return request({
    url: '/points/my',
    method: 'get',
    params,
  })
}

export const getUserPointBalance = (userId) => {
  return request({
    url: `/points/balance${userId ? '/' + userId : ''}`,
    method: 'get',
  })
}

export const adjustPoints = (data) => {
  return request({
    url: '/points/adjust',
    method: 'post',
    data,
  })
}
