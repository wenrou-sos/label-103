import request from '@/utils/request'

export const getAllConfigs = () => {
  return request({
    url: '/system-config',
    method: 'get',
  })
}

export const getPointConfig = () => {
  return request({
    url: '/system-config/points',
    method: 'get',
  })
}

export const updateConfig = (data) => {
  return request({
    url: '/system-config',
    method: 'put',
    data,
  })
}

export const batchUpdateConfigs = (data) => {
  return request({
    url: '/system-config/batch',
    method: 'put',
    data,
  })
}
