// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User, Customer, Conversation } = require('../models');

// Core token verification, usable outside of an Express request (e.g. a Socket.io
// handshake) — given a raw token string, returns { ok: true, type, principal }
// or { ok: false, status, message }. authenticateToken() below is a thin Express
// wrapper around this so both REST and sockets share one auth code path.
const verifyTokenAndLoadUser = async (token, expectedType) => {
    if (!token) {
        return { ok: false, status: 401, message: 'กรุณาเข้าสู่ระบบ' };
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return { ok: false, status: 403, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' };
    }

    // Reject tokens whose type doesn't match the route's requirement
    if (expectedType && decoded.type !== expectedType) {
        return { ok: false, status: 403, message: 'ไม่มีสิทธิ์เข้าถึง' };
    }

    if (decoded.type === 'user') {
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return { ok: false, status: 403, message: 'ไม่พบบัญชีผู้ใช้ หรือบัญชีถูกระงับ' };
        }
        return { ok: true, type: 'user', principal: user };
    }

    if (decoded.type === 'customer') {
        const customer = await Customer.findById(decoded.id);
        if (!customer || !customer.isActive) {
            return { ok: false, status: 403, message: 'ไม่พบข้อมูลลูกค้า หรือบัญชีถูกระงับ' };
        }
        return { ok: true, type: 'customer', principal: customer };
    }

    return { ok: false, status: 403, message: 'ไม่มีสิทธิ์เข้าถึง' };
};

// Middleware สำหรับตรวจสอบ JWT Token
// expectedType: 'user' | 'customer' | undefined (undefined = allow both)
const authenticateToken = (expectedType) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            const result = await verifyTokenAndLoadUser(token, expectedType);
            if (!result.ok) {
                return res.status(result.status).json({
                    success: false,
                    message: result.message
                });
            }

            if (result.type === 'user') {
                req.user = result.principal;
            } else if (result.type === 'customer') {
                req.customer = result.principal;
            }

            next();
        } catch (error) {
            console.error('Auth Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                error: error.message
            });
        }
    };
};

// Middleware สำหรับตรวจสอบ role (owner/staff)
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Middleware to check if user is admin/staff OR the customer themselves
const checkCustomerAccess = (req, res, next) => {
    // console.log('CheckCustomerAccess:', {
    //     userRole: req.user?.role,
    //     customerId: req.customer?._id,
    //     paramsId: req.params.id
    // });

    // Allow if admin/staff
    if (req.user && ['owner', 'admin', 'staff'].includes(req.user.role)) {
        return next();
    }

    // Allow if it's the customer accessing their own data
    // req.params.id should match customer._id
    if (req.customer && req.params.id && req.customer._id.toString() === req.params.id) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
    });
};

// Middleware to check if staff OR the owning customer can access a conversation
// (keyed off conversation ownership, not req.params.id being the customer id
// directly, unlike checkCustomerAccess above).
const checkConversationAccess = async (req, res, next) => {
    if (req.user && ['owner', 'staff'].includes(req.user.role)) {
        return next();
    }

    if (req.customer) {
        const conversation = await Conversation.findById(req.params.id);
        if (conversation && conversation.customerId.toString() === req.customer._id.toString()) {
            return next();
        }
    }

    return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
    });
};

module.exports = {
    verifyTokenAndLoadUser,
    authenticateToken,
    requireRole,
    checkCustomerAccess,
    checkConversationAccess
};
