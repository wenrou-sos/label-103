const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const AmusementProject = sequelize.define('AmusementProject', {
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
  category: {
    type: DataTypes.ENUM('thrill', 'family', 'children', 'water', 'show', 'other'),
    allowNull: false,
    defaultValue: 'other',
    comment: '项目类别: 刺激类/家庭类/儿童类/水上类/演出类/其他',
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '项目位置',
  },
  minHeight: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: true,
    comment: '最低身高要求(cm)，null表示无限制',
  },
  maxHeight: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: true,
    comment: '最高身高限制(cm)，null表示无限制',
  },
  minAge: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '最低年龄要求，null表示无限制',
  },
  maxAge: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '最高年龄限制，null表示无限制',
  },
  isCharged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否额外收费',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '单次收费金额',
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '单次游玩时长(分钟)',
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '单次承载人数',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '注意事项',
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

module.exports = AmusementProject;
