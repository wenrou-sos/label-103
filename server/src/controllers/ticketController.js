const { TicketType, TicketOrder, User } = require('../models');
const { successResponse, errorResponse, paginate, generateOrderNo, generateTicketCode } = require('../utils/helpers');
const { getSeasonType, calculateTicketPrice, calculateEarlyBirdDiscount, getParkStatus } = require('../utils/business');
const dayjs = require('dayjs');

const getTicketTypes = async (req, res) => {
  try {
    const ticketTypes = await TicketType.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });

    successResponse(res, ticketTypes);
  } catch (error) {
    console.error('Get ticket types error:', error);
    errorResponse(res, '获取门票类型失败', 500);
  }
};

const getAllTicketTypes = async (req, res) => {
  try {
    const ticketTypes = await TicketType.findAll({
      order: [['sortOrder', 'ASC']],
    });

    successResponse(res, ticketTypes);
  } catch (error) {
    console.error('Get all ticket types error:', error);
    errorResponse(res, '获取门票类型失败', 500);
  }
};

const createTicketType = async (req, res) => {
  try {
    const { name, code, description, type, peakPrice, offPeakPrice, validDays, entryTime, sortOrder, isActive } = req.body;

    const existingType = await TicketType.findOne({ where: { code } });
    if (existingType) {
      return errorResponse(res, '票种编码已存在');
    }

    const ticketType = await TicketType.create({
      name,
      code,
      description,
      type,
      peakPrice,
      offPeakPrice,
      validDays,
      entryTime,
      sortOrder,
      isActive,
    });

    successResponse(res, ticketType, '票种创建成功');
  } catch (error) {
    console.error('Create ticket type error:', error);
    errorResponse(res, '创建票种失败', 500);
  }
};

const updateTicketType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, peakPrice, offPeakPrice, validDays, entryTime, sortOrder, isActive } = req.body;

    const ticketType = await TicketType.findByPk(id);
    if (!ticketType) {
      return errorResponse(res, '票种不存在');
    }

    if (name !== undefined) ticketType.name = name;
    if (description !== undefined) ticketType.description = description;
    if (type !== undefined) ticketType.type = type;
    if (peakPrice !== undefined) ticketType.peakPrice = peakPrice;
    if (offPeakPrice !== undefined) ticketType.offPeakPrice = offPeakPrice;
    if (validDays !== undefined) ticketType.validDays = validDays;
    if (entryTime !== undefined) ticketType.entryTime = entryTime;
    if (sortOrder !== undefined) ticketType.sortOrder = sortOrder;
    if (isActive !== undefined) ticketType.isActive = isActive;

    await ticketType.save();

    successResponse(res, ticketType, '票种更新成功');
  } catch (error) {
    console.error('Update ticket type error:', error);
    errorResponse(res, '更新票种失败', 500);
  }
};

const deleteTicketType = async (req, res) => {
  try {
    const { id } = req.params;

    const ticketType = await TicketType.findByPk(id);
    if (!ticketType) {
      return errorResponse(res, '票种不存在');
    }

    await ticketType.destroy();

    successResponse(res, null, '票种删除成功');
  } catch (error) {
    console.error('Delete ticket type error:', error);
    errorResponse(res, '删除票种失败', 500);
  }
};

