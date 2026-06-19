const { PointRecord, User, ConsumptionRecord, AnnualCard } = require('../models');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');
const { Op, sequelize } = require('../models');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');

const POINT_CONFIG_KEYS = {
  EARN_RATE: 'point_earn_rate',
  SPEND_RATE: 'point_spend_rate',
  MIN_SPEND_POINTS: 'point_min_spend',
};

const getPointRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, userId, type, startDate, endDate, keyword } = req.query;

    const where = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (req.user.role === 'member') {
      where.userId = req.user.id;
    }

    const userWhere = {};
    if (keyword) {
      userWhere[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const result = await paginate(PointRecord, {
      page,
      pageSize,
      where,
      include: [
        { model: User, as: 'User', attributes: ['id', 'username', 'realName'], where: keyword ? userWhere : undefined },
      ],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get point records error:', error);
    errorResponse(res, '获取积分明细失败', 500);
  }
};

const getMyPointRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type } = req.query;

    const where = { userId: req.user.id };
    if (type) where.type = type;

    const result = await paginate(PointRecord, {
      page,
      pageSize,
      where,
    });

    const user = await User.findByPk(req.user.id);

    successResponse(res, {
      balance: user?.points || 0,
      records: result,
    });
  } catch (error) {
    console.error('Get my point records error:', error);
    errorResponse(res, '获取我的积分明细失败', 500);
  }
};

const adjustPoints = async (req, res) => {
  try {
    const { userId, points, type, description, remarks } = req.body;

    if (!userId) {
      return errorResponse(res, '用户ID不能为空');
    }
    if (!points || points === 0) {
      return errorResponse(res, '积分调整值不能为空或0');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    const oldPoints = user.points || 0;
    const newPoints = oldPoints + parseInt(points);

    if (newPoints < 0) {
      return errorResponse(res, '调整后积分不能为负数');
    }

    const t = await sequelize.transaction();

    try {
      user.points = newPoints;
      await user.save({ transaction: t });

      const record = await PointRecord.create({
        userId,
        type: type || 'adjust',
        points: parseInt(points),
        balance: newPoints,
        sourceType: 'admin_adjust',
        description: description || (points > 0 ? '管理员增加积分' : '管理员扣除积分'),
        operatorId: req.user?.id || null,
        remarks,
      }, { transaction: t });

      await t.commit();

      await createAuditLog(req, {
        module: MODULES.USER,
        action: ACTIONS.UPDATE,
        targetId: userId,
        description: `调整用户积分: ${oldPoints} -> ${newPoints} (${points > 0 ? '+' : ''}${points})`,
        oldData: { points: oldPoints },
        newData: { points: newPoints },
      });

      successResponse(res, { record, balance: newPoints }, '积分调整成功');
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (error) {
    console.error('Adjust points error:', error);
    errorResponse(res, '积分调整失败', 500);
  }
};

const getUserPointBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user?.id;

    const user = await User.findByPk(targetUserId, {
      attributes: ['id', 'username', 'realName', 'points'],
    });

    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    if (req.user.role === 'member' && user.id !== req.user.id) {
      return errorResponse(res, '无权查看其他用户积分', 403);
    }

    const earnedTotal = await PointRecord.sum('points', {
      where: {
        userId: targetUserId,
        points: { [Op.gt]: 0 },
      },
    });

    const spentTotal = await PointRecord.sum('points', {
      where: {
        userId: targetUserId,
        points: { [Op.lt]: 0 },
      },
    });

    successResponse(res, {
      balance: user.points || 0,
      earnedTotal: earnedTotal || 0,
      spentTotal: Math.abs(spentTotal || 0),
    });
  } catch (error) {
    console.error('Get user point balance error:', error);
    errorResponse(res, '获取积分余额失败', 500);
  }
};

module.exports = {
  getPointRecords,
  getMyPointRecords,
  adjustPoints,
  getUserPointBalance,
};
