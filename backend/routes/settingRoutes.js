const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingController');
const { listBackups, triggerBackup } = require('../controllers/backupController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Check authentication and staff role
router.use(authenticateToken());
router.use(requireRole('owner', 'admin', 'staff'));

router.route('/')
    .get(getSettings);

router.route('/:key')
    .put(updateSetting);

// Backup management
router.get('/backups', listBackups);
router.post('/backups/run', triggerBackup);

module.exports = router;
