const { TicketType, TicketOrder, User, AmusementProject } = require('../models');
const { successResponse, errorResponse, paginate, generateOrderNo, generateTicketCode } = require('../utils/helpers');
const { getSeasonType, calculateTicketPrice, calculateEarlyBirdDiscount, getParkStatus, checkProjectAccess } = require('../utils/business');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');
const { Op } = require('sequelize');
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

    await createAuditLog(req, {
      module: MODULES.TICKET_TYPE,
      action: ACTIONS.CREATE,
      targetId: ticketType.id,
      description: `创建票种: ${name} (${code})`,
      newData: ticketType.toJSON(),
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

    const oldData = ticketType.toJSON();

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

    await createAuditLog(req, {
      module: MODULES.TICKET_TYPE,
      action: ACTIONS.UPDATE,
      targetId: ticketType.id,
      description: `更新票种: ${ticketType.name} (${ticketType.code})`,
      oldData,
      newData: ticketType.toJSON(),
    });

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

    const oldData = ticketType.toJSON();
    await ticketType.destroy();

    await createAuditLog(req, {
      module: MODULES.TICKET_TYPE,
      action: ACTIONS.DELETE,
      targetId: ticketType.id,
      description: `删除票种: ${ticketType.name} (${ticketType.code})`,
      oldData,
    });

    successResponse(res, null, '票种删除成功');
  } catch (error) {
    console.error('Delete ticket type error:', error);
    errorResponse(res, '删除票种失败', 500);
  }
};

const calculatePrice = async (req, res) => {
  try {
    const { ticketTypeId, visitDate, quantity = 1, visitorHeight, visitorAge, visitorIdCard } = req.body;

    const ticketType = await TicketType.findByPk(ticketTypeId);
    if (!ticketType) {
      return errorResponse(res, '票种不存在');
    }

    const seasonType = await getSeasonType(visitDate);
    const unitPrice = calculateTicketPrice(ticketType, seasonType);
    const totalPrice = unitPrice * quantity;
    const earlyBirdResult = calculateEarlyBirdDiscount(unitPrice, visitDate);
    const discountTotal = earlyBirdResult.discountPrice * quantity;

    let accessCheck = null;
    if (visitorHeight || visitorAge || visitorIdCard) {
      const projects = await AmusementProject.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      });

      const visitor = {
        height: visitorHeight === '' ? null : visitorHeight,
        age: visitorAge === '' ? null : visitorAge,
        idCard: visitorIdCard === '' ? null : visitorIdCard,
      };

      const accessible = [];
      const inaccessible = [];

      projects.forEach((project) => {
        const result = checkProjectAccess(project, visitor);
        const item = {
          id: project.id,
          name: project.name,
          code: project.code,
          category: project.category,
          isCharged: project.isCharged,
          price: project.price,
          minHeight: project.minHeight,
          maxHeight: project.maxHeight,
          minAge: project.minAge,
          maxAge: project.maxAge,
          accessible: result.accessible,
          reasons: result.reasons,
        };
        if (result.accessible) {
          accessible.push(item);
        } else {
          inaccessible.push(item);
        }
      });

      accessCheck = {
        visitor,
        summary: {
          total: projects.length,
          accessibleCount: accessible.length,
          inaccessibleCount: inaccessible.length,
        },
        accessible,
        inaccessible,
      };
    }

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
      accessCheck,
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

    if (req.user && ['admin', 'operator', 'cashier'].includes(req.user.role)) {
      await createAuditLog(req, {
        module: MODULES.TICKET_ORDER,
        action: ACTIONS.CREATE,
        targetId: order.id,
        description: `售票: 订单号 ${orderNo}, 票种 ${ticketType.name}, 数量 ${quantity}张, 金额 ¥${actualAmount}`,
        newData: order.toJSON(),
      });
    }

    successResponse(res, order, '购票成功');
  } catch (error) {
    console.error('Create ticket order error:', error);
    errorResponse(res, '购票失败', 500);
  }
};

const getTicketOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, startDate, endDate, keyword, ticketTypeId } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (ticketTypeId) {
      where.ticketTypeId = ticketTypeId;
    }

    if (startDate && endDate) {
      where.visitDate = {
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

    const oldData = order.toJSON();

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

    await createAuditLog(req, {
      module: MODULES.TICKET_ORDER,
      action: ACTIONS.VERIFY,
      targetId: order.id,
      description: `验票: 订单号 ${order.orderNo}, 票号 ${order.ticketCode}`,
      oldData,
      newData: order.toJSON(),
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

    const oldData = order.toJSON();

    order.status = 'refunded';
    order.refundedAt = new Date();
    await order.save();

    await createAuditLog(req, {
      module: MODULES.TICKET_ORDER,
      action: ACTIONS.REFUND,
      targetId: order.id,
      description: `门票退款: 订单号 ${order.orderNo}, 退款金额 ¥${order.actualAmount}`,
      oldData,
      newData: order.toJSON(),
    });

    successResponse(res, order, '退款成功');
  } catch (error) {
    console.error('Refund ticket error:', error);
    errorResponse(res, '退款失败', 500);
  }
};

const batchRefundTickets = async (req, res) => {
  try {
    const { ids, reason } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, '请选择要退款的订单');
    }

    const uniqueIds = [...new Set(ids)];

    const results = {
      success: [],
      failed: [],
    };

    const ticketStatusMap = {
      pending: '待支付',
      paid: '已支付',
      used: '已使用',
      refunded: '已退款',
      cancelled: '已取消',
      expired: '已过期',
    };

    for (const id of uniqueIds) {
      try {
        const order = await TicketOrder.findByPk(id);
        if (!order) {
          results.failed.push({
            id,
            orderNo: '未知',
            reason: '订单不存在',
          });
          continue;
        }

        if (order.usedQuantity && order.usedQuantity > 0) {
          results.failed.push({
            id,
            orderNo: order.orderNo,
            reason: `已部分使用（使用 ${order.usedQuantity}/${order.quantity} 张），不可退款`,
          });
          continue;
        }

        if (order.status === 'refunded') {
          results.failed.push({
            id,
            orderNo: order.orderNo,
            reason: '订单已退款，不可重复退款',
          });
          continue;
        }

        if (order.status !== 'paid') {
          results.failed.push({
            id,
            orderNo: order.orderNo,
            reason: `订单状态为「${ticketStatusMap[order.status] || order.status}」，不可退款（仅已支付订单可退款）`,
          });
          continue;
        }

        const oldData = order.toJSON();

        order.status = 'refunded';
        order.refundedAt = new Date();
        order.refundReason = reason || '';
        await order.save();

        await createAuditLog(req, {
          module: MODULES.TICKET_ORDER,
          action: ACTIONS.REFUND,
          targetId: order.id,
          description: `批量退票: 订单号 ${order.orderNo}, 金额 ¥${order.actualAmount}${reason ? `, 原因: ${reason}` : ''}`,
          oldData,
          newData: order.toJSON(),
        });

        results.success.push({
          id,
          orderNo: order.orderNo,
          amount: order.actualAmount,
        });
      } catch (err) {
        console.error('Batch refund single order error:', id, err);
        results.failed.push({
          id,
          orderNo: (await TicketOrder.findByPk(id))?.orderNo || id,
          reason: '系统异常，退款失败',
        });
      }
    }

    let summaryMessage = '';
    if (results.success.length > 0 && results.failed.length > 0) {
      summaryMessage = `处理完成：成功 ${results.success.length} 单，失败 ${results.failed.length} 单`;
    } else if (results.success.length > 0) {
      summaryMessage = `全部成功，共退款 ${results.success.length} 单`;
    } else {
      summaryMessage = `全部失败，共 ${results.failed.length} 单`;
    }

    successResponse(res, {
      results,
      summary: {
        total: uniqueIds.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        totalRefundedAmount: results.success.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2),
      },
      message: summaryMessage,
    }, summaryMessage);
  } catch (error) {
    console.error('Batch refund tickets error:', error);
    errorResponse(res, '批量退款失败', 500);
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
  batchRefundTickets,
};
