// controllers/authController.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, Customer } = require('../models');
const { isMailEnabled, sendPasswordResetEmail, sendVerificationEmail } = require('../utils/mailer');

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;        // 1 ชั่วโมง
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

// token ที่ส่งทางอีเมลเป็น random 32 bytes แต่ที่เก็บใน DB เป็น SHA-256 ของมัน
// (ไม่ต้อง bcrypt เพราะ token สุ่มเต็ม entropy อยู่แล้ว — brute force ไม่ได้ ต่างจากรหัสผ่านคน)
const createToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    return { token, hash: crypto.createHash('sha256').update(token).digest('hex') };
};
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/** ออก token ยืนยันอีเมลใหม่แล้วส่งเมล — ใช้ทั้งตอนสมัครและตอนกดขอลิงก์ใหม่ */
const issueVerificationEmail = async (customer) => {
    const { token, hash } = createToken();
    customer.emailVerificationTokenHash = hash;
    customer.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    await customer.save();
    return sendVerificationEmail({ to: customer.email, firstName: customer.firstName, token });
};

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

        // ยืนยันอีเมลแบบ soft — ส่งลิงก์ให้ แต่ไม่รอผลและไม่บล็อกการสมัคร
        // SMTP ล่มหรือยังไม่ได้ตั้งค่า ก็ต้องสมัครสำเร็จอยู่ดี
        if (isMailEnabled()) {
            issueVerificationEmail(customer).catch((err) =>
                console.error('[auth] verification email failed:', err.message)
            );
        }

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
                phone: customer.phone,
                emailVerified: customer.emailVerified,
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
                emailVerified: customer.emailVerified,
                profilePicture: customer.profilePicture,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    ขอลิงก์ตั้งรหัสผ่านใหม่
// @route   POST /api/auth/forgot-password
// @access  Public
// ตอบ 200 เสมอไม่ว่าจะมีบัญชีนั้นจริงหรือไม่ — ไม่งั้น endpoint นี้กลายเป็นเครื่องมือเช็คว่า
// อีเมลไหนเป็นลูกค้าร้านนี้บ้าง
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const genericResponse = {
            success: true,
            message: 'ถ้าอีเมลนี้มีบัญชีอยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว'
        };

        const customer = await Customer.findOne({ email });

        // บัญชี Google ไม่มีรหัสผ่านให้รีเซ็ต — เงียบไว้เหมือนกรณีไม่มีบัญชี
        // (หน้า login จะบอกให้ไปกดปุ่ม Google อยู่แล้วตอนพยายามล็อกอิน)
        if (!customer || !customer.passwordHash || !customer.isActive) {
            return res.json(genericResponse);
        }

        const { token, hash } = createToken();
        customer.passwordResetTokenHash = hash;
        customer.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
        await customer.save();

        await sendPasswordResetEmail({ to: customer.email, firstName: customer.firstName, token });

        res.json(genericResponse);
    } catch (error) {
        next(error);
    }
};

// @desc    ตั้งรหัสผ่านใหม่ด้วย token จากอีเมล
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        const customer = await Customer.findOne({
            passwordResetTokenHash: hashToken(token),
            passwordResetExpires: { $gt: new Date() }
        });

        if (!customer) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_RESET_TOKEN',
                message: 'ลิงก์ตั้งรหัสผ่านหมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่'
            });
        }

        const salt = await bcrypt.genSalt(10);
        customer.passwordHash = await bcrypt.hash(password, salt);
        // ใช้ได้ครั้งเดียว — เคลียร์ทิ้งทันที
        customer.passwordResetTokenHash = undefined;
        customer.passwordResetExpires = undefined;
        // กดลิงก์จากอีเมลได้ = เป็นเจ้าของอีเมลจริง ถือว่ายืนยันอีเมลไปในตัว
        customer.emailVerified = true;
        await customer.save();

        res.json({
            success: true,
            message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    ยืนยันอีเมลด้วย token จากอีเมล
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;

        const customer = await Customer.findOne({
            emailVerificationTokenHash: hashToken(token),
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!customer) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_VERIFICATION_TOKEN',
                message: 'ลิงก์ยืนยันอีเมลหมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่จากหน้าโปรไฟล์'
            });
        }

        customer.emailVerified = true;
        customer.emailVerificationTokenHash = undefined;
        customer.emailVerificationExpires = undefined;
        await customer.save();

        res.json({ success: true, message: 'ยืนยันอีเมลเรียบร้อยแล้ว' });
    } catch (error) {
        next(error);
    }
};

// @desc    ขอลิงก์ยืนยันอีเมลใหม่
// @route   POST /api/auth/resend-verification
// @access  Customer (ต้องล็อกอิน)
exports.resendVerification = async (req, res, next) => {
    try {
        const customer = req.customer;
        if (!customer) {
            return res.status(401).json({ success: false, message: 'Customer authentication required' });
        }
        if (customer.emailVerified) {
            return res.json({ success: true, message: 'อีเมลนี้ยืนยันแล้ว' });
        }
        if (!isMailEnabled()) {
            return res.status(503).json({
                success: false,
                code: 'MAIL_NOT_CONFIGURED',
                message: 'ระบบส่งอีเมลยังไม่พร้อมใช้งาน กรุณาติดต่อร้าน'
            });
        }

        await issueVerificationEmail(customer);

        res.json({ success: true, message: 'ส่งลิงก์ยืนยันอีเมลไปให้แล้ว กรุณาตรวจสอบกล่องจดหมาย' });
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
