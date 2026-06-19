import request from '@/utils/request'

export const getTicketTypes = () => {
  return request({
    url: '/tickets/types',
    method: 'get',
  })
}

export const getAllTicketTypes = () => {
  return request({
    url: '/tickets/types/all',
    method: 'get',
  })
}

export const createTicketType = (data) => {
  return request({
    url: '/tickets/types',
    method: 'post',
    data,
  })
}

export const updateTicketType = (id, data) => {
  return request({
    url: `/tickets/types/${id}`,
    method: 'put',
    data,
  })
}

export const deleteTicketType = (id) => {
  return request({
    url: `/tickets/types/${id}`,
    method: 'delete',
  })
}

export const calculatePrice = (data) => {
  return request({
    url: '/tickets/calculate',
    method: 'post',
    data,
  })
}

export const createTicketOrder = (data) => {
  return request({
    url: '/tickets/orders',
    method: 'post',
    data,
  })
}

export const getTicketOrders = (params) => {
  return request({
    url: '/tickets/orders',
    method: 'get',
    params,
  })
}

export const getTicketOrderDetail = (id) => {
  return request({
    url: `/tickets/orders/${id}`,
    method: 'get',
  })
}

export const verifyTicket = (data) => {
  return request({
    url: '/tickets/verify',
    method: 'post',
    data,
  })
}

export const refundTicket = (id) => {
  return request({
    url: `/tickets/orders/${id}/refund`,
    method: 'post',
  })
}
