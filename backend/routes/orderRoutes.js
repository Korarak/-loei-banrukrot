// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
    getOrderById,
    updateOrderStatus,
    createOrderFromCart,
    getCustomerOrders,
    getAllOrders,
    uploadPaymentSlip,
    verifyPayment,
    getOrderQRCode,
    cancelOrderByCustomer
} = require('../controllers/orderController');
const { authenticateToken, requireRole, checkCustomerAccess } = require('../middleware/auth');
const validator = require('../middleware/validator');
const upload = require('../middleware/upload');

// Customer routes
router.post(
    '/',
    authenticateToken('customer'),
    validator.createOrder,
    createOrderFromCart
);

router.get(
    '/',
    authenticateToken('customer'),
    getCustomerOrders
);

router.get(
    '/:id',
    authenticateToken(),
    getOrderById
);

// Customer cancel — only allowed when pending and no slip uploaded
router.post(
    '/:id/cancel',
    authenticateToken('customer'),
    cancelOrderByCustomer
);

// Staff/Owner routes
router.get(
    '/all/list',
    authenticateToken(),
    requireRole('owner', 'staff'),
    getAllOrders
);

router.patch(
    '/:id/status',
    authenticateToken(),
    requireRole('owner', 'staff'),
    validator.validateId,
    updateOrderStatus
);

router.route('/:id/slip')
    .post(authenticateToken(), upload.single('slip'), uploadPaymentSlip);

router.route('/:id/verify-payment')
    .post(authenticateToken(), requireRole('owner', 'admin', 'staff'), verifyPayment);

router.get(
    '/:id/qrcode',
    authenticateToken(),
    getOrderQRCode
);

module.exports = router;
