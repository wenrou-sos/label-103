const express = require('express');
const router = express.Router();
const {
  getAllConfigs,
  getPointConfig,
  updateConfig,
  batchUpdateConfigs,
} = require('../controllers/systemConfigController');
const { auth, roles } = require('../middleware/auth');

router.get('/', auth, roles(['admin']), getAllConfigs);
router.get('/points', auth, getPointConfig);
router.put('/', auth, roles(['admin']), updateConfig);
router.put('/batch', auth, roles(['admin']), batchUpdateConfigs);

module.exports = router;
