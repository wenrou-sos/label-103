const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const RenewalPackage = sequelize.define('RenewalPackage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cardTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountRate: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    comment: '折扣率',
  },
  extraDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '额外赠送天数',
  },
  gifts: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '赠送礼品',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = RenewalPackage;
