const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/dashboard', authMiddleware, statisticsController.getDashboardStats);
router.get('/sales', authMiddleware, roleMiddleware(['admin', 'operator']), statisticsController.getSalesStatistics);
router.get('/ticket-types', authMiddleware, roleMiddleware(['admin', 'operator']), statisticsController.getTicketTypeStatistics);
router.get('/card-types', authMiddleware, roleMiddleware(['admin', 'operator']), statisticsController.getCardTypeStatistics);
router.get('/consumption-categories', authMiddleware, roleMiddleware(['admin', 'operator']), statisticsController.getConsumptionCategoryStatistics);
router.get('/expiring-cards', authMiddleware, roleMiddleware(['admin', 'operator']), statisticsController.getExpiringCards);

module.exports = router;
