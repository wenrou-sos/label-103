const { ConsumptionRecord, AnnualCard, User, TicketOrder, PointRecord, SystemConfig } = require('../models');
const { successResponse, errorResponse, paginate, generateOrderNo } = require('../utils/helpers');
const { calculateMemberDiscount } = require('../utils/business');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');
const { Op, sequelize } = require('sequelize');

const getPointConfig = async () => {
  const configs = await SystemConfig.findAll({
    where: { key: ['point_earn_rate', 'point_spend_rate', 'point_min_spend'] },
  });

  const getVal = (key, defaultVal) => {
    const c = configs.find((c) => c.key === key);
    if (!c) return defaultVal;
    const val = parseFloat(c.value);
    return isNaN(val) ? defaultVal : val;
  };

  return {
    earnRate: getVal('point_earn_rate', 1),
    spendRate: getVal('point_spend_rate', 100),
    minSpend: getVal('point_min_spend', 0),
  };
};

const createConsumption = async (req, res) => {
  try {
    const {
      cardId,
      wristbandId,
      ticketOrderId,
      category,
      merchantName,
      merchantId,
      items,
      totalAmount,
      paymentMethod,
      location,
      remarks,
      usePoints = false,
      pointsToUse = 0,
      userId,
    } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return errorResponse(res, '消费金额必须大于0');
    }

    let annualCard = null;
    let targetUserId = userId || null;
    let memberDiscount = null;
    let discountAmount = 0;
    let actualAmount = parseFloat(totalAmount);
    let pointsDeducted = 0;
    let pointsAmount = 0;

    const pointConfig = await getPointConfig();

    if (cardId) {
      annualCard = await AnnualCard.findByPk(cardId);
      if (!annualCard) {
        return errorResponse(res, '年卡不存在');
      }
      if (annualCard.status !== 'active') {
        return errorResponse(res, '年卡状态异常');
      }
      targetUserId = annualCard.userId;

      const discountResult = calculateMemberDiscount(actualAmount);
      memberDiscount = discountResult.discountRate;
      discountAmount = discountResult.discountAmount;
      actualAmount = discountResult.actualAmount;
    }

    let user = null;
    if (targetUserId) {
      user = await User.findByPk(targetUserId);
    }

    if (usePoints && user) {
      const availablePoints = user.points || 0;
      const usePointsNum = parseInt(pointsToUse) || 0;

      if (usePointsNum <= 0) {
        return errorResponse(res, '使用积分数量必须大于0');
      }
      if (usePointsNum > availablePoints) {
        return errorResponse(res, '积分不足');
      }
      if (pointConfig.minSpend > 0 && usePointsNum < pointConfig.minSpend) {
        return errorResponse(res, `最少需要使用${pointConfig.minSpend}积分`);
      }

      pointsDeducted = usePointsNum;
      pointsAmount = parseFloat((usePointsNum / pointConfig.spendRate).toFixed(2));

      if (pointsAmount > actualAmount) {
        pointsDeducted = Math.floor(actualAmount * pointConfig.spendRate);
        pointsAmount = parseFloat((pointsDeducted / pointConfig.spendRate).toFixed(2));
      }

      actualAmount = parseFloat((actualAmount - pointsAmount).toFixed(2));
      if (actualAmount < 0) actualAmount = 0;
      discountAmount = parseFloat((discountAmount + pointsAmount).toFixed(2));
    }

    const t = await sequelize.transaction();

    try {
      if (annualCard && paymentMethod === 'annual_card') {
        if (parseFloat(annualCard.balance) < actualAmount) {
          await t.rollback();
          return errorResponse(res, '年卡余额不足');
        }
        annualCard.balance = parseFloat(annualCard.balance) - actualAmount;
        annualCard.totalConsumption = parseFloat(annualCard.totalConsumption) + actualAmount;
        await annualCard.save({ transaction: t });
      }

      const orderNo = generateOrderNo('CS');

      const record = await ConsumptionRecord.create({
        orderNo,
        userId: targetUserId,
        annualCardId: cardId || null,
        ticketOrderId: ticketOrderId || null,
        wristbandId: wristbandId || null,
        category,
        merchantName,
        merchantId,
        items,
        totalAmount,
        discountAmount,
        actualAmount,
        memberDiscount,
        pointsUsed: pointsDeducted,
        pointsAmount,
        paymentMethod,
        settlementStatus: paymentMethod === 'wristband' ? 'pending' : 'settled',
        settledAt: paymentMethod !== 'wristband' ? new Date() : null,
        operatorId: req.user?.id || null,
        location,
        remarks,
      }, { transaction: t });

      let earnedPoints = 0;
      if (user && record.settlementStatus === 'settled' && actualAmount > 0) {
        earnedPoints = Math.floor(actualAmount * pointConfig.earnRate);

        const currentPoints = user.points || 0;
        const newPoints = currentPoints - pointsDeducted + earnedPoints;

        user.points = newPoints;
        await user.save({ transaction: t });

        if (pointsDeducted > 0) {
          await PointRecord.create({
            userId: targetUserId,
            type: 'spend',
            points: -pointsDeducted,
            balance: currentPoints - pointsDeducted,
            sourceType: 'consumption',
            sourceId: record.id,
            description: `消费抵扣 ${pointsDeducted}积分，抵扣${pointsAmount}元`,
            operatorId: req.user?.id || null,
          }, { transaction: t });
        }

        if (earnedPoints > 0) {
          await PointRecord.create({
            userId: targetUserId,
            type: 'earn',
            points: earnedPoints,
            balance: newPoints,
            sourceType: 'consumption',
            sourceId: record.id,
            description: `消费获得 ${earnedPoints}积分`,
            operatorId: req.user?.id || null,
          }, { transaction: t });
        }
      }

      await t.commit();

      const resultData = record.toJSON();
      resultData.earnedPoints = earnedPoints;
      resultData.pointsDeducted = pointsDeducted;
      resultData.userPoints = user ? user.points : 0;

      await createAuditLog(req, {
        module: MODULES.CONSUMPTION,
        action: ACTIONS.CREATE,
        targetId: record.id,
        description: `创建消费记录: 订单号 ${record.orderNo}, 金额 ¥${record.actualAmount}, 商户 ${merchantName || '-'}${pointsDeducted > 0 ? `, 使用积分${pointsDeducted}` : ''}${earnedPoints > 0 ? `, 获得积分${earnedPoints}` : ''}`,
        newData: resultData,
      });

      successResponse(res, resultData, '消费记录创建成功');
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (error) {
    console.error('Create consumption error:', error);
    errorResponse(res, '创建消费记录失败', 500);
  }
};

const getConsumptionRecords = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      category,
      paymentMethod,
      settlementStatus,
      startDate,
      endDate,
      keyword,
      cardId,
      userId,
    } = req.query;

    const where = {};

    if (category) where.category = category;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (settlementStatus) where.settlementStatus = settlementStatus;
    if (cardId) where.annualCardId = cardId;
    if (userId) where.userId = userId;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (keyword) {
      where[Op.or] = [
        { orderNo: { [Op.like]: `%${keyword}%` } },
        { merchantName: { [Op.like]: `%${keyword}%` } },
        { wristbandId: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (req.user.role === 'member') {
      where.userId = req.user.id;
    }

    const result = await paginate(ConsumptionRecord, {
      page,
      pageSize,
      where,
      include: [
        { model: AnnualCard, as: 'AnnualCard', attributes: ['id', 'cardNo', 'holderName'] },
        { model: User, as: 'User', attributes: ['id', 'username', 'realName'] },
      ],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get consumption records error:', error);
    errorResponse(res, '获取消费记录失败', 500);
  }
};

const getConsumptionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ConsumptionRecord.findByPk(id, {
      include: [
        { model: AnnualCard, as: 'AnnualCard' },
        { model: User, as: 'User', attributes: ['id', 'username', 'realName'] },
      ],
    });

    if (!record) {
      return errorResponse(res, '消费记录不存在');
    }

    if (req.user.role === 'member' && record.userId !== req.user.id) {
      return errorResponse(res, '无权查看此记录', 403);
    }

    successResponse(res, record);
  } catch (error) {
    console.error('Get consumption detail error:', error);
    errorResponse(res, '获取消费详情失败', 500);
  }
};

const settleConsumption = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const record = await ConsumptionRecord.findByPk(id);
    if (!record) {
      return errorResponse(res, '消费记录不存在');
    }

    if (record.settlementStatus !== 'pending') {
      return errorResponse(res, '该消费记录已结算');
    }

    const oldData = record.toJSON();

    const t = await sequelize.transaction();

    try {
      record.settlementStatus = 'settled';
      record.settledAt = new Date();
      if (paymentMethod) {
        record.paymentMethod = paymentMethod;
      }

      let earnedPoints = 0;
      if (record.userId && record.actualAmount > 0) {
        const user = await User.findByPk(record.userId);
        if (user) {
          const pointConfig = await getPointConfig();
          earnedPoints = Math.floor(parseFloat(record.actualAmount) * pointConfig.earnRate);

          const currentPoints = user.points || 0;
          user.points = currentPoints + earnedPoints;
          await user.save({ transaction: t });

          record.pointsEarned = earnedPoints;

          await PointRecord.create({
            userId: record.userId,
            type: 'earn',
            points: earnedPoints,
            balance: user.points,
            sourceType: 'consumption',
            sourceId: record.id,
            description: `消费结算获得 ${earnedPoints}积分`,
            operatorId: req.user?.id || null,
          }, { transaction: t });
        }
      }

      await record.save({ transaction: t });
      await t.commit();

      const newData = record.toJSON();

      await createAuditLog(req, {
        module: MODULES.CONSUMPTION,
        action: ACTIONS.UPDATE,
        targetId: record.id,
        description: `结算消费: 订单号 ${record.orderNo}, 金额 ¥${record.actualAmount}${earnedPoints > 0 ? `, 获得积分${earnedPoints}` : ''}`,
        oldData,
        newData,
      });

      successResponse(res, newData, '结算成功');
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (error) {
    console.error('Settle consumption error:', error);
    errorResponse(res, '结算失败', 500);
  }
};

const settleByWristband = async (req, res) => {
  try {
    const { wristbandId, paymentMethod } = req.body;

    const records = await ConsumptionRecord.findAll({
      where: {
        wristbandId,
        settlementStatus: 'pending',
      },
    });

    if (records.length === 0) {
      return errorResponse(res, '该手环暂无待结算消费');
    }

    const pointConfig = await getPointConfig();
    let totalAmount = 0;

    const t = await sequelize.transaction();

    try {
      for (const record of records) {
        totalAmount += parseFloat(record.actualAmount);
        record.settlementStatus = 'settled';
        record.settledAt = new Date();
        if (paymentMethod) {
          record.paymentMethod = paymentMethod;
        }

        if (record.userId && record.actualAmount > 0) {
          const user = await User.findByPk(record.userId);
          if (user) {
            const earnedPoints = Math.floor(parseFloat(record.actualAmount) * pointConfig.earnRate);
            const currentPoints = user.points || 0;
            user.points = currentPoints + earnedPoints;
            await user.save({ transaction: t });

            record.pointsEarned = earnedPoints;

            await PointRecord.create({
              userId: record.userId,
              type: 'earn',
              points: earnedPoints,
              balance: user.points,
              sourceType: 'consumption',
              sourceId: record.id,
              description: `消费结算获得 ${earnedPoints}积分`,
              operatorId: req.user?.id || null,
            }, { transaction: t });
          }
        }

        await record.save({ transaction: t });
      }

      await t.commit();

      successResponse(res, {
        records,
        totalAmount,
        count: records.length,
      }, '结算成功');
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (error) {
    console.error('Settle by wristband error:', error);
    errorResponse(res, '结算失败', 500);
  }
};

const refundConsumption = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const record = await ConsumptionRecord.findByPk(id);
    if (!record) {
      return errorResponse(res, '消费记录不存在');
    }

    if (record.settlementStatus === 'refunded') {
      return errorResponse(res, '该消费记录已退款');
    }

    const t = await sequelize.transaction();

    try {
      if (record.annualCardId && record.paymentMethod === 'annual_card') {
        const annualCard = await AnnualCard.findByPk(record.annualCardId);
        if (annualCard) {
          annualCard.balance = parseFloat(annualCard.balance) + parseFloat(record.actualAmount);
          annualCard.totalConsumption = parseFloat(annualCard.totalConsumption) - parseFloat(record.actualAmount);
          await annualCard.save({ transaction: t });
        }
      }

      if (record.userId) {
        const user = await User.findByPk(record.userId);
        if (user) {
          const currentPoints = user.points || 0;
          let newPoints = currentPoints;

          if (record.pointsEarned && record.pointsEarned > 0) {
            newPoints = newPoints - record.pointsEarned;
          }

          if (record.pointsUsed && record.pointsUsed > 0) {
            newPoints = newPoints + record.pointsUsed;
          }

          if (newPoints < 0) {
            await t.rollback();
            return errorResponse(res, '用户积分不足以扣回已发放的积分');
          }

          user.points = newPoints;
          await user.save({ transaction: t });

          if (record.pointsEarned && record.pointsEarned > 0) {
            await PointRecord.create({
              userId: record.userId,
              type: 'refund',
              points: -record.pointsEarned,
              balance: newPoints,
              sourceType: 'refund',
              sourceId: record.id,
              description: `消费退款扣回 ${record.pointsEarned}积分`,
              operatorId: req.user?.id || null,
            }, { transaction: t });
          }

          if (record.pointsUsed && record.pointsUsed > 0) {
            await PointRecord.create({
              userId: record.userId,
              type: 'refund',
              points: record.pointsUsed,
              balance: newPoints,
              sourceType: 'refund',
              sourceId: record.id,
              description: `消费退款退回 ${record.pointsUsed}积分`,
              operatorId: req.user?.id || null,
            }, { transaction: t });
          }
        }
      }

      const oldData = record.toJSON();

      record.settlementStatus = 'refunded';
      record.remarks = reason ? `${record.remarks || ''} 退款原因: ${reason}` : record.remarks;
      await record.save({ transaction: t });

      await t.commit();

      await createAuditLog(req, {
        module: MODULES.CONSUMPTION,
        action: ACTIONS.REFUND,
        targetId: record.id,
        description: `消费退款: 订单号 ${record.orderNo}, 退款金额 ¥${record.actualAmount}${reason ? `, 原因: ${reason}` : ''}`,
        oldData,
        newData: record.toJSON(),
      });

      successResponse(res, record, '退款成功');
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (error) {
    console.error('Refund consumption error:', error);
    errorResponse(res, '退款失败', 500);
  }
};

const getMyConsumptions = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category } = req.query;

    const where = { userId: req.user.id };
    if (category) where.category = category;

    const result = await paginate(ConsumptionRecord, {
      page,
      pageSize,
      where,
      include: [
        { model: AnnualCard, as: 'AnnualCard', attributes: ['id', 'cardNo'] },
      ],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get my consumptions error:', error);
    errorResponse(res, '获取我的消费记录失败', 500);
  }
};

module.exports = {
  createConsumption,
  getConsumptionRecords,
  getConsumptionDetail,
  settleConsumption,
  settleByWristband,
  refundConsumption,
  getMyConsumptions,
};
