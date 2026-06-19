import request from '@/utils/request'

export const getAmusementProjects = (params) => {
  return request({
    url: '/amusement-projects',
    method: 'get',
    params,
  })
}

export const getActiveAmusementProjects = () => {
  return request({
    url: '/amusement-projects/active',
    method: 'get',
  })
}

export const getAmusementProjectDetail = (id) => {
  return request({
    url: `/amusement-projects/${id}`,
    method: 'get',
  })
}

export const createAmusementProject = (data) => {
  return request({
    url: '/amusement-projects',
    method: 'post',
    data,
  })
}

export const updateAmusementProject = (id, data) => {
  return request({
    url: `/amusement-projects/${id}`,
    method: 'put',
    data,
  })
}

export const deleteAmusementProject = (id) => {
  return request({
    url: `/amusement-projects/${id}`,
    method: 'delete',
  })
}

export const checkProjectAccess = (id, params) => {
  return request({
    url: `/amusement-projects/${id}/check-access`,
    method: 'get',
    params,
  })
}

export const checkAllAccess = (params) => {
  return request({
    url: '/amusement-projects/check-access',
    method: 'get',
    params,
  })
}
