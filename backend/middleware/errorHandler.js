// middleware/errorHandler.js

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message || err);

    // Malformed JSON body (express body-parser SyntaxError)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
    }

    // CORS rejection (thrown from corsOptions.origin in server.js)
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'Origin not allowed' });
    }

    // Multer file upload errors
    try {
        const multer = require('multer');
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: err.message });
        }
    } catch (_) { /* multer not installed */ }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Default error — hide internal details in production
    res.status(err.statusCode || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : (err.message || 'Internal server error')
    });
};

// 404 handler
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
};

module.exports = {
    errorHandler,
    notFound
};
