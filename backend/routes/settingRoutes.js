const express = require('express');
const router = express.Router();
const { getSettings, getPublicSettings, updateSetting } = require('../controllers/settingController');
const { listBackups, triggerBackup, downloadBackup, downloadUploads } = require('../controllers/backupController');
const { truncateOrders, truncateProducts, truncateCategories, truncateCustomers, truncateAll } = require('../controllers/resetController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public — only whitelisted keys (bank info etc.)
router.get('/public', getPublicSettings);

// Admin-only below
router.use(authenticateToken('user'));
router.use(requireRole('owner', 'admin', 'staff'));

router.get('/', getSettings);
router.put('/:key', updateSetting);

// Backup management
router.get('/backups', listBackups);
router.post('/backups/run', triggerBackup);
router.get('/backups/:filename/download', downloadBackup);
router.get('/uploads/download', downloadUploads);

// Destructive reset — owner only
router.delete('/reset/orders', requireRole('owner'), truncateOrders);
router.delete('/reset/products', requireRole('owner'), truncateProducts);
router.delete('/reset/categories', requireRole('owner'), truncateCategories);
router.delete('/reset/customers', requireRole('owner'), truncateCustomers);
router.delete('/reset/all', requireRole('owner'), truncateAll);

module.exports = router;
