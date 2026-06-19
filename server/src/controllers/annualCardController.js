const { AnnualCardType, AnnualCard, User, RenewalPackage } = require('../models');
const { successResponse, errorResponse, paginate, generateCardNo, generateOrderNo } = require('../utils/helpers');
const { calculateMemberDiscount, isBirthdayMonth } = require('../utils/business');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');
const dayjs = require('dayjs');
const { Op } = require('sequelize');

const getCardTypes = async (req, res) => {
  try {
    const cardTypes = await AnnualCardType.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });

    successResponse(res, cardTypes);
  } catch (error) {
    console.error('Get card types error:', error);
    errorResponse(res, '获取年卡类型失败', 500);
  }
};

const getAllCardTypes = async (req, res) => {
  try {
    const cardTypes = await AnnualCardType.findAll({
      order: [['sortOrder', 'ASC']],
    });

    successResponse(res, cardTypes);
  } catch (error) {
    console.error('Get all card types error:', error);
    errorResponse(res, '获取年卡类型失败', 500);
  }
};

const createCardType = async (req, res) => {
  try {
    const { name, code, description, type, price, adultCount, childCount, validityDays, benefits, sortOrder, isActive } = req.body;

    const existingType = await AnnualCardType.findOne({ where: { code } });
    if (existingType) {
      return errorResponse(res, '年卡类型编码已存在');
    }

    const cardType = await AnnualCardType.create({
      name,
      code,
      description,
      type,
      price,
      adultCount,
      childCount,
      validityDays,
      benefits,
      sortOrder,
      isActive,
    });

    await createAuditLog(req, {
      module: MODULES.CARD_TYPE,
      action: ACTIONS.CREATE,
      targetId: cardType.id,
      description: `创建年卡类型: ${name} (${code})`,
      newData: cardType.toJSON(),
    });

    successResponse(res, cardType, '年卡类型创建成功');
  } catch (error) {
    console.error('Create card type error:', error);
    errorResponse(res, '创建年卡类型失败', 500);
  }
};

const updateCardType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, price, adultCount, childCount, validityDays, benefits, sortOrder, isActive } = req.body;

    const cardType = await AnnualCardType.findByPk(id);
    if (!cardType) {
      return errorResponse(res, '年卡类型不存在');
    }

    const oldData = cardType.toJSON();

    if (name !== undefined) cardType.name = name;
    if (description !== undefined) cardType.description = description;
    if (type !== undefined) cardType.type = type;
    if (price !== undefined) cardType.price = price;
    if (adultCount !== undefined) cardType.adultCount = adultCount;
    if (childCount !== undefined) cardType.childCount = childCount;
    if (validityDays !== undefined) cardType.validityDays = validityDays;
    if (benefits !== undefined) cardType.benefits = benefits;
    if (sortOrder !== undefined) cardType.sortOrder = sortOrder;
    if (isActive !== undefined) cardType.isActive = isActive;

    await cardType.save();

    await createAuditLog(req, {
      module: MODULES.CARD_TYPE,
      action: ACTIONS.UPDATE,
      targetId: cardType.id,
      description: `更新年卡类型: ${cardType.name} (${cardType.code})`,
      oldData,
      newData: cardType.toJSON(),
    });

    successResponse(res, cardType, '年卡类型更新成功');
  } catch (error) {
    console.error('Update card type error:', error);
    errorResponse(res, '更新年卡类型失败', 500);
  }
};

const deleteCardType = async (req, res) => {
  try {
    const { id } = req.params;

    const cardType = await AnnualCardType.findByPk(id);
    if (!cardType) {
      return errorResponse(res, '年卡类型不存在');
    }

    const oldData = cardType.toJSON();
    await cardType.destroy();

    await createAuditLog(req, {
      module: MODULES.CARD_TYPE,
      action: ACTIONS.DELETE,
      targetId: cardType.id,
      description: `删除年卡类型: ${cardType.name} (${cardType.code})`,
      oldData,
    });

    successResponse(res, null, '年卡类型删除成功');
  } catch (error) {
    console.error('Delete card type error:', error);
    errorResponse(res, '删除年卡类型失败', 500);
  }
};

