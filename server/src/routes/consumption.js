const express = require('express');
const router = express.Router();
const consumptionController = require('../controllers/consumptionController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.post('/', authMiddleware, roleMiddleware(['admin', 'operator', 'cashier']), consumptionController.createConsumption);
router.get('/', authMiddleware, consumptionController.getConsumptionRecords);
router.get('/my', authMiddleware, consumptionController.getMyConsumptions);
router.get('/:id', authMiddleware, consumptionController.getConsumptionDetail);
router.post('/:id/settle', authMiddleware, roleMiddleware(['admin', 'operator', 'cashier']), consumptionController.settleConsumption);
router.post('/settle/wristband', authMiddleware, roleMiddleware(['admin', 'operator', 'cashier']), consumptionController.settleByWristband);
router.post('/:id/refund', authMiddleware, roleMiddleware(['admin']), consumptionController.refundConsumption);

module.exports = router;
