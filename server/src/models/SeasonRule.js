const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const SeasonRule = sequelize.define('SeasonRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('peak', 'off_peak'),
    allowNull: false,
    comment: '旺季/淡季',
  },
  startMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '开始月份',
  },
  startDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '开始日期',
  },
  endMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '结束月份',
  },
  endDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '结束日期',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = SeasonRule;
