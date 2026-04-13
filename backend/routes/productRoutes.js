// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validator = require('../middleware/validator');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/popular', productController.getPopularProducts);
router.get('/:id', validator.validateId, productController.getProductById);

// Protected routes (staff/owner)
router.post(
    '/',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.createProduct,
    productController.createProduct
);

router.put(
    '/:id',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    productController.updateProduct
);

router.delete(
    '/:id',
    authenticateToken('user'),
    requireRole('owner'),
    validator.validateId,
    productController.deleteProduct
);

router.patch(
    '/variants/:id/stock',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    productController.updateVariantStock
);

// Image management routes
router.post(
    '/:id/images',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    productController.addProductImage
);

router.put(
    '/:id/images/:imageId',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    productController.updateProductImage
);

router.delete(
    '/:id/images/:imageId',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    productController.deleteProductImage
);

router.put(
    '/:id/images/reorder',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    productController.reorderProductImages
);

module.exports = router;
