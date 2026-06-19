const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, roleMiddleware(['admin']), auditController.getAuditLogs);
router.get('/modules', authMiddleware, roleMiddleware(['admin']), auditController.getModules);
router.get('/actions', authMiddleware, roleMiddleware(['admin']), auditController.getActions);
router.get('/:id', authMiddleware, roleMiddleware(['admin']), auditController.getAuditLogDetail);

module.exports = router;
