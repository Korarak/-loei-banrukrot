// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const {
    getStockMovements,
    getLowStockAlerts,
    getInventorySummary,
    receiveStock,
    adjustStock
} = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const guard = [authenticateToken(), requireRole('owner', 'staff')];

router.get('/movements', ...guard, getStockMovements);
router.get('/low-stock', ...guard, getLowStockAlerts);
router.get('/summary', ...guard, getInventorySummary);
router.post('/receive', ...guard, receiveStock);
router.post('/adjust', ...guard, adjustStock);

module.exports = router;
