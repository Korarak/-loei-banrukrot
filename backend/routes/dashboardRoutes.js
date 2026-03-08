const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken());
router.use(requireRole('owner', 'admin', 'staff'));

router.get('/summary', getDashboardSummary);

module.exports = router;
