const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const ticketRoutes = require('./ticket');
const annualCardRoutes = require('./annualCard');
const consumptionRoutes = require('./consumption');
const visitorRoutes = require('./visitor');
const statisticsRoutes = require('./statistics');
const userRoutes = require('./user');
const seasonRoutes = require('./season');
const auditRoutes = require('./audit');
const amusementProjectRoutes = require('./amusementProject');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '游乐园票务与会员管理平台 API 服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/annual-cards', annualCardRoutes);
router.use('/consumptions', consumptionRoutes);
router.use('/visitors', visitorRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/users', userRoutes);
router.use('/seasons', seasonRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/amusement-projects', amusementProjectRoutes);

module.exports = router;
