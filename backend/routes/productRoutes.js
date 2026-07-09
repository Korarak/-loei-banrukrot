// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validator = require('../middleware/validator');
const uploadCsv = require('../middleware/uploadCsv');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/popular', productController.getPopularProducts);

// Bulk/export routes — must precede '/:id' (static segment vs param route)
router.get(
    '/export/csv',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    productController.exportProductsCSV
);

router.get('/:id', validator.validateId, productController.getProductById);

// Protected routes (staff/owner)
router.post(
    '/',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.createProduct,
    productController.createProduct
);

router.post(
    '/import/csv',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    uploadCsv.single('file'),
    productController.importProductsCSV
);

router.patch(
    '/bulk-channel',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.bulkUpdateChannel,
    productController.bulkUpdateChannel
);

router.patch(
    '/bulk-category',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.bulkUpdateCategory,
    productController.bulkUpdateCategory
);

// bulk-delete must precede '/:id' (static segment vs param route)
router.delete(
    '/bulk-delete',
    authenticateToken('user'),
    requireRole('owner'),
    validator.bulkDeleteProducts,
    productController.bulkDeleteProducts
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

// reorder must be before /:imageId to prevent Express from capturing "reorder" as imageId
router.put(
    '/:id/images/reorder',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    productController.reorderProductImages
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

module.exports = router;
