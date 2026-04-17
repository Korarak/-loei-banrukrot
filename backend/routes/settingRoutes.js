const express = require('express');
const router = express.Router();
const { getSettings, getPublicSettings, updateSetting } = require('../controllers/settingController');
const { listBackups, triggerBackup } = require('../controllers/backupController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public — only whitelisted keys (bank info etc.)
router.get('/public', getPublicSettings);

// Admin-only below
router.use(authenticateToken());
router.use(requireRole('owner', 'admin', 'staff'));

router.get('/', getSettings);
router.put('/:key', updateSetting);

// Backup management
router.get('/backups', listBackups);
router.post('/backups/run', triggerBackup);

module.exports = router;
