// routes/shopeeRoutes.js
const express = require('express');
const router = express.Router();
const {
    getStatus,
    getMapping,
    updateMapping,
    removeMapping,
    webhookHandler
} = require('../controllers/shopeeController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const guard = [authenticateToken(), requireRole('owner', 'staff')];

// No auth — Shopee calls this endpoint directly (verified via HMAC signature)
router.post('/webhook', webhookHandler);

// Admin-only
router.get('/status', ...guard, getStatus);
router.get('/mapping', ...guard, getMapping);
router.patch('/mapping/:variantId', ...guard, updateMapping);
router.delete('/mapping/:variantId', ...guard, removeMapping);

module.exports = router;
