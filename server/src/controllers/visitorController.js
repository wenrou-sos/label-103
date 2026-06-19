const { VisitorRecord, TicketOrder, AnnualCard } = require('../models');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');
const { getInParkCount, getParkStatus } = require('../utils/business');
const { Op, fn, col, literal } = require('sequelize');
const dayjs = require('dayjs');

const getCurrentVisitorCount = async (req, res) => {
  try {
    const parkStatus = await getParkStatus();
    successResponse(res, parkStatus);
  } catch (error) {
    console.error('Get current visitor count error:', error);
    errorResponse(res, '获取客流数据失败', 500);
  }
};

const getVisitorRecords = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      visitorType,
      isInPark,
      startDate,
      endDate,
      keyword,
    } = req.query;

    const where = {};

    if (visitorType) where.visitorType = visitorType;
    if (isInPark !== undefined) where.isInPark = isInPark === 'true';

    if (startDate && endDate) {
      where.entryTime = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (keyword) {
      where[Op.or] = [
        { visitorName: { [Op.like]: `%${keyword}%` } },
        { idCard: { [Op.like]: `%${keyword}%` } },
        { wristbandId: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const result = await paginate(VisitorRecord, {
      page,
      pageSize,
      where,
      include: [
        { model: TicketOrder, as: 'TicketOrder', attributes: ['id', 'orderNo', 'ticketCode'] },
        { model: AnnualCard, as: 'AnnualCard', attributes: ['id', 'cardNo', 'holderName'] },
      ],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get visitor records error:', error);
    errorResponse(res, '获取客流记录失败', 500);
  }
};

const visitorExit = async (req, res) => {
  try {
    const { id } = req.params;
    const { exitGate } = req.body;

    const record = await VisitorRecord.findByPk(id);
    if (!record) {
      return errorResponse(res, '游客记录不存在');
    }

    if (!record.isInPark) {
      return errorResponse(res, '该游客已出园');
    }

    record.exitTime = new Date();
    record.isInPark = false;
    record.exitGate = exitGate || null;
    await record.save();

    successResponse(res, record, '出园登记成功');
  } catch (error) {
    console.error('Visitor exit error:', error);
    errorResponse(res, '出园登记失败', 500);
  }
};

const getTodayStatistics = async (req, res) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayEntries = await VisitorRecord.count({
      where: {
        entryTime: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    const todayExits = await VisitorRecord.count({
      where: {
        exitTime: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    const inParkCount = await getInParkCount();
    const parkStatus = await getParkStatus();

    const ticketEntries = await VisitorRecord.count({
      where: {
        entryTime: {
          [Op.between]: [todayStart, todayEnd],
        },
        visitorType: 'ticket',
      },
    });

    const cardEntries = await VisitorRecord.count({
      where: {
        entryTime: {
          [Op.between]: [todayStart, todayEnd],
        },
        visitorType: 'annual_card',
      },
    });

    successResponse(res, {
      todayEntries,
      todayExits,
      inParkCount,
      parkStatus,
      ticketEntries,
      cardEntries,
    });
  } catch (error) {
    console.error('Get today statistics error:', error);
    errorResponse(res, '获取今日统计失败', 500);
  }
};

const getHourlyTrend = async (req, res) => {
  try {
    const { date = dayjs().format('YYYY-MM-DD') } = req.query;

    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const records = await VisitorRecord.findAll({
      where: {
        entryTime: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      attributes: [
        [fn('DATE_PART', 'hour', col('entry_time')), 'hour'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal('DATE_PART(\'hour\', entry_time)')],
      order: [[literal('hour'), 'ASC']],
    });

    const hourlyData = Array(24).fill(0);
    records.forEach((record) => {
      const hour = parseInt(record.dataValues.hour);
      hourlyData[hour] = parseInt(record.dataValues.count);
    });

    const result = hourlyData.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count,
    }));

    successResponse(res, result);
  } catch (error) {
    console.error('Get hourly trend error:', error);
    errorResponse(res, '获取小时客流趋势失败', 500);
  }
};

const getDailyTrend = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().subtract(30, 'day').startOf('day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const records = await VisitorRecord.findAll({
      where: {
        entryTime: {
          [Op.between]: [start, end],
        },
      },
      attributes: [
        [fn('DATE', col('entry_time')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('entry_time'))],
      order: [[fn('DATE', col('entry_time')), 'ASC']],
    });

    const result = records.map((record) => ({
      date: record.dataValues.date,
      count: parseInt(record.dataValues.count),
    }));

    successResponse(res, result);
  } catch (error) {
    console.error('Get daily trend error:', error);
    errorResponse(res, '获取日客流趋势失败', 500);
  }
};

module.exports = {
  getCurrentVisitorCount,
  getVisitorRecords,
  visitorExit,
  getTodayStatistics,
  getHourlyTrend,
  getDailyTrend,
};
