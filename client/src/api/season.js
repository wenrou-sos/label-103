import request from '@/utils/request'

export const getSeasonRules = () => {
  return request({
    url: '/seasons',
    method: 'get',
  })
}

export const getCurrentSeason = (params) => {
  return request({
    url: '/seasons/current',
    method: 'get',
    params,
  })
}

export const createSeasonRule = (data) => {
  return request({
    url: '/seasons',
    method: 'post',
    data,
  })
}

export const updateSeasonRule = (id, data) => {
  return request({
    url: `/seasons/${id}`,
    method: 'put',
    data,
  })
}

export const deleteSeasonRule = (id) => {
  return request({
    url: `/seasons/${id}`,
    method: 'delete',
  })
}
