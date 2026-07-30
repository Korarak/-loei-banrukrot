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

// เก็บเบอร์แบบตัวเลขล้วน — schema ยอมให้พิมพ์เว้นวรรค/ขีดได้ แต่ที่ save ต้องรูปแบบเดียวเสมอ
const normalizePhone = (phone) => (typeof phone === 'string' ? phone.replace(/[\s-]/g, '') : phone);

// @desc    ระบบยังเปิดให้สมัครบัญชีพนักงานคนแรก (bootstrap) อยู่หรือไม่
// @route   GET /api/auth/registration-status
// @access  Public
// หน้า (auth)/register และ (auth)/login เรียก endpoint นี้เพื่อไม่ให้โชว์ฟอร์ม/ลิงก์ที่กดไปแล้วเจอ 403 เสมอ
exports.registrationStatus = async (req, res, next) => {
    try {
        const userCount = await User.estimatedDocumentCount();
        res.json({
            success: true,
            data: { open: userCount === 0 }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Register new user (staff/owner)
// @route   POST /api/auth/register
// @access  Public — bootstrap only (works only while no user exists yet)
exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // เปิดรับสมัครเฉพาะตอนที่ระบบยังไม่มี user เลย (คนแรก = owner)
        // หลังจากนั้น owner ต้องเพิ่มพนักงานผ่าน POST /api/users เท่านั้น
        const userCount = await User.estimatedDocumentCount();
        if (userCount > 0) {
            return res.status(403).json({
                success: false,
                code: 'REGISTRATION_CLOSED',
                message: 'การสมัครสมาชิกพนักงานถูกปิด กรุณาให้เจ้าของร้านเพิ่มบัญชีผ่านหน้าจัดการผู้ใช้'
            });
        }

        // เช็คว่า email ซ้ำหรือไม่
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                code: 'EMAIL_EXISTS',
                message: 'อีเมลนี้ถูกใช้งานแล้ว'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // สร้าง user ใหม่ — คนแรกของระบบเป็น owner เสมอ ไม่รับ role จาก client
        const user = await User.create({
            username,
            email,
            passwordHash,
            role: 'owner'
        });

        // สร้าง token
        const token = generateToken(user._id, 'user');

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                _id: user._id,
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
                _id: user._id,
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

        // เช็คว่า email ซ้ำหรือไม่ — แยกเคส "เคยสมัครผ่าน Google" ออกมา เพราะบัญชีพวกนี้ไม่มีรหัสผ่าน
        // ให้ไปกดปุ่ม Google ไม่ใช่ไปหน้า login แบบกรอกรหัสผ่าน
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            const usesGoogle = !existingCustomer.passwordHash && existingCustomer.provider === 'google';
            return res.status(400).json({
                success: false,
                code: usesGoogle ? 'ACCOUNT_USES_GOOGLE' : 'EMAIL_EXISTS',
                message: usesGoogle
                    ? 'อีเมลนี้เคยสมัครผ่าน Google กรุณาเข้าสู่ระบบด้วย Google'
                    : 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ'
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
            phone: normalizePhone(phone)
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

        // ตรวจสอบว่า customer active หรือไม่
        if (!customer.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // บัญชีที่สมัครผ่าน Google ไม่มี passwordHash — ถ้าปล่อยไปถึง bcrypt.compare จะ throw กลายเป็น 500
        // ตอบให้ชัดว่าต้องเข้าสู่ระบบด้วย Google แทน
        if (!customer.passwordHash) {
            return res.status(400).json({
                success: false,
                code: 'ACCOUNT_USES_GOOGLE',
                message: 'บัญชีนี้สมัครผ่าน Google กรุณาเข้าสู่ระบบด้วยปุ่ม Google'
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
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
    try {
        if (!req.user?.isActive) {
            return res.redirect(`${frontendUrl}/customer-login?error=account_inactive`);
        }
        const token = generateToken(req.user._id, 'customer');
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google Callback Error:', error);
        res.redirect(`${frontendUrl}/customer-login?error=auth_failed`);
    }
};
