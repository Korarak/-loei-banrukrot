// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Customer } = require('../models');

// Generate JWT Token
const generateToken = (id, type = 'user') => {
    return jwt.sign({ id, type }, process.env.JWT_SECRET, {
        expiresIn: '7d' // Token หมดอายุใน 7 วัน
    });
};

// @desc    Register new user (staff/owner)
// @route   POST /api/auth/register
// @access  Public (แต่ควรจำกัดในการใช้งานจริง)
exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        // เช็คว่า email ซ้ำหรือไม่
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // สร้าง user ใหม่
        const user = await User.create({
            username,
            email,
            passwordHash,
            role: role || 'staff'
        });

        // สร้าง token
        const token = generateToken(user._id, 'user');

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user (staff/owner)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // หา user จาก email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // ตรวจสอบว่า user active หรือไม่
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // ตรวจสอบ password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // สร้าง token
        const token = generateToken(user._id, 'user');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Register new customer
// @route   POST /api/auth/register-customer
// @access  Public
exports.registerCustomer = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // เช็คว่า email ซ้ำหรือไม่
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // สร้าง customer ใหม่
        const customer = await Customer.create({
            firstName,
            lastName,
            email,
            passwordHash,
            phone
        });

        // สร้าง token
        const token = generateToken(customer._id, 'customer');

        res.status(201).json({
            success: true,
            message: 'Customer registered successfully',
            data: {
                _id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login customer
// @route   POST /api/auth/login-customer
// @access  Public
exports.loginCustomer = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // หา customer จาก email
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // ตรวจสอบ password
        const isMatch = await bcrypt.compare(password, customer.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // สร้าง token
        const token = generateToken(customer._id, 'customer');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                _id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Google Auth Callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res) => {
    try {
        const token = generateToken(req.user._id, 'customer');
        // Use first URL from comma-separated FRONTEND_URL (CORS uses all, redirect needs one)
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google Callback Error:', error);
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
        res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
};
