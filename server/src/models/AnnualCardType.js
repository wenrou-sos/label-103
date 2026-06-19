const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const AnnualCardType = sequelize.define('AnnualCardType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('single', 'parent_child', 'family'),
    allowNull: false,
    comment: '单人/亲子/家庭',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  adultCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '成人数',
  },
  childCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '儿童数',
  },
  validityDays: {
    type: DataTypes.INTEGER,
    defaultValue: 365,
    comment: '有效天数',
  },
  benefits: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '权益配置',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = AnnualCardType;
