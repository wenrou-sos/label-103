const { TicketOrder, AnnualCard, ConsumptionRecord, VisitorRecord } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { Op, fn, col, literal } = require('sequelize');
const dayjs = require('dayjs');

const getDashboardStats = async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayTicketSales = await TicketOrder.sum('actualAmount', {
      where: {
        status: 'paid',
        paidAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });

    const todayTicketCount = await TicketOrder.count({
      where: {
        status: 'paid',
        paidAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });

    const todayCardSales = await AnnualCard.sum('paidAmount', {
      where: {
        status: 'active',
        paidAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });

    const todayCardCount = await AnnualCard.count({
      where: {
        status: 'active',
        paidAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });

    const todayConsumption = await ConsumptionRecord.sum('actualAmount', {
      where: {
        createdAt: { [Op.between]: [todayStart, todayEnd] },
        settlementStatus: 'settled',
      },
    });

    const todayConsumptionCount = await ConsumptionRecord.count({
      where: {
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });

    const todayVisitors = await VisitorRecord.count({
      where: {
        entryTime: { [Op.between]: [todayStart, todayEnd] },
      },
    });

    const totalActiveCards = await AnnualCard.count({
      where: { status: 'active' },
    });

    const { getInParkCount, getParkStatus } = require('../utils/business');
    const inParkCount = await getInParkCount();
    const parkStatus = await getParkStatus();

    successResponse(res, {
      today: {
        ticketSales: parseFloat(todayTicketSales || 0),
        ticketCount: todayTicketCount,
        cardSales: parseFloat(todayCardSales || 0),
        cardCount: todayCardCount,
        consumption: parseFloat(todayConsumption || 0),
        consumptionCount: todayConsumptionCount,
        visitors: todayVisitors,
      },
      total: {
        activeCards: totalActiveCards,
        inPark: inParkCount,
      },
      parkStatus,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    errorResponse(res, '获取仪表盘数据失败', 500);
  }
};

const getSalesStatistics = async (req, res) => {
  try {
    const { startDate, endDate, type = 'day' } = req.query;

    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').startOf('day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().endOf('day').toDate();

    let dateFormat;
    if (type === 'month') {
      dateFormat = fn('TO_CHAR', col('paid_at'), 'YYYY-MM');
    } else {
      dateFormat = fn('DATE', col('paid_at'));
    }

    const ticketStats = await TicketOrder.findAll({
      where: {
        status: 'paid',
        paidAt: { [Op.between]: [start, end] },
      },
      attributes: [
        [dateFormat, 'date'],
        [fn('SUM', col('actual_amount')), 'amount'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal(type === 'month' ? 'TO_CHAR(paid_at, \'YYYY-MM\')' : 'DATE(paid_at)')],
      order: [[literal(type === 'month' ? 'TO_CHAR(paid_at, \'YYYY-MM\')' : 'DATE(paid_at)'), 'ASC']],
    });

    const cardStats = await AnnualCard.findAll({
      where: {
        status: 'active',
        paidAt: { [Op.between]: [start, end] },
      },
      attributes: [
        [dateFormat, 'date'],
        [fn('SUM', col('paid_amount')), 'amount'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal(type === 'month' ? 'TO_CHAR(paid_at, \'YYYY-MM\')' : 'DATE(paid_at)')],
      order: [[literal(type === 'month' ? 'TO_CHAR(paid_at, \'YYYY-MM\')' : 'DATE(paid_at)'), 'ASC']],
    });

    const consumptionStats = await ConsumptionRecord.findAll({
      where: {
        settlementStatus: 'settled',
        settledAt: { [Op.between]: [start, end] },
      },
      attributes: [
        [type === 'month' ? fn('TO_CHAR', col('settled_at'), 'YYYY-MM') : fn('DATE', col('settled_at')), 'date'],
        [fn('SUM', col('actual_amount')), 'amount'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal(type === 'month' ? 'TO_CHAR(settled_at, \'YYYY-MM\')' : 'DATE(settled_at)')],
      order: [[literal(type === 'month' ? 'TO_CHAR(settled_at, \'YYYY-MM\')' : 'DATE(settled_at)'), 'ASC']],
    });

    successResponse(res, {
      tickets: ticketStats.map((item) => ({
        date: item.dataValues.date,
        amount: parseFloat(item.dataValues.amount),
        count: parseInt(item.dataValues.count),
      })),
      cards: cardStats.map((item) => ({
        date: item.dataValues.date,
        amount: parseFloat(item.dataValues.amount),
        count: parseInt(item.dataValues.count),
      })),
      consumptions: consumptionStats.map((item) => ({
        date: item.dataValues.date,
        amount: parseFloat(item.dataValues.amount),
        count: parseInt(item.dataValues.count),
      })),
    });
  } catch (error) {
    console.error('Get sales statistics error:', error);
    errorResponse(res, '获取销售统计失败', 500);
  }
};

const getTicketTypeStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: 'paid' };
    if (startDate && endDate) {
      where.paidAt = { [Op.between]: [startDate, endDate] };
    }

    const stats = await TicketOrder.findAll({
      where,
      include: ['TicketType'],
      attributes: [
        'ticketTypeId',
        [fn('SUM', col('actual_amount')), 'amount'],
        [fn('SUM', col('quantity')), 'quantity'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['ticketTypeId', 'TicketType.id'],
    });

    const result = stats.map((item) => ({
      ticketTypeId: item.ticketTypeId,
      ticketTypeName: item.TicketType?.name,
      ticketTypeCode: item.TicketType?.code,
      amount: parseFloat(item.dataValues.amount),
      quantity: parseInt(item.dataValues.quantity),
      count: parseInt(item.dataValues.count),
    }));

    successResponse(res, result);
  } catch (error) {
    console.error('Get ticket type statistics error:', error);
    errorResponse(res, '获取票种统计失败', 500);
  }
};

const getCardTypeStatistics = async (req, res) => {
  try {
    const stats = await AnnualCard.findAll({
      where: { status: 'active' },
      include: ['AnnualCardType'],
      attributes: [
        'cardTypeId',
        [fn('SUM', col('paid_amount')), 'amount'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['cardTypeId', 'AnnualCardType.id'],
    });

    const result = stats.map((item) => ({
      cardTypeId: item.cardTypeId,
      cardTypeName: item.AnnualCardType?.name,
      cardTypeCode: item.AnnualCardType?.code,
      amount: parseFloat(item.dataValues.amount),
      count: parseInt(item.dataValues.count),
    }));

    successResponse(res, result);
  } catch (error) {
    console.error('Get card type statistics error:', error);
    errorResponse(res, '获取年卡类型统计失败', 500);
  }
};

const getConsumptionCategoryStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { settlementStatus: 'settled' };
    if (startDate && endDate) {
      where.settledAt = { [Op.between]: [startDate, endDate] };
    }

    const stats = await ConsumptionRecord.findAll({
      where,
      attributes: [
        'category',
        [fn('SUM', col('actual_amount')), 'amount'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['category'],
    });

    const categoryMap = {
      shop: '商店购物',
      restaurant: '餐饮消费',
      attraction: '游乐项目',
      other: '其他',
    };

    const result = stats.map((item) => ({
      category: item.category,
      categoryName: categoryMap[item.category] || item.category,
      amount: parseFloat(item.dataValues.amount),
      count: parseInt(item.dataValues.count),
    }));

    successResponse(res, result);
  } catch (error) {
    console.error('Get consumption category statistics error:', error);
    errorResponse(res, '获取消费分类统计失败', 500);
  }
};

const getExpiringCards = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const expireDate = dayjs().add(parseInt(days), 'day').toDate();

    const cards = await AnnualCard.findAll({
      where: {
        status: 'active',
        expireDate: {
          [Op.lte]: expireDate,
          [Op.gte]: new Date(),
        },
      },
      include: ['AnnualCardType'],
      order: [['expireDate', 'ASC']],
    });

    successResponse(res, {
      count: cards.length,
      cards,
      days: parseInt(days),
    });
  } catch (error) {
    console.error('Get expiring cards error:', error);
    errorResponse(res, '获取即将到期年卡失败', 500);
  }
};

module.exports = {
  getDashboardStats,
  getSalesStatistics,
  getTicketTypeStatistics,
  getCardTypeStatistics,
  getConsumptionCategoryStatistics,
  getExpiringCards,
};
