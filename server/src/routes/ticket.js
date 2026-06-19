const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/types', ticketController.getTicketTypes);
router.get('/types/all', authMiddleware, roleMiddleware(['admin', 'operator']), ticketController.getAllTicketTypes);
router.post('/types', authMiddleware, roleMiddleware(['admin']), ticketController.createTicketType);
router.put('/types/:id', authMiddleware, roleMiddleware(['admin']), ticketController.updateTicketType);
router.delete('/types/:id', authMiddleware, roleMiddleware(['admin']), ticketController.deleteTicketType);

router.post('/calculate', ticketController.calculatePrice);
router.post('/orders', authMiddleware, ticketController.createTicketOrder);
router.get('/orders', authMiddleware, ticketController.getTicketOrders);
router.get('/orders/:id', authMiddleware, ticketController.getTicketOrderDetail);
router.post('/verify', authMiddleware, roleMiddleware(['admin', 'operator']), ticketController.verifyTicket);
router.post('/orders/:id/refund', authMiddleware, roleMiddleware(['admin', 'operator']), ticketController.refundTicket);
router.post('/orders/batch-refund', authMiddleware, roleMiddleware(['admin', 'operator']), ticketController.batchRefundTickets);

module.exports = router;
