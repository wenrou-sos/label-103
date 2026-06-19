const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  realName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'operator', 'cashier', 'member'),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作类型: create, update, delete, refund, verify, reset_password, login, logout',
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作模块: user, ticket_type, ticket_order, annual_card, card_type, renewal_package, consumption, season, auth',
  },
  targetId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '操作目标ID',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作描述',
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '修改前数据',
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '修改后数据',
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  paranoid: false,
  indexes: [
    { fields: ['created_at'] },
    { fields: ['user_id'] },
    { fields: ['module', 'action'] },
  ],
});

AuditLog.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  return values;
};

module.exports = AuditLog;
