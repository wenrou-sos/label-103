const { AuditLog } = require('../models');

const getClientIp = (req) => {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';
  return ip.split(',')[0].trim();
};

const createAuditLog = async (req, options = {}) => {
  try {
    const {
      module,
      action,
      targetId = null,
      description = '',
      oldData = null,
      newData = null,
    } = options;

    const user = req.user || null;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    const logData = {
      userId: user?.id || null,
      username: user?.username || null,
      realName: user?.realName || null,
      role: user?.role || null,
      module,
      action,
      targetId,
      description,
      oldData,
      newData,
      ip,
      userAgent,
    };

    await AuditLog.create(logData);
  } catch (error) {
    console.error('Create audit log error:', error);
  }
};

const ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  REFUND: 'refund',
  VERIFY: 'verify',
  RESET_PASSWORD: 'reset_password',
  LOGIN: 'login',
  LOGOUT: 'logout',
  CHANGE_STATUS: 'change_status',
};

const MODULES = {
  USER: 'user',
  TICKET_TYPE: 'ticket_type',
  TICKET_ORDER: 'ticket_order',
  ANNUAL_CARD: 'annual_card',
  CARD_TYPE: 'card_type',
  RENEWAL_PACKAGE: 'renewal_package',
  CONSUMPTION: 'consumption',
  SEASON: 'season',
  AUTH: 'auth',
};

module.exports = {
  getClientIp,
  createAuditLog,
  ACTIONS,
  MODULES,
};
