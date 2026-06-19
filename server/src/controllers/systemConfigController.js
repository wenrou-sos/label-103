const { SystemConfig } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');

const DEFAULT_CONFIG = {
  point_earn_rate: { value: '1', description: '每消费1元获得积分数量', valueType: 'number' },
  point_spend_rate: { value: '100', description: '多少积分抵扣1元', valueType: 'number' },
  point_min_spend: { value: '0', description: '最低使用积分数（0表示不限制）', valueType: 'number' },
};

const getConfigValue = async (key, defaultValue = null) => {
  const config = await SystemConfig.findOne({ where: { key } });
  if (!config) return defaultValue;

  switch (config.valueType) {
    case 'number':
      return config.value === null || config.value === '' ? null : parseFloat(config.value);
    case 'boolean':
      return config.value === 'true';
    case 'json':
      try {
        return JSON.parse(config.value);
      } catch (e) {
        return null;
      }
    default:
      return config.value;
  }
};

const getAllConfigs = async (req, res) => {
  try {
    const configs = await SystemConfig.findAll();

    const result = {};
    configs.forEach((config) => {
      let value = config.value;
      switch (config.valueType) {
        case 'number':
          value = value === null || value === '' ? null : parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = null;
          }
          break;
      }
      result[config.key] = {
        value,
        description: config.description,
        valueType: config.valueType,
      };
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get all configs error:', error);
    errorResponse(res, '获取配置失败', 500);
  }
};

const getPointConfig = async (req, res) => {
  try {
    const keys = ['point_earn_rate', 'point_spend_rate', 'point_min_spend'];
    const configs = await SystemConfig.findAll({
      where: { key: keys },
    });

    const result = {};
    keys.forEach((key) => {
      const config = configs.find((c) => c.key === key);
      if (config) {
        result[key] = {
          value: config.valueType === 'number' ? parseFloat(config.value) : config.value,
          description: config.description,
        };
      } else {
        result[key] = {
          value: parseFloat(DEFAULT_CONFIG[key].value),
          description: DEFAULT_CONFIG[key].description,
        };
      }
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get point config error:', error);
    errorResponse(res, '获取积分配置失败', 500);
  }
};

const updateConfig = async (req, res) => {
  try {
    const { key, value, description, valueType } = req.body;

    if (!key) {
      return errorResponse(res, '配置键名不能为空');
    }

    const config = await SystemConfig.findOne({ where: { key } });
    const oldData = config ? config.toJSON() : null;

    let stringValue = value;
    const type = valueType || (oldData?.valueType || 'string');

    if (type === 'json' && typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else if (type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else {
      stringValue = String(value ?? '');
    }

    let result;
    if (config) {
      config.value = stringValue;
      if (description !== undefined) config.description = description;
      if (valueType !== undefined) config.valueType = valueType;
      await config.save();
      result = config;
    } else {
      result = await SystemConfig.create({
        key,
        value: stringValue,
        description: description || '',
        valueType: type,
      });
    }

    await createAuditLog(req, {
      module: MODULES.SYSTEM,
      action: ACTIONS.UPDATE,
      targetId: key,
      description: `更新系统配置: ${key} = ${stringValue}`,
      oldData,
      newData: result.toJSON(),
    });

    successResponse(res, result, '配置更新成功');
  } catch (error) {
    console.error('Update config error:', error);
    errorResponse(res, '更新配置失败', 500);
  }
};

const batchUpdateConfigs = async (req, res) => {
  try {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
      return errorResponse(res, '配置数据不能为空');
    }

    const keys = Object.keys(configs);
    for (const key of keys) {
      const item = configs[key];
      const value = typeof item === 'object' && item !== null ? item.value : item;
      const description = typeof item === 'object' && item !== null ? item.description : undefined;
      const valueType = typeof item === 'object' && item !== null ? item.valueType : 'string';

      const config = await SystemConfig.findOne({ where: { key } });

      let stringValue = value;
      if (valueType === 'json' && typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else if (valueType === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else {
        stringValue = String(value ?? '');
      }

      if (config) {
        config.value = stringValue;
        if (description !== undefined) config.description = description;
        if (valueType !== undefined) config.valueType = valueType;
        await config.save();
      } else {
        await SystemConfig.create({
          key,
          value: stringValue,
          description: description || '',
          valueType,
        });
      }
    }

    await createAuditLog(req, {
      module: MODULES.SYSTEM,
      action: ACTIONS.UPDATE,
      description: '批量更新系统配置',
      oldData: null,
      newData: { keys },
    });

    successResponse(res, null, '配置更新成功');
  } catch (error) {
    console.error('Batch update configs error:', error);
    errorResponse(res, '批量更新配置失败', 500);
  }
};

const initDefaultConfigs = async () => {
  for (const key of Object.keys(DEFAULT_CONFIG)) {
    const existing = await SystemConfig.findOne({ where: { key } });
    if (!existing) {
      await SystemConfig.create({
        key,
        value: DEFAULT_CONFIG[key].value,
        description: DEFAULT_CONFIG[key].description,
        valueType: DEFAULT_CONFIG[key].valueType,
      });
    }
  }
};

module.exports = {
  getAllConfigs,
  getPointConfig,
  updateConfig,
  batchUpdateConfigs,
  getConfigValue,
  initDefaultConfigs,
};
