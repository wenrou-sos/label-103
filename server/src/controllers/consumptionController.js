const { ConsumptionRecord, AnnualCard, User, TicketOrder } = require('../models');
const { successResponse, errorResponse, paginate, generateOrderNo } = require('../utils/helpers');
const { calculateMemberDiscount } = require('../utils/business');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');
const { Op } = require('sequelize');

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
    } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return errorResponse(res, '消费金额必须大于0');
    }

    let annualCard = null;
    let userId = null;
    let memberDiscount = null;
    let discountAmount = 0;
    let actualAmount = parseFloat(totalAmount);

    if (cardId) {
      annualCard = await AnnualCard.findByPk(cardId);
      if (!annualCard) {
        return errorResponse(res, '年卡不存在');
      }
      if (annualCard.status !== 'active') {
        return errorResponse(res, '年卡状态异常');
      }
      userId = annualCard.userId;

      const discountResult = calculateMemberDiscount(actualAmount);
      memberDiscount = discountResult.discountRate;
      discountAmount = discountResult.discountAmount;
      actualAmount = discountResult.actualAmount;

      if (paymentMethod === 'annual_card') {
        if (parseFloat(annualCard.balance) < actualAmount) {
          return errorResponse(res, '年卡余额不足');
        }
        annualCard.balance = parseFloat(annualCard.balance) - actualAmount;
        annualCard.totalConsumption = parseFloat(annualCard.totalConsumption) + actualAmount;
        await annualCard.save();
      }
    }

    const orderNo = generateOrderNo('CS');

    const record = await ConsumptionRecord.create({
      orderNo,
      userId,
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
      paymentMethod,
      settlementStatus: paymentMethod === 'wristband' ? 'pending' : 'settled',
      settledAt: paymentMethod !== 'wristband' ? new Date() : null,
      operatorId: req.user?.id || null,
      location,
      remarks,
    });

    await createAuditLog(req, {
      module: MODULES.CONSUMPTION,
      action: ACTIONS.CREATE,
      targetId: record.id,
      description: `创建消费记录: 订单号 ${record.orderNo}, 金额 ¥${record.actualAmount}, 商户 ${merchantName || '-'}`,
      newData: record.toJSON(),
    });

    successResponse(res, record, '消费记录创建成功');
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

    record.settlementStatus = 'settled';
    record.settledAt = new Date();
    if (paymentMethod) {
      record.paymentMethod = paymentMethod;
    }
    await record.save();

    await createAuditLog(req, {
      module: MODULES.CONSUMPTION,
      action: ACTIONS.UPDATE,
      targetId: record.id,
      description: `结算消费: 订单号 ${record.orderNo}, 金额 ¥${record.actualAmount}`,
      oldData,
      newData: record.toJSON(),
    });

    successResponse(res, record, '结算成功');
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

    let totalAmount = 0;
    for (const record of records) {
      totalAmount += parseFloat(record.actualAmount);
      record.settlementStatus = 'settled';
      record.settledAt = new Date();
      if (paymentMethod) {
        record.paymentMethod = paymentMethod;
      }
      await record.save();
    }

    successResponse(res, {
      records,
      totalAmount,
      count: records.length,
    }, '结算成功');
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

    if (record.annualCardId && record.paymentMethod === 'annual_card') {
      const annualCard = await AnnualCard.findByPk(record.annualCardId);
      if (annualCard) {
        annualCard.balance = parseFloat(annualCard.balance) + parseFloat(record.actualAmount);
        annualCard.totalConsumption = parseFloat(annualCard.totalConsumption) - parseFloat(record.actualAmount);
        await annualCard.save();
      }
    }

    const oldData = record.toJSON();

    record.settlementStatus = 'refunded';
    record.remarks = reason ? `${record.remarks || ''} 退款原因: ${reason}` : record.remarks;
    await record.save();

    await createAuditLog(req, {
      module: MODULES.CONSUMPTION,
      action: ACTIONS.REFUND,
      targetId: record.id,
      description: `消费退款: 订单号 ${record.orderNo}, 退款金额 ¥${record.actualAmount}${reason ? `, 原因: ${reason}` : ''}`,
      oldData,
      newData: record.toJSON(),
    });

    successResponse(res, record, '退款成功');
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
