// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validator = require('../middleware/validator');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', validator.validateId, categoryController.getCategoryById);

// Protected routes (staff/owner)
// Note: /reorder must be placed before /:id to avoid interpreting "reorder" as an ID
router.put(
    '/reorder',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    categoryController.reorderCategories
);
router.post(
    '/',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    categoryController.createCategory
);

router.put(
    '/:id',
    authenticateToken('user'),
    requireRole('owner', 'staff'),
    validator.validateId,
    categoryController.updateCategory
);

router.delete(
    '/:id',
    authenticateToken('user'),
    requireRole('owner'),
    validator.validateId,
    categoryController.deleteCategory
);

module.exports = router;
