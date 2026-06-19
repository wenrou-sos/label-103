const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '配置键名',
  },
  value: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '配置值',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '配置说明',
  },
  valueType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
    comment: '值类型',
  },
});

module.exports = SystemConfig;
