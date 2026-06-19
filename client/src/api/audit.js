import request from '@/utils/request'

export const getAuditLogs = (params) => {
  return request({
    url: '/audit-logs',
    method: 'get',
    params,
  })
}

export const getAuditLogDetail = (id) => {
  return request({
    url: `/audit-logs/${id}`,
    method: 'get',
  })
}

export const getAuditModules = () => {
  return request({
    url: '/audit-logs/modules',
    method: 'get',
  })
}

export const getAuditActions = () => {
  return request({
    url: '/audit-logs/actions',
    method: 'get',
  })
}
