const express = require('express');
const router = express.Router();
const annualCardController = require('../controllers/annualCardController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/types', annualCardController.getCardTypes);
router.get('/types/all', authMiddleware, roleMiddleware(['admin', 'operator']), annualCardController.getAllCardTypes);
router.post('/types', authMiddleware, roleMiddleware(['admin']), annualCardController.createCardType);
router.put('/types/:id', authMiddleware, roleMiddleware(['admin']), annualCardController.updateCardType);
router.delete('/types/:id', authMiddleware, roleMiddleware(['admin']), annualCardController.deleteCardType);

router.post('/purchase', authMiddleware, annualCardController.purchaseAnnualCard);
router.get('/', authMiddleware, annualCardController.getAnnualCards);
router.get('/my', authMiddleware, annualCardController.getMyCards);
router.get('/:id', authMiddleware, annualCardController.getAnnualCardDetail);
router.post('/verify', authMiddleware, roleMiddleware(['admin', 'operator']), annualCardController.verifyAnnualCard);
router.post('/:id/recharge', authMiddleware, annualCardController.rechargeAnnualCard);
router.post('/:id/bind-wristband', authMiddleware, roleMiddleware(['admin', 'operator']), annualCardController.bindWristband);

router.get('/renewal/packages', authMiddleware, annualCardController.getRenewalPackages);
router.post('/renewal/packages', authMiddleware, roleMiddleware(['admin']), annualCardController.createRenewalPackage);
router.put('/renewal/packages/:id', authMiddleware, roleMiddleware(['admin']), annualCardController.updateRenewalPackage);
router.delete('/renewal/packages/:id', authMiddleware, roleMiddleware(['admin']), annualCardController.deleteRenewalPackage);
router.post('/:id/renewal', authMiddleware, annualCardController.renewalAnnualCard);

module.exports = router;
