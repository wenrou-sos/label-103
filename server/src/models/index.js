const sequelize = require('../database/config');

const User = require('./User');
const TicketType = require('./TicketType');
const TicketOrder = require('./TicketOrder');
const AnnualCardType = require('./AnnualCardType');
const AnnualCard = require('./AnnualCard');
const ConsumptionRecord = require('./ConsumptionRecord');
const VisitorRecord = require('./VisitorRecord');
const SeasonRule = require('./SeasonRule');
const RenewalPackage = require('./RenewalPackage');

User.hasMany(TicketOrder, { foreignKey: 'userId' });
TicketOrder.belongsTo(User, { foreignKey: 'userId' });

TicketType.hasMany(TicketOrder, { foreignKey: 'ticketTypeId' });
TicketOrder.belongsTo(TicketType, { foreignKey: 'ticketTypeId' });

User.hasMany(AnnualCard, { foreignKey: 'userId' });
AnnualCard.belongsTo(User, { foreignKey: 'userId' });

AnnualCardType.hasMany(AnnualCard, { foreignKey: 'cardTypeId' });
AnnualCard.belongsTo(AnnualCardType, { foreignKey: 'cardTypeId' });

AnnualCardType.hasMany(RenewalPackage, { foreignKey: 'cardTypeId' });
RenewalPackage.belongsTo(AnnualCardType, { foreignKey: 'cardTypeId' });

User.hasMany(ConsumptionRecord, { foreignKey: 'userId' });
ConsumptionRecord.belongsTo(User, { foreignKey: 'userId' });

AnnualCard.hasMany(ConsumptionRecord, { foreignKey: 'annualCardId' });
ConsumptionRecord.belongsTo(AnnualCard, { foreignKey: 'annualCardId' });

TicketOrder.hasMany(ConsumptionRecord, { foreignKey: 'ticketOrderId' });
ConsumptionRecord.belongsTo(TicketOrder, { foreignKey: 'ticketOrderId' });

TicketOrder.hasOne(VisitorRecord, { foreignKey: 'ticketOrderId' });
VisitorRecord.belongsTo(TicketOrder, { foreignKey: 'ticketOrderId' });

AnnualCard.hasMany(VisitorRecord, { foreignKey: 'annualCardId' });
VisitorRecord.belongsTo(AnnualCard, { foreignKey: 'annualCardId' });

module.exports = {
  sequelize,
  User,
  TicketType,
  TicketOrder,
  AnnualCardType,
  AnnualCard,
  ConsumptionRecord,
  VisitorRecord,
  SeasonRule,
  RenewalPackage,
};