const calculatePrice = async (req, res) => {
  try {
    const { ticketTypeId, visitDate, quantity = 1 } = req.body;

    const ticketType = await TicketType.findByPk(ticketTypeId);
    if (!ticketType) {
      return errorResponse(res, '票种不存在');
    }

    const seasonType = await getSeasonType(visitDate);
    const unitPrice = calculateTicketPrice(ticketType, seasonType);
    const totalPrice = unitPrice * quantity;
    const earlyBirdResult = calculateEarlyBirdDiscount(unitPrice, visitDate);
    const discountTotal = earlyBirdResult.discountPrice * quantity;

    successResponse(res, {
      ticketType,
      seasonType,
      unitPrice,
      totalPrice,
      isEarlyBird: earlyBirdResult.isEarlyBird,
      discountPerTicket: earlyBirdResult.discountAmount,
      discountTotal: totalPrice - discountTotal,
      finalPrice: discountTotal,
      quantity,
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    errorResponse(res, '计算价格失败', 500);
  }
};

const createTicketOrder = async (req, res) => {
  try {
    const parkStatus = await getParkStatus();
    if (parkStatus.status === 'full') {
      return errorResponse(res, '园区已达最大承载量，暂不可售票');
    }

    const { ticketTypeId, visitDate, quantity = 1, visitorName, visitorPhone, visitorIdCard, paymentMethod } = req.body;

    const ticketType = await TicketType.findByPk(ticketTypeId);
    if (!ticketType) {
      return errorResponse(res, '票种不存在');
    }

    const seasonType = await getSeasonType(visitDate);
    const unitPrice = calculateTicketPrice(ticketType, seasonType);
    const totalAmount = unitPrice * quantity;
    const earlyBirdResult = calculateEarlyBirdDiscount(unitPrice, visitDate);
    const discountAmount = earlyBirdResult.discountAmount * quantity;
    const actualAmount = totalAmount - discountAmount;

    const orderNo = generateOrderNo('TK');
    const ticketCode = generateTicketCode();

    const order = await TicketOrder.create({
      orderNo,
      userId: req.user?.id || null,
      ticketTypeId,
      quantity,
      unitPrice,
      totalAmount,
      discountAmount,
      actualAmount,
      isEarlyBird: earlyBirdResult.isEarlyBird,
      seasonType,
      visitDate,
      visitorName,
      visitorPhone,
      visitorIdCard,
      status: 'paid',
      paymentMethod: paymentMethod || 'wechat',
      paidAt: new Date(),
      ticketCode,
      qrCode: `QR_${ticketCode}`,
    });

    successResponse(res, order, '购票成功');
  } catch (error) {
    console.error('Create ticket order error:', error);
    errorResponse(res, '购票失败', 500);
  }
};

const getTicketOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, startDate, endDate, keyword } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: dayjs(startDate).startOf('day').toDate(),
        [Op.lte]: dayjs(endDate).endOf('day').toDate(),
      };
    }

    if (keyword) {
      where[Op.or] = [
        { orderNo: { [Op.like]: `%${keyword}%` } },
        { ticketCode: { [Op.like]: `%${keyword}%` } },
        { visitorName: { [Op.like]: `%${keyword}%` } },
        { visitorPhone: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (req.user.role === 'member') {
      where.userId = req.user.id;
    }

    const result = await paginate(TicketOrder, {
      page,
      pageSize,
      where,
      include: [
        { model: TicketType, as: 'TicketType' },
        { model: User, as: 'User', attributes: ['id', 'username', 'realName'] },
      ],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get ticket orders error:', error);
    errorResponse(res, '获取订单列表失败', 500);
  }
};

const getTicketOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await TicketOrder.findByPk(id, {
      include: [
        { model: TicketType, as: 'TicketType' },
        { model: User, as: 'User', attributes: ['id', 'username', 'realName'] },
      ],
    });

    if (!order) {
      return errorResponse(res, '订单不存在');
    }

    if (req.user.role === 'member' && order.userId !== req.user.id) {
      return errorResponse(res, '无权查看此订单', 403);
    }

    successResponse(res, order);
  } catch (error) {
    console.error('Get ticket order detail error:', error);
    errorResponse(res, '获取订单详情失败', 500);
  }
};

const verifyTicket = async (req, res) => {
  try {
    const { ticketCode, idCard } = req.body;

    const order = await TicketOrder.findOne({
      where: { ticketCode },
      include: [{ model: TicketType, as: 'TicketType' }],
    });

    if (!order) {
      return errorResponse(res, '票号不存在');
    }

    if (order.status === 'refunded') {
      return errorResponse(res, '门票已退款');
    }

    if (order.status === 'cancelled' || order.status === 'expired') {
      return errorResponse(res, '门票状态异常，请联系工作人员');
    }

    const currentUsed = order.usedQuantity || 0;
    if (currentUsed >= order.quantity) {
      return errorResponse(res, '该订单门票已全部使用');
    }

    const ticketType = order.TicketType;
    const validDays = ticketType.validDays || 1;
    const visitDateStart = dayjs(order.visitDate).startOf('day');
    const visitDateEnd = dayjs(order.visitDate).add(validDays - 1, 'day').endOf('day');
    const today = dayjs();

    if (today.isBefore(visitDateStart)) {
      return errorResponse(res, `该门票尚未生效，请于 ${dayjs(order.visitDate).format('YYYY-MM-DD')} 后入园`);
    }
    if (today.isAfter(visitDateEnd)) {
      return errorResponse(res, `该门票已过期，有效期至 ${visitDateEnd.format('YYYY-MM-DD')}`);
    }

    if (order.visitorIdCard && idCard && order.visitorIdCard !== idCard) {
      return errorResponse(res, '身份证信息不匹配');
    }
    if (ticketType.entryTime) {
      const entryHour = parseInt(ticketType.entryTime.split(':')[0]);
      const currentHour = dayjs().hour();
      if (currentHour < entryHour) {
        return errorResponse(res, `该票种需${ticketType.entryTime}后入园`);
      }
    }

    order.usedQuantity = currentUsed + 1;
    order.usedAt = new Date();
    if (order.usedQuantity >= order.quantity) {
      order.status = 'used';
    } else if (order.status === 'pending') {
      order.status = 'paid';
    }
    await order.save();

    const { VisitorRecord } = require('../models');
    await VisitorRecord.create({
      ticketOrderId: order.id,
      visitorType: 'ticket',
      visitorName: order.visitorName,
      idCard: order.visitorIdCard,
      entryTime: new Date(),
      isInPark: true,
    });

    successResponse(res, {
      order,
      remaining: order.quantity - order.usedQuantity,
    }, `验票成功，剩余 ${order.quantity - order.usedQuantity} 张`);
  } catch (error) {
    console.error('Verify ticket error:', error);
    errorResponse(res, '验票失败', 500);
  }
};

const refundTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await TicketOrder.findByPk(id);
    if (!order) {
      return errorResponse(res, '订单不存在');
    }

    if (order.status !== 'paid') {
      return errorResponse(res, '当前订单状态不可退款');
    }

    order.status = 'refunded';
    order.refundedAt = new Date();
    await order.save();

    successResponse(res, order, '退款成功');
  } catch (error) {
    console.error('Refund ticket error:', error);
    errorResponse(res, '退款失败', 500);
  }
};

module.exports = {
  getTicketTypes,
  getAllTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  calculatePrice,
  createTicketOrder,
  getTicketOrders,
  getTicketOrderDetail,
  verifyTicket,
  refundTicket,
};
