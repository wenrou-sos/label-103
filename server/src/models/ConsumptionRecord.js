const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const ConsumptionRecord = sequelize.define('ConsumptionRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  annualCardId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '年卡ID',
  },
  ticketOrderId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '门票订单ID',
  },
  wristbandId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '手环ID',
  },
  category: {
    type: DataTypes.ENUM('shop', 'restaurant', 'attraction', 'other'),
    allowNull: false,
    comment: '消费类型：商店/餐饮/游乐项目/其他',
  },
  merchantName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商户/项目名称',
  },
  merchantId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  items: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '消费明细',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '折扣金额',
  },
  actualAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  memberDiscount: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    comment: '会员折扣率',
  },
  pointsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用积分数量',
  },
  pointsAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '积分抵扣金额',
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '获得积分数量',
  },
  paymentMethod: {
    type: DataTypes.ENUM('wristband', 'qrcode', 'cash', 'annual_card'),
    allowNull: false,
    comment: '支付方式：手环/扫码/现金/年卡扣款',
  },
  settlementStatus: {
    type: DataTypes.ENUM('pending', 'settled', 'refunded'),
    defaultValue: 'pending',
    comment: '结算状态',
  },
  settledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  operatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '操作员ID',
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '消费地点',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = ConsumptionRecord;
