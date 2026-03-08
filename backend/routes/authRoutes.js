// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validator = require('../middleware/validator');

const rateLimit = require('express-rate-limit');

// Strict limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login/register requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// User (Staff/Owner) routes
router.use('/register', authLimiter);
router.use('/login', authLimiter);
router.use('/register-customer', authLimiter);
router.use('/login-customer', authLimiter);

const validateRequest = require('../middleware/validateRequest');
const schemas = require('../models/validationSchemas');

// User (Staff/Owner) routes
router.post('/register', validateRequest(schemas.registerSchema), authController.registerUser);
router.post('/login', validateRequest(schemas.loginSchema), authController.loginUser);

// Customer routes
router.post('/register-customer', validateRequest(schemas.createCustomerSchema), authController.registerCustomer);
router.post('/login-customer', validateRequest(schemas.loginSchema), authController.loginCustomer);

// Google Auth
router.get('/google', require('passport').authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    require('passport').authenticate('google', { failureRedirect: '/login?error=failed', session: false }),
    authController.googleCallback
);

module.exports = router;
