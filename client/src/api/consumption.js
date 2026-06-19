import request from '@/utils/request'

export const createConsumption = (data) => {
  return request({
    url: '/consumptions',
    method: 'post',
    data,
  })
}

export const getConsumptionRecords = (params) => {
  return request({
    url: '/consumptions',
    method: 'get',
    params,
  })
}

export const getMyConsumptions = (params) => {
  return request({
    url: '/consumptions/my',
    method: 'get',
    params,
  })
}

export const getConsumptionDetail = (id) => {
  return request({
    url: `/consumptions/${id}`,
    method: 'get',
  })
}

export const settleConsumption = (id, data) => {
  return request({
    url: `/consumptions/${id}/settle`,
    method: 'post',
    data,
  })
}

export const settleByWristband = (data) => {
  return request({
    url: '/consumptions/settle/wristband',
    method: 'post',
    data,
  })
}

export const refundConsumption = (id, data) => {
  return request({
    url: `/consumptions/${id}/refund`,
    method: 'post',
    data,
  })
}
