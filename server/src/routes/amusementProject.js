const express = require('express');
const router = express.Router();
const amusementProjectController = require('../controllers/amusementProjectController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, amusementProjectController.getAmusementProjects);
router.get('/active', authMiddleware, amusementProjectController.getActiveAmusementProjects);
router.get('/check-access', authMiddleware, amusementProjectController.checkAllAccess);
router.get('/:id', authMiddleware, amusementProjectController.getAmusementProjectDetail);
router.get('/:id/check-access', authMiddleware, amusementProjectController.checkAccess);
router.post('/', authMiddleware, roleMiddleware(['admin']), amusementProjectController.createAmusementProject);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), amusementProjectController.updateAmusementProject);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), amusementProjectController.deleteAmusementProject);

module.exports = router;
