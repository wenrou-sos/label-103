require('dotenv').config();
const sequelize = require('../database/config');
const {
  User,
  TicketType,
  AnnualCardType,
  SeasonRule,
  RenewalPackage,
} = require('../models');

const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');

    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: true });
    console.log('数据库表创建完成');

    console.log('正在创建初始数据...');

    await User.create({
      username: 'admin',
      password: 'admin123',
      realName: '系统管理员',
      role: 'admin',
      status: 'active',
      phone: '13800138000',
      email: 'admin@park.com',
    });
    console.log('管理员账户创建成功: admin/admin123');

    await User.create({
      username: 'operator',
      password: 'operator123',
      realName: '操作员',
      role: 'operator',
      status: 'active',
      phone: '13800138001',
    });
    console.log('操作员账户创建成功: operator/operator123');

    await User.create({
      username: 'cashier',
      password: 'cashier123',
      realName: '收银员',
      role: 'cashier',
      status: 'active',
      phone: '13800138002',
    });
    console.log('收银员账户创建成功: cashier/cashier123');

    await TicketType.bulkCreate([
      {
        name: '单日票',
        code: 'single_day',
        description: '单次入园，当日有效',
        type: 'single_day',
        peakPrice: 299.00,
        offPeakPrice: 199.00,
        validDays: 1,
        sortOrder: 1,
        isActive: true,
      },
      {
        name: '两日票',
        code: 'two_day',
        description: '两次入园，两日内有效',
        type: 'two_day',
        peakPrice: 499.00,
        offPeakPrice: 349.00,
        validDays: 2,
        sortOrder: 2,
        isActive: true,
      },
      {
        name: '午后票',
        code: 'afternoon',
        description: '下午2点后入园，当日有效',
        type: 'afternoon',
        peakPrice: 199.00,
        offPeakPrice: 149.00,
        validDays: 1,
        entryTime: '14:00',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: '夜场票',
        code: 'night',
        description: '夜场专属，17:00后入园',
        type: 'night',
        peakPrice: 129.00,
        offPeakPrice: 99.00,
        validDays: 1,
        entryTime: '17:00',
        sortOrder: 4,
        isActive: true,
      },
    ]);
    console.log('门票类型创建完成');

    await AnnualCardType.bulkCreate([
      {
        name: '单人年卡',
        code: 'single',
        description: '单人全年无限次入园，享园区消费9折',
        type: 'single',
        price: 1299.00,
        adultCount: 1,
        childCount: 0,
        validityDays: 365,
        benefits: {
          unlimitedEntry: true,
          memberDiscount: 0.9,
          birthdayFreeGuest: true,
          fastPass: true,
          shopDiscount: 0.9,
          restaurantDiscount: 0.9,
        },
        sortOrder: 1,
        isActive: true,
      },
      {
        name: '亲子年卡',
        code: 'parent_child',
        description: '1成人1儿童全年无限次入园，享园区消费9折',
        type: 'parent_child',
        price: 1999.00,
        adultCount: 1,
        childCount: 1,
        validityDays: 365,
        benefits: {
          unlimitedEntry: true,
          memberDiscount: 0.9,
          birthdayFreeGuest: true,
          fastPass: true,
          shopDiscount: 0.9,
          restaurantDiscount: 0.9,
          childGift: true,
        },
        sortOrder: 2,
        isActive: true,
      },
      {
        name: '家庭年卡',
        code: 'family',
        description: '2成人1儿童全年无限次入园，享园区消费9折',
        type: 'family',
        price: 2999.00,
        adultCount: 2,
        childCount: 1,
        validityDays: 365,
        benefits: {
          unlimitedEntry: true,
          memberDiscount: 0.9,
          birthdayFreeGuest: true,
          fastPass: true,
          shopDiscount: 0.9,
          restaurantDiscount: 0.9,
          familyGift: true,
          freeParking: true,
        },
        sortOrder: 3,
        isActive: true,
      },
    ]);
    console.log('年卡类型创建完成');

    await SeasonRule.bulkCreate([
      {
        name: '旺季-暑假',
        type: 'peak',
        startMonth: 7,
        startDay: 1,
        endMonth: 8,
        endDay: 31,
        description: '7月1日至8月31日为旺季',
        isActive: true,
      },
      {
        name: '旺季-春节',
        type: 'peak',
        startMonth: 2,
        startDay: 1,
        endMonth: 2,
        endDay: 28,
        description: '2月为旺季（春节假期）',
        isActive: true,
      },
      {
        name: '旺季-国庆',
        type: 'peak',
        startMonth: 10,
        startDay: 1,
        endMonth: 10,
        endDay: 7,
        description: '10月1日至7日为旺季（国庆假期）',
        isActive: true,
      },
      {
        name: '淡季-平日',
        type: 'off_peak',
        startMonth: 1,
        startDay: 1,
        endMonth: 1,
        endDay: 31,
        description: '1月为淡季',
        isActive: true,
      },
      {
        name: '淡季-春季',
        type: 'off_peak',
        startMonth: 3,
        startDay: 1,
        endMonth: 6,
        endDay: 30,
        description: '3月至6月为淡季',
        isActive: true,
      },
      {
        name: '淡季-秋季',
        type: 'off_peak',
        startMonth: 9,
        startDay: 1,
        endMonth: 9,
        endDay: 30,
        description: '9月为淡季',
        isActive: true,
      },
      {
        name: '淡季-冬季',
        type: 'off_peak',
        startMonth: 11,
        startDay: 1,
        endMonth: 12,
        endDay: 31,
        description: '11月至12月为淡季',
        isActive: true,
      },
    ]);
    console.log('季节规则创建完成');

    await RenewalPackage.bulkCreate([
      {
        name: '单人年卡续费优惠',
        description: '单人年卡续费享8.5折优惠，额外赠送30天',
        cardTypeId: null,
        originalPrice: 1299.00,
        discountPrice: 1099.00,
        discountRate: 0.85,
        extraDays: 30,
        gifts: [{ name: '园区餐饮券', value: 50 }],
        isActive: true,
        sortOrder: 1,
      },
      {
        name: '亲子年卡续费优惠',
        description: '亲子年卡续费享8折优惠，额外赠送30天',
        cardTypeId: null,
        originalPrice: 1999.00,
        discountPrice: 1599.00,
        discountRate: 0.8,
        extraDays: 30,
        gifts: [{ name: '儿童礼品包', value: 200 }],
        isActive: true,
        sortOrder: 2,
      },
      {
        name: '家庭年卡续费优惠',
        description: '家庭年卡续费享7.5折优惠，额外赠送60天',
        cardTypeId: null,
        originalPrice: 2999.00,
        discountPrice: 2249.00,
        discountRate: 0.75,
        extraDays: 60,
        gifts: [
          { name: '免费停车券', value: 100 },
          { name: '家庭礼品包', value: 300 },
        ],
        isActive: true,
        sortOrder: 3,
      },
    ]);
    console.log('续费套餐创建完成');

    console.log('\n✅ 数据库初始化完成！');
    console.log('\n默认账户：');
    console.log('  管理员: admin / admin123');
    console.log('  操作员: operator / operator123');
    console.log('  收银员: cashier / cashier123');
    console.log('\n请及时修改默认密码！');

    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

initDatabase();
