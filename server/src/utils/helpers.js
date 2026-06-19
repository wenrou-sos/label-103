const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const generateOrderNo = (prefix = '') => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateTicketCode = () => {
  return `T${dayjs().format('YYYYMMDD')}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};

const generateCardNo = () => {
  return `A${dayjs().format('YYYYMMDD')}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};

const successResponse = (res, data = null, message = '操作成功') => {
  res.json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

const paginate = async (model, options = {}) => {
  const {
    page = 1,
    pageSize = 10,
    where = {},
    include = [],
    order = [['created_at', 'DESC']],
    attributes,
  } = options;

  const offset = (page - 1) * pageSize;

  const { count, rows } = await model.findAndCountAll({
    where,
    include,
    order,
    offset,
    limit: parseInt(pageSize),
    attributes,
    distinct: true,
  });

  return {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(count / pageSize),
  };
};

module.exports = {
  generateOrderNo,
  generateTicketCode,
  generateCardNo,
  successResponse,
  errorResponse,
  paginate,
};
