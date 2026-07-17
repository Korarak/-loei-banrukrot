// middleware/validator.js
const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Validation rules for different endpoints
const validationRules = {
    // Auth validations
    register: [
        body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validate
    ],

    login: [
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],

    // Product validations
    createProduct: [
        body('productName').trim().notEmpty().withMessage('Product name is required'),
        body('variants').isArray({ min: 1 }).withMessage('At least one variant is required'),
        body('variants.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('discountPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
        validate
    ],

    // Bulk product validations
    bulkUpdateChannel: [
        body('productIds').isArray({ min: 1, max: 500 }).withMessage('productIds must be a non-empty array (max 500)'),
        body('productIds.*').isMongoId().withMessage('Invalid product ID'),
        body('isPos').optional().isBoolean().withMessage('isPos must be a boolean'),
        body('isOnline').optional().isBoolean().withMessage('isOnline must be a boolean'),
        body().custom(b => b.isPos !== undefined || b.isOnline !== undefined).withMessage('At least one of isPos/isOnline is required'),
        validate
    ],

    bulkUpdateCategory: [
        body('productIds').isArray({ min: 1, max: 500 }).withMessage('productIds must be a non-empty array (max 500)'),
        body('productIds.*').isMongoId().withMessage('Invalid product ID'),
        body('categoryId').isInt({ min: 1 }).withMessage('categoryId is required'),
        validate
    ],

    bulkDeleteProducts: [
        body('productIds').isArray({ min: 1, max: 500 }).withMessage('productIds must be a non-empty array (max 500)'),
        body('productIds.*').isMongoId().withMessage('Invalid product ID'),
        validate
    ],

    // Customer validations
    createCustomer: [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validate
    ],

    // Order validations
    createOrder: [
        body('shippingAddressId').isMongoId().withMessage('Invalid shipping address ID'),
        body('shippingMethodId').isMongoId().withMessage('Invalid shipping method ID'),
        body('itemIds').optional().isArray().withMessage('itemIds must be an array'),
        body('itemIds.*').isMongoId().withMessage('Invalid cart item ID'),
        validate
    ],

    // MongoDB ObjectId validation
    validateId: [
        param('id').isMongoId().withMessage('Invalid ID format'),
        validate
    ],

    // Chat validations
    sendChatMessage: [
        body('body').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Message must be at most 2000 characters'),
        body('attachments').optional().isArray({ max: 5 }).withMessage('At most 5 attachments'),
        body('attachments.*.url').if(body('attachments').exists()).isString().notEmpty().withMessage('Invalid attachment URL'),
        body().custom((value) => {
            const hasBody = typeof value.body === 'string' && value.body.trim().length > 0;
            const hasAttachments = Array.isArray(value.attachments) && value.attachments.length > 0;
            if (!hasBody && !hasAttachments) {
                throw new Error('Message must have text or at least one attachment');
            }
            return true;
        }),
        validate
    ],

    // Push notification validations
    subscribePush: [
        body('endpoint').isURL().withMessage('Invalid push subscription endpoint'),
        body('keys.p256dh').notEmpty().withMessage('Missing p256dh key'),
        body('keys.auth').notEmpty().withMessage('Missing auth key'),
        validate
    ]
};

module.exports = validationRules;
