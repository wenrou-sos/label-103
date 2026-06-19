const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const PointRecord = sequelize.define('PointRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID',
  },
  type: {
    type: DataTypes.ENUM('earn', 'spend', 'refund', 'adjust'),
    allowNull: false,
    comment: '积分类型：earn获取/spend消费/refund退款/adjust调整',
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '积分变动值（正数增加，负数减少）',
  },
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '变动后余额',
  },
  sourceType: {
    type: DataTypes.ENUM('consumption', 'refund', 'admin_adjust', 'annual_card', 'other'),
    allowNull: true,
    comment: '来源类型：消费/退款/管理员调整/年卡/其他',
  },
  sourceId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联记录ID',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '变动描述',
  },
  operatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '操作员ID',
  },
  remarks: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
});

module.exports = PointRecord;
