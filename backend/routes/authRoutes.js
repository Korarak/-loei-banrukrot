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
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    // ทุก route ด้านล่างใช้ limiter ตัวเดียวกัน = แชร์โควตา 20 ครั้งร่วมกัน
    // ซึ่งทำให้ integration test ชุด auth ยิงทะลุโควตาแล้วได้ 429 แทนผลจริง
    skip: () => process.env.NODE_ENV === 'test'
});

// ทุก route ที่ "ทำให้มีอีเมลถูกส่งออกไป" ต้องคุมแยกและแน่นกว่า login เพราะคนร้ายไม่ได้
// พยายามเข้าบัญชี แต่ยิงเพื่อถล่มกล่องจดหมายคนอื่นและเผาโควตา free tier ของร้าน
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
    max: 5,
    message: 'ขอลิงก์ถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',
    skip: () => process.env.NODE_ENV === 'test'
});

// User (Staff/Owner) routes
router.use('/register', authLimiter);
router.use('/login', authLimiter);
router.use('/register-customer', authLimiter);
router.use('/login-customer', authLimiter);
router.use('/forgot-password', emailLimiter);
router.use('/resend-verification', emailLimiter);
router.use('/reset-password', authLimiter);
router.use('/verify-email', authLimiter);

const validateRequest = require('../middleware/validateRequest');
const schemas = require('../models/validationSchemas');

// บอกว่ายังเปิดสมัครบัญชีพนักงานคนแรกอยู่ไหม เพื่อให้ frontend ไม่โชว์ฟอร์มที่กดไปแล้วเจอ 403 เสมอ
router.get('/registration-status', authController.registrationStatus);

// User (Staff/Owner) routes
router.post('/register', validateRequest(schemas.registerSchema), authController.registerUser);
router.post('/login', validateRequest(schemas.loginSchema), authController.loginUser);

// Customer routes
router.post('/register-customer', validateRequest(schemas.createCustomerSchema), authController.registerCustomer);
router.post('/login-customer', validateRequest(schemas.loginSchema), authController.loginCustomer);

// Password reset + email verification (customers)
const { authenticateToken } = require('../middleware/auth');
router.post('/forgot-password', validateRequest(schemas.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(schemas.resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validateRequest(schemas.emailTokenSchema), authController.verifyEmail);
router.post('/resend-verification', authenticateToken('customer'), authController.resendVerification);

// Google Auth — only registered when credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const passport = require('passport');
    router.get('/google', authLimiter, passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
    router.get('/google/callback',
        authLimiter,
        passport.authenticate('google', { failureRedirect: '/login?error=failed', session: false }),
        authController.googleCallback
    );
} else {
    router.get('/google', (req, res) => res.status(503).json({ success: false, message: 'Google OAuth is not configured' }));
    router.get('/google/callback', (req, res) => res.status(503).json({ success: false, message: 'Google OAuth is not configured' }));
}

module.exports = router;
