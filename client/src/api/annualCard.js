import request from '@/utils/request'

export const getCardTypes = () => {
  return request({
    url: '/annual-cards/types',
    method: 'get',
  })
}

export const getAllCardTypes = () => {
  return request({
    url: '/annual-cards/types/all',
    method: 'get',
  })
}

export const createCardType = (data) => {
  return request({
    url: '/annual-cards/types',
    method: 'post',
    data,
  })
}

export const updateCardType = (id, data) => {
  return request({
    url: `/annual-cards/types/${id}`,
    method: 'put',
    data,
  })
}

export const deleteCardType = (id) => {
  return request({
    url: `/annual-cards/types/${id}`,
    method: 'delete',
  })
}

export const purchaseAnnualCard = (data) => {
  return request({
    url: '/annual-cards/purchase',
    method: 'post',
    data,
  })
}

export const getAnnualCards = (params) => {
  return request({
    url: '/annual-cards',
    method: 'get',
    params,
  })
}

export const getMyCards = () => {
  return request({
    url: '/annual-cards/my',
    method: 'get',
  })
}

export const getAnnualCardDetail = (id) => {
  return request({
    url: `/annual-cards/${id}`,
    method: 'get',
  })
}

export const verifyAnnualCard = (data) => {
  return request({
    url: '/annual-cards/verify',
    method: 'post',
    data,
  })
}

export const rechargeAnnualCard = (id, data) => {
  return request({
    url: `/annual-cards/${id}/recharge`,
    method: 'post',
    data,
  })
}

export const getRenewalPackages = (params) => {
  return request({
    url: '/annual-cards/renewal/packages',
    method: 'get',
    params,
  })
}

export const createRenewalPackage = (data) => {
  return request({
    url: '/annual-cards/renewal/packages',
    method: 'post',
    data,
  })
}

export const updateRenewalPackage = (id, data) => {
  return request({
    url: `/annual-cards/renewal/packages/${id}`,
    method: 'put',
    data,
  })
}

export const deleteRenewalPackage = (id) => {
  return request({
    url: `/annual-cards/renewal/packages/${id}`,
    method: 'delete',
  })
}

export const renewalAnnualCard = (id, data) => {
  return request({
    url: `/annual-cards/${id}/renewal`,
    method: 'post',
    data,
  })
}

export const bindWristband = (id, data) => {
  return request({
    url: `/annual-cards/${id}/bind-wristband`,
    method: 'post',
    data,
  })
}
