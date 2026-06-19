const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const TicketType = sequelize.define('TicketType', {
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
    type: DataTypes.ENUM('single_day', 'two_day', 'afternoon', 'night'),
    allowNull: false,
  },
  peakPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '旺季价格',
  },
  offPeakPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '淡季价格',
  },
  validDays: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '门票有效期天数',
  },
  entryTime: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '可入园时间，如 14:00 表示下午2点后',
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

module.exports = TicketType;
