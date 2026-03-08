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
        validate
    ],

    // MongoDB ObjectId validation
    validateId: [
        param('id').isMongoId().withMessage('Invalid ID format'),
        validate
    ]
};

module.exports = validationRules;
