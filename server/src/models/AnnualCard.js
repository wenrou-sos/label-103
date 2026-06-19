const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const AnnualCard = sequelize.define('AnnualCard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cardNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  cardTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  holderName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '持卡人姓名',
  },
  holderIdCard: {
    type: DataTypes.STRING(18),
    allowNull: false,
    comment: '持卡人身份证',
  },
  holderPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  holderBirthday: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '持卡人生日',
  },
  additionalMembers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '其他成员信息（亲子/家庭卡）',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'frozen', 'expired', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
  },
  activateDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '激活日期',
  },
  expireDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '到期日期',
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '卡内余额',
  },
  totalConsumption: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '累计消费',
  },
  visitCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '入园次数',
  },
  lastVisitDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最近一次入园时间',
  },
  wristbandId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '手环ID',
  },
  isRenewalReminded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已发送续费提醒',
  },
  paymentMethod: {
    type: DataTypes.ENUM('wechat', 'alipay', 'cash', 'card'),
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = AnnualCard;