const purchaseAnnualCard = async (req, res) => {
  try {
    const { cardTypeId, holderName, holderIdCard, holderPhone, holderBirthday, additionalMembers, paymentMethod, balance } = req.body;

    const cardType = await AnnualCardType.findByPk(cardTypeId);
    if (!cardType) {
      return errorResponse(res, '年卡类型不存在');
    }

    const existingCard = await AnnualCard.findOne({
      where: {
        holderIdCard,
        status: { [Op.in]: ['active', 'pending'] },
      },
    });

    if (existingCard) {
      return errorResponse(res, '该身份证已绑定有效年卡');
    }

    const cardNo = generateCardNo();
    const activateDate = new Date();
    const expireDate = dayjs().add(cardType.validityDays, 'day').toDate();

    const paidAmount = parseFloat(cardType.price);

    const annualCard = await AnnualCard.create({
      cardNo,
      userId: req.user?.id || null,
      cardTypeId,
      holderName,
      holderIdCard,
      holderPhone,
      holderBirthday,
      additionalMembers,
      price: cardType.price,
      paidAmount,
      discountAmount: 0,
      status: 'active',
      activateDate,
      expireDate,
      balance: balance || 0,
      paymentMethod: paymentMethod || 'wechat',
      paidAt: new Date(),
    });

    if (req.user && ['admin', 'operator', 'cashier'].includes(req.user.role)) {
      await createAuditLog(req, {
        module: MODULES.ANNUAL_CARD,
        action: ACTIONS.CREATE,
        targetId: annualCard.id,
        description: `新办年卡: 卡号 ${cardNo}, 类型 ${cardType.name}, 持卡人 ${holderName}, 金额 ¥${paidAmount}`,
        newData: annualCard.toJSON(),
      });
    }

    successResponse(res, annualCard, '年卡购买成功');
  } catch (error) {
    console.error('Purchase annual card error:', error);
    errorResponse(res, '年卡购买失败', 500);
  }
};

