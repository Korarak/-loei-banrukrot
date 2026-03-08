// routes/posRoutes.js
const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All POS routes require staff/owner authentication
router.use(authenticateToken('user'));
router.use(requireRole('owner', 'staff'));

router.post('/sales', posController.createPOSSale);
router.get('/sales', posController.getPOSSales);
router.get('/sales/:saleReference', posController.getSaleReceipt);

module.exports = router;
