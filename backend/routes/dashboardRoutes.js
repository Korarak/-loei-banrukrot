const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getDailyRevenue,
    getRevenueComparison,
    getHourlySales,
    getCustomerInsights,
    getTopCategories
} = require('../controllers/dashboardController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken());
router.use(requireRole('owner', 'admin', 'staff'));

router.get('/summary', getDashboardSummary);
router.get('/daily-revenue', getDailyRevenue);
router.get('/revenue-comparison', getRevenueComparison);
router.get('/hourly-sales', getHourlySales);
router.get('/customer-insights', getCustomerInsights);
router.get('/top-categories', getTopCategories);

module.exports = router;