const getAnnualCards = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword, cardTypeId } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (cardTypeId) {
      where.cardTypeId = cardTypeId;
    }

    if (keyword) {
      where[Op.or] = [
        { cardNo: { [Op.like]: `%${keyword}%` } },
        { holderName: { [Op.like]: `%${keyword}%` } },
        { holderIdCard: { [Op.like]: `%${keyword}%` } },
        { holderPhone: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (req.user.role === 'member') {
      where.userId = req.user.id;
    }

    const result = await paginate(AnnualCard, {
      page,
      pageSize,
      where,
      include: [
        { model: AnnualCardType, as: 'AnnualCardType' },
        { model: User, as: 'User', attributes: ['id', 'username', 'realName'] },
      ],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get annual cards error:', error);
    errorResponse(res, '获取年卡列表失败', 500);
  }
};

const getAnnualCardDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await AnnualCard.findByPk(id, {
      include: [
        { model: AnnualCardType, as: 'AnnualCardType' },
        { model: User, as: 'User', attributes: ['id', 'username', 'realName'] },
      ],
    });

    if (!card) {
      return errorResponse(res, '年卡不存在');
    }

    if (req.user.role === 'member' && card.userId !== req.user.id) {
      return errorResponse(res, '无权查看此年卡', 403);
    }

    const birthdayBenefit = isBirthdayMonth(card.holderBirthday);

    successResponse(res, {
      ...card.toJSON(),
      birthdayBenefit,
      daysRemaining: dayjs(card.expireDate).diff(dayjs(), 'day'),
    });
  } catch (error) {
    console.error('Get annual card detail error:', error);
    errorResponse(res, '获取年卡详情失败', 500);
  }
};

const verifyAnnualCard = async (req, res) => {
  try {
    const { cardNo, idCard } = req.body;

    const card = await AnnualCard.findOne({
      where: { cardNo },
      include: [{ model: AnnualCardType, as: 'AnnualCardType' }],
    });

    if (!card) {
      return errorResponse(res, '年卡号不存在');
    }

    if (card.status !== 'active') {
      return errorResponse(res, '年卡状态异常，请联系工作人员');
    }

    if (dayjs(card.expireDate).isBefore(dayjs())) {
      card.status = 'expired';
      await card.save();
      return errorResponse(res, '年卡已过期');
    }

    if (card.holderIdCard && idCard && card.holderIdCard !== idCard) {
      return errorResponse(res, '身份证信息不匹配');
    }

    const oldData = card.toJSON();

    card.visitCount += 1;
    card.lastVisitDate = new Date();
    await card.save();

    const { VisitorRecord } = require('../models');
    const visitor = await VisitorRecord.create({
      annualCardId: card.id,
      visitorType: 'annual_card',
      visitorName: card.holderName,
      idCard: card.holderIdCard,
      entryTime: new Date(),
      isInPark: true,
      isFastPass: true,
    });

    await createAuditLog(req, {
      module: MODULES.ANNUAL_CARD,
      action: ACTIONS.VERIFY,
      targetId: card.id,
      description: `验证年卡: ${card.cardNo}, 持卡人 ${card.holderName}`,
      oldData,
      newData: card.toJSON(),
    });

    const birthdayBenefit = isBirthdayMonth(card.holderBirthday);

    successResponse(res, {
      card,
      visitor,
      birthdayBenefit,
      benefits: card.AnnualCardType?.benefits,
    }, '年卡验证成功');
  } catch (error) {
    console.error('Verify annual card error:', error);
    errorResponse(res, '年卡验证失败', 500);
  }
};

const rechargeAnnualCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, '充值金额必须大于0');
    }

    const card = await AnnualCard.findByPk(id);
    if (!card) {
      return errorResponse(res, '年卡不存在');
    }

    if (card.status !== 'active') {
      return errorResponse(res, '年卡状态异常，无法充值');
    }

    const oldData = card.toJSON();

    card.balance = parseFloat(card.balance) + parseFloat(amount);
    await card.save();

    await createAuditLog(req, {
      module: MODULES.ANNUAL_CARD,
      action: ACTIONS.UPDATE,
      targetId: card.id,
      description: `年卡充值: ${card.cardNo}, 充值金额 ¥${amount}, 余额 ¥${card.balance}`,
      oldData,
      newData: card.toJSON(),
    });

    successResponse(res, card, '充值成功');
  } catch (error) {
    console.error('Recharge annual card error:', error);
    errorResponse(res, '充值失败', 500);
  }
};

const getRenewalPackages = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, cardTypeId, keyword } = req.query;

    const where = {};
    if (cardTypeId) {
      where.cardTypeId = cardTypeId;
    }
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    const result = await paginate(RenewalPackage, {
      page,
      pageSize,
      where,
      include: [{ model: AnnualCardType, as: 'AnnualCardType' }],
      order: [['sortOrder', 'ASC']],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get renewal packages error:', error);
    errorResponse(res, '获取续费套餐失败', 500);
  }
};

const renewalAnnualCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { packageId } = req.body;

    const card = await AnnualCard.findByPk(id);
    if (!card) {
      return errorResponse(res, '年卡不存在');
    }

    const pkg = await RenewalPackage.findByPk(packageId);
    if (!pkg) {
      return errorResponse(res, '续费套餐不存在');
    }

    const newExpireDate = dayjs(card.expireDate).add(pkg.extraDays + 365, 'day').toDate();

    card.expireDate = newExpireDate;
    card.discountAmount = parseFloat(card.discountAmount) + (parseFloat(pkg.originalPrice) - parseFloat(pkg.discountPrice));
    card.status = 'active';
    card.isRenewalReminded = false;
    await card.save();

    successResponse(res, card, '续费成功');
  } catch (error) {
    console.error('Renewal annual card error:', error);
    errorResponse(res, '续费失败', 500);
  }
};

