// app.js — Express app definition, no listen()/connectDB()/env-var enforcement.
// Split out from server.js so tests (supertest) can require the app without
// opening a real port or a real MongoDB connection.
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Trust reverse proxy for correct IP parsing (Required for Rate Limiting behind Docker/Nginx)
app.set('trust proxy', 1);

// Middleware
// Compression — must be first, before any response middleware
const compression = require('compression');
app.use(compression({ threshold: 1024 }));

// Security Headers
const helmet = require('helmet');
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Permissions-Policy — helmet ไม่ตั้งให้ (API ไม่ใช้ browser features ใดๆ)
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
});

// Cross-Origin Resource Sharing (CORS) - STRCITLY allow only the FRONTEND_URL
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests if desired,
        // but for strict browser security it's better to block or handle precisely).
        // Since we explicitly want FRONTEND_URL, let's enforce it.
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500, // Increased from 100 to 500 to accommodate legitimate browsing activity
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,   // RateLimit-* (draft standard)
    legacyHeaders: false     // ปิด X-RateLimit-* (ลด fingerprinting)
});
app.use(limiter);

// API responses ห้าม cache — มีข้อมูล auth/order/cart (OWASP: Cache-Control no-store)
// /uploads ไม่โดนเพราะ mount แยกด้วย maxAge 7d ด้านล่าง
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Body Parsers
app.use(express.json({
    limit: '10kb',
    verify: (req, _res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true }));

// Data Sanitization against NoSQL Injection
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
const hpp = require('hpp');
app.use(hpp());

app.use(require('./config/passport').initialize());

// Serve static files — 7 days cache for images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    maxAge: '7d',
    etag: true,
    lastModified: true,
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/pos', require('./routes/posRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/shipping-methods', require('./routes/shippingMethodRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/shopee', require('./routes/shopeeRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Public store stats (no auth required) — cached 5 minutes to avoid DB hit on every page load
let _publicStatsCache = null;
let _publicStatsTTL = 0;
app.get('/api/public-stats', async (req, res) => {
    try {
        const now = Date.now();
        if (_publicStatsCache && now < _publicStatsTTL) {
            return res.json({ success: true, data: _publicStatsCache });
        }
        const { Product, Customer } = require('./models');
        const [productCount, customerCount] = await Promise.all([
            Product.countDocuments({ isActive: true, isOnline: true }),
            Customer.countDocuments({})
        ]);
        _publicStatsCache = { productCount, customerCount };
        _publicStatsTTL = now + 5 * 60 * 1000;
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data: _publicStatsCache });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Health check
app.get('/api/status', async (req, res) => {
    const mongoose = require('mongoose');

    try {
        const dbStatus = mongoose.connection.readyState;
        const statusMap = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting'
        };

        if (dbStatus === 1) {
            res.status(200).json({
                status: 'Server Running',
                database: 'Connected',
            });
        } else {
            res.status(500).json({
                status: 'Server Running',
                database: statusMap[dbStatus] || 'Unknown'
            });
        }
    } catch (error) {
        console.error('DB Health Check Failed:', error.message);
        res.status(500).json({
            status: 'Server Running',
            database: 'Disconnected',
        });
    }
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
