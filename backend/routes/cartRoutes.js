// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

// All cart routes require customer authentication
router.use(authenticateToken('customer'));

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items/:id', cartController.updateCartItem);
router.delete('/items/:id', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
