// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User, Customer } = require('../models');

// Middleware สำหรับตรวจสอบ JWT Token
// expectedType: 'user' | 'customer' | undefined (undefined = allow both)
const authenticateToken = (expectedType) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'กรุณาเข้าสู่ระบบ'
                });
            }

            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
                    });
                }

                // Reject tokens whose type doesn't match the route's requirement
                if (expectedType && decoded.type !== expectedType) {
                    return res.status(403).json({
                        success: false,
                        message: 'ไม่มีสิทธิ์เข้าถึง'
                    });
                }

                if (decoded.type === 'user') {
                    const user = await User.findById(decoded.id);
                    if (!user || !user.isActive) {
                        return res.status(403).json({
                            success: false,
                            message: 'ไม่พบบัญชีผู้ใช้ หรือบัญชีถูกระงับ'
                        });
                    }
                    req.user = user;
                } else if (decoded.type === 'customer') {
                    const customer = await Customer.findById(decoded.id);
                    if (!customer || !customer.isActive) {
                        return res.status(403).json({
                            success: false,
                            message: 'ไม่พบข้อมูลลูกค้า หรือบัญชีถูกระงับ'
                        });
                    }
                    req.customer = customer;
                }

                next();
            });
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

module.exports = {
    authenticateToken,
    requireRole,
    checkCustomerAccess
};
