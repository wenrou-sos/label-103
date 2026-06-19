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

const getBirthdayFromIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return null;
  const year = idCard.substring(6, 10);
  const month = idCard.substring(10, 12);
  const day = idCard.substring(12, 14);
  const dateStr = `${year}-${month}-${day}`;
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  return d.toDate();
};

const getAgeFromIdCard = (idCard, referenceDate = new Date()) => {
  const birthday = getBirthdayFromIdCard(idCard);
  if (!birthday) return null;
  const ref = dayjs(referenceDate);
  let age = ref.diff(dayjs(birthday), 'year');
  const hasHadBirthdayThisYear =
    ref.month() > dayjs(birthday).month() ||
    (ref.month() === dayjs(birthday).month() && ref.date() >= dayjs(birthday).date());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age < 0 ? 0 : age;
};

const checkProjectAccess = (project, visitor = {}) => {
  const reasons = [];
  const { height, age, idCard } = visitor;

  let resolvedAge = age;
  if (resolvedAge === undefined || resolvedAge === null) {
    if (idCard) {
      resolvedAge = getAgeFromIdCard(idCard);
    }
  }

  if (project.minHeight !== null && project.minHeight !== undefined) {
    if (height === undefined || height === null || height === '') {
      reasons.push(`需身高 ≥ ${project.minHeight}cm，未提供游客身高信息`);
    } else if (parseFloat(height) < parseFloat(project.minHeight)) {
      reasons.push(`身高不足，要求 ≥ ${project.minHeight}cm，当前 ${height}cm`);
    }
  }

  if (project.maxHeight !== null && project.maxHeight !== undefined) {
    if (height !== undefined && height !== null && height !== '' && parseFloat(height) > parseFloat(project.maxHeight)) {
      reasons.push(`身高超出限制，要求 ≤ ${project.maxHeight}cm，当前 ${height}cm`);
    }
  }

  if (project.minAge !== null && project.minAge !== undefined) {
    if (resolvedAge === null || resolvedAge === undefined) {
      reasons.push(`需年龄 ≥ ${project.minAge}岁，未提供游客年龄信息`);
    } else if (resolvedAge < project.minAge) {
      reasons.push(`年龄不足，要求 ≥ ${project.minAge}岁，当前 ${resolvedAge}岁`);
    }
  }

  if (project.maxAge !== null && project.maxAge !== undefined) {
    if (resolvedAge !== null && resolvedAge !== undefined && resolvedAge > project.maxAge) {
      reasons.push(`年龄超出限制，要求 ≤ ${project.maxAge}岁，当前 ${resolvedAge}岁`);
    }
  }

  return {
    accessible: reasons.length === 0,
    reasons,
    resolvedAge,
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
  getBirthdayFromIdCard,
  getAgeFromIdCard,
  checkProjectAccess,
};
