const express = require('express');
const router = express.Router();
const {
    getSalesReport,
    getProductReport,
    getCustomerReport,
    exportCSV
} = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken());
router.use(requireRole('owner', 'admin', 'staff'));

router.get('/sales', getSalesReport);
router.get('/products', getProductReport);
router.get('/customers', getCustomerReport);
router.get('/export/csv', exportCSV);

module.exports = router;
