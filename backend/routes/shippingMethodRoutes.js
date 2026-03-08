const express = require('express');
const router = express.Router();
const {
    getShippingMethods,
    getAdminShippingMethods,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod
} = require('../controllers/shippingMethodController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.route('/')
    .get(getShippingMethods);

router.route('/admin')
    .get(authenticateToken('user'), requireRole('owner', 'staff'), getAdminShippingMethods)
    .post(authenticateToken('user'), requireRole('owner', 'staff'), createShippingMethod);

router.route('/admin/:id')
    .put(authenticateToken('user'), requireRole('owner', 'staff'), updateShippingMethod)
    .delete(authenticateToken('user'), requireRole('owner', 'staff'), deleteShippingMethod);

module.exports = router;
