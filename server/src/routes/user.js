const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getUsers);
router.get('/:id', authMiddleware, roleMiddleware(['admin']), userController.getUserDetail);
router.post('/', authMiddleware, roleMiddleware(['admin']), userController.createUser);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), userController.updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);
router.post('/:id/reset-password', authMiddleware, roleMiddleware(['admin']), userController.resetPassword);
router.put('/:id/status', authMiddleware, roleMiddleware(['admin']), userController.updateUserStatus);

module.exports = router;
