const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/', seasonController.getSeasonRules);
router.get('/current', seasonController.getCurrentSeason);
router.post('/', authMiddleware, roleMiddleware(['admin']), seasonController.createSeasonRule);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), seasonController.updateSeasonRule);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), seasonController.deleteSeasonRule);

module.exports = router;
