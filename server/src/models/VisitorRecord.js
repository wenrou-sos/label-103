const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const VisitorRecord = sequelize.define('VisitorRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticketOrderId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  annualCardId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  visitorType: {
    type: DataTypes.ENUM('ticket', 'annual_card', 'staff', 'guest'),
    allowNull: false,
    comment: '游客类型',
  },
  visitorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
  },
  entryTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '入园时间',
  },
  exitTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '出园时间',
  },
  isInPark: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否在园内',
  },
  entryGate: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '入园闸机',
  },
  exitGate: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '出园闸机',
  },
  wristbandId: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  isFastPass: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否快速通道',
  },
  temperature: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true,
    comment: '体温',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = VisitorRecord;
