const { AuditLog, User } = require('../models');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      module,
      action,
      userId,
      startDate,
      endDate,
      keyword,
    } = req.query;

    const where = {};

    if (module) {
      where.module = module;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: dayjs(startDate).startOf('day').toDate(),
        [Op.lte]: dayjs(endDate).endOf('day').toDate(),
      };
    }

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { targetId: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const result = await paginate(AuditLog, {
      page,
      pageSize,
      where,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'realName', 'role'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    errorResponse(res, '获取审计日志失败', 500);
  }
};

const getAuditLogDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'realName', 'role'],
          required: false,
        },
      ],
    });

    if (!log) {
      return errorResponse(res, '审计日志不存在');
    }

    successResponse(res, log);
  } catch (error) {
    console.error('Get audit log detail error:', error);
    errorResponse(res, '获取审计日志详情失败', 500);
  }
};

const getModules = async (req, res) => {
  try {
    const modules = [
      { value: 'user', label: '用户管理' },
      { value: 'ticket_type', label: '票种管理' },
      { value: 'ticket_order', label: '门票订单' },
      { value: 'annual_card', label: '年卡管理' },
      { value: 'card_type', label: '年卡类型' },
      { value: 'renewal_package', label: '续费套餐' },
      { value: 'consumption', label: '消费管理' },
      { value: 'season', label: '季节管理' },
      { value: 'auth', label: '登录认证' },
    ];
    successResponse(res, modules);
  } catch (error) {
    console.error('Get modules error:', error);
    errorResponse(res, '获取模块列表失败', 500);
  }
};

const getActions = async (req, res) => {
  try {
    const actions = [
      { value: 'create', label: '新增' },
      { value: 'update', label: '修改' },
      { value: 'delete', label: '删除' },
      { value: 'refund', label: '退款' },
      { value: 'verify', label: '核销/验票' },
      { value: 'reset_password', label: '重置密码' },
      { value: 'login', label: '登录' },
      { value: 'logout', label: '登出' },
      { value: 'change_status', label: '状态变更' },
    ];
    successResponse(res, actions);
  } catch (error) {
    console.error('Get actions error:', error);
    errorResponse(res, '获取操作类型列表失败', 500);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogDetail,
  getModules,
  getActions,
};
