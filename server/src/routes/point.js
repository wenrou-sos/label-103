const express = require('express');
const router = express.Router();
const {
  getPointRecords,
  getMyPointRecords,
  adjustPoints,
  getUserPointBalance,
} = require('../controllers/pointController');
const { auth, roles } = require('../middleware/auth');

router.get('/', auth, roles(['admin', 'operator']), getPointRecords);
router.get('/my', auth, getMyPointRecords);
router.get('/balance/:userId?', auth, getUserPointBalance);
router.post('/adjust', auth, roles(['admin']), adjustPoints);

module.exports = router;
