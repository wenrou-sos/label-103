import request from '@/utils/request'

export const getCurrentVisitorCount = () => {
  return request({
    url: '/visitors/current',
    method: 'get',
  })
}

export const getVisitorRecords = (params) => {
  return request({
    url: '/visitors/records',
    method: 'get',
    params,
  })
}

export const getTodayStatistics = () => {
  return request({
    url: '/visitors/today',
    method: 'get',
  })
}

export const getHourlyTrend = (params) => {
  return request({
    url: '/visitors/hourly-trend',
    method: 'get',
    params,
  })
}

export const getDailyTrend = (params) => {
  return request({
    url: '/visitors/daily-trend',
    method: 'get',
    params,
  })
}

export const visitorExit = (id, data) => {
  return request({
    url: `/visitors/${id}/exit`,
    method: 'post',
    data,
  })
}
