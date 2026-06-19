import request from '@/utils/request'

export const getDashboardStats = () => {
  return request({
    url: '/statistics/dashboard',
    method: 'get',
  })
}

export const getSalesStatistics = (params) => {
  return request({
    url: '/statistics/sales',
    method: 'get',
    params,
  })
}

export const getTicketTypeStatistics = (params) => {
  return request({
    url: '/statistics/ticket-types',
    method: 'get',
    params,
  })
}

export const getCardTypeStatistics = () => {
  return request({
    url: '/statistics/card-types',
    method: 'get',
  })
}

export const getConsumptionCategoryStatistics = (params) => {
  return request({
    url: '/statistics/consumption-categories',
    method: 'get',
    params,
  })
}

export const getExpiringCards = (params) => {
  return request({
    url: '/statistics/expiring-cards',
    method: 'get',
    params,
  })
}
