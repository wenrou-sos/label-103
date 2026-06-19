const { SeasonRule } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { getSeasonType } = require('../utils/business');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');
const dayjs = require('dayjs');

const getSeasonRules = async (req, res) => {
  try {
    const rules = await SeasonRule.findAll({
      order: [['startMonth', 'ASC'], ['startDay', 'ASC']],
    });

    successResponse(res, rules);
  } catch (error) {
    console.error('Get season rules error:', error);
    errorResponse(res, '获取季节规则失败', 500);
  }
};

const createSeasonRule = async (req, res) => {
  try {
    const { name, type, startMonth, startDay, endMonth, endDay, description, isActive } = req.body;

    if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
      return errorResponse(res, '月份必须在1-12之间');
    }

    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      return errorResponse(res, '日期必须在1-31之间');
    }

    const rule = await SeasonRule.create({
      name,
      type,
      startMonth,
      startDay,
      endMonth,
      endDay,
      description,
      isActive,
    });

    await createAuditLog(req, {
      module: MODULES.SEASON,
      action: ACTIONS.CREATE,
      targetId: rule.id,
      description: `创建季节规则: ${name} (${type === 'peak' ? '旺季' : '淡季'})`,
      newData: rule.toJSON(),
    });

    successResponse(res, rule, '季节规则创建成功');
  } catch (error) {
    console.error('Create season rule error:', error);
    errorResponse(res, '创建季节规则失败', 500);
  }
};

const updateSeasonRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const rule = await SeasonRule.findByPk(id);
    if (!rule) {
      return errorResponse(res, '季节规则不存在');
    }

    const oldData = rule.toJSON();

    Object.assign(rule, updateData);
    await rule.save();

    await createAuditLog(req, {
      module: MODULES.SEASON,
      action: ACTIONS.UPDATE,
      targetId: rule.id,
      description: `更新季节规则: ${rule.name}`,
      oldData,
      newData: rule.toJSON(),
    });

    successResponse(res, rule, '季节规则更新成功');
  } catch (error) {
    console.error('Update season rule error:', error);
    errorResponse(res, '更新季节规则失败', 500);
  }
};

const deleteSeasonRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await SeasonRule.findByPk(id);
    if (!rule) {
      return errorResponse(res, '季节规则不存在');
    }

    const oldData = rule.toJSON();
    await rule.destroy();

    await createAuditLog(req, {
      module: MODULES.SEASON,
      action: ACTIONS.DELETE,
      targetId: rule.id,
      description: `删除季节规则: ${rule.name}`,
      oldData,
    });

    successResponse(res, null, '季节规则删除成功');
  } catch (error) {
    console.error('Delete season rule error:', error);
    errorResponse(res, '删除季节规则失败', 500);
  }
};

const getCurrentSeason = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date();
    const seasonType = await getSeasonType(targetDate);

    const seasonNames = {
      peak: '旺季',
      off_peak: '淡季',
    };

    successResponse(res, {
      date: dayjs(targetDate).format('YYYY-MM-DD'),
      seasonType,
      seasonName: seasonNames[seasonType],
    });
  } catch (error) {
    console.error('Get current season error:', error);
    errorResponse(res, '获取当前季节失败', 500);
  }
};

module.exports = {
  getSeasonRules,
  createSeasonRule,
  updateSeasonRule,
  deleteSeasonRule,
  getCurrentSeason,
};
