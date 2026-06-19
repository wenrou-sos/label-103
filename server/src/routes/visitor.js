const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/current', visitorController.getCurrentVisitorCount);
router.get('/records', authMiddleware, roleMiddleware(['admin', 'operator']), visitorController.getVisitorRecords);
router.get('/today', authMiddleware, roleMiddleware(['admin', 'operator']), visitorController.getTodayStatistics);
router.get('/hourly-trend', authMiddleware, roleMiddleware(['admin', 'operator']), visitorController.getHourlyTrend);
router.get('/daily-trend', authMiddleware, roleMiddleware(['admin', 'operator']), visitorController.getDailyTrend);
router.post('/:id/exit', authMiddleware, roleMiddleware(['admin', 'operator']), visitorController.visitorExit);

module.exports = router;
