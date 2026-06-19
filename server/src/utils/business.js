const dayjs = require('dayjs');
const { SeasonRule } = require('../models');

const getSeasonType = async (date) => {
  const targetDate = dayjs(date);
  const month = targetDate.month() + 1;
  const day = targetDate.date();

  const rules = await SeasonRule.findAll({ where: { isActive: true } });

  for (const rule of rules) {
    const startMonth = rule.startMonth;
    const startDay = rule.startDay;
    const endMonth = rule.endMonth;
    const endDay = rule.endDay;

    let isInRange = false;

    if (startMonth < endMonth) {
      if (month > startMonth && month < endMonth) {
        isInRange = true;
      } else if (month === startMonth && day >= startDay) {
        isInRange = true;
      } else if (month === endMonth && day <= endDay) {
        isInRange = true;
      }
    } else {
      if (month > startMonth || month < endMonth) {
        isInRange = true;
      } else if (month === startMonth && day >= startDay) {
        isInRange = true;
      } else if (month === endMonth && day <= endDay) {
        isInRange = true;
      }
    }

    if (isInRange) {
      return rule.type;
    }
  }

  return 'off_peak';
};

const calculateTicketPrice = (ticketType, seasonType) => {
  return seasonType === 'peak'
    ? parseFloat(ticketType.peakPrice)
    : parseFloat(ticketType.offPeakPrice);
};

const calculateEarlyBirdDiscount = (price, visitDate, purchaseDate = new Date()) => {
  const visit = dayjs(visitDate);
  const purchase = dayjs(purchaseDate);
  const diffDays = visit.diff(purchase, 'day');
  const earlyBirdDays = parseInt(process.env.EARLY_BIRD_DAYS || '7');
  const earlyBirdDiscount = parseFloat(process.env.EARLY_BIRD_DISCOUNT || '0.9');

  if (diffDays >= earlyBirdDays) {
    return {
      isEarlyBird: true,
      discountPrice: price * earlyBirdDiscount,
      discountAmount: price * (1 - earlyBirdDiscount),
    };
  }

  return {
    isEarlyBird: false,
    discountPrice: price,
    discountAmount: 0,
  };
};

const calculateMemberDiscount = (amount) => {
  const discountRate = parseFloat(process.env.MEMBER_DISCOUNT || '0.9');
  return {
    discountRate,
    discountAmount: amount * (1 - discountRate),
    actualAmount: amount * discountRate,
  };
};

const isBirthdayMonth = (birthday) => {
  if (!birthday) return false;
  const birthMonth = dayjs(birthday).month();
  const currentMonth = dayjs().month();
  return birthMonth === currentMonth;
};

const getInParkCount = async () => {
  const { VisitorRecord } = require('../models');
  const count = await VisitorRecord.count({
    where: { isInPark: true },
  });
  return count;
};

const getParkStatus = async () => {
  const maxCapacity = parseInt(process.env.PARK_MAX_CAPACITY || '10000');
  const currentCount = await getInParkCount();
  const percentage = (currentCount / maxCapacity) * 100;

  let status = 'normal';
  let message = '园区运行正常';

  if (percentage >= 100) {
    status = 'full';
    message = '园区已达最大承载量，停止售票';
  } else if (percentage >= 80) {
    status = 'warning';
    message = '园区客流较多，已启动限流措施';
  }

  return {
    currentCount,
    maxCapacity,
    percentage: percentage.toFixed(2),
    status,
    message,
  };
};

module.exports = {
  getSeasonType,
  calculateTicketPrice,
  calculateEarlyBirdDiscount,
  calculateMemberDiscount,
  isBirthdayMonth,
  getInParkCount,
  getParkStatus,
};
