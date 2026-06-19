const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const TicketOrder = sequelize.define('TicketOrder', {
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
  ticketTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  usedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已使用票数',
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  actualAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  isEarlyBird: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否早鸟票',
  },
  seasonType: {
    type: DataTypes.ENUM('peak', 'off_peak'),
    allowNull: false,
    comment: '旺季/淡季',
  },
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '入园日期',
  },
  visitorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  visitorPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  visitorIdCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'used', 'refunded', 'cancelled', 'expired'),
    defaultValue: 'pending',
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('wechat', 'alipay', 'cash', 'card'),
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refundReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '退款原因',
  },
  qrCode: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '入园二维码',
  },
  ticketCode: {
    type: DataTypes.STRING(32),
    allowNull: true,
    unique: true,
    comment: '票号',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = TicketOrder;
