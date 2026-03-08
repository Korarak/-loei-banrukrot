const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Check authentication and staff role
router.use(authenticateToken());
router.use(requireRole('owner', 'admin', 'staff'));

router.route('/')
    .get(getSettings);

router.route('/:key')
    .put(updateSetting);

module.exports = router;