const createRenewalPackage = async (req, res) => {
  try {
    const { name, description, cardTypeId, originalPrice, discountPrice, discountRate, extraDays, gifts, startDate, endDate, isActive, sortOrder } = req.body;

    const pkg = await RenewalPackage.create({
      name,
      description,
      cardTypeId,
      originalPrice,
      discountPrice,
      discountRate,
      extraDays,
      gifts,
      startDate,
      endDate,
      isActive,
      sortOrder,
    });

    await createAuditLog(req, {
      module: MODULES.RENEWAL_PACKAGE,
      action: ACTIONS.CREATE,
      targetId: pkg.id,
      description: `创建续费套餐: ${name}`,
      newData: pkg.toJSON(),
    });

    successResponse(res, pkg, '续费套餐创建成功');
  } catch (error) {
    console.error('Create renewal package error:', error);
    errorResponse(res, '创建续费套餐失败', 500);
  }
};

const updateRenewalPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const pkg = await RenewalPackage.findByPk(id);
    if (!pkg) {
      return errorResponse(res, '续费套餐不存在');
    }

    const oldData = pkg.toJSON();

    Object.assign(pkg, updateData);
    await pkg.save();

    await createAuditLog(req, {
      module: MODULES.RENEWAL_PACKAGE,
      action: ACTIONS.UPDATE,
      targetId: pkg.id,
      description: `更新续费套餐: ${pkg.name}`,
      oldData,
      newData: pkg.toJSON(),
    });

    successResponse(res, pkg, '续费套餐更新成功');
  } catch (error) {
    console.error('Update renewal package error:', error);
    errorResponse(res, '更新续费套餐失败', 500);
  }
};

const deleteRenewalPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await RenewalPackage.findByPk(id);
    if (!pkg) {
      return errorResponse(res, '续费套餐不存在');
    }

    const oldData = pkg.toJSON();
    await pkg.destroy();

    await createAuditLog(req, {
      module: MODULES.RENEWAL_PACKAGE,
      action: ACTIONS.DELETE,
      targetId: pkg.id,
      description: `删除续费套餐: ${pkg.name}`,
      oldData,
    });

    successResponse(res, null, '续费套餐删除成功');
  } catch (error) {
    console.error('Delete renewal package error:', error);
    errorResponse(res, '删除续费套餐失败', 500);
  }
};

const getMyCards = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;

    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    const result = await paginate(AnnualCard, {
      page,
      pageSize,
      where,
      include: [{ model: AnnualCardType, as: 'AnnualCardType' }],
      order: [['createdAt', 'DESC']],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get my cards error:', error);
    errorResponse(res, '获取我的年卡失败', 500);
  }
};

const bindWristband = async (req, res) => {
  try {
    const { id } = req.params;
    const { wristbandId } = req.body;

    const card = await AnnualCard.findByPk(id);
    if (!card) {
      return errorResponse(res, '年卡不存在');
    }

    if (card.status !== 'active') {
      return errorResponse(res, '年卡状态异常，无法绑定手环');
    }

    const oldData = card.toJSON();

    card.wristbandId = wristbandId;
    await card.save();

    await createAuditLog(req, {
      module: MODULES.ANNUAL_CARD,
      action: ACTIONS.UPDATE,
      targetId: card.id,
      description: `绑定手环: 年卡 ${card.cardNo} 绑定手环 ${wristbandId}`,
      oldData,
      newData: card.toJSON(),
    });

    successResponse(res, card, '手环绑定成功');
  } catch (error) {
    console.error('Bind wristband error:', error);
    errorResponse(res, '绑定手环失败', 500);
  }
};

module.exports = {
  getCardTypes,
  getAllCardTypes,
  createCardType,
  updateCardType,
  deleteCardType,
  purchaseAnnualCard,
  getAnnualCards,
  getAnnualCardDetail,
  verifyAnnualCard,
  rechargeAnnualCard,
  getRenewalPackages,
  renewalAnnualCard,
  createRenewalPackage,
  updateRenewalPackage,
  deleteRenewalPackage,
  getMyCards,
  bindWristband,
};
